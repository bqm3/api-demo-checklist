const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../../config/db.config");

const Ent_Baocaochiso = sequelize.define(
  "ent_baocaochiso",
  {
    ID_Baocaochiso: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    ID_User: {
      type: DataTypes.INTEGER,
    },
    ID_Duan: {
      type: DataTypes.INTEGER,
    },
    ID_Hangmuc_Chiso: {
      type: DataTypes.INTEGER,
    },
    Day: {
      type: DataTypes.DATE,
    },
    Month: {
      type: DataTypes.INTEGER,
    },
    Year: {
      type: DataTypes.INTEGER,
    },
    Chiso: {
      type: DataTypes.FLOAT,
    },
    Image: {
      type: DataTypes.CHAR,
    },
    Chiso_Before: {
      type: DataTypes.FLOAT,
    },
    Chiso_Read_Img: {
      type: DataTypes.CHAR,
    },
    Ghichu: {
      type: DataTypes.TEXT,
    },
    isDelete: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    freezeTableName: true,
    timestamps: true,
    tableName: "ent_baocaochiso",
  }
);

module.exports = Ent_Baocaochiso;
