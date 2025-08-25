const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { isAuthenticated, authorize } = require("../middleware/authMiddleware");
const { validateCategory } = require("../middleware/validation");

// User Master Routes
router.get("/users", isAuthenticated, adminController.getAllUsers);
router.post("/users/create", isAuthenticated, adminController.createUser);
router.post("/users/update-role", isAuthenticated, adminController.updateUserRole);
router.post("/users/delete", isAuthenticated, adminController.deleteUser);

// Category Master Routes
router.get("/categories", isAuthenticated, adminController.getCategories);
router.post("/categories/create", isAuthenticated, validateCategory, adminController.createCategory);
router.post("/categories/delete", isAuthenticated, adminController.deleteCategory);

// Blog Master Routes
router.get("/blogs", isAuthenticated, adminController.getBlogs);
router.post("/blogs/create", isAuthenticated, adminController.createBlog);
router.post("/blogs/delete", isAuthenticated, adminController.deleteBlog);

module.exports = router;
