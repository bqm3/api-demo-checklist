const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.config");
const P0_Log = sequelize.define(
  "P0_Log",
  {
    ID_P0_Log: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    ID_P0: {
      type: DataTypes.INTEGER,
    },
    ID_Duan: {
      type: DataTypes.INTEGER,
    },
    ID_User_AN_Update: {
      type: DataTypes.INTEGER,
    },
    Ngaybc: {
      type: DataTypes.DATEONLY,
    },
    Slxeoto: {
      type: DataTypes.INTEGER,
    },
    Slxeotodien: {
      type: DataTypes.INTEGER,
    },
    Slxemay: {
      type: DataTypes.INTEGER,
    },
    Slxemaydien: {
      type: DataTypes.INTEGER,
    },
    Slxedap: {
      type: DataTypes.INTEGER,
    },
    Slxedapdien: {
      type: DataTypes.INTEGER,
    },
    Sltheoto: {
      type: DataTypes.INTEGER,
    },
    Slthexemay: {
      type: DataTypes.INTEGER,
    },
    Slscoto: {
      type: DataTypes.INTEGER,
    },
    Slscotodien: {
      type: DataTypes.INTEGER,
    },
    Slscxemay: {
      type: DataTypes.INTEGER,
    },
    Slscxemaydien: {
      type: DataTypes.INTEGER,
    },
    Slscxedap: {
      type: DataTypes.INTEGER,
    },
    Slscxedapdien: {
      type: DataTypes.INTEGER,
    },
    Slcongto: {
      type: DataTypes.INTEGER,
    },
    Doanhthu: {
      type: DataTypes.DOUBLE,
    },
    iTrangthai: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
    },
    Ghichu: {
      type: DataTypes.STRING(200),
    },
    ID_User_KT_Update: {
      type: DataTypes.INTEGER,
    },
    isDelete: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
    },
  },
  {
    tableName: "P0_Log",
    timestamps: true,
    freezeTableName: true,
  }
);

module.exports = P0_Log;
