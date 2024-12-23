const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,

  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
  params: {
    folder: "pmcchecklist",
    allowedFormats: ["jpg", "png", "jpeg"],
  },
});

const uploadCloud = multer({ storage });

module.exports = uploadCloud;
