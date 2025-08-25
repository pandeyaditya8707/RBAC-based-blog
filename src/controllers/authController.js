const { User, Role } = require("../models");
const bcrypt = require("bcrypt");
const { validateUserLogin, validateAdminLogin } = require("../middleware/validation");

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

    if (!user || !user.Role || user.Role.name !== "Admin") {
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
    res.redirect("/user/login");
  });
};

/* exports.getUserRegister = (req, res) => {
  res.render("auth/UserRegister");
};

exports.postUserRegister = (req, res) => {
  // handle user registration logic
};

// =============================
// Admin Register
// =============================
exports.getAdminRegister = (req, res) => {
  res.render("auth/AdminRegister");
};

exports.postAdminRegister = (req, res) => {
  // handle admin registration logic
};

// =============================
// Admin Login
// =============================
exports.getLogin = (req, res) => {
  res.render("auth/login");
};

exports.postLogin = (req, res) => {
  // handle admin login logic
};
 */