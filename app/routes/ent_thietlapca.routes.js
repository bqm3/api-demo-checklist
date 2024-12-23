module.exports = (app) => {
  const ent_thietlapca = require("../controllers/ent_thietlapca.controller.js");
  const { isAuthenticated } = require("../middleware/auth_middleware.js");

  var router = require("express").Router();

  router.post("/create", [isAuthenticated], ent_thietlapca.create);
  router.get("/", [isAuthenticated], ent_thietlapca.get);
  router.get("/:id", [isAuthenticated], ent_thietlapca.getDetail);
  router.put("/update/:id", [isAuthenticated], ent_thietlapca.update);
  router.put("/delete/:id", [isAuthenticated], ent_thietlapca.delete);
  
  app.use("/api/v2/ent_thietlapca", router);
};
