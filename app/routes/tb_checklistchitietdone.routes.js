module.exports = (app) => {
    const tb_checklistchitietdone = require("../controllers/tb_checklistchitietdone.controller.js");
    const {isAuthenticated}= require('../middleware/auth_middleware.js');

    var router = require("express").Router();
  
    router.post("/create",[isAuthenticated], tb_checklistchitietdone.create);
    router.get("/:idc", tb_checklistchitietdone.getDataFormat);

  
    app.use("/api/v2/tb_checklistchitietdone", router);
  };