const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../../config/db.config");

const Ent_hsse_user = sequelize.define(
  "ent_hsse_user",
  {
    ID_Hsse_User: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    ID_Duan: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    ID_User: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    isDelete: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    freezeTableName: true,
    timestamps: true,
    tableName: "ent_hsse_user",
  }
);

module.exports = Ent_hsse_user;
