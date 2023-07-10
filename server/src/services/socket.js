const socketIo = require("socket.io");

const io = socketIo(httpsServer, {
  cors: {
    origin: "*",
    // methods: ["GET", "POST"],
    // allowedHeaders: ["my-custom-header"],
    // credentials: true
  },
});

// socket.io namespace (could represent a room?)
const connections = io.of("/to-do-app");

let interval;

connections.on("connection", (socket) => {
  console.log("New client connected");
  if (interval) {
    clearInterval(interval);
  }
  interval = setInterval(() => getApiAndEmit(socket), 1000);
  socket.on("disconnect", () => {
    console.log("Client disconnected");
    clearInterval(interval);
  });

  socket.on("success", (data) => {
    console.log(`---- success ---- ${data}`);
  });
});
