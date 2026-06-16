"""
controls.py  --  Reading the keyboard and the PS3 controller.

This file answers ONE question: "How do my buttons make the piece move?"

The rest of the game doesn't care HOW you pressed something -- it only wants to
know which MOVE you asked for. So this file turns raw key presses and controller
buttons into simple move names:

    "left", "right", "down", "rotate", "drop", "quit"

The main game (tetris.py) calls read_moves() once per frame and gets back a list
of the moves the player asked for this instant.


----------------------------------------------------------------------
FINDING YOUR PS3 CONTROLLER'S BUTTON NUMBERS
----------------------------------------------------------------------
Every Windows PC reports controller buttons slightly differently, so the numbers
below might not match YOUR controller. To find yours:

  1. Set SHOW_RAW_EVENTS = True (just below).
  2. Run the game and press each button on the controller.
  3. Watch the black terminal window -- it prints the number of every button you
     press, like:  CONTROLLER button pressed: 13
  4. Note which numbers do what you want, then set them in the
     ROTATE_BUTTON / DROP_BUTTON lines below and set SHOW_RAW_EVENTS back to False.

The D-pad (the + shaped pad) is usually read as a "hat" rather than buttons, and
that part normally works the same on every controller, so left/right/down should
just work straight away.
"""

import pygame


# Set this to True while you're hunting for your controller's button numbers.
SHOW_RAW_EVENTS = False

# Which controller buttons do what. These are common defaults; change them to
# match what the SHOW_RAW_EVENTS print tells you about YOUR controller.
ROTATE_BUTTON = 13   # try the X button (the bottom face button) on most pads
DROP_BUTTON = 14     # try the circle button (the right face button)

# The stick can drift a tiny bit even when you're not touching it. We ignore any
# wobble smaller than this so the piece doesn't slide on its own.
STICK_DEADZONE = 0.5


def setup_controller():
    """
    Get the controller ready, if one is plugged in.

    Returns the controller object, or None if there isn't one (in which case the
    game simply runs on the keyboard). We also print what we found so you can see
    it in the terminal.
    """
    pygame.joystick.init()

    if pygame.joystick.get_count() == 0:
        print("No controller found -- you can play with the keyboard.")
        print("  (Arrow keys to move, UP to rotate, SPACE to drop.)")
        return None

    controller = pygame.joystick.Joystick(0)
    controller.init()
    print("Controller connected:", controller.get_name())
    print("  buttons:", controller.get_numbuttons(),
          " axes:", controller.get_numaxes(),
          " hats:", controller.get_numhats())
    return controller


def read_moves(events):
    """
    Look at everything that happened this frame and return the list of moves.

    'events' is the list pygame gives us each frame (key presses, button presses,
    the window's X being clicked, and so on). We walk through them and translate
    the ones we care about into our simple move names.
    """
    moves = []

    for event in events:
        # While hunting for button numbers, print controller activity so you can
        # see exactly what your pad reports.
        if SHOW_RAW_EVENTS:
            if event.type == pygame.JOYBUTTONDOWN:
                print("CONTROLLER button pressed:", event.button)
            elif event.type == pygame.JOYHATMOTION:
                print("CONTROLLER d-pad (hat) moved to:", event.value)

        # --- The window's close (X) button ---
        if event.type == pygame.QUIT:
            moves.append("quit")

        # --- Keyboard keys being pressed down ---
        elif event.type == pygame.KEYDOWN:
            if event.key == pygame.K_LEFT:
                moves.append("left")
            elif event.key == pygame.K_RIGHT:
                moves.append("right")
            elif event.key == pygame.K_DOWN:
                moves.append("down")
            elif event.key == pygame.K_UP:
                moves.append("rotate")
            elif event.key == pygame.K_SPACE:
                moves.append("drop")
            elif event.key == pygame.K_ESCAPE:
                moves.append("quit")

        # --- Controller face buttons (rotate / drop) ---
        elif event.type == pygame.JOYBUTTONDOWN:
            if event.button == ROTATE_BUTTON:
                moves.append("rotate")
            elif event.button == DROP_BUTTON:
                moves.append("drop")

        # --- Controller D-pad (the + pad), read as a "hat" ---
        # A hat reports a direction as (sideways, up_down):
        #   sideways: -1 = left, +1 = right
        #   up_down:  -1 = down, +1 = up
        elif event.type == pygame.JOYHATMOTION:
            sideways, up_down = event.value
            if sideways == -1:
                moves.append("left")
            elif sideways == 1:
                moves.append("right")
            if up_down == -1:
                moves.append("down")

    return moves


def read_left_stick(controller):
    """
    Read the controller's left stick as a steady direction: "left", "right",
    "down", or None.

    Buttons fire once per press, but a stick is something you HOLD. So unlike
    read_moves(), this checks the stick's current position every frame, which
    lets you hold a direction to keep moving. We ignore tiny wobble using the
    deadzone so the piece doesn't drift on its own.
    """
    if controller is None:
        return None

    sideways = controller.get_axis(0)   # left stick: left/right
    up_down = controller.get_axis(1)    # left stick: up/down

    if sideways < -STICK_DEADZONE:
        return "left"
    if sideways > STICK_DEADZONE:
        return "right"
    if up_down > STICK_DEADZONE:
        return "down"
    return None
