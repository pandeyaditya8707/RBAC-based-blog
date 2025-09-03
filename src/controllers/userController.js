// controllers/userController.js
const bcrypt = require('bcryptjs');
const { User, Role, RoleAccess, Blog, Category } = require('../models');
const { validateUserLogin, validateBlog } = require('../middleware/validation');
const { handleBlogImageUpload } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

const userController = {
  
 //showlogin
  showLogin: (req, res) => {
    const error = req.query.error;
    const success = req.query.success;
    res.render('auth/login', { error, success });
  },



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

      //admin login ni kr skta
      if (user.Role.name === 'admin') {
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
    const limit = 4;
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
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const offset = (page - 1) * limit;

    const { count, rows: blogs } = await Blog.findAndCountAll({
      where: { author_id: req.user.id },
      include: [{ model: Category, attributes: ['name'] }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const totalPages = Math.ceil(count / limit);

    res.render('user/layout', {
      contentPage: '../user/my-blogs',
      blogs,
      currentPage: page,
      totalPages,
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
      currentPage: 1,
      totalPages: 1,
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
  createBlog: [handleBlogImageUpload, async (req, res) => {
    
    try {
    
      
      const { title, content, category_id } = req.body;
      
      if (!title || !content) {
        console.log('Validation failed - Missing fields');
        return res.redirect('/user/blogs/create?error=missing_fields');
      }

      // Handle upload error
      if (req.uploadError) {
        console.log('Upload error detected:', req.uploadError);
        return res.redirect(`/user/blogs/create?error=${encodeURIComponent(req.uploadError)}`);
      }

      const blogData = {
        title: title.trim(),
        content: content.trim(),
        category_id: category_id || null,
        author_id: req.user.id,
        is_published: true,
        image: req.file ? req.file.filename : null
      };
      
      console.log('Blog data to create:', blogData);
      
      const newBlog = await req.models.Blog.create(blogData);
      
   
      return res.redirect('/user/my-blogs?success=blog_created');

    } catch (error) {
      console.error('Create blog error:', error);
      return res.redirect('/user/blogs/create?error=creation_failed');
    }
  }],

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

  // Handle edit blog page
  editBlog: async (req, res) => {
  try {
    const blog = await req.models.Blog.findByPk(req.params.id, {
      include: req.models.Category,
    });

    if (!blog) {
      return res.redirect('/user/my-blogs?error=Blog not found');
    }

   
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
updateBlog: [handleBlogImageUpload, async (req, res) => {
  try {
   
    
    const { title, content, category_id } = req.body;
    
    // Handle upload error
    if (req.uploadError) {
      return res.redirect(`/user/blogs/${req.params.id}/edit?error=${encodeURIComponent(req.uploadError)}`);
    }
    
    const updateData = {
      title: title.trim(),
      content: content.trim(),
      category_id: category_id || null
    };
    
    // Handle image update
    if (req.file) {
      // Delete old image if exists
      if (req.blog.image) {
        const oldImagePath = path.join(__dirname, '../../uploads/blogs', req.blog.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updateData.image = req.file.filename;
    }
    
    console.log('Update data:', updateData);
    
    await req.blog.update(updateData);
    
    console.log('Blog updated successfully');
    res.redirect('/user/my-blogs?success=blog_updated');
  } catch (error) {
    console.error("Update Blog error:", error);
    res.redirect('/user/my-blogs?error=Error updating blog');
  }
}],

  logout: (req, res) => {
    req.session.destroy((err) => {
      if (err) console.error('Logout error:', err);
      res.render('auth/logout');
    });
  }
};

module.exports = userController;