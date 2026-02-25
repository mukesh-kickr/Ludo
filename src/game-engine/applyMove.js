import { FINAL_POSITION, HOME } from "./constants.js"

export const applyMove = (pos, dice) => {
    if (pos === HOME) return dice === 6 ? 0 : HOME;
    if(pos + dice > FINAL_POSITION) return pos
    return pos + dice;
}
