const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");

const Ent_user = sequelize.define(
  "ent_user",
  {
    ID_User: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    ID_Duan: {
      type: DataTypes.INTEGER,
    },
    ID_Chinhanh: {
      type: DataTypes.INTEGER,
    },
    ID_KhoiCV: {
      type: DataTypes.INTEGER,
    },
    isError: {
      type: DataTypes.INTEGER,
    },
    UserName: {
      type: DataTypes.CHAR,
      allowNull: false,
    },
    Password: {
      type: DataTypes.CHAR,
      allowNull: false,
    },
    PasswordPrivate: {
      type: DataTypes.CHAR,
    },
    deviceToken: {
      type: DataTypes.CHAR,
    },
    Email: {
      type: DataTypes.CHAR,
    },
    Hoten: {
      type: DataTypes.CHAR,
    },
    Gioitinh: {
      type: DataTypes.CHAR,
    },
    Sodienthoai: {
      type: DataTypes.CHAR,
    },
    Ngaysinh: {
      type: DataTypes.DATE,
    },
    updateTime: {
      type: DataTypes.CHAR,
    },
    arr_Duan: {
      type: DataTypes.CHAR,
    },
    ID_Chucvu: {
      type: DataTypes.INTEGER,
    },
    isDelete: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    freezeTableName: true,
    timestamps: true,
    tableName: "ent_user",
  }
);

module.exports = Ent_user;
