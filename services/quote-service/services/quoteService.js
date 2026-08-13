const { db } = require("./firebase");

const quotesCollection = db.collection("quotes");
const quoteItemsCollection = db.collection("quote_items");

function serializeDoc(doc) {
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

function normalizeQuoteData(quoteData) {
  const contact = quoteData.contact || {};

  return {
    customerName: quoteData.customerName || contact.name,
    email: quoteData.email || contact.email,
    phone: quoteData.phone || contact.phone,
    location: quoteData.location || contact.location,
    notes: quoteData.notes || contact.notes || "",
    subtotal: quoteData.subtotal,
    items: Array.isArray(quoteData.items) ? quoteData.items : [],
  };
}

async function createQuote(quoteData) {
  const normalized = normalizeQuoteData(quoteData);
  const quoteRef = quotesCollection.doc();
  const timestamp = new Date();

  const subtotal =
    normalized.subtotal ??
    normalized.items.reduce((sum, item) => {
      const quantity = Number(item.quantity || 0);
      const priceAtTime = Number(item.priceAtTime || item.price || 0);
      return sum + quantity * priceAtTime;
    }, 0);

  const quote = stripUndefined({
    id: quoteRef.id,
    customerName: normalized.customerName,
    email: normalized.email,
    phone: normalized.phone,
    location: normalized.location,
    notes: normalized.notes,
    subtotal: Number(subtotal),
    createdAt: timestamp,
  });

  const quoteItems = normalized.items.map((item) =>
    stripUndefined({
      quoteId: quoteRef.id,
      productId: item.productId || item.id,
      quantity: Number(item.quantity),
      priceAtTime: Number(item.priceAtTime ?? item.price),
    })
  );

  await db.runTransaction(async (transaction) => {
    transaction.set(quoteRef, quote);

    for (const item of quoteItems) {
      transaction.set(quoteItemsCollection.doc(), item);
    }
  });

  return {
    ...quote,
    items: quoteItems,
  };
}

async function getAllQuotes() {
  const snapshot = await quotesCollection.orderBy("createdAt", "desc").get();
  const quotes = snapshot.docs.map(serializeDoc);

  return Promise.all(
    quotes.map(async (quote) => {
      const itemsSnapshot = await quoteItemsCollection
        .where("quoteId", "==", quote.id)
        .get();

      return {
        ...quote,
        items: itemsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })),
      };
    })
  );
}

module.exports = {
  createQuote,
  getAllQuotes,
};
