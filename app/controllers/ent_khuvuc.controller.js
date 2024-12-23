const {
  Ent_toanha,
  Ent_khuvuc,
  Ent_khoicv,
  Ent_duan,
  Ent_hangmuc,
  Ent_tang,
  Ent_checklist,
  Ent_khuvuc_khoicv,
} = require("../models/setup.model");
const { Op, Sequelize, fn, col, literal, where } = require("sequelize");
const sequelize = require("../config/db.config");
const xlsx = require("xlsx");
const e = require("express");
const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const axios = require("axios");
const {
  checkDataExcel,
  removeSpacesFromKeys,
  formatVietnameseText,
  removeVietnameseTones,
} = require("../utils/util");

exports.create = async (req, res) => {
  try {
    const { ID_Toanha, Sothutu, Makhuvuc, MaQrCode, Tenkhuvuc, ID_KhoiCVs } =
      req.body;

    if (!ID_Toanha || !Tenkhuvuc) {
      return res.status(400).json({
        message: "Phải nhập đầy đủ dữ liệu!",
      });
    }

    const userData = req.user.data;

    if (userData) {
      const ID_User = userData.ID_User;
      const data = {
        ID_Toanha: ID_Toanha,
        Sothutu: Sothutu,
        Makhuvuc: Makhuvuc,
        MaQrCode: MaQrCode,
        Tenkhuvuc: Tenkhuvuc,
        ID_KhoiCVs: ID_KhoiCVs,
        ID_User: ID_User,
        isDelete: 0,
      };

      if (MaQrCode !== "") {
        const dataRes = await Ent_khuvuc.findOne({
          where: { MaQrCode: MaQrCode },
          attributes: [
            "ID_Khuvuc",
            "ID_Toanha",
            "Sothutu",
            "Makhuvuc",
            "MaQrCode",
            "Tenkhuvuc",
            "ID_User",
            "isDelete",
          ],
        });

        if (dataRes !== null) {
          return res.status(401).json({
            message: "Mã QrCode đã bị trùng",
          });
        }
      }

      // Tạo khu vực mới
      const newKhuvuc = await Ent_khuvuc.create(data);

      if (newKhuvuc && Array.isArray(ID_KhoiCVs) && ID_KhoiCVs.length > 0) {
        const assignments = ID_KhoiCVs.map((ID_KhoiCV) => ({
          ID_Khuvuc: newKhuvuc.ID_Khuvuc, // ID của khu vực mới tạo
          ID_KhoiCV,
        }));

        // Gán khối công việc vào khu vực mới
        await Ent_khuvuc_khoicv.bulkCreate(assignments);
      }

      return res.status(200).json({
        message: "Tạo khu vực và gán khối công việc thành công!",
        data: newKhuvuc,
      });
    }
  } catch (err) {
    console.error(err); // Log lỗi để giúp chẩn đoán vấn đề
    return res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

exports.get = async (req, res) => {
  try {
    const userData = req.user.data;
    const orConditions = [];
    let whereCondition = {
      isDelete: 0,
    };

    if (userData) {
      orConditions.push({ "$ent_toanha.ID_Duan$": userData?.ID_Duan });
      if (userData?.ID_KhoiCV !== null && userData?.ID_KhoiCV !== undefined) {
        whereCondition[Op.or] = [
          { $ID_KhoiCVs$: { [Op.contains]: [userData?.ID_KhoiCV] } },
        ];
      }

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
        ],
        where: [
          whereCondition,
          {
            [Op.and]: [orConditions],
          },
        ],
        order: [["ID_Toanha", "ASC"]],
      })
        .then((data) => {
          res.status(200).json({
            message: "Danh sách khu vực!",
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
    if (req.params.id && userData) {
      const khuvucDetail = await Ent_khuvuc.findByPk(req.params.id, {
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
        ],
        where: {
          isDelete: 0,
        },
      });

      // Check if the data exists
      if (!khuvucDetail) {
        return res.status(404).json({
          message: "Không tìm thấy khu vực!",
        });
      }

      // Extract and combine the ID_KhoiCVs from ent_khuvuc_khoicvs
      const ID_KhoiCVs = khuvucDetail.ent_khuvuc_khoicvs.map(
        (item) => item.ID_KhoiCV
      );

      // Prepare the response data
      const responseData = {
        ID_Khuvuc: khuvucDetail.ID_Khuvuc,
        ID_Toanha: khuvucDetail.ID_Toanha,
        Sothutu: khuvucDetail.Sothutu,
        Makhuvuc: khuvucDetail.Makhuvuc,
        MaQrCode: khuvucDetail.MaQrCode,
        Tenkhuvuc: khuvucDetail.Tenkhuvuc,
        ID_User: khuvucDetail.ID_User,
        isDelete: khuvucDetail.isDelete,
        ID_KhoiCVs: ID_KhoiCVs,
        Toanha: khuvucDetail.ent_toanha ? khuvucDetail.ent_toanha.Toanha : null,
        Sotang: khuvucDetail.ent_toanha ? khuvucDetail.ent_toanha.Sotang : null,
        Khoicvs: khuvucDetail.ent_khuvuc_khoicvs.map((item) => ({
          ID_KhoiCV: item.ID_KhoiCV,
          KhoiCV: item.Ent_khoicv ? item.ent_khoicv.KhoiCV : null,
        })),
      };

      // Return the response
      res.status(200).json({
        message: "Khu vực chi tiết!",
        data: responseData,
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
      const { ID_Toanha, Sothutu, Makhuvuc, MaQrCode, Tenkhuvuc, ID_KhoiCVs } =
        req.body;

      const reqData = {
        ID_Toanha,
        Sothutu,
        Makhuvuc,
        MaQrCode,
        ID_KhoiCVs,
        Tenkhuvuc,
        ID_User: userData.ID_User,
        isDelete: 0,
      };

      // Check if the MaQrCode is not empty and not null
      if (MaQrCode && MaQrCode.trim() !== "") {
        // Check if the MaQrCode is already taken by another record (excluding current record)
        const existingKhuvuc = await Ent_khuvuc.findOne({
          where: {
            [Op.and]: [
              //{ MaQrCode: { [Op.not]: null, [Op.ne]: "" } },
              { ID_Khuvuc: { [Op.ne]: req.params.id } }, // Exclude current record
              { MaQrCode: MaQrCode }, // Check if new QR code matches any existing one
              { isDelete: 0 }, // Ensure the record is not marked as deleted
            ],
          },
        });

        // If a record with the same QR code exists, return error
        if (existingKhuvuc) {
          return res.status(400).json({
            message: "Mã QR Code đã tồn tại!",
          });
        }
      }

      // Update the ent_khuvuc record
      await Ent_khuvuc.update(reqData, {
        where: { ID_Khuvuc: req.params.id },
      });

      // If ID_KhoiCVs is provided, update ent_khuvuc_khoicv records
      if (Array.isArray(ID_KhoiCVs) && ID_KhoiCVs.length > 0) {
        // Delete old assignments for this khu vực
        await Ent_khuvuc_khoicv.destroy({
          where: { ID_Khuvuc: req.params.id },
        });

        // Create new assignments based on the provided ID_KhoiCVs
        const assignments = ID_KhoiCVs.map((ID_KhoiCV) => ({
          ID_Khuvuc: req.params.id,
          ID_KhoiCV,
        }));

        await Ent_khuvuc_khoicv.bulkCreate(assignments);
      }

      // Respond with success message
      res.status(200).json({
        message: "Cập nhật khu vực thành công!",
      });
    } else {
      res.status(400).json({
        message: "Thiếu dữ liệu người dùng hoặc ID khu vực không hợp lệ!",
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
      Ent_khuvuc.update(
        { isDelete: 1, ID_User: userData.ID_User },
        {
          where: {
            ID_Khuvuc: req.params.id,
          },
        }
      )
        .then((data) => {
          res.status(200).json({
            message: "Xóa khu vực thành công!",
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
    const idsToDelete = deleteRows.map((row) => row.ID_Khuvuc);
    if (userData) {
      Ent_khuvuc.update(
        { isDelete: 1, ID_User: userData.ID_User },
        {
          where: {
            ID_Khuvuc: idsToDelete,
          },
        }
      )
        .then((data) => {
          res.status(200).json({
            message: "Xóa khu vực thành công!",
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

exports.getKhuVucFilter = async (req, res) => {
  try {
    const userData = req.user?.data;
    if (userData) {
      // Initialize where condition
      const whereCondition = {
        isDelete: 0, // Always include isDelete condition
      };

      // Tạo danh sách điều kiện
      const andConditions = [];

      if (userData?.ent_chucvu.Role == 5 && userData?.arr_Duan !== null) {
        const arrDuanArray = userData?.arr_Duan.split(",").map(Number);

        // Kiểm tra ID_Duan có thuộc mảng không
        const exists = arrDuanArray.includes(userData?.ID_Duan);
        if (!exists) {
          andConditions.push({
            "$ent_khuvuc_khoicvs.ID_KhoiCV$": userData.ID_KhoiCV,
          });
        }
      }

      // Add ID_Duan condition if it exists
      if (userData.ID_Duan !== null) {
        andConditions.push({ "$ent_toanha.ID_Duan$": userData.ID_Duan });
      }

      // Add ID_KhoiCV condition if it exists
      if (userData.ID_KhoiCV !== null && userData.ID_KhoiCV !== undefined) {
        if (userData.ent_chucvu.Role == 3) {
          andConditions.push({
            "$ent_khuvuc_khoicvs.ID_KhoiCV$": userData.ID_KhoiCV,
          });
        }
      }

      // Add ID_Toanha condition if it exists in request body
      if (req.body?.ID_Toanha !== null && req.body?.ID_Toanha !== undefined) {
        andConditions.push({ ID_Toanha: req.body.ID_Toanha });
      }

      // Nếu có điều kiện AND thì thêm vào whereCondition
      if (andConditions.length > 0) {
        whereCondition[Op.and] = andConditions;
      }

      // Fetch data
      Ent_khuvuc.findAll({
        attributes: [
          "ID_Khuvuc",
          "ID_Toanha",
          "Sothutu",
          "Makhuvuc",
          "ID_KhoiCVs",
          "MaQrCode",
          "Tenkhuvuc",
          "ID_User",
          "isDelete",
        ],
        include: [
          {
            model: Ent_hangmuc,
            as: "ent_hangmuc",
            attributes: [
              "ID_Hangmuc",
              "ID_Khuvuc",
              "Hangmuc",
              "isDelete",
              "Important",
              "Tieuchuankt",
              "FileTieuChuan",
            ],
            where: { isDelete: 0 },
            required: false,
          },
          {
            model: Ent_toanha,
            attributes: ["Toanha", "Sotang", "ID_Toanha"],
          },
          {
            model: Ent_khuvuc_khoicv,
            as: "ent_khuvuc_khoicvs",
            attributes: ["ID_KhoiCV", "ID_Khuvuc", "ID_KV_CV"],
            include: [
              {
                model: Ent_khoicv,
                attributes: ["KhoiCV", "Ngaybatdau", "Chuky"],
              },
            ],
          },
        ],
        where: whereCondition,
        raw: false, // Không sử dụng raw để ánh xạ quan hệ
        // order: [["ID_Toanha", "ASC"]],
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
      res.status(400).json({
        message: "Vui lòng cung cấp ít nhất một trong hai ID.",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: error.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

exports.getKhuvucTotal = async (req, res) => {
  try {
    const userData = req.user.data;
    if (!userData) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ." });
    }

    let whereCondition = {
      isDelete: 0,
    };

    whereCondition["$ent_toanha.ID_Duan$"] = userData?.ID_Duan;

    const khuvucData = await Ent_khuvuc.findAll({
      attributes: [
        "Tenkhuvuc",
        "MaQrCode",
        "Makhuvuc",
        "Sothutu",
        "ID_KhoiCVs",
        "ID_Toanha",
        "ID_Khuvuc",
      ],
      include: [
        {
          model: Ent_toanha,
          attributes: ["Toanha", "Sotang", "ID_Toanha"],
          include: {
            model: Ent_duan,
            attributes: ["ID_Duan", "Duan", "Diachi", "Vido", "Kinhdo", "Logo"],
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
      where: whereCondition,
    });

    if (!khuvucData || khuvucData.length === 0) {
      return res.status(200).json({
        message: "Không còn checklist cho ca làm việc này!",
        data: [],
      });
    }
    const khoiCVData = [
      { ID_Khoi: 1, KhoiCV: "Khối làm sạch" },
      { ID_Khoi: 2, KhoiCV: "Khối kỹ thuật" },
      { ID_Khoi: 3, KhoiCV: "Khối bảo vệ" },
      { ID_Khoi: 4, KhoiCV: "Khối dịch vụ" },
      { ID_Khoi: 5, KhoiCV: "Khối F&B" },
    ];

    // Create a map for quick lookup of KhoiCV by ID_Khoi
    const khoiCVMap = {};
    khoiCVData.forEach((item) => {
      khoiCVMap[item.ID_Khoi] = item.KhoiCV;
    });

    // Group and count by individual ID_KhoiCVs values
    const khuvucCounts = {};
    khuvucData.forEach((item) => {
      let ID_KhoiCVs = item.ID_KhoiCVs;
      // Assuming ID_KhoiCVs is already an array
      if (typeof ID_KhoiCVs === "string") {
        try {
          ID_KhoiCVs = JSON.parse(ID_KhoiCVs);
        } catch (error) {
          return;
        }
      }

      ID_KhoiCVs.forEach((id) => {
        const khoiCV = khoiCVMap[id];
        if (!khuvucCounts[khoiCV]) {
          khuvucCounts[khoiCV] = 0;
        }
        khuvucCounts[khoiCV]++;
      });
    });

    // Convert counts to desired format
    const result = Object.keys(khuvucCounts).map((khoiCV) => ({
      label: khoiCV,
      value: khuvucCounts[khoiCV],
    }));

    return res.status(200).json({
      message: "Danh sách khu vực!",
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

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    await sequelize.transaction(async (transaction) => {
      let i = 2;
      for (const item of data) {
        for (const [key, value] of Object.entries(item)) {
          if (typeof value === "string" && value.trim() === "") {
            throw new Error(`Lỗi ở dòng ${i}, cột "${key}"`);
          }
        }
        checkDataExcel(item, i, 1);

        const transformedItem = removeSpacesFromKeys(item);
        const tenKhoiCongViec =
          transformedItem["TÊNKHỐICÔNGVIỆC"] !== undefined
            ? transformedItem["TÊNKHỐICÔNGVIỆC"]
            : null;
        const tenToanha = formatVietnameseText(transformedItem["TÊNTÒANHÀ"], i);
        const tenKhuvuc = formatVietnameseText(transformedItem["TÊNKHUVỰC"], i);
        const tenTang = formatVietnameseText(transformedItem["TÊNTẦNG"], i);
        const sanitizedTenToanha = tenToanha?.replace(/\t/g, "");

        const toaNha = await Ent_toanha.findOne({
          attributes: ["ID_Toanha", "Sotang", "Toanha", "ID_Duan", "isDelete"],
          where: {
            Toanha: sanitizedTenToanha,
            ID_Duan: userData.ID_Duan,
            isDelete: 0,
          },
          transaction,
        });

        if (!toaNha) {
          throw new Error(
            `Tên tòa nhà trong file excel khác với tòa nhà ở danh mục tòa nhà! Hãy kiểm tra lại dữ liệu tại dòng ${i}`
          );
        }

        if (tenKhoiCongViec == null) {
          throw new Error(`Thiếu khối công việc ở dòng ${i}`);
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

        if (validKhoiCVs.length > 1) {
          // Xử lý nhiều khối công việc
          const existingKhuVuc = await Ent_khuvuc.findOne({
            attributes: [
              "ID_Khuvuc",
              "Tenkhuvuc",
              "MaQrCode",
              "isDelete",
              "ID_Toanha",
              "ID_User",
              "ID_KhoiCVs",
            ],
            where: {
              Tenkhuvuc: tenKhuvuc,
              MaQrCode: generateQRCode(
                tenToanha,
                tenKhuvuc,
                tenTang,
                userData.ID_Duan
              ),
              ID_Toanha: toaNha.ID_Toanha,
              isDelete: 0,
            },
            transaction,
          });

          let khuVucId;
          if (!existingKhuVuc) {
            const newKhuVuc = await Ent_khuvuc.create(
              {
                ID_Toanha: toaNha.ID_Toanha,
                Sothutu: 1,
                Makhuvuc: "",
                MaQrCode: generateQRCode(
                  tenToanha,
                  tenKhuvuc,
                  tenTang,
                  userData.ID_Duan
                ),
                Tenkhuvuc: tenKhuvuc,
                ID_User: userData.ID_User,
                ID_KhoiCVs: validKhoiCVs,
                isDelete: 0,
              },
              { transaction }
            );
            khuVucId = newKhuVuc.ID_Khuvuc;
          } else {
            khuVucId = existingKhuVuc.ID_Khuvuc;
            const currentKhoiCVs = existingKhuVuc.ID_KhoiCVs || [];
            const updatedKhoiCVs = Array.from(
              new Set([...currentKhoiCVs, ...validKhoiCVs])
            );
            await existingKhuVuc.update(
              { ID_KhoiCVs: updatedKhoiCVs },
              { transaction }
            );
            console.log(
              `Khu vực "${tenKhuvuc}" đã tồn tại, Cập nhật khối công việc.`
            );
          }

          for (const idKhoiCV of validKhoiCVs) {
            await Ent_khuvuc_khoicv.findOrCreate({
              where: {
                ID_Khuvuc: khuVucId,
                ID_KhoiCV: idKhoiCV,
                isDelete: 0,
              },
              transaction,
            });
          }
        } else if (validKhoiCVs.length == 1) {
          // Xử lý chỉ một khối công việc
          const khuVucExists = await Ent_khuvuc.findOne({
            attributes: ["ID_Khuvuc", "ID_KhoiCVs", "Tenkhuvuc", "MaQrCode"],
            where: {
              Tenkhuvuc: tenKhuvuc,
              MaQrCode: generateQRCode(
                tenToanha,
                tenKhuvuc,
                tenTang,
                userData.ID_Duan
              ),
              ID_Toanha: toaNha.ID_Toanha,
              isDelete: 0,
              ID_KhoiCVs: {
                [Op.like]: validKhoiCVs, // This finds a match if the `ID_KhoiCVs` JSON array contains the `id`
              },
            },
            transaction,
          });

          if (!khuVucExists) {
            // Tạo mới khu vực với một ID_KhoiCV duy nhất
            const newKhuVuc = await Ent_khuvuc.create(
              {
                ID_Toanha: toaNha.ID_Toanha,
                Sothutu: 1,
                Makhuvuc: "",
                MaQrCode: generateQRCode(
                  tenToanha,
                  tenKhuvuc,
                  tenTang,
                  userData.ID_Duan
                ),
                Tenkhuvuc: tenKhuvuc,
                ID_User: userData.ID_User,
                ID_KhoiCVs: validKhoiCVs,
                isDelete: 0,
              },
              { transaction }
            );

            await Ent_khuvuc_khoicv.create(
              {
                ID_Khuvuc: newKhuVuc.ID_Khuvuc,
                ID_KhoiCV: validKhoiCVs[0],
                isDelete: 0,
              },
              { transaction }
            );
          } else {
            console.log(
              `Khu vực "${tenKhuvuc}" với khối công việc duy nhất đã tồn tại, không cập nhật.`
            );
          }
        }
        i++;
      }
    });

    res.send({
      message: "File uploaded and data processed successfully",
      data,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

exports.updateQrCodes = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }
    const userData = req.user.data;

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    await sequelize.transaction(async (transaction) => {
      let i = 2;
      for (const item of data) {
        for (const [key, value] of Object.entries(item)) {
          if (typeof value === "string" && value.trim() === "") {
            throw new Error(`Lỗi ở dòng ${i}, cột "${key}"`);
          }
        }
        checkDataExcel(item, i, 1);

        const transformedItem = removeSpacesFromKeys(item);
        const tenKhoiCongViec =
          transformedItem["TÊNKHỐICÔNGVIỆC"] !== undefined
            ? transformedItem["TÊNKHỐICÔNGVIỆC"]
            : null;
        const tenToanha = formatVietnameseText(transformedItem["TÊNTÒANHÀ"], i);
        const tenKhuvuc = formatVietnameseText(transformedItem["TÊNKHUVỰC"], i);
        const tenTang = formatVietnameseText(transformedItem["TÊNTẦNG"], i);
        const sanitizedTenToanha = tenToanha?.replace(/\t/g, "");

        const toaNha = await Ent_toanha.findOne({
          attributes: ["ID_Toanha", "Sotang", "Toanha", "ID_Duan", "isDelete"],
          where: {
            Toanha: sanitizedTenToanha,
            ID_Duan: userData.ID_Duan,
            isDelete: 0,
          },
          transaction,
        });

        if (!toaNha) {
          throw new Error(
            `Tên tòa nhà trong file excel khác với tòa nhà ở danh mục tòa nhà! Hãy kiểm tra lại dữ liệu tại dòng ${i}`
          );
        }

        if (tenKhoiCongViec == null) {
          throw new Error(`Thiếu khối công việc ở dòng ${i}`);
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

        if (validKhoiCVs.length > 1) {
          // Xử lý nhiều khối công việc
          const existingKhuVuc = await Ent_khuvuc.findOne({
            attributes: [
              "ID_Khuvuc",
              "Tenkhuvuc",
              "MaQrCode",
              "isDelete",
              "ID_Toanha",
              "ID_User",
              "ID_KhoiCVs",
            ],
            where: {
              Tenkhuvuc: tenKhuvuc,
              MaQrCode: generateQRCode(
                tenToanha,
                tenKhuvuc,
                tenTang,
                userData.ID_Duan
              ),
              ID_Toanha: toaNha.ID_Toanha,
              isDelete: 0,
            },
            transaction,
          });

          let khuVucId;
          if (!existingKhuVuc) {
            const newKhuVuc = await Ent_khuvuc.create(
              {
                ID_Toanha: toaNha.ID_Toanha,
                Sothutu: 1,
                Makhuvuc: "",
                MaQrCode: generateQRCode(
                  tenToanha,
                  tenKhuvuc,
                  tenTang,
                  userData.ID_Duan
                ),
                Tenkhuvuc: tenKhuvuc,
                ID_User: userData.ID_User,
                ID_KhoiCVs: validKhoiCVs,
                isDelete: 0,
              },
              { transaction }
            );
            khuVucId = newKhuVuc.ID_Khuvuc;
          } else {
            khuVucId = existingKhuVuc.ID_Khuvuc;
            const currentKhoiCVs = existingKhuVuc.ID_KhoiCVs || [];
            const updatedKhoiCVs = Array.from(
              new Set([...currentKhoiCVs, ...validKhoiCVs])
            );
            await existingKhuVuc.update(
              { ID_KhoiCVs: updatedKhoiCVs },
              { transaction }
            );
            console.log(
              `Khu vực "${tenKhuvuc}" đã tồn tại, Cập nhật khối công việc.`
            );
          }

          for (const idKhoiCV of validKhoiCVs) {
            await Ent_khuvuc_khoicv.findOrCreate({
              where: {
                ID_Khuvuc: khuVucId,
                ID_KhoiCV: idKhoiCV,
                isDelete: 0,
              },
              transaction,
            });
          }
        } else if (validKhoiCVs.length == 1) {
          // Xử lý chỉ một khối công việc
          const khuVucExists = await Ent_khuvuc.findOne({
            attributes: ["ID_Khuvuc", "ID_KhoiCVs", "Tenkhuvuc", "MaQrCode"],
            where: {
              Tenkhuvuc: tenKhuvuc,
              MaQrCode: generateQRCode(
                tenToanha,
                tenKhuvuc,
                tenTang,
                userData.ID_Duan
              ),
              ID_Toanha: toaNha.ID_Toanha,
              isDelete: 0,
              ID_KhoiCVs: {
                [Op.like]: validKhoiCVs, // This finds a match if the `ID_KhoiCVs` JSON array contains the `id`
              },
            },
            transaction,
          });

          if (!khuVucExists) {
            // Tạo mới khu vực với một ID_KhoiCV duy nhất
            const newKhuVuc = await Ent_khuvuc.create(
              {
                ID_Toanha: toaNha.ID_Toanha,
                Sothutu: 1,
                Makhuvuc: "",
                MaQrCode: generateQRCode(
                  tenToanha,
                  tenKhuvuc,
                  tenTang,
                  userData.ID_Duan
                ),
                Tenkhuvuc: tenKhuvuc,
                ID_User: userData.ID_User,
                ID_KhoiCVs: validKhoiCVs,
                isDelete: 0,
              },
              { transaction }
            );

            await Ent_khuvuc_khoicv.create(
              {
                ID_Khuvuc: newKhuVuc.ID_Khuvuc,
                ID_KhoiCV: validKhoiCVs[0],
                isDelete: 0,
              },
              { transaction }
            );
          } else {
            console.log(
              `Khu vực "${tenKhuvuc}" với khối công việc duy nhất đã tồn tại, không cập nhật.`
            );
          }
        }
        i++;
      }
    });

    res.send({
      message: "File uploaded and data processed successfully",
      data,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

const qrFolder = path.join(__dirname, "generated_qr_codes");

const generateAndSaveQrCodes = async (maQrCodeArray, khuVucArray) => {
  // Create the directory if it doesn't exist
  if (!fs.existsSync(qrFolder)) {
    fs.mkdirSync(qrFolder, { recursive: true });
  }
  return Promise.all(
    maQrCodeArray.map(async (maQrCode, index) => {
      const sanitizedCode = maQrCode.replace(/[/\\?%*:|"<>]/g, "-"); // Replace characters not allowed in file names
      const khuVuc = khuVucArray[index] || "No Item"; // Default to "No Item" if no hangMuc is provided
      const caption = `${khuVuc} - ${maQrCode}`;

      const url = `https://quickchart.io/qr?text=${encodeURIComponent(
        maQrCode
      )}&caption=${caption}&size=350x350&captionFontSize=8`;
      const imagePath = path.join(qrFolder, `qr_code_${sanitizedCode}.png`);

      try {
        const response = await axios({
          method: "GET",
          url,
          responseType: "stream",
        });

        await new Promise((resolve, reject) => {
          const writeStream = fs.createWriteStream(imagePath);
          response.data.pipe(writeStream);
          writeStream.on("finish", resolve);
          writeStream.on("error", reject);
        });

        return imagePath;
      } catch (error) {
        console.error(`Failed to generate QR code for ${maQrCode}:`, error);
        return { maQrCode, error: "Failed to generate QR code" };
      }
    })
  );
};

exports.downloadQrCodes = async (req, res) => {
  const { maQrCodes, khuVucs } = req.body;

  if (!maQrCodes) {
    return res.status(400).json({ error: "maQrCodes parameter is required" });
  }

  // Convert maQrCodes from a string to an array
  const maQrCodeArray = maQrCodes.map((code) => code.trim());
  const khuVucArray = khuVucs.map((code) => code.trim());

  try {
    await generateAndSaveQrCodes(maQrCodeArray, khuVucArray);

    // Create a zip file
    const zipPath = path.join(__dirname, "qr_codes.zip");
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    output.on("close", () => {
      res.download(zipPath, "qr_codes.zip", (err) => {
        if (err) {
          console.error("Error downloading the zip file:", err);
        } else {
          // Optionally, clean up the generated files
          fs.rmSync(qrFolder, { recursive: true, force: true });
          fs.unlinkSync(zipPath);
        }
      });
    });

    archive.on("error", (err) => {
      console.error("Error while archiving:", err);
      res.status(500).json({ error: "Failed to archive QR codes" });
    });

    archive.pipe(output);
    archive.directory(qrFolder, false);
    await archive.finalize();
  } catch (error) {
    console.error("Failed to generate QR codes:", error);
    res.status(500).json({ error: "Failed to generate QR codes" });
  }
};

function generateQRCode(tenToa, khuVuc, tenTang, ID) {
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
