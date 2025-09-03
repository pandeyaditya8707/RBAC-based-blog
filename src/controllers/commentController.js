const { Comment, User, Blog, RoleAccess } = require('../models');

const commentController = {
  // Create a new comment
  async createComment(req, res) {
    try {
      const { blogId, content } = req.body;
      const userId = req.session.userId;

      // Check if user is logged in
      if (!userId) {
        console.log('ERROR: No userId in session');
        return res.status(401).json({ 
          success: false, 
          message: 'User not authenticated' 
        });
      }

      // Validate input
      if (!blogId || !content || !content.trim()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Blog ID and content are required' 
        });
      }

      console.log('Creating comment with:', { blogId, content: content.trim(), userId });

      // Create comment directly without checking blog existence for now
      const comment = await Comment.create({
        content: content.trim(),
        user_id: userId,
        blog_id: blogId
      });

      console.log('Comment created successfully:', comment.id);

      // Get comment with user info for response
      const commentWithUser = await Comment.findByPk(comment.id, {
        include: [{
          model: User,
          attributes: ['username']
        }]
      });

      console.log('Returning success response');
      res.json({ 
        success: true, 
        comment: commentWithUser,
        message: 'Comment created successfully' 
      });
    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create comment: ' + error.message 
      });
    }
  },

  // Get comments for a blog)
  async getComments(req, res) {
    try {
      const { blogId } = req.params;
      const userId = req.session.userId;
      
      // Get user with role information
      const user = await User.findByPk(userId, {
        include: [{ model: require('../models').Role }]
      });
      
      if (!user || !user.Role) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not found or no role assigned' 
        });
      }
      
      const userRoleId = user.role_id;

      // Check if user has comment permissions (read OR comment)
      const commentAccess = await RoleAccess.findOne({
        where: {
          role_id: userRoleId,
          resource: 'comments'
        }
      });

      // If user doesn't have any comment permissions, return empty array
      if (!commentAccess || (!commentAccess.can_read && !commentAccess.can_comment)) {
        return res.json({ 
          success: true, 
          comments: [] 
        });
      }

      // Get comments for the blog
      const comments = await Comment.findAll({
        where: { blog_id: blogId },
        include: [{
          model: User,
          attributes: ['username']
        }],
        order: [['createdAt', 'DESC']]
      });

      res.json({ 
        success: true, 
        comments 
      });
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch comments' 
      });
    }
  },

  // Delete a comment
  async deleteComment(req, res) {
    try {
      const { commentId } = req.params;
      const userId = req.session.userId;
      
      // Get user with role information
      const user = await User.findByPk(userId, {
        include: [{ model: require('../models').Role }]
      });
      
      if (!user || !user.Role) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not found or no role assigned' 
        });
      }
      
      const userRoleId = user.role_id;

      // Find the comment
      const comment = await Comment.findByPk(commentId);
      if (!comment) {
        return res.status(404).json({ 
          success: false, 
          message: 'Comment not found' 
        });
      }

      // has delete permission
      const isOwner = comment.user_id === userId;
      
      let hasDeletePermission = false;
      if (!isOwner) {
        const commentAccess = await RoleAccess.findOne({
          where: {
            role_id: userRoleId,
            resource: 'comments'
          }
        });
        hasDeletePermission = commentAccess && commentAccess.can_delete;
      }

      if (!isOwner && !hasDeletePermission) {
        return res.status(403).json({ 
          success: false, 
          message: 'Not authorized to delete this comment' 
        });
      }

      await comment.destroy();

      res.json({ 
        success: true, 
        message: 'Comment deleted successfully' 
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to delete comment' 
      });
    }
  }
};

module.exports = commentController;
