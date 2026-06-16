# Games

A little collection of games you can play right in the browser — including on a
Chromebook, with nothing to install. The front page (`index.html`) is a simple
menu of cards linking to each game.

Each game comes in **two twin versions**, kept deliberately similar so you can
read them side by side and learn:

- a **Python + pygame** version you run on a computer (`tetris/*.py`), and
- a **JavaScript** version that runs in any browser (`tetris/web/*.js`).

The two are written in the same shape — same files, same function names, same
comments — so once you understand one, you understand the other.

## Play online

Once this is published to GitHub Pages, open the site link in any browser
(Chrome on a Chromebook works great) and click a game card. The JavaScript
version loads instantly — no downloads, no setup.

> **Why JavaScript for the browser?** JavaScript is the one language every
> browser runs natively, so it "just works" on a Chromebook with no install.
> The Python version is kept for playing (and tinkering) on a desktop.

## The games

| Game                  | Folder      |
| --------------------- | ----------- |
| [Tetris](tetris/)     | `tetris/`   |

---

## Tetris

A small, friendly Tetris you can read and understand — built to learn how games
work.

### Play in the browser

Open [tetris/web/index.html](tetris/web/index.html) (locally, or via the
published site). Keyboard controls:

| Key        | Does          |
| ---------- | ------------- |
| ← / →      | Move left/right |
| ↓          | Drop one row (soft drop) |
| ↑          | Rotate        |
| Space      | Hard drop (slam to the bottom) |

### Run the Python version on a computer

Open a terminal in the `tetris/` folder and run:

```
py -m pip install pygame
py tetris.py
```

A window opens and a piece starts falling. The Python version also supports a
PS3 controller (browsers can't reach game controllers, so the web version is
keyboard-only). To find your controller's button numbers, set
`SHOW_RAW_EVENTS = True` near the top of
[tetris/controls.py](tetris/controls.py), run the game, press buttons, watch the
terminal, then put the numbers into `ROTATE_BUTTON` / `DROP_BUTTON`.

### Which file does what

The two versions mirror each other file-for-file:

| Question                          | Python (desktop)        | JavaScript (browser)        |
| --------------------------------- | ----------------------- | --------------------------- |
| What are the pieces?              | `tetris/shapes.py`      | `tetris/web/shapes.js`      |
| What happens when a piece lands?  | `tetris/board.py`       | `tetris/web/board.js`       |
| How do my keys make it move?      | `tetris/controls.py`    | `tetris/web/controls.js`    |
| How does the whole thing run?     | `tetris/tetris.py`      | `tetris/web/tetris.js`      |

Every file is heavily commented in plain language — read them top to bottom, and
compare each `.py` with its `.js` twin to see how the same idea looks in both
languages. The page that ties the JS files together is
[tetris/web/index.html](tetris/web/index.html).

The bottom of both `tetris.py` and `tetris.js` lists fun things to try changing
(speed, colours, board size, a "next piece" preview, a "ghost").

---

## For maintainers: adding a new game

1. Make a new folder (e.g. `snake/`). Put the Python version's files directly in
   it, and the browser version in a `web/` subfolder with its own `index.html`
   that loads the `.js` files (copy `tetris/web/index.html` as a starting point).
2. Add one card to the root `index.html` — copy an existing `<a class="card">`
   block and point its `href` at `snake/web/index.html`.

No build step is needed: the browser plays the `.js` files directly, so GitHub
Pages serves them as-is.
