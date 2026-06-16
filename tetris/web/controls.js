/*
controls.js  --  Reading the keyboard. (Browser version of controls.py)

This file answers ONE question: "How do my keys make the piece move?"

It is the JavaScript twin of controls.py. The Python version also reads a PS3
controller, but a web page can't reach a game controller the simple way, so the
browser game is keyboard-only. The rest of the game doesn't care HOW you pressed
something -- it only wants the MOVE name:

    "left", "right", "down", "rotate", "drop"

In Python, tetris.py asked for a fresh list of moves each frame. In the browser
the browser tells US when a key goes down (an "event"), so instead we collect
key presses into a little queue as they happen, and the game empties that queue
once per frame. Same outcome, browser style.
*/


// The moves the player has asked for but the game hasn't handled yet.
const _moveQueue = [];


function setupControls() {
  // Start listening for key presses. Call this once when the game starts.
  //
  // We translate each key into one of our simple move names and drop it in the
  // queue. The game will collect them with takeMoves() once per frame.
  window.addEventListener("keydown", (event) => {
    let move = null;

    if (event.key === "ArrowLeft") {
      move = "left";
    } else if (event.key === "ArrowRight") {
      move = "right";
    } else if (event.key === "ArrowDown") {
      move = "down";
    } else if (event.key === "ArrowUp") {
      move = "rotate";
    } else if (event.key === " ") {        // the spacebar
      move = "drop";
    }

    if (move !== null) {
      _moveQueue.push(move);
      // Stop the page from scrolling when arrow keys / space are pressed.
      event.preventDefault();
    }
  });
}


function takeMoves() {
  // Hand back all the moves asked for since last time, and empty the queue.
  //
  // This is the browser's version of controls.read_moves(events): the game
  // calls it once per frame and gets the list of moves to act on.
  const moves = _moveQueue.slice();   // a copy of everything queued
  _moveQueue.length = 0;              // empty the queue for next frame
  return moves;
}


// How often a held direction button repeats, in milliseconds. This matches the
// Python version's STICK_REPEAT, so holding ◀ on the phone feels like holding a
// direction on the PS3 controller.
const TOUCH_REPEAT = 120;


function setupTouchControls() {
  // Wire up the on-screen buttons for phones. Each button has an id and the
  // move it stands for; we look them up and make taps add that move to the same
  // queue the keyboard uses, so the game itself doesn't care how you pressed it.
  //
  // This mirrors the PS3 controller layout from controls.py: the D-pad
  // (left/right/down) is something you HOLD, so those buttons repeat while held;
  // rotate and hard-drop fire once per press, like the face buttons.
  const buttons = [
    { id: "btn-left",       move: "left",        hold: true  },
    { id: "btn-right",      move: "right",       hold: true  },
    { id: "btn-down",       move: "down",        hold: true  },
    { id: "btn-rotate-ccw", move: "rotate-ccw",  hold: false },
    { id: "btn-rotate",     move: "rotate",      hold: false },
    { id: "btn-drop",       move: "drop",        hold: false },
  ];

  for (const { id, move, hold } of buttons) {
    const el = document.getElementById(id);
    if (!el) {
      continue;  // the button isn't on the page (e.g. on desktop) -- skip it
    }

    let repeatTimer = null;

    const press = (event) => {
      // Stop the tap from also scrolling, zooming, or selecting text.
      event.preventDefault();
      _moveQueue.push(move);  // the move happens immediately on press

      if (hold) {
        // ...and then keeps happening while the finger stays down.
        repeatTimer = setInterval(() => _moveQueue.push(move), TOUCH_REPEAT);
      }
    };

    const release = () => {
      if (repeatTimer !== null) {
        clearInterval(repeatTimer);
        repeatTimer = null;
      }
    };

    // Pointer events cover both touch and mouse with one set of handlers.
    el.addEventListener("pointerdown", press);
    el.addEventListener("pointerup", release);
    el.addEventListener("pointercancel", release);
    el.addEventListener("pointerleave", release);  // finger slid off the button
  }
}
