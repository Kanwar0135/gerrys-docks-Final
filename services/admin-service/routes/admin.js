const express = require("express");

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
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        error: "Firebase ID token is required. Sign in with Firebase Authentication first.",
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
