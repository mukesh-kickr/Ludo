import { HOME,FINAL_POSITION  } from "./constants.js";
export const canMove = (pos, dice) => {
    if(pos === HOME) return dice === 6
    if(pos === FINAL_POSITION) return false
    if (pos + dice > FINAL_POSITION) return false
    return true;
}