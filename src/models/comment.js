const { DataTypes } = require("sequelize");
const { sequelize } = require("../configs/db");

const Comment = sequelize.define("Comment", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  blog_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Blogs',
      key: 'id'
    }
  }
}, {
  tableName: "Comments",
  timestamps: true,
});

module.exports = Comment;
