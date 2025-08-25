// controllers/userController.js - Fixed login function
const bcrypt = require('bcrypt');
const { User, Role, RoleAccess, Blog, Category } = require('../models');
const { validateUserLogin, validateUserRegistration, validateBlog } = require('../middleware/validation');

const userController = {
  
  // Show login page
  showLogin: (req, res) => {
    const error = req.query.error;
    const success = req.query.success;
    res.render('auth/login', { error, success });
  },

  // Show registration page
  showRegister: (req, res) => {
    const error = req.query.error;
    res.render("auth/userRegister", { error });
  },

  // Handle user login - FIXED
  login: async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.redirect('/user/login?error=missing_credentials');
      }

      const user = await User.findOne({
        where: { username: username.trim(), is_active: true },
        include: [{ model: Role, include: [RoleAccess] }]
      });

      if (!user) {
        return res.redirect('/user/login?error=invalid_credentials');
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.redirect('/user/login?error=invalid_credentials');
      }

      // Check if user has a valid role
      if (!user.Role) {
        return res.redirect('/user/login?error=no_role_assigned');
      }

      // Block admin users from using user login (they should use admin login)
      if (user.Role.name === 'Admin') {
        return res.redirect('/user/login?error=use_admin_login');
      }

      // Store session
      req.session.userId = user.id;

      const redirectUrl = req.session.returnTo || '/user/dashboard';
      delete req.session.returnTo;
      res.redirect(redirectUrl);

    } catch (error) {
      console.error('Login error:', error);
      res.redirect('/user/login?error=server_error');
    }
  },

  // Handle user registration
  register: async (req, res) => {
    try {
      console.log('=== USER REGISTRATION DEBUG ===');
      console.log('Request body:', req.body);
      
      const { username, email, password} = req.body;

      if (!username || !email || !password ) {
        console.log('Missing fields');
        return res.redirect('/user/register?error=missing_fields');
      }
      
      if (password.length < 6) {
        console.log('Password too short');
        return res.redirect('/user/register?error=password_too_short');
      }

      const existingUser = await User.findOne({
        where: {
          [require('sequelize').Op.or]: [
            { email: email.toLowerCase().trim() },
            { username: username.trim() }
          ]
        }
      });
      if (existingUser) {
        console.log('User already exists');
        return res.redirect('/user/register?error=user_exists');
      }

      // Check available roles
      const allRoles = await Role.findAll();
      console.log('Available roles:', allRoles.map(r => r.name));
      
      let targetRole = await Role.findOne({ where: { name: 'Author' } });
      if (!targetRole) {
        console.log('Author role not found, trying alternative names...');
        // Try different possible role names
        const roleNames = ['author', 'user', 'User', 'member', 'Member'];
        for (const roleName of roleNames) {
          targetRole = await Role.findOne({ where: { name: roleName } });
          if (targetRole) {
            console.log('Found role:', targetRole.name);
            break;
          }
        }
        
        if (!targetRole) {
          // Get the first non-admin role
          targetRole = await Role.findOne({ 
            where: { 
              name: { 
                [require('sequelize').Op.not]: 'Admin' 
              } 
            } 
          });
          console.log('Using first available non-admin role:', targetRole ? targetRole.name : 'none');
        }
        
        if (!targetRole) {
          console.log('No suitable role found');
          return res.redirect('/user/register?error=role_not_found');
        }
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const newUser = await User.create({
        username: username.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role_id: targetRole.id,
        is_active: true,
        is_verified: false
      });

      console.log('User created successfully with ID:', newUser.id);
      res.redirect('/user/login?success=registration_successful');

    } catch (error) {
      console.error('Registration error:', error);
      res.redirect('/user/register?error=registration_failed');
    }
  },

  showDashboard: async (req, res) => {
  try {
    const blogCount = await Blog.count({ where: { author_id: req.user.id } });
    const recentBlogs = await Blog.findAll({
      where: { author_id: req.user.id },
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [{ model: Category, attributes: ['name'] }]
    });

    res.render('user/layout', {
      contentPage: '../user/dashboard',
      title: "Dashboard",    
      user: req.user,
      blogCount,
      recentBlogs,
      activePage: "dashboard"
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.render('user/layout', {
      contentPage: '../user/dashboard',
      title: "Dashboard",  
      user: req.user,
      blogCount: 0,
      recentBlogs: [],
      error: 'Error loading dashboard data',
      activePage: "dashboard"
    });
  }
},

showBlogs: async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const { count, rows: blogs } = await Blog.findAndCountAll({
      include: [
        { model: User, attributes: ['username'] },
        { model: Category, attributes: ['name'] }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const totalPages = Math.ceil(count / limit);

    res.render('user/layout', {
      contentPage: '../user/blogs',
      blogs,
      currentPage: page,
      totalPages,
      user: req.user,
      title: 'All Blogs',
      activePage: "blogs"
    });

  } catch (error) {
    console.error('Blogs error:', error);
    res.render('user/layout', {
      contentPage: '../user/blogs',
      blogs: [],
      currentPage: 1,
      totalPages: 1,
      user: req.user,
      title: 'All Blogs',
      error: 'Error loading blogs',
      activePage: "blogs"
    });
  }
},

  showMyBlogs: async (req, res) => {
  try {
    const blogs = await Blog.findAll({
      where: { author_id: req.user.id },
      include: [{ model: Category, attributes: ['name'] }],
      order: [['createdAt', 'DESC']]
    });

    res.render('user/layout', {
      contentPage: '../user/my-blogs',
      blogs,
      user: req.user,
      title: "My Blogs",
      activePage: "my-blogs",
      success: req.query.success || null,
      error: req.query.error || null
    });

  } catch (error) {
    console.error('My blogs error:', error);
    res.render('user/layout', {
      contentPage: '../user/my-blogs',
      blogs: [],
      user: req.user,
      title: "My Blogs",
      activePage: "my-blogs",
      error: 'Error loading your blogs'
    });
  }
},

  // Show create blog form
  showCreateBlog: async (req, res) => {
    try {
      const categories = await Category.findAll({ order: [['name', 'ASC']] });

      res.render('user/layout', {
        contentPage: '../user/create-blog',
        categories: categories,
        user: req.user,
        title: 'Create Blog',
        isCreateBlog: true,
        activePage: "create-blog",
        error: null
      });

    } catch (error) {
      console.error('Create blog form error:', error);
      res.render('user/layout', {
        contentPage: '../user/create-blog',
        categories: [],
        user: req.user,
        title: 'Create Blog',
        error: 'Error loading categories',
        activePage: "create-blog"
      });
    }
  },

  // Handle create blog
  createBlog: async (req, res) => {
    console.log('=== CREATE BLOG CONTROLLER CALLED ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Body:', req.body);
    console.log('User:', req.user ? req.user.username : 'No user');
    
    try {
      const { title, content, category_id } = req.body;
      
      if (!title || !content) {
        console.log('Validation failed - Missing fields');
        return res.redirect('/user/blogs/create?error=missing_fields');
      }

      const blogData = {
        title: title.trim(),
        content: content.trim(),
        category_id: category_id || null,
        author_id: req.user.id,
        is_published: true
      };
      
      console.log('Creating blog with data:', blogData);
      
      const newBlog = await req.models.Blog.create(blogData);
      console.log('Blog created with ID:', newBlog.id);
      
      return res.redirect('/user/my-blogs?success=blog_created');

    } catch (error) {
      console.error('Create blog error:', error);
      return res.redirect('/user/blogs/create?error=creation_failed');
    }
  },

  // Delete user's own blog
  deleteBlog: async (req, res) => {
    try {
      await req.blog.destroy();
      res.redirect('/user/my-blogs?success=blog_deleted');
    } catch (error) {
      console.error('Delete blog error:', error);
      res.status(500).json({ success: false, message: 'Error deleting blog' });
    }
  },
  // Show edit form
/* getEditBlog: async (req, res) => {
  try {
    const blog = await req.models.Blog.findByPk(req.params.id, {
      include: req.models.Category,
    });
    if (!blog) {
      return res.redirect('/user/my-blogs?error=Blog not found');
    }
    res.render('user/layout', {
      contentPage: '../user/editBlog',
      blog,
      user: req.user,
      title: 'Edit Blog'
    });
  } catch (error) {
    console.error("Get Edit Blog error:", error);
    res.redirect('/user/my-blogs?error=Error loading edit page');
  }
}, */
getEditBlog: async (req, res) => {
  try {
    const blog = await req.models.Blog.findByPk(req.params.id, {
      include: req.models.Category,
    });

    if (!blog) {
      return res.redirect('/user/my-blogs?error=Blog not found');
    }

    // ✅ Fetch all categories for dropdown
    const categories = await req.models.Category.findAll();

    res.render('user/layout', {
      contentPage: '../user/editBlog',
      blog,
      categories,
      user: req.user,
      title: 'Edit Blog'
    });
  } catch (error) {
    console.error("Get Edit Blog error:", error);
    res.redirect('/user/my-blogs?error=Error loading edit page');
  }
},


// Handle update
updateBlog: async (req, res) => {
  try {
    console.log('=== UPDATE BLOG DEBUG ===');
    console.log('Request body:', req.body);
    console.log('Blog ID:', req.params.id);
    console.log('Current blog category_id:', req.blog.category_id);
    
    const { title, content, category_id } = req.body;
    
    const updateData = {
      title: title.trim(),
      content: content.trim(),
      category_id: category_id || null
    };
    
    console.log('Update data:', updateData);
    
    await req.blog.update(updateData);
    
    console.log('Blog updated successfully');
    res.redirect('/user/my-blogs?success=blog_updated');
  } catch (error) {
    console.error("Update Blog error:", error);
    res.redirect('/user/my-blogs?error=Error updating blog');
  }
},



  // Logout
  logout: (req, res) => {
    req.session.destroy((err) => {
      if (err) console.error('Logout error:', err);
      res.render('auth/logout');
    });
  }
};

module.exports = userController;