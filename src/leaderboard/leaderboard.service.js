import GameRoom from "../models/GameRoom.js";
import User from "../models/User.js";

export const fetchGlabalLeaderBoard = async ()=>{
    const leadeboard = await User.find({})
        .sort({ wins: -1 })
        .limit(50)
        .select("username wins losses coins email");
    return leadeboard;
}

export const fetchWeeklyLeaderBoard = async () => {
    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const weeklyState = await GameRoom.aggregate([
      {
        $match: {
          status: "finished",
          endedAt: { $gte: startOfWeek },
          winner: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$winner",
          weeklyWins: { $sum: 1 },
        },
      },
      {
        $sort: { weeklyWins: -1 },
      },
      {
        $limit: 100,
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails",
        },
        },
        {
          $unwind: "$userDetails",
        },
        {
            $project: {
                _id: 1,
                weeklyWins: 1,
                username: "$userDetails.username",
                email: "$userDetails.email",
                coins: "$userDetails.coins",
            },
        },
    ]);

    
    return weeklyState;
}