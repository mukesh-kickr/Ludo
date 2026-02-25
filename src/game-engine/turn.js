export const shouldChangeTurn = ({ dice, killed, finished }) => {
    if(dice === 6) return false;
    if(killed) return false;
    if(finished) return false
    return true;
}