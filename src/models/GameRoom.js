import mongoose from "mongoose";

const gameRoomSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      unique: true,
    },
    players: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    status: {
      type: String,
      enum: ["waiting", "playing", "finished"],
      default: "waiting",
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    endedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    payoutDone: {
      type: Boolean,
      default: false,
    },
    mode: {
      type: String,
      enum: ["classic", "royal", "friendly"],
      default: "classic",
    },
    bet: {
      type: Number,
      default: 0,
    },
    maxPlayers: {
      type: Number,
      default: 2,
      enum: [2, 4]
    }
  },
  { timestamps: true },
);

const GameRoom = mongoose.model("GameRoom", gameRoomSchema);
export default GameRoom