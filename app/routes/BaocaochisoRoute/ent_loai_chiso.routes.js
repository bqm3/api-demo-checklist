module.exports = (app) => {
  const ent_loai_chiso = require("../../controllers/BaocaochisoController/ent_loai_chiso.controller");
  const {isAuthenticated}= require('../../middleware/auth_middleware');

  var router = require("express").Router();

  // Create a new Ent_calv
  router.get("/",[isAuthenticated], ent_loai_chiso.getAllLoai_Chiso)
  router.get("/byDuan",[isAuthenticated], ent_loai_chiso.getbyDuAn)
  router.post("/create",[isAuthenticated], ent_loai_chiso.createLoai_Chiso);
  router.put("/update/:id",[isAuthenticated], ent_loai_chiso.updateLoai_Chiso);
  router.put("/delete/:id",[isAuthenticated], ent_loai_chiso.deleteLoai_Chiso);



  app.use("/api/v2/loai-chiso", router);
};