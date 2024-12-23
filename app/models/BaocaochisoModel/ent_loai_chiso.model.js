
const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../../config/db.config");

const Ent_Loai_Chiso = sequelize.define("ent_loai_chiso", {
    
  ID_LoaiCS: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
   },
   ID_Duan_Loai: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
   TenLoaiCS: {
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
    tableName: 'ent_loai_chiso'
  }
);

module.exports = Ent_Loai_Chiso;


