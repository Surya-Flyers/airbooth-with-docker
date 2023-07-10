const mongoose = require("mongoose");
const { devUrl } = require("../configs/db.config");

mongoose
  .connect(devUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to the database!");
  })
  .catch((err) => {
    console.log("Cannot connect to the database!", err);
    process.exit();
  });

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
  console.log("MONGO DB opened successfully");
});

module.exports = db;
