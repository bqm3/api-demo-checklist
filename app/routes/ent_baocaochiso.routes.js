const multer = require("multer");
const upload = multer();


module.exports = (app) => {
  const { uploadBaoCaoChiSo, resizeImage } = require("../middleware/upload_image.js");
  const ent_loai_chiso = require("../controllers/BaocaochisoController/ent_loai_chiso.controller");
  const ent_baocaochiso = require("../controllers/BaocaochisoController/ent_baocaochiso.controller.js");
  const ent_duan_loai_chiso = require("../controllers/BaocaochisoController/ent_duan_loai_chiso.controller.js");
  const ent_hangmuc_chiso = require("../controllers/BaocaochisoController/ent_hangmuc_chiso.controller");
  const {
    isAuthenticated,
    isAdmin,
    isRoleGD,
  } = require("../middleware/auth_middleware");

  var router = require("express").Router();

  //  Loai chi so
  router.get("/loai-chiso/", [isAuthenticated], ent_loai_chiso.getAllLoai_Chiso);
  router.get("/loai-chiso/byDuan", [isAuthenticated], ent_loai_chiso.getbyDuAn);
  router.post(
    "/loai-chiso/create",
    [isAuthenticated],
    ent_loai_chiso.createLoai_Chiso
  );
  router.put(
    "/loai-chiso/update/:id",
    [isAuthenticated],
    ent_loai_chiso.updateLoai_Chiso
  );
  router.put(
    "/loai-chiso/delete/:id",
    [isAuthenticated],
    ent_loai_chiso.deleteLoai_Chiso
  );

  router.get(
    "/hangmuc-chiso/",
    [isAuthenticated],
    ent_hangmuc_chiso.getAllHangmucChiso
  );
  router.get(
    "/hangmuc-chiso/byDuan",
    [isAuthenticated],
    ent_hangmuc_chiso.getHangmucChisoById
  );

  router.post(
    "/hangmuc-chiso/create",
    [isAuthenticated],
    ent_hangmuc_chiso.createHangmucChiso
  );
  router.put(
    "/hangmuc-chiso/update/:ID_Hangmuc_Chiso",
    [isAuthenticated],
    ent_hangmuc_chiso.updateHangmucChiso
  );
  
  router.get("/hangmuc-chiso/byDuan/:ID_Hangmuc_Chiso", [isAuthenticated], ent_hangmuc_chiso.getDetailHangmucChiso);
  router.put(
    "/hangmuc-chiso/delete/:ID_Hangmuc_Chiso",
    [isAuthenticated],
    ent_hangmuc_chiso.deleteHangmucChiso
  );

  router.post(
    "/duan-loaics/create",
    isAuthenticated,
    ent_duan_loai_chiso.createDuanLoaiCS
  );
  router.put(
    "/duan-loaics/update",
    isAuthenticated,
    ent_duan_loai_chiso.updateDuanLoaiCS
  );
  router.put(
    "/duan-loaics/delete",
    isAuthenticated,
    ent_duan_loai_chiso.deleteDuanLoaiCS
  );

  router.post(
    "/ent_baocaochiso/create",
    [isAuthenticated, uploadBaoCaoChiSo.any("images"),resizeImage],
    ent_baocaochiso.create
  );

  router.get("/ent_baocaochiso/", [isAuthenticated], ent_baocaochiso.getbyDuAn);

  router.put(
    "/ent_baocaochiso/:id",
    [isAuthenticated, uploadBaoCaoChiSo.any("images"),resizeImage],
    ent_baocaochiso.update
  );
  router.put(
    "/ent_baocaochiso/delete/:id",
    [isAuthenticated, isRoleGD],
    ent_baocaochiso.delete
  );

  app.use("/api/v2", router);
};
