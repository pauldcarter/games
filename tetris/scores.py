"""
scores.py  --  Talking to the leaderboard from the Python game.

The Python game (tetris.py) doesn't want to worry about the details of sending
web requests. So this file answers two questions for it:

    get_top_scores()      -> "what's the leaderboard right now?"
    submit_score(name, n) -> "save this result, and give me the new leaderboard"

The scores are STORED in a Google Sheet, the same one the web game uses, so the
desktop game and the web game share a single leaderboard. But the leaderboard is
still DRAWN inside the game -- these functions just fetch the rows and hand them
back; tetris.py renders them on the Game Over screen.

Behind the scenes these talk to a Google Apps Script attached to that Sheet.
See leaderboard.gs for the one-time setup, then paste the script's URL below.
If the script can't be reached, each function returns an empty list, so the game
carries on happily and just shows an empty board.

This uses only Python's built-in tools (urllib), so there's nothing to install.
"""

import json
import urllib.request
import urllib.error


# PASTE YOUR GOOGLE APPS SCRIPT URL HERE (it ends in /exec). See leaderboard.gs
# for how to get it. It's the SAME url you paste into web/scores.js. Until you
# set it, the leaderboard simply shows empty.
SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyegwGhaglS0kHpb6_pNVAEQKOe0StvxZl0lLih-uRTJhH4L-OKXubQyZT21Ck8oy7nFg/exec"

# How long to wait for the server before giving up, in seconds. Kept short so a
# slow or missing connection never freezes the game for long.
TIMEOUT = 3.0


def _is_configured():
    """True once a real Apps Script URL has been pasted in above."""
    return bool(SCRIPT_URL) and not SCRIPT_URL.startswith("PASTE_")


def get_top_scores():
    """
    Ask the Sheet for the leaderboard.

    Returns a list like [{"name": "Sam", "score": 1200}, ...], best first. If the
    script can't be reached (or isn't set up yet), returns an empty list so the
    game carries on happily.
    """
    if not _is_configured():
        return []
    try:
        with urllib.request.urlopen(SCRIPT_URL, timeout=TIMEOUT) as response:
            return json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, OSError, json.JSONDecodeError):
        return []


def submit_score(name, score):
    """
    Send a finished score to the Sheet, and get the updated leaderboard back.

    We send the body as plain text (not application/json) to match the web game
    and keep Google Apps Script happy. urllib follows the redirect Apps Script
    issues automatically. Returns an empty list if it can't be reached (the score
    simply isn't saved, and the game keeps working).
    """
    if not _is_configured():
        return []
    payload = json.dumps({"name": name, "score": score}).encode("utf-8")
    request = urllib.request.Request(
        SCRIPT_URL,
        data=payload,
        headers={"Content-Type": "text/plain;charset=utf-8"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
            return json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, OSError, json.JSONDecodeError):
        return []
