const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
if (!fs.existsSync("temp")) fs.mkdirSync("temp");

const upload = multer({ dest: "temp/" });

io.on("connection", socket => {
  socket.on("join-room", room => socket.join(room));

  socket.on("telekinesis-start", data => {
    io.to(data.room).emit("file-init", data.files);
  });
});

app.post("/upload-chunk", upload.single("chunk"), (req, res) => {
  const { fileName, chunkIndex, totalChunks, room, chunkSize } = req.body;

  const tempFile = path.join("temp", `${fileName}.${chunkIndex}`);
  fs.renameSync(req.file.path, tempFile);

  io.to(room).emit("file-progress", {
    fileName,
    uploaded: Number(chunkIndex) + 1,
    total: Number(totalChunks)
  });

  if (Number(chunkIndex) + 1 === Number(totalChunks)) {
    const finalPath = path.join("uploads", fileName);
    const writeStream = fs.createWriteStream(finalPath);

    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join("temp", `${fileName}.${i}`);
      writeStream.write(fs.readFileSync(chunkPath));
      fs.unlinkSync(chunkPath);
    }

    writeStream.end();
    io.to(room).emit("file-complete", fileName);
  }

  res.sendStatus(200);
});

server.listen(8000, () => console.log("🔥 Server running on 8000"));
