const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

const storage = multer.diskStorage({
  destination: "uploads",
  filename: (_, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

app.post("/upload/:room", upload.array("files"), (req, res) => {
  const files = req.files.map(f => f.filename);
  io.to(req.params.room).emit("files", files);
  res.json({ ok: true });
});

io.on("connection", socket => {
  socket.on("join", room => socket.join(room));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running"));
