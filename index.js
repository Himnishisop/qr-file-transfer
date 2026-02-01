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

// Storage folder for uploaded files
const uploadFolder = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

// Upload endpoint
app.post("/upload/:room", upload.array("files"), (req, res) => {
  const room = req.params.room;
  const files = req.files.map(f => f.originalname);

  // Notify computer page via WebSocket
  io.to(room).emit("new-files", files);
  res.json({ success: true, files });
});

// WebSocket for session rooms
io.on("connection", socket => {
  socket.on("join", room => {
    socket.join(room);
    console.log("Joined room:", room);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
