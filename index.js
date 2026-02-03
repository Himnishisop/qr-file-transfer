<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Feed Bitch</title>

<style>
body{
  margin:0; background:#0a0a0a; color:#fff;
  font-family:system-ui; text-align:center;
}
button{
  padding:16px 30px; font-size:1.2em;
  border-radius:16px; border:none;
  background:linear-gradient(45deg,#ff0055,#ff8800);
  color:white; cursor:pointer;
}
#popup,#loader{
  position:fixed; inset:0;
  display:none; align-items:center; justify-content:center;
  background:rgba(0,0,0,.92); z-index:10;
}
.card{
  background:#151515; padding:30px;
  border-radius:22px; width:90%; max-width:420px;
  border:2px solid #ff0055;
}
.angle{font-size:1.3em;margin:8px}
.status{font-size:2em;margin-top:16px}
.bar{height:14px;background:#222;border-radius:20px;overflow:hidden;margin-top:20px}
.fill{height:100%;width:0%;background:linear-gradient(90deg,#00f0ff,#ff00aa)}
</style>
</head>

<body>

<h1>Feed Bitch 🍖</h1>
<input type="file" id="files" multiple><br><br>
<button id="feed">Feed Bitch</button>

<div id="popup">
  <div class="card">
    <h2>Tap to Send 🧠</h2>
    <button id="startTap">Enable Motion</button>
    <div class="angle">β: <span id="beta">0</span>°</div>
    <div class="angle">γ: <span id="gamma">0</span>°</div>
    <div class="status" id="status">Waiting…</div>
  </div>
</div>

<div id="loader">
  <div class="card">
    <h2>Sending Energy ⚡</h2>
    <div id="percent">0%</div>
    <div class="bar"><div class="fill" id="fill"></div></div>
  </div>
</div>

<script src="/socket.io/socket.io.js"></script>
<script>
const socket = io();
const ROOM = "room1";
socket.emit("join-room", ROOM);

const popup = document.getElementById("popup");
const loader = document.getElementById("loader");
const betaEl = document.getElementById("beta");
const gammaEl = document.getElementById("gamma");
const statusEl = document.getElementById("status");
const filesInput = document.getElementById("files");
const fill = document.getElementById("fill");
const percent = document.getElementById("percent");

let base = null;
let armed = false;

// 🔥 VERY SENSITIVE VALUES
const TILT_OUT = 6;      // tiny tilt
const TILT_BACK = 3;    // tiny return
const TAP_WINDOW = 400; // fast flick

document.getElementById("feed").onclick = () => {
  if(!filesInput.files.length) return alert("Select files first");
  popup.style.display = "flex";
};

document.getElementById("startTap").onclick = () => {
  if (DeviceOrientationEvent.requestPermission) {
    DeviceOrientationEvent.requestPermission().then(p=>{
      if(p==="granted") window.addEventListener("deviceorientation", detectTap);
    });
  } else {
    window.addEventListener("deviceorientation", detectTap);
  }
};

function detectTap(e){
  const b = e.beta, g = e.gamma;
  betaEl.textContent = b.toFixed(1);
  gammaEl.textContent = g.toFixed(1);

  if(!base){ base={b,g}; return; }

  const diffB = Math.abs(b-base.b);
  const diffG = Math.abs(g-base.g);

  // slight flick away (ANY axis)
  if(!armed && (diffB > TILT_OUT || diffG > TILT_OUT)){
    armed = true;
    setTimeout(()=>armed=false, TAP_WINDOW);
  }

  // return back = TAP
  if(armed && diffB < TILT_BACK && diffG < TILT_BACK){
    armed = false;
    popup.style.display="none";
    loader.style.display="flex";
    window.removeEventListener("deviceorientation", detectTap);
    startTransfer();
  }
}

async function startTransfer(){
  const files = [...filesInput.files];

  // instant telekinesis on PC
  socket.emit("telekinesis-start", {
    room: ROOM,
    files: files.map(f=>f.name)
  });

  let done = 0;
  const total = files.reduce((s,f)=>s+f.size,0);

  for(const file of files){
    const fd = new FormData();
    fd.append("file", file);
    fd.append("room", ROOM);

    await fetch("/upload", { method:"POST", body:fd });

    done += file.size;
    const p = Math.floor(done/total*100);
    fill.style.width = p+"%";
    percent.textContent = p+"%";
  }

  percent.textContent = "DONE 🔥";
}
</script>
</body>
</html>
