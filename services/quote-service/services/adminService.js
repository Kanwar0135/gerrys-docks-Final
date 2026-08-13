const { db } = require("./firebase");

const adminUsersCollection = db.collection("admin_users");

function serializeDoc(doc) {
  if (!doc.exists) return null;

  return {
    id: doc.id,
    ...doc.data(),
  };
}

async function getAdminByEmail(email) {
  if (!email) return null;

  const snapshot = await adminUsersCollection
    .where("email", "==", email.toLowerCase())
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return serializeDoc(snapshot.docs[0]);
}

module.exports = {
  getAdminByEmail,
};
