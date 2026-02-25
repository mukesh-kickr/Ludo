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

app.use(cors(
    {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    }
));

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
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});

io.use(socketAuth);

io.on("connection", (socket) => {
  // console.log("User connected:", socket.user.id);

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

  roomHandler(io, socket);
  matchMakingHandler(io, socket);
  gameHandler(io, socket);
});
server.listen(3000, () => console.log("Server running on port 3000"));
