const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");

const Ent_tile = sequelize.define(
  "ent_tile",
  {
    ID_Tile: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    Tenduan: {
      type: DataTypes.CHAR,
      allowNull: false,
    },

    Khoibaove: {
      type: DataTypes.CHAR,
    },
    Khoilamsach: {
      type: DataTypes.CHAR,
    },
    Khoidichvu: {
      type: DataTypes.CHAR,
    },
    Khoikythuat: {
      type: DataTypes.CHAR,
    },
    KhoiFB: {
      type: DataTypes.CHAR,
    },
    Ngay: {
      type: DataTypes.DATE,
    },
    isDelete: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    freezeTableName: true,
    timestamps: true,
    tableName: "ent_tile",
  }
);

module.exports = Ent_tile;
