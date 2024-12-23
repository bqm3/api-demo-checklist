const multer = require("multer");
const upload = multer();

module.exports = (app) => {
  const ent_khuvuc = require("../controllers/ent_khuvuc.controller.js");
  const { isAuthenticated, isAdmin } = require("../middleware/auth_middleware.js");

  var router = require("express").Router();

  router.post("/create", [isAuthenticated], ent_khuvuc.create);
  router.get("/", [isAuthenticated], ent_khuvuc.get);
  router.post("/filter",[isAuthenticated], ent_khuvuc.getKhuVucFilter);
  router.get("/total", [isAuthenticated], ent_khuvuc.getKhuvucTotal)
  router.get("/:id", [isAuthenticated], ent_khuvuc.getDetail);
  router.put("/delete/:id",[isAuthenticated], ent_khuvuc.delete);
  router.put("/update/:id",[isAuthenticated], ent_khuvuc.update);
  router.put("/delete-mul", [isAuthenticated], ent_khuvuc.deleteMul)
  router.post("/generate-qr-codes", ent_khuvuc.downloadQrCodes)
  // router.post("/filter_qr", [isAuthenticated], ent_khuvuc.filterByQr)

  router.post("/uploads", [isAuthenticated, upload.single('files')], ent_khuvuc.uploadFiles)
  router.put("/fix-uploads", [isAuthenticated, upload.single('files')], ent_khuvuc.updateQrCodes)

  app.use("/api/v2/ent_khuvuc", router);
};
