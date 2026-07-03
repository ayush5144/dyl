/**
 * dyl — Google Sheets lead sync (Apps Script web app)
 *
 * Paste this into Extensions → Apps Script in your leads Google Sheet,
 * then Deploy → New deployment → Web app (execute as Me, access: Anyone)
 * and put the /exec URL into dyl's settings.
 *
 * GET  → returns the lead table as JSON (skips any title rows above the
 *        header row; the header row is found by its "Name" column).
 * POST → { row: <sheet row number>, updates: { "Column Name": value } }
 *        writes cell values; creates missing columns automatically.
 */

function findHeader_(sh) {
  var lastCol = sh.getLastColumn();
  var scan = Math.min(10, sh.getLastRow());
  if (!lastCol || !scan) return null;
  var rows = sh.getRange(1, 1, scan, lastCol).getDisplayValues();
  for (var i = 0; i < rows.length; i++) {
    var cells = rows[i].map(function (c) { return String(c).trim(); });
    var hasName = cells.some(function (c) { return /^name$/i.test(c); });
    var hasPhone = cells.some(function (c) { return /mobile|phone|number/i.test(c); });
    if (hasName && hasPhone) return { row: i + 1, headers: cells };
  }
  return null;
}

function leadSheet_() {
  var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (findHeader_(sheets[i])) return sheets[i];
  }
  return null;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function doGet() {
  var sh = leadSheet_();
  if (!sh) return json_({ error: 'No sheet with a Name + phone header row found' });
  var h = findHeader_(sh);
  var lastRow = sh.getLastRow();
  var leads = [];
  if (lastRow > h.row) {
    var data = sh
      .getRange(h.row + 1, 1, lastRow - h.row, h.headers.length)
      .getDisplayValues();
    for (var i = 0; i < data.length; i++) {
      var lead = { _row: h.row + 1 + i };
      var empty = true;
      for (var j = 0; j < h.headers.length; j++) {
        if (!h.headers[j]) continue;
        lead[h.headers[j]] = data[i][j];
        if (data[i][j] !== '') empty = false;
      }
      if (!empty) leads.push(lead);
    }
  }
  return json_({
    headers: h.headers.filter(function (x) { return x; }),
    leads: leads
  });
}

function doPost(e) {
  var body = JSON.parse(e.postData.contents);
  var sh = leadSheet_();
  if (!sh) return json_({ error: 'No sheet with a Name + phone header row found' });
  var h = findHeader_(sh);
  var row = Number(body.row);
  if (!row || row <= h.row || row > sh.getLastRow()) {
    return json_({ error: 'Invalid row: ' + body.row });
  }
  var updates = body.updates || {};
  for (var key in updates) {
    var col = h.headers.indexOf(key) + 1;
    if (!col) {
      col = sh.getLastColumn() + 1;
      sh.getRange(h.row, col).setValue(key);
      h.headers.push(key);
    }
    sh.getRange(row, col).setValue(updates[key]);
  }
  return json_({ ok: true });
}
