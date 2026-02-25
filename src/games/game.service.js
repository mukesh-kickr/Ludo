import GameRoom from "../models/GameRoom.js";

export const fetchHistory = async (userId) => {
    const history = await GameRoom.find({
        players: userId,
        status: "finished"
    })
    .sort({ createdAt: -1 })
    .limit(20)
        .populate("winner", "username")
    
    return history;
}

export const fetchGameDetailes = async (roomCode) => {
    const game = await GameRoom.findOne({ roomCode })
        .populate("players", "username email")
        .populate("winner", "username")
    
    return game;
}