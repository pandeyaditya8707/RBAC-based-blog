
const { User, Role, Category, Blog, RoleAccess } = require("../models");
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { validateCategory } = require("../middleware/validation");
const { handleBlogImageUpload } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

// --- USERS ---
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      include: [{ model: Role, attributes: ["id", "name"] }],
      order: [['id', 'ASC']]
    });
    const roles = await Role.findAll({ 
      attributes: ["id", "name"],
      order: [['name', 'ASC']]
    });

  
    res.render("admin/layout", { 
      contentPage: '../admin/Users',
      users, 
      roles,
      title: 'User Management'
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send("Server error");
  }
};

// Create user 
exports.createUser = async (req, res) => {
  try {
    const { username, email, password, roleId } = req.body;

    // Check if this is admin registration (no roleId provided)
    const isAdminRegistration = !roleId;
    
    if (!username || !email || !password) {
      return res.status(400).json({ 
        message: "Username, email, and password are required" 
      });
    }

    // For admin panel user creation, roleId is required
    if (!isAdminRegistration && !roleId) {
      return res.status(400).json({ 
        message: "Role selection is required" 
      });
    }

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username: username },
          { email: email }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: "Username or email already exists" 
      });
    }

    let finalRoleId;
    
    if (isAdminRegistration) {
      // Auto-assign admin role for admin registration
      const adminRole = await Role.findOne({ where: { name: 'admin' } });
      if (!adminRole) {
        return res.status(500).json({ 
          message: "Admin role not found in system" 
        });
      }
      finalRoleId = adminRole.id;
    } else {
      // Validate provided roleId for admin panel user creation
      const role = await Role.findByPk(roleId);
      if (!role) {
        return res.status(400).json({ 
          message: "Invalid role selected" 
        });
      }
      finalRoleId = parseInt(roleId);
    }

    let hashedPassword = password;
    if (!User.rawAttributes.password.set) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const user = await User.create({ 
      username, 
      email, 
      password: hashedPassword, 
      role_id: finalRoleId
    });

    const { password: _, ...userWithoutPassword } = user.toJSON();
    
    res.status(201).json({
      message: isAdminRegistration ? "Admin account created successfully" : "User created successfully",
      user: userWithoutPassword
    });

  } catch (error) {
    console.error("Error creating user:", error);
    
    if (error.name === 'SequelizeValidationError') {
      const errors = error.errors.map(err => err.message);
      return res.status(400).json({ 
        message: errors.join(', ') 
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        message: "Username or email already exists" 
      });
    }

    res.status(500).json({ 
      message: "Internal server error" 
    });
  }
};

// Update user role 
exports.updateUserRole = async (req, res) => {
  try {
    const { userId, roleId } = req.body;

    if (!userId || !roleId) {
      return res.status(400).json({ 
        message: "User ID and Role ID are required" 
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ 
        message: "User not found" 
      });
    }

    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(400).json({ 
        message: "Invalid role selected" 
      });
    }

    await user.update({ role_id: parseInt(roleId) });
    
    res.json({ 
      message: "User role updated successfully",
      
    });

  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ 
      message: "Internal server error" 
    });
  }
};

// Delete user  - unchanged
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        message: "User ID is required" 
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ 
        message: "User not found" 
      });
    }

    if (user.username === 'admin') {
      return res.status(400).json({ 
        message: "Cannot delete admin user" 
      });
    }

    await user.destroy();
    
    res.json({ 
      message: "User deleted successfully" 
    });

  } catch (error) {
    console.error("Error deleting user:", error);
    
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ 
        message: "Cannot delete user: user has associated records" 
      });
    }

    res.status(500).json({ 
      message: "Internal server error" 
    });
  }
};


exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [['name', 'ASC']]
    });
    
    res.render("admin/layout", { 
      contentPage: 'Categories',  
      categories,
      title: 'Category Management'
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).send("Server error");
  }
};
 
exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ 
        message: "Category name is required" 
      });
    }

    const existingCategory = await Category.findOne({ 
      where: { name: name.trim() } 
    });

    if (existingCategory) {
      return res.status(400).json({ 
        message: "Category already exists" 
      });
    }

    const category = await Category.create({ name: name.trim() });
    res.status(201).json({
      message: "Category created successfully",
      category
    });

  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.body;

    if (!categoryId) {
      return res.status(400).json({ 
        message: "Category ID is required" 
      });
    }

    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({ 
        message: "Category not found" 
      });
    }

    await category.destroy();
    res.json({ message: "Category deleted successfully" });

  } catch (error) {
    console.error("Error deleting category:", error);
    
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ 
        message: "Cannot delete category: category has associated blogs" 
      });
    }

    res.status(500).json({ message: "Internal server error" });
  }
};


exports.getBlogs = async (req, res) => {
  try {
    console.log("=== ADMIN BLOGS DEBUG ===");
    console.log("Starting getBlogs function");
    
    const blogs = await Blog.findAll({
      include: [
        { model: User, attributes: ["username"] },
        { model: Category, attributes: ["name"] },
      ],
      order: [['createdAt', 'DESC']]
    });
    
    console.log("Blogs fetched:", blogs.length);
    
    const categories = await Category.findAll({
      order: [['name', 'ASC']]
    });
    
    console.log("Categories fetched:", categories.length);
    
    const users = await User.findAll({
      attributes: ['id', 'username'],
      order: [['username', 'ASC']]
    });
    
    console.log("Users fetched:", users.length);
    console.log("About to render admin/layout");
    
    res.render("admin/layout", { 
      contentPage: 'Blogs',  
      blogs,
      categories,
      users,
      title: 'Blog Management'
    });
    
    console.log("Render completed successfully");
  } catch (error) {
    console.error("=== ERROR in getBlogs ===");
    console.error("Error details:", error);
    console.error("Error stack:", error.stack);
    res.status(500).send("Server error: " + error.message);
  }
};

exports.createBlog = [handleBlogImageUpload, async (req, res) => {
  try {
    const { title, content, categoryId, authorId } = req.body;

    if (!title || !content || !categoryId || !authorId) {
      return res.status(400).json({ 
        message: "All fields are required" 
      });
    }

    // Handle upload error
    if (req.uploadError) {
      return res.status(400).json({ 
        message: req.uploadError 
      });
    }

    const [category, author] = await Promise.all([
      Category.findByPk(categoryId),
      User.findByPk(authorId)
    ]);

    if (!category) {
      return res.status(400).json({ 
        message: "Invalid category selected" 
      });
    }

    if (!author) {
      return res.status(400).json({ 
        message: "Invalid author selected" 
      });
    }

    const blog = await Blog.create({
      title,
      content,
      category_id: categoryId,
      author_id: authorId,
      image: req.file ? req.file.filename : null
    });

    res.status(201).json({
      message: "Blog created successfully",
      blog
    });

  } catch (error) {
    console.error("Error creating blog:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}];

exports.deleteBlog = async (req, res) => {
  try {
    const { blogId } = req.body;

    if (!blogId) {
      return res.status(400).json({ 
        message: "Blog ID is required" 
      });
    }

    const blog = await Blog.findByPk(blogId);
    if (!blog) {
      return res.status(404).json({ 
        message: "Blog not found" 
      });
    }

    await blog.destroy();
    res.json({ message: "Blog deleted successfully" });

  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// --- ROLES ---
exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.findAll({
      order: [['name', 'ASC']]
    });
    
    res.render("admin/layout", { 
      contentPage: 'Roles',  
      roles,
      title: 'Role Management'
    });
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).send("Server error");
  }
};

exports.createRole = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ 
        message: "Role name is required" 
      });
    }

    const existingRole = await Role.findOne({ 
      where: { name: name.trim() } 
    });

    if (existingRole) {
      return res.status(400).json({ 
        message: "Role already exists" 
      });
    }

    const role = await Role.create({ name: name.trim() });
    res.status(201).json({
      message: "Role created successfully",
      role
    });

  } catch (error) {
    console.error("Error creating role:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const { roleId } = req.body;

    if (!roleId) {
      return res.status(400).json({ 
        message: "Role ID is required" 
      });
    }

    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({ 
        message: "Role not found" 
      });
    }

    // Check if role is being used by users and get their usernames
    const assignedUsers = await User.findAll({ 
      where: { role_id: roleId },
      attributes: ['username']
    });
    
    if (assignedUsers.length > 0) {
      const usernames = assignedUsers.map(user => user.username).join(', ');
      return res.status(400).json({ 
        message: `Cannot delete role: role is assigned to users: ${usernames}` 
      });
    }

    await role.destroy();
    res.json({ message: "Role deleted successfully" });

  } catch (error) {
    console.error("Error deleting role:", error);
    
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ 
        message: "Cannot delete role: role has associated records" 
      });
    }

    res.status(500).json({ message: "Internal server error" });
  }
};

// ROLE ACCESS 
exports.getRoleAccess = async (req, res) => {
  try {
    const roles = await Role.findAll({
      order: [['name', 'ASC']]
    });

    const roleAccess = await RoleAccess.findAll({
      include: [{ model: Role, attributes: ["id", "name"] }],
      order: [['role_id', 'ASC'], ['resource', 'ASC']]
    });
    
    res.render("admin/layout", { 
      contentPage: '../admin/RoleAccess',  
      roles,
      roleAccess,
      title: 'Role Access Management'
    });
  } catch (error) {
    console.error("Error fetching role access:", error);
    res.status(500).send("Server error");
  }
};

exports.createRoleAccess = async (req, res) => {
  try {
    const { roleId, resource, can_read, can_write, can_delete, can_comment } = req.body;
    
    if (!roleId || !resource) {
      return res.status(400).json({ 
        message: "Role and resource are required" 
      });
    }

    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(400).json({ 
        message: "Invalid role selected" 
      });
    }

    // Check if role access already exists for this role and resource
    const existingAccess = await RoleAccess.findOne({
      where: { 
        role_id: roleId,
        resource: resource.trim()
      }
    });

    if (existingAccess) {
      return res.status(400).json({ 
        message: "Role access already exists for this role and resource" 
      });
    }

    const roleAccess = await RoleAccess.create({
      role_id: roleId,
      resource: resource.trim(),
      can_read: can_read === 'true' || can_read === true,
      can_write: can_write === 'true' || can_write === true,
      can_delete: can_delete === 'true' || can_delete === true,
      can_comment: can_comment === 'true' || can_comment === true
    });

    res.status(201).json({
      message: "Role access created successfully",
      roleAccess
    });

  } catch (error) {
    console.error("Error creating role access:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateRoleAccess = async (req, res) => {
  try {
    const { accessId, roleId, resource, can_read, can_write, can_delete, can_comment } = req.body;
    
    if (!accessId || !roleId || !resource) {
      return res.status(400).json({ 
        message: "Access ID, role, and resource are required" 
      });
    }

    const roleAccess = await RoleAccess.findByPk(accessId);
    if (!roleAccess) {
      return res.status(404).json({ 
        message: "Role access not found" 
      });
    }

    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(400).json({ 
        message: "Invalid role selected" 
      });
    }

    await roleAccess.update({
      role_id: roleId,
      resource: resource.trim(),
      can_read: can_read === 'true' || can_read === true,
      can_write: can_write === 'true' || can_write === true,
      can_delete: can_delete === 'true' || can_delete === true,
      can_comment: can_comment === 'true' || can_comment === true
    });

    res.json({
      message: "Role access updated successfully",
      roleAccess
    });

  } catch (error) {
    console.error("Error updating role access:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteRoleAccess = async (req, res) => {
  try {
    const { accessId } = req.body;

    if (!accessId) {
      return res.status(400).json({ 
        message: "Access ID is required" 
      });
    }

    const roleAccess = await RoleAccess.findByPk(accessId);
    if (!roleAccess) {
      return res.status(404).json({ 
        message: "Role access not found" 
      });
    }

    await roleAccess.destroy();
    res.json({ message: "Role access deleted successfully" });

  } catch (error) {
    console.error("Error deleting role access:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
