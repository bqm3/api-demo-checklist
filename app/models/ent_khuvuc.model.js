const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");

const Ent_khuvuc = sequelize.define("ent_khuvuc", {
    ID_Khuvuc: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
       },
       ID_Toanha: {
         type: DataTypes.INTEGER,
         allowNull: false,
       },
       ID_Tang: {
        type: DataTypes.INTEGER,
      },
       Sothutu: {
        type: DataTypes.INTEGER,
       },
       Makhuvuc: {
        type: DataTypes.CHAR,
       },
       MaQrCode: {
        type: DataTypes.CHAR,
       },
       ID_KhoiCVs : {
        type: DataTypes.JSON,
       },
       Tenkhuvuc: {
        type: DataTypes.CHAR,
       },
       ID_User: {
        type: DataTypes.INTEGER,
       },
       isDelete: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
       },
},{
    freezeTableName: true,
    timestamps: true,
    tableName: 'ent_khuvuc'
});

module.exports = Ent_khuvuc;