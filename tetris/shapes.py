"""
shapes.py  --  The 7 Tetris pieces.

This file answers ONE question: "What are the pieces?"

A Tetris piece (called a "tetromino" because it's made of 4 squares) is
stored here as a tiny grid of numbers:
    1 means "there is a block here"
    0 means "this part is empty"

So if you squint at the grids below, you can actually SEE each shape in the
code. The little grids ARE the pieces -- there's no hidden magic.

Each piece also has a colour, written as (Red, Green, Blue) where each number
goes from 0 (none) to 255 (lots). For example (255, 0, 0) is pure red.
"""

# --- The colours (Red, Green, Blue) ---
# Feel free to change these numbers and re-run the game to recolour the pieces!
CYAN   = (0, 240, 240)
BLUE   = (0, 0, 240)
ORANGE = (240, 160, 0)
YELLOW = (240, 240, 0)
GREEN  = (0, 240, 0)
PURPLE = (160, 0, 240)
RED    = (240, 0, 0)


# --- The 7 shapes ---
# Each shape is a list of rows. Each row is a list of 0s and 1s.
# Read the 1s like a dot-to-dot and you'll see the piece.

I_PIECE = [
    [1, 1, 1, 1],     # the long straight one
]

J_PIECE = [
    [1, 0, 0],
    [1, 1, 1],
]

L_PIECE = [
    [0, 0, 1],
    [1, 1, 1],
]

O_PIECE = [
    [1, 1],           # the square (never needs rotating)
    [1, 1],
]

S_PIECE = [
    [0, 1, 1],
    [1, 1, 0],
]

T_PIECE = [
    [0, 1, 0],
    [1, 1, 1],
]

Z_PIECE = [
    [1, 1, 0],
    [0, 1, 1],
]


# --- The master list ---
# Each entry pairs a shape with its colour: (grid, colour).
# The game picks one of these at random whenever it needs a new piece.
SHAPES = [
    (I_PIECE, CYAN),
    (J_PIECE, BLUE),
    (L_PIECE, ORANGE),
    (O_PIECE, YELLOW),
    (S_PIECE, GREEN),
    (T_PIECE, PURPLE),
    (Z_PIECE, RED),
]
