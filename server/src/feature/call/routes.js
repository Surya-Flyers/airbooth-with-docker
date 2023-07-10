module.exports = (app) => {
  const call = require("./controller");

  const router = require("express").Router();

  // Create a new Tutorial
  router.post("/create-room", call.createCall);

  // Retrieve all Tutorials
  router.put("/add-inspector/:inspectorId", call.addInspector);

  router.put("/end-call/:callId", call.endCall);

  app.use("/api/v1/call", router);
};
