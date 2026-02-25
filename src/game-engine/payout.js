import User from "../models/User.js";
import GameRoom from "../models/GameRoom.js";
import { userGameMap } from "./gameSession.js";
import mongoose from "mongoose";

export const payoutWinner = async (game) => {

  const session = await mongoose.startSession();
  session.startTransaction();
  // Defensive: prevent double payout
  if (game.payoutDone) return;
  game.payoutDone = true;
 try {
   const room = await GameRoom.findOneAndUpdate(
     { roomCode: game.roomCode, payoutDone: false },
     { payoutDone: true, endedAt: new Date(), status: "finished", winner: game.winnerId },
     { new: true, session }
   )
   if (!room) { 
     await session.abortTransaction();
     return;
   }

   const totalWin = game.bet * game.players.length;
   const loserIds = game.players
      .filter((p) => p.id !== game.winnerId)
     .map((p) => p.id);
   
   await User.updateOne(
     { _id: game.winnerId },
     {
       $inc: {
         coins: totalWin, // Global Currency
         "gameStats.ludo.wins": 1, // Ludo Specific
         "gameStats.ludo.totalMatches": 1, // Ludo Specific
       },
     },
     { session },
   );
   
   await User.updateMany(
     { _id: { $in: loserIds } },
     {
       $inc: {
         "gameStats.ludo.losses": 1, // Ludo Specific
         "gameStats.ludo.totalMatches": 1, // Ludo Specific
       },
     },
     { session },
   );
   await session.commitTransaction();
   await session.endSession();

    // 4️⃣ Remove roomCode from userGameMap
    for (const player of game.players) {
      if (player?.id) {
        userGameMap.delete(player.id);
      }
    }

    console.log(`Payout successful for Room: ${game.roomCode}`);
 } catch (error) {
  await session.abortTransaction();
  session.endSession();
  console.error("Payout failed:", error);
 }

};
