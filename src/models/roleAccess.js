const { DataTypes } = require("sequelize");
const { sequelize } = require("../configs/db");

const RoleAccess = sequelize.define("RoleAccess", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  role_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Roles',
      key: 'id'
    }
  },
  resource: {
    type: DataTypes.STRING,
    allowNull: false, 
  },
  can_read: { type: DataTypes.BOOLEAN, defaultValue: false },
  can_write: { type: DataTypes.BOOLEAN, defaultValue: false },
  can_delete: { type: DataTypes.BOOLEAN, defaultValue: false },
  can_comment: { type: DataTypes.BOOLEAN, defaultValue: false },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "RoleAccesses",
  timestamps: true,
});

module.exports = RoleAccess;
