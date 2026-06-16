"""
tetris.py  --  The main game. THIS is the file you run.

    Run it with:   py tetris.py

This file is the "heartbeat" of the game. It reads a bit like a table of
contents: it borrows the pieces from shapes.py, the grid rules from board.py,
and the controls from controls.py, then runs the loop that ties them together.

The "game loop" at the bottom is the heart of nearly every video game. It just
repeats this, about 60 times a second, forever:

    1. See what the player pressed
    2. Move things / update the game
    3. Draw everything on screen
    4. Repeat

Read it top to bottom and you'll see the whole game.
"""

import pygame
import random

import shapes
import board as board_module
import controls


# =====================================================================
# SETTINGS  --  the numbers you can tweak. Change them and re-run!
# =====================================================================
COLUMNS = 10            # how many cells wide the playing field is
ROWS = 20               # how many cells tall it is
CELL_SIZE = 30          # how big each cell is on screen, in pixels

SIDEBAR_WIDTH = 150     # room on the right for the score text

# The piece falls one step every so many seconds. It starts gentle and speeds
# up a little as you play (see the difficulty ramp below), so the opening is
# relaxed and it gets harder the longer you survive.
START_FALL_SPEED = 0.8    # seconds between steps at the very start
                          # (bigger = slower = easier. Try 1.0!)
SPEED_UP_EVERY = 20       # after this many pieces land, speed up a bit
SPEED_UP_FACTOR = 0.9     # each speed-up makes it 10% quicker (x0.9)
FASTEST_FALL_SPEED = 0.1  # never get quicker than this, however long you last

# Colours used for the screen itself (Red, Green, Blue).
BLACK = (0, 0, 0)
GREY = (40, 40, 40)
WHITE = (255, 255, 255)
PLAY_BG = (30, 30, 36)   # the playfield's grey background, so the play area
                         # stands apart from the score sidebar
GHOST = (120, 120, 130)  # the "ghost" outline showing where a piece will land

# Work out the window size from the settings above.
PLAY_WIDTH = COLUMNS * CELL_SIZE
WINDOW_WIDTH = PLAY_WIDTH + SIDEBAR_WIDTH
WINDOW_HEIGHT = ROWS * CELL_SIZE


# =====================================================================
# DRAWING  --  small helpers that put things on the screen.
# =====================================================================

def draw_cell(screen, col, row, colour):
    """Draw one filled square at grid position (col, row)."""
    x = col * CELL_SIZE
    y = row * CELL_SIZE
    rectangle = (x, y, CELL_SIZE, CELL_SIZE)
    pygame.draw.rect(screen, colour, rectangle)
    # A thin dark border makes the individual blocks easy to see.
    pygame.draw.rect(screen, BLACK, rectangle, 2)


def draw_board(screen, board):
    """Draw every block that has already landed on the board."""
    for row_index, row in enumerate(board):
        for col_index, colour in enumerate(row):
            if colour is not None:
                draw_cell(screen, col_index, row_index, colour)


def draw_piece(screen, piece, x, y, colour):
    """Draw the piece the player is currently steering."""
    for row_index, row in enumerate(piece):
        for col_index, filled in enumerate(row):
            if filled:
                draw_cell(screen, x + col_index, y + row_index, colour)


def draw_grid_lines(screen):
    """Faint grid lines so you can judge where pieces will fall."""
    for col in range(COLUMNS + 1):
        pygame.draw.line(screen, GREY, (col * CELL_SIZE, 0),
                         (col * CELL_SIZE, WINDOW_HEIGHT))
    for row in range(ROWS + 1):
        pygame.draw.line(screen, GREY, (0, row * CELL_SIZE),
                         (PLAY_WIDTH, row * CELL_SIZE))


def draw_text(screen, font, text, x, y):
    """Write a line of text on the screen at pixel position (x, y)."""
    image = font.render(text, True, WHITE)
    screen.blit(image, (x, y))


def drop_y(board, piece, x, y):
    """
    Work out how far down a piece would fall from (x, y) before it lands.

    We step it down one row at a time until the next step would collide, and
    return that resting row. Used for both the "ghost" and the hard drop.
    """
    while not board_module.check_collision(board, piece, x, y + 1):
        y += 1
    return y


def draw_ghost(screen, board, piece, x, y):
    """
    Draw a faint outline where the current piece will land if you drop it, so
    you can see where it's going. Same shape, just a thin border with no fill.
    """
    landing_y = drop_y(board, piece, x, y)
    for row_index, row in enumerate(piece):
        for col_index, filled in enumerate(row):
            if filled:
                px = (x + col_index) * CELL_SIZE
                py = (landing_y + row_index) * CELL_SIZE
                rectangle = (px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2)
                pygame.draw.rect(screen, GHOST, rectangle, 2)


def draw_mini_piece(screen, piece, colour, x, y):
    """
    Draw a small version of a piece in the sidebar (used for the "next" box).
    x, y are the top-left pixel position; cells are a bit smaller than the
    board's so a 4-wide piece fits the sidebar neatly.
    """
    mini = 20
    for row_index, row in enumerate(piece):
        for col_index, filled in enumerate(row):
            if filled:
                px = x + col_index * mini
                py = y + row_index * mini
                pygame.draw.rect(screen, colour, (px, py, mini, mini))
                pygame.draw.rect(screen, BLACK, (px, py, mini, mini), 2)


# =====================================================================
# HELPERS for making and placing pieces.
# =====================================================================

def new_piece():
    """
    Pick a random shape and return everything we need to track it:
    its grid, its colour, and a starting position near the top middle.
    """
    piece, colour = random.choice(shapes.SHAPES)
    # Start it roughly centred along the top.
    x = COLUMNS // 2 - len(piece[0]) // 2
    y = 0
    return piece, colour, x, y


# =====================================================================
# THE GAME LOOP  --  the heartbeat that ties everything together.
# =====================================================================

def main():
    pygame.init()
    screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
    pygame.display.set_caption("Tetris")
    clock = pygame.time.Clock()
    font = pygame.font.SysFont("consolas", 24)

    controller = controls.setup_controller()

    # --- Set up a fresh game ---
    board = board_module.make_empty_board(COLUMNS, ROWS)
    piece, colour, piece_x, piece_y = new_piece()
    # The piece waiting after the current one -- shown in the "NEXT" box so you
    # can plan ahead.
    next_piece = new_piece()
    score = 0
    game_over = False

    # How fast pieces fall right now, and how many have landed so far. Every
    # SPEED_UP_EVERY pieces we make fall_speed a little smaller (quicker).
    fall_speed = START_FALL_SPEED
    pieces_locked = 0

    # A timer that counts up; when it passes fall_speed, the piece steps down.
    fall_timer = 0.0

    # The left stick is something you HOLD, so we slow it down a little, otherwise
    # the piece would zoom across the board too fast to control.
    stick_timer = 0.0
    STICK_REPEAT = 0.12  # seconds between stick-driven moves while held

    running = True
    while running:
        # clock.tick(60) waits so the loop runs ~60 times a second, and tells us
        # how many seconds passed since last time (we use that for the timers).
        delta_seconds = clock.tick(60) / 1000.0

        # ----- 1. SEE WHAT THE PLAYER PRESSED -----
        events = pygame.event.get()
        moves = controls.read_moves(events)

        # The held left stick is checked separately, on its own little timer.
        stick_timer += delta_seconds
        if stick_timer >= STICK_REPEAT:
            stick_direction = controls.read_left_stick(controller)
            if stick_direction is not None:
                moves.append(stick_direction)
                stick_timer = 0.0

        # ----- 2. UPDATE THE GAME based on those moves -----
        for move in moves:
            if move == "quit":
                running = False

            elif game_over:
                # While the "Game Over" screen is up, the drop button restarts.
                if move == "drop":
                    board = board_module.make_empty_board(COLUMNS, ROWS)
                    piece, colour, piece_x, piece_y = new_piece()
                    next_piece = new_piece()
                    score = 0
                    game_over = False
                    # Start a fresh game back at the gentle opening speed.
                    fall_speed = START_FALL_SPEED
                    pieces_locked = 0

            elif move == "left":
                # Try moving left; only keep it if nothing's in the way.
                if not board_module.check_collision(board, piece, piece_x - 1, piece_y):
                    piece_x -= 1

            elif move == "right":
                if not board_module.check_collision(board, piece, piece_x + 1, piece_y):
                    piece_x += 1

            elif move == "down":
                # Soft drop: nudge it down one extra step if it fits.
                if not board_module.check_collision(board, piece, piece_x, piece_y + 1):
                    piece_y += 1

            elif move == "rotate":
                # Spin it. If the spun version doesn't fit where it is (for
                # example it's flush against a wall and the rotation would poke
                # through it), try nudging it a step or two sideways to make
                # room -- this is the classic Tetris "wall kick". We try no
                # nudge first, then left 1, right 1, left 2, right 2. If none
                # fit, keep the old piece.
                rotated = board_module.rotate(piece)
                for kick in (0, -1, 1, -2, 2):
                    if not board_module.check_collision(board, rotated, piece_x + kick, piece_y):
                        piece = rotated
                        piece_x += kick
                        break

            elif move == "drop":
                # Hard drop: fall straight down until something stops us.
                while not board_module.check_collision(board, piece, piece_x, piece_y + 1):
                    piece_y += 1

        # ----- Gravity: make the piece fall on its own over time -----
        if not game_over:
            fall_timer += delta_seconds
            if fall_timer >= fall_speed:
                fall_timer = 0.0
                if not board_module.check_collision(board, piece, piece_x, piece_y + 1):
                    piece_y += 1
                else:
                    # The piece can't fall any more -> lock it into the board.
                    board_module.lock_piece(board, piece, piece_x, piece_y, colour)

                    # Clear any full rows and score them. Clearing more rows at
                    # once is worth more points (1->100, 2->300, 3->500, 4->800).
                    cleared = board_module.clear_full_rows(board)
                    points = {0: 0, 1: 100, 2: 300, 3: 500, 4: 800}
                    score += points.get(cleared, 800)

                    # Difficulty ramp: count this landed piece, and every
                    # SPEED_UP_EVERY pieces make the fall a little quicker (down
                    # to a floor so it never becomes impossible).
                    pieces_locked += 1
                    if pieces_locked % SPEED_UP_EVERY == 0:
                        fall_speed = max(FASTEST_FALL_SPEED, fall_speed * SPEED_UP_FACTOR)

                    # Bring in the piece that was waiting in "NEXT", then roll a
                    # fresh one to wait behind it.
                    piece, colour, piece_x, piece_y = next_piece
                    next_piece = new_piece()

                    # If the brand-new piece already overlaps something, the stack
                    # has reached the top -- that's game over.
                    if board_module.check_collision(board, piece, piece_x, piece_y):
                        game_over = True

        # ----- 3. DRAW EVERYTHING -----
        # Fill everything black (the sidebar's colour), then paint the play
        # area grey so it clearly stands apart from the score sidebar.
        screen.fill(BLACK)
        pygame.draw.rect(screen, PLAY_BG, (0, 0, PLAY_WIDTH, WINDOW_HEIGHT))
        draw_grid_lines(screen)
        draw_board(screen, board)
        if not game_over:
            # Draw the faint "ghost" first (where the piece will land), then the
            # real piece on top of it.
            draw_ghost(screen, board, piece, piece_x, piece_y)
            draw_piece(screen, piece, piece_x, piece_y, colour)

        # Sidebar text on the right.
        draw_text(screen, font, "SCORE", PLAY_WIDTH + 20, 20)
        draw_text(screen, font, str(score), PLAY_WIDTH + 20, 50)

        # The "level" is just how many times we've sped up so far, plus one (so
        # you start on level 1). It goes up every SPEED_UP_EVERY pieces -- the
        # same moment the game gets a little faster.
        level = pieces_locked // SPEED_UP_EVERY + 1
        draw_text(screen, font, "LEVEL", PLAY_WIDTH + 20, 100)
        draw_text(screen, font, str(level), PLAY_WIDTH + 20, 130)

        # The "NEXT" box: a little preview of the piece coming up.
        next_grid, next_colour, _, _ = next_piece
        draw_text(screen, font, "NEXT", PLAY_WIDTH + 20, 180)
        draw_mini_piece(screen, next_grid, next_colour, PLAY_WIDTH + 20, 215)

        if game_over:
            draw_text(screen, font, "GAME", PLAY_WIDTH + 20, 360)
            draw_text(screen, font, "OVER", PLAY_WIDTH + 20, 390)
            draw_text(screen, font, "drop =", PLAY_WIDTH + 20, 450)
            draw_text(screen, font, "restart", PLAY_WIDTH + 20, 480)

        # Show everything we just drew (pygame draws to a hidden page, then flips
        # it onto the screen all at once so it looks smooth).
        pygame.display.flip()

    pygame.quit()


# This line means: only run the game if THIS file was the one started.
if __name__ == "__main__":
    main()