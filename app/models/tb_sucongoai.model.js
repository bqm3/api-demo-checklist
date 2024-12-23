
const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");

const Tb_sucongoai = sequelize.define("tb_sucongoai", {
    
   ID_Suco: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
   },
   ID_KV_CV: {
    type: DataTypes.INTEGER,
   },
   ID_Hangmuc: {
    type: DataTypes.INTEGER,
   },
   ID_User: {
    type: DataTypes.INTEGER,
   },
   ID_Handler: {
    type: DataTypes.INTEGER,
   },
   Ngaysuco: {
     type: DataTypes.DATE,
   },
   Giosuco: {
    type: DataTypes.TIME,
   },
   Noidungsuco: {
    type: DataTypes.TEXT,
   },
   Duongdancacanh: {
    type: DataTypes.TEXT,
   },
   Anhkiemtra: {
    type: DataTypes.TEXT,
   },
   Ghichu: {
    type: DataTypes.TEXT,
   },
   deviceUser: {
    type: DataTypes.CHAR,
   },
   deviceHandler: {
    type: DataTypes.CHAR,
   },
   deviceNameHandler: {
    type: DataTypes.CHAR,
   },
   deviceNameUser: {
    type: DataTypes.CHAR,
   },
   Tinhtrangxuly: {
    type: DataTypes.INTEGER,
    defaultValue: 0
   },
   Ngayxuly: {
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
    tableName: 'tb_sucongoai'
  }
);

module.exports = Tb_sucongoai;


