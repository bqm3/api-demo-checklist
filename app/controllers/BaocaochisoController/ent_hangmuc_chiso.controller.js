const { Ent_Hangmuc_Chiso, Ent_Loai_Chiso, Ent_Baocaochiso } = require("../../models/setup.model");

// Tạo mới hạng mục chỉ số
exports.createHangmucChiso = async (req, res) => {
  try {
    const userData = req.user.data;
    const ID_Duan = userData.ID_Duan;
    const {ID_LoaiCS, Ten_Hangmuc_Chiso, Donvi, Heso } = req.body;

    // Kiểm tra xem các thông tin cần thiết có hợp lệ không
    if (!ID_Duan || !ID_LoaiCS || !Ten_Hangmuc_Chiso) {
      return res.status(400).json({ message: "Thiếu thông tin cần thiết" });
    }

    // Tạo mới hạng mục chỉ số
    const newHangmucChiso = await Ent_Hangmuc_Chiso.create({
      ID_Duan,
      ID_LoaiCS,
      Ten_Hangmuc_Chiso,
      Donvi,
      Heso,
    });

    res.status(201).json({
      message: "Thêm hạng mục chỉ số thành công",
      data: newHangmucChiso,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi thêm hạng mục chỉ số", error });
  }
};

// Lấy danh sách các hạng mục chỉ số
exports.getAllHangmucChiso = async (req, res) => {
  try {
    const hangmucs = await Ent_Hangmuc_Chiso.findAll({
      where: { isDelete: 0 }, // Lọc các bản ghi không bị xóa
    });

    if (hangmucs.length === 0) {
      return res.status(404).json({ message: "Không có hạng mục chỉ số nào" });
    }

    res
      .status(200)
      .json({ message: "Lấy danh sách thành công", data: hangmucs });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi lấy danh sách hạng mục chỉ số", error });
  }
};

// Lấy thông tin chi tiết của một hạng mục chỉ số theo ID
exports.getHangmucChisoById = async (req, res) => {
  try {
    const userData = req.user.data;
    const ID_Duan = userData.ID_Duan;

    const hangmucChiso = await Ent_Hangmuc_Chiso.findAll({
      where: { ID_Duan: ID_Duan , isDelete: 0},
      include: [
        {
          model: Ent_Loai_Chiso,
          as: "ent_loai_chiso",
          attributes: ["ID_LoaiCS", "TenLoaiCS"]
        }
      ]
    });

    if (!hangmucChiso) {
      return res.status(404).json({ message: "Hạng mục chỉ số không tồn tại" });
    }

    res
      .status(200)
      .json({ message: "Lấy thông tin thành công", data: hangmucChiso });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi lấy thông tin hạng mục chỉ số", error });
  }
};

exports.getDetailHangmucChiso = async (req, res) => {
  try {
    const userData = req.user.data;
    const { ID_Hangmuc_Chiso } = req.params;
    const ID_Duan = userData.ID_Duan;

    const hangmucChiso = await Ent_Hangmuc_Chiso.findByPk(ID_Hangmuc_Chiso,{
      where: { ID_Duan: ID_Duan , isDelete: 0},
      include: [
        {
          model: Ent_Loai_Chiso,
          as: "ent_loai_chiso",
          attributes: ["ID_LoaiCS", "TenLoaiCS"]
        }
      ]
    });

    if (!hangmucChiso) {
      return res.status(404).json({ message: "Hạng mục chỉ số không tồn tại" });
    }

    res
      .status(200)
      .json({ message: "Lấy thông tin thành công", data: hangmucChiso });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi lấy thông tin hạng mục chỉ số", error });
  }
}

// Cập nhật thông tin hạng mục chỉ số
exports.updateHangmucChiso = async (req, res) => {
  try {
    const { ID_Hangmuc_Chiso } = req.params;
    const { ID_LoaiCS, Ten_Hangmuc_Chiso, Donvi, Heso } = req.body;

    const hangmucChiso = await Ent_Hangmuc_Chiso.findByPk(ID_Hangmuc_Chiso);

    if (!hangmucChiso) {
      return res.status(404).json({ message: "Hạng mục chỉ số không tồn tại" });
    }

    // Cập nhật thông tin hạng mục chỉ số
    const updatedHangmucChiso = await hangmucChiso.update({
      ID_LoaiCS,
      Ten_Hangmuc_Chiso,
      Heso,
      Donvi
    });

    res.status(200).json({
      message: "Cập nhật hạng mục chỉ số thành công",
      data: updatedHangmucChiso,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi cập nhật hạng mục chỉ số", error });
  }
};

// Xóa một hạng mục chỉ số
exports.deleteHangmucChiso = async (req, res) => {
  try {
    const { ID_Hangmuc_Chiso } = req.params;

    const hangmucChiso = await Ent_Hangmuc_Chiso.findByPk(ID_Hangmuc_Chiso);

    if (!hangmucChiso) {
      return res.status(404).json({ message: "Hạng mục chỉ số không tồn tại" });
    }

    // Đánh dấu hạng mục chỉ số là đã xóa (soft delete)
    await hangmucChiso.update({ isDelete: 1 });

    res.status(200).json({
      message: "Xóa hạng mục chỉ số thành công",
      data: hangmucChiso,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa hạng mục chỉ số", error });
  }
};
