const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

io.on("connection", (socket) => {
  socket.on("join", (room) => {
    socket.join(room);
  });

  socket.on("send-file", (data) => {
    socket.to(data.room).emit("receive-file", data);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT);
