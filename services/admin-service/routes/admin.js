const express = require("express");
const jwt = require("jsonwebtoken");

const { auth } = require("../services/firebase");
const { getAdminByEmail } = require("../services/adminService");
const { requireAdmin } = require("../middleware/requireAdmin");

const router = express.Router();

router.post("/session", requireAdmin, (req, res) => {
  res.json({
    message: "Admin session verified",
    admin: {
      uid: req.adminUser.uid,
      email: req.adminUser.email,
      role: req.adminUser.role,
    },
  });
});

router.post("/login", async (req, res, next) => {
  try {
    const { idToken, email, password } = req.body;

    if (email || password) {
      const adminEmail = String(process.env.ADMIN_EMAIL || "").toLowerCase();
      const adminPassword = String(process.env.ADMIN_PASSWORD || "");
      const jwtSecret = process.env.JWT_SECRET;
      const requestedEmail = String(email || "").trim().toLowerCase();

      if (!requestedEmail || !password) {
        return res.status(400).json({ error: "Admin email and password are required" });
      }

      if (!jwtSecret) {
        return res.status(500).json({ error: "JWT_SECRET is not configured" });
      }

      if (requestedEmail !== adminEmail || String(password) !== adminPassword) {
        return res.status(401).json({ error: "Invalid administrator credentials" });
      }

      const token = jwt.sign(
        {
          uid: "local-admin",
          email: adminEmail,
          role: process.env.ADMIN_ROLE || "admin",
          provider: "local-admin",
        },
        jwtSecret,
        { expiresIn: "8h" }
      );

      return res.json({
        message: "Admin login successful",
        token,
        admin: {
          uid: "local-admin",
          email: adminEmail,
          role: process.env.ADMIN_ROLE || "admin",
        },
      });
    }

    if (!idToken) {
      return res.status(400).json({
        error: "Admin email/password or Firebase ID token is required.",
      });
    }

    const decodedToken = await auth.verifyIdToken(idToken);
    const adminUser = await getAdminByEmail(decodedToken.email || "");

    if (!adminUser || adminUser.uid !== decodedToken.uid) {
      return res.status(403).json({ error: "Admin access required" });
    }

    return res.json({
      message: "Admin login successful",
      token: idToken,
      admin: {
        uid: adminUser.uid,
        email: adminUser.email,
        role: adminUser.role,
      },
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
