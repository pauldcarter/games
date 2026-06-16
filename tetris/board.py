"""
board.py  --  The playing grid and everything that happens on it.

This file answers ONE question: "What happens when a piece lands?"

The board is just a big grid (a list of rows). Every cell is either:
    None         -> empty space
    a colour      -> a block of that colour has landed here

The board "remembers" where blocks have landed. The piece you're steering is
NOT in the board yet -- it only gets stamped in (we call that "locking") once
it can't fall any further.

A "piece" in here means its little grid of 0s and 1s (from shapes.py).
"x" and "y" are where the top-left corner of that little grid sits on the board:
    x = how many columns from the left
    y = how many rows from the top
"""


def make_empty_board(width, height):
    """Build a fresh, empty board: 'height' rows, each with 'width' empty cells."""
    return [[None for _ in range(width)] for _ in range(height)]


def check_collision(board, piece, x, y):
    """
    Would the piece overlap something if it sat at position (x, y)?

    We check every filled square of the piece and ask three questions:
      - Has it gone off the left or right edge?
      - Has it dropped below the bottom?
      - Is it landing on a block that's already on the board?
    If ANY of those is true, we return True meaning "yes, that move is blocked."
    """
    board_height = len(board)
    board_width = len(board[0])

    for row_index, row in enumerate(piece):
        for col_index, filled in enumerate(row):
            if not filled:
                continue  # this part of the piece's grid is empty, skip it

            # Where this square would actually sit on the big board:
            board_col = x + col_index
            board_row = y + row_index

            # Off the left or right edge, or below the bottom? That's a collision.
            if board_col < 0 or board_col >= board_width or board_row >= board_height:
                return True

            # Bumping into a block that already landed? Also a collision.
            # (board_row can be negative when a piece just spawned above the top;
            #  that's fine -- there's nothing up there to hit.)
            if board_row >= 0 and board[board_row][board_col] is not None:
                return True

    return False  # nothing in the way -- the move is allowed


def lock_piece(board, piece, x, y, colour):
    """
    Stamp the piece into the board for good, using its colour.

    We call this once the piece has landed and can't fall any more. After this,
    the piece becomes part of the board's memory and a brand new piece spawns.
    """
    for row_index, row in enumerate(piece):
        for col_index, filled in enumerate(row):
            if filled:
                board_row = y + row_index
                board_col = x + col_index
                if board_row >= 0:  # ignore any part still above the top edge
                    board[board_row][board_col] = colour


def clear_full_rows(board):
    """
    Remove any rows that are completely filled, then drop everything above down.

    Returns how many rows we cleared, so the game can add up the score.

    The trick: keep only the rows that still have at least one empty cell, then
    add brand-new empty rows on top to replace the ones we removed. That makes
    the blocks above a cleared line fall down naturally.
    """
    width = len(board[0])

    # Keep every row that is NOT completely full.
    rows_that_survive = [row for row in board if None in row]

    cleared_count = len(board) - len(rows_that_survive)

    # Add empty rows at the top to keep the board the same height.
    new_empty_rows = [[None for _ in range(width)] for _ in range(cleared_count)]

    # Put the new empty rows on top, survivors underneath -> rebuild the board.
    board[:] = new_empty_rows + rows_that_survive

    return cleared_count


def rotate(piece, direction="cw"):
    """
    Turn the piece 90 degrees and return the new grid. Pass "cw" to spin it
    clockwise (the default) or "ccw" to spin it the other way.

    How it works, in plain terms: the columns of the old piece become the rows
    of the new one. "zip(*piece)" pairs up the columns for us; reversing the
    rows first (piece[::-1]) spins it clockwise, while reversing each new row
    instead spins it anticlockwise.

    Note: this just calculates the rotated shape. Whoever calls rotate() should
    check_collision() afterwards and undo the rotation if it doesn't fit. That
    "try it, undo if it bumps something" idea is our simple stand-in for the
    fancy wall-kick systems real Tetris games use.
    """
    if direction == "ccw":
        return [list(row) for row in zip(*piece)][::-1]
    return [list(row) for row in zip(*piece[::-1])]
