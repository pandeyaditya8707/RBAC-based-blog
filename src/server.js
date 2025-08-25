const app = require("./app");
const { sequelize } = require("./configs/db");
const PORT = 3000;
2
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log(" Database connected successfully!");
    await sequelize.sync({ force: false }); // Use force: true to drop and recreate all tables
    console.log("All tables synced successfully!");
    app.listen(PORT, () => {
      console.log(` Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(" Failed to start server:", error);
  }
}
startServer();