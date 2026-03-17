import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import {createServer} from "http";
import connectDB from "./config/db.js";
import { Server } from "socket.io";

import authRoutes from "./auth/auth.route.js";
import userRoutes from "./user/user.route.js"
import gameRoutes from "./games/game.route.js"
import leaderBoardRoutes from "./leaderboard/leader.route.js"

import { socketAuth } from "./auth/socket.auth.js";
import { roomHandler } from "./sockets/room.socket.js";
import { gameHandler } from "./sockets/game.socket.js";
import matchMakingHandler from "./sockets/matchmaking.socket.js";
import { userGameMap } from "./game-engine/gameSession.js";
import gameStore from "./game-engine/gameStore.js";
import { customRateLimiter, rateLimiter } from "./middleware/ratelimit.js";
import loggerMiddleware from "./middleware/loggerMiddleware.js";
connectDB();

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.set("trust proxy", true);
app.use(loggerMiddleware);

app.use(express.json());
app.use("/api", customRateLimiter)
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/leaderboard", leaderBoardRoutes);

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.use(socketAuth);

io.on("connection", (socket) => {
  console.log("User connected:", socket.user.id);

  const userId = socket.user.id;
  const roomCode = userGameMap.get(userId);

  if (roomCode) {
    const game = gameStore.get(roomCode);

    if (game && game.status === "playing") {
      socket.join(roomCode);

      
      const player = game.players.find((p) => String(p.id) === String(userId));
      if (player) {
        player.socketId = socket.id;
      }
      

      socket.emit("reconnected", {
        roomCode,
        game,
      });

      // console.log(`User ${userId} reconnected to room ${roomCode}`);
    }
  }
  socket.on("send-offer", ({ userToSignal, callerId, signal }) => {
    io.to(userToSignal).emit("receive-offer", { signal, callerId });
  });

  socket.on("send-answer", ({ signal, callerId }) => {
    io.to(callerId).emit("receive-answer", { signal, id: socket.id });
  });

  socket.on("send-ice-candidate", ({ targetId, candidate }) => {
    io.to(targetId).emit("receive-ice-candidate", {
      senderId: socket.id,
      candidate,
    });
  });
  
socket.on("webrtc-signal", ({ targetSocketId, signal }) => {
  io.to(targetSocketId).emit("webrtc-signal", {
    senderSocketId: socket.id,
    signal: signal,
  });
})
  socket.on("toggle-media", ({ roomCode, isAudioMuted, isVideoMuted }) => {
    socket.to(roomCode).emit("peer-media-toggled", {
      socketId: socket.id,
      isAudioMuted,
      isVideoMuted,
    });
  });
  
  
  roomHandler(io, socket);
  matchMakingHandler(io, socket);
  gameHandler(io, socket);
});
server.listen(3000,"0.0.0.0", () => console.log("Server running on port 3000"));
