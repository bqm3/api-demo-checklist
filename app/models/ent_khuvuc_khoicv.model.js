const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");

const Ent_khuvuc_khoicv = sequelize.define("ent_khuvuc_khoicv", {
    ID_KV_CV: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
       },
       ID_Khuvuc: {
         type: DataTypes.INTEGER,
         allowNull: false,
       },
       ID_KhoiCV: {
        type: DataTypes.INTEGER,
        allowNull: false,
       },
       isDelete: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
       },
},{
    freezeTableName: true,
    timestamps: true,
    tableName: 'ent_khuvuc_khoicv'
});

module.exports = Ent_khuvuc_khoicv;