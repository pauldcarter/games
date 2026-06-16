/*
board.js  --  The playing grid and everything on it. (Browser version of board.py)

This file answers ONE question: "What happens when a piece lands?"

It is the JavaScript twin of board.py, with the same four functions:
    makeEmptyBoard, checkCollision, lockPiece, clearFullRows, rotate

The board is just a big grid (a list of rows). Every cell is either:
    null         -> empty space
    a colour     -> a block of that colour has landed here
(Python used None for "empty"; JavaScript uses null. Same idea.)

The board "remembers" where blocks have landed. The piece you're steering is
NOT in the board yet -- it only gets stamped in (we call that "locking") once
it can't fall any further.

A "piece" here means its little grid of 0s and 1s (from shapes.js).
"x" and "y" are where the top-left corner of that little grid sits on the board:
    x = how many columns from the left
    y = how many rows from the top
*/


function makeEmptyBoard(width, height) {
  // Build a fresh, empty board: 'height' rows, each with 'width' empty cells.
  const board = [];
  for (let r = 0; r < height; r++) {
    const row = [];
    for (let c = 0; c < width; c++) {
      row.push(null);
    }
    board.push(row);
  }
  return board;
}


function checkCollision(board, piece, x, y) {
  // Would the piece overlap something if it sat at position (x, y)?
  //
  // We check every filled square of the piece and ask three questions:
  //   - Has it gone off the left or right edge?
  //   - Has it dropped below the bottom?
  //   - Is it landing on a block that's already on the board?
  // If ANY of those is true, we return true meaning "yes, that move is blocked."
  const boardHeight = board.length;
  const boardWidth = board[0].length;

  for (let rowIndex = 0; rowIndex < piece.length; rowIndex++) {
    for (let colIndex = 0; colIndex < piece[rowIndex].length; colIndex++) {
      if (!piece[rowIndex][colIndex]) {
        continue;  // this part of the piece's grid is empty, skip it
      }

      // Where this square would actually sit on the big board:
      const boardCol = x + colIndex;
      const boardRow = y + rowIndex;

      // Off the left or right edge, or below the bottom? That's a collision.
      if (boardCol < 0 || boardCol >= boardWidth || boardRow >= boardHeight) {
        return true;
      }

      // Bumping into a block that already landed? Also a collision.
      // (boardRow can be negative when a piece just spawned above the top;
      //  that's fine -- there's nothing up there to hit.)
      if (boardRow >= 0 && board[boardRow][boardCol] !== null) {
        return true;
      }
    }
  }

  return false;  // nothing in the way -- the move is allowed
}


function lockPiece(board, piece, x, y, colour) {
  // Stamp the piece into the board for good, using its colour.
  //
  // We call this once the piece has landed and can't fall any more. After this,
  // the piece becomes part of the board's memory and a brand new piece spawns.
  for (let rowIndex = 0; rowIndex < piece.length; rowIndex++) {
    for (let colIndex = 0; colIndex < piece[rowIndex].length; colIndex++) {
      if (piece[rowIndex][colIndex]) {
        const boardRow = y + rowIndex;
        const boardCol = x + colIndex;
        if (boardRow >= 0) {  // ignore any part still above the top edge
          board[boardRow][boardCol] = colour;
        }
      }
    }
  }
}


function clearFullRows(board) {
  // Remove any rows that are completely filled, then drop everything above down.
  //
  // Returns how many rows we cleared, so the game can add up the score.
  //
  // The trick: keep only the rows that still have at least one empty cell, then
  // add brand-new empty rows on top to replace the ones we removed. That makes
  // the blocks above a cleared line fall down naturally.
  const width = board[0].length;

  // Keep every row that is NOT completely full (still has at least one null).
  const rowsThatSurvive = board.filter(row => row.includes(null));

  const clearedCount = board.length - rowsThatSurvive.length;

  // Add empty rows at the top to keep the board the same height.
  const newEmptyRows = [];
  for (let i = 0; i < clearedCount; i++) {
    newEmptyRows.push(new Array(width).fill(null));
  }

  // Put the new empty rows on top, survivors underneath -> rebuild the board.
  // (board.splice(...) replaces the contents in place, like Python's board[:].)
  const rebuilt = newEmptyRows.concat(rowsThatSurvive);
  board.splice(0, board.length, ...rebuilt);

  return clearedCount;
}


function rotate(piece, direction) {
  // Turn the piece 90 degrees and return the new grid. Pass "cw" to spin it
  // clockwise (the default) or "ccw" to spin it the other way.
  //
  // The new grid's rows come from the old grid's columns. Reading each column
  // from the bottom row upward spins it clockwise; reading from the top down
  // (and taking the columns right-to-left) spins it anticlockwise.
  const rows = piece.length;
  const cols = piece[0].length;
  const rotated = [];

  if (direction === "ccw") {
    for (let c = cols - 1; c >= 0; c--) {
      const newRow = [];
      for (let r = 0; r < rows; r++) {
        newRow.push(piece[r][c]);
      }
      rotated.push(newRow);
    }
  } else {
    for (let c = 0; c < cols; c++) {
      const newRow = [];
      for (let r = rows - 1; r >= 0; r--) {
        newRow.push(piece[r][c]);
      }
      rotated.push(newRow);
    }
  }

  return rotated;
}
