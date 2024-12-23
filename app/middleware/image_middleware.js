var multer = require("multer");
const path = require("path");


module.exports.image = {
  storage: function () {
    var storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/anh1'));
      },
      filename: function (req, file, cb) {
        cb(null,file.fieldname+`-pmc-${Date.now()}`+file.originalname);
      },
    });
    return storage;
  },
  allowedImage: function (req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
      req.fileValidationError = "Only image files are allowed!";
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
};
