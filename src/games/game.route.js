import express from "express"
import { getGameDetails, getGameHistory } from "./game.controller.js"
import { isAuth } from "../auth/auth.middleware.js";
const router = express.Router()

router.get("/history", isAuth, getGameHistory);
router.get("/:roomCode", getGameDetails);


export default router