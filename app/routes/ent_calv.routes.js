module.exports = (app) => {
    const ent_calv = require("../controllers/ent_calv.controller.js");
    const {isAuthenticated}= require('../middleware/auth_middleware.js');
  
    var router = require("express").Router();
  
    // Create a new Ent_calv
    router.post("/create",[isAuthenticated], ent_calv.create);
    router.get("/",[isAuthenticated], ent_calv.get);
    router.post("/",[isAuthenticated], ent_calv.getFilter);
    router.get("/:id",[isAuthenticated], ent_calv.getDetail);
    router.put("/delete/:id",isAuthenticated, ent_calv.delete);
    router.put("/update/:id",isAuthenticated, ent_calv.update);
  
  
    app.use("/api/v2/ent_calv", router);
  };