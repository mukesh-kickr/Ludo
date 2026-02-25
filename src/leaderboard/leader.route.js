import express from "express"
import { getGlobalLeaderBoard, getWeeklyLeaderBoard } from "./leaderboard.controller.js";
const router = express.Router();

router.get("/global", getGlobalLeaderBoard);
router.get("/weekly", getWeeklyLeaderBoard);


export default router;