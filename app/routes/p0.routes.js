module.exports = (app) => {
  const p0 = require("../controllers/p0.controller.js");
  const {
    isAuthenticated,
    isAdmin,
  } = require("../middleware/auth_middleware.js");
  var router = require("express").Router();

  router.post("/create", [isAuthenticated], p0.createP0);
  router.get("/all-duan", [isAuthenticated], p0.getAll_ByID_Duan);
  router.put("/update/:id", [isAuthenticated], p0.updateP0);

  app.use("/api/v2/p0", router);
};
