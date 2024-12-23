const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../../config/db.config");

const Ent_Hangmuc_Chiso = sequelize.define(
  "ent_hangmuc_chiso",
  {
    ID_Hangmuc_Chiso: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    ID_Duan: {
      type: DataTypes.INTEGER,
    },
    ID_LoaiCS: {
      type: DataTypes.INTEGER,
    },
    Ten_Hangmuc_Chiso: {
      type: DataTypes.CHAR,
    },
    Heso: {
      type: DataTypes.FLOAT,
    },
    Donvi: {
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
    tableName: "ent_hangmuc_chiso",
  }
);

module.exports = Ent_Hangmuc_Chiso;
