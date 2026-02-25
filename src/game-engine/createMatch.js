import GameRoom from "../models/GameRoom.js";
import buildPlayers from "./buildPlayers.js";
import gameStore from "./gameStore.js";
import { matchmakingQueues, userQueueMap, matchmakingTimeouts } from "./queue.js"
import { userGameMap } from "./gameSession.js";

const createMatch = async (io, queueKey, players, bet, mode = "classic") => {
    const queue = matchmakingQueues.get(queueKey);

    const matchedPlayers = queue.splice(0, players);
    matchedPlayers.forEach(p => {
       
        userQueueMap.delete(p.userId);
        const timeOutId = matchmakingTimeouts.get(p.userId);
        if (timeOutId) { 
            clearTimeout(timeOutId);
            matchmakingTimeouts.delete(p.userId);
        }
    });

    const roomCode = `R-${Date.now()}` 
    await GameRoom.create({
        roomCode,
        players: matchedPlayers.map(p => p.userId),
        status: "playing",
        mode: mode,
        bet,
        maxPlayers: matchedPlayers.length
    })

    gameStore.set(roomCode, {
        roomCode,
      mode,
      bet,
      players: buildPlayers(matchedPlayers, mode),
      currentTurnIndex: 0,
      dice: null,
      status: "playing",
      sixStreak: 0,
      payoutDone: false
    });
    
    matchedPlayers.forEach(p => {
        io.sockets.sockets.get(p.socketId)?.join(roomCode);
        io.to(p.socketId).emit("matchFound", { roomCode ,mode});
        userGameMap.set(p.userId, roomCode);

    })

    io.to(roomCode).emit("gameState", gameStore.get(roomCode));
}

export default createMatch