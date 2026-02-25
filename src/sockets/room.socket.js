import User from "../models/User.js";
import GameRoom from "../models/GameRoom.js";
import gameStore from "../game-engine/gameStore.js";
import buildPlayers from "../game-engine/buildPlayers.js";
import { generateRoomCode } from "../utils/roomCode.js";
import { userGameMap } from "../game-engine/gameSession.js";

const ALLOWED_MODES = ["classic", "royal"];
const ALLOWED_PLAYERS = [2, 4];
const HOSTING_FEE = 50;

export const roomHandler = (io, socket) => {
  socket.on("createPrivateRoom", async ({ players, mode }) => {
    try {
      if (!ALLOWED_PLAYERS.includes(players))
        return socket.emit("error", "Invalid player count");
      if (!ALLOWED_MODES.includes(mode))
        return socket.emit("error", "Invalid game mode");

      const user = await User.findById(socket.user.id);
      if (!user) return socket.emit("error", "User not found");

      if (user.coins < HOSTING_FEE) {
        return socket.emit(
          "error",
          `You need ${HOSTING_FEE} coins to create a room.`,
        );
      }

      user.coins -= HOSTING_FEE;
      await user.save();

      const roomCode = generateRoomCode();

      const room = await GameRoom.create({
        roomCode,
        createdBy: socket.user.id,
        players: [socket.user.id],
        bet: 0, // Friendly Match (No betting pot)
        maxPlayers: players,
        mode,
        status: "waiting",
      });

      socket.join(roomCode);
      socket.emit("roomCreated", {
        roomCode,
        players: room.players,
        mode,
        maxPlayers: room.maxPlayers,
      });

      socket.emit("coinUpdate", { coins: user.coins });
    } catch (err) {
      console.error("Create Room Error:", err);
      socket.emit("error", "Room creation failed");
    }
  });

  socket.on("joinPrivateRoom", async ({ roomCode }) => {
    // console.log(`Join Request: ${socket.user.id} -> ${roomCode}`);

    try {
      const room = await GameRoom.findOne({ roomCode });

      if (!room) return socket.emit("error", "Room not found");
      if (room.status !== "waiting")
        return socket.emit("error", "Game already started");
      if (room.players.length >= room.maxPlayers)
        return socket.emit("error", "Room is full");
      if (room.players.includes(socket.user.id))
        return socket.emit("error", "You are already in this room");

      const user = await User.findById(socket.user.id);
      if (!user) return socket.emit("error", "User not found");

      room.players.push(socket.user.id);
      await room.save();

      socket.join(roomCode);

      io.to(roomCode).emit("playerJoined", {
        playerId: socket.user.id,
        totalPlayers: room.players.length,
        maxPlayers: room.maxPlayers,
      });

      //START GAME IF FULL
      if (room.players.length === room.maxPlayers) {
        console.log(`Room ${roomCode} is full. Starting Game!`);

        room.status = "playing";
        await room.save();
        const socketsInRoom = await io.in(roomCode).fetchSockets();

        // Map UserIDs to SocketIDs to build player objects
        const matchedPlayers = room.players.map((userId) => {
          const socketInstance = socketsInRoom.find(
            (s) => String(s.user.id) === String(userId),
          );
          return {
            userId: userId,
            socketId: socketInstance ? socketInstance.id : null,
          };
        });

        // C. Update Session Map
        matchedPlayers.forEach((p) =>
          userGameMap.set(String(p.userId), roomCode),
        );

        const newGame = {
          roomCode,
          mode: room.mode,
          bet: 0, // Friendly
          players: buildPlayers(matchedPlayers, room.mode),
          currentTurnIndex: 0,
          dice: null,
          status: "playing",
          sixStreak: 0,
          payoutDone: false,
        };

        gameStore.set(roomCode, newGame);

        io.to(roomCode).emit("matchFound", { roomCode, mode: room.mode });

        setTimeout(() => {
          io.to(roomCode).emit("gameState", newGame);
        }, 500);
      }
    } catch (err) {
      console.error("Join Room Error:", err);
      socket.emit("error", "Failed to join room");
    }
  });
};
