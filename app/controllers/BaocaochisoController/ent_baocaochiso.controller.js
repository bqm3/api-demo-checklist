const moment = require("moment-timezone");
const {
  uploadFile,
  deleteFileFromGoogleDrive,
} = require("../../middleware/auth_google_child");
const {
  Ent_Baocaochiso,
  Ent_user,
  Ent_duan,
  Ent_Hangmuc_Chiso,
  Ent_Loai_Chiso,
} = require("../../models/setup.model");
const { Op, fn, col } = require("sequelize");
var path = require("path");
const sequelize = require("../../config/db.config");
const {
  getPreviousMonth,
  convertDateFormat,
  formatNumber,
} = require("../../utils/util");

exports.create = async (req, res) => {
  const uploadedFileIds = [];
  const transaction = await sequelize.transaction();
  try {
    const userData = req.user.data;
    const ID_User = userData.ID_User;
    const ID_Duan = userData.ID_Duan;

    const records = req.body;
    const images = req.files;

    const ensureArray = (data) => {
      if (!Array.isArray(data)) {
        return [data];
      }
      return data;
    };

    records.ID_Hangmuc_Chiso = ensureArray(records.ID_Hangmuc_Chiso);
    records.Day = ensureArray(records.Day);
    records.Month = ensureArray(records.Month);
    records.Year = ensureArray(records.Year);
    records.Chiso = ensureArray(records.Chiso);
    // records.Image = ensureArray(records.Image);
    records.Chiso_Read_Img = ensureArray(records.Chiso_Read_Img);
    records.Ghichu = ensureArray(records?.Ghichu);

    // Kiểm tra xem báo cáo đã tồn tại chưa
    // const findBaoCao = await Ent_Baocaochiso.findOne({
    //   where: {
    //     Month,
    //     Year,
    //     isDelete: 0,
    //   },
    // });

    // if (findBaoCao) {
    //   await transaction.rollback();
    //   return res
    //     .status(400)
    //     .json({ message: `Báo cáo đã tồn tại cho tháng ${Month}/${Year}` });
    // }

    const isEmpty = (obj) => Object.keys(obj).length === 0;

    const uploadedFiles = req.files.map((file) => {
      // Lấy thư mục và tên tệp từ đường dẫn
      const projectFolder = path.basename(path.dirname(file.path)); // Tên dự án (thư mục cha của tệp)
      const filename = path.basename(file.filename); // Tên tệp gốc

      return {
        fieldname: file.fieldname, // Lấy fieldname từ tệp tải lên
        fileId: { id: `${projectFolder}/${filename}` }, // Đường dẫn thư mục dự án và tên ảnh
        filePath: file.path, // Đường dẫn vật lý của tệp
      };
    });

    // Mảng uploadedFileIds chứa tất cả các đối tượng tệp
    const uploadedFileIds = [];
    uploadedFiles.forEach((file) => {
      uploadedFileIds.push(file); // Đẩy đối tượng tệp vào mảng
    });

    for (let i = 0; i < records.ID_Hangmuc_Chiso.length; i++) {
      const ID_Hangmuc_Chiso = records.ID_Hangmuc_Chiso[i];
      const Day = records.Day[i];
      const Month = records.Month[i];
      const Year = records.Year[i];
      const Chiso = records.Chiso[i];
      const Chiso_Read_Img = records.Chiso_Read_Img[i];
      const Ghichu = records.Ghichu[i];

      let anhs = [];
      if (!isEmpty(images) && uploadedFileIds.length > 0) {
        let imageIndex = "";
        let matchingImage = null;

        imageIndex = `Image_${i}`;
        matchingImage = uploadedFileIds.find(
          (file) => file.fieldname == imageIndex
        );
        if (matchingImage) {
          anhs.push(matchingImage.fileId.id);
        } else {
          console.log(`No matching image found for Anh: ${imageIndex}`);
        }
      }

      const Anh = anhs.length > 0 ? anhs.join(",") : null;

      // Lấy dữ liệu tháng trước
      const dateCheck = getPreviousMonth(Month, Year);
      const findCheck = await Ent_Baocaochiso.findOne({
        attributes: ["Chiso", "ID_Hangmuc_Chiso", "Month", "Year", "isDelete"],
        where: {
          ID_Hangmuc_Chiso,
          Month: dateCheck.month,
          Year: dateCheck.year,
          isDelete: 0,
        },
      });
      // Chuẩn bị dữ liệu để lưu
      const data = {
        ID_User: ID_User || null,
        ID_Duan: ID_Duan || null,
        ID_Hangmuc_Chiso: ID_Hangmuc_Chiso || null,
        Day: convertDateFormat(Day, true),
        Month: Month || null,
        Year: Year || null,
        Chiso: formatNumber(Chiso) || null,
        Image: Anh,
        Chiso_Before: findCheck?.Chiso || null,
        Chiso_Read_Img: Chiso_Read_Img || null,
        Ghichu: Ghichu || "",
        isDelete: 0,
      };
      // Lưu dữ liệu
      await Ent_Baocaochiso.create(data, { transaction });
    }

    // Commit transaction
    await transaction.commit();
    res.status(200).json({ message: "Gửi thành công!" });
  } catch (error) {
    // Rollback transaction và xóa file đã tải lên
    await transaction.rollback();

    // Xóa file đã tải lên nếu có lỗi
    if (uploadedFileIds.length > 0) {
      for (const { id } of uploadedFileIds) {
        await deleteFile(id);
      }
    }

    res.status(500).json({ message: "Lỗi! Vui lòng thử lại sau." });
  }
};

exports.getbyDuAn = async (req, res) => {
  try {
    const userData = req.user.data;
    let whereCondition = {
      isDelete: 0,
      ID_Duan: userData?.ID_Duan,
    };

    if (userData) {
      // Lấy dữ liệu từ cơ sở dữ liệu
      const data = await Ent_Baocaochiso.findAll({
        attributes: [
          "ID_Baocaochiso",
          "ID_User",
          "ID_Duan",
          "ID_Hangmuc_Chiso",
          "Day",
          "Month",
          "Year",
          "Chiso",
          "Image",
          "Chiso_Before",
          "Chiso_Read_Img",
          "Ghichu",
          "isDelete",
        ],
        include: [
          {
            model: Ent_user,
            as: "ent_user",
            attributes: ["UserName", "Email", "Hoten"],
          },
          {
            model: Ent_duan,
            as: "ent_duan",
            attributes: ["Duan"],
          },
          {
            model: Ent_Hangmuc_Chiso,
            as: "ent_hangmuc_chiso",
            where: { isDelete: 0 },
            include: [
              {
                model: Ent_Loai_Chiso,
                as: "ent_loai_chiso",
              },
            ],
          },
        ],
        where: whereCondition,
        order: [
          ["Year", "DESC"],
          ["Month", "DESC"],
          ["Day", "DESC"],
        ],
      });

      // Nhóm dữ liệu theo tháng và năm
      const groupedData = data.reduce((result, item) => {
        const yearMonth = `Tháng ${item.Month} - Năm ${item.Year}`;
        if (!result[yearMonth]) {
          result[yearMonth] = [];
        }
        result[yearMonth].push(item);
        return result;
      }, {});

      // Chuyển đổi nhóm dữ liệu thành mảng để trả về
      const groupedArray = Object.keys(groupedData).map((key) => ({
        monthYear: key,
        data: groupedData[key],
      }));

      // Trả về kết quả nhóm theo tháng và năm
      res.status(200).json({
        message: "Danh sách!",
        data: groupedArray,
      });
    }
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};

exports.update = async (req, res) => {
  const transaction = await sequelize.transaction(); // Bắt đầu transaction
  const uploadedFileIds = [];
  try {
    const userData = req.user.data;
    const { body, files } = req;
    const {
      ID_Duan,
      ID_User,
      Day,
      Month,
      Year,
      Ghichu,
      Electrical_CDT,
      Water_CDT,
      ImageElectrical_CDT,
      ImageWater_CDT,
      ElectricalBefore_CDT,
      WaterBefore_CDT,
      Electrical_CuDan,
      Water_CuDan,
      ImageElectrical_CuDan,
      ImageWater_CuDan,
      ElectricalBefore_CuDan,
      WaterBefore_CuDan,
      Electrical_CDT_Real,
      Water_CDT_Real,
      Electrical_CuDan_Real,
      Water_CuDan_Real,
    } = body;

    if (Electrical_CDT && Water_CDT) {
      if (!formatNumber(Water_CDT) || !formatNumber(Electrical_CDT)) {
        return res.status(400).json({
          message:
            "Chỉ số điện và Nước phải là số hợp lệ (có thể chứa dấu . hoặc ,).",
        });
      }
    }

    // Kiểm tra báo cáo đã tồn tại cho tháng này
    const findBaoCao = await Ent_Baocaochiso.findOne({
      attributes: [
        "ID_Baocaochiso",
        "ID_Duan",
        "ID_User",
        "Month",
        "Year",
        "isDelete",
      ],
      where: {
        ID_Baocaochiso: {
          [Op.ne]: req.params.id, // Không lấy báo cáo này (update)
        },
        ID_Duan: ID_Duan,
        Month: Month,
        Year: Year,
        isDelete: 0,
      },
      transaction,
    });

    if (findBaoCao) {
      return res
        .status(400)
        .json({ message: "Báo cáo đã tồn tại cho tháng này" });
    }

    // Kiểm tra báo cáo của tháng trước
    const dateCheck = getPreviousMonth(Month, Year);
    const findCheck = await Ent_Baocaochiso.findOne({
      attributes: [
        "ID_Baocaochiso",
        "ID_Duan",
        "ID_User",
        "Month",
        "Year",
        "isDelete",
        "Electrical_CDT",
        "Water_CDT",
        "Electrical_CuDan",
        "Water_CuDan",
      ],
      where: {
        ID_Duan: ID_Duan,
        Month: dateCheck.month,
        Year: dateCheck.year,
        isDelete: 0,
      },
      transaction,
    });

    // Kiểm tra file upload mới
    const isEmpty = (obj) => Object.keys(obj).length === 0;

    // Nếu có ảnh được upload, tải lên Google Drive
    if (!isEmpty(files)) {
      for (const image of files) {
        const imageType =
          image.fieldname === "ImageElectrical_CDT"
            ? "ImageElectrical_CDT"
            : image.fieldname === "ImageElectrical_CuDan"
            ? "ImageElectrical_CuDan"
            : image.fieldname === "ImageWater_CDT"
            ? "ImageWater_CDT"
            : image.fieldname === "ImageWater_CuDan"
            ? "ImageWater_CuDan"
            : null;
        const fileId = await uploadFile(
          image,
          userData.ent_duan?.Duan,
          imageType,
          Month,
          Year
        );
        uploadedFileIds.push({ fileId, fieldname: image.fieldname });
      }
    }

    // Gán ID ảnh đã upload vào các trường tương ứng
    let imageElectricalId_CDT = ImageElectrical_CDT; // Nếu có ảnh cũ, giữ lại
    let imageWaterId_CDT = ImageWater_CDT; // Nếu có ảnh cũ, giữ lại
    let imageElectricalId_CuDan = ImageElectrical_CuDan; // Nếu có ảnh cũ, giữ lại
    let imageWaterId_CuDan = ImageWater_CuDan; // Nếu có ảnh cũ, giữ lại

    uploadedFileIds.forEach((item) => {
      if (item.fieldname === "ImageElectrical_CDT") {
        imageElectricalId_CDT = item.fileId.id; // Cập nhật ảnh điện
      } else if (item.fieldname === "ImageWater_CDT") {
        imageWaterId_CDT = item.fileId.id; // Cập nhật ảnh nước
      } else if (item.fieldname === "ImageElectrical_CuDan") {
        imageElectricalId_CuDan = item.fileId.id; // Cập nhật ảnh điện
      } else if (item.fieldname === "ImageWater_CuDan") {
        imageWaterId_CuDan = item.fileId.id; // Cập nhật ảnh nước
      }
    });

    // Cập nhật dữ liệu cho báo cáo
    const data = {
      ID_Duan: ID_Duan || null,
      Day: Day || null,
      ID_User: ID_User || null,
      Month: Month || null,
      Year: Year || null,

      Electrical_CDT: Electrical_CDT || null,
      Water_CDT: Water_CDT || null,
      ImageElectrical_CDT: imageElectricalId_CDT,
      ImageWater_CDT: imageWaterId_CDT,
      ElectricalBefore_CDT: findCheck?.Electrical_CDT || ElectricalBefore_CDT,
      WaterBefore_CDT: findCheck?.Water_CDT || WaterBefore_CDT,

      Electrical_CuDan: Electrical_CuDan || null,
      Water_CuDan: Water_CuDan || null,
      ImageElectrical_CuDan: imageElectricalId_CuDan,
      ImageWater_CuDan: imageWaterId_CuDan,
      ElectricalBefore_CuDan:
        findCheck?.Electrical_CuDan || ElectricalBefore_CuDan,
      WaterBefore_CuDan: findCheck?.Water_CuDan || WaterBefore_CuDan,

      Electrical_CDT_Real,
      Water_CDT_Real,
      Electrical_CuDan_Real,
      Water_CuDan_Real,
      Ghichu: Ghichu || null,
    };

    // Cập nhật báo cáo trong transaction
    await Ent_Baocaochiso.update(data, {
      where: { ID_Baocaochiso: req.params.id },
      transaction,
    });

    // Commit transaction sau khi tất cả thành công
    await transaction.commit();

    res.status(200).json({ message: "Thay đổi thành công!" });
  } catch (error) {
    // Nếu có lỗi, rollback transaction và xóa ảnh đã tải lên
    await transaction.rollback();
    res
      .status(500)
      .json({ message: error.message || "Lỗi! Vui lòng thử lại sau." });
  }
};

exports.delete = async (req, res) => {
  try {
    const userData = req.user.data;

    Ent_Baocaochiso.update(
      {
        isDelete: 1, // 1: xóa, 0: chưa xóa
      },
      {
        where: {
          ID_Baocaochiso: req.params.id,
        },
      }
    )
      .then(() => {
        res.status(200).json({
          message: "Thay đổi thành công!",
        });
      })
      .catch((err) => {
        res.status(500).json({
          message: err.message || "Lỗi! Vui lòng thử lại sau.",
        });
      });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Lỗi! Vui lòng thử lại sau.",
    });
  }
};
