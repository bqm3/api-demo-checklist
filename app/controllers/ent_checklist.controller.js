const sequelize = require("../config/db.config");
const xlsx = require("xlsx");
const {
  Ent_checklist,
  Ent_khuvuc,
  Ent_tang,
  Ent_user,
  Ent_chucvu,
  Ent_toanha,
  Ent_khoicv,
  Ent_duan,
  Ent_hangmuc,
  Tb_checklistchitiet,
  Tb_checklistchitietdone,
  Tb_checklistc,
  Ent_calv,
  Ent_khuvuc_khoicv,
} = require("../models/setup.model");
const { Op, Sequelize } = require("sequelize");
const {
  removeSpacesFromKeys,
  formatVietnameseText,
  removeVietnameseTones,
} = require("../utils/util");

exports.create = async (req, res) => {
  try {
    const userData = req.user.data;
    if (userData) {
      if (!req.body.Checklist || !req.body.Giatrinhan || !req.body.ID_Hangmuc) {
        res.status(400).json({
          message: "Phải nhập đầy đủ dữ liệu!",
        });
        return;
      }

      const data = {
        ID_Khuvuc: req.body.ID_Khuvuc,
        ID_Tang: req.body.ID_Tang,
        ID_Hangmuc: req.body.ID_Hangmuc,
        Sothutu: req.body.Sothutu || 0,
        Maso: req.body.Maso || "",
        MaQrCode: req.body.MaQrCode || "",
        Checklist: req.body.Checklist,
        Ghichu: req.body.Ghichu || "",
        Tieuchuan: req.body.Tieuchuan || "",
        Giatridinhdanh:
          req.body.Giatridinhdanh || req.body.Giatrinhan.split("/")[0] || "",
        Giatrinhan: req.body.Giatrinhan || "",
        Giatriloi: req.body.Giatriloi || "",
        ID_User: userData.ID_User,
        isDelete: 0,
        Tinhtrang: 0,
        isImportant: req.body.isImportant || 0,
        isCheck: req.body.isCheck,
      };

      Ent_checklist.create(data)
        .then(async (data) => {
          res.status(200).json({
            message: "Tạo checklist thành công!",
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

exports.get = async (req, res) => {
  try {
    const userData = req.user.data;
    if (!userData) {
      return res
        .status(401)
        .json({ message: "Không tìm thấy thông tin người dùng." });
    }

    const page = parseInt(req.query.page) || 1;
    // const pageSize = 500;
    const pageSize = parseInt(req.query.limit) || 100; // Số lượng phần tử trên mỗi trang
    const offset = (page - 1) * pageSize;

    const orConditions = [];
    if (userData) {
      orConditions.push({
        "$ent_khuvuc.ent_toanha.ID_Duan$": userData?.ID_Duan,
      });
    }

    const totalCount = await Ent_checklist.count({
      attributes: [
        "ID_Checklist",
        "ID_Khuvuc",
        "ID_Hangmuc",
        "ID_Tang",
        "Sothutu",
        "Maso",
        "MaQrCode",
        "Checklist",
        "Ghichu",
        "Tieuchuan",
        "Giatridinhdanh",
        "Giatriloi",
        "isCheck",
        "Giatrinhan",
        "ID_User",
        "isDelete",
      ],
      include: [
        {
          model: Ent_hangmuc,
          attributes: [
            "Hangmuc",
            "Tieuchuankt",
            "ID_Khuvuc",
            "MaQrCode",
            "FileTieuChuan",
            "isDelete",
          ],
          where: {
            isDelete: 0,
          },
        },
        {
          model: Ent_khuvuc,
          attributes: [
            "Tenkhuvuc",
            "MaQrCode",
            "Makhuvuc",
            "Sothutu",
            "ID_Toanha",
            "ID_Khuvuc",
            "isDelete",
          ],
          include: [
            {
              model: Ent_toanha,
              attributes: ["Toanha", "ID_Toanha"],
              include: {
                model: Ent_duan,
                attributes: [
                  "ID_Duan",
                  "Duan",
                  "Diachi",
                  "Vido",
                  "Kinhdo",
                  "Logo",
                ],
                where: { ID_Duan: userData.ID_Duan },
              },
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
          ],
          where: {
            isDelete: 0,
          },
        },
        {
          model: Ent_tang,
          attributes: ["Tentang"],
        },
        {
          model: Ent_user,
          include: {
            model: Ent_chucvu,
            attributes: ["Chucvu", "Role"],
          },
          attributes: ["UserName", "Email"],
        },
      ],
      where: {
        isDelete: 0,
        [Op.and]: [orConditions],
      },
    });

    const totalPages = Math.ceil(totalCount / pageSize);

    const data = await Ent_checklist.findAll({
      attributes: [
        "ID_Checklist",
        "ID_Khuvuc",
        "ID_Tang",
        "ID_Hangmuc",
        "Sothutu",
        "Maso",
        "MaQrCode",
        "Checklist",
        "Ghichu",
        "Giatriloi",
        "Tieuchuan",
        "Giatridinhdanh",
        "isCheck",
        "Giatrinhan",
        "Tinhtrang",
        "calv_1",
        "calv_2",
        "calv_3",
        "calv_4",
        "ID_User",
        "isImportant",
        "isDelete",
      ],
      include: [
        {
          model: Ent_hangmuc,
          attributes: [
            "Hangmuc",
            "Tieuchuankt",
            "ID_Khuvuc",
            "MaQrCode",
            "FileTieuChuan",
            "isDelete",
          ],
          where: {
            isDelete: 0,
          },
        },
        {
          model: Ent_khuvuc,
          attributes: [
            "Tenkhuvuc",
            "MaQrCode",
            "Makhuvuc",
            "Sothutu",
            "ID_Toanha",
            "ID_Khuvuc",
            "isDelete",
          ],
          include: [
            {
              model: Ent_toanha,
              attributes: ["Toanha", "ID_Toanha"],
              include: {
                model: Ent_duan,
                attributes: [
                  "ID_Duan",
                  "Duan",
                  "Diachi",
                  "Vido",
                  "Kinhdo",
                  "Logo",
                ],
                where: { ID_Duan: userData.ID_Duan },
              },
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
          ],
          where: {
            isDelete: 0,
          },
        },
        {
          model: Ent_tang,
          attributes: ["Tentang"],
        },
        {
          model: Ent_user,
          include: {
            model: Ent_chucvu,
            attributes: ["Chucvu", "Role"],
          },
          attributes: ["UserName", "Email"],
        },
      ],
      where: {
        isDelete: 0,
        [Op.and]: [orConditions],
      },
      order: [
        ["ID_Khuvuc", "ASC"],
        ["Sothutu", "ASC"],
      ],
      offset: offset,
      limit: pageSize,
    });

    if (!data || data.length === 0) {
      return res.status(200).json({
        message: "Không còn checklist cho ca làm việc này!",
        data: [],
      });
    }

    const filteredData = data.filter((item) => item.ent_khuvuc !== null);

    if (filteredData.length > 0) {
      return res.status(200).json({
        message: "Danh sách checklist!",
        page: page,
        pageSize: pageSize,
        totalPages: totalPages,
        totalCount: totalCount,
        data: filteredData,
      });
    } else {
      return res.status(200).json({
        message: "Không còn checklist cho ca làm việc này!",
        data: [],
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
      await Ent_checklist.findByPk(req.params.id, {
        attributes: [
          "ID_Checklist",
          "ID_Khuvuc",
          "ID_Tang",
          "ID_Hangmuc",
          "Sothutu",
          "Maso",
          "MaQrCode",
          "Checklist",
          "Ghichu",
          "Tieuchuan",
          "Giatridinhdanh",
          "isCheck",
          "Giatrinhan",
          "Giatriloi",
          "ID_User",
          "isDelete",
          "isImportant",
          "Tinhtrang",
        ],
        include: [
          {
            model: Ent_hangmuc,
            attributes: [
              "Hangmuc",
              "Tieuchuankt",
              "ID_Khuvuc",
              "MaQrCode",
              "FileTieuChuan",
            ],
          },
          {
            model: Ent_khuvuc,
            attributes: [
              "Tenkhuvuc",
              "MaQrCode",
              "Makhuvuc",
              "Sothutu",
              "ID_Toanha",
              "ID_Khuvuc",
            ],
            include: [
              {
                model: Ent_toanha,
                attributes: ["Toanha", "ID_Toanha"],
                include: {
                  model: Ent_duan,
                  attributes: [
                    "ID_Duan",
                    "Duan",
                    "Diachi",
                    "Vido",
                    "Kinhdo",
                    "Logo",
                  ],
                  where: { ID_Duan: userData.ID_Duan },
                },
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
            ],
          },
          {
            model: Ent_tang,
            attributes: ["Tentang"],
          },
          {
            model: Ent_user,
            include: {
              model: Ent_chucvu,
              attributes: ["Chucvu", "Role"],
            },
            attributes: ["UserName", "Email"],
          },
        ],
        where: {
          isDelete: 0,
        },
      })
        .then((data) => {
          if (data) {
            res.status(200).json({
              message: "Checklist chi tiết!",
              data: data,
            });
          } else {
            res.status(400).json({
              message: "Không có checklist cần tìm!",
            });
          }
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
      if (!req.body.Giatrinhan || !req.body.Checklist) {
        return res.status(400).json({
          message: "Cần nhập đầy đủ thông tin!",
        });
      }

      // Chuẩn bị dữ liệu để cập nhật
      const reqData = {
        ID_Khuvuc: req.body.ID_Khuvuc,
        ID_Tang: req.body.ID_Tang,
        ID_Hangmuc: req.body.ID_Hangmuc,
        Sothutu: req.body.Sothutu,
        Maso: req.body.Maso,
        MaQrCode: req.body.MaQrCode,
        Checklist: req.body.Checklist,
        Ghichu: req.body.Ghichu || "",
        Giatridinhdanh: req.body.Giatridinhdanh || "",
        Giatrinhan: req.body.Giatrinhan || "",
        Giatriloi: req.body.Giatriloi || "",
        isCheck: req.body.isCheck,
        Tieuchuan: req.body.Tieuchuan || "",
        // calv_1: JSON.stringify(validCalv[0]) || null,
        // calv_2: JSON.stringify(validCalv[1]) || null,
        // calv_3: JSON.stringify(validCalv[2]) || null,
        // calv_4: JSON.stringify(validCalv[3]) || null,
        isDelete: 0,
        isImportant: req.body.isImportant || 0,
      };

      // Thực hiện cập nhật dữ liệu
      Ent_checklist.update(reqData, {
        where: {
          ID_Checklist: req.params.id,
        },
      })
        .then((data) => {
          res.status(200).json({
            message: "Cập nhật checklist thành công!",
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

exports.delete = async (req, res) => {
  try {
    const userData = req.user.data;
    if (req.params.id && userData) {
      Ent_checklist.update(
        { isDelete: 1 },
        {
          where: {
            ID_Checklist: req.params.id,
          },
        }
      )
        .then((data) => {
          res.status(200).json({
            message: "Xóa checklist thành công!",
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

exports.deleteMul = async (req, res) => {
  try {
    const userData = req.user.data;
    const deleteRows = req.body;
    const idsToDelete = deleteRows.map((row) => row.ID_Checklist);
    if (userData) {
      Ent_checklist.update(
        { isDelete: 1, ID_User: userData.ID_User },
        {
          where: {
            ID_Checklist: idsToDelete,
          },
        }
      )
        .then((data) => {
          res.status(200).json({
            message: "Xóa checklist thành công!",
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

// filter data
exports.getFilter = async (req, res) => {
  try {
    const userData = req.user.data;
    const ID_Khuvuc = req.body.ID_Khuvuc;
    const ID_Tang = req.body.ID_Tang;
    const ID_Toanha = req.body.ID_Toanha;
    const orConditions = [];

    const ID_KhoiCV = req.params.id;
    const ID_Calv = req.params.id_calv;
    const ID_ChecklistC = req.params.idc;
    const ID_Hangmuc = req.params.id_hm;

    if (userData) {
      if (ID_Khuvuc !== null && ID_Khuvuc !== undefined) {
        orConditions.push({ ID_Khuvuc: ID_Khuvuc });
      }

      if (ID_Hangmuc !== null) {
        orConditions.push({ ID_Hangmuc: ID_Hangmuc });
      }

      if (ID_Tang !== null) {
        orConditions.push({ ID_Tang: ID_Tang });
      }

      if (ID_Toanha !== null) {
        orConditions.push({ "$ent_khuvuc.ent_toanha.ID_Toanha$": ID_Toanha });
      }

      const checklistItems = await Tb_checklistchitiet.findAll({
        attributes: ["ID_Checklist", "isDelete", "ID_ChecklistC"],
        where: { isDelete: 0 },
      });

      const checklistDoneItems = await Tb_checklistchitietdone.findAll({
        attributes: ["Description", "isDelete", "ID_ChecklistC"],
        where: { isDelete: 0, ID_ChecklistC: ID_ChecklistC },
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
      // // Duyệt qua từng phần tử trong mảng checklistDoneItems

      const checklistIds = checklistItems.map((item) => item.ID_Checklist);
      const checklistDoneIds = arrPush.map((item) => item.ID_Checklist);

      let whereCondition = {
        isDelete: 0,
      };
      whereCondition["$ent_khuvuc.ent_toanha.ID_Duan$"] = userData?.ID_Duan;

      if (
        checklistIds &&
        Array.isArray(checklistIds) &&
        checklistIds.length > 0 &&
        checklistDoneIds &&
        checklistDoneIds.length > 0
      ) {
        whereCondition.ID_Checklist = {
          [Op.notIn]: [...checklistIds, ...checklistDoneIds],
        };
      } else if (
        checklistIds &&
        Array.isArray(checklistIds) &&
        checklistIds.length > 0
      ) {
        whereCondition.ID_Checklist = {
          [Op.notIn]: checklistIds,
        };
      } else if (checklistDoneIds && checklistDoneIds.length > 0) {
        whereCondition.ID_Checklist = {
          [Op.notIn]: checklistDoneIds,
        };
      }

      await Ent_checklist.findAll({
        attributes: [
          "ID_Checklist",
          "ID_Khuvuc",
          "ID_Tang",
          "ID_Hangmuc",
          "Sothutu",
          "Maso",
          "MaQrCode",
          "Checklist",
          "Ghichu",
          "Tieuchuan",
          "Giatridinhdanh",
          "isCheck",
          "Giatrinhan",
          "ID_User",
          "isDelete",
          "isImportant",
        ],
        include: [
          {
            model: Ent_hangmuc,
            attributes: [
              "Hangmuc",
              "Tieuchuankt",
              "ID_Khuvuc",
              "MaQrCode",
              "ID_KhoiCV",
              "FileTieuChuan",
            ],
          },
          {
            model: Ent_khuvuc,
            attributes: [
              "ID_Toanha",
              "ID_Khuvuc",
              "Sothutu",
              "MaQrCode",
              "ID_KhoiCVs",
              "Tenkhuvuc",
              "ID_User",
              "isDelete",
            ],
            where: {
              isDelete: 0,
            },
            include: [
              {
                model: Ent_khuvuc_khoicv,
                attributes: ["ID_KV_CV", "ID_Khuvuc", "ID_KhoiCV"],
                include: [
                  {
                    model: Ent_khoicv,
                    attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
                  },
                ],
              },
              {
                model: Ent_toanha,
                attributes: [
                  "ID_Toanha",
                  "ID_Duan",
                  "Toanha",
                  "Sotang",
                  "isDelete",
                ],
                where: {
                  isDelete: 0,
                },
              },
            ],
          },
          {
            model: Ent_tang,
            attributes: ["Tentang"],
          },
          {
            model: Ent_user,
            include: {
              model: Ent_chucvu,
              attributes: ["Chucvu", "Role"],
            },
            attributes: ["UserName", "Email"],
          },
        ],
        where: {
          isDelete: 0,
          [Op.and]: [orConditions, whereCondition],
        },
      })
        .then((data) => {
          res.status(200).json({
            message: "Thông tin khu vực!",
            data: data,
          });
        })
        .catch((err) => {
          res.status(500).json({
            message: err.message || "Lỗi! Vui lòng thử lại sau.",
          });
        });
    } else {
      // Trả về lỗi nếu không có dữ liệu người dùng hoặc không có ID được cung cấp
      return res.status(400).json({
        message: "Vui lòng cung cấp ít nhất một trong hai ID.",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: error.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

exports.deleteChecklists = async (req, res) => {
  try {
    const ids = req.params.ids.split(",");
    const userData = req.user.data;

    if (ids && userData) {
      Ent_checklist.update(
        { isDelete: 1 },
        {
          where: {
            ID_Checklist: ids,
          },
        }
      )
        .then((data) => {
          res.status(200).json({
            message: "Xóa checklist thành công!",
          });
        })
        .catch((err) => {
          res.status(500).json({
            message: err.message || "Lỗi! Vui lòng thử lại sau.",
          });
        });
    }
  } catch (err) {
    res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

// get data
exports.getChecklist = async (req, res) => {
  try {
    const userData = req.user.data;
    const ID_KhoiCV = req.params.id;
    const ID_ChecklistC = req.params.idc;
    const ID_Calv = req.params.id_calv;
    const ID_Hangmuc = req.params.id_hm;
    if (!userData || !ID_KhoiCV) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ." });
    }
    // const pageMaxSize =
    const checklistItems = await Tb_checklistchitiet.findAll({
      attributes: ["isDelete", "ID_Checklist"],
      where: { isDelete: 0 },
    });

    const checklistDoneItems = await Tb_checklistchitietdone.findAll({
      attributes: ["Description", "isDelete", "ID_ChecklistC"],
      where: { isDelete: 0, ID_ChecklistC: ID_ChecklistC },
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

    const checklistIds = checklistItems.map((item) => item?.ID_Checklist) || [];
    const checklistDoneIds = arrPush.map((item) => item?.ID_Checklist) || [];

    let whereCondition = {
      isDelete: 0,
    };

    whereCondition["$ent_khuvuc.ent_toanha.ID_Duan$"] = userData?.ID_Duan;
    // whereCondition["$ent_hangmuc.ID_KhoiCV$"] = userData?.ID_KhoiCV;

    if (
      checklistIds &&
      Array.isArray(checklistIds) &&
      checklistIds.length > 0 &&
      checklistDoneIds &&
      checklistDoneIds.length > 0
    ) {
      whereCondition.ID_Checklist = {
        [Op.notIn]: [...checklistIds, ...checklistDoneIds],
      };
    } else if (
      checklistIds &&
      Array.isArray(checklistIds) &&
      checklistIds.length > 0 &&
      checklistDoneIds.length === 0
    ) {
      whereCondition.ID_Checklist = {
        [Op.notIn]: checklistIds,
      };
    } else if (
      checklistDoneIds &&
      checklistDoneIds.length > 0 &&
      checklistIds.length == 0
    ) {
      whereCondition.ID_Checklist = {
        [Op.notIn]: checklistDoneIds,
      };
    }

    const checklistData = await Ent_checklist.findAll({
      attributes: [
        "ID_Checklist",
        "ID_Khuvuc",
        "ID_Hangmuc",
        "ID_Tang",
        "Sothutu",
        "Maso",
        "MaQrCode",
        "Checklist",
        "Ghichu",
        "Tieuchuan",
        "Giatridinhdanh",
        "isCheck",
        "Giatriloi",
        "Giatrinhan",
        "ID_User",

        "calv_1",
        "calv_2",
        "calv_3",
        "calv_4",
        "isDelete",
        "isImportant",
      ],
      include: [
        {
          model: Ent_tang,
          attributes: ["Tentang"],
        },
        {
          model: Ent_hangmuc,
          attributes: [
            "Hangmuc",
            "Tieuchuankt",
            "ID_Khuvuc",
            "MaQrCode",
            "FileTieuChuan",
          ],
        },
        {
          model: Ent_khuvuc,
          attributes: [
            "Tenkhuvuc",
            "MaQrCode",
            "Makhuvuc",
            "Sothutu",
            "ID_Toanha",
            "ID_Khuvuc",
          ],
          include: [
            {
              model: Ent_toanha,
              attributes: ["Toanha", "ID_Toanha"],
              include: {
                model: Ent_duan,
                attributes: [
                  "ID_Duan",
                  "Duan",
                  "Diachi",
                  "Vido",
                  "Kinhdo",
                  "Logo",
                ],
                where: { ID_Duan: userData.ID_Duan },
              },
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
              where: {
                ID_KhoiCV: userData?.ID_KhoiCV,
              },
            },
          ],
        },
        {
          model: Ent_user,
          include: {
            model: Ent_chucvu,
            attributes: ["Chucvu", "Role"],
          },
          attributes: ["UserName", "Email"],
        },
      ],
      where: whereCondition,
      order: [
        ["ID_Khuvuc", "ASC"],
        ["Sothutu", "ASC"],
        ["ID_Checklist", "ASC"],
      ],
    });

    if (!checklistData || checklistData.length === 0) {
      return res.status(200).json({
        message: "Không còn checklist cho ca làm việc này!",
        data: [],
      });
    }

    const filteredData = checklistData.filter(
      (item) => item.ent_hangmuc !== null
    );

    return res.status(200).json({
      message:
        filteredData.length > 0
          ? "Danh sách checklist!"
          : "Không còn checklist cho ca làm việc này!",
      length: filteredData.length,
      data: filteredData,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

// get data filter search
exports.getFilterSearch = async (req, res) => {
  try {
    const userData = req.user.data;
    if (!userData) {
      return res
        .status(401)
        .json({ message: "Không tìm thấy thông tin người dùng." });
    }

    const ID_Khuvuc = req.body.ID_Khuvuc;
    const ID_Tang = req.body.ID_Tang;
    const ID_Hangmuc = req.body.ID_Hangmuc;

    const page = parseInt(req.query.page) || 1;
    // const pageSize = 500;
    const pageSize = parseInt(req.query.limit) || 100; // Số lượng phần tử trên mỗi trang
    const offset = (page - 1) * pageSize;

    const orConditions = [];
    if (userData) {
      orConditions.push({
        "$ent_hangmuc.ent_khuvuc.ent_toanha.ID_Duan$": userData.ID_Duan,
      });
    }

    if (ID_Khuvuc !== null) {
      orConditions.push({
        "$ent_hangmuc.ent_khuvuc.ID_Khuvuc$": ID_Khuvuc,
      });
    }

    if (ID_Tang !== null) {
      orConditions.push({
        ID_Tang: ID_Tang,
      });
    }

    if (ID_Hangmuc !== null) {
      orConditions.push({
        ID_Hangmuc: ID_Hangmuc,
      });
    }

    const totalCount = await Ent_checklist.count({
      attributes: [
        "ID_Checklist",
        "ID_Khuvuc",
        "ID_Tang",
        "ID_Hangmuc",
        "Sothutu",
        "Maso",
        "MaQrCode",
        "Checklist",
        "Ghichu",
        "Tieuchuan",
        "Giatridinhdanh",
        "isCheck",
        "Giatrinhan",
        "ID_User",
        "isDelete",
        "isImportant",
      ],
      include: [
        {
          model: Ent_hangmuc,
          attributes: [
            "Hangmuc",
            "Tieuchuankt",
            "ID_Khuvuc",
            "MaQrCode",
            "FileTieuChuan",
          ],
        },
        {
          model: Ent_khuvuc,
          attributes: [
            "Tenkhuvuc",
            "MaQrCode",
            "Makhuvuc",
            "Sothutu",
            "ID_Toanha",
            "ID_Khuvuc",
          ],
          include: [
            {
              model: Ent_toanha,
              attributes: ["Toanha", "ID_Toanha"],
              include: {
                model: Ent_duan,
                attributes: [
                  "ID_Duan",
                  "Duan",
                  "Diachi",
                  "Vido",
                  "Kinhdo",
                  "Logo",
                ],
                where: { ID_Duan: userData.ID_Duan },
              },
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
          ],
        },
        {
          model: Ent_tang,
          attributes: ["Tentang"],
        },
        {
          model: Ent_user,
          include: {
            model: Ent_chucvu,
            attributes: ["Chucvu", "Role"],
          },
          attributes: ["UserName", "Email"],
        },
      ],
      where: {
        isDelete: 0,
        [Op.and]: [orConditions],
      },
    });

    const totalPages = Math.ceil(totalCount / pageSize);

    const data = await Ent_checklist.findAll({
      attributes: [
        "ID_Checklist",
        "ID_Khuvuc",
        "ID_Hangmuc",
        "ID_Tang",
        "Sothutu",
        "Maso",
        "MaQrCode",
        "Checklist",
        "Ghichu",
        "Tieuchuan",
        "Giatriloi",
        "Giatridinhdanh",
        "isCheck",
        "Giatrinhan",
        "ID_User",
        "isDelete",
        "isImportant",
      ],
      include: [
        {
          model: Ent_hangmuc,
          attributes: [
            "Hangmuc",
            "Tieuchuankt",
            "ID_Khuvuc",
            "MaQrCode",
            "FileTieuChuan",
          ],
        },
        {
          model: Ent_khuvuc,
          attributes: [
            "Tenkhuvuc",
            "MaQrCode",
            "Makhuvuc",
            "Sothutu",
            "ID_Toanha",
            "ID_Khuvuc",
          ],
          include: [
            {
              model: Ent_toanha,
              attributes: ["Toanha", "ID_Toanha"],
              include: {
                model: Ent_duan,
                attributes: [
                  "ID_Duan",
                  "Duan",
                  "Diachi",
                  "Vido",
                  "Kinhdo",
                  "Logo",
                ],
                where: { ID_Duan: userData.ID_Duan },
              },
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
          ],
        },
        {
          model: Ent_tang,
          attributes: ["Tentang"],
        },
        {
          model: Ent_user,
          include: {
            model: Ent_chucvu,
            attributes: ["Chucvu", "Role"],
          },
          attributes: ["UserName", "Email"],
        },
      ],
      where: {
        isDelete: 0,
        [Op.and]: [orConditions],
      },
      order: [
        ["ID_Khuvuc", "ASC"],
        ["Sothutu", "ASC"],
        ["ID_Checklist", "ASC"],
      ],
      offset: offset,
      limit: pageSize,
    });

    if (!data || data.length === 0) {
      return res.status(200).json({
        message: "Không còn checklist cho ca làm việc này!",
        data: [],
      });
    }

    const filteredData = data.filter((item) => item.ent_khuvuc !== null);

    if (filteredData.length > 0) {
      return res.status(200).json({
        message: "Danh sách checklist!",
        page: page,
        pageSize: pageSize,
        totalPages: totalPages,
        data: filteredData,
      });
    } else {
      return res.status(200).json({
        message: "Không còn checklist cho ca làm việc này!",
        data: [],
      });
    }
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

exports.filterChecklists = async (req, res) => {
  try {
    const userData = req.user.data;
    const ID_ChecklistC = req.params.idc;
    const ID_Hangmucs = req.body.dataHangmuc;
    const ID_KhoiCV = req.body.ID_KhoiCV;

    // const tbChecklist = await Tb_checklistc.findByPk(ID_ChecklistC, {
    //   attributes: ["ID_Hangmucs", "isDelete"],
    //   where: {
    //     isDelete: 0,
    //   },
    // });

    const checklistItems = await Tb_checklistchitiet.findAll({
      attributes: [
        "isDelete",
        "ID_Checklist",
        "ID_ChecklistC",
        "isCheckListLai",
      ],
      where: { isDelete: 0, ID_ChecklistC: ID_ChecklistC, isCheckListLai: 0 },
    });

    const checklistDoneItems = await Tb_checklistchitietdone.findAll({
      attributes: [
        "Description",
        "isDelete",
        "ID_ChecklistC",
        "isCheckListLai",
      ],
      where: { isDelete: 0, ID_ChecklistC: ID_ChecklistC, isCheckListLai: 0 },
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

    const checklistIds =
      checklistItems
        .map((item) => item?.ID_Checklist)
        .filter((id) => !isNaN(id)) || [];

    const checklistDoneIds = arrPush
      .map((item) => item?.ID_Checklist) // Map to extract IDs
      .filter((id) => !isNaN(id));

    let whereCondition = {
      isDelete: 0,
      ID_Hangmuc: {
        [Op.in]: ID_Hangmucs,
      },
    };

    whereCondition["$ent_khuvuc.ent_toanha.ID_Duan$"] = userData?.ID_Duan;

    if (
      checklistIds &&
      Array.isArray(checklistIds) &&
      checklistIds.length > 0 &&
      checklistDoneIds &&
      checklistDoneIds.length > 0
    ) {
      whereCondition.ID_Checklist = {
        [Op.notIn]: [...checklistIds, ...checklistDoneIds],
      };
    } else if (
      checklistIds &&
      Array.isArray(checklistIds) &&
      checklistIds.length > 0 &&
      checklistDoneIds.length === 0
    ) {
      whereCondition.ID_Checklist = {
        [Op.notIn]: checklistIds,
      };
    } else if (
      checklistDoneIds &&
      checklistDoneIds.length > 0 &&
      checklistIds.length == 0
    ) {
      whereCondition.ID_Checklist = {
        [Op.notIn]: checklistDoneIds,
      };
    }

    const checklistData = await Ent_checklist.findAll({
      attributes: [
        "ID_Checklist",
        "ID_Khuvuc",
        "ID_Hangmuc",
        "ID_Tang",
        "Sothutu",
        "Maso",
        "MaQrCode",
        "isImportant",
        "Checklist",
        "Ghichu",
        "Tieuchuan",
        "Giatridinhdanh",
        "Giatriloi",
        "isCheck",
        "Giatrinhan",
        "Tinhtrang",
        "ID_User",
        "calv_1",
        "calv_2",
        "calv_3",
        "calv_4",
        "isDelete",
      ],
      include: [
        {
          model: Ent_hangmuc,
          attributes: [
            "Hangmuc",
            "Tieuchuankt",
            "ID_Hangmuc",
            "MaQrCode",
            "FileTieuChuan",
          ],
          where: {
            ID_Hangmuc: {
              [Op.in]: ID_Hangmucs,
            },
          },
        },
        {
          model: Ent_khuvuc,
          attributes: [
            "Tenkhuvuc",
            "MaQrCode",
            "Makhuvuc",
            "Sothutu",
            "ID_Toanha",
            "ID_Khuvuc",
          ],
          include: [
            {
              model: Ent_toanha,
              attributes: ["Toanha", "ID_Toanha"],
              include: {
                model: Ent_duan,
                attributes: [
                  "ID_Duan",
                  "Duan",
                  "Diachi",
                  "Vido",
                  "Kinhdo",
                  "Logo",
                ],
                where: { ID_Duan: userData.ID_Duan },
              },
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
              where: {
                ID_KhoiCV: ID_KhoiCV ? ID_KhoiCV : userData.ID_KhoiCV,
              },
            },
          ],
        },
        {
          model: Ent_tang,
          attributes: ["Tentang"],
        },
      ],
      where: whereCondition,
      order: [
        ["ID_Khuvuc", "ASC"],
        ["Sothutu", "ASC"],
        ["ID_Checklist", "ASC"],
      ],
    });

    if (!checklistData || checklistData.length === 0) {
      return res.status(200).json({
        message: "Không còn checklist cho ca làm việc này!",
        data: [],
      });
    }

    const filteredData = checklistData.filter(
      (item) => item.ent_hangmuc !== null
    );

    return res.status(200).json({
      message:
        filteredData.length > 0
          ? "Danh sách checklist!"
          : "Không còn checklist cho ca làm việc này!",
      length: filteredData.length,
      data: filteredData,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

exports.filterChecklistWeb = async (req, res) => {
  try {
    const userData = req.user.data;
    const ID_ChecklistC = req.params.idc;
    const ID_Hangmucs = req.body.dataHangmuc;
    const ID_KhoiCV = req.body.ID_KhoiCV;

    const tbChecklist = await Tb_checklistc.findByPk(ID_ChecklistC, {
      attributes: ["ID_Hangmucs", "isDelete"],
      where: {
        isDelete: 0,
      },
    });

    const checklistItems = await Tb_checklistchitiet.findAll({
      attributes: ["isDelete", "ID_Checklist", "ID_ChecklistC"],
      where: { isDelete: 0, ID_ChecklistC: ID_ChecklistC },
    });

    const checklistDoneItems = await Tb_checklistchitietdone.findAll({
      attributes: ["Description", "isDelete", "ID_ChecklistC"],
      where: { isDelete: 0, ID_ChecklistC: ID_ChecklistC },
    });

    const arrPush = [];
    checklistDoneItems.forEach((item) => {
      const idChecklists = item.Description.split(",").map(Number);
      if (idChecklists.length > 0) {
        idChecklists.forEach((it) => {
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

    const checklistIds =
      checklistItems
        .map((item) => item?.ID_Checklist)
        .filter((id) => !isNaN(id)) || [];

    const checklistDoneIds = arrPush
      .map((item) => item?.ID_Checklist)
      .filter((id) => !isNaN(id));

    let whereCondition = {
      isDelete: 0,
      ID_Hangmuc: {
        [Op.in]: ID_Hangmucs,
      },
    };

    whereCondition["$ent_khuvuc.ent_toanha.ID_Duan$"] = userData?.ID_Duan;

    if (
      checklistIds &&
      Array.isArray(checklistIds) &&
      checklistIds.length > 0 &&
      checklistDoneIds &&
      checklistDoneIds.length > 0
    ) {
      whereCondition.ID_Checklist = {
        [Op.notIn]: [...checklistIds, ...checklistDoneIds],
      };
    } else if (
      checklistIds &&
      Array.isArray(checklistIds) &&
      checklistIds.length > 0 &&
      checklistDoneIds.length === 0
    ) {
      whereCondition.ID_Checklist = {
        [Op.notIn]: checklistIds,
      };
    } else if (
      checklistDoneIds &&
      checklistDoneIds.length > 0 &&
      checklistIds.length == 0
    ) {
      whereCondition.ID_Checklist = {
        [Op.notIn]: checklistDoneIds,
      };
    }

    const checklistData = await Ent_checklist.findAll({
      attributes: [
        "ID_Checklist",
        "ID_Khuvuc",
        "ID_Hangmuc",
        "ID_Tang",
        "Sothutu",
        "Maso",
        "MaQrCode",
        "isImportant",
        "Checklist",
        "Ghichu",
        "Tieuchuan",
        "Giatridinhdanh",
        "Giatriloi",
        "isCheck",
        "Giatrinhan",
        "Tinhtrang",
        "ID_User",

        "calv_1",
        "calv_2",
        "calv_3",
        "calv_4",
        "isDelete",
      ],
      include: [
        {
          model: Ent_hangmuc,
          attributes: [
            "Hangmuc",
            "Tieuchuankt",
            "ID_Hangmuc",
            "MaQrCode",
            "FileTieuChuan",
          ],
          where: {
            ID_Hangmuc: {
              [Op.in]: tbChecklist.ID_Hangmucs,
            },
          },
        },
        {
          model: Ent_khuvuc,
          attributes: [
            "Tenkhuvuc",
            "MaQrCode",
            "Makhuvuc",
            "Sothutu",
            "ID_Toanha",
            "ID_Khuvuc",
          ],
          include: [
            {
              model: Ent_toanha,
              attributes: ["Toanha", "ID_Toanha"],
              include: {
                model: Ent_duan,
                attributes: [
                  "ID_Duan",
                  "Duan",
                  "Diachi",
                  "Vido",
                  "Kinhdo",
                  "Logo",
                ],
                where: { ID_Duan: userData.ID_Duan },
              },
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
              where: {
                ID_KhoiCV: ID_KhoiCV ? ID_KhoiCV : userData.ID_KhoiCV,
              },
            },
          ],
        },
        {
          model: Ent_tang,
          attributes: ["Tentang"],
        },
      ],
      where: whereCondition,
      order: [
        ["ID_Khuvuc", "ASC"],
        ["Sothutu", "ASC"],
        ["ID_Checklist", "ASC"],
      ],
    });

    if (!checklistData || checklistData.length === 0) {
      return res.status(200).json({
        message: "Không còn checklist cho ca làm việc này!",
        data: [],
      });
    }

    // Tái cấu trúc dữ liệu
    const khuVucMap = {};

    checklistData.forEach((item) => {
      const khuVucKey = item.ID_Khuvuc;
      const hangMucKey = item.ID_Hangmuc;

      if (!khuVucMap[khuVucKey]) {
        khuVucMap[khuVucKey] = {
          ent_khuvuc: item.ent_khuvuc,
          hangmucs: {},
        };
      }

      // Khởi tạo hạng mục nếu chưa tồn tại
      if (!khuVucMap[khuVucKey].hangmucs[hangMucKey]) {
        khuVucMap[khuVucKey].hangmucs[hangMucKey] = {
          ent_hangmuc: {
            ...item.ent_hangmuc,
            checklists: [],
          },
        };
      }

      // Thêm checklist vào danh sách checklists của ent_hangmuc
      khuVucMap[khuVucKey].hangmucs[hangMucKey].ent_hangmuc.checklists.push({
        ID_Checklist: item.ID_Checklist,
        Checklist: item.Checklist,
        Tinhtrang: item.Tinhtrang,
        isImportant: item.isImportant,
        ID_Khuvuc: item.ID_Khuvuc,
        ID_Hangmuc: item.ID_Hangmuc,
      });
    });

    // Chuyển dữ liệu từ object sang array
    const result = Object.values(khuVucMap).map((khuvuc) => ({
      ent_khuvuc: khuvuc.ent_khuvuc,
      hangmucs: Object.values(khuvuc.hangmucs),
    }));

    // Trả về kết quả
    return res.status(200).json({
      message: "Danh sách checklist theo khu vực và hạng mục!",
      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Có lỗi xảy ra!",
    });
  }
};

exports.filterChecklistDay = async (req, res) => {
  try {
    const userData = req.user.data;
    const ID_Calv = req.params.idc;
    const Ngay = req.params.ngay;

    // Truy vấn danh sách checklist chưa được thực hiện trong ngày và ca đó
    const tbChecklist = await Tb_checklistc.findAll({
      attributes: ["ID_ChecklistC", "ID_Hangmucs", "isDelete"],
      where: {
        isDelete: 0,
        Ngay: Ngay, // Lọc theo ngày
        ID_Calv: ID_Calv, // Lọc theo ca làm việc
      },
    });

    // Kiểm tra nếu không có checklist nào
    if (!tbChecklist || tbChecklist.length === 0) {
      return res.status(200).json({
        message: "Không có checklist chưa thực hiện cho ca làm việc này!",
        data: [],
      });
    }

    // Truy vấn chi tiết checklist chưa thực hiện
    const checklistItems = await Tb_checklistchitiet.findAll({
      attributes: ["isDelete", "ID_Checklist", "ID_ChecklistC"],
      where: {
        isDelete: 0,
        ID_ChecklistC: {
          [Op.in]: tbChecklist.map((item) => item.ID_ChecklistC),
        },
      },
    });

    // Truy vấn các checklist đã được thực hiện
    const checklistDoneItems = await Tb_checklistchitietdone.findAll({
      attributes: ["Description", "isDelete", "ID_ChecklistC"],
      where: {
        isDelete: 0,
        ID_ChecklistC: {
          [Op.in]: tbChecklist.map((item) => item.ID_ChecklistC),
        },
      },
    });

    const checklistDoneIdsSet = new Set();

    // Process each item in checklistDoneItems
    checklistDoneItems.forEach((item) => {
      const idChecklists = item.Description.split(",").map(Number);

      if (idChecklists.length > 0) {
        idChecklists.forEach((it) => {
          // Add each unique checklist ID to the Set
          checklistDoneIdsSet.add(it);
        });
      }
    });

    // Lọc các checklist đã thực hiện và chưa thực hiện
    const checklistIds =
      checklistItems
        .map((item) => item?.ID_Checklist)
        .filter((id) => !isNaN(id)) || [];
    const checklistDoneIds = Array.from(checklistDoneIdsSet).filter(
      (id) => !isNaN(id)
    );

    let whereCondition = {
      isDelete: 0,
      ID_Hangmuc: {
        [Op.in]: tbChecklist.map((item) => item.ID_Hangmucs).flat(),
      },
      ID_Checklist: {
        [Op.notIn]: [...checklistIds, ...checklistDoneIds], // Lọc các checklist đã thực hiện
      },
    };

    // Truy vấn lại để lấy thông tin về checklist chưa thực hiện
    const checklistData = await Ent_checklist.findAll({
      attributes: [
        "ID_Checklist",
        "ID_Khuvuc",
        "ID_Hangmuc",
        "ID_Tang",
        "isImportant",
        "Checklist",
        "Ghichu",
        "Tieuchuan",
        "Giatridinhdanh",
        "Giatriloi",
        "isCheck",
        "Giatrinhan",
        "Tinhtrang",
        "isDelete",
      ],
      include: [
        {
          model: Ent_hangmuc,
          attributes: ["Hangmuc", "ID_Hangmuc", "MaQrCode"],
        },
        {
          model: Ent_khuvuc,
          attributes: [
            "Tenkhuvuc",
            "MaQrCode",
            "Makhuvuc",
            "ID_Toanha",
            "ID_Khuvuc",
          ],
          include: [
            {
              model: Ent_toanha,
              attributes: ["Toanha", "ID_Toanha"],
              include: {
                model: Ent_duan,
                attributes: ["ID_Duan", "Duan", "Logo"],
              },
            },
            {
              model: Ent_khuvuc_khoicv,
              attributes: ["ID_KhoiCV", "ID_Khuvuc", "ID_KV_CV"],
              include: [
                {
                  model: Ent_khoicv,
                  attributes: ["KhoiCV"],
                },
              ],
              // where: {
              //   ID_KhoiCV: userData.ID_KhoiCV,
              // },
            },
          ],
        },
        {
          model: Ent_tang,
          attributes: ["Tentang"],
        },
      ],
      where: whereCondition,
      order: [
        ["ID_Khuvuc", "ASC"],
        ["ID_Checklist", "ASC"],
      ],
    });

    if (!checklistData || checklistData.length === 0) {
      return res.status(200).json({
        message: "Không còn checklist chưa thực hiện cho ca làm việc này!",
        data: [],
      });
    }

    const khuVucMap = {};

    checklistData.forEach((item) => {
      const khuVucKey = item.ID_Khuvuc; // Lấy ID khu vực
      const hangMucKey = item.ID_Hangmuc; // Lấy ID hạng mục

      // Kiểm tra xem khu vực đã có chưa, nếu chưa thì tạo mới
      if (!khuVucMap[khuVucKey]) {
        khuVucMap[khuVucKey] = {
          ent_khuvuc: item.ent_khuvuc, // Thông tin khu vực
          hangmucs: {}, // Danh sách hạng mục sẽ được thêm sau
        };
      }

      // Kiểm tra xem hạng mục đã có chưa trong khu vực, nếu chưa thì tạo mới
      if (!khuVucMap[khuVucKey].hangmucs[hangMucKey]) {
        khuVucMap[khuVucKey].hangmucs[hangMucKey] = {
          ent_hangmuc: {
            ...item.ent_hangmuc, // Thông tin hạng mục
            checklists: [], // Danh sách checklist của hạng mục
          },
        };
      }

      // Thêm checklist vào danh sách checklists của hạng mục
      khuVucMap[khuVucKey].hangmucs[hangMucKey].ent_hangmuc.checklists.push({
        ID_Checklist: item.ID_Checklist,
        Checklist: item.Checklist,
        Tinhtrang: item.Tinhtrang,
        isImportant: item.isImportant,
        ID_Khuvuc: item.ID_Khuvuc,
        ID_Hangmuc: item.ID_Hangmuc,
      });
    });

    const result = Object.values(khuVucMap).map((khuvuc) => ({
      ent_khuvuc: khuvuc?.ent_khuvuc, // Thông tin khu vực
      hangmucs: Object.values(khuvuc.hangmucs).map((hangmuc) => ({
        ent_hangmuc: hangmuc.ent_hangmuc, // Thông tin hạng mục
        checklists: hangmuc.ent_hangmuc.checklists, // Danh sách checklist chưa thực hiện
      })),
    }));

    // Trả về kết quả cuối cùng
    return res.status(200).json({
      message: "Danh sách checklist theo khu vực và hạng mục!",
      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Có lỗi xảy ra!",
    });
  }
};

exports.filterReturn = async (req, res) => {
  try {
    const userData = req.user.data;
    const ID_ChecklistC = req.params.idc;
    const ID_Calv = req.params.id_calv;

    const tbChecklist = await Tb_checklistc.findByPk(ID_ChecklistC, {
      attributes: ["ID_Hangmucs", "isDelete", "ID_ThietLapCa", "ID_Calv"],
      where: {
        isDelete: 0,
      },
    });

    let whereCondition = {
      isDelete: 0,
    };

    if (
      Array.isArray(tbChecklist.ID_Hangmucs) &&
      tbChecklist.ID_Hangmucs.length > 0
    ) {
      whereCondition.ID_Hangmuc = {
        [Op.in]: tbChecklist.ID_Hangmucs,
      };
    }

    whereCondition["$ent_khuvuc.ent_toanha.ID_Duan$"] = userData?.ID_Duan;

    const checklistData = await Ent_checklist.findAll({
      attributes: [
        "ID_Checklist",
        "ID_Khuvuc",
        "ID_Hangmuc",
        "ID_Tang",
        "Sothutu",
        "Maso",
        "MaQrCode",
        "Checklist",
        "Ghichu",
        "Tieuchuan",
        "Giatridinhdanh",
        "isCheck",
        "Giatrinhan",
        "Giatriloi",
        "isImportant",
        "Tinhtrang",
        "ID_User",

        "calv_1",
        "calv_2",
        "calv_3",
        "calv_4",
        "isDelete",
      ],
      include: [
        {
          model: Ent_hangmuc,
          attributes: [
            "Hangmuc",
            "Tieuchuankt",
            "ID_Khuvuc",
            "MaQrCode",
            "FileTieuChuan",
          ],
        },
        {
          model: Ent_khuvuc,
          attributes: [
            "Tenkhuvuc",
            "MaQrCode",
            "Makhuvuc",
            "Sothutu",
            "ID_Toanha",
            "ID_Khuvuc",
          ],
          include: [
            {
              model: Ent_toanha,
              attributes: ["Toanha", "ID_Toanha"],
              include: {
                model: Ent_duan,
                attributes: [
                  "ID_Duan",
                  "Duan",
                  "Diachi",
                  "Vido",
                  "Kinhdo",
                  "Logo",
                ],
                where: { ID_Duan: userData.ID_Duan },
              },
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
          ],
        },
        {
          model: Ent_tang,
          attributes: ["Tentang"],
        },
      ],
      where: whereCondition,
      order: [
        ["ID_Khuvuc", "ASC"],
        ["Sothutu", "ASC"],
        ["ID_Checklist", "ASC"],
      ],
    });

    if (!checklistData || checklistData.length === 0) {
      return res.status(200).json({
        message: "Không còn checklist cho ca làm việc này!",
        data: [],
      });
    }

    const filteredData = checklistData.filter(
      (item) => item.ent_hangmuc !== null
    );

    return res.status(200).json({
      message:
        filteredData.length > 0
          ? "Danh sách checklist!"
          : "Không còn checklist cho ca làm việc này!",
      length: filteredData.length,
      data: filteredData,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

exports.getListChecklistWeb = async (req, res) => {
  try {
    const userData = req.user.data;
    if (!userData) {
      return res
        .status(401)
        .json({ message: "Không tìm thấy thông tin người dùng." });
    }

    const whereCondition = {
      isDelete: 0,
    };

    if (userData) {
      whereCondition["$ent_khuvuc.ent_toanha.ID_Duan$"] = userData?.ID_Duan;
    }

    if (userData?.ent_chucvu.Role === 5 && userData?.arr_Duan !== null) {
      const arrDuanArray = userData?.arr_Duan.split(",").map(Number);

      // Kiểm tra ID_Duan có thuộc mảng không
      const exists = arrDuanArray.includes(userData?.ID_Duan);
      if (!exists) {
        // Thêm điều kiện tham chiếu cột từ bảng liên kết
        whereCondition["$ent_khuvuc.ent_khuvuc_khoicvs.ID_KhoiCV$"] =
          userData.ID_KhoiCV;
        // "$ent_khuvuc_khoicvs.ID_KhoiCV$": userData.ID_KhoiCV,
      }
    }

    const data = await Ent_checklist.findAll({
      attributes: [
        "ID_Checklist",
        "ID_Khuvuc",
        "ID_Tang",
        "ID_Hangmuc",
        "Sothutu",
        "Maso",
        "MaQrCode",
        "Checklist",
        "Ghichu",
        "Tieuchuan",
        "Giatridinhdanh",
        "Giatriloi",
        "isImportant",
        "isCheck",
        "Giatrinhan",

        "Tinhtrang",
        "calv_1",
        "calv_2",
        "calv_3",
        "calv_4",
        "ID_User",
        "isDelete",
      ],
      include: [
        {
          model: Ent_hangmuc,
          attributes: [
            "Hangmuc",
            "Tieuchuankt",
            "ID_Khuvuc",
            "MaQrCode",
            "FileTieuChuan",
            "isDelete",
          ],
          where: {
            isDelete: 0,
          },
        },
        {
          model: Ent_khuvuc,
          attributes: [
            "Tenkhuvuc",
            "MaQrCode",
            "Makhuvuc",
            "Sothutu",
            "ID_KhoiCVs",
            "ID_Toanha",
            "ID_Khuvuc",
            "isDelete",
          ],
          where: {
            isDelete: 0,
          },
          include: [
            {
              model: Ent_toanha,
              attributes: ["Toanha", "ID_Toanha", "ID_Duan"],
            },
            {
              model: Ent_khuvuc_khoicv,
              attributes: ["ID_KV_CV", "ID_Khuvuc", "ID_KhoiCV"],
              include: [
                {
                  model: Ent_khoicv,
                  attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
                },
              ],
            },
          ],
        },
        {
          model: Ent_tang,
          attributes: ["Tentang"],
        },
        {
          model: Ent_user,
          include: {
            model: Ent_chucvu,
            attributes: ["Chucvu", "Role"],
          },
          attributes: ["UserName", "Email"],
        },
      ],
      where: whereCondition,
      order: [
        ["ID_Khuvuc", "ASC"],
        ["Sothutu", "ASC"],
      ],
    });

    if (!data || data.length === 0) {
      return res.status(200).json({
        message: "Không còn checklist cho ca làm việc này!",
        data: [],
      });
    }
    return res.status(200).json({
      message: "Danh sách checklist!",
      data: data,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

exports.getChecklistTotal = async (req, res) => {
  try {
    const userData = req.user.data;
    if (!userData) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ." });
    }

    let whereCondition = {
      isDelete: 0,
    };

    whereCondition["$ent_khuvuc.ent_toanha.ID_Duan$"] = userData?.ID_Duan;

    const checklistData = await Ent_checklist.findAll({
      attributes: [
        "ID_Checklist",
        "ID_Khuvuc",
        "ID_Hangmuc",
        "ID_Tang",
        "Sothutu",
        "Maso",
        "MaQrCode",
        "Checklist",
        "Ghichu",
        "Giatriloi",
        "Tieuchuan",
        "isImportant",
        "Giatridinhdanh",
        "isCheck",
        "Giatrinhan",
        "ID_User",

        "calv_1",
        "calv_2",
        "calv_3",
        "calv_4",
        "isDelete",
      ],
      include: [
        {
          model: Ent_hangmuc,
          attributes: [
            "Hangmuc",
            "Tieuchuankt",
            "ID_Khuvuc",
            "MaQrCode",
            "FileTieuChuan",
          ],
        },
        {
          model: Ent_khuvuc,
          attributes: [
            "Tenkhuvuc",
            "MaQrCode",
            "Makhuvuc",
            "Sothutu",
            "ID_Toanha",
            "ID_Khuvuc",
            "ID_KhoiCVs",
          ],
          include: [
            {
              model: Ent_toanha,
              attributes: ["Toanha", "ID_Toanha"],
              include: {
                model: Ent_duan,
                attributes: [
                  "ID_Duan",
                  "Duan",
                  "Diachi",
                  "Vido",
                  "Kinhdo",
                  "Logo",
                ],
                where: { ID_Duan: userData.ID_Duan },
              },
            },
            {
              model: Ent_khuvuc_khoicv,
              attributes: ["ID_KV_CV", "ID_Khuvuc", "ID_KhoiCV"],
              include: [
                {
                  model: Ent_khoicv,
                  attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
                },
              ],
            },
          ],
        },
        {
          model: Ent_tang,
          attributes: ["Tentang"],
        },
        {
          model: Ent_user,
          include: {
            model: Ent_chucvu,
            attributes: ["Chucvu", "Role"],
          },
          attributes: ["UserName", "Email"],
        },
      ],
      where: whereCondition,
    });

    if (!checklistData || checklistData.length === 0) {
      return res.status(200).json({
        message: "Không còn checklist cho ca làm việc này!",
        data: [],
      });
    }

    // Filter data
    const filteredData = checklistData.filter(
      (item) => item.ent_hangmuc !== null
    );

    const khoiCVData = [
      { ID_KhoiCV: 1, KhoiCV: "Khối làm sạch" },
      { ID_KhoiCV: 2, KhoiCV: "Khối kỹ thuật" },
      { ID_KhoiCV: 3, KhoiCV: "Khối bảo vệ" },
      { ID_KhoiCV: 4, KhoiCV: "Khối dịch vụ" },
      { ID_KhoiCV: 5, KhoiCV: "Khối F&B" },
    ];

    // Create a map for quick lookup of KhoiCV by ID_Khoi
    const khoiCVMap = {};
    khoiCVData.forEach((item) => {
      khoiCVMap[item.ID_KhoiCV] = item.KhoiCV;
    });

    // Count checklists by ID_KhoiCV
    const checklistCounts = {};
    filteredData.forEach((item) => {
      let ID_KhoiCVs = item.ent_khuvuc.ID_KhoiCVs;
      if (typeof ID_KhoiCVs === "string") {
        try {
          ID_KhoiCVs = JSON.parse(ID_KhoiCVs);
        } catch (error) {
          return;
        }
      }
      ID_KhoiCVs.forEach((id) => {
        const khoiCV = khoiCVMap[id];
        if (!checklistCounts[khoiCV]) {
          checklistCounts[khoiCV] = 0;
        }
        checklistCounts[khoiCV]++;
      });
    });

    // Convert counts to desired format
    const result = Object.keys(checklistCounts).map((khoiCV) => ({
      label: khoiCV,
      value: checklistCounts[khoiCV],
    }));

    return res.status(200).json({
      message:
        result.length > 0
          ? "Danh sách checklist!"
          : "Không còn checklist cho ca làm việc này!",
      length: result.length,
      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

exports.uploadFiles = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    const userData = req.user.data;

    // Read the uploaded Excel file from buffer
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });

    // Extract data from the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    await sequelize.transaction(async (transaction) => {
      // Tạo object để lưu số thứ tự cho từng nhóm checklist
      const checklistOrderMap = {};

      for (const [index, item] of data.entries()) {
        try {
          const transformedItem = removeSpacesFromKeys(item);

          const tenKhuvuc = formatVietnameseText(transformedItem["TÊNKHUVỰC"]);
          const tenDuan = formatVietnameseText(transformedItem["TÊNDỰÁN"]);
          const tenToanha = formatVietnameseText(transformedItem["TÊNTÒANHÀ"]);
          const tenKhoiCongViec = transformedItem["TÊNKHỐICÔNGVIỆC"];

          const tenTang = formatVietnameseText(transformedItem["TÊNTẦNG"]);
          const tenHangmuc = formatVietnameseText(
            transformedItem["TÊNHẠNGMỤC"]
          );
          const tenChecklist = formatVietnameseText(
            transformedItem["TÊNCHECKLIST"]
          );
          const tieuChuanChecklist = formatVietnameseText(
            transformedItem["TIÊUCHUẨNCHECKLIST"]
          );
          const giaTriDanhDinh = formatVietnameseText(
            transformedItem["GIÁTRỊĐỊNHDANH"]
          );
          const giaTriLoi = formatVietnameseText(transformedItem["GIÁTRỊLỖI"]);
          const cacGiaTriNhan = formatVietnameseText(
            transformedItem["CÁCGIÁTRỊNHẬN"]
          );
          const quanTrong = formatVietnameseText(transformedItem["QUANTRỌNG"]);
          const ghiChu = formatVietnameseText(transformedItem["GHICHÚ"]);
          const nhap = formatVietnameseText(transformedItem["NHẬP"]);

          if (!tenChecklist) {
            console.log("Bỏ qua do thiếu tên checklist");
            continue;
          }

          if (!tenTang) {
            console.log("Bỏ qua do thiếu tên tầng");
            continue;
          }

          const khoiCongViecList = tenKhoiCongViec
            ?.split(",")
            ?.map((khoi) => khoi.trim());
          const khoiCVs = await Promise.all(
            khoiCongViecList.map(async (khoiCongViec) => {
              const khoiCV = await Ent_khoicv.findOne({
                attributes: ["ID_KhoiCV", "KhoiCV", "isDelete"],
                where: {
                  [Op.and]: [
                    sequelize.where(sequelize.col("KhoiCV"), {
                      [Op.like]: `%${removeVietnameseTones(khoiCongViec)}%`,
                    }),
                    { isDelete: 0 },
                  ],
                },
                transaction,
              });
              return khoiCV ? khoiCV.ID_KhoiCV : null;
            })
          );
          const validKhoiCVs = khoiCVs.filter((id) => id !== null);

          const hangmuc = await Ent_hangmuc.findOne({
            attributes: [
              "Hangmuc",
              "Tieuchuankt",
              "ID_Khuvuc",
              "MaQrCode",
              "FileTieuChuan",
              "ID_Hangmuc",
              "isDelete",
            ],
            include: [
              {
                model: Ent_khuvuc,
                attributes: [
                  "ID_Toanha",
                  "ID_Khuvuc",
                  "ID_KhoiCVs",
                  "Sothutu",
                  "MaQrCode",
                  "Tenkhuvuc",
                  "ID_User",
                  "isDelete",
                ],
                where: {
                  isDelete: 0,
                  [Op.and]: Sequelize.literal(
                    `JSON_CONTAINS(ID_KhoiCVs, '${JSON.stringify(
                      validKhoiCVs
                    )}')`
                  ),
                  MaQrCode: generateQRCodeKV(
                    tenToanha,
                    tenKhuvuc,
                    tenTang,
                    userData.ID_Duan
                  ),
                },
              },
            ],
            where: {
              MaQrCode: generateQRCode(
                tenToanha,
                tenKhuvuc,
                tenHangmuc,
                tenTang
              ),
              Hangmuc: tenHangmuc,
              isDelete: 0,
            },
            transaction,
          });

          const tang = await Ent_tang.findOne({
            attributes: ["Tentang", "ID_Tang", "ID_Duan", "isDelete"],
            where: {
              Tentang: tenTang.trim(),
              ID_Duan: userData.ID_Duan,
              isDelete: 0,
            },
            transaction,
          });

          // Tạo khóa duy nhất cho mỗi nhóm checklist dựa vào ID_Khuvuc, ID_Tang, ID_Hangmuc
          const checklistKey = `${hangmuc.ID_Khuvuc}-${tang.ID_Tang}-${hangmuc.ID_Hangmuc}`;

          // Kiểm tra nếu nhóm này chưa có trong checklistOrderMap thì khởi tạo
          if (!checklistOrderMap[checklistKey]) {
            checklistOrderMap[checklistKey] = 1; // Bắt đầu từ số thứ tự 1
          } else {
            checklistOrderMap[checklistKey] += 1; // Tăng số thứ tự cho checklist cùng nhóm
          }

          const sttChecklist = checklistOrderMap[checklistKey]; // Lấy số thứ tự hiện tại cho checklist

          const data = {
            ID_Khuvuc: hangmuc.ID_Khuvuc,
            ID_Tang: tang.ID_Tang,
            ID_Hangmuc: hangmuc.ID_Hangmuc,
            Sothutu: sttChecklist, // Sử dụng số thứ tự vừa tính toán
            Maso: "",
            MaQrCode: "",
            Checklist: tenChecklist,
            Ghichu: ghiChu || "",
            Tieuchuan: tieuChuanChecklist || "",
            Giatridinhdanh: giaTriDanhDinh || "",
            Giatrinhan: cacGiaTriNhan || "",
            Giatriloi: giaTriLoi || "",
            isImportant:
              quanTrong !== undefined && quanTrong !== null && quanTrong !== ""
                ? 1
                : 0,
            isCheck: nhap !== undefined && nhap !== null && nhap !== "" ? 1 : 0,
            ID_User: userData.ID_User,
            isDelete: 0,
            Tinhtrang: 0,
          };

          const existingChecklist = await Ent_checklist.findOne({
            attributes: [
              "ID_Checklist",
              "ID_Khuvuc",
              "ID_Tang",
              "ID_Hangmuc",
              "Sothutu",
              "Maso",
              "MaQrCode",
              "Checklist",
              "Ghichu",
              "Tieuchuan",
              "Giatridinhdanh",
              "isImportant",
              "isCheck",
              "Giatrinhan",

              "Tinhtrang",
              "calv_1",
              "calv_2",
              "calv_3",
              "calv_4",
              "ID_User",
              "isDelete",
            ],
            where: {
              ID_Khuvuc: hangmuc.ID_Khuvuc,
              ID_Tang: tang.ID_Tang,
              ID_Hangmuc: hangmuc.ID_Hangmuc,
              Checklist: tenChecklist,
              isDelete: 0,
            },
            transaction,
          });

          // Nếu checklist đã tồn tại thì bỏ qua
          if (!existingChecklist) {
            await Ent_checklist.create(data, { transaction });
          } else {
            console.log(`Checklist đã có ở dòng ${index + 2}`);
          }
        } catch (error) {
          throw new Error(`Lỗi ở dòng ${index + 2}: ${error.message}`);
        }
      }
    });

    res.send({
      message: "Upload dữ liệu thành công",
      data,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

exports.uploadFixFiles = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    const userData = req.user.data;

    // Read the uploaded Excel file from buffer
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });

    // Extract data from the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    await sequelize.transaction(async (transaction) => {
      // Tạo object để lưu số thứ tự cho từng nhóm checklist
      const checklistOrderMap = {};

      for (const [index, item] of data.entries()) {
        try {
          const transformedItem = removeSpacesFromKeys(item);

          const tenKhuvuc = formatVietnameseText(transformedItem["TÊNKHUVỰC"]);
          const tenDuan = formatVietnameseText(transformedItem["TÊNDỰÁN"]);
          const tenToanha = formatVietnameseText(transformedItem["TÊNTÒANHÀ"]);
          const tenKhoiCongViec = transformedItem["TÊNKHỐICÔNGVIỆC"];

          const tenTang = formatVietnameseText(transformedItem["TÊNTẦNG"]);
          const tenHangmuc = formatVietnameseText(
            transformedItem["TÊNHẠNGMỤC"]
          );
          const tenChecklist = formatVietnameseText(
            transformedItem["TÊNCHECKLIST"]
          );
          const tieuChuanChecklist = formatVietnameseText(
            transformedItem["TIÊUCHUẨNCHECKLIST"]
          );
          const giaTriDanhDinh = formatVietnameseText(
            transformedItem["GIÁTRỊĐỊNHDANH"]
          );
          const giaTriLoi = formatVietnameseText(transformedItem["GIÁTRỊLỖI"]);
          const cacGiaTriNhan = formatVietnameseText(
            transformedItem["CÁCGIÁTRỊNHẬN"]
          );
          const quanTrong = formatVietnameseText(transformedItem["QUANTRỌNG"]);
          const ghiChu = formatVietnameseText(transformedItem["GHICHÚ"]);
          const nhap = formatVietnameseText(transformedItem["NHẬP"]);

          if (!tenChecklist) {
            console.log("Bỏ qua do thiếu tên checklist");
            continue;
          }

          if (!tenTang) {
            console.log("Bỏ qua do thiếu tên tầng");
            continue;
          }

          const maQrKhuVuc = generateQRCodeKV(
            tenToanha,
            tenKhuvuc,
            tenTang,
            userData.ID_Duan
          );
          const maQrHangMuc = generateQRCode(
            tenToanha,
            tenKhuvuc,
            tenHangmuc,
            tenTang
          );

          const khoiCongViecList = tenKhoiCongViec
            ?.split(",")
            ?.map((khoi) => khoi.trim());
          const khoiCVs = await Promise.all(
            khoiCongViecList.map(async (khoiCongViec) => {
              const khoiCV = await Ent_khoicv.findOne({
                attributes: ["ID_KhoiCV", "KhoiCV", "isDelete"],
                where: {
                  [Op.and]: [
                    sequelize.where(sequelize.col("KhoiCV"), {
                      [Op.like]: `%${removeVietnameseTones(khoiCongViec)}%`,
                    }),
                    { isDelete: 0 },
                  ],
                },
                transaction,
              });
              return khoiCV ? khoiCV.ID_KhoiCV : null;
            })
          );
          const validKhoiCVs = khoiCVs.filter((id) => id !== null);

          const hangmuc = await Ent_hangmuc.findOne({
            attributes: [
              "Hangmuc",
              "Tieuchuankt",
              "ID_Khuvuc",
              "MaQrCode",
              "FileTieuChuan",
              "ID_Hangmuc",
              "isDelete",
            ],
            include: [
              {
                model: Ent_khuvuc,
                attributes: [
                  "ID_Toanha",
                  "ID_Khuvuc",
                  "ID_KhoiCVs",
                  "Sothutu",
                  "MaQrCode",
                  "Tenkhuvuc",
                  "ID_User",
                  "isDelete",
                ],
                where: {
                  isDelete: 0,
                  [Op.and]: Sequelize.literal(
                    `JSON_CONTAINS(ID_KhoiCVs, '${JSON.stringify(
                      validKhoiCVs
                    )}')`
                  ),
                  MaQrCode: generateQRCodeKV(
                    tenToanha,
                    tenKhuvuc,
                    tenTang,
                    userData.ID_Duan
                  ),
                },
              },
            ],
            where: {
              MaQrCode: generateQRCode(
                tenToanha,
                tenKhuvuc,
                tenHangmuc,
                tenTang
              ),
              Hangmuc: tenHangmuc,
              isDelete: 0,
            },
            transaction,
          });

          const tang = await Ent_tang.findOne({
            attributes: ["Tentang", "ID_Tang", "ID_Duan", "isDelete"],
            where: {
              Tentang: tenTang.trim(),
              ID_Duan: userData.ID_Duan,
              isDelete: 0,
            },
            transaction,
          });

          if (!tang) {
            console.log(`Dòng ${index + 2}: Không tìm thấy tầng '${tenTang}'.`);
            continue;
          }
          // Tạo khóa duy nhất cho mỗi nhóm checklist dựa vào ID_Khuvuc, ID_Tang, ID_Hangmuc
          const checklistKey = `${hangmuc.ID_Khuvuc}-${tang.ID_Tang}-${hangmuc.ID_Hangmuc}`;

          // Kiểm tra nếu nhóm này chưa có trong checklistOrderMap thì khởi tạo
          if (!checklistOrderMap[checklistKey]) {
            checklistOrderMap[checklistKey] = 1; // Bắt đầu từ số thứ tự 1
          } else {
            checklistOrderMap[checklistKey] += 1; // Tăng số thứ tự cho checklist cùng nhóm
          }

          const sttChecklist = checklistOrderMap[checklistKey]; // Lấy số thứ tự hiện tại cho checklist

          const data = {
            ID_Khuvuc: hangmuc.ID_Khuvuc,
            ID_Tang: tang.ID_Tang,
            ID_Hangmuc: hangmuc.ID_Hangmuc,
            Sothutu: sttChecklist, // Sử dụng số thứ tự vừa tính toán
            Maso: "",
            MaQrCode: "",
            Checklist: tenChecklist,
            Ghichu: ghiChu || "",
            Tieuchuan: tieuChuanChecklist || "",
            Giatridinhdanh: giaTriDanhDinh || "",
            Giatrinhan: cacGiaTriNhan || "",
            Giatriloi: giaTriLoi || "",
            isImportant:
              quanTrong !== undefined && quanTrong !== null && quanTrong !== ""
                ? 1
                : 0,
            isCheck: nhap !== undefined && nhap !== null && nhap !== "" ? 1 : 0,
            ID_User: userData.ID_User,
            isDelete: 0,
            Tinhtrang: 0,
          };

          const existingChecklist = await Ent_checklist.findOne({
            attributes: [
              "ID_Checklist",
              "ID_Khuvuc",
              "ID_Tang",
              "ID_Hangmuc",
              "Sothutu",
              "Maso",
              "MaQrCode",
              "Checklist",
              "Ghichu",
              "Tieuchuan",
              "Giatridinhdanh",
              "isImportant",
              "isCheck",
              "Giatrinhan",

              "Tinhtrang",
              "calv_1",
              "calv_2",
              "calv_3",
              "calv_4",
              "ID_User",
              "isDelete",
            ],
            where: {
              ID_Khuvuc: hangmuc.ID_Khuvuc,
              ID_Tang: tang.ID_Tang,
              ID_Hangmuc: hangmuc.ID_Hangmuc,
              Checklist: tenChecklist,
              isDelete: 0,
            },
            transaction,
          });

          // Nếu checklist đã tồn tại thì bỏ qua
          if (!existingChecklist) {
            await Ent_checklist.create(data, { transaction });
          } else {
            await existingChecklist.update(
              {
                Tieuchuan: tieuChuanChecklist || existingChecklist.Tieuchuan,
                Giatridinhdanh:
                  giaTriDanhDinh || existingChecklist.Giatridinhdanh,
                Giatrinhan: cacGiaTriNhan || existingChecklist.Giatrinhan,
                Giatriloi: giaTriLoi || existingChecklist.Giatriloi,
                Ghichu: ghiChu || existingChecklist.Ghichu,
                isImportant: quanTrong ? 1 : existingChecklist.isImportant,
                isCheck: nhap ? 1 : existingChecklist.isCheck,
              },
              { transaction }
            );
            console.log(`Cập nhật checklist: ${tenChecklist}`);
          }
        } catch (error) {
          throw new Error(`Lỗi ở dòng ${index + 2}: ${error.message}`);
        }
      }
    });

    res.send({
      message: "Upload dữ liệu thành công",
      data,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

function generateQRCode(toaNha, khuVuc, hangMuc, tenTang) {
  // Hàm lấy ký tự đầu tiên của mỗi từ trong chuỗi
  function getInitials(string) {
    return string
      .split(" ") // Tách chuỗi thành mảng các từ
      .map((word) => word.charAt(0).toUpperCase()) // Lấy ký tự đầu tiên của mỗi từ và viết hoa
      .join(""); // Nối lại thành chuỗi
  }

  // Lấy ký tự đầu của khu vực và hạng mục
  const khuVucInitials = getInitials(khuVuc);
  const hangMucInitials = getInitials(hangMuc);
  const toaNhaInitials = getInitials(toaNha);

  // Tạo chuỗi QR
  const qrCode = `QR-${toaNha}-${khuVucInitials}-${hangMucInitials}-${tenTang}`;
  return qrCode;
}

function generateQRCodeKV(tenToa, khuVuc, tenTang, ID) {
  // Hàm lấy ký tự đầu tiên của mỗi từ trong chuỗi
  function getInitials(string) {
    return string
      .split(" ") // Tách chuỗi thành mảng các từ
      .map((word) => word.charAt(0).toUpperCase()) // Lấy ký tự đầu tiên của mỗi từ và viết hoa
      .join(""); // Nối lại thành chuỗi
  }

  // Lấy ký tự đầu của khu vực và hạng mục
  const khuVucInitials = getInitials(khuVuc);
  const tenToaInitials = getInitials(tenToa);

  // Tạo chuỗi QR
  const qrCode = `QR-${ID}-${tenToa}-${khuVucInitials}-${tenTang}`;
  return qrCode;
}
