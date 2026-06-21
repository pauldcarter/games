/*
scores.js  --  Talking to the leaderboard. (Browser twin of scores.py)

The game doesn't want to worry about the details of sending web requests, so
this file answers two questions for it:

    getTopScores()        -> "what's the leaderboard right now?"
    submitScore(name, n)  -> "save this result, and give me the new leaderboard"

The scores are STORED in a Google Sheet (so it works even when the game is
published on GitHub Pages, which can't run a server of its own). But the
leaderboard is still DRAWN inside the game -- these functions just fetch the rows
and hand them back; tetris.js renders them on the Game Over screen as before.

Behind the scenes these talk to a Google Apps Script attached to that Sheet.
See leaderboard.gs for the one-time setup, then paste the script's URL below.
If the script can't be reached, each function quietly hands back an empty list,
so the game plays fine and just shows an empty board.
*/


// PASTE YOUR GOOGLE APPS SCRIPT URL HERE (it ends in /exec). See leaderboard.gs
// for how to get it. Until you do, the leaderboard simply shows empty.
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyegwGhaglS0kHpb6_pNVAEQKOe0StvxZl0lLih-uRTJhH4L-OKXubQyZT21Ck8oy7nFg/exec";


async function getTopScores() {
  // Ask the Sheet for the leaderboard. Returns an array like
  // [{ name: "Sam", score: 1200 }, ...], best first, or [] if unreachable.
  if (!SCRIPT_URL || SCRIPT_URL.indexOf("PASTE_") === 0) {
    return [];
  }
  try {
    const response = await fetch(SCRIPT_URL);
    if (!response.ok) {
      return [];
    }
    return await response.json();
  } catch (err) {
    // No connection (or setup not done yet) -- carry on with an empty board.
    return [];
  }
}


async function submitScore(name, score) {
  // Send a finished score to the Sheet and get the updated leaderboard back.
  // Returns [] if it can't be reached (the score just isn't saved).
  //
  // We send the body as plain text (not application/json) on purpose: that makes
  // it a "simple" request the browser sends straight away. A JSON content-type
  // would trigger a CORS preflight that Google Apps Script can't answer, and the
  // POST would fail. The script parses the text back into JSON on its end.
  if (!SCRIPT_URL || SCRIPT_URL.indexOf("PASTE_") === 0) {
    return [];
  }
  try {
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ name, score }),
    });
    if (!response.ok) {
      return [];
    }
    return await response.json();
  } catch (err) {
    return [];
  }
}
