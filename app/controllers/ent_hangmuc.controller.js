const {
  Ent_hangmuc,
  Ent_toanha,
  Ent_khoicv,
  Ent_khuvuc_khoicv,
} = require("../models/setup.model");
const { Ent_khuvuc } = require("../models/setup.model");
const { Op, Sequelize } = require("sequelize");
const sequelize = require("../config/db.config");
const xlsx = require("xlsx");
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

// Create and Save a new Ent_tang
exports.create = async (req, res, next) => {
  // Validate request
  try {
    if (!req.body.Hangmuc || !req.body.MaQrCode) {
      res.status(400).json({
        message: "Cần nhập đầy đủ thông tin!",
      });
      return;
    }
    const MaQrCode = req.body.MaQrCode;

    const userData = req.user.data;
    if (userData) {
      const existingHangMuc = await Ent_hangmuc.findOne({
        where: {
          MaQrCode: MaQrCode,
          isDelete: 0,
        },
        attributes: ["ID_Hangmuc", "MaQrCode", "isDelete"],
      });

      // Kiểm tra QR code trong Ent_khuvuc
      const existingKhuVuc = await Ent_khuvuc.findOne({
        attributes: ["ID_Khuvuc", "MaQrCode", "isDelete"],
        where: {
          MaQrCode: MaQrCode,
          isDelete: 0,
        },
      });

      if (existingHangMuc || existingKhuVuc) {
        // QR code đã tồn tại trong một trong hai bảng
        return res.status(500).json({
          message: "QR code trùng lặp, không thể thêm mới.",
        });
      } else {
        // QR code không trùng lặp, cho phép thêm mới
        const data = {
          ID_Khuvuc: req.body.ID_Khuvuc,
          MaQrCode: req.body.MaQrCode,
          Hangmuc: req.body.Hangmuc,
          FileTieuChuan: req.body.FileTieuChuan,
          Important: req.body.Important,
          Tieuchuankt: req.body.Tieuchuankt || null,
          isDelete: 0,
        };

        Ent_hangmuc.create(data)
          .then((data) => {
            res.status(200).json({
              message: "Tạo hạng mục thành công!",
              data: data,
            });
          })
          .catch((err) => {
            res.status(500).json({
              message: err.message || "Lỗi! Vui lòng thử lại sau.",
            });
          });
      }
    } else {
      return res.status(500).json({
        message: "Bạn không có quyền tạo hạng mục.",
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
    const orConditions = [];
    if (userData) {
      orConditions.push({
        "$ent_khuvuc.ent_toanha.ID_Duan$": userData?.ID_Duan,
      });

      if (userData?.ent_chucvu.Role == 5 && userData?.arr_Duan !== null) {
        const arrDuanArray = userData?.arr_Duan.split(",").map(Number);

        // Kiểm tra ID_Duan có thuộc mảng không
        const exists = arrDuanArray.includes(userData?.ID_Duan);
        if (!exists) {
          orConditions.push({
            "$ent_khuvuc.ent_khuvuc_khoicvs.ID_KhoiCV$": userData.ID_KhoiCV,
          });
        }
      }

      await Ent_hangmuc.findAll({
        attributes: [
          "ID_Hangmuc",
          "ID_Khuvuc",
          "MaQrCode",
          "Hangmuc",
          "Tieuchuankt",
          "Important",
          "FileTieuChuan",
          "isDelete",
        ],
        include: [
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
        ],
        where: {
          isDelete: 0,
          [Op.and]: [orConditions],
        },
        order: [["ID_Khuvuc", "ASC"]],
      })
        .then((data) => {
          res.status(200).json({
            message: "Danh sách hạng mục!!!",
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
    const orConditions = [];
    if (userData) {
      orConditions.push({
        "$ent_khuvuc.ent_toanha.ID_Duan$": userData?.ID_Duan,
      });
      if (userData.ID_KhoiCV !== null) {
        orConditions.push({
          $ID_KhoiCV$: userData.ID_KhoiCV,
        });
      }
      await Ent_hangmuc.findByPk(req.params.id, {
        attributes: [
          "ID_Hangmuc",
          "ID_Khuvuc",
          "MaQrCode",
          "Hangmuc",
          "Tieuchuankt",
          "Important",
          "isDelete",
          "FileTieuChuan",
        ],
        include: [
          {
            model: Ent_khuvuc,
            attributes: [
              "ID_Toanha",
              "ID_Khuvuc",
              "Sothutu",
              "MaQrCode",
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
        ],
        where: {
          isDelete: 0,
          [Op.and]: [orConditions],
        },
      })
        .then((data) => {
          res.status(200).json({
            message: "Hạng mục cần tìm!",
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
      const reqData = {
        ID_Khuvuc: req.body.ID_Khuvuc,
        MaQrCode: req.body.MaQrCode,
        Hangmuc: req.body.Hangmuc,
        Tieuchuankt: req.body.Tieuchuankt,
        FileTieuChuan: req.body.FileTieuChuan,
        Important: req.body.Important,
        isDelete: 0,
      };

      // Kiểm tra xem mã QR Code mới có trùng với bất kỳ bản ghi nào khác trong cơ sở dữ liệu không
      const existingHangMuc = await Ent_hangmuc.findOne({
        where: {
          MaQrCode: req.body.MaQrCode,
          ID_Hangmuc: { [Op.ne]: req.params.id },
          isDelete: 0,
        },
        attributes: ["MaQrCode", "ID_Hangmuc", "isDelete"],
      });

      const existingKhuVuc = await Ent_khuvuc.findOne({
        attributes: ["ID_Khuvuc", "MaQrCode", "isDelete"],
        where: {
          MaQrCode: req.body.MaQrCode,
          isDelete: 0,
        },
      });

      if (existingHangMuc && existingKhuVuc) {
        res.status(400).json({
          message: "Mã QR Code đã tồn tại!",
        });
        return;
      }

      Ent_hangmuc.update(reqData, {
        where: {
          ID_Hangmuc: req.params.id,
        },
      })
        .then((data) => {
          res.status(200).json({
            message: "Cập nhật hạng mục thành công!",
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
      Ent_hangmuc.update(
        { isDelete: 1 },
        {
          where: {
            ID_Hangmuc: req.params.id,
          },
        }
      )
        .then((data) => {
          res.status(200).json({
            message: "Xóa hạng mục thành công!",
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
    const idsToDelete = deleteRows.map((row) => row.ID_Hangmuc);
    if (userData) {
      Ent_hangmuc.update(
        { isDelete: 1 },
        {
          where: {
            ID_Hangmuc: idsToDelete,
          },
        }
      )
        .then((data) => {
          res.status(200).json({
            message: "Xóa hạng mục thành công!",
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

exports.filterByKhuvuc = async (req, res) => {
  try {
    const userData = req.user.data;
    const ID_Khuvuc = req.params.id;

    if (userData) {
      // Xây dựng điều kiện where dựa trên các giá trị đã kiểm tra
      const whereCondition = {
        [Op.and]: [],
      };

      if (userData.ID_Chucvu === 1 || userData.UserName === "PSH") {
        // Nếu userData.ID_Chucvu == 1, không cần thêm điều kiện where, lấy tất cả khu vực
      } else {
        // Nếu userData.ID_Chucvu !== 1, thêm điều kiện where theo ID_KhoiCV và ID_Duan
        if (userData.ID_Duan !== null) {
          whereCondition["$ent_khuvuc.ent_toanha.ID_Duan$"] = userData.ID_Duan;
        }
        // if (userData.ID_KhoiCV !== null) {
        //   whereCondition["$ID_KhoiCV$"] = userData.ID_KhoiCV;
        // }
        if (
          ID_Khuvuc !== null &&
          ID_Khuvuc !== undefined &&
          ID_Khuvuc !== "" &&
          ID_Khuvuc !== "null"
        ) {
          whereCondition[Op.and].push({
            ID_Khuvuc: ID_Khuvuc,
          });
        }
      }
      // Thêm điều kiện isDelete
      whereCondition.isDelete = 0;
      Ent_hangmuc.findAll({
        attributes: [
          "ID_Hangmuc",
          "MaQrCode",
          "Hangmuc",
          "Tieuchuankt",
          "Important",
          "isDelete",
          "FileTieuChuan",
        ],
        include: [
          {
            model: Ent_khuvuc,
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
            include: [
              {
                model: Ent_toanha,
                attributes: ["Toanha", "Sotang", "ID_Toanha"],
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
        ],
        where: whereCondition,
        order: [["ID_Khuvuc", "ASC"]],
      })
        .then((data) => {
          res.status(200).json({
            message: "Thông tin hạng mục!",
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

exports.getHangmucTotal = async (req, res) => {
  try {
    const userData = req.user.data;
    if (!userData || !userData.ID_Duan) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ." });
    }

    let whereCondition = {
      isDelete: 0,
      "$ent_khuvuc.ent_toanha.ID_Duan$": userData?.ID_Duan,
    };

    const hangmucData = await Ent_hangmuc.findAll({
      attributes: [
        "ID_Hangmuc",
        "ID_Khuvuc",
        "MaQrCode",
        "Hangmuc",
        "Tieuchuankt",
        "Important",
        "isDelete",
        "FileTieuChuan",
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

          include: [
            {
              model: Ent_toanha,
              attributes: [
                "ID_Toanha",
                "ID_Duan",
                "Toanha",
                "Sotang",
                "isDelete",
              ],
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
          where: {
            isDelete: 0,
          },
        },
      ],
      where: whereCondition,
    });

    if (!hangmucData || hangmucData.length === 0) {
      return res.status(200).json({
        message: "Không có hạng mục!",
        data: [],
      });
    }

    const khoiCVData = [
      { ID_KhoiCV: 1, KhoiCV: "Khối làm sạch" },
      { ID_KhoiCV: 2, KhoiCV: "Khối kỹ thuật" },
      { ID_KhoiCV: 3, KhoiCV: "Khối bảo vệ" },
      { ID_KhoiCV: 4, KhoiCV: "Khối dịch vụ" },
      { ID_KhoiCV: 5, KhoiCV: "Khối F&B" },
    ];

    const khoiCVMap = {};
    khoiCVData.forEach((item) => {
      khoiCVMap[item.ID_KhoiCV] = item.KhoiCV;
    });

    const hangmucCounts = {};
    hangmucData.forEach((item) => {
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
        if (!hangmucCounts[khoiCV]) {
          hangmucCounts[khoiCV] = 0;
        }
        hangmucCounts[khoiCV]++;
      });
    });

    // Convert counts to desired format
    const result = Object.keys(hangmucCounts).map((khoiCV) => ({
      label: khoiCV,
      value: hangmucCounts[khoiCV],
    }));

    return res.status(200).json({
      message: "Danh sách hạng mục!",
      length: result.length,
      data: result,
    });
  } catch (err) {
    console.error("Error in getHangmucTotal:", err);
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
      let i = 2;
      for (const item of data) {
        //check tầng data import excel
        checkDataExcel(item, i, 2);

        const transformedItem = removeSpacesFromKeys(item);
        const tenKhuvuc = formatVietnameseText(transformedItem["TÊNKHUVỰC"]);
        const tenKhoiCongViec = transformedItem["TÊNKHỐICÔNGVIỆC"];
        const tenToanha = formatVietnameseText(transformedItem["TÊNTÒANHÀ"]);
        const tenTang = formatVietnameseText(transformedItem["TÊNTẦNG"]);
        const tenHangmuc = formatVietnameseText(transformedItem["TÊNHẠNGMỤC"]);
        const quanTrong = formatVietnameseText(transformedItem["QUANTRỌNG"]);

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

        let khuVuc = await Ent_khuvuc.findOne({
          attributes: [
            "ID_Khuvuc",
            "MaQrCode",
            "Tenkhuvuc",
            "ID_KhoiCVs",
            "isDelete",
          ],
          where: {
            Tenkhuvuc: tenKhuvuc,
            MaQrCode: generateQRCodeKV(
              tenToanha,
              tenKhuvuc,
              tenTang,
              userData.ID_Duan
            ),
            [Op.and]: Sequelize.literal(
              `JSON_CONTAINS(ID_KhoiCVs, '${JSON.stringify(validKhoiCVs)}')`
            ),
            isDelete: 0,
          },
          transaction,
        });

        // Generate a QR code for hạng mục
        const maQrCode = generateQRCode(
          tenToanha,
          tenKhuvuc,
          tenHangmuc,
          tenTang
        );

        // Check if hạng mục already exists for this khu vực
        const existingHangMuc = await Ent_hangmuc.findOne({
          attributes: [
            "ID_Hangmuc",
            "Hangmuc",
            "MaQrCode",
            "ID_Khuvuc",
            "isDelete",
          ],
          where: {
            [Op.and]: [
              { Hangmuc: tenHangmuc },
              { MaQrCode: maQrCode },
              { ID_Khuvuc: khuVuc?.ID_Khuvuc },
              { isDelete: 0 },
            ],
          },
          transaction,
        });

        if (!existingHangMuc) {
          // Create new hạng mục entry
          await Ent_hangmuc.create(
            {
              ID_Khuvuc: khuVuc.ID_Khuvuc,
              MaQrCode: maQrCode,
              Hangmuc: tenHangmuc,
              Important: quanTrong ? 1 : 0,
              isDelete: 0,
            },
            { transaction }
          );
        } else {
          console.log(
            `Hạng mục "${tenHangmuc}" đã tồn tại trong khu vực ${tenKhuvuc}, bỏ qua việc tạo mới.`
          );
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

const generateAndSaveQrCodes = async (maQrCodeArray, hangMucArray) => {
  // Create the directory if it doesn't exist
  if (!fs.existsSync(qrFolder)) {
    fs.mkdirSync(qrFolder, { recursive: true });
  }

  return Promise.all(
    maQrCodeArray.map(async (maQrCode, index) => {
      const sanitizedCode = maQrCode.replace(/[/\\?%*:|"<>]/g, "-"); // Replace characters not allowed in file names
      const hangMuc = hangMucArray[index] || "No Item"; // Default to "No Item" if no hangMuc is provided
      const caption = `${hangMuc} - ${maQrCode}`;

      const url = `https://quickchart.io/qr?text=${encodeURIComponent(
        maQrCode
      )}&caption=${encodeURIComponent(caption)}&size=350x350&captionFontSize=8`;
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
  const { maQrCodes, hangMucs } = req.body;

  if (!maQrCodes) {
    return res.status(400).json({ error: "maQrCodes parameter is required" });
  }

  // Convert maQrCodes from a string to an array
  const maQrCodeArray = maQrCodes.map((code) => code.trim());
  const hangMucArray = hangMucs.map((code) => code.trim());

  try {
    await generateAndSaveQrCodes(maQrCodeArray, hangMucArray);

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
