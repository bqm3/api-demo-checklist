const multer = require("multer");
const { uploadChecklist, resizeImage } = require("../middleware/upload_image.js");
// const upload = multer();

module.exports = (app) => {
  const tb_checklistchitiet = require("../controllers/tb_checklistchitiet.controller.js");
  const { isAuthenticated } = require("../middleware/auth_middleware.js");
  const uploader = require("../config/cloudinary.config.js");

  var router = require("express").Router();


  router.post(
    "/create",
    [isAuthenticated, uploadChecklist.any("images"),resizeImage],
    tb_checklistchitiet.createCheckListChiTiet
  );

  router.post(
    "/filters",
    [isAuthenticated],
    tb_checklistchitiet.searchChecklist
  );
  router.get(
    "/:id",
    [isAuthenticated],
    tb_checklistchitiet.getDetail
  );

  router.get(
    "/",
    [isAuthenticated],
    tb_checklistchitiet.getCheckList
  );

  // router.post(
  //   '/upload-images',
  //   [isAuthenticated, uploadChecklist],
  //   tb_checklistchitiet.uploadImages
  // )
  

  router.post(
    "/excel-checklist",
    [isAuthenticated],
    tb_checklistchitiet.getWriteExcel
  );
  
  app.use("/api/v2/tb_checklistchitiet", router);
};
