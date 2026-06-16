# Games

A little collection of browser-playable games. Each game lives in its own
folder and is built to run right inside any web browser (including on a
Chromebook) — no install needed to *play*. The front page (`index.html`) is a
simple menu of cards linking to each game.

## Play online

Once this is published to GitHub Pages, open the site link in any browser
(Chrome on a Chromebook works great) and click a game card. That's it — the game
runs in the page.

> **Why a browser?** The games are written in Python with pygame, then packaged
> to WebAssembly with [pygbag](https://pypi.org/project/pygbag/) so they run in
> the browser. Chromebooks are browser-first, so this is the easiest way to play
> on one — you don't need to turn on Linux.

## The games

| Game                  | Folder      |
| --------------------- | ----------- |
| [Tetris](tetris/)     | `tetris/`   |

---

## Tetris (Python + pygame)

A small, friendly Tetris you can read and understand — built to learn how games
work. Plays on the keyboard *and* a PS3 controller (on the desktop).

### Run it on your computer

Open a terminal in the `tetris/` folder and run:

```
py -m pip install pygame
py tetris.py
```

A window opens and a piece starts falling.

### Controls

**Keyboard** (always works, even with no controller):

| Key        | Does          |
| ---------- | ------------- |
| ← / →      | Move left/right |
| ↓          | Drop one row (soft drop) |
| ↑          | Rotate        |
| Space      | Hard drop (slam to the bottom) |
| Esc        | Quit          |

**PS3 controller** (desktop only — controllers aren't available in the browser):

- **D-pad** — move left/right and down.
- **Left stick** — also moves (hold a direction).
- **A face button** — rotate.
- **Another face button** — hard drop.

To find your controller's button numbers, set `SHOW_RAW_EVENTS = True` near the
top of [tetris/controls.py](tetris/controls.py), run the game, press buttons, and
watch the terminal — then put the numbers you like into `ROTATE_BUTTON` /
`DROP_BUTTON` and set `SHOW_RAW_EVENTS` back to `False`.

### Which file does what

| File                    | Answers the question        |
| ----------------------- | --------------------------- |
| `tetris/shapes.py`      | What are the pieces?        |
| `tetris/board.py`       | What happens when a piece lands? |
| `tetris/controls.py`    | How do my buttons make it move? |
| `tetris/tetris.py`      | How does the whole thing run? (run this one) |

Every file is heavily commented in plain language — read them top to bottom.
The bottom of [tetris/tetris.py](tetris/tetris.py) lists fun things to try
changing (speed, colours, board size, a "next piece" preview, a "ghost", sound).

---

## For maintainers: building & publishing

### Rebuild a game for the browser

Each game folder is built to a static, hostable bundle with pygbag:

```
py -m pip install pygbag
cd tetris
py -m pygbag --build tetris.py
```

This writes the playable files to `tetris/build/web/` (which the menu links to).
To preview locally, run `py -m pygbag tetris.py` (no `--build`) and open
<http://localhost:8000>.

### Add a new game

1. Make a new folder (e.g. `snake/`) with your pygame code. Its main file's game
   loop must be `async` and `await asyncio.sleep(0)` once per frame so the
   browser stays responsive (see `tetris/tetris.py` for the pattern).
2. Build it: `cd snake && py -m pygbag --build snake.py`.
3. Add one card to `index.html` (copy an existing `<a class="card">` block and
   point its `href` at `snake/build/web/index.html`).

### Notes

- `.nojekyll` at the repo root tells GitHub Pages to serve pygbag's
  underscore-prefixed files as-is.
- The `build/web/` folders **are** committed — that's what GitHub Pages serves.
