const Sequelize = require("sequelize");

/**
 * Hàm định nghĩa model động dựa trên tên bảng
 * @param {string} tableName - Tên bảng cần định nghĩa
 * @param {object} sequelize - Đối tượng Sequelize
 */
const defineDynamicModelChiTiet = (tableName, sequelize) => {
  try {
    // Kiểm tra xem model đã được định nghĩa chưa
    if (!sequelize.models[tableName]) {

      // Định nghĩa model ChecklistDetail động
      const ChecklistDetail = sequelize.define(
        tableName,
        {
          ID_Checklistchitiet: {
            type: Sequelize.INTEGER,
            primaryKey: true,
          },
          ID_Checklist: Sequelize.INTEGER,
          ID_ChecklistC: Sequelize.INTEGER,
          Ketqua: Sequelize.STRING,
          Anh: Sequelize.STRING,
          Gioht: Sequelize.DATE,
          Ngay: Sequelize.DATE,
          Kinhdo: Sequelize.CHAR,
          Vido: Sequelize.CHAR,
          Docao: Sequelize.CHAR,
          isScan: Sequelize.INTEGER,
          isCheckListLai: Sequelize.INTEGER,
          Ghichu: Sequelize.STRING,
          isDelete: Sequelize.INTEGER,
        },
        {
          tableName: tableName,
          timestamps: true,
        }
      );

      // Thiết lập quan hệ (association) với các models khác nếu có
      const Tb_checklistc = sequelize.models.tb_checklistc;
      const Ent_checklist = sequelize.models.ent_checklist;

      // Mối quan hệ giữa ChecklistDetail và Ent_checklist
      if (Ent_checklist) {
        ChecklistDetail.belongsTo(Ent_checklist, {
          foreignKey: "ID_Checklist",
          as: "ent_checklist",
        });
      } else {
        console.error("Model ent_checklist không tồn tại.");
      }

      // Mối quan hệ giữa ChecklistDetail và Tb_checklistc
      if (Tb_checklistc) {
        ChecklistDetail.belongsTo(Tb_checklistc, {
          foreignKey: "ID_ChecklistC",
          as: "tb_checklistc",
        });
      } else {
        console.error("Model tb_checklistc không tồn tại.");
      }
    } else {
      console.log(`Model ${tableName} đã được định nghĩa.`);
    }
  } catch (error) {
    console.error("Đã xảy ra lỗi khi định nghĩa model:", error);
  }
};

module.exports = defineDynamicModelChiTiet;
