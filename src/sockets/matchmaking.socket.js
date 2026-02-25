import User from "../models/User.js";
import { matchmakingQueues, userQueueMap, matchmakingTimeouts } from "../game-engine/queue.js";
import createMatch from "../game-engine/createMatch.js";
import removeFromQueue from "../game-engine/removeFromQueue.js";

const ALLOWED_PLAYERS = [2, 4];
const ALLOWED_BETS = [50, 100, 500];
const ALLOWED_MODES = ["classic", "royal"];

const matchMakingHandler = (io, socket) => {
  
  socket.on("findMatch", async ({ players, bet, mode="classic" }) => {
    console.log("User connected: and he is finding a match", socket.user.id);
    console.log("Mode is : : ",mode);
    console.log(bet, players);
    try {
      const userId = socket.user.id;

      if (!ALLOWED_PLAYERS.includes(players)) {
        return socket.emit("error", "Invalid number of players");
      }

      if (!ALLOWED_BETS.includes(bet)) {
        return socket.emit("error", "Invalid bet amount");
      }

      //validate mode..
      if(!ALLOWED_MODES.includes(mode)){
        return socket.emit("error", "Invalid mode");
      }

      if (userQueueMap.has(userId)) {
        return socket.emit("error", "Already in matchmaking");
      }

      const user = await User.findById(userId);
      if (!user) {
        return socket.emit("error", "User not found");
      }

      if (user.coins < bet) {
        return socket.emit("error", "Not enough coins");
      }

      user.coins -= bet;
      await user.save();
      console.log(user.coins);

      const queueKey = `queue:${players}:${bet}:${mode}`;

      if (!matchmakingQueues.has(queueKey)) {
        matchmakingQueues.set(queueKey, []);
      }

      const queue = matchmakingQueues.get(queueKey);

      queue.push({
        userId,
        socketId: socket.id,
      });

        userQueueMap.set(userId, queueKey);
        

        const timeOutId = setTimeout(async () => {
            if (!userQueueMap.has(userId)) return;

            await removeFromQueue({ id: userId }, socket);
            socket.emit("matchTimeout", {
                message: "No match found within 1 minute. Coins refunded.",
            });
        }, 30 * 1000);

        matchmakingTimeouts.set(userId, timeOutId);

      socket.emit("matchWaiting", {
        players,
        bet,
        coins: user.coins,
        mode
      });

      if (queue.length === players) {
        await createMatch(io, queueKey, players, bet, mode);
      }
    } catch (err) {
      console.error("findMatch error:", err);
      socket.emit("error", "Matchmaking failed");
    }
  });

  socket.on("cancelMatch", async () => {
    console.log("User connected: and he is cancelling a match", socket.user.id);
    await removeFromQueue(socket.user, socket);
  });

  socket.on("disconnect", async () => {
    await removeFromQueue(socket.user, socket);
  });
};

export default matchMakingHandler;
