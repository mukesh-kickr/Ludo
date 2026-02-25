import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";
dotenv.config();

export const registerUser = async (data) => {
    const { username, email, password } = data;
    const existUser = await User.findOne({ email })
    if(existUser) {
        throw new Error("User already exist")
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await User.create({ username, email, passwordHash: hashedPassword })
    const token = jwt.sign({ id: user._id, coins:user.coins }, process.env.JWT_SECRETE, {
      expiresIn: "7d",
    });
    return { user, token };
};

export const loginUser = async (data) => {
    const { email, password } = data;

    const user = await User.findOne({ email });
    if (!user) throw new Error("Invalid credentials");

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) throw new Error("Invalid credentials");

    const token = jwt.sign({ id: user._id, coins:user.coins }, process.env.JWT_SECRETE, {
      expiresIn: "7d",
    });

    return { user, token };
}

