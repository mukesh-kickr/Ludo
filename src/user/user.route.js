import express from "express";
import {  getMe, updatePassword, updateUsername } from "./user.controller.js";
import { isAuth } from "../auth/auth.middleware.js";

const router = express.Router();

router.get("/me", isAuth, getMe);
router.put("/username", isAuth, updateUsername);
router.put("/change-password", isAuth, updatePassword);

export default router;