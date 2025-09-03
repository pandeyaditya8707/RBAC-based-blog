const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Admin login routes
router.get("/admin/login", authController.getAdminLogin);
router.post("/admin/login", authController.postAdminLogin);

// Forgot password routes
router.get("/forgot-password", authController.getForgotPassword);
router.post("/forgot-password", authController.postForgotPassword);

// Reset password routes
router.get("/reset-password/:token", authController.getResetPassword);
router.post("/reset-password/:token", authController.postResetPassword);

// Logout route
router.post("/logout", authController.logout);


module.exports = router;
