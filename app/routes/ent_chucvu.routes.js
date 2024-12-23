
module.exports = (app) => {
  const ent_chucvu = require("../controllers/ent_chucvu.controller.js");
  const { isAuthenticated } = require("../middleware/auth_middleware.js");

  var router = require("express").Router();

  router.post("/create", [isAuthenticated], ent_chucvu.create);
  router.get("/", isAuthenticated, ent_chucvu.get);
  router.get("/:id", isAuthenticated, ent_chucvu.getDetail);

  app.use("/api/v2/ent_chucvu", router);
};
