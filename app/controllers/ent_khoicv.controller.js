const { Ent_toanha, Ent_khuvuc, Ent_khoicv } = require("../models/setup.model");

exports.get = async (req, res) => {
  try {
    await Ent_khoicv.findAll({
      attributes: ["ID_KhoiCV", "KhoiCV", "Chuky", "Ngaybatdau", "isDelete"],

      where: {
        isDelete: 0,
      },
    })
      .then((data) => {
        res.status(200).json({
          message: "Danh sách khối công việc!",
          data: data,
        });
      })
      .catch((err) => {
        res.status(500).json({
          message: err.message || "Lỗi! Vui lòng thử lại sau.",
        });
      });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

exports.getDetail = async (req, res) => {
  try {
    const userData = req.user.data;
    if (req.params.id && userData) {
      await Ent_khoicv.findByPk(req.params.id, {
        attributes: ["ID_KhoiCV", "KhoiCV"],

        where: {
          isDelete: 0,
        },
      })
        .then((data) => {
          res.status(200).json({
            message: "Khối công việc chi tiết!",
            data: data,
          });
        })
        .catch((err) => {
          res.status(500).json({
            message: err.message || "Lỗi! Vui lòng thử lại sau.",
          });
        });
    }
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

exports.getDetailDuAn = async (req, res) =>{
  try{
    
  }catch(error){
    return res.status(500).json({
      message: error.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
}