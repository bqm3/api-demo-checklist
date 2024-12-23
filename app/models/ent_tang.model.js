const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");

const Ent_tang = sequelize.define("ent_tang", {
    ID_Tang: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
       },
       Tentang: {
         type: DataTypes.CHAR,
         allowNull: false,
       },
      
   
       ID_Duan: {
        type: DataTypes.INTEGER,
       },
       isDelete: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
       },
},{
    freezeTableName: true,
    timestamps: true,
    tableName: 'ent_tang'
});

module.exports = Ent_tang;