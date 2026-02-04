import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 500 * 1024 * 1024 // 500MB
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(__dirname));

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
});

server.listen(3000, () => {
  console.log("🔥 Server running on http://localhost:3000");
});
