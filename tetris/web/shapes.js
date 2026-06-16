/*
shapes.js  --  The 7 Tetris pieces. (Browser version of shapes.py)

This file answers ONE question: "What are the pieces?"

It is the JavaScript twin of shapes.py, kept in the same shape on purpose so
you can read them side by side. A Tetris piece (a "tetromino" -- four squares)
is stored as a tiny grid of numbers:
    1 means "there is a block here"
    0 means "this part is empty"

So if you squint at the grids below, you can actually SEE each shape in the
code. The little grids ARE the pieces -- there's no hidden magic.

Each piece also has a colour. In the browser we write colours as CSS strings
like "rgb(0, 240, 240)" instead of Python's (0, 240, 240) tuples, but it's the
same idea: Red, Green, Blue, each from 0 to 255.
*/

// --- The colours (Red, Green, Blue) ---
const CYAN   = "rgb(0, 240, 240)";
const BLUE   = "rgb(0, 0, 240)";
const ORANGE = "rgb(240, 160, 0)";
const YELLOW = "rgb(240, 240, 0)";
const GREEN  = "rgb(0, 240, 0)";
const PURPLE = "rgb(160, 0, 240)";
const RED    = "rgb(240, 0, 0)";


// --- The 7 shapes ---
// Each shape is a list of rows. Each row is a list of 0s and 1s.
// Read the 1s like a dot-to-dot and you'll see the piece.

const I_PIECE = [
  [1, 1, 1, 1],        // the long straight one
];

const J_PIECE = [
  [1, 0, 0],
  [1, 1, 1],
];

const L_PIECE = [
  [0, 0, 1],
  [1, 1, 1],
];

const O_PIECE = [
  [1, 1],              // the square (never needs rotating)
  [1, 1],
];

const S_PIECE = [
  [0, 1, 1],
  [1, 1, 0],
];

const T_PIECE = [
  [0, 1, 0],
  [1, 1, 1],
];

const Z_PIECE = [
  [1, 1, 0],
  [0, 1, 1],
];


// --- The master list ---
// Each entry pairs a shape with its colour: [grid, colour].
// The game picks one of these at random whenever it needs a new piece.
const SHAPES = [
  [I_PIECE, CYAN],
  [J_PIECE, BLUE],
  [L_PIECE, ORANGE],
  [O_PIECE, YELLOW],
  [S_PIECE, GREEN],
  [T_PIECE, PURPLE],
  [Z_PIECE, RED],
];
