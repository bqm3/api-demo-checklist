const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");

const Ent_Hangmuc = sequelize.define(
  "ent_hangmuc",
  {
    ID_Hangmuc: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    ID_Khuvuc: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Important: {
      type: DataTypes.INTEGER,
    },
    Sothutu: {
      type: DataTypes.INTEGER,
    },
    MaQrCode: {
      type: DataTypes.CHAR,
    },
    Hangmuc: {
      type: DataTypes.CHAR,
    },
    Tieuchuankt: {
      type: DataTypes.TEXT,
    },
    FileTieuChuan: {
      type: DataTypes.CHAR,
    },
    isDelete: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    freezeTableName: true,
    timestamps: true,
    tableName: "ent_hangmuc",
  }
);

module.exports = Ent_Hangmuc;
