const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");

const Ent_duan_khoicv = sequelize.define(
  "ent_duan_khoicv",
  {
    ID_Duan_KhoiCV: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    ID_Duan: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    ID_KhoiCV: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Chuky: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Ngaybatdau: {
      type: DataTypes.DATE,
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
    tableName: "ent_duan_khoicv",
  }
);

module.exports = Ent_duan_khoicv;
