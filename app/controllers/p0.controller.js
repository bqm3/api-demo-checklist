const { P0, P0_Log, Ent_user, Ent_chucvu } = require("../models/setup.model");
const { Op } = require("sequelize");
const moment = require("moment");
const sequelize = require("../config/db.config");
const { funcCreateYesterDay } = require("../utils/util");

exports.createP0 = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userData = req.user.data;
    const data = req.body;
    const Ngaybc = moment(new Date()).format("YYYY-MM-DD");

    const sanitizedData = Object.keys(data).reduce((acc, key) => {
      acc[key] = data[key] === null ? 0 : data[key];
      return acc;
    }, {});

    const generalData = {
      ID_Duan: userData?.ID_Duan,
      Ngaybc: Ngaybc,
      isDelete: 0,
    };

    if (userData.ID_KhoiCV == 3) {
      generalData.ID_User_AN = userData.ID_User;
    } else if (userData.ID_KhoiCV == 4) {
      generalData.ID_User_KT = userData.ID_User;
    } else {
      generalData.ID_User_AN = userData.ID_User;
      generalData.ID_User_KT = userData.ID_User;
    }

    const combinedData = { ...sanitizedData, ...generalData };
    const findP0 = await P0.findOne({
      attributes: ["ID_P0", "ID_Duan", "Ngaybc"],
      where: {
        ID_Duan: userData?.ID_Duan,
        Ngaybc: Ngaybc,
        isDelete: 0,
      },
    });

    if (findP0) {
      return res
        .status(400)
        .json({ message: "Báo cáo P0 ngày hôm nay đã được tạo" });
    } else {
      const createP0 = await P0.create(combinedData, { transaction: t });
      await funcP0_Log(req, sanitizedData, createP0.ID_P0, t);
      await t.commit();
      return res.status(200).json({
        message: "Tạo báo cáo P0 thành công",
      });
    }
  } catch (error) {
    console.log("error", error);
    await t.rollback();
    res.status(500).json({ message: error?.message });
  }
};

exports.getAll_ByID_Duan = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userData = req.user.data;
    const page = parseInt(req.query.page) || 0;
    const pageSize = parseInt(req.query.limit) || 7;
    const offset = page * pageSize;

    const findAll = await P0.findAll({
      where: {
        ID_Duan: userData?.ID_Duan,
        isDelete: 0,
      },
      include: [
        {
          model: Ent_user,
          as: "ent_user_AN",
          attributes: ["ID_User", "Hoten", "ID_Chucvu"],
          include: [
            {
              model: Ent_chucvu,
              attributes: ["Chucvu", "Role"],
            },
          ],
        },
        {
          model: Ent_user,
          as: "ent_user_KT",
          attributes: ["ID_User", "Hoten", "ID_Chucvu"],
          include: [
            {
              model: Ent_chucvu,
              attributes: ["Chucvu", "Role"],
            },
          ],
        },
      ],
      order: [["Ngaybc", "DESC"]],
      offset: offset,
      limit: pageSize,
    });

    return res.status(200).json({
      message: "Lấy dữ liệu P0 thành công",
      data: findAll,
    });
  } catch (error) {
    console.log("error",error.message)
    await t.rollback();
    return res.status(500).json({
      message: error?.message || "Có lỗi xảy ra khi lấy thông tin",
    });
  }
};

exports.updateP0 = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { data, Ngay } = req.body;
    const isToday = moment(Ngay).isSame(moment(), "day");

    if (!isToday) {
      await t.rollback();
      return res.status(400).json({
        message: "Có lỗi xảy ra! Ngày không đúng dữ liệu.",
      });
    }

    await funcP0_Log(req, data, req.params.id, t);
    await updateP0(req, req.params.id, t);
    await t.commit();

    return res.status(200).json({
      message: "Cập nhật thành công!",
    });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({
      message: error?.message || "Lỗi khi cập nhật P0.",
    });
  }
};

const updateP0 = async (req, ID_P0, t) => {
  try {
    const { data } = req.body;
    const sanitizedData = Object.keys(data).reduce((acc, key) => {
      acc[key] = data[key] === null ? 0 : data[key];
      return acc;
    }, {});

    const result = await P0.update(sanitizedData, {
      where: {
        ID_P0: ID_P0,
        iTrangthai: 0,
        isDelete: 0,
      },
      transaction: t,
    });

    if (result[0] === 0) {
      throw new Error("Không tìm thấy dự án để cập nhật.");
    }
  } catch (err) {
    throw err;
  }
};

const funcP0_Log = async (req, data, ID_P0, t) => {
  try {
    const userData = req.user.data;
    const Ngaybc = moment(new Date()).format("YYYY-MM-DD");
    const sanitizedData = Object.keys(data).reduce((acc, key) => {
      acc[key] = data[key] === null ? 0 : data[key];
      return acc;
    }, {});

    const generalData = {
      ID_P0: ID_P0,
      ID_Duan: userData?.ID_Duan,
      Ngaybc: Ngaybc,
    };

    if (userData.ID_KhoiCV == 3) {
      generalData.ID_User_AN_Update = userData.ID_User;
    } else if (userData.ID_KhoiCV == 4) {
      generalData.ID_User_KT_Update = userData.ID_User;
    } else {
      generalData.ID_User_AN_Update = userData.ID_User;
      generalData.ID_User_KT_Update = userData.ID_User;
    }

    const combinedData = { ...sanitizedData, ...generalData };
    await P0_Log.create(combinedData, { transaction: t });
  } catch (error) {
    throw error;
  }
};
