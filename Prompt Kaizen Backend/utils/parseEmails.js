const XLSX = require('xlsx');

// Hard cap on how many distinct emails a single upload can produce. A
// pathological file (a 2 MB CSV with 100k rows) would otherwise inflate a
// contest's allowedEmails array to a size that makes every `$in` / array
// match query expensive AND blows past the 16MB BSON document limit on the
// Contest doc itself.
const MAX_EMAILS_PER_UPLOAD = Number(process.env.MAX_EMAILS_PER_UPLOAD) || 50000;

/**
 * Parses an uploaded Excel/CSV buffer into a deduplicated, lowercased array
 * of email addresses. The file is assumed to have NO headers — every row's
 * first cell is treated as an email candidate. Stops accepting new emails
 * once MAX_EMAILS_PER_UPLOAD is reached; the caller can surface the cap.
 */
function parseEmailsFromBuffer(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!firstSheet) return { emails: [], skipped: 0, capped: false };

  const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const seen = new Set();
  const emails = [];
  let skipped = 0;
  let capped = false;

  for (const row of rows) {
    if (emails.length >= MAX_EMAILS_PER_UPLOAD) { capped = true; break; }
    // Look in every column of the row for a valid email — tolerates files
    // where the email is not strictly the first column.
    let found = null;
    for (const cell of row) {
      if (cell == null) continue;
      const candidate = String(cell).trim().toLowerCase();
      if (emailRe.test(candidate)) { found = candidate; break; }
    }
    if (found) {
      if (!seen.has(found)) {
        seen.add(found);
        emails.push(found);
      }
    } else if (row.some((c) => String(c || '').trim().length > 0)) {
      // Non-empty row but no email found — counts as skipped.
      skipped += 1;
    }
  }

  return { emails, skipped, capped };
}

module.exports = { parseEmailsFromBuffer, MAX_EMAILS_PER_UPLOAD };
