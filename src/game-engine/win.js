import { FINAL_POSITION } from "./constants.js";

export const hasPlayerWon = (player, mode="classic") => {
 
    const finishedTokens = player.tokens.filter((pos) => pos === FINAL_POSITION).length;

    if (mode === "royal") {
        return finishedTokens >= 2;
    }
    return finishedTokens === 4;
}