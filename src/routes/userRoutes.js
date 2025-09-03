
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validateUserLogin, validateBlog } = require('../middleware/validation');

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


router.get('/login', requireGuest, userController.showLogin);

// Authentication routes
router.post('/login', requireGuest, validateUserLogin, userController.login);


router.get('/dashboard', requireUser, userController.showDashboard);
router.get('/logout', isAuthenticated, userController.logout);

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
    next();
  },
  isAuthenticated,
  authorize('blogs', 'write'),
  validateBlog,
  ...userController.createBlog
);


router.post(
  '/blogs/:id/delete',
  requireUser,
  authorize('blogs', 'delete'),
  checkBlogOwnership,
  userController.deleteBlog
);

router.get(
  '/blogs/:id/edit',
  requireUser,
  authorize('blogs', 'write'),
  checkBlogOwnership,
  userController.editBlog
);

router.post(
  '/blogs/:id/edit',
  requireUser,
  authorize('blogs', 'write'),
  checkBlogOwnership,
  validateBlog,
  ...userController.updateBlog
);

router.post(
  '/api/blogs',
  isAuthenticated,
  authorize('blogs', 'write'),
  validateBlog,
  ...userController.createBlog
);

router.use((error, req, res, next) => {


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
