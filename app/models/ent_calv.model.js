
const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");

const Ent_calv = sequelize.define("ent_calv", {
    
   ID_Calv: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
   },
   ID_Duan: {
    type: DataTypes.INTEGER,
   },
   ID_KhoiCV: {
    type: DataTypes.INTEGER,
   },
   Tenca: {
     type: DataTypes.CHAR,
     
   },
   Giobatdau: {
    type: DataTypes.TIME,
    
   },
   Gioketthuc: {
    type: DataTypes.TIME,
    
   },
   ID_User: {
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
    tableName: 'ent_calv'
  }
);

module.exports = Ent_calv;


