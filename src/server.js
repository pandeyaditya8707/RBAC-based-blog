const app = require("./app");
const { sequelize } = require("./configs/db");
const PORT = 3000;
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log(" Database connected successfully!");
    await sequelize.sync({ force: false });
    console.log(" All tables synced successfully!");
    
    const server = app.listen(PORT, () => {
      console.log(` Server running at http://localhost:${PORT}`);
    });

    // Handle server errors
    server.on('error', (error) => {
      console.error("Server error:", error);
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}
startServer();