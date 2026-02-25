import { fetchGlabalLeaderBoard, fetchWeeklyLeaderBoard } from "./leaderboard.service.js";

export const getGlobalLeaderBoard = async (req, res) => {
    try {
        const leadeboard = await fetchGlabalLeaderBoard();
        if(!leadeboard){
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(leadeboard);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: error.message });
    }
}

export const getWeeklyLeaderBoard = async (req, res) => {
    try {
        const leadeboard = await fetchWeeklyLeaderBoard();
        if(!leadeboard){
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(leadeboard);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: error.message });
    }
}