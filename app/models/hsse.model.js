const { Sequelize, DataTypes, STRING } = require("sequelize");
const sequelize = require("../config/db.config");

const hsse = sequelize.define(
  "hsse",
  {
    ID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    Ten_du_an: {
      type: DataTypes.STRING(100),
    },
    Ngay_ghi_nhan: {
      type: DataTypes.STRING(20),
    },
    Nguoi_tao: {
      type: DataTypes.STRING(100),
    },
    createdAt: {
      type: DataTypes.DATE,
    },
    updatedAt: {
      type: DataTypes.DATE,
    },
    Dien_cu_dan: {
      type: DataTypes.DOUBLE,
    },
    Dien_cdt: {
      type: DataTypes.DOUBLE,
    },
    Nuoc_cu_dan: {
      type: DataTypes.DOUBLE,
    },
    Nuoc_cdt: {
      type: DataTypes.DOUBLE,
    },
    Xa_thai: {
      type: DataTypes.DOUBLE,
    },
    Rac_sh: {
      type: DataTypes.DOUBLE,
    },
    Muoi_dp: {
      type: DataTypes.DOUBLE,
    },
    PAC: {
      type: DataTypes.DOUBLE,
    },
    NaHSO3: {
      type: DataTypes.DOUBLE,
    },
    NaOH: {
      type: DataTypes.DOUBLE,
    },
    Mat_rd: {
      type: DataTypes.DOUBLE,
    },
    Polymer_Anion: {
      type: DataTypes.DOUBLE,
    },
    Chlorine_bot: {
      type: DataTypes.DOUBLE,
    },
    Chlorine_vien: {
      type: DataTypes.DOUBLE,
    },
    Methanol: {
      type: DataTypes.DOUBLE,
    },
    Dau_may: {
      type: DataTypes.DOUBLE,
    },
    Tui_rac240: {
      type: DataTypes.DOUBLE,
    },
    Tui_rac120: {
      type: DataTypes.DOUBLE,
    },
    Tui_rac20: {
      type: DataTypes.DOUBLE,
    },
    Tui_rac10: {
      type: DataTypes.DOUBLE,
    },
    Tui_rac5: {
      type: DataTypes.DOUBLE,
    },
    giayvs_235: {
      type: DataTypes.DOUBLE,
    },
    giaivs_120: {
      type: DataTypes.DOUBLE,
    },
    giay_lau_tay: {
      type: DataTypes.DOUBLE,
    },
    hoa_chat: {
      type: DataTypes.DOUBLE,
    },
    nuoc_rua_tay: {
      type: DataTypes.DOUBLE,
    },
    nhiet_do: {
      type: DataTypes.DOUBLE,
    },
    nuoc_bu: {
      type: DataTypes.DOUBLE,
    },
    clo: {
      type: DataTypes.DOUBLE,
    },
    PH: {
      type: DataTypes.DOUBLE,
    },
    Poolblock: {
      type: DataTypes.DOUBLE,
    },
    trat_thai: {
      type: DataTypes.DOUBLE,
    },
    Email: {
      type: DataTypes.STRING(255),
    },
    pHMINUS: {
      type: DataTypes.DOUBLE,
    },
    axit: {
      type: DataTypes.DOUBLE,
    },
    PN180: {
      type: DataTypes.DOUBLE,
    },
    modifiedBy: {
      type: DataTypes.STRING(255),
    },
    chiSoCO2: {
      type: DataTypes.DOUBLE,
    },
    clorin: {
      type: DataTypes.DOUBLE,
    },
    NaOCL: {
      type: DataTypes.DOUBLE,
    },
  },
  {
    freezeTableName: true,
    timestamps: true,
    tableName: "HSSE",
  }
);

module.exports = hsse;
