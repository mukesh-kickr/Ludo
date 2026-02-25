export const createGame = (players) => {
    return {
        currentTurnIndex: 0,
        dice: null,
        players: players.map(id => ({
            id:id.toString(),
            tokens: [-1, -1, -1, -1],
            status: "playing"
        }))
    }
}
