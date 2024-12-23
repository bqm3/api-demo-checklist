module.exports = (app) => {
  const ent_duan_loai_chiso = require("../../controllers/BaocaochisoController/ent_duan_loai_chiso.controller.js");
  const { isAuthenticated } = require('../../middleware/auth_middleware.js'); // Nếu cần xác thực người dùng

  var router = require("express").Router();


  router.post("/create", isAuthenticated, ent_duan_loai_chiso.createDuanLoaiCS);
  router.put("/update/", isAuthenticated, ent_duan_loai_chiso.updateDuanLoaiCS);
  router.put("/delete/", isAuthenticated, ent_duan_loai_chiso.deleteDuanLoaiCS);

  app.use("/api/v2/duan-loaics", router);
};
