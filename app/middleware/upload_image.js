const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");


const storageChecklist = (uploadFolderKey) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const userData = req.user.data;
      const body = req?.body
      let duan;

      if(userData?.ent_duan?.Duan){
        duan = userData?.ent_duan?.Duan
      } else {
        duan = body?.Duan
      }

      const uploadFolderMap = {
        checklist: path.join(__dirname, "..", "public", "checklist"),
        sucongoai: path.join(__dirname, "..", "public", "sucongoai"),
        baocaochiso: path.join(__dirname, "..", "public", "baocaochiso"),
        logo: path.join(__dirname, "..", "public", "logo"),
      };

      const uploadFolder = uploadFolderMap[uploadFolderKey];

      if (!uploadFolder) {
        return cb(new Error("Invalid upload folder key"), null);
      }

      const projectName = duan?.replace(
        /[^a-zA-Z0-9-_]/g,
        "_"
      );
      const projectFolder = path.join(uploadFolder, projectName);

      if (!fs.existsSync(projectFolder)) {
        fs.mkdirSync(projectFolder, { recursive: true });
      }

      cb(null, projectFolder);
    },
    filename: (req, file, cb) => {
      const userData = req?.user?.data;
      let ID_Duan;

      if(userData?.ID_Duan){
        ID_Duan = userData?.ID_Duan
      } else {
        ID_Duan = req?.params?.id
      }

      const filename = `${ID_Duan}_${Date.now()}${path.extname(
        file?.originalname
      )}`;
      cb(null, filename);
    },
  });

const uploadChecklist = multer({
  storage: storageChecklist("checklist"),
});

const uploadSuCongNgoai = multer({
  storage: storageChecklist("sucongoai"),
});

const uploadBaoCaoChiSo = multer({
  storage: storageChecklist("baocaochiso"),
});

const uploadLogo = multer({
  storage: storageChecklist("logo"),
});

// Hàm xử lý resize ảnh
const resizeImage = (req, res, next) => {
  if (req.files && req.files.length > 0) {
    const resizePromises = req.files.map((file) => {
      const originalPath = file.path;

      return sharp(originalPath)
        .resize(800, 600, { fit: sharp.fit.inside, withoutEnlargement: true }) // Resize ảnh
        .jpeg({ quality: 80 }) // Giảm chất lượng ảnh
        .toBuffer() // Trả về buffer thay vì tạo tệp tạm
        .then((data) => {
          fs.writeFileSync(originalPath, data); // Ghi đè dữ liệu đã resize vào tệp gốc
        })
        .catch((err) => {
          console.error("Error resizing image:", err);
          throw err;
        });
    });

    Promise.all(resizePromises)
      .then(() => next()) // Tiếp tục xử lý
      .catch((err) => {
        console.error("Error resizing images:", err);
        res.status(500).send("Error resizing images.");
      });
  } else {
    next(); // Không có ảnh, tiếp tục
  }
};


module.exports = {
  uploadChecklist,
  uploadSuCongNgoai,
  uploadBaoCaoChiSo,
  resizeImage,
  uploadLogo
};
