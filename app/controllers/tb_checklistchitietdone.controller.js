const {
  Tb_checklistchitietdone,
  Tb_checklistc,
  Ent_checklist,
} = require("../models/setup.model");
const sequelize = require("../config/db.config");
const { Op, Sequelize } = require("sequelize");

exports.create = async (req, res) => {
  const transaction = await sequelize.transaction(); // Mở giao dịch

  try {
    const userData = req.user.data;

    if (!userData) {
      return res.status(401).json({
        message: "Bạn không có quyền tạo dự án!",
      });
    }

    const {
      ID_Checklists,
      Description,
      checklistLength,
      ID_ChecklistC,
      Vido,
      Kinhdo,
      Docao,
      Gioht,
      isScan,
      isCheckListLai,
    } = req.body;

    // Kiểm tra đầu vào
    if (!Description || !Gioht) {
      return res.status(400).json({
        message: "Không thể checklist dữ liệu!",
      });
    }

    const data = {
      ID_ChecklistC: ID_ChecklistC || null,
      Description: Description || "",
      Gioht,
      Vido: Vido || null,
      Kinhdo: Kinhdo || null,
      Docao: Docao || null,
      isScan: isScan || null,
      isCheckListLai: isCheckListLai === 1 ? 1 : 0,
      isDelete: 0,
    };

    // Tạo bảng động nếu chưa tồn tại
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const dynamicTableName = `tb_checklistchitietdone_${month}_${year}`;
    await sequelize.query(
      `
      CREATE TABLE IF NOT EXISTS ${dynamicTableName} (
        ID_ChecklistC INT,
        Description TEXT,
        Gioht TIME,
        Vido VARCHAR(50),
        Kinhdo VARCHAR(50),
        Docao VARCHAR(50),
        isScan INT,
        isCheckListLai INT DEFAULT 0
      )
    `,
      { transaction }
    );

    // Chèn dữ liệu vào bảng động
    await sequelize.query(
      `
      INSERT INTO ${dynamicTableName} 
        (ID_ChecklistC, Description, Gioht, Vido, Kinhdo, Docao, isScan, isCheckListLai)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      {
        replacements: [
          data.ID_ChecklistC,
          data.Description,
          data.Gioht,
          data.Vido,
          data.Kinhdo,
          data.Docao,
          data.isScan,
          data.isCheckListLai,
        ],
        transaction,
      }
    );

    // Lưu vào bảng chính `Tb_checklistchitietdone`
    const createdData = await Tb_checklistchitietdone.create(data, {
      transaction,
    });

    // Cập nhật `TongC` trong `Tb_checklistc`
    if (ID_ChecklistC) {
      const checklistC = await Tb_checklistc.findOne({
        attributes: ["ID_ChecklistC", "TongC", "Tong"],
        where: { ID_ChecklistC },
        transaction,
      });

      if (checklistC) {
        const { TongC, Tong } = checklistC;
        if (TongC < Tong && data.isCheckListLai === 0) {
          await Tb_checklistc.update(
            { TongC: Sequelize.literal(`TongC + ${checklistLength}`) },
            { where: { ID_ChecklistC }, transaction }
          );
        }
      }
    }

    // Cập nhật `Tinhtrang` trong `Ent_checklist`
    if (ID_Checklists && ID_Checklists.length > 0) {
      await Ent_checklist.update(
        { Tinhtrang: 0 },
        { where: { ID_Checklist: { [Op.in]: ID_Checklists } }, transaction }
      );
    }

    // Commit giao dịch
    await transaction.commit();

    return res.status(200).json({
      message: "Checklist thành công!",
      data: createdData,
    });
  } catch (error) {
    // Rollback giao dịch nếu có lỗi
    await transaction.rollback();
    console.error("Error details:", error);
    return res.status(500).json({
      error: error.message || "Đã xảy ra lỗi trong quá trình checklist",
    });
  }
};

exports.getDataFormat = async (req, res) => {
  try {
    const checklistDoneItems = await Tb_checklistchitietdone.findAll({
      attributes: ["Description", "Gioht", "ID_ChecklistC"],
      where: { isDelete: 0 },
    });

    const arrPush = [];

    checklistDoneItems.forEach((item) => {
      const idChecklists = item.Description.split(",").map(Number);
      if (idChecklists.length > 0) {
        idChecklists.map((it) => {
          if (Number(item.ID_ChecklistC) === Number(req.params.idc)) {
            arrPush.push({
              ID_ChecklistC: parseInt(item.ID_ChecklistC),
              ID_Checklist: it,
              Gioht: item.Gioht,
            });
          }
        });
      }
    });

    // Trả về dữ liệu hoặc thực hiện các thao tác khác ở đây
    res.status(200).json(arrPush);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Đã xảy ra lỗi khi lấy dữ liệu." });
  }
};
