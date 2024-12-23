
const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");

const Ent_ChecklistReplace = sequelize.define("ent_checklistreplace", {
    
   ID_ChecklistReplace: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
   },
   ID_Checklist: {
    type: DataTypes.INTEGER,
    allowNull: false,
   },
   Songay: {
    type: DataTypes.INTEGER
   },
   MotaLoi: {
    type: DataTypes.TEXT,
   },
   Solan: {
    type: DataTypes.INTEGER
   },
   Ngaybatdau: {
    type: DataTypes.DATE
   },
   isDelete: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
   },
},
 {
    freezeTableName: true,
    timestamps: true,
    tableName: 'ent_checklistreplace'
  }
);

module.exports = Ent_ChecklistReplace;


