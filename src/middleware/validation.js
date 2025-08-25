const Joi = require('joi');

// User validation schemas
const userRegistrationSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.alphanum': 'Username must contain only alphanumeric characters',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username cannot exceed 30 characters',
      'any.required': 'Username is required'
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(6)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'Password is required'
    }),
  role_id: Joi.number()
    .integer()
    .positive()
    .optional()
});

const userLoginSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.alphanum': 'Username must contain only alphanumeric characters',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username cannot exceed 30 characters',
      'any.required': 'Username is required'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

// Blog validation schemas
const blogSchema = Joi.object({
  title: Joi.string()
    .min(5)
    .max(200)
    .required()
    .messages({
      'string.min': 'Blog title must be at least 5 characters long',
      'string.max': 'Blog title cannot exceed 200 characters',
      'any.required': 'Blog title is required'
    }),
  content: Joi.string()
    .min(10)
    .required()
    .messages({
      'string.min': 'Blog content must be at least 10 characters long',
      'any.required': 'Blog content is required'
    }),
  category_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .allow(null, '')
    .messages({
      'number.positive': 'Please select a valid category'
    })
});

// Category validation schema
const categorySchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'Category name must be at least 2 characters long',
      'string.max': 'Category name cannot exceed 50 characters',
      'any.required': 'Category name is required'
    }),
  description: Joi.string()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Category description cannot exceed 500 characters'
    })
});

// Comment validation schema
const commentSchema = Joi.object({
  content: Joi.string()
    .min(5)
    .max(1000)
    .required()
    .messages({
      'string.min': 'Comment must be at least 5 characters long',
      'string.max': 'Comment cannot exceed 1000 characters',
      'any.required': 'Comment content is required'
    }),
  blog_id: Joi.number()
    .integer()
    .positive()
    .required()
});

// Admin validation schemas
const adminLoginSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.alphanum': 'Username must contain only alphanumeric characters',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username cannot exceed 30 characters',
      'any.required': 'Username is required'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

// Validation middleware function
const validateRequest = (schema) => {
  return (req, res, next) => {
    console.log('=== VALIDATION MIDDLEWARE ===');
    console.log('Validating:', req.body);
    
    const { error } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true 
    });
    
    if (error) {
      console.log('Validation errors:', error.details.map(d => d.message));
      const errorMessages = error.details.map(detail => detail.message);
      
      // Check if it's an AJAX request
      if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errorMessages
        });
      }
      
      // For blog creation, redirect with error
      if (req.originalUrl.includes('/blogs/create')) {
        return res.redirect('/user/blogs/create?error=' + encodeURIComponent(errorMessages[0]));
      }
      
      // For regular form submissions, flash the errors and redirect back
      req.session.errors = errorMessages;
      req.session.formData = req.body;
      
      // Get the referer or fallback to a safe default
      const referer = req.get('Referer');
      if (referer && !referer.includes('/user/back')) {
        return res.redirect(referer);
      }
      
      // Fallback redirects based on the route
      if (req.originalUrl.includes('/user/login')) {
        return res.redirect('/user/login');
      } else if (req.originalUrl.includes('/user/register')) {
        return res.redirect('/user/register');
      } else if (req.originalUrl.includes('/admin/login')) {
        return res.redirect('/admin/login');
      }
      
      // Default fallback
      return res.redirect('/');
    }
    
    console.log('Validation passed');
    next();
  };
};

// Export schemas and middleware
module.exports = {
  // Schemas
  userRegistrationSchema,
  userLoginSchema,
  blogSchema,
  categorySchema,
  commentSchema,
  adminLoginSchema,
  
  // Middleware
  validateRequest,
  
  // Specific validation middlewares
  validateUserRegistration: validateRequest(userRegistrationSchema),
  validateUserLogin: validateRequest(userLoginSchema),
  validateBlog: validateRequest(blogSchema),
  validateCategory: validateRequest(categorySchema),
  validateComment: validateRequest(commentSchema),
  validateAdminLogin: validateRequest(adminLoginSchema)
};
