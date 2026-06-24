const { db } = require("./firebase");

const productsCollection = db.collection("products");

const DEFAULT_PRODUCTS = [
  {
    id: "dock-8x16",
    name: "8 x 16 Aluminum Dock Section",
    category: "Docks",
    price: 3295,
    description: "Lightweight modular section with decking, side rails, and adjustable legs.",
    available: true,
  },
  {
    id: "dock-4x10",
    name: "4 x 10 Shoreline Dock Extension",
    category: "Docks",
    price: 1795,
    description: "Adds reach for changing water levels or wider mooring space.",
    available: true,
  },
  {
    id: "ramp-4x12",
    name: "4 x 12 Hinged Access Ramp",
    category: "Ramps",
    price: 1425,
    description: "Stable transition from bank to dock with seasonal hinge hardware.",
    available: true,
  },
  {
    id: "ramp-4x20",
    name: "4 x 20 Long Access Ramp",
    category: "Ramps",
    price: 2295,
    description: "Extra length for shallow banks, uneven shorelines, and lower grades.",
    available: true,
  },
  {
    id: "bench-kit",
    name: "Dock Bench Kit",
    category: "Accessories",
    price: 395,
    description: "Bolt-on bench with aluminum brackets and weather-resistant seating.",
    available: true,
  },
  {
    id: "ladder",
    name: "Flip-Up Swim Ladder",
    category: "Accessories",
    price: 325,
    description: "Corrosion-resistant ladder that lifts out of the water when not in use.",
    available: true,
  },
  {
    id: "bumpers",
    name: "Boat Bumper Package",
    category: "Accessories",
    price: 185,
    description: "Protective edge bumpers and corner guards for everyday docking.",
    available: true,
  },
  {
    id: "wheel-kit",
    name: "Seasonal Wheel Kit",
    category: "Accessories",
    price: 640,
    description: "Helps roll dock sections in and out during spring setup and fall removal.",
    available: false,
  },
];

function serializeProduct(doc) {
  if (!doc.exists) return null;

  return {
    id: doc.id,
    ...doc.data(),
  };
}

function stripUndefined(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined)
  );
}

async function getAllProducts() {
  const snapshot = await productsCollection.orderBy("createdAt", "desc").get();
  return snapshot.docs.map(serializeProduct);
}

async function getProductById(id) {
  const doc = await productsCollection.doc(id).get();
  return serializeProduct(doc);
}

async function createProduct(product) {
  const ref = product.id ? productsCollection.doc(product.id) : productsCollection.doc();
  const timestamp = new Date();

  const productData = stripUndefined({
    id: ref.id,
    name: product.name,
    category: product.category,
    price: Number(product.price),
    description: product.description || "",
    available: product.available ?? true,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  await ref.set(productData);
  return productData;
}

async function updateProduct(id, product) {
  const ref = productsCollection.doc(id);
  const existing = await ref.get();

  if (!existing.exists) {
    return null;
  }

  const updates = stripUndefined({
    name: product.name,
    category: product.category,
    price: product.price === undefined ? undefined : Number(product.price),
    description: product.description,
    available: product.available,
    updatedAt: new Date(),
  });

  await ref.update(updates);

  const updated = await ref.get();
  return serializeProduct(updated);
}

async function deleteProduct(id) {
  const ref = productsCollection.doc(id);
  const existing = await ref.get();

  if (!existing.exists) {
    return null;
  }

  const product = serializeProduct(existing);
  await ref.delete();
  return product;
}

async function resetProducts() {
  const snapshot = await productsCollection.get();
  const batch = db.batch();
  const timestamp = new Date();

  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  DEFAULT_PRODUCTS.forEach((product) => {
    const ref = productsCollection.doc(product.id);
    batch.set(ref, {
      ...product,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  });

  await batch.commit();
  return getAllProducts();
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  resetProducts,
};
