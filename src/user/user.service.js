import GameRoom from "../models/GameRoom.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

export const getProfile = async (userId) => {
    const user = await User.findById(userId).select("-passwordHash");
    return user;
}

export const changeUsername = async (userId, username) => {
    // console.log(userId, username);
    
    if(!username){
        throw new Error("Username is required");
    }
    const user = await User.findById(userId);
    // console.log(user);
    if(!user){
        throw new Error("User not found");
    }
    user.username = username;
    await user.save();
    return user;
}

export const changePassword = async (userId, oldPassword, newPassword) => {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    const match =await bcrypt.compare(oldPassword, user.passwordHash);
    if (!match) {
      throw new Error("Invalid old password");
    }

    const hassedPassword =await bcrypt.hash(newPassword, 12);
    user.passwordHash = hassedPassword;
    await user.save();
    return true;
}