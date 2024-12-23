const { Ent_duan, Ent_Hangmuc_Chiso, Ent_Loai_Chiso } = require("../../models/setup.model");
const { Op } = require("sequelize");

exports.createDuanLoaiCS = async (req, res) => {
  try {
    const userData = req.user.data;
    const { ID_LoaiCS } = req.body; // ID_LoaiCS là chuỗi dạng "1,2,3"

    const duan = await Ent_duan.findByPk(userData.ID_Duan);

    if (!duan) {
      return res.status(404).json({ message: "Không tìm thấy dự án" });
    }

    // Nếu đã có ID_LoaiCS, thêm mới vào chuỗi
    const currentLoaiCS = duan.ID_LoaiCS || "";
    const updatedLoaiCS = [
      ...new Set([...currentLoaiCS.split(","), ...ID_LoaiCS.split(",")]),
    ]
      .filter((id) => id.trim())
      .join(",");

    await Ent_duan.update(
      { ID_LoaiCS: updatedLoaiCS },
      {
        where: { ID_Duan : userData.ID_Duan },
      }
    );

    res
      .status(201)
      .json({ message: "Thêm loại chỉ số thành công", updatedLoaiCS });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi thêm loại chỉ số", error });
  }
};

exports.updateDuanLoaiCS = async (req, res) => {
  try {
    const userData = req.user.data;
    const ID_Duan = userData.ID_Duan;
    const { ID_LoaiCS } = req.body;

    const updated = await Ent_duan.update(
      { ID_LoaiCS },
      {
        where: {
          ID_Duan,
          isDelete: 0,
        },
      }
    );

    if (updated[0] === 0) {
      return res.status(404).json({ message: "Không tìm thấy dự án" });
    }

    res.status(200).json({
      message: "Cập nhật loại chỉ số thành công",
      updatedID_LoaiCS: ID_LoaiCS,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật loại chỉ số", error });
  }
};

exports.deleteDuanLoaiCS = async (req, res) => {
  try {
    const { ID_LoaiCS } = req.body;
    const userData = req.user.data;
    const ID_Duan = userData.ID_Duan;

    // Kiểm tra dự án có tồn tại
    const duan = await Ent_duan.findByPk(ID_Duan);
    if (!duan) {
      return res.status(404).json({ message: "Không tìm thấy dự án" });
    }

    const currentLoaiCS = duan.ID_LoaiCS || "";
    const toDelete = ID_LoaiCS.split(",");

    // Kiểm tra nếu còn hạng mục thuộc loại chỉ số
    const checkHangmuc = await Ent_Hangmuc_Chiso.findAll({
      where: {
        ID_Duan,
        ID_LoaiCS: { [Op.in]: toDelete },
      },
      include: [
        {
          model: Ent_Loai_Chiso,
          as: "ent_loai_chiso",
          attributes: ["ID_LoaiCS", "TenLoaiCS"],
        },
      ],
    });

    if (checkHangmuc.length > 0) {
      // Lấy thông tin chỉ số tương ứng
      const loaiChisoDetails = checkHangmuc.map((item) => ({
        ID_Hangmuc_Chiso: item.ID_Hangmuc_Chiso,
        Ten_Hangmuc_Chiso: item.Ten_Hangmuc_Chiso,
        ID_LoaiCS: item.ID_LoaiCS,
        TenLoaiCS: item.ent_loai_chiso?.TenLoaiCS || "Không xác định",
      }));

      return res.status(400).json({
        message: "Vẫn còn tồn tại hạng mục thuộc loại chỉ số",
        details: loaiChisoDetails,
      });
    }

    // Cập nhật loại chỉ số
    const updatedLoaiCS = currentLoaiCS
      .split(",")
      .filter((id) => !toDelete.includes(id))
      .join(",");

    await Ent_duan.update(
      { ID_LoaiCS: updatedLoaiCS },
      { where: { ID_Duan } }
    );

    return res
      .status(200)
      .json({ message: "Xóa loại chỉ số thành công", updatedLoaiCS });
  } catch (error) {
    console.error("Error in deleteDuanLoaiCS:", error);
    return res.status(500).json({ message: "Lỗi khi xóa loại chỉ số", error });
  }
};