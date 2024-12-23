const {
  Ent_toanha,
  Ent_duan,
  Ent_khuvuc,
  Ent_user,
  Ent_hangmuc,
  Ent_khuvuc_khoicv,
  Ent_khoicv,
  Ent_duan_khoicv,
} = require("../models/setup.model");
const { Op, Sequelize } = require("sequelize");
const { formatVietnameseText } = require("../utils/util");

exports.create = (req, res) => {
  // Validate request
  if (!req.body.Toanha || !req.body.Sotang) {
    res.status(400).json({
      message: "Phải nhập đầy đủ dữ liệu!",
    });
    return;
  }

  // Create a Ent_toanha
  const data = {
    ID_Duan: req.body.ID_Duan,
    Toanha: formatVietnameseText(req.body.Toanha),
    Sotang: req.body.Sotang,
    isDelete: 0,
  };

  // Save Ent_toanha in the database
  Ent_toanha.create(data)
    .then((data) => {
      res.status(200).json({
        message: "Tạo tòa nhà thành công!",
        data: data,
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: err.message || "Lỗi! Vui lòng thử lại sau.",
      });
    });
};

exports.get = async (req, res) => {
  try {
    const userData = req.user.data;
    if (userData) {
      let whereClause = {
        isDelete: 0,
      };

      if ((userData.ent_chucvu.Role == 10 && userData.ID_Duan !== null) || userData.ent_chucvu.Role !== 10 ) {
        whereClause.ID_Duan = userData.ID_Duan;
      }

      await Ent_toanha.findAll({
        attributes: ["ID_Toanha", "ID_Duan", "Toanha", "Sotang", "isDelete"],
        include: {
          model: Ent_duan,
          attributes: ["Duan"],
          include: [
            {
              model: Ent_duan_khoicv,
              as: "ent_duan_khoicv",
              attributes: ["ID_KhoiCV", "Chuky", "Ngaybatdau", "isDelete"],
              where: {
                isDelete: 0
              }
            }
          ]
        },
        where: whereClause,
        order: [["ID_Duan", "ASC"]],
      })
        .then((data) => {
          res.status(200).json({
            message: "Danh sách tòa nhà!",
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

exports.getDetail = async (req, res) => {
  try {
    const userData = req.user.data;
    if (userData) {
      let whereClause = {
        isDelete: 0,
      };

      if (userData.ID_Chucvu !== 1 || userData.ent_chucvu.Chucvu !== "PSH") {
        whereClause.ID_Duan = userData.ID_Duan;
      }

      await Ent_toanha.findByPk(req.params.id, {
        attributes: ["ID_Toanha", "ID_Duan", "Toanha", "Sotang", "isDelete"],
        include: {
          model: Ent_duan,
          attributes: ["Duan"],
          include: [
            {
              model: Ent_duan_khoicv,
              as: "ent_duan_khoicv",
              attributes: ["ID_KhoiCV", "Chuky", "Ngaybatdau"]
            }
          ]
        },
        where: whereClause,
        order: [["ID_Duan", "ASC"]],
      })
        .then((data) => {
          res.status(200).json({
            message: "Danh sách tòa nhà!",
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

exports.update = async (req, res) => {
  try {
    const userData = req.user.data;
    if (req.params.id && userData) {
      Ent_toanha.update(
        {
          ID_Duan: req.body.ID_Duan,
          Toanha: req.body.Toanha,
          Sotang: req.body.Sotang,
        },
        {
          where: {
            ID_Toanha: req.params.id,
          },
        }
      )
        .then((data) => {
          res.status(200).json({
            message: "Cập nhật tòa nhà thành công!!!",
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

exports.delete = async (req, res) => {
  try {
    const userData = req.user.data;
    if (userData) {
      let whereClause = {
        isDelete: 0,
      };

      if (userData.ID_Chucvu !== 1 || userData.ent_chucvu.Chucvu !== "PSH") {
        whereClause.ID_Duan = userData.ID_Duan;
      }

      Ent_toanha.update(
        { isDelete: 1 },
        {
          where: {
            ID_Toanha: req.params.id,
          },
        }
      )
        .then((data) => {
          res.status(200).json({
            message: "Danh sách tòa nhà!",
            data: data,
          });
        })
        .catch((err) => {
          res.status(500).json({
            message: err.message || "Lỗi! Vui lòng thử lại sau.",
          });
        });
    }
  } catch (error) {
    res.status(500).json({
      message: error.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

exports.getKhuvucByToanha = async (req, res) => {
  try {
    const userData = req.user.data;

    const ID_User = req.params.id;
    if (userData) {
      let whereClause = {
        isDelete: 0,
      };

      if (userData.ID_Chucvu !== 1 || userData.ent_chucvu.Chucvu !== "PSH") {
        whereClause.ID_Duan = userData.ID_Duan;
      }

      const user = await Ent_user.findByPk(ID_User, {
        attributes: [
          "ID_User",
          "UserName",
          "ID_Chucvu",
          "ID_Duan",
          "Password",
          "ID_KhoiCV",
          "Email",
          "isDelete",
        ],
      });

      await Ent_khuvuc.findAll({
        attributes: [
          "ID_Khuvuc",
          "ID_Toanha",
          "Sothutu",
          "ID_KhoiCVs",
          "Makhuvuc",
          "MaQrCode",
          "Tenkhuvuc",
          "ID_User",
          "isDelete",
        ],
        include: [
          {
            model: Ent_toanha,
            attributes: ["Toanha", "Sotang"],
          },
          {
            model: Ent_khuvuc_khoicv,
            attributes: ["ID_KhoiCV", "ID_Khuvuc", "ID_KV_CV"],
            include: [
              {
                model: Ent_khoicv,
                attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
              },
            ],
          },
          {
            model: Ent_hangmuc,
            as: "ent_hangmuc",
            attributes: ["ID_Hangmuc", "Hangmuc", "MaQrCode", "Tieuchuankt"],
          },
        ],
        where: { isDelete: 0 },
      })
        .then((data) => {
          res.status(200).json({
            message: "Danh sách tòa nhà!",
            data: data,
            user: user,
          });
        })
        .catch((err) => {
          res.status(500).json({
            message: err.message || "Lỗi! Vui lòng thử lại sau.",
          });
        });
    }
  } catch (error) {
    res.status(500).json({
      message: error.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};
