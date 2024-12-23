const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");

const nrl_ai = sequelize.define(
  "nrl_ai",
  {
    ID_AI: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    Tenduan: {
      type: DataTypes.CHAR,
    },
    Giamsat: {
      type: DataTypes.CHAR,
    },
    Tenkhoi: {
      type: DataTypes.CHAR,
    },
    Tenca: {
      type: DataTypes.CHAR,
    },
    Ngay: {
      type: DataTypes.DATE,
    },
    Tilehoanthanh: {
      type: DataTypes.FLOAT,
    },
    TongC: {
      type: DataTypes.INTEGER,
    },
    Tong: {
      type: DataTypes.INTEGER,
    },
    Thoigianmoca: {
      type: DataTypes.TIME,
    },
    Thoigianchecklistbatdau: {
      type: DataTypes.TIME,
    },
    Thoigianchecklistkethuc: {
      type: DataTypes.TIME,
    },
    Thoigiantrungbinh: {
      type: DataTypes.FLOAT,
    },
    Soluongghichu: {
      type: DataTypes.INTEGER,
    },
    Soluonghinhanh: {
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
    tableName: "nrl_ai",
  }
);

module.exports = nrl_ai;
