const isLocalHost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const PRODUCT_API_URL = isLocalHost ? "http://localhost:5001" : "";
const QUOTE_API_URL = isLocalHost ? "http://localhost:5002" : "";
const ADMIN_API_URL = isLocalHost ? "http://localhost:5003" : "";
const AI_API_URL = isLocalHost ? "http://localhost:5004" : "";
const DEFAULT_PRODUCTS = [
  {
    id: "dock-8x16",
    name: "8 x 16 Aluminum Dock Section",
    category: "Docks",
    price: 3295,
    description: "Lightweight modular section with decking, side rails, and adjustable legs.",
    available: true
  },
  {
    id: "dock-4x10",
    name: "4 x 10 Shoreline Dock Extension",
    category: "Docks",
    price: 1795,
    description: "Adds reach for changing water levels or wider mooring space.",
    available: true
  },
  {
    id: "ramp-4x12",
    name: "4 x 12 Hinged Access Ramp",
    category: "Ramps",
    price: 1425,
    description: "Stable transition from bank to dock with seasonal hinge hardware.",
    available: true
  },
  {
    id: "ramp-4x20",
    name: "4 x 20 Long Access Ramp",
    category: "Ramps",
    price: 2295,
    description: "Extra length for shallow banks, uneven shorelines, and lower grades.",
    available: true
  },
  {
    id: "bench-kit",
    name: "Dock Bench Kit",
    category: "Accessories",
    price: 395,
    description: "Bolt-on bench with aluminum brackets and weather-resistant seating.",
    available: true
  },
  {
    id: "ladder",
    name: "Flip-Up Swim Ladder",
    category: "Accessories",
    price: 325,
    description: "Corrosion-resistant ladder that lifts out of the water when not in use.",
    available: true
  },
  {
    id: "bumpers",
    name: "Boat Bumper Package",
    category: "Accessories",
    price: 185,
    description: "Protective edge bumpers and corner guards for everyday docking.",
    available: true
  },
  {
    id: "wheel-kit",
    name: "Seasonal Wheel Kit",
    category: "Accessories",
    price: 640,
    description: "Helps roll dock sections in and out during spring setup and fall removal.",
    available: false
  }
];

const state = {
  products: loadProducts(),
  quote: loadQuote(),
  quoteRequests: [],
  admin: {
    token: null,
    email: null,
    role: null
  },
  activeFilter: "all"
};

const productGrid = document.querySelector("#productGrid");
const quoteItems = document.querySelector("#quoteItems");
const quoteTotal = document.querySelector("#quoteTotal");
const quoteForm = document.querySelector("#quoteForm");
const formMessage = document.querySelector("#formMessage");
const adminLoginForm = document.querySelector("#adminLoginForm");
const adminSignOut = document.querySelector("#adminSignOut");
const adminSessionLabel = document.querySelector("#adminSessionLabel");
const adminAuthMessage = document.querySelector("#adminAuthMessage");
const adminForm = document.querySelector("#adminForm");
const adminTable = document.querySelector("#adminTable");
const adminQuotes = document.querySelector("#adminQuotes");
const aiForm = document.querySelector("#aiForm");
const aiPrompt = document.querySelector("#aiPrompt");
const aiSubmit = document.querySelector("#aiSubmit");
const aiResponse = document.querySelector("#aiResponse");
const aiWidget = document.querySelector("#aiWidget");

function loadProducts() {
  const saved = localStorage.getItem("gerrysProducts");
  return saved ? JSON.parse(saved) : DEFAULT_PRODUCTS;
}

function saveProducts() {
  localStorage.setItem("gerrysProducts", JSON.stringify(state.products));
}

async function fetchProductsFromApi() {
  try {
    const response = await fetch(`${PRODUCT_API_URL}/products`);
    if (!response.ok) throw new Error("Products request failed");
    const products = await response.json();

    state.products = products.map(product => ({
      description: "Available for Gerry's Docks quote requests.",
      ...product,
      id: String(product.id)
    }));

    saveProducts();
    renderAll();
    console.log("Products loaded from backend API");
    return true;
  } catch (error) {
    console.warn("Using local product data because the backend API is not available.", error);
    return false;
  }
}

function loadQuote() {
  const saved = localStorage.getItem("gerrysQuote");
  return saved ? JSON.parse(saved) : {};
}

function saveQuote() {
  localStorage.setItem("gerrysQuote", JSON.stringify(state.quote));
}

function currency(amount) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0
  }).format(amount);
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = value._seconds
    ? new Date(value._seconds * 1000)
    : new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

let firebaseAuth = null;

function isFirebaseConfigReady() {
  return Boolean(
    window.firebase &&
    window.firebaseConfig &&
    window.firebaseConfig.apiKey &&
    !window.firebaseConfig.apiKey.startsWith("PASTE_") &&
    window.firebaseConfig.appId &&
    !window.firebaseConfig.appId.startsWith("PASTE_")
  );
}

function setAdminToolsEnabled(enabled) {
  adminForm.querySelectorAll("input, select, textarea, button").forEach(control => {
    control.disabled = !enabled;
  });

  document.querySelector("#resetProducts").disabled = !enabled;
  adminForm.classList.toggle("admin-locked", !enabled);
  adminTable.classList.toggle("admin-locked", !enabled);
  adminQuotes.classList.toggle("admin-locked", !enabled);
}

function renderAdminAuth() {
  const signedIn = Boolean(state.admin.token);

  adminSessionLabel.textContent = signedIn
    ? `Signed in as ${state.admin.email}`
    : "Admin not signed in";

  adminLoginForm.hidden = signedIn;
  adminSignOut.hidden = !signedIn;
  setAdminToolsEnabled(signedIn);
}

async function getAdminHeaders() {
  if (!state.admin.token) {
    adminAuthMessage.textContent = "Sign in as an admin before using Marty Admin tools.";
    throw new Error("Admin sign-in required");
  }

  return {
    Authorization: `Bearer ${state.admin.token}`
  };
}

async function verifyAdminSession(user) {
  const idToken = await user.getIdToken();
  const response = await fetch(`${ADMIN_API_URL}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken })
  });

  const responseText = await response.text();
  let responseData = null;

  try {
    responseData = responseText ? JSON.parse(responseText) : null;
  } catch (error) {
    throw new Error(responseText || "Admin login failed");
  }

  if (!response.ok) {
    throw new Error(responseData?.error || "Admin login failed");
  }

  const session = responseData;
  state.admin = {
    token: session.token,
    email: session.admin.email,
    role: session.admin.role
  };

  adminAuthMessage.textContent = "Admin login verified.";
  renderAdminAuth();
  fetchQuoteRequestsFromApi();
}

function initializeFirebaseAuth() {
  if (!isFirebaseConfigReady()) {
    adminAuthMessage.textContent = "Paste the Firebase web app config into firebase-config.js to enable admin login.";
    renderAdminAuth();
    return;
  }

  firebase.initializeApp(window.firebaseConfig);
  firebaseAuth = firebase.auth();

  firebaseAuth.onAuthStateChanged(async user => {
    if (!user) {
      state.admin = { token: null, email: null, role: null };
      state.quoteRequests = [];
      renderAdminAuth();
      renderAdminQuotes();
      return;
    }

    try {
      await verifyAdminSession(user);
    } catch (error) {
      state.admin = { token: null, email: null, role: null };
      adminAuthMessage.textContent = error.message;
      renderAdminAuth();
      firebaseAuth.signOut();
    }
  });
}
function renderProducts() {
  const products = state.products.filter(
    product => state.activeFilter === "all" || product.category === state.activeFilter
  );

  productGrid.innerHTML = products
    .map(product => {
      const selected = state.quote[product.id] || 0;
      const disabled = product.available ? "" : "disabled";
      const buttonLabel = selected > 0 ? `Added (${selected})` : "Add to quote";
      return `
        <article class="product-card ${product.available ? "" : "unavailable"}">
          <div>
            <div class="product-top">
              <span class="category-badge">${product.category}</span>
              <span class="price">${currency(product.price)}</span>
            </div>
            <h3>${product.name}</h3>
            <p>${product.description}</p>
          </div>
          <button class="button ${selected > 0 ? "secondary" : "primary"}" data-add="${product.id}" type="button" ${disabled}>
            ${product.available ? buttonLabel : "Unavailable"}
          </button>
        </article>
      `;
    })
    .join("");
}

function renderQuote() {
  const rows = Object.entries(state.quote)
    .map(([id, quantity]) => {
      const product = state.products.find(item => item.id === id);
      if (!product) return "";
      return `
        <div class="quote-row">
          <div>
            <strong>${product.name}</strong>
            <div>${currency(product.price)} each</div>
          </div>
          <div class="qty-control" aria-label="Quantity controls for ${product.name}">
            <button class="icon-button" data-decrease="${product.id}" type="button" aria-label="Decrease ${product.name}">-</button>
            <strong>${quantity}</strong>
            <button class="icon-button" data-increase="${product.id}" type="button" aria-label="Increase ${product.name}">+</button>
          </div>
          <strong>${currency(product.price * quantity)}</strong>
        </div>
      `;
    })
    .join("");

  quoteItems.innerHTML = rows || `<p class="fine-print">No items selected yet. Add products from the catalog to build a quote checklist.</p>`;
  quoteTotal.textContent = currency(getQuoteTotal());
}

function getQuoteTotal() {
  return Object.entries(state.quote).reduce((total, [id, quantity]) => {
    const product = state.products.find(item => item.id === id);
    return product ? total + product.price * quantity : total;
  }, 0);
}

function renderAdmin() {
  adminTable.innerHTML = state.products
    .map(product => `
      <tr>
        <td><strong>${product.name}</strong></td>
        <td>${product.category}</td>
        <td>${currency(product.price)}</td>
        <td>${product.available ? "Available" : "Paused"}</td>
        <td>
          <div class="table-actions">
            <button class="icon-button" data-edit="${product.id}" type="button" aria-label="Edit ${product.name}" title="Edit">&#9998;</button>
            <button class="icon-button" data-remove="${product.id}" type="button" aria-label="Remove ${product.name}" title="Remove">&#215;</button>
          </div>
        </td>
      </tr>
    `)
    .join("");
}

function renderAdminQuotes() {
  adminQuotes.innerHTML = state.quoteRequests.length
    ? state.quoteRequests
      .map(quote => {
        const itemRows = Array.isArray(quote.items) && quote.items.length
          ? quote.items.map(item => {
            const product = state.products.find(productItem => productItem.id === item.productId);
            const name = product?.name || item.productId || "Quote item";
            const quantity = Number(item.quantity || 0);
            const price = Number(item.priceAtTime || 0);

            return `<li>${name} - Qty ${quantity} at ${currency(price)}</li>`;
          }).join("")
          : "<li>No product items saved for this request.</li>";

        return `
          <article class="quote-request">
            <div class="quote-request-header">
              <h3>${quote.customerName || "Customer"}</h3>
              <strong>${currency(Number(quote.subtotal || 0))}</strong>
            </div>
            <div class="quote-request-meta">
              <span>${quote.email || "No email"}</span>
              <span>${quote.phone || "No phone"}</span>
              <span>${quote.location || "No location"}</span>
              <span>${formatDate(quote.createdAt)}</span>
            </div>
            <ul>${itemRows}</ul>
            ${quote.notes ? `<div class="quote-notes">${quote.notes}</div>` : ""}
          </article>
        `;
      })
      .join("")
    : `<p class="fine-print">No quote requests found yet.</p>`;
}

async function fetchQuoteRequestsFromApi() {
  if (!state.admin.token) {
    state.quoteRequests = [];
    renderAdminQuotes();
    return false;
  }

  try {
    const response = await fetch(`${QUOTE_API_URL}/quotes`, {
      headers: await getAdminHeaders()
    });

    if (!response.ok) throw new Error("Quote requests failed");

    state.quoteRequests = await response.json();
    renderAdminQuotes();
    return true;
  } catch (error) {
    console.warn("Unable to load quote requests from backend API.", error);
    state.quoteRequests = JSON.parse(localStorage.getItem("gerrysQuoteRequests") || "[]");
    renderAdminQuotes();
    return false;
  }
}

function addToQuote(id) {
  state.quote[id] = (state.quote[id] || 0) + 1;
  saveQuote();
  renderAll();
}

function changeQuantity(id, delta) {
  const next = (state.quote[id] || 0) + delta;
  if (next <= 0) {
    delete state.quote[id];
  } else {
    state.quote[id] = next;
  }
  saveQuote();
  renderAll();
}

function renderAll() {
  renderProducts();
  renderQuote();
  renderAdmin();
  renderAdminQuotes();
}

function parseSseMessage(message) {
  const lines = message.split("\n");
  let event = "message";
  const dataLines = [];

  lines.forEach(line => {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    }

    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  });

  return {
    event,
    data: dataLines.join("\n")
  };
}

function handleAiStreamMessage(message) {
  const { event, data } = parseSseMessage(message);

  if (!data || data === "[done]") {
    return;
  }

  if (event === "widget") {
    try {
      const widgetData = JSON.parse(data);
      const label = widgetData.filter
        ? `${widgetData.widget}: ${widgetData.filter}`
        : widgetData.widget;

      aiWidget.textContent = label;
      aiWidget.hidden = false;
    } catch (error) {
      aiWidget.textContent = "assistant";
      aiWidget.hidden = false;
    }

    return;
  }

  if (event === "notice") {
    return;
  }

  aiResponse.textContent += data;
}

async function askAiAssistant(text) {
  aiResponse.textContent = "";
  aiWidget.hidden = true;
  aiSubmit.disabled = true;
  aiSubmit.textContent = "Asking...";

  try {
    const response = await fetch(`${AI_API_URL}/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    if (!response.ok || !response.body) {
      throw new Error("Assistant request failed");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const messages = buffer.split("\n\n");
      buffer = messages.pop() || "";
      messages.forEach(handleAiStreamMessage);
    }

    if (buffer) {
      handleAiStreamMessage(buffer);
    }
  } catch (error) {
    aiWidget.textContent = "offline";
    aiWidget.hidden = false;
    aiResponse.textContent = "The assistant is not available right now. Please try again after the backend is running.";
    console.warn("AI assistant request failed.", error);
  } finally {
    aiSubmit.disabled = false;
    aiSubmit.textContent = "Ask assistant";
  }
}

document.querySelectorAll(".filter-button").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelector(".filter-button.active").classList.remove("active");
    button.classList.add("active");
    state.activeFilter = button.dataset.filter;
    renderProducts();
  });
});

aiForm.addEventListener("submit", event => {
  event.preventDefault();
  askAiAssistant(aiPrompt.value.trim());
});

adminLoginForm.addEventListener("submit", async event => {
  event.preventDefault();

  if (!firebaseAuth) {
    adminAuthMessage.textContent = "Firebase Auth is not configured yet.";
    return;
  }

  const data = Object.fromEntries(new FormData(adminLoginForm).entries());
  adminAuthMessage.textContent = "Signing in...";

  try {
    await firebaseAuth.signInWithEmailAndPassword(data.email, data.password);
    adminLoginForm.reset();
  } catch (error) {
    adminAuthMessage.textContent = error.message;
  }
});

adminSignOut.addEventListener("click", async () => {
  if (firebaseAuth) {
    await firebaseAuth.signOut();
  }
  adminAuthMessage.textContent = "Signed out.";
});

document.addEventListener("click", event => {
  const addId = event.target.closest("[data-add]")?.dataset.add;
  const increaseId = event.target.closest("[data-increase]")?.dataset.increase;
  const decreaseId = event.target.closest("[data-decrease]")?.dataset.decrease;
  const editId = event.target.closest("[data-edit]")?.dataset.edit;
  const removeId = event.target.closest("[data-remove]")?.dataset.remove;

  if (addId) addToQuote(addId);
  if (increaseId) changeQuantity(increaseId, 1);
  if (decreaseId) changeQuantity(decreaseId, -1);
  if (editId) populateAdminForm(editId);
  if (removeId) removeProduct(removeId);
});

quoteForm.addEventListener("submit", async event => {
  event.preventDefault();
  const formData = new FormData(quoteForm);
  const request = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    contact: Object.fromEntries(formData.entries()),
    items: Object.entries(state.quote)
      .map(([id, quantity]) => {
        const product = state.products.find(item => item.id === id);
        if (!product) return null;

        return {
          productId: product.id,
          quantity,
          priceAtTime: product.price
        };
      })
      .filter(Boolean),
    subtotal: getQuoteTotal()
  };
  try {
    const response = await fetch(`${QUOTE_API_URL}/quotes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request)
    });
    if (!response.ok) throw new Error("Quote request failed");
  } catch (error) {
    const savedRequests = JSON.parse(localStorage.getItem("gerrysQuoteRequests") || "[]");
    savedRequests.push(request);
    localStorage.setItem("gerrysQuoteRequests", JSON.stringify(savedRequests));
    console.warn("Quote saved locally because the backend API is not available.", error);
  }
  quoteForm.reset();
  state.quote = {};
  saveQuote();
  formMessage.textContent = "Thanks. Your quote request has been saved for Marty to review.";
  renderAll();
  fetchQuoteRequestsFromApi();
});

adminForm.addEventListener("submit", async event => {
  event.preventDefault();

  if (!state.admin.token) {
    adminAuthMessage.textContent = "Sign in before saving products.";
    return;
  }

  const data = Object.fromEntries(new FormData(adminForm).entries());
  const matchingProduct = state.products.find(
    item => item.name.toLowerCase() === data.name.trim().toLowerCase()
  );
  const productId = data.id || matchingProduct?.id || crypto.randomUUID();
  const product = {
    id: productId,
    name: data.name.trim(),
    category: data.category,
    price: Number(data.price),
    description: data.description.trim(),
    available: Boolean(data.available)
  };

  const isExistingProduct = Boolean(data.id || matchingProduct);

  try {
    const response = await fetch(`${PRODUCT_API_URL}/products${isExistingProduct ? `/${product.id}` : ""}`, {
      method: isExistingProduct ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await getAdminHeaders())
      },
      body: JSON.stringify(product)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Product save failed");
    }

    await fetchProductsFromApi();
  } catch (error) {
    adminAuthMessage.textContent = error.message;
    console.warn("Product was not saved to the backend API.", error);
    return;
  }

  adminForm.reset();
  adminForm.elements.available.checked = true;
});

document.querySelector("#clearAdminForm").addEventListener("click", () => {
  adminForm.reset();
  adminForm.elements.id.value = "";
  adminForm.elements.available.checked = true;
});

document.querySelector("#resetProducts").addEventListener("click", async () => {
  if (!state.admin.token) {
    adminAuthMessage.textContent = "Sign in before resetting products.";
    return;
  }

  try {
    const response = await fetch(`${PRODUCT_API_URL}/products/reset`, {
      method: "POST",
      headers: await getAdminHeaders()
    });
    if (!response.ok) throw new Error("Catalog reset failed");
    await fetchProductsFromApi();
  } catch (error) {
    adminAuthMessage.textContent = error.message;
    console.warn("Catalog was not reset through the backend API.", error);
    return;
  }

  state.quote = {};
  saveQuote();
});

function populateAdminForm(id) {
  const product = state.products.find(item => item.id === id);
  if (!product) return;
  adminForm.elements.id.value = product.id;
  adminForm.elements.name.value = product.name;
  adminForm.elements.category.value = product.category;
  adminForm.elements.price.value = product.price;
  adminForm.elements.description.value = product.description;
  adminForm.elements.available.checked = product.available;
  adminForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function removeProduct(id) {
  if (!state.admin.token) {
    adminAuthMessage.textContent = "Sign in before deleting products.";
    return;
  }

  try {
    const response = await fetch(`${PRODUCT_API_URL}/products/${id}`, {
      method: "DELETE",
      headers: await getAdminHeaders()
    });
    if (!response.ok) throw new Error("Product delete failed");
    await fetchProductsFromApi();
  } catch (error) {
    adminAuthMessage.textContent = error.message;
    console.warn("Product was not deleted from the backend API.", error);
    return;
  }

  delete state.quote[id];
  saveQuote();
}

renderAll();
fetchProductsFromApi();
initializeFirebaseAuth();











