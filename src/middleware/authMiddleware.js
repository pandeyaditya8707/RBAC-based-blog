// // /* /* const { User, RoleAccess } = require("../models");

// // // Check if the user is logged in
// // exports.isAuthenticated = (req, res, next) => {
// //   if (req.session && req.session.userId) {
// //     return next();
// //   }
  
// //   // Store the original URL to redirect back after login
// //   if (req.method === 'GET') {
// //     req.session.returnTo = req.originalUrl;
// //   }
  
// //   return res.redirect("/user/login");
// // };

// // // Check if the user has permission for a given resource & action
// // exports.authorize = (resource, action) => {
// //   return async (req, res, next) => {
// //     if (!req.session || !req.session.userId) {
// //       // Store the original URL to redirect back after login
// //       if (req.method === 'GET') {
// //         req.session.returnTo = req.originalUrl;
// //       }
// //       return res.redirect("/user/login");
// //     }

// //     try {
// //       // Find the logged-in user
// //       const user = await User.findByPk(req.session.userId);

// //       if (!user) {
// //         req.session.destroy();
// //         return res.redirect("/user/login");
// //       }

// //       if (!user.roleId) {
// //         return res.status(403).send("Forbidden: No role assigned to your account. Please contact administrator.");
// //       }

// //       // Look up role access for the resource
// //       const permission = await RoleAccess.findOne({
// //         where: {
// //           roleId: user.roleId,
// //           resource: resource, // e.g. "users", "blogs"
// //         },
// //       });

// //       // Check if permission exists and has the required action
// //       if (permission && permission[action] === true) {
// //         // Store user info in request for easy access in controllers
// //         req.user = user;
// //         return next();
// //       }

// //       return res.status(403).send(`Forbidden: You don't have permission to ${action} ${resource}.`);
// //     } catch (error) {
// //       console.error("Authorization error:", error);
// //       return res.status(500).send("Server Error: Something went wrong. Please try again later.");
// //     }
// //   };
// // }; */
// // /* // middleware/auth.js - Enhanced unified middleware
// // const { User, RoleAccess, Role } = require("../models");

// // // Check if the user is logged in (works for both admin and user)
// // exports.isAuthenticated = (req, res, next) => {
// //   if (req.session && req.session.userId) {
// //     return next();
// //   }
  
// //   // Store the original URL to redirect back after login
// //   if (req.method === 'GET') {
// //     req.session.returnTo = req.originalUrl;
// //   }
  
// //   // Determine redirect based on the route
// //   const redirectUrl = req.originalUrl.startsWith('/admin') ? '/admin/login' : '/user/login';
// //   return res.redirect(redirectUrl);
// // };

// // // Enhanced authorization with role-based redirect
// // exports.authorize = (resource, action) => {
// //   return async (req, res, next) => {
// //     if (!req.session || !req.session.userId) {
// //       // Store the original URL to redirect back after login
// //       if (req.method === 'GET') {
// //         req.session.returnTo = req.originalUrl;
// //       }
      
// //       const redirectUrl = req.originalUrl.startsWith('/admin') ? '/admin/login' : '/user/login';
// //       return res.redirect(redirectUrl);
// //     }

// //     try {
// //       // Find the logged-in user with role information
// //       const user = await User.findByPk(req.session.userId, {
// //         include: [{
// //           model: Role,
// //           include: [RoleAccess]
// //         }]
// //       });

// //       if (!user) {
// //         req.session.destroy();
// //         const redirectUrl = req.originalUrl.startsWith('/admin') ? '/admin/login' : '/user/login';
// //         return res.redirect(redirectUrl);
// //       }

// //       if (!user.role_id) { // Note: using role_id based on your model
// //         const errorMsg = "Forbidden: No role assigned to your account. Please contact administrator.";
// //         return req.accepts('html') ? 
// //           res.status(403).render('error', { error: errorMsg }) : 
// //           res.status(403).json({ error: errorMsg });
// //       }

// //       // Look up role access for the resource
// //       const permission = await RoleAccess.findOne({
// //         where: {
// //           role_id: user.role_id, // Updated to match your model
// //           resource: resource,
// //         },
// //       });

// //       // Check if permission exists and has the required action
// //       if (permission && permission[`can_${action}`] === true) { // Updated to match your model
// //         // Store user info in request for easy access in controllers
// //         req.user = user;
// //         return next();
// //       }

// //       const errorMsg = `Forbidden: You don't have permission to ${action} ${resource}.`;
// //       return req.accepts('html') ? 
// //         res.status(403).render('error', { error: errorMsg }) : 
// //         res.status(403).json({ error: errorMsg });

// //     } catch (error) {
// //       console.error("Authorization error:", error);
// //       const errorMsg = "Server Error: Something went wrong. Please try again later.";
// //       return req.accepts('html') ? 
// //         res.status(500).render('error', { error: errorMsg }) : 
// //         res.status(500).json({ error: errorMsg });
// //     }
// //   };
// // };

// // // Role-specific authentication (for when you need specific role checks)
// // exports.requireRole = (...allowedRoles) => {
// //   return async (req, res, next) => {
// //     if (!req.session || !req.session.userId) {
// //       const redirectUrl = req.originalUrl.startsWith('/admin') ? '/admin/login' : '/user/login';
// //       return res.redirect(redirectUrl);
// //     }

// //     try {
// //       const user = await User.findByPk(req.session.userId, {
// //         include: [Role]
// //       });

// //       if (!user || !user.Role) {
// //         req.session.destroy();
// //         const redirectUrl = req.originalUrl.startsWith('/admin') ? '/admin/login' : '/user/login';
// //         return res.redirect(redirectUrl);
// //       }

// //       if (allowedRoles.includes(user.Role.name)) {
// //         req.user = user;
// //         return next();
// //       }

// //       const errorMsg = `Access denied. Required role: ${allowedRoles.join(' or ')}`;
// //       return req.accepts('html') ? 
// //         res.status(403).render('error', { error: errorMsg }) : 
// //         res.status(403).json({ error: errorMsg });

// //     } catch (error) {
// //       console.error("Role check error:", error);
// //       const errorMsg = "Server Error: Something went wrong. Please try again later.";
// //       return req.accepts('html') ? 
// //         res.status(500).render('error', { error: errorMsg }) : 
// //         res.status(500).json({ error: errorMsg });
// //     }
// //   };
// // };

// // // Admin-only authentication (shorthand)
// // exports.requireAdmin = exports.requireRole('admin');

// // // User-only authentication (shorthand for regular users)
// // exports.requireUser = exports.requireRole('user', 'author');

// // // Guest only (not logged in) - useful for login/register pages
// // exports.requireGuest = (req, res, next) => {
// //   if (req.session && req.session.userId) {
// //     // Redirect based on user role
// //     return User.findByPk(req.session.userId, { include: [Role] })
// //       .then(user => {
// //         if (user && user.Role) {
// //           const redirectUrl = user.Role.name === '/user/dashboard';
// //           return res.redirect(redirectUrl);
// //         }
// //         return res.redirect('/user/dashboard');
// //       })
// //       .catch(() => res.redirect('/user/dashboard'));
// //   }
// //   next();
// // };

// // // Middleware to add user data to templates
// // exports.addUserToLocals = async (req, res, next) => {
// //   res.locals.user = null;
// //   res.locals.isLoggedIn = false;
// //   res.locals.isAdmin = false;
// //   res.locals.userRole = null;

// //   if (req.session && req.session.userId) {
// //     try {
// //       const user = await User.findByPk(req.session.userId, {
// //         include: [Role],
// //         attributes: ['id', 'username', 'email']
// //       });
      
// //       if (user) {
// //         res.locals.user = user;
// //         res.locals.isLoggedIn = true;
// //         res.locals.userRole = user.Role ? user.Role.name : null;
// //         res.locals.isAdmin = user.Role ? user.Role.name === 'admin' : false;
// //       }
// //     } catch (error) {
// //       console.error('Error adding user to locals:', error);
// //     }
// //   }
  
// //   next();
// // };

// // // Blog ownership check (specific to blogs)
// // exports.checkBlogOwnership = async (req, res, next) => {
// //   try {
// //     const blogId = req.params.id;
// //     const userId = req.session.userId;

// //     if (!userId) {
// //       const redirectUrl = req.originalUrl.startsWith('/admin') ? '/admin/login' : '/user/login';
// //       return res.redirect(redirectUrl);
// //     }

// //     const { Blog } = require('../models');
// //     const blog = await Blog.findOne({
// //       where: { 
// //         id: blogId,
// //         author_id: userId 
// //       }
// //     });

// //     if (!blog) {
// //       const errorMsg = 'Blog not found or you do not have permission to access it';
// //       return req.accepts('html') ? 
// //         res.status(404).render('error', { error: errorMsg }) : 
// //         res.status(404).json({ error: errorMsg });
// //     }

// //     req.blog = blog;
// //     next();
// //   } catch (error) {
// //     console.error('Blog ownership check error:', error);
// //     const errorMsg = 'Server error checking blog ownership';
// //     return req.accepts('html') ? 
// //       res.status(500).render('error', { error: errorMsg }) : 
// //       res.status(500).json({ error: errorMsg });
// //   }
// // };  */
// // // middleware/authMiddleware.js - Fixed unified middleware
// // const { User, RoleAccess, Role } = require("../models");

// // // Check if the user is logged in (works for both admin and user)
// // exports.isAuthenticated = (req, res, next) => {
// //   if (req.session && req.session.userId) {
// //     return next();
// //   }
  
// //   // Store the original URL to redirect back after login
// //   if (req.method === 'GET') {
// //     req.session.returnTo = req.originalUrl;
// //   }
  
// //   // Determine redirect based on the route
// //   const redirectUrl = req.originalUrl.startsWith('/admin') ? '/admin/login' : '/user/login';
// //   return res.redirect(redirectUrl);
// // };

// // // Enhanced authorization with role-based redirect
// // exports.authorize = (resource, action) => {
// //   return async (req, res, next) => {
// //     if (!req.session || !req.session.userId) {
// //       // Store the original URL to redirect back after login
// //       if (req.method === 'GET') {
// //         req.session.returnTo = req.originalUrl;
// //       }
      
// //       const redirectUrl = req.originalUrl.startsWith('/admin') ? '/admin/login' : '/user/login';
// //       return res.redirect(redirectUrl);
// //     }

// //     try {
// //       // Find the logged-in user with role information
// //       const user = await User.findByPk(req.session.userId, {
// //         include: [{
// //           model: Role,
// //           include: [RoleAccess]
// //         }]
// //       });

// //       if (!user) {
// //         req.session.destroy();
// //         const redirectUrl = req.originalUrl.startsWith('/admin') ? '/admin/login' : '/user/login';
// //         return res.redirect(redirectUrl);
// //       }

// //       if (!user.role_id) {
// //         const errorMsg = "Forbidden: No role assigned to your account. Please contact administrator.";
// //         return req.accepts('html') ? 
// //           res.status(403).render('error', { error: errorMsg }) : 
// //           res.status(403).json({ error: errorMsg });
// //       }

// //       // Look up role access for the resource
// //       const permission = await RoleAccess.findOne({
// //         where: {
// //           role_id: user.role_id,
// //           resource: resource,
// //         },
// //       });

// //       // Check if permission exists and has the required action
// //       const actionField = `can_${action}`;
// //       if (permission && permission[actionField] === true) {
// //         // Store user info in request for easy access in controllers
// //         req.user = user;
// //         return next();
// //       }

// //       const errorMsg = `Forbidden: You don't have permission to ${action} ${resource}.`;
// //       return req.accepts('html') ? 
// //         res.status(403).render('error', { error: errorMsg }) : 
// //         res.status(403).json({ error: errorMsg });

// //     } catch (error) {
// //       console.error("Authorization error:", error);
// //       const errorMsg = "Server Error: Something went wrong. Please try again later.";
// //       return req.accepts('html') ? 
// //         res.status(500).render('error', { error: errorMsg }) : 
// //         res.status(500).json({ error: errorMsg });
// //     }
// //   };
// // };

// // // Role-specific authentication (for when you need specific role checks)
// // exports.requireRole = (...allowedRoles) => {
// //   return async (req, res, next) => {
// //     if (!req.session || !req.session.userId) {
// //       const redirectUrl = req.originalUrl.startsWith('/admin') ? '/admin/login' : '/user/login';
// //       return res.redirect(redirectUrl);
// //     }

// //     try {
// //       const user = await User.findByPk(req.session.userId, {
// //         include: [Role]
// //       });

// //       if (!user || !user.Role) {
// //         req.session.destroy();
// //         const redirectUrl = req.originalUrl.startsWith('/admin') ? '/admin/login' : '/user/login';
// //         return res.redirect(redirectUrl);
// //       }

// //       if (allowedRoles.includes(user.Role.name)) {
// //         req.user = user;
// //         return next();
// //       }

// //       const errorMsg = `Access denied. Required role: ${allowedRoles.join(' or ')}`;
// //       return req.accepts('html') ? 
// //         res.status(403).render('error', { error: errorMsg }) : 
// //         res.status(403).json({ error: errorMsg });

// //     } catch (error) {
// //       console.error("Role check error:", error);
// //       const errorMsg = "Server Error: Something went wrong. Please try again later.";
// //       return req.accepts('html') ? 
// //         res.status(500).render('error', { error: errorMsg }) : 
// //         res.status(500).json({ error: errorMsg });
// //     }
// //   };
// // };

// // // Admin-only authentication (shorthand)
// // exports.requireAdmin = exports.requireRole('admin');

// // // User-only authentication (shorthand for regular users)
// // exports.requireUser = exports.requireRole('user', 'author');

// // // Guest only (not logged in) - useful for login/register pages
// // /* exports.requireGuest = (req, res, next) => {
// //   if (req.session && req.session.userId) {
// //     // Redirect based on user role
// //     return User.findByPk(req.session.userId, { include: [Role] })
// //       .then(user => {
// //         if (user && user.Role) {
// //           // Fixed: removed the extra '/' that was causing issues
// //           const redirectUrl = user.Role.name === 'admin' ? '/admin/dashboard' : '/user/dashboard';
// //           return res.redirect(redirectUrl);
// //         }
// //         return res.redirect('/user/dashboard');
// //       })
// //       .catch(() => res.redirect('/user/dashboard'));
// //   }
// //   next();
// // }; */
// // exports.requireGuest = (req, res, next) => {
// //   // ✅ If already logged in, allow user to stay on login page (don’t redirect automatically)
// //   if (req.session && req.session.userId) {
// //     return next(); 
// //   }
// //   next();
// // };

// // // Middleware to add user data to templates
// // exports.addUserToLocals = async (req, res, next) => {
// //   res.locals.user = null;
// //   res.locals.isLoggedIn = false;
// //   res.locals.isAdmin = false;
// //   res.locals.userRole = null;

// //   if (req.session && req.session.userId) {
// //     try {
// //       const user = await User.findByPk(req.session.userId, {
// //         include: [Role],
// //         attributes: ['id', 'username', 'email']
// //       });
      
// //       if (user) {
// //         res.locals.user = user;
// //         res.locals.isLoggedIn = true;
// //         res.locals.userRole = user.Role ? user.Role.name : null;
// //         res.locals.isAdmin = user.Role ? user.Role.name === 'admin' : false;
// //       }
// //     } catch (error) {
// //       console.error('Error adding user to locals:', error);
// //     }
// //   }
  
// //   next();
// // };

// // // Blog ownership check (specific to blogs)
// // exports.checkBlogOwnership = async (req, res, next) => {
// //   try {
// //     const blogId = req.params.id;
// //     const userId = req.session.userId;

// //     if (!userId) {
// //       const redirectUrl = req.originalUrl.startsWith('/admin') ? '/admin/login' : '/user/login';
// //       return res.redirect(redirectUrl);
// //     }

// //     const { Blog } = require('../models');
// //     const blog = await Blog.findOne({
// //       where: { 
// //         id: blogId,
// //         author_id: userId 
// //       }
// //     });

// //     if (!blog) {
// //       const errorMsg = 'Blog not found or you do not have permission to access it';
// //       return req.accepts('html') ? 
// //         res.status(404).render('error', { error: errorMsg }) : 
// //         res.status(404).json({ error: errorMsg });
// //     }

// //     req.blog = blog;
// //     next();
// //   } catch (error) {
// //     console.error('Blog ownership check error:', error);
// //     const errorMsg = 'Server error checking blog ownership';
// //     return req.accepts('html') ? 
// //       res.status(500).render('error', { error: errorMsg }) : 
// //       res.status(500).json({ error: errorMsg });
// //   }
// // };
// const { User, RoleAccess, Role } = require("../models");

// // Check if the user is logged in (works for both admin and user)
// exports.isAuthenticated = (req, res, next) => {
//   if (req.session && req.session.userId) {
//     return next();
//   }
  
//   // Store the original URL to redirect back after login
//   if (req.method === 'GET') {
//     req.session.returnTo = req.originalUrl;
//   }
  
//   // Determine redirect based on the route
//   const redirectUrl = req.originalUrl.startsWith('/admin') ? '/admin/login' : '/user/login';
//   return res.redirect(redirectUrl);
// };

// // Enhanced authorization with role-based redirect
// exports.authorize = (resource, action) => {
//   return async (req, res, next) => {
//     if (!req.session || !req.session.userId) {
//       // Store the original URL to redirect back after login
//       if (req.method === 'GET') {
//         req.session.returnTo = req.originalUrl;
//       }
      
//       const redirectUrl = req.originalUrl.startsWith('/admin') ? '/admin/login' : '/user/login';
//       return res.redirect(redirectUrl);
//     }

//     try {
//       // Find the logged-in user with role information
//       const user = await User.findByPk(req.session.userId, {
//         include: [{
//           model: Role,
//           include: [RoleAccess]
//         }]
//       });

//       if (!user) {
//         req.session.destroy();
//         const redirectUrl = req.originalUrl.startsWith('/admin') ? '/admin/login' : '/user/login';
//         return res.redirect(redirectUrl);
//       }

//       if (!user.role_id) {
//         const errorMsg = "Forbidden: No role assigned to your account. Please contact administrator.";
//         return req.accepts('html') ? 
//           res.status(403).render('error', { error: errorMsg }) : 
//           res.status(403).json({ error: errorMsg });
//       }

//       // Look up role access for the resource
//       const permission = await RoleAccess.findOne({
//         where: {
//           role_id: user.role_id,
//           resource: resource,
//         },
//       });

//       // Check if permission exists and has the required action
//       const actionField = `can_${action}`;
//       if (permission && permission[actionField] === true) {
//         // Store user info in request for easy access in controllers
//         req.user = user;
//         return next();
//       }

//       const errorMsg = `Forbidden: You don't have permission to ${action} ${resource}.`;
//       return req.accepts('html') ? 
//         res.status(403).render('error', { error: errorMsg }) : 
//         res.status(403).json({ error: errorMsg });

//     } catch (error) {
//       console.error("Authorization error:", error);
//       const errorMsg = "Server Error: Something went wrong. Please try again later.";
//       return req.accepts('html') ? 
//         res.status(500).render('error', { error: errorMsg }) : 
//         res.status(500).json({ error: errorMsg });
//     }
//   };
// };

// // Role-specific authentication (for when you need specific role checks)
// exports.requireRole = (...allowedRoles) => {
//   return async (req, res, next) => {
//     if (!req.session || !req.session.userId) {
//       const redirectUrl = req.originalUrl.startsWith('/admin') ? '/admin/login' : '/user/login';
//       return res.redirect(redirectUrl);
//     }

//     try {
//       const user = await User.findByPk(req.session.userId, {
//         include: [Role]
//       });

//       if (!user || !user.Role) {
//         req.session.destroy();
//         const redirectUrl = req.originalUrl.startsWith('/admin') ? '/admin/login' : '/user/login';
//         return res.redirect(redirectUrl);
//       }

//       if (allowedRoles.includes(user.Role.name)) {
//         req.user = user;
//         return next();
//       }

//       const errorMsg = `Access denied. Required role: ${allowedRoles.join(' or ')}`;
//       return req.accepts('html') ? 
//         res.status(403).render('error', { error: errorMsg }) : 
//         res.status(403).json({ error: errorMsg });

//     } catch (error) {
//       console.error("Role check error:", error);
//       const errorMsg = "Server Error: Something went wrong. Please try again later.";
//       return req.accepts('html') ? 
//         res.status(500).render('error', { error: errorMsg }) : 
//         res.status(500).json({ error: errorMsg });
//     }
//   };
// };

// // Admin-only authentication (shorthand)
// exports.requireAdmin = exports.requireRole('admin');

// // User-only authentication (shorthand for regular users)
// exports.requireUser = exports.requireRole('user', 'author');

// // Guest only (not logged in) - useful for login/register pages
// /* exports.requireGuest = (req, res, next) => {
//   if (req.session && req.session.userId) {
//     // Redirect based on user role
//     return User.findByPk(req.session.userId, { include: [Role] })
//       .then(user => {
//         if (user && user.Role) {
//           // Fixed: removed the extra '/' that was causing issues
//           const redirectUrl = user.Role.name === 'admin' ? '/admin/dashboard' : '/user/dashboard';
//           return res.redirect(redirectUrl);
//         }
//         return res.redirect('/user/dashboard');
//       })
//       .catch(() => res.redirect('/user/dashboard'));
//   }
//   next();
// }; */
// exports.requireGuest = (req, res, next) => {
//   // ✅ If already logged in, allow user to stay on login page (don’t redirect automatically)
//   if (req.session && req.session.userId) {
//     return next(); 
//   }
//   next();
// };

// // Middleware to add user data to templates
// exports.addUserToLocals = async (req, res, next) => {
//   res.locals.user = null;
//   res.locals.isLoggedIn = false;
//   res.locals.isAdmin = false;
//   res.locals.userRole = null;

//   if (req.session && req.session.userId) {
//     try {
//       const user = await User.findByPk(req.session.userId, {
//         include: [Role],
//         attributes: ['id', 'username', 'email']
//       });
      
//       if (user) {
//         res.locals.user = user;
//         res.locals.isLoggedIn = true;
//         res.locals.userRole = user.Role ? user.Role.name : null;
//         res.locals.isAdmin = user.Role ? user.Role.name === 'admin' : false;
//       }
//     } catch (error) {
//       console.error('Error adding user to locals:', error);
//     }
//   }
  
//   next();
// };

// // Blog ownership check (specific to blogs)
// exports.checkBlogOwnership = async (req, res, next) => {
//   try {
//     const blogId = req.params.id;
//     const userId = req.session.userId;

//     if (!userId) {
//       const redirectUrl = req.originalUrl.startsWith('/admin') ? '/admin/login' : '/user/login';
//       return res.redirect(redirectUrl);
//     }

//     const { Blog } = require('../models');
//     const blog = await Blog.findOne({
//       where: { 
//         id: blogId,
//         author_id: userId 
//       }
//     });

//     if (!blog) {
//       const errorMsg = 'Blog not found or you do not have permission to access it';
//       return req.accepts('html') ? 
//         res.status(404).render('error', { error: errorMsg }) : 
//         res.status(404).json({ error: errorMsg });
//     }

//     req.blog = blog;
//     next();
//   } catch (error) {
//     console.error('Blog ownership check error:', error);
//     const errorMsg = 'Server error checking blog ownership';
//     return req.accepts('html') ? 
//       res.status(500).render('error', { error: errorMsg }) : 
//       res.status(500).json({ error: errorMsg });
//   }
// };
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

// User-only authentication (shorthand for regular users)
exports.requireUser = exports.requireRole('Author');

// Guest only (not logged in) - useful for login/register pages
/* exports.requireGuest = (req, res, next) => {
  if (req.session && req.session.userId) {
    // Redirect based on user role
    return User.findByPk(req.session.userId, { include: [Role] })
      .then(user => {
        if (user && user.Role) {
          // Fixed: removed the extra '/' that was causing issues
          const redirectUrl = user.Role.name === 'admin' ? '/admin/dashboard' : '/user/dashboard';
          return res.redirect(redirectUrl);
        }
        return res.redirect('/user/dashboard');
      })
      .catch(() => res.redirect('/user/dashboard'));
  }
  next();
}; */
exports.requireGuest = (req, res, next) => {
  // ✅ If already logged in, allow user to stay on login page (don’t redirect automatically)
  if (req.session && req.session.userId) {
    return next(); 
  }
  next();
};

// Middleware to add user data to templates
exports.addUserToLocals = async (req, res, next) => {
  res.locals.user = null;
  res.locals.isLoggedIn = false;
  res.locals.isAdmin = false;
  res.locals.userRole = null;

  if (req.session && req.session.userId) {
    try {
      const user = await User.findByPk(req.session.userId, {
        include: [Role],
        attributes: ['id', 'username', 'email']
      });
      
      if (user) {
        res.locals.user = user;
        res.locals.isLoggedIn = true;
        res.locals.userRole = user.Role ? user.Role.name : null;
        res.locals.isAdmin = user.Role ? user.Role.name === 'admin' : false;
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