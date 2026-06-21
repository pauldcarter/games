# Tetris

A small, readable Tetris built twice from the same design:

- **Desktop (Python + pygame):** run `py tetris.py`
- **Web (HTML + JavaScript):** open `web/index.html` in a browser, or publish the
  `web/` folder to GitHub Pages

Both versions share a single **leaderboard** stored in a Google Sheet, so a score
set in one shows up in the other. The leaderboard is *displayed inside the game*
(on the Game Over screen, with your row highlighted) — the Sheet is only where
the scores are kept.

## Files

| File | What it is |
|---|---|
| `tetris.py` | The desktop game (run this). |
| `board.py`, `shapes.py`, `controls.py` | The desktop game's grid rules, pieces, and input. |
| `scores.py` | Desktop client for the leaderboard (talks to the Google Sheet). |
| `web/index.html` | The web game's page (open or publish this). |
| `web/tetris.js`, `web/board.js`, `web/shapes.js`, `web/controls.js` | The web game. |
| `web/scores.js` | Web client for the leaderboard (talks to the Google Sheet). |
| `leaderboard.gs` | The Google Apps Script you paste into your Sheet (see setup below). |

## Running

**Desktop:**

```
pip install -r requirements.txt
py tetris.py
```

**Web (locally):** open `web/index.html` in a browser. (Any static file server
works too, but it isn't required.)

**Web (published):** put the contents of `web/` on GitHub Pages — it's all static
files, so Pages serves it directly. The leaderboard still works because the
scores live in Google's Sheet, not on a server you'd have to host.

> **After you edit any `web/*.js` file, bump the cache-buster.** Browsers (and
> Pages) cache the old scripts, so a change can look like it "did nothing" until
> a hard-refresh. In `web/index.html` the `<script>` tags end in `?v=2` — change
> every one to the next number (`?v=3`, etc.) when you push JS changes, and
> visitors get the fresh files automatically without needing to hard-refresh.

## Leaderboard setup (one-time)

The leaderboard is stored in a Google Sheet via a small Google Apps Script. You
set this up once, then paste one URL into two files.

1. **Make a Sheet.** Go to <https://sheets.new>. In the very first row, type these
   three headers, one per cell:

   | name | score | timestamp |
   |------|-------|-----------|

2. **Add the script.** In that Sheet: **Extensions → Apps Script**. Delete
   anything that's there and paste in the whole of [`leaderboard.gs`](leaderboard.gs).
   Adding it from *inside* the Sheet matters — it "binds" the script to this one
   Sheet, which is what lets it ask for the narrow permission in the next step.

3. **Narrow the permission (recommended).** In the Apps Script editor, click the
   gear (**Project Settings**) and tick **“Show appsscript.json manifest file”**.
   Open the `appsscript.json` that appears and add this line inside the top‑level
   `{ }`:

   ```json
   "oauthScopes": ["https://www.googleapis.com/auth/spreadsheets.currentonly"]
   ```

   This is the difference between Google asking for *“see, edit, create and delete
   **all** your spreadsheets”* and the much narrower *“only the **current**
   spreadsheet this app is in.”* See [About the scary consent screen](#about-the-scary-consent-screen)
   below.

4. **Deploy it as a Web App.** Click **Deploy → New deployment**:
   - Click the gear icon → **Web app**.
   - **Execute as:** Me
   - **Who has access:** **Anyone** ← required, so the game can reach it
   - Click **Deploy**. On the consent screen, *“This app hasn’t been verified”*
     is normal for your own script → **Advanced → Go to (project)** → allow.
   - Copy the **Web app URL** (it ends in `/exec`).

5. **Paste the URL into both clients.** Replace `PASTE_YOUR_APPS_SCRIPT_URL_HERE`
   with that URL in:
   - [`web/scores.js`](web/scores.js) → `SCRIPT_URL`
   - [`scores.py`](scores.py) → `SCRIPT_URL`

That's it. Until you do step 5, the game runs fine but the leaderboard just shows
empty.

### If you edit `leaderboard.gs` later

Apps Script doesn't pick up edits automatically. After changing the script,
either create a **new deployment version**, or go to **Manage deployments**, edit
the existing one, and bump its version. (You can keep the same URL by editing the
existing deployment rather than making a brand-new one.)

## About the scary consent screen

When you first deploy, Google shows two alarming-looking things. Here's what they
actually mean:

- **“This app hasn’t been verified by Google.”** This appears for *every* personal
  Apps Script. Google only "verifies" apps published publicly to lots of users —
  your own little script in your own account is never verified, and that's fine.
  Click **Advanced → Go to (project)** to continue.

- **“See, edit, create, and delete all your Google Sheets spreadsheets.”** This is
  the one worth fixing. It's broad because, without the manifest line from step 3,
  Apps Script requests access to *all* your spreadsheets by default. Adding
  `"oauthScopes": [".../auth/spreadsheets.currentonly"]` narrows it to **only this
  one Sheet** — the consent screen then reads *“only the current spreadsheet.”*
  Always keep this leaderboard in its **own** Sheet, separate from anything
  private, so even that narrow access only ever touches scores.

The script itself only ever does two things: read the rows, and append a row. It
can't open the Sheet for visitors, read other tabs, or reach any other file.

### What “Who has access: Anyone” does and doesn’t expose

- **Does:** let anyone who has the `/exec` URL call the two functions — read the
  top scores, and append a score row.
- **Does *not*:** share your Sheet, its URL, your Drive, or your account. Visitors
  can't open or even see the spreadsheet; they can only get the JSON the script
  returns.

## Notes / limitations

- **It's public and trust-based.** "Who has access: Anyone" plus the URL shipping
  in the public web JS means anyone with the URL can post a score. That's fine for
  friends and family; it is **not** tamper-proof. (If that matters later, a shared
  secret token checked in `doPost` raises the bar — ask and I'll add it.)
- **Offline is fine.** If the Sheet can't be reached (no internet, URL not set
  yet), both games carry on normally and simply show an empty leaderboard — they
  never hang or crash on it.
- **Why `text/plain` for posting:** the games send new scores as plain text on
  purpose. A JSON content-type would trigger a browser CORS preflight that Google
  Apps Script can't answer; plain text avoids it. The script parses the text back
  into JSON on its end.
