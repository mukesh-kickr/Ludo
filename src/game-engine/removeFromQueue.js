import User from "../models/User.js";
import { matchmakingQueues, matchmakingTimeouts, userQueueMap } from "./queue.js";

const removeFromQueue = async (jwtUser, socket) => {
  const queueKey = userQueueMap.get(jwtUser.id);
  if (!queueKey) return;

  const queue = matchmakingQueues.get(queueKey);
  if (!queue) return;

  const index = queue.findIndex((p) => p.userId === jwtUser.id);
  if (index === -1) return;

  queue.splice(index, 1);
  userQueueMap.delete(jwtUser.id);
    
    const timeOutId = matchmakingTimeouts.get(jwtUser.id);
    if (timeOutId) {
      clearTimeout(timeOutId);
      matchmakingTimeouts.delete(jwtUser.id);
    }

  const user = await User.findById(jwtUser.id);
  if (!user) return;

  const bet = Number(queueKey.split(":")[2]);
  user.coins += bet;
  await user.save();

  socket.emit("matchCancelled", {
    coins: user.coins,
  });
};

export default removeFromQueue;
