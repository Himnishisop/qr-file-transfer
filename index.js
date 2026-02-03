const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let activeSocket = null;

io.on("connection", (socket) => {
  console.log("connected:", socket.id);

  socket.on("register-desktop", () => {
    activeSocket = socket;
    console.log("desktop ready");
  });

  socket.on("send-file", ({ name, buffer }) => {
    if (!activeSocket) return;

    const filePath = path.join(__dirname, "downloads", name);
    fs.writeFileSync(filePath, Buffer.from(buffer));

    activeSocket.emit("file-start", {
      name,
      size: buffer.byteLength
    });

    activeSocket.emit("file-progress", 100);

    activeSocket.emit("file-complete", {
      name
    });

    console.log("file sent:", name);
  });

  socket.on("disconnect", () => {
    if (socket === activeSocket) activeSocket = null;
  });
});

server.listen(3000, () =>
  console.log("🔥 server running on http://localhost:3000")
);
