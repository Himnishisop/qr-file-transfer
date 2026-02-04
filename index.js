const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  maxHttpBufferSize: 500 * 1024 * 1024 // 500MB
});

// serve static files
app.use(express.static(path.join(__dirname)));

io.on("connection", (socket) => {
  console.log("🧠 Receiver Online:", socket.id);

  socket.on("cart-start", (meta) => {
    socket.broadcast.emit("cart-appear", meta);
  });

  socket.on("file-chunk", (chunk) => {
    socket.broadcast.emit("file-chunk", chunk);
  });

  socket.on("file-done", (data) => {
    socket.broadcast.emit("file-done", data);
  });

  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("🔥 Server running on port", PORT);
});
