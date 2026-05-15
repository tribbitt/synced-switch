import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";

const PORT = process.env.PORT || 3001;

let switchState = 0;

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/state", (_req, res) => {
  res.json({ state: switchState });
});

app.post("/api/toggle", (_req, res) => {
  switchState = switchState ? 0 : 1;
  io.emit("state", switchState);
  res.json({ state: switchState });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  socket.emit("state", switchState);

  socket.on("toggle", () => {
    switchState = switchState ? 0 : 1;
    io.emit("state", switchState);
  });

  socket.on("set", (value) => {
    const next = value ? 1 : 0;
    if (next !== switchState) {
      switchState = next;
      io.emit("state", switchState);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Switch server listening on http://localhost:${PORT}`);
});
