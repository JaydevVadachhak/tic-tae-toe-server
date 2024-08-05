const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  connectionStateRecovery: {},
  cors: {
    origin: "http://localhost:4200",
  },
});
const cors = require("cors");

app.use(cors());

const PORT = process.env.PORT || 3000;

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("createRoom", () => {
    const roomId = generateRoomId();
    socket.join(roomId);
    socket.emit("roomCreated", roomId);
  });

  socket.on("joinRoom", (roomId) => {
    const isRoomExist = io.sockets.adapter.rooms.has(roomId);
    if (isRoomExist) {
      const users = io.sockets.adapter.rooms.get(roomId);
      if (users.size === 1) {
        socket.join(roomId);
        io.to(roomId).emit("gameStart", {
          roomId,
          users: [...users],
        });
      } else {
        socket.emit("roomFull");
      }
    } else {
      socket.emit("noRoom");
    }
  });

  socket.on("disconnect", async () => {
    const rooms = io.sockets.adapter.rooms;
    [...rooms].forEach((room) => {
      socket.to(room).emit("userLeft", `User ${socket.id} has left the room`);
    });
    console.log("User disconnected");
  });

  socket.on("boardClick", async (data) => {
    io.to(data.roomId).emit("boardData", data);
  });

  socket.on("reset", async (data) => {
    socket.to(data.roomId).emit("restartGame");
  });

  socket.on("userLeft", async (data) => {
    socket.to(data.roomId).emit("leftGame");
  });
});

app.get("/", (req, res) => {
  res.send({
    hi: "kem chho?",
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

function generateRoomId() {
  return Math.random().toString(36).substr(2, 6) + new Date().getSeconds();
}
