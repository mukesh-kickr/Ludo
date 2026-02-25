import { HOME, PLAYERS_START_POSITION  } from "./constants.js";
const buildPlayers = (matchedPlayers, mode="classic") => {
    return matchedPlayers.map((p, index) => {
        let initialTokens = [HOME, HOME, HOME, HOME]
        if (mode === "royal") {
            initialTokens = [0, HOME, HOME, HOME]
        }
        return {
          id: p.userId,
          socketId: p.socketId,
          startOffset: PLAYERS_START_POSITION[index],
          tokens: initialTokens,
          hasWon: false,
          hasLeft: false,
        };
    })
}

export default buildPlayers;