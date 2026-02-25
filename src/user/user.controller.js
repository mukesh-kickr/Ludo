import { changePassword, changeUsername, getProfile} from "./user.service.js";


export const getMe = async (req, res)=>{
    try {
        const userId = req.user.id;
        const myProfile =await getProfile(userId);
        if(!myProfile){
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({
          username: myProfile.username,
          email: myProfile.email,
          coins: myProfile.coins,
          stats: {
            wins: myProfile.gameStats.ludo.wins,
            losses: myProfile.gameStats.ludo.losses,
            total:
              myProfile.gameStats.ludo.wins + myProfile.gameStats.ludo.losses,
            winRate: `${Math.round((myProfile.gameStats.ludo.wins / (myProfile.gameStats.ludo.wins + myProfile.gameStats.ludo.losses)) * 100)}%`,
            lossRate: `${Math.round((myProfile.gameStats.ludo.losses / (myProfile.gameStats.ludo.wins + myProfile.gameStats.ludo.losses)) * 100)}%`,
          },
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: error.message });
    }
}

export const updateUsername = async (req, res) => {
    try {
        const userId = req.user.id;
        const { username } = req.body;
        const updatedUser = await changeUsername(userId, username)
        if(!updatedUser){
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({
          username: updatedUser.username,
          email: updatedUser.email,
          coins: updatedUser.coins,
          stats: {
            wins: updatedUser.gameStats.ludo.wins,
            losses: updatedUser.gameStats.ludo.losses,
            total:
              updatedUser.gameStats.ludo.wins + updatedUser.gameStats.ludo.losses,
            winRate: `${Math.round((updatedUser.gameStats.ludo.wins / (updatedUser.gameStats.ludo.wins + updatedUser.gameStats.ludo.losses)) * 100)}%`,
            lossRate: `${Math.round((updatedUser.gameStats.ludo.losses / (updatedUser.gameStats.ludo.wins + updatedUser.gameStats.ludo.losses)) * 100)}%`,
          },
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: error.message });
    }
}

export const updatePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: "Old password and new password are required" });
        }
        const result = await changePassword(userId, oldPassword, newPassword);
        if (!result) {
            return res.status(400).json({ message: "Something went wrong!" });
        }
        res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: error.message });
    }
}
