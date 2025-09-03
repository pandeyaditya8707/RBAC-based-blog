require("dotenv").config();
const bcrypt = require("bcryptjs");
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
      // 🔹 Admin – full access
      { resource: "users", can_read: true, can_write: true, can_delete: true, can_comment: true, role_id: roles[0].id },
      { resource: "blogs", can_read: true, can_write: true, can_delete: true, can_comment: true, role_id: roles[0].id },
      { resource: "categories", can_read: true, can_write: true, can_delete: true, can_comment: true, role_id: roles[0].id },
      { resource: "comments", can_read: true, can_write: true, can_delete: true, can_comment: true, role_id: roles[0].id },

      // 🔹 Editor – manage blogs & comments, read categories, no user mgmt
      { resource: "blogs", can_read: true, can_write: true, can_delete: true, can_comment: true, role_id: roles[1].id },
      { resource: "comments", can_read: true, can_write: true, can_delete: true, can_comment: true, role_id: roles[1].id },
      { resource: "categories", can_read: true, can_write: false, can_delete: false, can_comment: false, role_id: roles[1].id },
      { resource: "users", can_read: false, can_write: false, can_delete: false, can_comment: false, role_id: roles[1].id },

      // 🔹 Author – can write blogs, manage own comments, read categories
      { resource: "blogs", can_read: true, can_write: true, can_delete: false, can_comment: true, role_id: roles[2].id },
      { resource: "comments", can_read: true, can_write: true, can_delete: false, can_comment: true, role_id: roles[2].id },
      { resource: "categories", can_read: true, can_write: false, can_delete: false, can_comment: false, role_id: roles[2].id },
      { resource: "users", can_read: false, can_write: false, can_delete: false, can_comment: false, role_id: roles[2].id },

      // 🔹 Reader – only read blogs, can comment
      { resource: "blogs", can_read: true, can_write: false, can_delete: false, can_comment: true, role_id: roles[3].id },
      { resource: "comments", can_read: true, can_write: false, can_delete: false, can_comment: true, role_id: roles[3].id },
      { resource: "categories", can_read: true, can_write: false, can_delete: false, can_comment: false, role_id: roles[3].id },
      { resource: "users", can_read: false, can_write: false, can_delete: false, can_comment: false, role_id: roles[3].id },
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
          content: "Artificial Intelligence is transforming industries across the globe. From healthcare to finance, AI is revolutionizing how we work and live. Machine learning algorithms are becoming more sophisticated, enabling computers to perform tasks that were once thought to be exclusively human. The potential applications are endless, from autonomous vehicles to personalized medicine. As we move forward, it's crucial to consider both the opportunities and challenges that AI presents.",
          author_id: users[2].id, // Author
          category_id: categories[0].id, // Technology
          is_published: true,
          image: "sample-tech-1.jpg"
        },
        {
          title: "Exploring Space",
          content: "Space exploration has always been a frontier of science that captures our imagination. Recent missions to Mars, the development of reusable rockets, and the discovery of exoplanets have opened new possibilities for human expansion beyond Earth. Private companies are now joining government agencies in the race to explore the cosmos. The James Webb Space Telescope has provided unprecedented views of distant galaxies, helping us understand the origins of the universe.",
          author_id: users[2].id,
          category_id: categories[1].id,
          is_published: true,
          image: "sample-tech-2.jpg"
        },
        {
          title: "Healthy Living in the Digital Age",
          content: "Maintaining good health in our increasingly digital world presents unique challenges. Screen time, sedentary lifestyles, and digital stress are new health concerns we must address. However, technology also offers solutions through fitness apps, telemedicine, and wearable devices that monitor our vital signs. The key is finding balance between leveraging technology for health benefits while avoiding its potential pitfalls.",
          author_id: users[1].id, // Editor
          category_id: categories[2].id, // Health
          is_published: true,
          image: "sample-tech-3.jpg"
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
