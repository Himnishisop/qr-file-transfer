const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ===== STATIC FILES =====
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ===== ENSURE UPLOADS FOLDER =====
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// ===== MULTER CONFIG =====
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// ===== SOCKET LOGIC =====
io.on("connection", socket => {
  console.log("🔌 socket connected:", socket.id);

  socket.on("join", room => {
    socket.join(room);
    console.log("📦 socket joined room:", room);
  });

  socket.on("disconnect", () => {
    console.log("❌ socket disconnected:", socket.id);
  });
});

// ===== UPLOAD ENDPOINT =====
app.post("/upload/:room", upload.array("files"), (req, res) => {
  const room = req.params.room;
  const files = req.files.map(f => f.filename);

  console.log("⬆️ upload received for room:", room);
  console.log("📁 files:", files);

  // IMPORTANT: emit AFTER upload
  io.to(room).emit("files", files);

  res.json({ success: true });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("🚀 server running on port", PORT);
});
