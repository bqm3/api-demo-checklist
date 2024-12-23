const { Ent_Loai_Chiso, Ent_duan } = require("../../models/setup.model");
const { Op } = require("sequelize");

exports.getAllLoai_Chiso = async (req, res) => {
  try {
    const loaiChisoList = await Ent_Loai_Chiso.findAll({
      where: { isDelete: 0 }, // Chỉ lấy các bản ghi chưa bị xóa
    });
    res
    .status(200)
    .json({ message: "Danh sách loại chỉ số", data: loaiChisoList });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi lấy danh sách loại chỉ số", error });
  }
};

exports.getbyDuAn = async (req, res) => {
  try {
    const userData = req.user.data;
    const ID_Duan = userData.ID_Duan;
    const data = await Ent_duan.findByPk(ID_Duan,{attributes:["ID_Duan","ID_LoaiCS"]});
    const ID_LoaiCSArray = data?.ID_LoaiCS.split(",").map((id) => parseInt(id.trim()));

    const loaiChisoList = await Ent_Loai_Chiso.findAll({
      where: {
        ID_LoaiCS: { [Op.in]: ID_LoaiCSArray },
        isDelete: 0,
      },
    });

    res
    .status(200)
    .json({ message: "Danh sách loại chỉ số của dự án", data: loaiChisoList });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách loại chỉ số", error });
  }
};


exports.createLoai_Chiso = async (req, res) => {
  try {
    const { ID_Duan_Loai, TenLoaiCS } = req.body;

    const newLoaiChiso = await Ent_Loai_Chiso.create({
      ID_Duan_Loai,
      TenLoaiCS,
    });

    res
      .status(201)
      .json({ message: "Thêm loại chỉ số thành công", data: newLoaiChiso });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi thêm loại chỉ số", error });
  }
};

exports.updateLoai_Chiso = async (req, res) => {
  try {
    const { id } = req.params;
    const { ID_Duan_Loai, TenLoaiCS } = req.body;

    const loaiChiso = await Ent_Loai_Chiso.findByPk(id);

    if (!loaiChiso || loaiChiso.isDelete) {
      return res.status(404).json({ message: "Loại chỉ số không tồn tại" });
    }

    await loaiChiso.update({ ID_Duan_Loai, TenLoaiCS });

    res
      .status(200)
      .json({ message: "Cập nhật loại chỉ số thành công", data: loaiChiso });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật loại chỉ số", error });
  }
};

exports.deleteLoai_Chiso = async (req, res) => {
  try {
    const { id } = req.params;

    const loaiChiso = await Ent_Loai_Chiso.findByPk(id);

    if (!loaiChiso || loaiChiso.isDelete) {
      return res.status(404).json({ message: "Loại chỉ số không tồn tại" });
    }

    await loaiChiso.update({ isDelete: 1 });

    res.status(200).json({ message: "Xóa loại chỉ số thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa loại chỉ số", error });
  }
};

