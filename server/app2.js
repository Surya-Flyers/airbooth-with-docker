require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const https = require("https");
const socketIo = require("socket.io");
const app = express();
const { HTTPS_SERVER_PORT } = process.env;

var corsOptions = {
  // origin: process.env.CLIENT_ORIGIN || "http://localhost:8081",
  origin: "*",
};

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// simple route
app.get("/health-checkup", (req, res) => {
  res.json({ message: "Yeah, I'm alive" });
});

require("../app/routes/turorial.routes")(app);

// SSL cert for HTTPS access
const options = {
  key: fs.readFileSync("./certificates/ssl/key.pem", "utf-8"),
  cert: fs.readFileSync("./certificates/ssl/cert.pem", "utf-8"),
};

const httpsServer = https.createServer(options, app);
httpsServer.listen(HTTPS_SERVER_PORT, () => {
  console.log("listening on port: " + HTTPS_SERVER_PORT);
});

const socket = socketIo(httpsServer, {
  cors: {
    origin: "*",
  },
});

// socket.io namespace (could represent a room?)
const _mediaSoupSocket = socket.of("/media-soup");

let interval;
let mediaSoupSocket;

_mediaSoupSocket.on("connection", (socket) => {
  console.log("New client connected");
  if (interval) {
    clearInterval(interval);
  }
  mediaSoupSocket = socket;
  interval = setInterval(() => getApiAndEmit(socket), 1000);
  socket.on("disconnect", () => {
    console.log("Client disconnected");
    clearInterval(interval);
  });

  socket.on("success", (data) => {
    console.log(`---- success ---- ${data}`);
  });
});

const getApiAndEmit = (socket) => {
  const response = new Date();
  // Emitting a new message. Will be consumed by the client
  socket.emit("FromAPI", response);
};

module.exports = server;
