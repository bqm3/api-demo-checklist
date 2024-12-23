module.exports = (app) => {
  const noti = require("../controllers/noti.controller.js");
  var router = require("express").Router();

  // Create a new Ent_calv
  router.get("/", noti.notiAll);

  app.use("/api/v2/noti", router);
};
