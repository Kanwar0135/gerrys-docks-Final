const { db } = require("./firebase");
const crypto = require("crypto");
const { promisify } = require("util");

const adminUsersCollection = db.collection("admin_users");
const LOCAL_ADMIN_ID = "local-admin";
const scryptAsync = promisify(crypto.scrypt);

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

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(password, salt, 64);

  return {
    passwordHash: derivedKey.toString("hex"),
    passwordSalt: salt,
  };
}

async function verifyPassword(password, adminUser) {
  if (!adminUser?.passwordHash || !adminUser?.passwordSalt) {
    return false;
  }

  const derivedKey = await scryptAsync(password, adminUser.passwordSalt, 64);
  const storedHash = Buffer.from(adminUser.passwordHash, "hex");

  if (storedHash.length !== derivedKey.length) {
    return false;
  }

  return crypto.timingSafeEqual(storedHash, derivedKey);
}

async function getLocalAdmin() {
  const doc = await adminUsersCollection.doc(LOCAL_ADMIN_ID).get();
  return serializeDoc(doc);
}

async function getLoginAdminByEmail(email) {
  const requestedEmail = String(email || "").trim().toLowerCase();
  const localAdmin = await getLocalAdmin();

  if (localAdmin?.email?.toLowerCase() === requestedEmail) {
    return localAdmin;
  }

  return getAdminByEmail(requestedEmail);
}

async function ensureLocalAdmin() {
  const existing = await getLocalAdmin();

  if (existing) {
    return existing;
  }

  const adminEmail = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();

  if (!adminEmail) {
    throw new Error("ADMIN_EMAIL is not configured");
  }

  const adminUser = {
    uid: LOCAL_ADMIN_ID,
    email: adminEmail,
    role: process.env.ADMIN_ROLE || "admin",
    profileName: process.env.ADMIN_PROFILE_NAME || "Gerry Administrator",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await adminUsersCollection.doc(LOCAL_ADMIN_ID).set(adminUser);
  return {
    id: LOCAL_ADMIN_ID,
    ...adminUser,
  };
}

async function updateLocalAdminSettings({ profileName, email, newPassword }) {
  const adminUser = await ensureLocalAdmin();
  const updates = {
    updatedAt: new Date(),
  };

  if (profileName !== undefined) {
    updates.profileName = String(profileName).trim() || adminUser.profileName;
  }

  if (email !== undefined) {
    updates.email = String(email).trim().toLowerCase();
  }

  if (newPassword) {
    Object.assign(updates, await hashPassword(newPassword));
    updates.passwordChangedAt = new Date();
  }

  await adminUsersCollection.doc(LOCAL_ADMIN_ID).set(updates, { merge: true });
  return getLocalAdmin();
}

module.exports = {
  getAdminByEmail,
  getLoginAdminByEmail,
  getLocalAdmin,
  ensureLocalAdmin,
  updateLocalAdminSettings,
  verifyPassword,
};
