module.exports = (app) => {
  const ent_tang = require("../controllers/ent_tang.controller.js");
  const {
    isAuthenticated,
    isAdmin,
  } = require("../middleware/auth_middleware.js");

  var router = require("express").Router();

  router.post("/create", [isAuthenticated], ent_tang.create);
  router.get("/", [isAuthenticated], ent_tang.get);
  router.put("/delete-mul", [isAuthenticated], ent_tang.deleteMul)

  app.use("/api/v2/ent_tang", router);
};
