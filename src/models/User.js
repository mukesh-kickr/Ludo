
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    coins: {
      type: Number,
      default: 1000,
    },
    gameStats: {
      ludo: {
        wins: { type: Number, default: 0 },
        losses: { type: Number, default: 0 },
        totalMatches: { type: Number, default: 0 },
        
      },
      uno: {
        wins: { type: Number, default: 0 },
        losses: { type: Number, default: 0 },
        totalMatches: { type: Number, default: 0 },
        
      },
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);
export default User;