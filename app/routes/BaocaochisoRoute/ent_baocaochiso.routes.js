const multer = require("multer");
const upload = multer();

module.exports = (app) => {
  const { uploadBaoCaoChiSo, resizeImage } = require("../../middleware/upload_image.js");
  const ent_baocaochiso = require("../../controllers/BaocaochisoController/ent_baocaochiso.controller.js");
  const { isAuthenticated, isAdmin,isRoleGD } = require("../../middleware/auth_middleware.js");

  var router = require("express").Router();

  router.post("/create", [isAuthenticated, uploadBaoCaoChiSo.any("images"),resizeImage], ent_baocaochiso.create)
  
  router.get("/", [isAuthenticated], ent_baocaochiso.getbyDuAn)

  router.put("/:id", [isAuthenticated, uploadBaoCaoChiSo.any("images"),resizeImage], ent_baocaochiso.update)
  router.put("/delete/:id", [isAuthenticated, isRoleGD], ent_baocaochiso.delete)

  app.use("/api/v2/ent_baocaochiso", router);
};
