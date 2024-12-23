
const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");

const Ent_thietlapca = sequelize.define("ent_thietlapca", {
    
   ID_ThietLapCa: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
   },
   ID_Duan: {
    type: DataTypes.INTEGER,
   },
   ID_Calv: {
    type: DataTypes.INTEGER,
   },
   Ngaythu: {
     type: DataTypes.INTEGER,
     
   },
   ID_Hangmucs: {
    type: DataTypes.JSON,
    
   },
   Sochecklist: {
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
    tableName: 'ent_thietlapca'
  }
);

module.exports = Ent_thietlapca;


