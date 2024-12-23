module.exports = (app) => {
  const ent_hangmuc_chiso = require("../../controllers/BaocaochisoController/ent_hangmuc_chiso.controller");
  const { isAuthenticated } = require("../../middleware/auth_middleware");

  var router = require("express").Router();

  router.get("/", [isAuthenticated], ent_hangmuc_chiso.getAllHangmucChiso);
  
  router.get("/byDuan/:ID_Hangmuc_Chiso", [isAuthenticated], ent_hangmuc_chiso.getDetailHangmucChiso);
  router.get("/byDuan", [isAuthenticated], ent_hangmuc_chiso.getHangmucChisoById);
  
  router.post(
    "/create",
    [isAuthenticated],
    ent_hangmuc_chiso.createHangmucChiso
  );
  router.put(
    "/update/:ID_Hangmuc_Chiso",
    [isAuthenticated],
    ent_hangmuc_chiso.updateHangmucChiso
  );
  router.put(
    "/delete/:ID_Hangmuc_Chiso",
    [isAuthenticated],
    ent_hangmuc_chiso.deleteHangmucChiso
  );

  app.use("/api/v2/hangmuc-chiso", router);
};
