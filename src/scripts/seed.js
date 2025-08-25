require("dotenv").config();
const bcrypt = require("bcrypt");
const {
  sequelize,
  User,
  Role,
  Blog,
  Category,
  Comment,
  RoleAccess,
} = require("../models");

async function seed() {
  try {
    console.log("=====================================");
    console.log("🔄 Starting database seeding...");

    // Reset DB
    await sequelize.sync({ force: true });

    // =====================
    // Roles
    // =====================
    const roles = await Role.bulkCreate(
      [
        { name: "admin" },
        { name: "editor" },
        { name: "author" },
        { name: "reader" },
      ],
      { returning: true }
    );

    // =====================
    // RoleAccess
    // =====================
    await RoleAccess.bulkCreate([
      // Admin – full access
      { resource: "users", can_read: true, can_write: true, can_delete: true, role_id: roles[0].id },
      { resource: "blogs", can_read: true, can_write: true, can_delete: true, role_id: roles[0].id },
      { resource: "categories", can_read: true, can_write: true, can_delete: true, role_id: roles[0].id },
      { resource: "comments", can_read: true, can_write: true, can_delete: true, role_id: roles[0].id },

      // Editor – manage blogs & comments, read categories, no user mgmt
      { resource: "blogs", can_read: true, can_write: true, can_delete: true, role_id: roles[1].id },
      { resource: "comments", can_read: true, can_write: true, can_delete: true, role_id: roles[1].id },
      { resource: "categories", can_read: true, can_write: false, can_delete: false, role_id: roles[1].id },
      { resource: "users", can_read: false, can_write: false, can_delete: false, role_id: roles[1].id },

      // Author – can write blogs, manage own comments, read categories
      { resource: "blogs", can_read: true, can_write: true, can_delete: false, role_id: roles[2].id },
      { resource: "comments", can_read: true, can_write: true, can_delete: false, role_id: roles[2].id },
      { resource: "categories", can_read: true, can_write: false, can_delete: false, role_id: roles[2].id },
      { resource: "users", can_read: false, can_write: false, can_delete: false, role_id: roles[2].id },

      // Reader – only read blogs, comments, categories
      { resource: "blogs", can_read: true, can_write: false, can_delete: false, role_id: roles[3].id },
      { resource: "comments", can_read: true, can_write: false, can_delete: false, role_id: roles[3].id },
      { resource: "categories", can_read: true, can_write: false, can_delete: false, role_id: roles[3].id },
      { resource: "users", can_read: false, can_write: false, can_delete: false, role_id: roles[3].id },
    ]);

    // =====================
    // Categories
    // =====================
    const categories = await Category.bulkCreate(
      [
        { name: "Technology" },
        { name: "Science" },
        { name: "Health" },
        { name: "Travel" },
      ],
      { returning: true }
    );

    // =====================
    // Users
    // =====================
    const hashedPassword = await bcrypt.hash("password123", 10);
    const users = await User.bulkCreate(
      [
        {
          username: "admin",
          email: "admin@example.com",
          password: hashedPassword,
          role_id: roles[0].id,
          is_active: true,
          is_verified: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          username: "editor",
          email: "editor@example.com",
          password: hashedPassword,
          role_id: roles[1].id,
          is_active: true,
          is_verified: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          username: "author",
          email: "author@example.com",
          password: hashedPassword,
          role_id: roles[2].id,
          is_active: true,
          is_verified: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          username: "reader",
          email: "reader@example.com",
          password: hashedPassword,
          role_id: roles[3].id,
          is_active: true,
          is_verified: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      { returning: true }
    );

    // =====================
    // Blogs
    // =====================
    const blogs = await Blog.bulkCreate(
      [
        {
          title: "The Future of AI",
          content: "AI is transforming industries across the globe...",
          author_id: users[2].id, // Author
          category_id: categories[0].id, // Technology
          is_published: true,
        },
        {
          title: "Exploring Space",
          content: "Space exploration has always been a frontier of science...",
          author_id: users[2].id,
          category_id: categories[1].id,
          is_published: true,
        },
      ],
      { returning: true }
    );

    // =====================
    // Comments
    // =====================
    await Comment.bulkCreate([
      {
        content: "Great article on AI!",
        user_id: users[3].id, // Reader
        blog_id: blogs[0].id,
      },
      {
        content: "Space exploration excites me too!",
        user_id: users[1].id, // Editor
        blog_id: blogs[1].id,
      },
    ]);

    console.log("✅ Seeding completed successfully!");
    console.log("=====================================");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    process.exit(1);
  }
}

seed();
