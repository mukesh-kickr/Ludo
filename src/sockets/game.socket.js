import gameStore from "../game-engine/gameStore.js";
import { rollDice } from "../game-engine/dice.js";
import { canMove } from "../game-engine/move.js";
import { applyMove } from "../game-engine/applyMove.js";
import { shouldChangeTurn } from "../game-engine/turn.js";
import { hasPlayerWon } from "../game-engine/win.js";
import { payoutWinner } from "../game-engine/payout.js";
import {
  FINAL_POSITION,
  SAFE_CELLS,
  HOME,
  MAIN_PATH_LENGTH,
} from "../game-engine/constants.js";

// Helper: Check if current player has any valid moves
const hasAnyValidMove = (tokens, dice) =>
  tokens.some((pos) => canMove(pos, dice));

// Helper: Map logical position to board index for collision checks
const getRealBoardPosition = (player, logicalPos) => {
  // If invalid or in home stretch (>= 51), they are not on the main killable board
  if (logicalPos < 0 || logicalPos >= 51) return null;
  return (logicalPos + player.startOffset) % MAIN_PATH_LENGTH;
};


const getNextActivePlayerIndex = (game) => {
  let nextIndex = (game.currentTurnIndex + 1) % game.players.length;
  let loopCount = 0;

 
  while (
    (game.players[nextIndex].hasLeft || game.players[nextIndex].hasWon) &&
    loopCount < game.players.length
  ) {
    nextIndex = (nextIndex + 1) % game.players.length;
    loopCount++;
  }

  return nextIndex;
};


const handleKill = (game, currentPlayer, newLogicalPos) => {
  
  if (newLogicalPos >= 51) return false;

  
  const attackerBoardPos = getRealBoardPosition(currentPlayer, newLogicalPos);
  if (attackerBoardPos === null) return false;

  
  if (SAFE_CELLS.has(attackerBoardPos)) return false;

  
  for (const player of game.players) {
    if (String(player.id) === String(currentPlayer.id)) continue;

    for (let i = 0; i < player.tokens.length; i++) {
      const oppLogicalPos = player.tokens[i];

      
      if (oppLogicalPos === HOME || oppLogicalPos >= 51) continue;

      const oppBoardPos = getRealBoardPosition(player, oppLogicalPos);

      if (oppBoardPos === attackerBoardPos) {
        console.log(
          `KILL! ${currentPlayer.id} killed ${player.id} at pos ${attackerBoardPos}`,
        );
        player.tokens[i] = HOME; 
        return true; 
      }
    }
  }
  return false;
};

export const gameHandler = (io, socket) => {
  //ROLL DICE
  socket.on("rollDice", ({ roomCode }) => {
    console.log(`Roll request from ${socket.user.id} in room ${roomCode}`);

    const game = gameStore.get(roomCode);
    if (!game || game.status !== "playing") return;

    const player = game.players[game.currentTurnIndex];

    // FIX 1: Strict String Comparison for ID
    if (String(player.id) !== String(socket.user.id)) {
      console.warn(
        `Turn Mismatch: Expected ${player.id}, Got ${socket.user.id}`,
      );
      return;
    }

    if (game.dice !== null) {
      console.warn("Dice already rolled");
      return;
    }

    const dice = rollDice();
    console.log(`Rolled: ${dice}`);

    // Streak Logic (3 sixes = skip turn)
    if (dice === 6) {
      game.sixStreak += 1;
    } else {
      game.sixStreak = 0;
    }

    if (game.sixStreak === 3) {
      console.log("3 Sixes! Turn skipped.");
      game.sixStreak = 0;
      game.dice = null;
      game.currentTurnIndex = getNextActivePlayerIndex(game); //new
      io.to(roomCode).emit("gameState", game);
      return;
    }

    game.dice = dice;

    // Check if player has any possible moves
    const canPlay = hasAnyValidMove(player.tokens, dice);
    if (!canPlay) {
      console.log("No valid moves. Skipping turn.");

      // UX Improvement: Emit state showing the dice first
      io.to(roomCode).emit("gameState", game);

      // Then wait 1 second before forcing turn change so user sees the roll
      setTimeout(() => {
        game.dice = null;
        game.currentTurnIndex = getNextActivePlayerIndex(game); //new
        io.to(roomCode).emit("gameState", game);
      }, 1000);

      return;
    }

    io.to(roomCode).emit("gameState", game);
  });

  // MOVE TOKEN
  socket.on("moveToken", async ({ roomCode, tokenIndex }) => {
    console.log(`Move request from ${socket.user.id} token ${tokenIndex}`);

    const game = gameStore.get(roomCode);
    if (!game || game.dice === null || game.status !== "playing") return;

    const player = game.players[game.currentTurnIndex];

    // FIX 1: Strict String Comparison
    if (String(player.id) !== String(socket.user.id)) return;

    if (
      typeof tokenIndex !== "number" ||
      tokenIndex < 0 ||
      tokenIndex >= player.tokens.length
    )
      return;

    const pos = player.tokens[tokenIndex];

    // Validate Move
    if (!canMove(pos, game.dice)) {
      console.warn("Invalid Move Attempted");
      return;
    }

    // Apply Move
    let newPos = applyMove(pos, game.dice);
    player.tokens[tokenIndex] = newPos;

    // Check Events
    const finished = newPos === FINAL_POSITION;
    const killed = handleKill(game, player, newPos);

    //Royal mode

    if (game.mode === "royal" && killed) {
      console.log("Royal Kill Bonus! +5 Steps");

      if (canMove(player.tokens[tokenIndex], 5)) {
        const bonusPos = applyMove(player.tokens[tokenIndex], 5);
        player.tokens[tokenIndex] = bonusPos;

        // Check kill AGAIN (Double Kill possibility?)
        // Usually, games don't chain kills, but we should update 'newPos' for win check
        newPos = bonusPos;
      }
    }

    // Win Condition
    if (hasPlayerWon(player, game.mode)) {
      console.log(`WINNER: ${player.id}`);
      game.status = "finished";
      game.winnerId = player.id;
      player.hasWon = true;

      await payoutWinner(game);

      io.to(roomCode).emit("gameOver", {
        winnerId: player.id,
        game,
      });
      return;
    }

    // Turn Logic
    // Turn changes UNLESS: Rolled 6 OR Killed someone OR Finished a token
    const shouldMoveTurn = shouldChangeTurn({
      dice: game.dice,
      killed,
      finished,
    });

    if (shouldMoveTurn) {
      game.currentTurnIndex = getNextActivePlayerIndex(game); //new
      game.sixStreak = 0; // Reset streak on turn change
    } else {
      console.log("✨ Bonus Turn! (6, Kill, or Finish)");
    }

    game.dice = null; // Reset dice for next action

    io.to(roomCode).emit("gameState", game);
  });

  socket.on("leaveGame", async ({ roomCode }) => {
    console.log(`Leave request from ${socket.user.id} in room ${roomCode}`);
    const game = gameStore.get(roomCode);
    if (!game || game.status !== "playing") return;

    //Identify leaving player
    const playerIndex = game.players.findIndex(
      (p) => String(p.id) === String(socket.user.id),
    );
    if (playerIndex === -1) return;

    socket.leave(roomCode);

    const player = game.players[playerIndex];

   
    player.hasLeft = true;

   
    player.tokens = [-1, -1, -1, -1];

    
    const activePlayers = game.players.filter((p) => !p.hasLeft);

    if (activePlayers.length === 1) {
      const winner = activePlayers[0];
      game.status = "finished";
      game.winnerId = winner.id;
      console.log(`WINNER: ${winner.id}`);

      await payoutWinner(game);

      io.to(roomCode).emit("gameOver", {
        winnerId: winner.id,
        game,
        reason: "Opponent Left",
      });
      return;
    }

    
    
    if (game.currentTurnIndex === playerIndex) {
      // Reset dice/streak state
      game.dice = null;
      game.sixStreak = 0;

     
      game.currentTurnIndex = getNextActivePlayerIndex(game); //new
    }

    //Notify other players
    io.to(roomCode).emit("playerLeft", {
      leftPlayerId: player.id,
      game,
    });
    io.to(roomCode).emit("gameState", game);
  });
};
