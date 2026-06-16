/*
tetris.js  --  The main game. (Browser version of tetris.py)

This file is the "heartbeat" of the browser game and the JavaScript twin of
tetris.py. It borrows the pieces from shapes.js, the grid rules from board.js,
and the controls from controls.js, then runs the loop that ties them together.

The "game loop" is the heart of nearly every video game. It just repeats this,
about 60 times a second, forever:

    1. See what the player pressed
    2. Move things / update the game
    3. Draw everything on screen
    4. Repeat

One difference from Python: pygame let us write our own `while True` loop. In a
browser we instead hand a function to requestAnimationFrame and the browser
calls it ~60 times a second for us. Same idea, the browser just turns the crank.
*/


// =====================================================================
// SETTINGS  --  the numbers you can tweak. Change them and reload!
// =====================================================================
const COLUMNS = 10;          // how many cells wide the playing field is
const ROWS = 20;             // how many cells tall it is
const CELL_SIZE = 30;        // how big each cell is on screen, in pixels

const SIDEBAR_WIDTH = 150;   // room on the right for the score text

// The piece falls one step every so many seconds. It starts gentle and speeds
// up a little as you play (see the difficulty ramp below), so the opening is
// relaxed and it gets harder the longer you survive.
const START_FALL_SPEED = 0.8;   // seconds between steps at the very start
                                // (bigger = slower = easier. Try 1.0!)
const SPEED_UP_EVERY = 20;      // after this many pieces land, speed up a bit
const SPEED_UP_FACTOR = 0.9;    // each speed-up makes it 10% quicker (x0.9)
const FASTEST_FALL_SPEED = 0.1; // never get quicker than this, however long
                                // you last (smaller here = harder ceiling)

// Colours used for the screen itself.
const BLACK = "rgb(0, 0, 0)";
const GREY = "rgb(40, 40, 40)";
const WHITE = "rgb(255, 255, 255)";
const PLAY_BG = "rgb(30, 30, 36)";   // the playfield's grey background, so the
                                     // play area stands apart from the sidebar

// Work out the window size from the settings above.
const PLAY_WIDTH = COLUMNS * CELL_SIZE;
const WINDOW_WIDTH = PLAY_WIDTH + SIDEBAR_WIDTH;
const WINDOW_HEIGHT = ROWS * CELL_SIZE;


// =====================================================================
// DRAWING  --  small helpers that put things on the screen.
// =====================================================================
// In pygame we drew onto a "screen". In the browser we draw onto a canvas's
// 2D context, which we'll call ctx. Every helper takes ctx as its first thing.

function drawCell(ctx, col, row, colour) {
  // Draw one filled square at grid position (col, row).
  const x = col * CELL_SIZE;
  const y = row * CELL_SIZE;
  ctx.fillStyle = colour;
  ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
  // A thin dark border makes the individual blocks easy to see.
  ctx.lineWidth = 2;
  ctx.strokeStyle = BLACK;
  ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
}


function drawBoard(ctx, board) {
  // Draw every block that has already landed on the board.
  for (let rowIndex = 0; rowIndex < board.length; rowIndex++) {
    for (let colIndex = 0; colIndex < board[rowIndex].length; colIndex++) {
      const colour = board[rowIndex][colIndex];
      if (colour !== null) {
        drawCell(ctx, colIndex, rowIndex, colour);
      }
    }
  }
}


function drawPiece(ctx, piece, x, y, colour) {
  // Draw the piece the player is currently steering.
  for (let rowIndex = 0; rowIndex < piece.length; rowIndex++) {
    for (let colIndex = 0; colIndex < piece[rowIndex].length; colIndex++) {
      if (piece[rowIndex][colIndex]) {
        drawCell(ctx, x + colIndex, y + rowIndex, colour);
      }
    }
  }
}


function drawGridLines(ctx) {
  // Faint grid lines so you can judge where pieces will fall.
  ctx.lineWidth = 1;
  ctx.strokeStyle = GREY;
  for (let col = 0; col <= COLUMNS; col++) {
    ctx.beginPath();
    ctx.moveTo(col * CELL_SIZE, 0);
    ctx.lineTo(col * CELL_SIZE, WINDOW_HEIGHT);
    ctx.stroke();
  }
  for (let row = 0; row <= ROWS; row++) {
    ctx.beginPath();
    ctx.moveTo(0, row * CELL_SIZE);
    ctx.lineTo(PLAY_WIDTH, row * CELL_SIZE);
    ctx.stroke();
  }
}


function drawText(ctx, text, x, y) {
  // Write a line of text on the screen at pixel position (x, y).
  ctx.fillStyle = WHITE;
  ctx.font = "24px consolas, monospace";
  ctx.textBaseline = "top";
  ctx.fillText(text, x, y);
}


// =====================================================================
// HELPERS for making and placing pieces.
// =====================================================================

function newPiece() {
  // Pick a random shape and return everything we need to track it:
  // its grid, its colour, and a starting position near the top middle.
  const choice = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  const piece = choice[0];
  const colour = choice[1];
  // Start it roughly centred along the top.
  const x = Math.floor(COLUMNS / 2) - Math.floor(piece[0].length / 2);
  const y = 0;
  return { piece, colour, x, y };
}


// =====================================================================
// THE GAME LOOP  --  the heartbeat that ties everything together.
// =====================================================================

function main() {
  const canvas = document.getElementById("game");
  canvas.width = WINDOW_WIDTH;
  canvas.height = WINDOW_HEIGHT;
  const ctx = canvas.getContext("2d");

  setupControls();

  // --- Set up a fresh game ---
  let board = makeEmptyBoard(COLUMNS, ROWS);
  let current = newPiece();
  let piece = current.piece;
  let colour = current.colour;
  let pieceX = current.x;
  let pieceY = current.y;
  let score = 0;
  let gameOver = false;

  // How fast pieces fall right now, and how many have landed so far. Every
  // SPEED_UP_EVERY pieces we make fallSpeed a little smaller (quicker).
  let fallSpeed = START_FALL_SPEED;
  let piecesLocked = 0;

  // A timer that counts up; when it passes fallSpeed, the piece steps down.
  let fallTimer = 0.0;

  // requestAnimationFrame gives us a timestamp in milliseconds. We keep the
  // previous one so we can work out how many seconds passed since last frame
  // (Python got this straight from clock.tick(60)).
  let lastTime = null;

  function frame(now) {
    if (lastTime === null) {
      lastTime = now;
    }
    const deltaSeconds = (now - lastTime) / 1000.0;
    lastTime = now;

    // ----- 1. SEE WHAT THE PLAYER PRESSED -----
    const moves = takeMoves();

    // ----- 2. UPDATE THE GAME based on those moves -----
    for (const move of moves) {
      if (gameOver) {
        // While the "Game Over" screen is up, the drop key restarts.
        if (move === "drop") {
          board = makeEmptyBoard(COLUMNS, ROWS);
          const fresh = newPiece();
          piece = fresh.piece; colour = fresh.colour;
          pieceX = fresh.x; pieceY = fresh.y;
          score = 0;
          gameOver = false;
          // Start a fresh game back at the gentle opening speed.
          fallSpeed = START_FALL_SPEED;
          piecesLocked = 0;
        }
      } else if (move === "left") {
        // Try moving left; only keep it if nothing's in the way.
        if (!checkCollision(board, piece, pieceX - 1, pieceY)) {
          pieceX -= 1;
        }
      } else if (move === "right") {
        if (!checkCollision(board, piece, pieceX + 1, pieceY)) {
          pieceX += 1;
        }
      } else if (move === "down") {
        // Soft drop: nudge it down one extra step if it fits.
        if (!checkCollision(board, piece, pieceX, pieceY + 1)) {
          pieceY += 1;
        }
      } else if (move === "rotate") {
        // Spin it. If the spun version doesn't fit where it is (for example
        // it's flush against a wall and the rotation would poke through it),
        // try nudging it a step or two sideways to make room -- this is the
        // classic Tetris "wall kick". We try no nudge first, then left 1,
        // right 1, left 2, right 2. If none fit, keep the old piece.
        const rotated = rotate(piece);
        for (const kick of [0, -1, 1, -2, 2]) {
          if (!checkCollision(board, rotated, pieceX + kick, pieceY)) {
            piece = rotated;
            pieceX += kick;
            break;
          }
        }
      } else if (move === "drop") {
        // Hard drop: fall straight down until something stops us.
        while (!checkCollision(board, piece, pieceX, pieceY + 1)) {
          pieceY += 1;
        }
      }
    }

    // ----- Gravity: make the piece fall on its own over time -----
    if (!gameOver) {
      fallTimer += deltaSeconds;
      if (fallTimer >= fallSpeed) {
        fallTimer = 0.0;
        if (!checkCollision(board, piece, pieceX, pieceY + 1)) {
          pieceY += 1;
        } else {
          // The piece can't fall any more -> lock it into the board.
          lockPiece(board, piece, pieceX, pieceY, colour);

          // Clear any full rows and score them. Clearing more rows at once is
          // worth more points (1->100, 2->300, 3->500, 4->800).
          const cleared = clearFullRows(board);
          const points = { 0: 0, 1: 100, 2: 300, 3: 500, 4: 800 };
          score += points[cleared] !== undefined ? points[cleared] : 800;

          // Difficulty ramp: count this landed piece, and every
          // SPEED_UP_EVERY pieces make the fall a little quicker (down to a
          // floor so it never becomes impossible).
          piecesLocked += 1;
          if (piecesLocked % SPEED_UP_EVERY === 0) {
            fallSpeed = Math.max(FASTEST_FALL_SPEED, fallSpeed * SPEED_UP_FACTOR);
          }

          // Bring in the next piece.
          const fresh = newPiece();
          piece = fresh.piece; colour = fresh.colour;
          pieceX = fresh.x; pieceY = fresh.y;

          // If the brand-new piece already overlaps something, the stack has
          // reached the top -- that's game over.
          if (checkCollision(board, piece, pieceX, pieceY)) {
            gameOver = true;
          }
        }
      }
    }

    // ----- 3. DRAW EVERYTHING -----
    // Fill the whole canvas black first (this is the sidebar's colour)...
    ctx.fillStyle = BLACK;
    ctx.fillRect(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT);
    // ...then paint the play area grey so it clearly stands apart from the
    // score sidebar on its right.
    ctx.fillStyle = PLAY_BG;
    ctx.fillRect(0, 0, PLAY_WIDTH, WINDOW_HEIGHT);
    drawGridLines(ctx);
    drawBoard(ctx, board);
    if (!gameOver) {
      drawPiece(ctx, piece, pieceX, pieceY, colour);
    }

    // Sidebar text on the right.
    drawText(ctx, "SCORE", PLAY_WIDTH + 20, 20);
    drawText(ctx, String(score), PLAY_WIDTH + 20, 50);

    if (gameOver) {
      drawText(ctx, "GAME", PLAY_WIDTH + 20, 200);
      drawText(ctx, "OVER", PLAY_WIDTH + 20, 230);
      drawText(ctx, "drop =", PLAY_WIDTH + 20, 290);
      drawText(ctx, "restart", PLAY_WIDTH + 20, 320);
    }

    // Ask the browser to call us again for the next frame.
    requestAnimationFrame(frame);
  }

  // Kick off the loop.
  requestAnimationFrame(frame);
}


// Start the game once the page has loaded.
window.addEventListener("load", main);


// =====================================================================
// THINGS TO TRY CHANGING / ADD NEXT  (great little learning projects!)
// =====================================================================
// - Change FALL_SPEED at the top to make the game faster or slower.
// - Recolour the pieces by editing the colours in shapes.js.
// - Make the board wider or taller with COLUMNS and ROWS.
// - Speed the game up a little every time the score goes past, say, 1000.
// - Add a "next piece" preview box in the sidebar.
// - Add a faint "ghost" showing where the piece will land if you drop it.
// =====================================================================
