module.exports = (app) => {
    const ent_khoicv = require("../controllers/ent_khoicv.controller.js");
    const {isAuthenticated}= require('../middleware/auth_middleware.js');

    var router = require("express").Router();
  
    router.get("/", ent_khoicv.get);
    router.get("/:id", ent_khoicv.getDetail);
  
    app.use("/api/v2/ent_khoicv", router);
  };