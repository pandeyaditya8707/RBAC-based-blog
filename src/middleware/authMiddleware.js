
const { User, RoleAccess, Role } = require("../models");

// Check if the user is logged in (works for both admin and user)
exports.isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  
  // Store the original URL to redirect back after login
  if (req.method === 'GET') {
    req.session.returnTo = req.originalUrl;
  }
  
  // Determine redirect based on the route
  const redirectUrl = req.originalUrl.startsWith('/admin') ? '/admin/login' : '/user/login';
  return res.redirect(redirectUrl);
};

// Enhanced authorization with role-based redirect
exports.authorize = (resource, action) => {
  return async (req, res, next) => {
    if (!req.session || !req.session.userId) {
      // Store the original URL to redirect back after login
      if (req.method === 'GET') {
        req.session.returnTo = req.originalUrl;
      }
      
      const redirectUrl = req.originalUrl.startsWith('/admin') ? '/admin/login' : '/user/login';
      return res.redirect(redirectUrl);
    }

    try {
      // Find the logged-in user with role information
      const user = await User.findByPk(req.session.userId, {
        include: [{
          model: Role,
          include: [RoleAccess]
        }]
      });

      if (!user) {
        req.session.destroy();
        const redirectUrl = req.originalUrl.startsWith('/admin') ? '/admin/login' : '/user/login';
        return res.redirect(redirectUrl);
      }

      if (!user.role_id) {
        const errorMsg = "Forbidden: No role assigned to your account. Please contact administrator.";
        return req.accepts('html') ? 
          res.status(403).render('error', { error: errorMsg }) : 
          res.status(403).json({ error: errorMsg });
      }

      // Look up role access for the resource
      const permission = await RoleAccess.findOne({
        where: {
          role_id: user.role_id,
          resource: resource,
        },
      });

      // Check if permission exists and has the required action
      //check kr lega carwrite can read wali chiz
      const actionField = `can_${action}`;
      if (permission && permission[actionField] === true) {
        // Store user info in request for easy access in controllers
        req.user = user;
        return next();
      }

      const errorMsg = `Forbidden: You don't have permission to ${action} ${resource}.`;
      return req.accepts('html') ? 
        res.status(403).render('error', { error: errorMsg }) : 
        res.status(403).json({ error: errorMsg });

    } catch (error) {
      console.error("Authorization error:", error);
      const errorMsg = "Server Error: Something went wrong. Please try again later.";
      return req.accepts('html') ? 
        res.status(500).render('error', { error: errorMsg }) : 
        res.status(500).json({ error: errorMsg });
    }
  };
};

// Role-specific authentication (for when you need specific role checks)
exports.requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    if (!req.session || !req.session.userId) {
      const redirectUrl = req.originalUrl.startsWith('/admin') ? '/admin/login' : '/user/login';
      return res.redirect(redirectUrl);
    }

    try {
      const user = await User.findByPk(req.session.userId, {
        include: [Role]
      });

      if (!user || !user.Role) {
        req.session.destroy();
        const redirectUrl = req.originalUrl.startsWith('/admin') ? '/admin/login' : '/user/login';
        return res.redirect(redirectUrl);
      }

      if (allowedRoles.includes(user.Role.name)) {
        req.user = user;
        return next();
      }

      const errorMsg = `Access denied. Required role: ${allowedRoles.join(' or ')}`;
      return req.accepts('html') ? 
        res.status(403).render('error', { error: errorMsg }) : 
        res.status(403).json({ error: errorMsg });

    } catch (error) {
      console.error("Role check error:", error);
      const errorMsg = "Server Error: Something went wrong. Please try again later.";
      return req.accepts('html') ? 
        res.status(500).render('error', { error: errorMsg }) : 
        res.status(500).json({ error: errorMsg });
    }
  };
};

// Admin-only authentication (shorthand)
exports.requireAdmin = exports.requireRole('Admin');

// User-only authentication - allows any user with a role (not admin)
exports.requireUser = async (req, res, next) => {
  if (!req.session || !req.session.userId) {
    const redirectUrl = req.originalUrl.startsWith('/admin') ? '/admin/login' : '/user/login';
    return res.redirect(redirectUrl);
  }

  try {
    const user = await User.findByPk(req.session.userId, {
      include: [Role]
    });

    if (!user || !user.Role) {
      req.session.destroy();
      const redirectUrl = req.originalUrl.startsWith('/admin') ? '/admin/login' : '/user/login';
      return res.redirect(redirectUrl);
    }

    // Block admin users from using user routes
    if (user.Role.name === 'admin') {
      const errorMsg = 'Admin users should use the admin panel';
      return req.accepts('html') ? 
        res.status(403).render('error', { error: errorMsg }) : 
        res.status(403).json({ error: errorMsg });
    }

    req.user = user;
    return next();

  } catch (error) {
    console.error("User authentication error:", error);
    const errorMsg = "Server Error: Something went wrong. Please try again later.";
    return req.accepts('html') ? 
      res.status(500).render('error', { error: errorMsg }) : 
      res.status(500).json({ error: errorMsg });
  }
};

exports.requireGuest = (req, res, next) => {
  // If already logged in, redirect to appropriate dashboard
  if (req.session && req.session.userId) {
    // Check if it's an admin route
    if (req.originalUrl.includes('/admin')) {
      return res.redirect('/admin/users');
    }
    return res.redirect('/user/dashboard');
  }
  next();
};

// Middleware to add user data to templates
exports.addUserToLocals = async (req, res, next) => {
  res.locals.user = null;
  res.locals.isLoggedIn = false;
  res.locals.isAdmin = false;
  res.locals.userRole = null;
  res.locals.userPermissions = {};

  if (req.session && req.session.userId) {
    try {
      const user = await User.findByPk(req.session.userId, {
        include: [{
          model: Role,
          include: [RoleAccess]
        }],
        attributes: ['id', 'username', 'email']
      });
      
      if (user) {
        res.locals.user = user;
        res.locals.isLoggedIn = true;
        res.locals.userRole = user.Role ? user.Role.name : null;
        res.locals.isAdmin = user.Role ? user.Role.name === 'admin' : false;
        
        // Build permissions object for easy access in templates
        const permissions = {};
        if (user.Role && user.Role.RoleAccesses) {
          user.Role.RoleAccesses.forEach(access => {
            permissions[access.resource] = {
              can_read: access.can_read,
              can_write: access.can_write,
              can_delete: access.can_delete,
              can_comment: access.can_comment
            };
          });
        }
        res.locals.userPermissions = permissions;
        req.user = user; // Also set req.user for controllers
      }
    } catch (error) {
      console.error('Error adding user to locals:', error);
    }
  }
  
  next();
};

// Blog ownership check (specific to blogs)
exports.checkBlogOwnership = async (req, res, next) => {
  try {
    const blogId = req.params.id;
    const userId = req.session.userId;

    if (!userId) {
      const redirectUrl = req.originalUrl.startsWith('/admin') ? '/admin/login' : '/user/login';
      return res.redirect(redirectUrl);
    }

    const { Blog } = require('../models');
    const blog = await Blog.findOne({
      where: { 
        id: blogId,
        author_id: userId 
      }
    });

    if (!blog) {
      const errorMsg = 'Blog not found or you do not have permission to access it';
      return req.accepts('html') ? 
        res.status(404).render('error', { error: errorMsg }) : 
        res.status(404).json({ error: errorMsg });
    }

    req.blog = blog;
    next();
  } catch (error) {
    console.error('Blog ownership check error:', error);
    const errorMsg = 'Server error checking blog ownership';
    return req.accepts('html') ? 
      res.status(500).render('error', { error: errorMsg }) : 
      res.status(500).json({ error: errorMsg });
  }
};