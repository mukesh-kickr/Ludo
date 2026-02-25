export const HOME = -1;

export const MAIN_PATH_LENGTH = 52;


// Real Ludo has 5 colored tiles. The 6th step is the Victory Center.
export const HOME_STRETCH_LENGTH = 5;

// Calculation: 52 + 5 - 1 = 56.
// Path: 0-50 (Track) -> 51-55 (Home Stretch) -> 56 (Victory)
export const FINAL_POSITION = MAIN_PATH_LENGTH + HOME_STRETCH_LENGTH - 1; // 56

export const SAFE_CELLS = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

export const PLAYERS_START_POSITION = {
  0: 0,
  1: 13,
  2: 26,
  3: 39,
};
