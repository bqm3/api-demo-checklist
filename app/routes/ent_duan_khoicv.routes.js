module.exports = (app) => {
  const ent_duan_khoicv = require("../controllers/ent_duan_khoicv.controller.js");
  const {
    isAuthenticated,
    isAdmin,
  } = require("../middleware/auth_middleware.js");

  var router = require("express").Router();

  router.post("/create", [isAuthenticated], ent_duan_khoicv.create);

  router.get("/", [isAuthenticated], ent_duan_khoicv.get);

  router.get("/:id", [isAuthenticated], ent_duan_khoicv.getDetail);
  router.put("/update/:id", [isAuthenticated], ent_duan_khoicv.update);
  router.put("/delete/:id", [isAuthenticated], ent_duan_khoicv.delete);

  app.use("/api/v2/ent_duan_khoicv", router);
};
