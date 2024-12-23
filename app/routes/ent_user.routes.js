const multer = require("multer");
const upload = multer();

module.exports = (app) => {
  const ent_user = require("../controllers/ent_user.controller.js");
  const {
    isAuthenticated,
    isAdmin,
  } = require("../middleware/auth_middleware.js");

  var router = require("express").Router();

  router.post("/login", ent_user.login);
  router.get("/get-online", [isAuthenticated], ent_user.getUserOnline);
  router.get(
    "/get-role",
    [isAuthenticated, isAdmin],
    ent_user.getUserRoleOnline
  );
  router.get("/gs", [isAuthenticated], ent_user.getGiamSat);
  router.get("/getPhone", [isAuthenticated], ent_user.getPhone);
  router.get("/:id", [isAuthenticated], ent_user.getDetail);
  router.post("/check-auth", [isAuthenticated], ent_user.checkAuth);
  router.put("/duan/update/:id", [isAuthenticated], ent_user.updateDuanByRole);
  router.put("/duan/clear", [isAuthenticated], ent_user.clearDuanByRole);
  router.post("/device-token", [isAuthenticated], ent_user.deviceToken);
  router.post("/register", [isAuthenticated], ent_user.register);
  router.post("/change-password", [isAuthenticated], ent_user.changePassword);
  router.put("/delete/:id", [isAuthenticated], ent_user.deleteUser);
  router.put("/update/:id", [isAuthenticated], ent_user.updateUser);
  router.put("/error", [isAuthenticated], ent_user.fixUserError);
  router.post("/noti", [isAuthenticated], ent_user.notiPush);

  router.post(
    "/uploads",
    [isAuthenticated, upload.single("files")],
    ent_user.uploadFileUsers
  );

  app.use("/api/v2/ent_user", router);
};
