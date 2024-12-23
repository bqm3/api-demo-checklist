
const multer = require("multer");
const upload = multer();

module.exports = (app) => {
    const image_controller = require("../controllers/get_image.controller.js");
    var router = require("express").Router();
  
    router.post("/upload", [upload.single('file')], image_controller.uploadFile)
   
  
    app.use("/api/v2/image", router);
  };
  