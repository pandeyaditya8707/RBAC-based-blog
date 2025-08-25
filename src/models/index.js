// src/models/index.js
const { sequelize } = require("../configs/db");

const User = require("./user");
const Role = require("./role");
const Blog = require("./blog");
const Category = require("./category");
const Comment = require("./comment");
const RoleAccess = require("./roleAccess");

// Associations
User.hasMany(Blog, { foreignKey: "author_id" });
Blog.belongsTo(User, { foreignKey: "author_id" });

User.hasMany(Comment, { foreignKey: "user_id" });
Comment.belongsTo(User, { foreignKey: "user_id" });

Blog.hasMany(Comment, { foreignKey: "blog_id" });
Comment.belongsTo(Blog, { foreignKey: "blog_id" });

Blog.belongsTo(Category, { foreignKey: "category_id" });
Category.hasMany(Blog, { foreignKey: "category_id" });

User.belongsTo(Role, { foreignKey: "role_id" });
Role.hasMany(User, { foreignKey: "role_id" });

Role.hasMany(RoleAccess, { foreignKey: "role_id" });
RoleAccess.belongsTo(Role, { foreignKey: "role_id" });

module.exports = { sequelize, User, Role, Blog, Category, Comment, RoleAccess };
