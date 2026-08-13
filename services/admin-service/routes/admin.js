const express = require("express");
const jwt = require("jsonwebtoken");

const { auth } = require("../services/firebase");
const {
  ensureLocalAdmin,
  getAdminByEmail,
  getLoginAdminByEmail,
  updateLocalAdminSettings,
  verifyPassword,
} = require("../services/adminService");
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

router.get("/settings", requireAdmin, async (req, res, next) => {
  try {
    const adminUser = await ensureLocalAdmin();

    return res.json({
      profileName: adminUser.profileName || "Gerry Administrator",
      email: adminUser.email,
      role: adminUser.role || "admin",
      passwordChangedAt: adminUser.passwordChangedAt || null,
    });
  } catch (error) {
    return next(error);
  }
});

router.patch("/settings", requireAdmin, async (req, res, next) => {
  try {
    const { profileName, email, currentPassword, newPassword } = req.body;
    const updates = {};

    if (profileName !== undefined) {
      updates.profileName = String(profileName).trim();
    }

    if (email !== undefined) {
      const requestedEmail = String(email).trim().toLowerCase();

      if (!requestedEmail || !requestedEmail.includes("@")) {
        return res.status(400).json({ error: "A valid admin email is required" });
      }

      updates.email = requestedEmail;
    }

    if (newPassword !== undefined) {
      const requestedPassword = String(newPassword);

      if (requestedPassword.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }

      const adminUser = await ensureLocalAdmin();
      const envPassword = String(process.env.ADMIN_PASSWORD || "");
      const isStoredPasswordValid = await verifyPassword(String(currentPassword || ""), adminUser);
      const isEnvPasswordValid = !adminUser.passwordHash && String(currentPassword || "") === envPassword;

      if (!isStoredPasswordValid && !isEnvPasswordValid) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      updates.newPassword = requestedPassword;
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: "No account changes were provided" });
    }

    const adminUser = await updateLocalAdminSettings(updates);

    return res.json({
      message: "Admin account settings updated",
      admin: {
        uid: adminUser.uid,
        email: adminUser.email,
        role: adminUser.role,
        profileName: adminUser.profileName,
        passwordChangedAt: adminUser.passwordChangedAt || null,
      },
    });
  } catch (error) {
    return next(error);
  }
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

      const savedAdmin = await getLoginAdminByEmail(requestedEmail);
      const isSavedPasswordValid = await verifyPassword(String(password), savedAdmin);
      const isEnvPasswordValid = !savedAdmin?.passwordHash
        && (requestedEmail === adminEmail || savedAdmin?.email?.toLowerCase() === requestedEmail)
        && String(password) === adminPassword;

      if (!savedAdmin && !isEnvPasswordValid) {
        return res.status(401).json({ error: "Invalid administrator credentials" });
      }

      if (!isSavedPasswordValid && !isEnvPasswordValid) {
        return res.status(401).json({ error: "Invalid administrator credentials" });
      }

      const loginAdmin = savedAdmin || {
        uid: "local-admin",
        email: adminEmail,
        role: process.env.ADMIN_ROLE || "admin",
      };

      const token = jwt.sign(
        {
          uid: loginAdmin.uid || "local-admin",
          email: loginAdmin.email,
          role: loginAdmin.role || "admin",
          provider: "local-admin",
        },
        jwtSecret,
        { expiresIn: "8h" }
      );

      return res.json({
        message: "Admin login successful",
        token,
        admin: {
          uid: loginAdmin.uid || "local-admin",
          email: loginAdmin.email,
          role: loginAdmin.role || "admin",
          profileName: loginAdmin.profileName,
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
