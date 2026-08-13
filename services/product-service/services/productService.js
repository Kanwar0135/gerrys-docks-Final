const { db } = require("./firebase");

const productsCollection = db.collection("products");

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

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
