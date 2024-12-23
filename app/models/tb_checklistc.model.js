const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");

const Ent_checklistc = sequelize.define(
  "tb_checklistc",
  {
    ID_ChecklistC: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    ID_Duan: {
      type: DataTypes.INTEGER,
    },
    ID_KhoiCV: {
      type: DataTypes.INTEGER,
    },
    ID_User: {
      type: DataTypes.INTEGER,
    },
    ID_ThietLapCa: {
      type: DataTypes.TEXT,
    },
    ID_Hangmucs: {
      type: DataTypes.JSON,
    },
    ID_Calv: {
      type: DataTypes.INTEGER,
    },
    
    TongC: {
      type: DataTypes.INTEGER,
    },
    Tong: {
      type: DataTypes.INTEGER,
    },
    Ngay: {
      type: DataTypes.TEXT,
    },
    Giobd: {
      type: DataTypes.TIME,
    },
    Gioghinhan: {
      type: DataTypes.TIME,
    },
    Giochupanh1: {
      type: DataTypes.TIME,
    },
    Anh1: {
      type: DataTypes.TEXT,
    },
    Giochupanh1: {
      type: DataTypes.TIME,
    },
    Anh1: {
      type: DataTypes.TEXT,
    },
    Giochupanh2: {
      type: DataTypes.TIME,
    },
    Anh2: {
      type: DataTypes.TEXT,
    },
    Giochupanh3: {
      type: DataTypes.TIME,
    },
    Anh3: {
      type: DataTypes.TEXT,
    },
    Giochupanh4: {
      type: DataTypes.TIME,
    },
    Anh4: {
      type: DataTypes.TEXT,
    },
    Giokt: {
      type: DataTypes.TIME,
    },
    Ghichu: {
      type: DataTypes.TEXT,
    },
    Tinhtrang: {
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
    tableName: "tb_checklistc",
    indexes: [
      {
        unique: false,
        fields: ["isDelete","Tinhtrang"],
      },
    ],
  },
  
);

module.exports = Ent_checklistc;
