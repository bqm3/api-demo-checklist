const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");

const Ent_duan = sequelize.define(
  "ent_duan",
  {
    ID_Duan: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    Ngaybatdau: {
      type: DataTypes.DATE,
    },
    Duan: {
      type: DataTypes.CHAR,
      allowNull: false,
    },
    Diachi: {
      type: DataTypes.TEXT,
    },
    Vido: {
      type: DataTypes.TEXT,
    },
    ID_Nhom: {
      type: DataTypes.INTEGER,
    },
    Kinhdo: {
      type: DataTypes.TEXT,
    },
    Logo: {
      type: DataTypes.TEXT,
    },
    ID_LoaiCS: {
      type: DataTypes.CHAR,
    },
    Percent: {
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
    tableName: "ent_duan",
  },
  {
    indexes: [
      {
        unique: false,  
        fields: ['isDelete'], 
      },
    ],
  }
);

module.exports = Ent_duan;
