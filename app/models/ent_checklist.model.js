const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");

const Ent_checklist = sequelize.define(
  "ent_checklist",
  {
    ID_Checklist: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    ID_Khuvuc: {
      type: DataTypes.INTEGER,
    },
    ID_Hangmuc: {
      type: DataTypes.INTEGER,
    },
    ID_Tang: {
      type: DataTypes.INTEGER,
    },
    Sothutu: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    Maso: {
      type: DataTypes.CHAR,
    },
    MaQrCode: {
      type: DataTypes.CHAR,
    },
    Checklist: {
      type: DataTypes.TEXT,
    },
    Ghichu: {
      type: DataTypes.TEXT,
    },
    Tieuchuan: {
      type: DataTypes.TEXT,
    },
    Giatridinhdanh: {
      type: DataTypes.CHAR,
    }, Giatriloi: {
      type: DataTypes.CHAR,
    },
    sCalv: {
      type: DataTypes.JSON,
    },
    Tinhtrang: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isImportant: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isCheck: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    calv_1: {
      type: DataTypes.CHAR,
    },
    calv_2: {
      type: DataTypes.CHAR,
    },
    calv_3: {
      type: DataTypes.CHAR,
    },
    calv_4: {
      type: DataTypes.CHAR,
    },
    Giatrinhan: {
      type: DataTypes.CHAR,
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
    tableName: "ent_checklist",
    indexes: [
    
      {
        unique: false,
        fields: ["isDelete"],
      },
    ],
  },
 
);

module.exports = Ent_checklist;

