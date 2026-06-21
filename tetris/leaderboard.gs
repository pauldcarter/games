/*
leaderboard.gs  --  The shared leaderboard, living in a Google Sheet.

This is NOT part of the game you run. It's a small script that runs on Google's
servers, attached to a Google Sheet. It turns that Sheet into the leaderboard
both versions of the game talk to -- so scores are shared between everyone,
including the web game when it's published on GitHub Pages (which can't run a
server of its own).

----------------------------------------------------------------------
ONE-TIME SETUP (you only do this once)
----------------------------------------------------------------------
1. Make a new Google Sheet (sheets.new). In the very first row, type these
   three headers, one per cell:

        name        score        timestamp

2. In that Sheet, go to:  Extensions -> Apps Script
   This makes the script "bound" to this Sheet -- that's what lets it ask for
   the NARROW permission (just this Sheet) instead of all your spreadsheets.
   Delete whatever's there, and paste in THIS WHOLE FILE.

3. Narrow the permission it will ask for (recommended). In the Apps Script
   editor, click the gear (Project Settings) and tick
   "Show appsscript.json manifest file". Open the appsscript.json that appears
   and add this line inside the top-level { }:

        "oauthScopes": ["https://www.googleapis.com/auth/spreadsheets.currentonly"]

   That ".currentonly" scope is the difference between Google asking to touch
   THIS Sheet vs. ALL your spreadsheets. (You can skip this, but then the
   consent screen asks for the broad access.)

4. Click  Deploy -> New deployment.
     - Click the gear icon -> "Web app".
     - "Execute as":      Me
     - "Who has access":  Anyone           <-- so the game can reach it (see the
                                                README for what this does and does
                                                not expose)
     - Click Deploy. On the consent screen, "This app hasn't been verified" is
       normal for your own script -- click Advanced -> Go to (project), and
       allow it. With step 3 done, it asks only for THIS spreadsheet.

5. Copy the "Web app URL" it gives you (it ends in /exec). Paste that URL into:
     - web/scores.js   (SCRIPT_URL near the top)
     - scores.py       (SCRIPT_URL near the top)

That's it. Reading and writing the leaderboard now go to this Sheet.

----------------------------------------------------------------------
A NOTE ON HOW THE GAME TALKS TO THIS
----------------------------------------------------------------------
Web browsers are fussy about sending data to another website. To keep them
happy, the games POST a new score as plain text (not JSON), and we parse it
here. Reading (GET) just returns JSON. You don't need to worry about this -- the
game files already do the right thing.
*/

// How many scores the leaderboard keeps and returns.
var TOP_N = 10;


function getSheet() {
  // The first tab of the Sheet this script is attached to.
  //
  // We use getActiveSpreadsheet() (the Sheet this script lives INSIDE) rather
  // than opening some Sheet by ID. That choice matters for the permission
  // screen: a script bound to one Sheet can ask Google for the NARROW scope
  // "only the file this app is installed in", instead of the broad "all your
  // spreadsheets". See the README for the one extra step that makes Google
  // request that narrow scope.
  return SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
}


function doGet(e) {
  // "Give me the leaderboard." Returns the top scores as JSON, best first.
  var scores = readScores();
  return jsonReply(scores);
}


function doPost(e) {
  // "Here's a new score." The game sends it as plain text containing JSON, so
  // we parse it ourselves. We add it to the Sheet, then reply with the updated
  // top-N leaderboard so the game can show it straight away.
  var data = {};
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    data = {};
  }

  // Tidy the inputs so one odd request can't put junk on the board.
  var name = String(data.name || "").trim().slice(0, 12) || "Anon";
  var score = parseInt(data.score, 10);
  if (isNaN(score)) {
    score = 0;
  }

  var sheet = getSheet();
  sheet.appendRow([name, score, new Date()]);

  return jsonReply(readScores());
}


function readScores() {
  // Read every row from the Sheet (skipping the header), sort highest-first,
  // and keep just the top handful.
  var rows = getSheet().getDataRange().getValues();

  var scores = [];
  // Start at 1 to skip the header row.
  for (var i = 1; i < rows.length; i++) {
    var name = rows[i][0];
    var score = rows[i][1];
    if (name === "" && score === "") {
      continue;  // skip blank rows
    }
    scores.push({ name: String(name), score: Number(score) || 0 });
  }

  scores.sort(function (a, b) { return b.score - a.score; });
  return scores.slice(0, TOP_N);
}


function jsonReply(data) {
  // Send a JavaScript value back as JSON.
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
