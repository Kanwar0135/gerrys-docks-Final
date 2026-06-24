const { auth } = require("../services/firebase");
const { getAdminByEmail } = require("../services/adminService");

async function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: "Missing auth token" });
    }

    const decodedToken = await auth.verifyIdToken(token);
    const adminUser = await getAdminByEmail(decodedToken.email || "");

    if (!adminUser || adminUser.uid !== decodedToken.uid) {
      return res.status(403).json({ error: "Admin access required" });
    }

    req.user = decodedToken;
    req.adminUser = adminUser;
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid auth token" });
  }
}

module.exports = {
  requireAdmin,
};
