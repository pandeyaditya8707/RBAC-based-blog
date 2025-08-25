const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { validateAdminLogin } = require("../middleware/validation");

// =============================
// Admin Login
// =============================
router.get("/admin/login", authController.getAdminLogin);
router.post("/admin/login", validateAdminLogin, authController.postAdminLogin);

// =============================
// User Registration
// =============================
router.get("/register", (req, res) => {
  res.redirect("/user/register");
});

// =============================
// Logout (works for both user/admin)
// =============================
router.post("/logout", authController.logout);

module.exports = router;
