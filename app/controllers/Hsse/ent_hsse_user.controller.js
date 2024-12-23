const {
  Ent_Hsse_User,
  Ent_user,
  HSSE_Log,
} = require("../../models/setup.model");
const { Op } = require("sequelize");
const moment = require("moment");
const hsse = require("../../models/hsse.model");
const sequelize = require("../../config/db.config");

const HSSE = [
  { id: 0, title: "Điện cư dân", key: "Dien_cu_dan" },
  { id: 1, title: "Điện chủ đầu tư", key: "Dien_cdt" },
  { id: 2, title: "Nước cư dân", key: "Nuoc_cu_dan" },
  { id: 3, title: "Nước chủ đầu tư", key: "Nuoc_cdt" },
  { id: 4, title: "Nước xả thải", key: "Xa_thai" },
  { id: 5, title: "Rác sinh hoạt", key: "Rac_sh" },
  { id: 6, title: "Muối điện phân", key: "Muoi_dp" },
  { id: 7, title: "PAC", key: "PAC" },
  { id: 8, title: "NaHSO3", key: "NaHSO3" },
  { id: 9, title: "NaOH", key: "NaOH" },
  { id: 10, title: "Mật rỉ đường", key: "Mat_rd" },
  { id: 11, title: "Polymer Anion", key: "Polymer_Anion" },
  { id: 12, title: "Chlorine bột", key: "Chlorine_bot" },
  { id: 13, title: "Chlorine viên", key: "Chlorine_vien" },
  { id: 14, title: "Methanol", key: "Methanol" },
  { id: 15, title: "Dầu máy phát", key: "Dau_may" },
  { id: 16, title: "Túi rác 240L", key: "Tui_rac240" },
  { id: 17, title: "Túi rác 120L", key: "Tui_rac120" },
  { id: 18, title: "Túi rác 20L", key: "Tui_rac20" },
  { id: 19, title: "Túi rác 10L", key: "Tui_rac10" },
  { id: 20, title: "Túi rác 5L", key: "Tui_rac5" },
  { id: 21, title: "Giấy vệ sinh 235mm", key: "giayvs_235" },
  { id: 22, title: "Giấy vệ sinh 120mm", key: "giaivs_120" },
  { id: 23, title: "Giấy lau tay", key: "giay_lau_tay" },
  { id: 24, title: "Hóa chất làm sạch", key: "hoa_chat" },
  { id: 25, title: "Nước rửa tay", key: "nuoc_rua_tay" },
  { id: 26, title: "Nhiệt độ", key: "nhiet_do" },
  { id: 27, title: "Nước bù bể", key: "nuoc_bu" },
  { id: 28, title: "Clo", key: "clo" },
  { id: 29, title: "Nồng độ PH", key: "PH" },
  { id: 30, title: "Poolblock", key: "Poolblock" },
  { id: 31, title: "Trạt thải", key: "trat_thai" },
  { id: 32, title: "pH Minus", key: "pHMINUS" },
  { id: 33, title: "Axit", key: "axit" },
  { id: 34, title: "PN180", key: "PN180" },
  { id: 35, title: "Chỉ số CO2", key: "chiSoCO2" },
  { id: 36, title: "Clorin", key: "clorin" },
  { id: 37, title: "NaOCL", key: "NaOCL" },
];

exports.createHSSE = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userData = req.user.data;
    const data = req.body;
    const Ngay_ghi_nhan = moment(new Date()).format("YYYY-MM-DD");
    const yesterday = moment(Ngay_ghi_nhan)
      .subtract(1, "days")
      .format("YYYY-MM-DD");

    // Convert null values to 0
    const sanitizedData = Object.keys(data).reduce((acc, key) => {
      acc[key] = data[key] === null ? 0 : data[key];
      return acc;
    }, {});

    const dataUser = {
      Ten_du_an: userData?.ent_duan?.Duan,
      Ngay_ghi_nhan: Ngay_ghi_nhan,
      Nguoi_tao: userData?.UserName || userData?.Hoten,
      Email: userData?.Email,
      modifiedBy: "Checklist",
    };

    const combinedData = { ...sanitizedData, ...dataUser };

    const findHsse = await hsse.findOne({
      attributes: ["Ten_du_an", "Ngay_ghi_nhan"],
      where: {
        Ten_du_an: userData?.ent_duan?.Duan,
        Ngay_ghi_nhan: Ngay_ghi_nhan,
      },
    });

    if (findHsse) {
      return res
        .status(400)
        .json({ message: "Báo cáo HSSE ngày hôm nay đã được tạo" });
    } else {
      const htmlResponse = await funcYesterday(userData, data, yesterday, t, "Tạo báo cáo HSSE thành công.");
      const createHSSE = await hsse.create(combinedData, { transaction: t });
      await funcHSSE_Log(req, sanitizedData, createHSSE.ID, t);
      await t.commit();
      return res.status(200).json({
        message: "Tạo báo cáo HSSE thành công",
        htmlResponse: htmlResponse,
      });
    }
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: error?.message });
  }
};

exports.checkHSSE = async (req, res) => {
  try {
    const userData = req.user.data;
    const Ngay_ghi_nhan = moment(new Date()).format("YYYY-MM-DD");

    const findHsse = await hsse.findOne({
      attributes: ["Ten_du_an", "Ngay_ghi_nhan"],
      where: {
        Ten_du_an: userData?.ent_duan?.Duan,
        Ngay_ghi_nhan: Ngay_ghi_nhan,
      },
    });
    if (findHsse) {
      return res.status(200).json({
        message: "Báo cáo HSSE ngày hôm nay đã tạo",
        show: false,
      });
    }
    return res.status(200).json({
      message: "Báo cáo HSSE chưa tạo",
      show: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.mesage || "Có lỗi xảy ra",
    });
  }
};

exports.createHSSE_User = async (req, res) => {
  try {
    const userData = req.user.data;
    const { ID_Users } = req.body;

    const check = await Ent_Hsse_User.findAll({
      where: {
        ID_Duan: userData.ID_Duan,
        isDelete: 0,
      },
    });

    const currentUsers = check.map((record) => record.ID_User);

    const toDelete = currentUsers.filter((id) => !ID_Users.includes(id));
    const toAdd = ID_Users.filter((id) => !currentUsers.includes(id));

    if (toDelete.length > 0) {
      await Ent_Hsse_User.update(
        { isDelete: 1 },
        {
          where: {
            ID_User: { [Op.in]: toDelete },
            ID_Duan: userData.ID_Duan,
          },
        }
      );
    }

    if (toAdd.length > 0) {
      const newEntries = toAdd.map((ID_User) => ({
        ID_Duan: userData.ID_Duan,
        ID_User,
      }));
      await Ent_Hsse_User.bulkCreate(newEntries);
    }

    res.status(201).json({
      message: "Thành công",
      deletedUsers: toDelete,
      addedUsers: toAdd,
    });
  } catch (error) {
    res.status(500).json({ message: "Có lỗi xảy ra", error });
  }
};

exports.getHSSE_User_ByDuAn = async (req, res) => {
  try {
    const userData = req.user.data;
    const userDuAn = await Ent_Hsse_User.findAll({
      where: {
        ID_Duan: userData.ID_Duan,
        isDelete: 0,
      },
    });
    if (userDuAn) {
      return res.status(201).json({
        message: "Thành công",
        data: userDuAn,
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Có lỗi xảy ra", error });
  }
};

exports.checkSubmitHSSE = async (req, res) => {
  try {
    const userData = req.user.data;
    if (userData?.ent_chucvu?.Role == 1) {
      return res.status(200).json({
        message: "Thành công",
        data: true,
      });
    } else {
      const userDuAn = await Ent_Hsse_User.findOne({
        where: {
          ID_Duan: userData.ID_Duan,
          ID_User: userData.ID_User,
          isDelete: 0,
        },
      });

      if (userDuAn) {
        return res.status(201).json({
          message: "Thành công",
          data: true,
        });
      } else {
        return res.status(200).json({
          message: "Thành công",
          data: false,
        });
      }
    }
  } catch (error) {
    return res.status(500).json({
      message: error.mesage || "Có lỗi xảy ra",
    });
  }
};

exports.getHSSE = async (req, res) => {
  try {
    const Ngay_ghi_nhan = moment(new Date()).format("YYYY-MM-DD");
    const Ngay_ghi_nhan_truoc_do = moment(Ngay_ghi_nhan, "YYYY-MM-DD")
      .subtract(6, "days")
      .format("YYYY-MM-DD");
    const userData = req.user.data;
    const resData = await hsse.findAll({
      where: {
        Ten_du_an: userData?.ent_duan?.Duan,
        Ngay_ghi_nhan: {
          [Op.between]: [Ngay_ghi_nhan_truoc_do, Ngay_ghi_nhan],
        },
      },
      order: [["Ngay_ghi_nhan", "DESC"]],
    });
    return res.status(200).json({
      message: "Danh sách HSSE",
      data: resData || [],
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Có lỗi xảy ra",
    });
  }
};

exports.getHSSEAll = async (req, res)=> {
  try {
    const Ngay_ghi_nhan = moment(new Date()).format("YYYY-MM-DD");
     
    const resData = await hsse.findAll({
      where: {
        Ngay_ghi_nhan: Ngay_ghi_nhan,
      },
    });
    return res.status(200).json({
      message: "Danh sách HSSE",
      data: resData || [],
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Có lỗi xảy ra",
    });
  }
}

exports.getDetailHSSE = async (req, res) => {
  try {
    const findHsse = await hsse.findOne({
      where: {
        ID: req.params.id,
      },
    });
    return res.status(200).json({
      message: "Báo cáo HSSE",
      data: findHsse,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.mesage || "Có lỗi xảy ra",
    });
  }
};

exports.updateHSSE = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userData = req.user.data;
    const { data, Ngay } = req.body;
    const isToday = moment(Ngay).isSame(moment(), "day");
    const yesterday = moment(Ngay)
    .subtract(1, "days")
    .format("YYYY-MM-DD");

    console.log("yesterday",yesterday)

    if (!isToday) {
      await t.rollback();
      return res.status(400).json({
        message: "Có lỗi xảy ra! Ngày không đúng dữ liệu.",
      });
    }

    const htmlResponse = await funcYesterday(userData, data, yesterday, t, "Cập nhật thành công !")
    await funcHSSE_Log(req, data, req.params.id, t);
    await updateHSSE(req, req.params.id, t);
    await t.commit();

    return res.status(200).json({
      message: "Cập nhật thành công!",
      htmlResponse: htmlResponse
    });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({
      message: error?.message || "Lỗi khi cập nhật HSSE.",
    });
  }
};

const updateHSSE = async (req, ID_HSSE, t) => {
  try {
    const { data } = req.body;
    const sanitizedData = Object.keys(data).reduce((acc, key) => {
      acc[key] = data[key] === null ? 0 : data[key];
      return acc;
    }, {});

    const result = await hsse.update(sanitizedData, {
      where: {
        ID: ID_HSSE,
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

const funcHSSE_Log = async (req, data, ID_HSSE, t) => {
  try {
    const userData = req.user.data;
    const Ngay_ghi_nhan = moment(new Date()).format("YYYY-MM-DD");

    const sanitizedData = Object.keys(data).reduce((acc, key) => {
      acc[key] = data[key] === null ? 0 : data[key];
      return acc;
    }, {});

    const dataUser = {
      ID_HSSE: ID_HSSE,
      Ten_du_an: userData?.ent_duan?.Duan,
      Ngay_ghi_nhan: Ngay_ghi_nhan,
      Nguoi_sua: userData?.UserName || userData?.Hoten,
      Email: userData?.Email,
      modifiedBy: "Checklist",
    };
    const combinedData = { ...sanitizedData, ...dataUser };
    await HSSE_Log.create(combinedData, { transaction: t });
  } catch (error) {
    throw error;
  }
};

const funcYesterday = async (userData, data, yesterday, t, message) => {
  try {
    let warning = "";
    let htmlResponse = "";
    const yesterdayHSSE = await hsse.findOne({
      where: {
        Ten_du_an: userData?.ent_duan?.Duan,
        Ngay_ghi_nhan: yesterday,
      },
      transaction: t,
    });

    if (yesterdayHSSE) {
      Object.keys(data).forEach((key) => {
        const currentValue = data[key];
        const yesterdayValue = yesterdayHSSE[key];
        const plus = currentValue - yesterdayValue;

        let percentIncrease;
        if (yesterdayValue == 0 && currentValue != 0) {
          percentIncrease = 100;
        } else {
          percentIncrease = (plus / yesterdayValue) * 100;
        }

        if (percentIncrease > 15) {
          const hsseItem = HSSE.find((item) => item.key === key);
          warning += `<span><strong>${hsseItem.title}</strong> lớn hơn so với ${percentIncrease}% ngày hôm trước</span></br>`;
        }
      });
    }
    if (warning != "") {
      htmlResponse = `
    <div>
      ${`<h2>Cảnh báo:</h2>${warning}`}
      <p>${message}</p>
    </div>
`;
    }

    return htmlResponse;
  } catch (error) {
    throw error;
  }
};
