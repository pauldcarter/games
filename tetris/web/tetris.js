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
const ACCENT = "rgb(108, 208, 255)"; // bright blue, to highlight YOUR row

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


function dropY(board, piece, x, y) {
  // Work out how far down a piece would fall from (x, y) before it lands.
  // We step it down one row at a time until the next step would collide, and
  // return that resting row. Used for both the "ghost" and the hard drop.
  while (!checkCollision(board, piece, x, y + 1)) {
    y += 1;
  }
  return y;
}


function drawGhost(ctx, board, piece, x, y) {
  // Draw a faint outline where the current piece will land if you drop it, so
  // you can see where it's going. It's the same shape, just drawn as a thin
  // bordered square with no fill, at the resting position dropY() works out.
  const landingY = dropY(board, piece, x, y);
  for (let rowIndex = 0; rowIndex < piece.length; rowIndex++) {
    for (let colIndex = 0; colIndex < piece[rowIndex].length; colIndex++) {
      if (piece[rowIndex][colIndex]) {
        const px = (x + colIndex) * CELL_SIZE;
        const py = (landingY + rowIndex) * CELL_SIZE;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);
      }
    }
  }
}


function drawMiniPiece(ctx, piece, colour, x, y) {
  // Draw a small version of a piece in the sidebar (used for the "next" box).
  // x, y are the top-left pixel position; cells are a bit smaller than the
  // board's so a 4-wide piece fits the sidebar neatly.
  const mini = 20;
  for (let rowIndex = 0; rowIndex < piece.length; rowIndex++) {
    for (let colIndex = 0; colIndex < piece[rowIndex].length; colIndex++) {
      if (piece[rowIndex][colIndex]) {
        const px = x + colIndex * mini;
        const py = y + rowIndex * mini;
        ctx.fillStyle = colour;
        ctx.fillRect(px, py, mini, mini);
        ctx.strokeStyle = BLACK;
        ctx.lineWidth = 2;
        ctx.strokeRect(px, py, mini, mini);
      }
    }
  }
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

function main(playerName) {
  const canvas = document.getElementById("game");
  canvas.width = WINDOW_WIDTH;
  canvas.height = WINDOW_HEIGHT;
  const ctx = canvas.getContext("2d");

  setupControls();        // keyboard (desktop)
  setupTouchControls();   // on-screen buttons (phones)

  // --- Set up a fresh game ---
  let board = makeEmptyBoard(COLUMNS, ROWS);
  let current = newPiece();
  let piece = current.piece;
  let colour = current.colour;
  let pieceX = current.x;
  let pieceY = current.y;
  // The piece waiting after the current one -- shown in the "NEXT" box so you
  // can plan ahead.
  let next = newPiece();
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
    // (Once the game is over we stop the loop entirely and hand back to the
    // login / scores screen, so there's no "game over" branch to handle here.)
    for (const move of moves) {
      if (move === "left") {
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
      } else if (move === "rotate" || move === "rotate-ccw") {
        // Spin it -- clockwise for "rotate", anticlockwise for "rotate-ccw".
        // If the spun version doesn't fit where it is (for example it's flush
        // against a wall and the rotation would poke through it), try nudging
        // it a step or two sideways to make room -- the classic Tetris "wall
        // kick". We try no nudge first, then left 1, right 1, left 2, right 2.
        // If none fit, keep the old piece.
        const rotated = rotate(piece, move === "rotate-ccw" ? "ccw" : "cw");
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

          // Bring in the piece that was waiting in "NEXT", then roll a fresh
          // one to wait behind it.
          piece = next.piece; colour = next.colour;
          pieceX = next.x; pieceY = next.y;
          next = newPiece();

          // If the brand-new piece already overlaps something, the stack has
          // reached the top -- that's game over.
          if (checkCollision(board, piece, pieceX, pieceY)) {
            gameOver = true;
            // Send this score to the shared leaderboard, then bring the player
            // back to the login / scores screen with the refreshed board (their
            // new entry included). If the server's down submitScore returns [],
            // and we let showLogin fall back to a fresh fetch instead.
            submitScore(playerName, score).then((updated) => {
              showLogin(playerName, updated.length ? updated : undefined);
            });
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
      // Draw the faint "ghost" first (where the piece will land), then the
      // real piece on top of it.
      drawGhost(ctx, board, piece, pieceX, pieceY);
      drawPiece(ctx, piece, pieceX, pieceY, colour);
    }

    // Sidebar text on the right.
    drawText(ctx, "SCORE", PLAY_WIDTH + 20, 20);
    drawText(ctx, String(score), PLAY_WIDTH + 20, 50);

    // The "level" is just how many times we've sped up so far, plus one (so
    // you start on level 1). It goes up every SPEED_UP_EVERY pieces -- the
    // same moment the game gets a little faster.
    const level = Math.floor(piecesLocked / SPEED_UP_EVERY) + 1;
    drawText(ctx, "LEVEL", PLAY_WIDTH + 20, 100);
    drawText(ctx, String(level), PLAY_WIDTH + 20, 130);

    if (gameOver) {
      // Just GAME OVER in the sidebar -- the score is already shown up top, and
      // the full leaderboard lives on the login screen we hand back to below.
      drawText(ctx, "GAME", PLAY_WIDTH + 20, 175);
      ctx.fillStyle = ACCENT;
      ctx.fillText("OVER", PLAY_WIDTH + 20, 200);
    } else {
      // The "NEXT" box: a little preview of the piece coming up.
      drawText(ctx, "NEXT", PLAY_WIDTH + 20, 180);
      drawMiniPiece(ctx, next.piece, next.colour, PLAY_WIDTH + 20, 215);
    }

    // Keep the loop going only while the game is live. Once it's over we paint
    // this final frame and stop; the game-over handler above has already kicked
    // off the return to the login / scores screen.
    if (!gameOver) {
      requestAnimationFrame(frame);
    }
  }

  // Kick off the loop.
  requestAnimationFrame(frame);
}


// =====================================================================
// THE LOGIN / SCORES SCREEN  --  shown before a game and after each one.
// =====================================================================
// This is the home base between games: it has the name box, the Play button,
// and the shared Top Scores list. main() runs a single game; when it ends it
// brings this screen back, with the scores refreshed (including the one just
// set) and the name remembered.

// Remember the last name typed, so it's pre-filled next time. This lives in the
// browser (localStorage), separate from the shared leaderboard.
const NAME_KEY = "tetris-player-name";


function renderLeaderboard(scores, highlightName) {
  // Paint the Top Scores list on the login screen from the array the server
  // gave us. highlightName (the current player) gets their first matching row
  // lit up so they can spot themselves.
  const list = document.getElementById("leaderboard-list");
  list.innerHTML = "";

  if (!scores || scores.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "No scores yet -- be the first!";
    list.appendChild(li);
    return;
  }

  let highlighted = false;
  scores.forEach((entry, index) => {
    const li = document.createElement("li");
    if (!highlighted && entry.name === highlightName) {
      li.className = "you";
      highlighted = true;
    }
    // Build the row: rank, name, points. textContent (not innerHTML) keeps any
    // odd characters in a name from being treated as markup.
    const rank = document.createElement("span");
    rank.className = "rank";
    rank.textContent = index + 1;
    const who = document.createElement("span");
    who.className = "who";
    who.textContent = entry.name;
    const pts = document.createElement("span");
    pts.className = "pts";
    pts.textContent = entry.score;
    li.append(rank, who, pts);
    list.appendChild(li);
  });
}


async function showLogin(highlightName, knownScores) {
  // Show the login / scores screen, refresh the Top Scores list, and wait for
  // the player to press Play -- then start a fresh game with their name.
  //
  // knownScores lets the caller pass in a board it already has (e.g. the fresh
  // one submitScore handed back right after a game), so we don't re-fetch and
  // flicker. If it's not given, we ask the server ourselves.
  const login = document.getElementById("login");
  const input = document.getElementById("login-name");
  const goButton = document.getElementById("login-go");

  // Pre-fill the name: the one we want to highlight (just played), else the
  // remembered one from last visit.
  input.value = highlightName || localStorage.getItem(NAME_KEY) || "";

  // Use the scores we were handed, or fetch them. While fetching, show the
  // previous/empty list rather than nothing.
  const scores = knownScores !== undefined ? knownScores : await getTopScores();
  renderLeaderboard(scores, highlightName);

  login.style.display = "flex";
  input.focus();
  input.select();

  function start() {
    // Blank name falls back to "Anon", trimmed and capped to 12 chars.
    const name = (input.value || "").trim().slice(0, 12) || "Anon";
    localStorage.setItem(NAME_KEY, name);   // remember for next time
    // Stop listening so old handlers don't pile up across games.
    goButton.removeEventListener("click", start);
    input.removeEventListener("keydown", onKey);
    login.style.display = "none";
    main(name);
  }

  function onKey(event) {
    if (event.key === "Enter") {
      start();
    }
  }

  goButton.addEventListener("click", start);
  input.addEventListener("keydown", onKey);
}


// Show the login screen as soon as the page is ready.
window.addEventListener("load", () => showLogin());