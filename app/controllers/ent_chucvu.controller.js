const { Ent_chucvu } = require("../models/setup.model");
const Op = require("sequelize").Op;

exports.create = (req, res) => {
  try {
    if (!req.body.Chucvu) {
      res.status(400).json({
        message: "Phải nhập đầy đủ dữ liệu!",
      });
      return;
    }

    // Create a Ent_duan
    const Ent_chucvu = {
      Duan: req.body.Duan,
      isDelete: 0,
    };

    // Save Ent_duan in the database
    Ent_chucvu.create(data)
      .then((data) => {
        res.status(200).json({
          message: "Tạo chức vụ thành công!",
          data: data,
        });
      })
      .catch((err) => {
        res.status(500).json({
          message: err.message || "Lỗi! Vui lòng thử lại sau.",
        });
      });
    // } else {
    //     return res.status(401).json({
    //         message: "Bạn không có quyền truy cập",
    //     });
    // }
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

exports.get = async (req, res) => {
  try {
    const userData = req.user.data;
    const whereCondition = {
      isDelete: 0,
    };
    if (userData && userData.ent_chucvu.Role !== 10) {
      whereCondition.ID_Chucvu = { [Op.notIn]: [1, 5, 6, 7] };
    }
    if (userData && userData.ent_chucvu.Role == 10) {
      whereCondition.ID_Chucvu = { [Op.notIn]: [1] };
    }

    if (userData) {
      await Ent_chucvu.findAll({
        attributes: ["ID_Chucvu", "Chucvu", "isDelete"],
        where: whereCondition,
      })
        .then((data) => {
          res.status(200).json({
            message: "Danh sách chức vụ!",
            data: data,
          });
        })
        .catch((err) => {
          res.status(500).json({
            message: err.message || "Lỗi! Vui lòng thử lại sau.",
          });
        });
    } else {
      return res.status(401).json({
        message: "Bạn không có quyền truy cập",
      });
    }
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
      await Ent_chucvu.findByPk(req.params.id, {
        where: {
          isDelete: 0,
        },
      })
        .then((data) => {
          res.status(200).json({
            message: "Chức vụ chi tiết!",
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
