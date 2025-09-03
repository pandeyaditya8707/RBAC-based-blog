const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { isAuthenticated, authorize } = require('../middleware/authMiddleware');

// Create a comment 
router.post('/', commentController.createComment);

// Get comments for a blog 
router.get('/blog/:blogId', isAuthenticated, commentController.getComments);

// Delete a comment 
router.delete('/:commentId', commentController.deleteComment);

module.exports = router;
