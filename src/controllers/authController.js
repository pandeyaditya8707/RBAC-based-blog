const { User, Role, PasswordReset } = require("../models");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { validateUserLogin, validateAdminLogin } = require("../middleware/validation");
const { sendPasswordResetEmail } = require("../configs/email");

// Render the admin login page
exports.getAdminLogin = (req, res) => {
  res.render("auth/AdminLogin");
};

// Handle admin login
exports.postAdminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({
      where: { username },
      include: [{ model: Role }]
    });

    if (!user || !user.Role || user.Role.name !== "admin") {
      return res.render("auth/AdminLogin", { error: "Invalid credentials" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.render("auth/AdminLogin", { error: "Invalid credentials" });
    }

    // Save admin session
    req.session.userId = user.id;
    req.session.roleId = user.roleId;

    res.redirect("/admin/users");
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).send("Server Error");
  }
};

// Handle logout
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Error logging out.");
    }
    
    res.clearCookie('sessionId');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    res.redirect("/user/login");
  });
};

exports.getForgotPassword = (req, res) => {
  res.render("auth/ForgotPassword", { 
    error: null, 
    success: null 
  });
};

// Handle forgot password request
exports.postForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.render("auth/ForgotPassword", { 
        error: "Email is required", 
        success: null 
      });
    }

    // Check if user exists
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.render("auth/ForgotPassword", { 
        error: null, 
        success: "If an account with that email exists, you will receive a password reset link." 
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token to database
    await PasswordReset.create({
      email: email,
      token: resetToken,
      expires_at: expiresAt,
      used: false
    });

   
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;

    // Send email
    const emailResult = await sendPasswordResetEmail(email, resetToken, resetUrl);

    if (emailResult.success) {
      res.render("auth/ForgotPassword", { 
        error: null, 
        success: "Password reset link has been sent to your email address." 
      });
    } else {
      res.render("auth/ForgotPassword", { 
        error: "Failed to send reset email. Please try again later.", 
        success: null 
      });
    }

  } catch (error) {
    console.error("Forgot password error:", error);
    res.render("auth/ForgotPassword", { 
      error: "An error occurred. Please try again later.", 
      success: null 
    });
  }
};

// Render reset password page
exports.getResetPassword = async (req, res) => {
  try {
    const { token } = req.params;

    // Verify token exists and is not expired
    const resetRequest = await PasswordReset.findOne({
      where: {
        token: token,
        used: false,
        expires_at: {
          [require('sequelize').Op.gt]: new Date()
        }
      }
    });

    if (!resetRequest) {
      return res.render("auth/ResetPassword", { 
        error: "Invalid or expired reset token", 
        success: null,
        token: null
      });
    }

    res.render("auth/ResetPassword", { 
      error: null, 
      success: null,
      token: token
    });

  } catch (error) {
    console.error("Reset password page error:", error);
    res.render("auth/ResetPassword", { 
      error: "An error occurred. Please try again later.", 
      success: null,
      token: null
    });
  }
};

// Handle password reset
exports.postResetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    // Validate passwords
    if (!password || !confirmPassword) {
      return res.render("auth/ResetPassword", { 
        error: "Both password fields are required", 
        success: null,
        token: token
      });
    }

    if (password !== confirmPassword) {
      return res.render("auth/ResetPassword", { 
        error: "Passwords do not match", 
        success: null,
        token: token
      });
    }

    if (password.length < 6) {
      return res.render("auth/ResetPassword", { 
        error: "Password must be at least 6 characters long", 
        success: null,
        token: token
      });
    }

    // Verify token
    const resetRequest = await PasswordReset.findOne({
      where: {
        token: token,
        used: false,
        expires_at: {
          [require('sequelize').Op.gt]: new Date()
        }
      }
    });

    if (!resetRequest) {
      return res.render("auth/ResetPassword", { 
        error: "Invalid or expired reset token", 
        success: null,
        token: null
      });
    }

    // Find user and update password
    const user = await User.findOne({ where: { email: resetRequest.email } });
    
    if (!user) {
      return res.render("auth/ResetPassword", { 
        error: "User not found", 
        success: null,
        token: null
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    await user.update({ password: hashedPassword });

    // Mark reset token as used
    await resetRequest.update({ used: true });

    res.render("auth/ResetPassword", { 
      error: null, 
      success: "Password has been reset successfully. You can now login with your new password.",
      token: null
    });

  } catch (error) {
    console.error("Reset password error:", error);
    res.render("auth/ResetPassword", { 
      error: "An error occurred. Please try again later.", 
      success: null,
      token: req.params.token
    });
  }
};

