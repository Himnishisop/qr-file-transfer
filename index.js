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
if (!fs.existsSync("chunks")) fs.mkdirSync("chunks");

// multer config (chunk upload)
const upload = multer({
  dest: "temp/",
  limits: { fileSize: 6 * 1024 * 1024 } // max 6MB per chunk
});

io.on("connection", socket => {
  socket.on("join-room", room => {
    socket.join(room);
  });
});

// CHUNK UPLOAD ROUTE
app.post("/upload-chunk", upload.single("chunk"), (req, res) => {
  const { fileName, chunkIndex, totalChunks, room } = req.body;

  const chunkPath = path.join(
    "chunks",
    `${fileName}.part${chunkIndex}`
  );

  fs.renameSync(req.file.path, chunkPath);

  // merge if last chunk
  if (Number(chunkIndex) + 1 === Number(totalChunks)) {
    const finalPath = path.join("uploads", fileName);
    const writeStream = fs.createWriteStream(finalPath);

    for (let i = 0; i < totalChunks; i++) {
      const partPath = path.join("chunks", `${fileName}.part${i}`);
      const data = fs.readFileSync(partPath);
      writeStream.write(data);
      fs.unlinkSync(partPath);
    }

    writeStream.end();
    io.to(room).emit("files", [fileName]);
  }

  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log("Server running on port", PORT)
);
