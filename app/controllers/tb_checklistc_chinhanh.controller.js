const moment = require("moment");
const {
  Ent_duan,
  Ent_calv,
  Ent_khoicv,
  Tb_checklistc,
  Ent_chucvu,
  Ent_checklist,
  Ent_khuvuc,
  Ent_hangmuc,
  Ent_user,
  Ent_toanha,
  Tb_checklistchitiet,
  Tb_checklistchitietdone,
  Ent_tang,
  Ent_nhom,
  Ent_khuvuc_khoicv,
  Ent_thietlapca,
  Ent_duan_khoicv,
  Tb_sucongoai,
  Ent_chinhanh,
  Ent_checklistc,
} = require("../models/setup.model");
const { Op, Sequelize } = require("sequelize");
const sequelize = require("../config/db.config");
const cron = require("node-cron");
const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

exports.tiLeHoanThanh = async (req, res) => {
  try {
    const userData = req.user.data;
    const year = req.query.year || new Date().getFullYear();
    const month = req.query.month || new Date().getMonth() + 1;
    const khoi = req.query.khoi || "all";
    const nhom = req.query.nhom || "all";
    const tangGiam = req.query.tangGiam || "desc";
    const top = req.query.top || "5";

    let whereClause = {
      isDelete: 0,
    };

    const getLastDayOfMonth = (year, month) => {
      return new Date(year, month, 0).getDate(); // Get the last day of the given month
    };

    if (khoi !== "all") {
      whereClause.ID_KhoiCV = khoi;
    }

    if (nhom !== "all") {
      whereClause["$ent_duan.ID_Phanloai$"] = nhom; // Add condition for nhom
    }

    const yesterday = moment().subtract(1, "days").format("YYYY-MM-DD");

    // Use this in place of the current date logic in the `whereClause`
    whereClause.Ngay = {
      [Op.gte]: `${yesterday} 00:00:00`,
      [Op.lte]: `${yesterday} 23:59:59`,
    };

    // if (year && month === "all") {
    //   whereClause.Ngay = {
    //     [Op.gte]: `${year}-01-01`,
    //     [Op.lte]: `${year}-12-31`,
    //   };
    // }

    // if (year && month !== "all") {
    //   const lastDay = getLastDayOfMonth(year, month); // Get the correct last day for the given month
    //   const formattedMonth = month < 10 ? `0${month}` : `${month}`; // Ensure the month is formatted as two digits
    //   whereClause.Ngay = {
    //     [Op.gte]: `${year}-${formattedMonth}-01`,
    //     [Op.lte]: `${year}-${formattedMonth}-${lastDay}`,
    //   };
    // }

    // Fetch related checklist data along with project and khối information
    const relatedChecklists = await Tb_checklistc.findAll({
      attributes: [
        "ID_Duan",
        "ID_KhoiCV",
        "ID_Calv",
        "Ngay",
        "TongC",
        "Tong",
        "isDelete",
      ],
      where: whereClause,
      include: [
        {
          model: Ent_duan,
          attributes: ["Duan", "ID_Nhom", "ID_Phanloai", "ID_Chinhanh"],
          where: {
            ID_Chinhanh: userData.ID_Chinhanh,
          },
        },
        {
          model: Ent_khoicv,
          attributes: ["KhoiCV"], // Get khối name
        },
        {
          model: Ent_calv,
          attributes: ["Tenca"], // Get shift name
        },
      ],
    });

    // Create a dictionary to group data by project, khối, and ca
    const result = {};

    relatedChecklists.forEach((checklistC) => {
      const projectId = checklistC.ID_Duan;
      const projectName = checklistC.ent_duan.Duan;
      const khoiName = checklistC.ent_khoicv.KhoiCV;
      const shiftName = checklistC.ent_calv.Tenca;

      if (!result[projectId]) {
        result[projectId] = {
          projectName,
          khois: {},
        };
      }

      if (!result[projectId].khois[khoiName]) {
        result[projectId].khois[khoiName] = {
          shifts: {},
        };
      }

      if (!result[projectId].khois[khoiName].shifts[shiftName]) {
        result[projectId].khois[khoiName].shifts[shiftName] = {
          totalTongC: 0,
          totalTong: checklistC.Tong,
          userCompletionRates: [],
        };
      }

      // Accumulate data for shifts
      result[projectId].khois[khoiName].shifts[shiftName].totalTongC +=
        checklistC.TongC;

      // Calculate user completion rate and add to the list
      const userCompletionRate = (checklistC.TongC / checklistC.Tong) * 100;
      result[projectId].khois[khoiName].shifts[
        shiftName
      ].userCompletionRates.push(userCompletionRate);
    });

    // Calculate completion rates for each khối and project
    Object.values(result).forEach((project) => {
      Object.values(project.khois).forEach((khoi) => {
        let totalKhoiCompletionRatio = 0;
        let totalShifts = 0;

        Object.values(khoi.shifts).forEach((shift) => {
          // Calculate shift completion ratio
          let shiftCompletionRatio = shift.userCompletionRates.reduce(
            (sum, rate) => sum + rate,
            0
          );
          if (shiftCompletionRatio > 100) {
            shiftCompletionRatio = 100; // Cap each shift at 100%
          }

          // Sum up completion ratios for each khối
          totalKhoiCompletionRatio += shiftCompletionRatio;
          totalShifts += 1;
        });

        // Calculate average completion ratio for khối
        khoi.completionRatio = totalKhoiCompletionRatio / totalShifts;
      });
    });

    // Prepare response data
    let projectNames = [];
    let percentageData = [];

    Object.values(result).forEach((project) => {
      projectNames.push(project.projectName);

      let totalCompletionRatio = 0;
      let totalKhois = 0;

      Object.values(project.khois).forEach((khoi) => {
        totalCompletionRatio += khoi.completionRatio;
        totalKhois += 1;
      });

      const avgCompletionRatio =
        totalKhois > 0 ? totalCompletionRatio / totalKhois : 0;
      percentageData.push(avgCompletionRatio.toFixed(2)); // Format to 2 decimal places
    });

    // Sort the percentageData based on 'tangGiam' query parameter
    // Tạo mảng các cặp [projectName, percentageData]
    const projectWithData = projectNames.map((name, index) => ({
      name: name,
      percentage: parseFloat(percentageData[index]), // Đảm bảo giá trị là số
    }));

    // Sắp xếp dựa trên percentageData
    if (tangGiam === "asc") {
      projectWithData.sort((a, b) => a.percentage - b.percentage); // Sắp xếp tăng dần
    } else if (tangGiam === "desc") {
      projectWithData.sort((a, b) => b.percentage - a.percentage); // Sắp xếp giảm dần
    }

    const topResultArray = projectWithData.slice(0, Number(top));

    // Sau khi sắp xếp, tách lại thành 2 mảng riêng
    projectNames = topResultArray.map((item) => item.name);
    percentageData = topResultArray.map((item) => item.percentage);

    const resultArray = {
      categories: projectNames,
      series: [
        {
          type: String(year),
          data: [
            {
              name: "Tỉ lệ",
              data: percentageData,
            },
          ],
        },
      ],
    };

    res.status(200).json({
      message: "Tỉ lệ hoàn thành của các dự án theo khối",
      data: resultArray,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "Lỗi! Vui lòng thử lại sau." });
  }
};

exports.tiLeSuco = async (req, res) => {
  try {
    const userData = req.user.data;
    const year = req.query.year || new Date().getFullYear(); // Lấy năm
    const month = req.query.month || new Date().getMonth() + 1; // Lấy tháng
    const khoi = req.query.khoi;
    const nhom = req.query.nhom;
    const tangGiam = req.query.tangGiam || "desc"; // Thứ tự tăng giảm
    const top = req.query.top || "5";

    // Xây dựng điều kiện where cho truy vấn
    let whereClause = {
      isDelete: 0,
    };

    // if (khoi !== "all") {
    //   whereClause.ID_KhoiCV = khoi;
    // }

    // if (nhom !== "all") {
    //   whereClause["$ent_duan.ID_Phanloai$"] = nhom;
    // }

    const yesterday = moment().subtract(1, "days").format("YYYY-MM-DD");

    // Use this in place of the current date logic in the `whereClause`
    whereClause.Ngay = {
      [Op.gte]: `${yesterday} 00:00:00`,
      [Op.lte]: `${yesterday} 23:59:59`,
    };
    // Truy vấn cơ sở dữ liệu
    const relatedChecklists = await Tb_checklistc.findAll({
      attributes: [
        "ID_Duan",
        "ID_KhoiCV",
        "ID_Calv",
        "Ngay",
        "TongC",
        "Tong",
        "Tinhtrang",
        "isDelete",
      ],
      where: whereClause,
      include: [
        {
          model: Ent_duan,
          attributes: ["Duan", "ID_Nhom", "ID_Phanloai", "ID_Chinhanh"],
          where: {
            ID_Chinhanh: userData.ID_Chinhanh,
          },
        },
        {
          model: Ent_khoicv,
          attributes: ["KhoiCV"], // Tên khối
        },
        {
          model: Ent_calv,
          attributes: ["Tenca"], // Tên ca
        },
        {
          model: Tb_checklistchitiet,
          as: "tb_checklistchitiets",
          attributes: [
            "ID_Checklistchitiet",
            "ID_ChecklistC",
            "ID_Checklist",
            "Ketqua",
            "Anh",
            "Ngay",
            "Gioht",
            "Ghichu",
            "isDelete",
          ],
          include: [
            {
              model: Ent_checklist,
              attributes: [
                "ID_Checklist",
                "ID_Hangmuc",
                "ID_Tang",
                "Sothutu",
                "Maso",
                "MaQrCode",
                "Checklist",
                "Giatridinhdanh",
                "isCheck",
                "Giatrinhan",
                "Tinhtrang",
              ],
              where: {
                Tinhtrang: 1,
              },
            },
          ],
        },
      ],
      raw: true,
    });

    // Tạo đối tượng để lưu số lượng sự cố theo dự án
    const projectIncidentCount = {};

    // Xử lý dữ liệu để đếm số lượng sự cố cho từng dự án
    relatedChecklists.forEach((checklistC) => {
      const projectName = checklistC["ent_duan.Duan"]; // Lấy tên dự án

      // Kiểm tra nếu có dữ liệu trong tb_checklistchitiets và Tinhtrang của ent_checklist = 1
      if (
        checklistC["tb_checklistchitiets.ID_Checklistchitiet"] &&
        checklistC["tb_checklistchitiets.ent_checklist.Tinhtrang"] === 1
      ) {
        // Khởi tạo nếu dự án chưa có trong đối tượng
        if (!projectIncidentCount[projectName]) {
          projectIncidentCount[projectName] = 0;
        }

        // Tăng số lượng sự cố cho dự án này
        projectIncidentCount[projectName] += 1;
      }
    });

    // Chuyển đối tượng thành mảng kết quả
    const resultArray = Object.keys(projectIncidentCount).map(
      (projectName) => ({
        project: projectName,
        incidentCount: projectIncidentCount[projectName],
      })
    );

    // Sắp xếp kết quả theo tangGiam
    if (tangGiam === "asc") {
      resultArray.sort((a, b) => a.incidentCount - b.incidentCount); // Sắp xếp tăng dần
    } else if (tangGiam === "desc") {
      resultArray.sort((a, b) => b.incidentCount - a.incidentCount); // Sắp xếp giảm dần
    }

    const topResultArray = resultArray.slice(0, Number(top));

    const projectNames = topResultArray.map((item) => item.project);
    const percentageData = topResultArray.map((item) => item.incidentCount);

    const result = {
      categories: projectNames,
      series: [
        {
          type: String(year),
          data: [
            {
              name: "Số lượng",
              data: percentageData,
            },
          ],
        },
      ],
    };

    // Trả về kết quả
    res.status(200).json({
      message: "Số lượng sự cố theo dự án",
      data: result,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "Lỗi! Vui lòng thử lại sau." });
  }
};

exports.suCoChiTiet = async (req, res) => {
  const userData = req.user.data;
  const name = req.query.name;
  const yesterday = moment().subtract(1, "days").format("YYYY-MM-DD");

  let whereClause = {
    isDelete: 0,
  };

  whereClause.Ngay = {
    [Op.gte]: `${yesterday} 00:00:00`,
    [Op.lte]: `${yesterday} 23:59:59`,
  };

  const relatedChecklists = await Tb_checklistc.findAll({
    attributes: [
      "ID_Duan",
      "ID_KhoiCV",
      "ID_Calv",
      "Ngay",
      "TongC",
      "Tong",
      "Tinhtrang",
      "isDelete",
    ],
    where: whereClause,
    include: [
      {
        model: Ent_duan,
        attributes: ["Duan", "ID_Nhom", "ID_Phanloai", "ID_Chinhanh"],
        where: {
          ID_Chinhanh: userData.ID_Chinhanh,
        },
      },
      {
        model: Ent_khoicv,
        attributes: ["KhoiCV"],
      },
      {
        model: Ent_calv,
        attributes: ["Tenca"],
      },
      {
        model: Tb_checklistchitiet,
        as: "tb_checklistchitiets",
        attributes: [
          "ID_Checklistchitiet",
          "ID_ChecklistC",
          "ID_Checklist",
          "Ketqua",
          "Anh",
          "Ngay",
          "Gioht",
          "Ghichu",
          "isDelete",
        ],
        include: [
          {
            model: Ent_checklist,
            attributes: [
              "ID_Checklist",
              "ID_Hangmuc",
              "ID_Tang",
              "Sothutu",
              "Maso",
              "MaQrCode",
              "Checklist",
              "Giatridinhdanh",
              "isCheck",
              "Giatrinhan",
              "Tinhtrang",
              "isDelete",
            ],
            where: {
              Tinhtrang: 1,
              isDelete: 0,
            },
          },
        ],
      },
    ],
  });

  // Gom tất cả các tb_checklistchitiets từ tất cả các dự án
  const allChecklistDetails = relatedChecklists.reduce((acc, checklist) => {
    // Kiểm tra nếu có tb_checklistchitiets và trùng tên dự án (name)
    if (
      checklist.tb_checklistchitiets &&
      checklist.tb_checklistchitiets.length > 0 &&
      checklist.ent_duan.Duan.toLowerCase() === name.toLowerCase() // So sánh không phân biệt hoa thường
    ) {
      // Gom mảng tb_checklistchitiets
      acc.push(...checklist.tb_checklistchitiets);
    }
    return acc;
  }, []);

  // Trả về dữ liệu chỉ bao gồm mảng tb_checklistchitiets
  return res.status(200).json({
    message: "Danh sách chi tiết sự cố",
    data: allChecklistDetails,
  });
};

exports.soSanhSuCo = async (req, res) => {
  try {
    const userData = req.user.data;
    const weekAgo = moment().subtract(1, "week");
    const twoWeeksAgo = moment().subtract(2, "week");

    // Đặt ngày bắt đầu và kết thúc cho hai tuần trước
    const startOfLastWeek = weekAgo
      .clone()
      .startOf("isoWeek")
      .format("YYYY-MM-DD HH:mm:ss");
    const endOfLastWeek = weekAgo
      .clone()
      .endOf("isoWeek")
      .format("YYYY-MM-DD HH:mm:ss");

    const startOfTwoWeeksAgo = twoWeeksAgo
      .clone()
      .startOf("isoWeek")
      .format("YYYY-MM-DD HH:mm:ss");
    const endOfTwoWeeksAgo = twoWeeksAgo
      .clone()
      .endOf("isoWeek")
      .format("YYYY-MM-DD HH:mm:ss");

    // Xây dựng điều kiện where cho truy vấn
    let whereClause = {
      isDelete: 0,
    };

    // if (khoi !== "all") {
    //   whereClause.ID_KhoiCV = khoi;
    // }

    // if (nhom !== "all") {
    //   whereClause["$ent_duan.ID_Nhom$"] = nhom;
    // }

    // Truy vấn số lượng sự cố cho tuần trước
    const lastWeekIncidents = await Tb_checklistc.findAll({
      attributes: [
        [sequelize.fn("COUNT", sequelize.col("ID_Duan")), "lastWeekTotalCount"],
      ],
      where: {
        ...whereClause,
        Ngay: {
          [Op.gte]: startOfLastWeek,
          [Op.lte]: endOfLastWeek,
        },
      },
    });

    // Truy vấn số lượng sự cố cho tuần trước nữa
    const twoWeeksAgoIncidents = await Tb_checklistc.findAll({
      attributes: [
        [
          sequelize.fn("COUNT", sequelize.col("ID_Duan")),
          "twoWeeksAgoTotalCount",
        ],
      ],
      where: {
        ...whereClause,
        Ngay: {
          [Op.gte]: startOfTwoWeeksAgo,
          [Op.lte]: endOfTwoWeeksAgo,
        },
      },
      raw: true,
    });

    // Lấy tổng số lượng sự cố từ kết quả truy vấn
    const lastWeekCount =
      parseInt(lastWeekIncidents[0]?.lastWeekTotalCount, 10) || 0;
    const twoWeeksAgoCount =
      parseInt(twoWeeksAgoIncidents[0]?.twoWeeksAgoTotalCount, 10) || 0;

    // Tính phần trăm thay đổi
    let percentageChange = 0;
    if (twoWeeksAgoCount > 0) {
      // Tránh chia cho 0
      percentageChange =
        ((lastWeekCount - twoWeeksAgoCount) / twoWeeksAgoCount) * 100;
    } else if (lastWeekCount > 0) {
      percentageChange = 100; // Nếu tuần trước có sự cố mà tuần này không có
    }

    // Trả về kết quả
    res.status(200).json({
      message: "So sánh số lượng sự cố giữa hai tuần",
      data: {
        lastWeekTotalCount: lastWeekCount,
        twoWeeksAgoTotalCount: twoWeeksAgoCount,
        percentageChange: percentageChange.toFixed(2), // Làm tròn đến 2 chữ số thập phân
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "Lỗi! Vui lòng thử lại sau." });
  }
};

exports.createExcelDuAn = async (req, res) => {
  try {
    // const yesterday = moment().subtract(1, "days").format("YYYY-MM-DD");
    const userData = req.user.data;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("CheckList Projects");

    // Thêm các tiêu đề cột cho bảng Excel
    worksheet.columns = [
      { header: "Thuộc CN", key: "nhom", width: 20 },
      { header: "Tên dự án", key: "tenduan", width: 25 },
      { header: "Kỹ thuật", key: "kythuat", width: 10 },
      { header: "Làm sạch", key: "lamsach", width: 10 },
      { header: "An ninh", key: "anninh", width: 10 },
      { header: "Dịch vụ", key: "dichvu", width: 10 },
      { header: "F&B", key: "fb", width: 10 },
      { header: "Tỉ lệ checklist", key: "tile", width: 10 },
      { header: "Đã triển khai", key: "dachay", width: 10 },
      { header: "Ghi chú", key: "ghichu", width: 20 },
    ];

    // Lấy tất cả dữ liệu checklistC cho ngày hôm qua
    const dataChecklistCs = await Tb_checklistc.findAll({
      attributes: [
        "ID_ChecklistC",
        "ID_Duan",
        "ID_Calv",
        "Ngay",
        "TongC",
        "Tong",
        "ID_KhoiCV",
        "isDelete",
      ],
      where: {
        isDelete: 0,
        // Ngay: yesterday
      },
      include: [
        {
          model: Ent_duan,
          attributes: ["Duan", "ID_Nhom", "ID_Chinhanh"],
          where: {
            ID_Duan: {
              [Op.ne]: 1, 
            },
            ID_Chinhanh: userData.ID_Chinhanh
          },
          include: [
            {
              model: Ent_chinhanh,
              attributes: ["Tenchinhanh"],
            },
          ],
        },
        {
          model: Ent_khoicv, 
          attributes: ["KhoiCV"],
        },
        {
          model: Ent_calv,
          attributes: ["Tenca", "isDelete"], 
          where: {
            isDelete: 0,
          },
        },
      ],
    });

    const result = {};

    dataChecklistCs.forEach((checklistC) => {
      const projectId = checklistC.ID_Duan;
      const projectName = checklistC.ent_duan.Duan;
      const projectChinhanh = checklistC.ent_duan.ent_chinhanh.Tenchinhanh;
      const khoiName = checklistC.ent_khoicv.KhoiCV;
      const shiftName = checklistC.ent_calv.Tenca;

      // Khởi tạo dữ liệu dự án nếu chưa tồn tại
      if (!result[projectId]) {
        result[projectId] = {
          projectId,
          projectName,
          projectChinhanh,
          createdKhois: {},
        };
      }

      // Khởi tạo dữ liệu cho khối nếu chưa tồn tại
      if (!result[projectId].createdKhois[khoiName]) {
        result[projectId].createdKhois[khoiName] = {
          shifts: {},
        };
      }

      // Khởi tạo dữ liệu cho ca nếu chưa tồn tại
      if (!result[projectId].createdKhois[khoiName].shifts[shiftName]) {
        result[projectId].createdKhois[khoiName].shifts[shiftName] = {
          totalTongC: 0,
          totalTong: 0,
          userCompletionRates: [], // Lưu danh sách tỷ lệ hoàn thành của từng người
        };
      }

      // Cộng dồn TongC và Tong cho ca
      result[projectId].createdKhois[khoiName].shifts[shiftName].totalTongC +=
        checklistC.TongC;
      result[projectId].createdKhois[khoiName].shifts[shiftName].totalTong =
        checklistC.Tong;

      // Lưu tỷ lệ hoàn thành của từng người
      if (checklistC.Tong > 0) {
        const userCompletionRate = (checklistC.TongC / checklistC.Tong) * 100;
        result[projectId].createdKhois[khoiName].shifts[
          shiftName
        ].userCompletionRates.push(userCompletionRate);
        console.log(`Tỷ lệ hoàn thành của ca: ${userCompletionRate}%`);
      } else {
        console.log(`Tỷ lệ hoàn thành của ca: 0% (Tong = 0)`);
      }
    });

    // Tính toán phần trăm hoàn thành riêng cho từng ca và tổng khối
    Object.values(result).forEach((project) => {
      Object.values(project.createdKhois).forEach((khoi) => {
        let totalKhoiCompletionRatio = 0;
        let totalShifts = 0;

        Object.values(khoi.shifts).forEach((shift) => {
          // Tính phần trăm hoàn thành cho ca dựa trên tỷ lệ của từng người trong ca
          let shiftCompletionRatio = shift.userCompletionRates.reduce(
            (sum, rate) => sum + rate,
            0
          );
          if (shiftCompletionRatio > 100) {
            shiftCompletionRatio = 100; // Giới hạn phần trăm hoàn thành tối đa là 100% cho từng ca
          }

          // Tính tổng tỷ lệ hoàn thành của các ca
          totalKhoiCompletionRatio += shiftCompletionRatio;
          totalShifts += 1; // Tăng số lượng ca
        });

        // Tính phần trăm hoàn thành trung bình cho khối
        const avgKhoiCompletionRatio = totalKhoiCompletionRatio / totalShifts;

        khoi.completionRatio = Number.isInteger(avgKhoiCompletionRatio)
          ? avgKhoiCompletionRatio // No decimal places, return as is
          : avgKhoiCompletionRatio.toFixed(2); // Otherwise, apply toFixed(2)
      });
    });

    // Chuyển result object thành mảng
    const resultArray = Object.values(result);

    // Duyệt qua từng dự án và thêm vào bảng
    resultArray.forEach((project, index) => {
      const { projectName, createdKhois, projectChinhanh } = project;
      let rowValues = {
        nhom: projectChinhanh, // Thuộc CN
        tenduan: projectName,
        kythuat: "",
        lamsach: "",
        anninh: "",
        dichvu: "",
        fb: "",
        dachay: "",
        ghichu: "",
      };

      let totalChecklistPercentage = 0;
      let numKhoisWithData = 0;

      // Kiểm tra từng khối công việc
      Object.keys(createdKhois).forEach((khoiName) => {
        const khoi = createdKhois[khoiName];
        let totalKhoiCompletionRatio = 0;
        let totalShifts = 0;

        // Kiểm tra từng ca làm việc trong khối
        Object.keys(khoi.shifts).forEach((shiftName) => {
          const shift = khoi.shifts[shiftName];
          const completionRate = shift.userCompletionRates.reduce(
            (sum, rate) => sum + rate,
            0
          );

          const shiftCompletionRatio = Math.min(completionRate, 100);

          // Chỉ tính khi completionRate > 0
          if (completionRate > 0) {
            totalKhoiCompletionRatio += shiftCompletionRatio;
            totalShifts += 1;
            rowValues.dachay = "✔️"; // Nếu có tỷ lệ hoàn thành, đặt dấu ✔️
          }
        });

        // Tính phần trăm hoàn thành trung bình cho khối
        if (totalShifts > 0) {
          const avgKhoiCompletionRatio = totalKhoiCompletionRatio / totalShifts;

          // Cộng tổng tỷ lệ của khối vào tổng tỷ lệ checklist chung
          totalChecklistPercentage += avgKhoiCompletionRatio;
          numKhoisWithData += 1; // Tăng số khối có dữ liệu
        }

        // Điền dữ liệu cho các khối cụ thể
        if (khoiName === "Khối kỹ thuật") {
          rowValues.kythuat = "X";
        }
        if (khoiName === "Khối làm sạch") {
          rowValues.lamsach = "X";
        }
        if (khoiName === "Khối bảo vệ") {
          rowValues.anninh = "X";
        }
        if (khoiName === "Khối dịch vụ") {
          rowValues.dichvu = "X";
        }
        if (khoiName === "Khối F&B") {
          rowValues.fb = "X";
        }
      });

      // Tính tỷ lệ checklist trung bình
      let tileChecklist = 0;
      if (numKhoisWithData > 0) {
        tileChecklist = totalChecklistPercentage / numKhoisWithData;
      }

      // Đảm bảo không có giá trị NaN và chỉ hiển thị khi có giá trị hợp lệ
      rowValues.tile = isNaN(tileChecklist)
        ? "N/A"
        : tileChecklist.toFixed(2) + "%";

      // Thêm dữ liệu vào bảng
      worksheet.addRow(rowValues);
    });

    // Tạo file buffer để xuất file Excel
    const buffer = await workbook.xlsx.writeBuffer();

    // res.setHeader(
    //   "Content-Disposition",
    //   "attachment; filename=CheckListProjects.xlsx"
    // );
    // res.setHeader(
    //   "Content-Type",
    //   "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    // );

    await workbook.xlsx.load(buffer);
    const rows = [];
    worksheet.eachRow((row, rowNumber) => {
      const rowData = [];
      row.eachCell((cell, colNumber) => {
        rowData.push(cell.value);
      });
      rows.push(rowData);
    });

    res.json(rows);
  } catch (err) {
    res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

const calculateCompletionPercentagePerProject = (checklists) => {
  const projectCompletionRates = {};

  // Group checklists by project and calculate individual project completion rates
  checklists.forEach((checklist) => {
    const projectId = checklist.ID_Duan;

    if (!projectCompletionRates[projectId]) {
      projectCompletionRates[projectId] = {
        totalTongC: 0,
        totalTong: 0,
      };
    }

    // Sum up TongC and Tong for each project
    projectCompletionRates[projectId].totalTongC += checklist.TongC;
    projectCompletionRates[projectId].totalTong += checklist.Tong;
  });

  let totalCompletionPercentage = 0;
  const numberOfProjects = Object.keys(projectCompletionRates).length;

  // Calculate percentage for each project and sum them
  Object.values(projectCompletionRates).forEach((project) => {
    const projectPercentage =
      project.totalTong > 0
        ? (project.totalTongC / project.totalTong) * 100
        : 0;
    totalCompletionPercentage += projectPercentage;
  });

  // Return average completion percentage for all projects
  return numberOfProjects > 0
    ? totalCompletionPercentage / numberOfProjects
    : 0;
};

exports.reportPercentWeek = async (req, res) => {
  try {
    const userData = req.user.data;
    const khoi = req.query.khoi;
    const nhom = req.query.nhom;

    let lastWhereClause = {
      isDelete: 0,
    };

    let prevWhereClause = {
      isDelete: 0,
    };

    // if (khoi !== "all") {
    //   lastWhereClause.ID_KhoiCV = khoi;
    //   prevWhereClause.ID_KhoiCV = khoi;
    // }

    // if (nhom !== "all") {
    //   lastWhereClause["$ent_duan.ID_Nhom$"] = nhom;
    //   prevWhereClause["$ent_duan.ID_Nhom$"] = nhom;
    // }

    // Get date ranges for last week and the previous week
    const lastWeekStart = moment()
      .subtract(7, "days")
      .startOf("day")
      .format("YYYY-MM-DD");
    const lastWeekEnd = moment()
      .subtract(1, "days")
      .endOf("day")
      .format("YYYY-MM-DD");
    const previousWeekStart = moment()
      .subtract(14, "days")
      .startOf("day")
      .format("YYYY-MM-DD");
    const previousWeekEnd = moment()
      .subtract(8, "days")
      .endOf("day")
      .format("YYYY-MM-DD");

    lastWhereClause.Ngay = {
      [Op.gte]: `${lastWeekStart} 00:00:00`,
      [Op.lte]: `${lastWeekEnd} 23:59:59`,
    };

    prevWhereClause.Ngay = {
      [Op.gte]: `${previousWeekStart} 00:00:00`,
      [Op.lte]: `${previousWeekEnd} 23:59:59`,
    };

    // Fetch data for last week
    const lastWeekData = await Tb_checklistc.findAll({
      attributes: [
        "ID_ChecklistC",
        "ID_Duan",
        "ID_Calv",
        "Ngay",
        "TongC",
        "Tong",
        "ID_KhoiCV",
        "isDelete",
      ],
      where: lastWhereClause,
      include: [
        {
          model: Ent_duan,
          attributes: ["Duan", "ID_Nhom", "ID_Chinhanh"],
          where: {
            ID_Chinhanh: userData.ID_Chinhanh,
          },
        },
        { model: Ent_khoicv, attributes: ["KhoiCV"] },
        { model: Ent_calv, attributes: ["Tenca"] },
      ],
    });

    // Fetch data for previous week
    const previousWeekData = await Tb_checklistc.findAll({
      attributes: [
        "ID_ChecklistC",
        "ID_Duan",
        "ID_Calv",
        "Ngay",
        "TongC",
        "Tong",
        "ID_KhoiCV",
        "isDelete",
      ],
      where: prevWhereClause,
      include: [
        {
          model: Ent_duan,
          attributes: ["Duan", "ID_Nhom", "ID_Duan", "ID_Chinhanh"],
          where: {
            ID_Chinhanh: userData.ID_Chinhanh,
          },
        },
        { model: Ent_khoicv, attributes: ["KhoiCV"] },
        { model: Ent_calv, attributes: ["Tenca"] },
      ],
    });

    // Calculate total completion percentage for last week and previous week
    const lastWeekPercentage =
      calculateCompletionPercentagePerProject(lastWeekData);
    const previousWeekPercentage =
      calculateCompletionPercentagePerProject(previousWeekData);

    // Calculate the difference between the two weeks
    const percentageDifference = lastWeekPercentage - previousWeekPercentage;

    res.status(200).json({
      message: "Completion percentages comparison between two weeks",
      data: {
        lastWeekPercentage: lastWeekPercentage.toFixed(2),
        previousWeekPercentage: previousWeekPercentage.toFixed(2),
        percentageDifference: percentageDifference.toFixed(2),
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "Error! Please try again later." });
  }
};

exports.reportPercentYesterday = async (req, res) => {
  try {
    const userData = req.user.data;
    // Lấy ngày hôm qua
    const yesterday = moment().subtract(1, "days").format("YYYY-MM-DD");

    // Lấy tất cả dữ liệu checklistC cho ngày hôm qua
    const dataChecklistCs = await Tb_checklistc.findAll({
      attributes: [
        "ID_ChecklistC",
        "ID_Duan",
        "ID_Calv",
        "Ngay",
        "TongC",
        "Tong",
        "ID_KhoiCV",
        "isDelete",
      ],
      where: {
        Ngay: yesterday,
        isDelete: 0,
      },
      include: [
        {
          model: Ent_duan,
          attributes: ["Duan", "ID_Chinhanh"],
          where: {
            ID_Chinhanh: userData.ID_Chinhanh,
          },
        },
        {
          model: Ent_khoicv,
          attributes: ["KhoiCV"],
        },
        {
          model: Ent_calv,
          attributes: ["Tenca"],
        },
      ],
    });

    // Tạo một dictionary để nhóm dữ liệu theo dự án và khối
    const result = {};

    dataChecklistCs.forEach((checklistC) => {
      const projectId = checklistC.ID_Duan;
      const projectName = checklistC.ent_duan.Duan;
      const khoiName = checklistC.ent_khoicv.KhoiCV;
      const shiftName = checklistC.ent_calv.Tenca;

      // Khởi tạo dữ liệu dự án nếu chưa tồn tại
      if (!result[projectId]) {
        result[projectId] = {
          projectId,
          projectName,
          createdKhois: {},
        };
      }

      // Khởi tạo dữ liệu cho khối nếu chưa tồn tại
      if (!result[projectId].createdKhois[khoiName]) {
        result[projectId].createdKhois[khoiName] = {
          shifts: {},
        };
      }

      // Khởi tạo dữ liệu cho ca nếu chưa tồn tại
      if (!result[projectId].createdKhois[khoiName].shifts[shiftName]) {
        result[projectId].createdKhois[khoiName].shifts[shiftName] = {
          totalTongC: 0,
          totalTong: 0,
          userCompletionRates: [],
        };
      }

      // Cộng dồn TongC và Tong cho ca
      result[projectId].createdKhois[khoiName].shifts[shiftName].totalTongC +=
        checklistC.TongC;
      result[projectId].createdKhois[khoiName].shifts[shiftName].totalTong =
        checklistC.Tong;

      // Lưu tỷ lệ hoàn thành của từng người
      if (checklistC.Tong > 0) {
        // Check to prevent division by zero
        const userCompletionRate = (checklistC.TongC / checklistC.Tong) * 100;
        result[projectId].createdKhois[khoiName].shifts[
          shiftName
        ].userCompletionRates.push(userCompletionRate);
      }
    });

    // Tính toán phần trăm hoàn thành riêng cho từng ca và tổng khối
    Object.values(result).forEach((project) => {
      Object.values(project.createdKhois).forEach((khoi) => {
        let totalKhoiCompletionRatio = 0;
        let totalShifts = 0;

        Object.values(khoi.shifts).forEach((shift) => {
          let shiftCompletionRatio = shift.userCompletionRates.reduce(
            (sum, rate) => sum + rate,
            0
          );
          shiftCompletionRatio = Math.min(shiftCompletionRatio, 100); // Giới hạn phần trăm hoàn thành tối đa là 100%

          totalKhoiCompletionRatio += shiftCompletionRatio;
          totalShifts += 1;
        });

        // Tính phần trăm hoàn thành trung bình cho khối
        const avgKhoiCompletionRatio = totalKhoiCompletionRatio / totalShifts;
        khoi.completionRatio = Number.isInteger(avgKhoiCompletionRatio)
          ? avgKhoiCompletionRatio
          : avgKhoiCompletionRatio.toFixed(2);
      });
    });

    // Chuyển result object thành mảng
    const resultArray = Object.values(result);

    // Tạo đối tượng để lưu tổng completionRatio và đếm số dự án có khối tương ứng
    const avgKhoiCompletion = {
      "Khối kỹ thuật": { totalCompletion: 0, projectCount: 0 },
      "Khối làm sạch": { totalCompletion: 0, projectCount: 0 },
      "Khối dịch vụ": { totalCompletion: 0, projectCount: 0 },
      "Khối bảo vệ": { totalCompletion: 0, projectCount: 0 },
      "Khối F&B": { totalCompletion: 0, projectCount: 0 },
    };

    // Tính toán tổng completionRatio cho từng khối từ tất cả các dự án
    Object.values(result).forEach((project) => {
      Object.keys(avgKhoiCompletion).forEach((khoiName) => {
        const khoi = project.createdKhois[khoiName];
        if (khoi && khoi.completionRatio) {
          avgKhoiCompletion[khoiName].totalCompletion += parseFloat(
            khoi.completionRatio
          );
          avgKhoiCompletion[khoiName].projectCount += 1;
        }
      });
    });

    // Tính trung bình completionRatio cho từng khối
    const avgCompletionRatios = {};
    Object.keys(avgKhoiCompletion).forEach((khoiName) => {
      const { totalCompletion, projectCount } = avgKhoiCompletion[khoiName];
      if (projectCount > 0) {
        const averageCompletion = totalCompletion / projectCount;
        avgCompletionRatios[khoiName] = Number.isInteger(averageCompletion)
          ? averageCompletion
          : averageCompletion.toFixed(2);
      } else {
        // Gán mặc định là 0 khi không có project nào
        avgCompletionRatios[khoiName] = 0;
      }
    });
    // Bạn có thể trả về kết quả này trong response của API
    res.status(200).json({
      message:
        "Trạng thái checklist của các dự án theo từng khối và ca làm việc",
      data: resultArray,
      avgCompletionRatios, // Thêm tỷ lệ trung bình vào kết quả trả về
    });
  } catch (err) {
    console.error("Error fetching checklist data: ", err); // Log the error for debugging
    res
      .status(500)
      .json({ message: err.message || "Lỗi! Vui lòng thử lại sau." });
  }
};

exports.checklistPercent = async (req, res) => {
  try {
    const userData = req.user.data;

    if (!userData) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ." });
    }

    let whereClause = {
      isDelete: 0,
      ID_Duan: userData.ID_Duan,
    };

    const results = await Tb_checklistc.findAll({
      include: [
        {
          model: Ent_khoicv,
          attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
        },
      ],
      attributes: [
        [sequelize.col("ent_khoicv.KhoiCV"), "label"],
        [sequelize.col("tb_checklistc.tongC"), "totalAmount"],
        [
          sequelize.literal("tb_checklistc.tongC / tb_checklistc.tong * 100"),
          "value",
        ],
      ],
      where: whereClause,
    });

    // Chuyển đổi dữ liệu kết quả sang định dạng mong muốn
    const data = results.map((result) => {
      const { label, totalAmount, value } = result.get();
      return {
        label,
        totalAmount,
        value,
      };
    });
    processData(data).then((finalData) => {
      res.status(200).json({
        message: "Dữ liệu!",
        data: finalData,
      });
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "Lỗi! Vui lòng thử lại sau." });
  }
};

exports.getChecklistsErrorFromYesterday = async (req, res) => {
  try {
    const userData = req.user.data;
    // Get the date for yesterday and today
    const yesterday = moment().subtract(1, "days").format("YYYY-MM-DD");
    const now = moment().format("YYYY-MM-DD");

    // Fetch all checklistC data for yesterday
    const dataChecklistCs = await Tb_checklistc.findAll({
      attributes: [
        "ID_ChecklistC",
        "ID_Duan",
        "Tong",
        "TongC",
        "Ngay",
        "ID_KhoiCV",
        "ID_Calv",
        "ID_User",
      ],
      include: [
        {
          model: Ent_khoicv,
          attributes: ["KhoiCV"],
        },
        {
          model: Ent_calv,
          attributes: ["Tenca", "Giobatdau", "Gioketthuc"],
        },
        {
          model: Ent_duan,
          attributes: ["Duan", "ID_Nhom", "ID_Chinhanh"],
          where: {
            ID_Chinhanh: userData.ID_Chinhanh,
          },
          include: [
            {
              model: Ent_nhom,
              attributes: ["Tennhom"],
            },
          ],
        },
      ],
      where: {
        Ngay: {
          [Op.between]: [yesterday, now],
        },
        // ID_Duan: userData.ID_Duan
      },
    });

    // Fetch checklist detail items for the related checklistC
    const checklistDetailItems = await Tb_checklistchitiet.findAll({
      attributes: [
        "ID_ChecklistC",
        "ID_Checklist",
        "Ketqua",
        "Anh",
        "Ghichu",
        "Gioht",
      ],
      where: {
        ID_ChecklistC: {
          [Op.in]: dataChecklistCs.map(
            (checklistC) => checklistC.ID_ChecklistC
          ),
        },
        Anh: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: "" }] },
        Ghichu: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: "" }] },
      },
      include: [
        {
          model: Tb_checklistc,
          as: "tb_checklistc",
          attributes: [
            "ID_ChecklistC",
            "ID_Duan",
            "ID_KhoiCV",
            "ID_Calv",
            "ID_User",
            "Ngay",
            "Tong",
            "TongC",
            "Giobd","Gioghinhan",
            "Giochupanh1",
            "Anh1",
            "Giochupanh2",
            "Anh2",
            "Giochupanh3",
            "Anh3",
            "Giochupanh4",
            "Anh4",
            "Giokt",
            "Ghichu",
            "Tinhtrang",
            "isDelete",
          ],
          include: [
            {
              model: Ent_khoicv,
              attributes: ["KhoiCV"],
            },
            {
              model: Ent_duan,
              attributes: ["Duan"],
            },
            {
              model: Ent_calv,
              attributes: ["Tenca", "Giobatdau", "Gioketthuc"],
            },
          ],
        },
        {
          model: Ent_checklist,
          attributes: [
            "ID_Checklist",
            "ID_Khuvuc",
            "ID_Hangmuc",
            "ID_Tang",
            "Sothutu",
            "Maso",
            "MaQrCode",
            "Checklist",
            "Giatridinhdanh",
            "isCheck",
            "Giatrinhan",
          ],
          include: [
            {
              model: Ent_khuvuc,
              attributes: ["Tenkhuvuc", "MaQrCode", "Makhuvuc", "Sothutu"],
              include: [
                {
                  model: Ent_toanha,
                  attributes: ["Toanha", "ID_Duan"],
                  include: [
                    {
                      model: Ent_duan,
                      attributes: ["Duan", "ID_Nhom"],
                      include: [
                        {
                          model: Ent_nhom,
                          attributes: ["Tennhom"],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              model: Ent_hangmuc,
              as: "ent_hangmuc",
              attributes: [
                "Hangmuc",
                "Tieuchuankt",
                "ID_Khuvuc",
                "MaQrCode",
                "FileTieuChuan",
              ],
            },
            {
              model: Ent_tang,
              attributes: ["Tentang"],
            },
            {
              model: Ent_user,
              attributes: ["UserName", "Hoten"],
            },
          ],
        },
      ],
    });

    // Populate error details
    const errorDetails = checklistDetailItems.map((item) => ({
      checklistId: item.ID_Checklist,
      checklistName: item.ent_checklist.Checklist,
      Anh: item.Anh,
      image: `https://lh3.googleusercontent.com/d/${item.Anh}=s1000?authuser=0`,
      note: item.Ghichu,
      gioht: item.Gioht,
      Ngay: item?.tb_checklistc?.Ngay,
      calv: item?.tb_checklistc?.ent_calv?.Tenca,
      Giamsat: item?.tb_checklistc?.ent_user?.Hoten,
      khoilv: item?.tb_checklistc?.ent_khoicv?.KhoiCV,
      duan: item?.tb_checklistc?.ent_duan?.Duan,
    }));

    res.status(200).json({
      message: "Danh sách checklist lỗi một tuần",
      data: errorDetails,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "Lỗi! Vui lòng thử lại sau." });
  }
};

exports.getChecklistsError = async (req, res) => {
  try {
    const userData = req.user.data;
    const orConditions = [];
    orConditions.push({
      "$ent_hangmuc.ent_khuvuc.ent_toanha.ID_Duan$": userData?.ID_Duan,
    });

    // Fetch all checklistC data for yesterday, excluding projects 10 and 17
    const dataChecklistCs = await Ent_checklist.findAll({
      attributes: [
        "ID_Checklist",
        "ID_Hangmuc",
        "ID_Tang",
        "Sothutu",
        "Maso",
        "MaQrCode",
        "Tinhtrang",
        "Checklist",
        "Giatridinhdanh",
        "isCheck",
        "Giatrinhan",
        "isDelete",
      ],
      include: [
        {
          model: Ent_hangmuc,
          as: "ent_hangmuc",
          attributes: [
            "Hangmuc",
            "Tieuchuankt",
            "ID_Khuvuc",
            "MaQrCode",
            "ID_Khuvuc",
            "FileTieuChuan",
          ],
          include: [
            {
              model: Ent_khuvuc,
              attributes: ["Tenkhuvuc", "MaQrCode", "Makhuvuc", "Sothutu"],

              include: [
                {
                  model: Ent_toanha,
                  attributes: ["Toanha", "ID_Duan"],
                  include: [
                    {
                      model: Ent_duan,
                      attributes: ["Duan", "ID_Nhom", "ID_Duan"],
                      include: [
                        {
                          model: Ent_nhom,
                          attributes: ["Tennhom"],
                        },
                      ],
                      where: {
                        ID_Duan: userData.ID_Duan,
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          model: Ent_khuvuc,
          attributes: ["Tenkhuvuc", "MaQrCode", "Makhuvuc", "Sothutu"],

          include: [
            {
              model: Ent_toanha,
              attributes: ["Toanha", "ID_Duan"],
              include: [
                {
                  model: Ent_duan,
                  attributes: ["Duan", "ID_Nhom", "ID_Duan"],
                  include: [
                    {
                      model: Ent_nhom,
                      attributes: ["Tennhom"],
                    },
                  ],
                  where: {
                    ID_Duan: userData.ID_Duan,
                  },
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
          attributes: [
            "UserName",
            "Email",
            "Hoten",
            "Ngaysinh",
            "Gioitinh",
            "Sodienthoai",
          ],
        },
      ],
      where: {
        Tinhtrang: 1,
        isDelete: 0,
        [Op.and]: [orConditions],
      },
    });

    // Convert result object to array
    const resultArray = Object.values(dataChecklistCs);

    res.status(200).json({
      message: "Danh sách checklist lỗi trong dự án",
      count: dataChecklistCs.length,
      data: resultArray,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "Lỗi! Vui lòng thử lại sau." });
  }
};

exports.getProjectsChecklistStatus = async (req, res) => {
  try {
    const userData = req.user.data;
    // Lấy ngày hôm qua
    const yesterday = moment().subtract(1, "days").format("YYYY-MM-DD");

    // Lấy tất cả dữ liệu checklistC cho ngày hôm qua
    const dataChecklistCs = await Tb_checklistc.findAll({
      attributes: [
        "ID_ChecklistC",
        "ID_Duan",
        "ID_Calv",
        "Ngay",
        "TongC",
        "Tong",
        "ID_KhoiCV",
        "isDelete",
      ],
      where: {
        Ngay: yesterday,
        isDelete: 0,
      },
      include: [
        {
          model: Ent_duan,
          attributes: ["Duan", "ID_Duan", "ID_Chinhanh"],
          where: {
            ID_Chinhanh: userData.ID_Chinhanh,
          },
        },
        {
          model: Ent_khoicv, // Thêm bảng Ent_khoicv để lấy tên khối
          attributes: ["KhoiCV"],
        },
        {
          model: Ent_calv,
          attributes: ["Tenca"], // Lấy tên ca
        },
      ],
    });

    // Tạo một dictionary để nhóm dữ liệu theo dự án và khối
    const result = {};

    dataChecklistCs.forEach((checklistC) => {
      const projectId = checklistC.ID_Duan;
      const projectName = checklistC.ent_duan.Duan;
      const khoiName = checklistC.ent_khoicv.KhoiCV;
      const shiftName = checklistC.ent_calv.Tenca;

      // Khởi tạo dữ liệu dự án nếu chưa tồn tại
      if (!result[projectId]) {
        result[projectId] = {
          projectId,
          projectName,
          createdKhois: {},
        };
      }

      // Khởi tạo dữ liệu cho khối nếu chưa tồn tại
      if (!result[projectId].createdKhois[khoiName]) {
        result[projectId].createdKhois[khoiName] = {
          shifts: {},
        };
      }

      // Khởi tạo dữ liệu cho ca nếu chưa tồn tại
      if (!result[projectId].createdKhois[khoiName].shifts[shiftName]) {
        result[projectId].createdKhois[khoiName].shifts[shiftName] = {
          totalTongC: 0,
          totalTong: 0,
          userCompletionRates: [], // Lưu danh sách tỷ lệ hoàn thành của từng người
        };
      }

      // Cộng dồn TongC và Tong cho ca
      result[projectId].createdKhois[khoiName].shifts[shiftName].totalTongC +=
        checklistC.TongC;
      result[projectId].createdKhois[khoiName].shifts[shiftName].totalTong +=
        checklistC.Tong;

      // Lưu tỷ lệ hoàn thành của từng người
      const userCompletionRate = (checklistC.TongC / checklistC.Tong) * 100;
      result[projectId].createdKhois[khoiName].shifts[
        shiftName
      ].userCompletionRates.push(userCompletionRate);
    });

    // Tính toán phần trăm hoàn thành riêng cho từng ca và tổng khối
    Object.values(result).forEach((project) => {
      Object.values(project.createdKhois).forEach((khoi) => {
        let totalKhoiCompletionRatio = 0;
        let totalShifts = 0;

        Object.values(khoi.shifts).forEach((shift) => {
          // Tính phần trăm hoàn thành cho ca dựa trên tỷ lệ của từng người trong ca
          let shiftCompletionRatio = shift.userCompletionRates.reduce(
            (sum, rate) => sum + rate,
            0
          );
          if (shiftCompletionRatio > 100) {
            shiftCompletionRatio = 100; // Giới hạn phần trăm hoàn thành tối đa là 100% cho từng ca
          }

          // Tính tổng tỷ lệ hoàn thành của các ca
          totalKhoiCompletionRatio += shiftCompletionRatio;
          totalShifts += 1; // Tăng số lượng ca
        });

        // Tính phần trăm hoàn thành trung bình cho khối
        const avgKhoiCompletionRatio = totalKhoiCompletionRatio / totalShifts;

        khoi.completionRatio = Number.isInteger(avgKhoiCompletionRatio)
          ? avgKhoiCompletionRatio // No decimal places, return as is
          : avgKhoiCompletionRatio.toFixed(2); // Otherwise, apply toFixed(2)
      });
    });

    // Chuyển result object thành mảng
    const resultArray = Object.values(result);

    res.status(200).json({
      message:
        "Trạng thái checklist của các dự án theo từng khối và ca làm việc",
      data: resultArray,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "Lỗi! Vui lòng thử lại sau." });
  }
};

exports.getProjectChecklistDays = async (req, res) => {
  try {
    // Lấy ngày bắt đầu từ 7 ngày trước
    const startDate = moment().subtract(7, "days").format("YYYY-MM-DD");
    const yesterday = moment().subtract(1, "days").format("YYYY-MM-DD");

    // Lấy ID_Duan từ req.params hoặc req.query
    const { ID_Duan } = req.user.data; // Ensure project ID is passed in the request

    // Kiểm tra nếu không có ID_Duan được cung cấp
    if (!ID_Duan) {
      return res.status(400).json({ message: "ID_Duan is required" });
    }

    // Lấy tất cả dữ liệu checklistC cho dự án duy nhất trong vòng 7 ngày
    const dataChecklistCs = await Tb_checklistc.findAll({
      attributes: [
        "ID_ChecklistC",
        "ID_Duan",
        "ID_Calv",
        "Ngay",
        "TongC",
        "Tong",
        "ID_KhoiCV",
        "isDelete",
      ],
      where: {
        Ngay: {
          [Op.between]: [startDate, yesterday],
        },
        ID_Duan: ID_Duan,
        isDelete: 0,
      },
      include: [
        {
          model: Ent_khoicv, // Lấy tên khối
          attributes: ["KhoiCV"],
        },
        {
          model: Ent_calv, // Lấy tên ca
          attributes: ["Tenca"],
        },
      ],
    });

    // Tạo dictionary để nhóm dữ liệu theo ngày và khối
    const result = {};

    dataChecklistCs.forEach((checklistC) => {
      const date = checklistC.Ngay;
      const khoiName = checklistC.ent_khoicv.KhoiCV;
      const shiftName = checklistC.ent_calv.Tenca;

      // Khởi tạo dữ liệu cho ngày nếu chưa tồn tại
      if (!result[date]) {
        result[date] = {
          date,
          createdKhois: {},
        };
      }

      // Khởi tạo dữ liệu cho khối nếu chưa tồn tại
      if (!result[date].createdKhois[khoiName]) {
        result[date].createdKhois[khoiName] = {
          shifts: {},
        };
      }

      // Khởi tạo dữ liệu cho ca nếu chưa tồn tại
      if (!result[date].createdKhois[khoiName].shifts[shiftName]) {
        result[date].createdKhois[khoiName].shifts[shiftName] = {
          totalTongC: 0,
          totalTong: checklistC.Tong,
          userCompletionRates: [],
        };
      }

      // Cộng dồn TongC và Tong cho ca
      result[date].createdKhois[khoiName].shifts[shiftName].totalTongC +=
        checklistC.TongC;

      // Lưu tỷ lệ hoàn thành của từng người
      const userCompletionRate = (checklistC.TongC / checklistC.Tong) * 100;
      result[date].createdKhois[khoiName].shifts[
        shiftName
      ].userCompletionRates.push(userCompletionRate);
    });

    // Tính toán phần trăm hoàn thành riêng cho từng ca và tổng khối
    Object.values(result).forEach((day) => {
      Object.values(day.createdKhois).forEach((khoi) => {
        let totalKhoiCompletionRatio = 0;
        let totalShifts = 0;

        Object.values(khoi.shifts).forEach((shift) => {
          // Tính phần trăm hoàn thành cho ca dựa trên tỷ lệ của từng người
          let shiftCompletionRatio = shift.userCompletionRates.reduce(
            (sum, rate) => sum + rate,
            0
          );
          if (shiftCompletionRatio > 100) {
            shiftCompletionRatio = 100;
          }

          // Tính tổng tỷ lệ hoàn thành của các ca
          totalKhoiCompletionRatio += shiftCompletionRatio;
          totalShifts += 1;
        });

        // Tính phần trăm hoàn thành trung bình cho khối
        const avgKhoiCompletionRatio = totalKhoiCompletionRatio / totalShifts;

        khoi.completionRatio = Number.isInteger(avgKhoiCompletionRatio)
          ? avgKhoiCompletionRatio
          : avgKhoiCompletionRatio.toFixed(2);
      });
    });

    // Chuyển result object thành mảng
    const resultArray = Object.values(result);

    res.status(200).json({
      message: "Trạng thái checklist trong vòng 7 ngày qua",
      data: resultArray,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "Lỗi! Vui lòng thử lại sau." });
  }
};

exports.getLocationsChecklist = async (req, res) => {
  try {
    // Lấy ngày hôm qua
    const yesterday = moment().subtract(1, "days").format("YYYY-MM-DD");
    const now = moment().format("YYYY-MM-DD");

    // Lấy tất cả dữ liệu checklistC cho ngày hôm qua
    const dataChecklistCs = await Tb_checklistc.findAll({
      attributes: [
        "ID_ChecklistC",
        "ID_Duan",
        "ID_Calv",
        "Ngay",
        "TongC",
        "Tong",
        "ID_KhoiCV",
        "isDelete",
      ],
      where: {
        Ngay: {
          [Op.between]: [yesterday, now],
        },
        isDelete: 0,
      },
      include: [
        {
          model: Ent_duan,
          attributes: ["Duan"],
        },
        {
          model: Ent_khoicv, // Thêm bảng Ent_khoicv để lấy tên khối
          attributes: ["KhoiCV"],
        },
        {
          model: Ent_calv,
          attributes: ["Tenca"], // Lấy tên ca
        },
      ],
    });

    // Tạo một dictionary để nhóm dữ liệu theo dự án và khối
    const result = {};

    dataChecklistCs.forEach((checklistC) => {
      const projectId = checklistC.ID_Duan;
      const projectName = checklistC.ent_duan.Duan;
      const khoiName = checklistC.ent_khoicv.KhoiCV;
      const shiftName = checklistC.ent_calv.Tenca;

      // Khởi tạo dữ liệu dự án nếu chưa tồn tại
      if (!result[projectId]) {
        result[projectId] = {
          projectId,
          projectName,
          createdKhois: {},
        };
      }

      // Khởi tạo dữ liệu cho khối nếu chưa tồn tại
      if (!result[projectId].createdKhois[khoiName]) {
        result[projectId].createdKhois[khoiName] = {
          shifts: {},
        };
      }

      // Khởi tạo dữ liệu cho ca nếu chưa tồn tại
      if (!result[projectId].createdKhois[khoiName].shifts[shiftName]) {
        result[projectId].createdKhois[khoiName].shifts[shiftName] = {
          totalTongC: 0,
          totalTong: checklistC.Tong,
          userCompletionRates: [], // Lưu danh sách tỷ lệ hoàn thành của từng người
        };
      }

      // Cộng dồn TongC và Tong cho ca
      result[projectId].createdKhois[khoiName].shifts[shiftName].totalTongC +=
        checklistC.TongC;

      // Lưu tỷ lệ hoàn thành của từng người
      const userCompletionRate = (checklistC.TongC / checklistC.Tong) * 100;
      result[projectId].createdKhois[khoiName].shifts[
        shiftName
      ].userCompletionRates.push(userCompletionRate);
    });

    // Tính toán phần trăm hoàn thành riêng cho từng ca và tổng khối
    Object.values(result).forEach((project) => {
      Object.values(project.createdKhois).forEach((khoi) => {
        let totalKhoiCompletionRatio = 0;
        let totalShifts = 0;

        Object.values(khoi.shifts).forEach((shift) => {
          // Tính phần trăm hoàn thành cho ca dựa trên tỷ lệ của từng người trong ca
          let shiftCompletionRatio = shift.userCompletionRates.reduce(
            (sum, rate) => sum + rate,
            0
          );
          if (shiftCompletionRatio > 100) {
            shiftCompletionRatio = 100; // Giới hạn phần trăm hoàn thành tối đa là 100% cho từng ca
          }

          // Tính tổng tỷ lệ hoàn thành của các ca
          totalKhoiCompletionRatio += shiftCompletionRatio;
          totalShifts += 1; // Tăng số lượng ca
        });

        // Tính phần trăm hoàn thành trung bình cho khối
        const avgKhoiCompletionRatio = totalKhoiCompletionRatio / totalShifts;

        khoi.completionRatio = Number.isInteger(avgKhoiCompletionRatio)
          ? avgKhoiCompletionRatio // No decimal places, return as is
          : avgKhoiCompletionRatio.toFixed(2); // Otherwise, apply toFixed(2)
      });
    });

    // Chuyển result object thành mảng
    const resultArray = Object.values(result);

    res.status(200).json({
      message:
        "Trạng thái checklist của các dự án theo từng khối và ca làm việc",
      data: resultArray,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "Lỗi! Vui lòng thử lại sau." });
  }
};

exports.checklistKhoiCVPercent = async (req, res) => {
  try {
    const userData = req.user.data;

    if (!userData) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ." });
    }

    let whereClause = {
      isDelete: 0,
      ID_Duan: userData.ID_Duan,
    };
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "Lỗi! Vui lòng thử lại sau." });
  }
};

exports.fileChecklistSuCo = async (req, res) => {
  try {
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "Lỗi! Vui lòng thử lại sau." });
  }
};

async function processData(data) {
  const aggregatedData = {};

  data.forEach((item) => {
    const { label, totalAmount, value } = item;

    if (!aggregatedData[label]) {
      aggregatedData[label] = {
        totalAmount: 0,
        totalValue: 0,
        count: 0,
      };
    }

    aggregatedData[label].totalAmount += totalAmount;
    if (value !== null) {
      aggregatedData[label].totalValue += parseFloat(value);
      aggregatedData[label].count++;
    }
  });

  const finalData = [];

  for (const label in aggregatedData) {
    const { totalAmount, totalValue, count } = aggregatedData[label];
    finalData.push({
      label,
      totalAmount,
      value: count > 0 ? (totalValue / count).toFixed(4) : null,
    });
  }

  return finalData;
}

function formatDate(dateStr) {
  const date = new Date(dateStr); // Convert the string to a Date object
  if (isNaN(date)) {
    return "Invalid Date"; // Handle any invalid date input
  }

  date.setUTCDate(date.getUTCDate() + 1); // Adjusting date if needed
  date.setUTCHours(0, 0, 0, 0); // Set hour, minute, second, and millisecond to zero

  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0"); // Months are zero-based
  const year = date.getUTCFullYear();

  return `${year}-${month}-${day} 00:00:00`;
}

function formatDateShow(dateStr) {
  const date = new Date(dateStr); // Convert the string to a Date object
  if (isNaN(date)) {
    return "Invalid Date"; // Handle any invalid date input
  }

  date.setUTCDate(date.getUTCDate() + 1); // Adjusting date if needed

  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0"); // Months are zero-based
  const year = date.getUTCFullYear();

  return `${year}-${month}-${day}`;
}

function formatDateEnd(dateStr) {
  const date = new Date(dateStr); // Convert the string to a Date object
  if (isNaN(date)) {
    return "Invalid Date"; // Handle any invalid date input
  }

  date.setUTCDate(date.getUTCDate()); // Adjusting date if needed

  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0"); // Months are zero-based
  const year = date.getUTCFullYear();

  return `${year}-${month}-${day}`;
}

cron.schedule("0 */2 * * *", async function () {
  console.log("---------------------");
  console.log("Running Cron Job");

  const currentDate = new Date();
  const currentDateString = currentDate.toISOString().split("T")[0];
  const currentDateTime = moment(currentDate).format("HH:mm:ss");

  // Tính toán ngày hôm qua
  const yesterdayDateTime = new Date(currentDate);
  yesterdayDateTime.setDate(currentDate.getDate() - 1);
  const yesterdayDateString = yesterdayDateTime.toISOString().split("T")[0];

  try {
    // Tìm các bản ghi của ngày hôm qua
    const yesterdayResults = await Tb_checklistc.findAll({
      attributes: [
        "ID_ChecklistC",
        "ID_Duan",
        "ID_KhoiCV",
        "ID_Calv",
        "ID_User",
        "Ngay",
        "Tong",
        "TongC",
        "Giobd","Gioghinhan",
        "Giokt",
        "Tinhtrang",
        "isDelete",
      ],
      where: {
        isDelete: 0,
        Tinhtrang: 0,
        Ngay: yesterdayDateString,
      },
    });

    // Cập nhật tất cả bản ghi của ngày hôm qua với Tinhtrang: 1
    const yesterdayUpdates = yesterdayResults.map((record) => {
      return Tb_checklistc.update(
        { Tinhtrang: 1, Giokt: currentDateTime },
        { where: { ID_ChecklistC: record.ID_ChecklistC } }
      );
    });

    await Promise.all(yesterdayUpdates);
    console.log("Updated all records for yesterday");

    // Tìm các bản ghi của ngày hôm nay
    const todayResults = await Tb_checklistc.findAll({
      attributes: [
        "ID_ChecklistC",
        "ID_Duan",
        "ID_KhoiCV",
        "ID_Calv",
        "ID_User",
        "Ngay",
        "Tong",
        "TongC",
        "Giobd","Gioghinhan",
        "Giokt",
        "Tinhtrang",
        "isDelete",
      ],
      include: [
        {
          model: Ent_calv,
          attributes: ["Giobatdau", "Gioketthuc"],
        },
      ],
      where: {
        isDelete: 0,
        Tinhtrang: 0,
        Ngay: currentDateString,
      },
    });

    const formattedTime = currentDate.toLocaleTimeString("en-GB", {
      hour12: false,
    });

    const updates = todayResults.map((record) => {
      const { Gioketthuc, Giobatdau } = record.ent_calv;

      if (Giobatdau < Gioketthuc && currentDateTime >= Gioketthuc) {
        return Tb_checklistc.update(
          { Tinhtrang: 1, Giokt: formattedTime },
          { where: { ID_ChecklistC: record.ID_ChecklistC } }
        );
      }

      if (
        Giobatdau >= Gioketthuc &&
        currentDateTime < Giobatdau &&
        currentDateTime >= Gioketthuc
      ) {
        return Tb_checklistc.update(
          { Tinhtrang: 1, Giokt: formattedTime },
          { where: { ID_ChecklistC: record.ID_ChecklistC } }
        );
      }
    });

    await Promise.all(updates);
    console.log("Updated records for today based on ca conditions");

    console.log("============================");
  } catch (error) {
    console.error("Error running cron job:", error);
  }
});
