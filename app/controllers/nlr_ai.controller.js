const {
  Tb_checklistchitiet,
  Tb_checklistc,
  Ent_khoicv,
  Ent_checklist,
  Ent_duan,
  Ent_calv,
  Tb_checklistchitietdone,
  Ent_user,
  Ent_nhom,
  Ent_hangmuc,
  Ent_khuvuc,
  Ent_toanha,
  Ent_tang,
  Ent_chinhanh,
  Ent_phanloaida,
  Ent_thietlapca,
} = require("../models/setup.model");
const cron = require("node-cron");
const { Op, Sequelize, fn, col, literal, where } = require("sequelize");
const sequelize = require("../config/db.config");
const OpenAI = require("openai");
const nlp = require("compromise");
const path = require("path");
const { default: axios } = require("axios");
const moment = require("moment");
const nrl_ai = require("../models/nlr_ai.model");
const Ent_tile = require("../models/ent_tile.model");
require("dotenv").config();

const danhSachDuLieu = async (req, res) => {
  const t = await sequelize.transaction(); // Khởi tạo transaction
  try {
    // 1. Xác định khoảng thời gian cần lấy dữ liệu (từ ngày hôm qua đến 6h sáng hôm nay)
    const currentDate = new Date();
    const startDate = new Date(currentDate.setDate(currentDate.getDate() - 1)); // Ngày hôm qua
    startDate.setHours(0, 0, 0, 0); // Cài đặt giờ của ngày hôm qua là 00:00:00
    const endDate = new Date(); // Thời gian hiện tại (có thể điều chỉnh theo giờ hiện tại)
    endDate.setHours(6, 0, 0, 0); // Cài đặt giờ là 6h sáng hôm nay

    // 2. Lấy dữ liệu checklist cũ trước khi chèn dữ liệu mới
    const checkDuplicates = async (
      Tenca,
      Ngay,
      KhoiCV,
      Giamsat,
      Thoigianmoca
    ) => {
      return await nrl_ai.findOne({
        where: {
          Tenca,
          Ngay,
          Tenkhoi: KhoiCV,
          Giamsat,
          Thoigianmoca,
        },
        transaction: t, // Đảm bảo tìm kiếm trong transaction
      });
    };

    const pageSize = 100;
    let currentPage = 0;
    let hasMoreData = true;
    let allFlattenedResults = [];

    while (hasMoreData) {
      // Fetch data for Tb_checklistc with plain transformation
      const dataChecklistC = await Tb_checklistc.findAll({
        limit: pageSize,
        offset: currentPage * pageSize,
        attributes: [
          "Ngay",
          "ID_KhoiCV",
          "ID_ThietLapCa",
          "ID_Duan",
          "Tinhtrang",
          "Giobd","Gioghinhan",
          "Giokt",
          "ID_User",
          "ID_Calv",
          "Tong",
          "TongC",
          "Tinhtrang",
          "isDelete",
        ],
        include: [
          { model: Ent_duan, attributes: ["Duan"] },
          { model: Ent_thietlapca, attributes: ["Ngaythu"] },
          { model: Ent_khoicv, attributes: ["KhoiCV", "Ngaybatdau", "Chuky"] },
          { model: Ent_calv, attributes: ["Tenca", "Giobatdau", "Gioketthuc"] },
          {
            model: Ent_user,
            attributes: ["UserName", "Email", "Hoten"],
          },
          {
            model: Tb_checklistchitietdone,
            as: "tb_checklistchitietdones",
            attributes: [
              "Description",
              "ID_ChecklistC",
              "Gioht",
              "Vido",
              "Kinhdo",
              "isDelete",
            ],
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
          },
        ],
        where: {
          isDelete: 0,
          Ngay: {
            [Op.between]: [startDate, endDate],
          },
          Tinhtrang: 1,
        },
        transaction: t, // Đảm bảo truy vấn này sử dụng transaction
      });

      if (!dataChecklistC.length) {
        hasMoreData = false;
        break;
      }

      const resultWithDetails = dataChecklistC.map((result) => {
        const timeToSeconds = (time) => {
          const [hours, minutes, seconds] = time.split(":").map(Number);
          return hours * 3600 + minutes * 60 + seconds;
        };

        const allGioht = [
          ...result.tb_checklistchitietdones.map((entry) => entry.Gioht),
          ...result.tb_checklistchitiets.map((entry) => entry.Gioht),
        ].filter((gioht) => gioht);

        const allGiohtInSeconds = allGioht.map(timeToSeconds);

        const sortedTimes = allGiohtInSeconds.slice().sort((a, b) => a - b);
        let minGioht = sortedTimes.length ? sortedTimes[0] : null;
        let maxGioht = sortedTimes.length
          ? sortedTimes[sortedTimes.length - 1]
          : null;

        // Chuyển đổi giờ bắt đầu (Giobd) sang giây để so sánh
        const giobdInSeconds = timeToSeconds(result.Giobd);

        // Nếu Giobd > 22:00:00 (79200 giây) và maxGioht < 04:00:00 (14400 giây)
        if (giobdInSeconds > 79200 && maxGioht !== null && maxGioht < 14400) {
          maxGioht += 24 * 3600; // Cộng thêm 24 giờ (86400 giây) vào maxGioht
        }

        const totalDiff =
          sortedTimes.length > 1
            ? sortedTimes.reduce((acc, curr, index, arr) => {
                if (index === 0) return acc;
                const prev = arr[index - 1];
                return (
                  acc + (curr < prev ? curr + 24 * 3600 - prev : curr - prev)
                );
              }, 0)
            : 0;

        const avgTimeDiff =
          totalDiff && sortedTimes.length > 1
            ? totalDiff / (sortedTimes.length - 1)
            : null;

        const countWithGhichu = result.tb_checklistchitiets.filter(
          (entry) => entry.Ghichu
        ).length;
        const countWithAnh = result.tb_checklistchitiets.filter(
          (entry) => entry.Anh
        ).length;

        return {
          Tenduan: result.ent_duan.Duan,
          Giamsat: result.ent_user.Hoten,
          Tenkhoi: result.ent_khoicv.KhoiCV,
          Tenca: result.ent_calv.Tenca,
          Ngay: result.Ngay,
          Tilehoanthanh: (result.TongC / result.Tong) * 100 || 0, // Tỷ lệ hoàn thành
          TongC: result.TongC,
          Tong: result.Tong,
          Thoigianmoca: result.Giobd,
          Thoigianchecklistbatdau: minGioht
            ? new Date(minGioht * 1000).toISOString().substr(11, 8)
            : null,
          Thoigianchecklistkethuc: maxGioht
            ? new Date(maxGioht * 1000).toISOString().substr(11, 8)
            : null,
          Thoigiantrungbinh: avgTimeDiff || 0,
          Thoigianchecklistngannhat: minGioht || 0,
          Thoigianchecklistlaunhau: maxGioht || 0,
          Soluongghichu: countWithGhichu,
          Soluonghinhanh: countWithAnh,
          isDelete: 0,
        };
      });

      // Trước khi thêm mới, kiểm tra và xóa dữ liệu cũ nếu trùng lặp
      for (const item of resultWithDetails) {
        const existingRecord = await checkDuplicates(
          item.Tenca,
          item.Ngay,
          item.Tenkhoi,
          item.Giamsat,
          item.Thoigianmoca
        );
        if (existingRecord) {
          // Xóa dữ liệu cũ nếu có
          await nrl_ai.destroy({
            where: {
              Tenca: item.Tenca,
              Ngay: item.Ngay,
              Tenkhoi: item.Tenkhoi,
              Giamsat: item.Giamsat,
              Thoigianmoca: item.Thoigianmoca,
            },
            transaction: t, // Đảm bảo xóa trong transaction
          });
        }
      }

      // Thêm kết quả vào mảng chứa tất cả kết quả
      allFlattenedResults = allFlattenedResults.concat(resultWithDetails);

      currentPage++;
    }

    // Sau khi hoàn tất việc nhập dữ liệu, thực hiện bulkCreate
    await nrl_ai.bulkCreate(allFlattenedResults, {
      ignoreDuplicates: true, // Nếu có dữ liệu trùng lặp, bỏ qua
      transaction: t, // Đảm bảo chèn vào cùng transaction
    });

   
    // Gửi phản hồi thành công
    // res.status(200).json({
    //   message: "Danh sách checklist đã được chèn và xử lý thành công.",
    // });

     // Commit transaction sau khi thành công
     await t.commit();


  } catch (error) {
    // Nếu có lỗi, rollback transaction
    await t.rollback();
    console.error('Transaction failed:', error);
    throw error;
    // res.status(500).json({ error: error.message });
  }
};

const getProjectsChecklistStatus = async (req, res) => {
  try {
    // Kiểm tra xem các ngày đã được cung cấp hay chưa, nếu không thì sử dụng ngày hôm qua
    const yesterday = moment().subtract(1, "days").format("YYYY-MM-DD");

    // Lấy dữ liệu checklistC trong phạm vi ngày lọc
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
        ID_Duan: {
          [Op.ne]: 1,
        },
      },
      include: [
        {
          model: Ent_duan,
          attributes: ["Duan"],
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
          userCompletionRates: [], // Lưu danh sách tỷ lệ hoàn thành của từng người
        };
      }

      // Cộng dồn TongC và Tong cho ca
      result[projectId].createdKhois[khoiName].shifts[shiftName].totalTongC +=
        checklistC.TongC;
      result[projectId].createdKhois[khoiName].shifts[shiftName].totalTong =
        checklistC.Tong;

      // Lưu tỷ lệ hoàn thành của từng người
      let userCompletionRate = 0; // Mặc định là 0 nếu không có giá trị hợp lệ
      if (
        checklistC.Tong !== 0 &&
        checklistC.Tong != null &&
        checklistC.TongC != null
      ) {
        userCompletionRate = (checklistC.TongC / checklistC.Tong) * 100;
      }
      // Đảm bảo tỷ lệ hoàn thành không vượt quá 100%
      userCompletionRate = userCompletionRate > 100 ? 100 : userCompletionRate;

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
            (sum, rate) => sum + (rate || 0),
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

    // Chuyển đổi dữ liệu theo dạng của bảng ent_tile
    const transformedRows = resultArray.map((project) => ({
      Tenduan: project.projectName,
      Khoibaove: project.createdKhois["Khối bảo vệ"]?.completionRatio || null,
      Khoilamsach:
        project.createdKhois["Khối làm sạch"]?.completionRatio || null,
      Khoidichvu: project.createdKhois["Khối dịch vụ"]?.completionRatio || null,
      Khoikythuat:
        project.createdKhois["Khối kỹ thuật"]?.completionRatio || null,
      KhoiFB: project.createdKhois["Khối F&B"]?.completionRatio || null,
      Ngay: yesterday, // Sử dụng ngày lọc làm Ngày
    }));

    // Insert dữ liệu vào bảng ent_tile
    await Ent_tile.bulkCreate(transformedRows);
  } catch (err) {
    console.error('Transaction failed:', err);
    throw err;
  }
};

exports.chatMessage = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "No message provided" });
    }

    const response = await axios.post('https://pmc.ai.pmcweb.vn/api/v1/process', {
      // const response = await axios.post('http://localhost:5000/api/v1/process', {
      question: message
  });

  // Trả kết quả từ Flask API cho client
  res.json(response.data);
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};


cron.schedule("0 4 * * *", async () => {
  try {
    console.log("Cron job started at 5 AM...");
    await danhSachDuLieu();
    console.log("Cron job finished successfully");
  } catch (error) {
    console.error("Error executing cron job:", error);
  }
});

cron.schedule("0 4 * * *", async () => {
  try {
    console.log("Cron job started at 6 AM...");
    await getProjectsChecklistStatus();
    console.log("Cron job finished successfully");
  } catch (error) {
    console.error("Error executing cron job:", error);
  }
});