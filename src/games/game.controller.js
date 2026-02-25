import { fetchGameDetailes, fetchHistory } from "./game.service.js";


export const getGameHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const history = await fetchHistory(userId);
        if(!history){
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(history);

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: error.message });
    }
}

export const getGameDetails = async (req, res) => {
    try {
        const { roomCode } = req.params;
        if (!roomCode) {
            return res.status(400).json({ message: "Room code is required" });
        }
        const game = await fetchGameDetailes(roomCode);
        if(!game){
            return res.status(404).json({ message: "Game not found" });
        }
        res.status(200).json(game);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: error.message });
    }
}