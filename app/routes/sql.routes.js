module.exports = (app) => {
    const sql = require("../controllers/sql.controller.js");
    var router = require("express").Router();
  
    router.post("/", sql.query);
  
    app.use("/api/v2/sql", router);
  };
  