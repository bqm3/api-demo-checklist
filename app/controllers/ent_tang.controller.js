const { Ent_tang, Ent_duan, Ent_user } = require("../models/setup.model");
const { Op, Sequelize } = require("sequelize");
const { formatVietnameseText } = require("../utils/util");

// Create and Save a new Ent_tang
exports.create = async (req, res, next) => {
  // Validate request
  try {
    if (!req.body.Tentang) {
      res.status(400).json({
        message: "Cần nhập đầy đủ thông tin!",
      });
      return;
    }

    const userData = req.user.data;
    const tentangList = req.body.Tentang.split(",").map((t) => t.trim());

    // Create and save each floor record
    const records = await Promise.all(
      tentangList.map(async (tentang) => {
        const data = {
          Tentang: formatVietnameseText(tentang),
          ID_Duan: req.body.ID_Duan,
          isDelete: 0,
        };

        try {
          return await Ent_tang.create(data);
        } catch (err) {
          res.status(500).json({
            message: err.message || "Lỗi! Vui lòng thử lại sau.",
          });
          return;
        }
      })
    );

    res.status(200).json({
      message: "Tạo tầng thành công!",
      data: records,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

exports.get = async (req, res) => {
  try {
    const userData = req.user.data;

    await Ent_tang.findAll({
      attributes: ["ID_Tang", "Tentang", "ID_Duan", "isDelete"],
      include: [
        {
          model: Ent_duan,
          attributes: ["Duan", "Diachi", "Logo"],
        },
      ],
      where: {
        [Op.and]: {
          isDelete: 0,
          ID_Duan: userData.ID_Duan,
        },
      },
    })
      .then((data) => {
        res.status(200).json({
          message: "Danh sách tầng!",
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

exports.deleteMul = async (req, res) => {
  try {
    const userData = req.user.data;
    const deleteRows = req.body;
    const idsToDelete = deleteRows.map((row) => row.ID_Tang);
    if (userData) {
      Ent_tang.update(
        { isDelete: 1 },
        {
          where: {
            ID_Tang: idsToDelete,
          },
        }
      )
        .then((data) => {
          res.status(200).json({
            message: "Xóa tầng thành công!",
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
