
const { User, Role, Category, Blog } = require("../models");
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { validateCategory } = require("../middleware/validation");

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

    // Render with manual layout
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

// Create user (AJAX) - unchanged
exports.createUser = async (req, res) => {
  try {
    const { username, email, password, roleId } = req.body;

    if (!username || !email || !password || !roleId) {
      return res.status(400).json({ 
        message: "All fields are required" 
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

    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(400).json({ 
        message: "Invalid role selected" 
      });
    }

    let hashedPassword = password;
    if (!User.rawAttributes.password.set) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const user = await User.create({ 
      username, 
      email, 
      password: hashedPassword, 
      role_id: parseInt(roleId)
    });

    const { password: _, ...userWithoutPassword } = user.toJSON();
    
    res.status(201).json({
      message: "User created successfully",
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

// Update user role (AJAX) - unchanged
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
      // user: {
      //   id: user.id,
      //   username: user.username,
      //   roleId: user.role_id
      // }
    });

  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ 
      message: "Internal server error" 
    });
  }
};

// Delete user (AJAX) - unchanged
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

// --- CATEGORIES ---
/* exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [['name', 'ASC']]
    });
    
   /*  res.render("admin/layout", { 
      contentPage: '../admin/Categories',
      categories,
      title: 'Category Management'
    }); */
    //res.render("admin/layout", { 
  //contentPage: 'Categories',  // ✅ Just 'Categories'
  //categories,
  //title: 'Category Management'
//});
// } catch (error) {
  //  console.error("Error fetching categories:", error);
  //  res.status(500).send("Server error");
  //}
//};
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [['name', 'ASC']]
    });
    
    res.render("admin/layout", { 
      contentPage: 'Categories',  // This should match the filename: Categories.ejs
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

// --- BLOGS ---
/* exports.getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.findAll({
      include: [
        { model: User, attributes: ["username"] },
        { model: Category, attributes: ["name"] },
      ],
      order: [['createdAt', 'DESC']]
    });
    
    const categories = await Category.findAll({
      order: [['name', 'ASC']]
    });
    const users = await User.findAll({
      attributes: ['id', 'username'],
      order: [['username', 'ASC']]
    });
    
    res.render("admin/layout", { 
      contentPage: '../admin/Blogs',
      blogs,
      categories,
      users,
      title: 'Blog Management'
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).send("Server error");
  }
}; */
exports.getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.findAll({
      include: [
        { model: User, attributes: ["username"] },
        { model: Category, attributes: ["name"] },
      ],
      order: [['createdAt', 'DESC']]
    });
    
    const categories = await Category.findAll({
      order: [['name', 'ASC']]
    });
    const users = await User.findAll({
      attributes: ['id', 'username'],
      order: [['username', 'ASC']]
    });
    
    res.render("admin/layout", { 
      contentPage: 'Blogs',  // Changed from '../admin/Blogs' to just 'Blogs'
      blogs,
      categories,
      users,
      title: 'Blog Management'
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).send("Server error");
  }
};

exports.createBlog = async (req, res) => {
  try {
    const { title, content, categoryId, authorId } = req.body;

    if (!title || !content || !categoryId || !authorId) {
      return res.status(400).json({ 
        message: "All fields are required" 
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
    });

    res.status(201).json({
      message: "Blog created successfully",
      blog
    });

  } catch (error) {
    console.error("Error creating blog:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

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