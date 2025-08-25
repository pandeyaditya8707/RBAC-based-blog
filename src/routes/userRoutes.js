// // routes/userRoutes.js - Updated to use your existing middleware pattern
// const express = require('express');
// const router = express.Router();
// const userController = require('../controllers/userController');
// const { 
//   isAuthenticated, 
//   authorize, 
//   requireUser, 
//   requireGuest, 
//   addUserToLocals,
//   checkBlogOwnership 
// } = require("../middleware/authMiddleware"); // Using your unified middleware

// // Apply user data to all routes
// router.use(addUserToLocals);

// // Public routes (guest only)
// router.get('/login', requireGuest, userController.showLogin);
// router.get('/register', requireGuest, userController.showRegister);

// // Authentication routes
// router.post('/login', requireGuest, userController.login);
// router.post('/register', requireGuest, userController.register);

// // Protected routes (require authentication and user role)
// router.get('/dashboard', requireUser, userController.showDashboard);
// router.get('/logout', isAuthenticated, userController.logout);

// // Blog routes with your existing authorize middleware
// router.get('/blogs', 
//   isAuthenticated, 
//   authorize('blogs', 'read'), 
//   userController.showBlogs
// );

// router.get('/my-blogs', 
//   requireUser, 
//   userController.showMyBlogs
// );

// router.get('/blogs/create', 
//   isAuthenticated, 
//   authorize('blogs', 'write'), 
//   userController.showCreateBlog
// );

// router.post('/blogs/create', 
//   isAuthenticated, 
//   authorize('blogs', 'write'), 
//   userController.createBlog
// );

// // Blog management routes (require ownership)
// /* router.delete('/blogs/:id', 
//   requireUser, 
//   checkBlogOwnership, 
//   userController.deleteBlog
// ); */
// router.post('/blogs/:id/delete',
//   requireUser,
//   checkBlogOwnership,
//   userController.deleteBlog
// );
// router.get('/blogs/:id/edit',
//   requireUser,
//   checkBlogOwnership,
//   userController.getEditBlog
// );

// // Update Blog (handle form submission)
// router.post('/blogs/:id/edit',
//   requireUser,
//   checkBlogOwnership,
//   userController.updateBlog
// );

// // API routes for AJAX calls
//  router.post('/api/blogs', 
//   isAuthenticated, 
//   authorize('blogs', 'write'), 
//   userController.createBlog
// ); 

// // Error handling middleware specific to user routes
// router.use((error, req, res, next) => {
//   console.error('User route error:', error);
  
//   if (req.accepts('html')) {
//     res.render('user/error', {
//       error: 'An error occurred. Please try again.',
//       user: req.user || null
//     });
//   } else {
//     res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// });

// // Handle 404 for user routes
// router.use((req, res) => {
//   if (req.accepts('html')) {
//     res.status(404).render('auth/404', {
//       user: req.user || null
//     });
//   } else {
//     res.status(404).json({
//       success: false,
//       message: 'Route not found'
//     });
//   }
// });
// // Edit Blog (show form)


// module.exports = router;
// routes/userRoutes.js - Updated with role-based permissions
// routes/userRoutes.js - Updated to use your existing middleware pattern
// // routes/userRoutes.js - Updated to use your existing middleware pattern
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validateUserLogin, validateUserRegistration, validateBlog } = require('../middleware/validation');

const {
  isAuthenticated,
  authorize,
  requireUser,
  requireGuest,
  addUserToLocals,
  checkBlogOwnership
} = require("../middleware/authMiddleware");

// Apply user data to all routes
router.use(addUserToLocals);

// ---------------- Public routes (guest only) ----------------
router.get('/login', requireGuest, userController.showLogin);
router.get('/register', requireGuest, userController.showRegister);

// ---------------- Authentication routes ----------------
router.post('/login', requireGuest, validateUserLogin, userController.login);
router.post('/register', requireGuest, validateUserRegistration, userController.register);

// ---------------- Protected routes ----------------
router.get('/dashboard', requireUser, userController.showDashboard);
router.get('/logout', isAuthenticated, userController.logout);

// ---------------- Blog routes ----------------
router.get(
  '/blogs',
  isAuthenticated,
  authorize('blogs', 'read'),
  userController.showBlogs
);

router.get('/my-blogs', requireUser, userController.showMyBlogs);

router.get(
  '/blogs/create',
  isAuthenticated,
  authorize('blogs', 'write'),
  userController.showCreateBlog
);

router.post(
  '/blogs/create',
  (req, res, next) => {
    console.log('=== BLOG CREATE ROUTE HIT ===');
    console.log('Method:', req.method);
    console.log('URL:', req.originalUrl);
    console.log('Body:', req.body);
    console.log('User:', req.user ? req.user.username : 'No user');
    next();
  },
  isAuthenticated,
  authorize('blogs', 'write'),
  validateBlog,
  userController.createBlog
);

// ---------------- Blog management routes (require ownership) ----------------
/*
router.delete(
  '/blogs/:id',
  requireUser,
  checkBlogOwnership,
  userController.deleteBlog
);
*/

router.post(
  '/blogs/:id/delete',
  requireUser,
  checkBlogOwnership,
  userController.deleteBlog
);

router.get(
  '/blogs/:id/edit',
  requireUser,
  checkBlogOwnership,
  userController.getEditBlog
);

router.post(
  '/blogs/:id/edit',
  requireUser,
  checkBlogOwnership,
  validateBlog,
  userController.updateBlog
);

// ---------------- API routes (AJAX calls) ----------------
router.post(
  '/api/blogs',
  isAuthenticated,
  authorize('blogs', 'write'),
  validateBlog,
  userController.createBlog
);

// ---------------- Error handling ----------------
router.use((error, req, res, next) => {
  console.error('User route error:', error);

  if (req.accepts('html')) {
    res.render('user/layout', {
      contentPage: '../user/error',
      error: 'An error occurred. Please try again.',
      user: req.user || null,
      title: 'Error'
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ---------------- Handle 404 for user routes ----------------
router.use((req, res) => {
  if (req.accepts('html')) {
    res.status(404).render('auth/404', {
      user: req.user || null
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Route not found'
    });
  }
});

module.exports = router;
