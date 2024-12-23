const Sequelize = require("sequelize");

/**
 * Hàm định nghĩa model động dựa trên tên bảng
 * @param {string} tableName - Tên bảng cần định nghĩa
 * @param {object} sequelize - Đối tượng Sequelize
 */
const defineDynamicModelChiTietDone = (tableName, sequelize) => {
  if (!sequelize.models[tableName]) {
    // Định nghĩa model ChecklistDetail động
    const ChecklistDetailDone = sequelize.define(
      tableName,
      {
        ID_Checklistchitietdone: {
          type: Sequelize.INTEGER,
          primaryKey: true,
        },
        ID_ChecklistC: Sequelize.INTEGER,
        Description: Sequelize.STRING,
        Gioht: Sequelize.DATE,
        Kinhdo: Sequelize.CHAR,
        Vido: Sequelize.CHAR,
        Docao: Sequelize.CHAR,
        isScan: Sequelize.INTEGER,
        isCheckListLai: Sequelize.INTEGER,
        Ngay: Sequelize.DATE,
        isDelete: Sequelize.INTEGER,
      },
      {
        tableName: tableName,
        timestamps: true,
      }
    );

    // Thiết lập quan hệ (association)
    const Tb_checklistc = sequelize.models.tb_checklistc;

    // Mối quan hệ giữa ChecklistDetail và Tb_checklistc
    if (Tb_checklistc) {
      ChecklistDetailDone.belongsTo(Tb_checklistc, {
        foreignKey: "ID_ChecklistC",
        as: "tb_checklistc",
      });
    }
  }
};

module.exports = defineDynamicModelChiTietDone;
