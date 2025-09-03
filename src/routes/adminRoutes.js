const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { isAuthenticated, authorize } = require("../middleware/authMiddleware");
const { validateCategory, validateAdminUserCreation } = require("../middleware/validation");

// User Master Routes
router.get("/users", isAuthenticated, adminController.getAllUsers);
router.post("/users/create", isAuthenticated, validateAdminUserCreation, adminController.createUser);
router.post("/users/update-role", isAuthenticated, adminController.updateUserRole);
router.post("/users/delete", isAuthenticated, adminController.deleteUser);

// Category Master Routes
router.get("/categories", isAuthenticated, adminController.getCategories);
router.post("/categories/create", isAuthenticated, validateCategory, adminController.createCategory);
router.post("/categories/delete", isAuthenticated, adminController.deleteCategory);

// Blog Master Routes
router.get("/blogs", isAuthenticated, adminController.getBlogs);
router.post("/blogs/create", isAuthenticated, ...adminController.createBlog);
router.post("/blogs/delete", isAuthenticated, adminController.deleteBlog);

// Role Master Routes
router.get("/roles", isAuthenticated, adminController.getRoles);
router.post("/roles/create", isAuthenticated, adminController.createRole);
router.post("/roles/delete", isAuthenticated, adminController.deleteRole);

// API endpoint for roles (used by login page account creation)
router.get("/roles-api", async (req, res) => {
  try {
    const { Role } = require('../models');
    const roles = await Role.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });
    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Role Access Routes
router.get("/role-access", isAuthenticated, adminController.getRoleAccess);
router.post("/role-access/create", isAuthenticated, adminController.createRoleAccess);
router.post("/role-access/update", isAuthenticated, adminController.updateRoleAccess);
router.post("/role-access/delete", isAuthenticated, adminController.deleteRoleAccess);

module.exports = router;
