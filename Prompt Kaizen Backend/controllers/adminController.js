const XLSX = require('xlsx');
const User = require('../models/User');
const PromptEvaluation = require('../models/PromptEvaluation');
const ContestSubmission = require('../models/ContestSubmission');
const Contest = require('../models/Contest');

// Safety caps for unbounded admin reads. Aggregations would be cleaner long
// term, but capping the find() result preserves the current response shape
// (no frontend changes needed) while preventing a single request from sweeping
// hundreds of thousands of docs as the platform grows.
const ADMIN_STATS_PROMPT_SAMPLE = 10000;
const ADMIN_LIST_LIMIT = 1000;

const stats = async (req, res) => {
  try {
    const [totalUsers, totalPrompts, all] = await Promise.all([
      User.countDocuments(),
      PromptEvaluation.countDocuments(),
      // Sample the most recent N prompts for the platform-wide aggregates
      // shown on the admin dashboard. Average + per-category counts are
      // representative; for an exact full-history total, use countDocuments.
      PromptEvaluation.find({}, 'overallScore category createdAt')
        .sort({ createdAt: -1 })
        .limit(ADMIN_STATS_PROMPT_SAMPLE)
        .lean(),
    ]);

    const averagePlatformScore = all.length
      ? Math.round((all.reduce((a, b) => a + (b.overallScore || 0), 0) / all.length) * 10) / 10
      : 0;

    const categoryCount = {};
    for (const it of all) {
      categoryCount[it.category] = (categoryCount[it.category] || 0) + 1;
    }

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .select('-password')
      .lean();

    const recentPrompts = await PromptEvaluation.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name email')
      .lean();

    return res.json({
      totalUsers,
      totalPrompts,
      averagePlatformScore,
      categoryCount,
      recentUsers,
      recentPrompts,
    });
  } catch (err) {
    console.error('admin stats error:', err);
    return res.status(500).json({ message: 'Failed to load admin stats.' });
  }
};

const listUsers = async (req, res) => {
  try {
    const users = await User.find()
      .sort({ createdAt: -1 })
      .limit(ADMIN_LIST_LIMIT)
      .select('-password')
      .lean();
    return res.json({ users });
  } catch (err) {
    console.error('admin listUsers error:', err);
    return res.status(500).json({ message: 'Failed to list users.' });
  }
};

const listPrompts = async (req, res) => {
  try {
    const prompts = await PromptEvaluation.find()
      .sort({ createdAt: -1 })
      .limit(ADMIN_LIST_LIMIT)
      .populate('userId', 'name email')
      .lean();
    return res.json({ prompts });
  } catch (err) {
    console.error('admin listPrompts error:', err);
    return res.status(500).json({ message: 'Failed to list prompts.' });
  }
};

/**
 * Parse an uploaded Excel/CSV buffer where each row is
 * `[name, email, password]` with no header row.
 * Returns { rows: [...valid], skipped: [...rejected-with-reason] }.
 */
const parseUsersFromBuffer = (buffer) => {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const rows = [];
  const skipped = [];
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: '' });
    for (let i = 0; i < grid.length; i++) {
      const row = grid[i] || [];
      const name = String(row[0] ?? '').trim();
      const email = String(row[1] ?? '').trim().toLowerCase();
      const password = String(row[2] ?? '');
      if (!name && !email && !password) continue; // blank line
      if (!name || !email || !password) {
        skipped.push({ row: i + 1, reason: 'Missing name, email, or password.' });
        continue;
      }
      if (password.length < 6) {
        skipped.push({ row: i + 1, email, reason: 'Password must be at least 6 characters.' });
        continue;
      }
      rows.push({ name, email, password });
    }
  }
  return { rows, skipped };
};

const bulkUploadUsers = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }
    const { rows, skipped } = parseUsersFromBuffer(req.file.buffer);

    // De-dup against existing emails in DB and within the file itself.
    const incomingEmails = Array.from(new Set(rows.map((r) => r.email)));
    const existing = await User.find({ email: { $in: incomingEmails } }, 'email').lean();
    const existingSet = new Set(existing.map((u) => u.email));

    const created = [];
    const duplicates = [];
    const seenInFile = new Set();

    for (const r of rows) {
      if (existingSet.has(r.email) || seenInFile.has(r.email)) {
        duplicates.push(r.email);
        continue;
      }
      seenInFile.add(r.email);
      try {
        const user = await User.create({ name: r.name, email: r.email, password: r.password });
        created.push({ _id: user._id, name: user.name, email: user.email });
      } catch (err) {
        skipped.push({ email: r.email, reason: err?.message || 'Failed to create.' });
      }
    }

    return res.json({
      parsed: rows.length,
      created: created.length,
      skippedDuplicates: duplicates.length,
      skippedInvalid: skipped.length,
      total: created.length,
      details: { created, duplicates, skipped },
    });
  } catch (err) {
    console.error('bulkUploadUsers error:', err);
    return res.status(500).json({ message: 'Failed to parse the uploaded file.' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (String(req.user._id) === String(id)) {
      return res.status(400).json({ message: 'You cannot delete your own account.' });
    }
    const target = await User.findById(id);
    if (!target) return res.status(404).json({ message: 'User not found.' });
    if (target.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete an admin account.' });
    }
    await Promise.all([
      PromptEvaluation.deleteMany({ userId: target._id }),
      ContestSubmission.deleteMany({ userId: target._id }),
      // Strip the deleted user's email from every contest's allowlist so a
      // future re-onboarding under the same email doesn't silently inherit
      // eligibility for old contests, and so the address doesn't linger as
      // PII on contest documents.
      Contest.updateMany(
        { allowedEmails: target.email },
        { $pull: { allowedEmails: target.email } }
      ),
    ]);
    await target.deleteOne();
    return res.json({ message: 'User deleted.' });
  } catch (err) {
    console.error('deleteUser error:', err);
    return res.status(500).json({ message: 'Failed to delete user.' });
  }
};

const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body || {};
    if (!password || String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }
    const user = await User.findById(id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Block resetting another admin's password — that would let any admin
    // silently lock out a peer (including the seeded operator). An admin can
    // still rotate their own password via this endpoint.
    if (user.role === 'admin' && String(user._id) !== String(req.user._id)) {
      return res.status(403).json({
        message: 'You cannot reset another administrator\'s password.',
      });
    }

    user.password = String(password); // pre-save hook re-hashes
    await user.save();

    // Audit log — destructive admin action. Until a dedicated audit collection
    // exists, write to console so the line lands in the host's log stream.
    console.warn(
      `[ADMIN AUDIT] password reset: actor=${req.user.email} (${req.user._id}) ` +
      `target=${user.email} (${user._id}) at=${new Date().toISOString()}`
    );

    return res.json({ message: 'Password reset.' });
  } catch (err) {
    console.error('resetUserPassword error:', err);
    return res.status(500).json({ message: 'Failed to reset password.' });
  }
};

/**
 * Streams an .xlsx of every user's Name + Email back to the browser as a
 * file download. Used by the admin "Export users" button alongside Bulk
 * upload — the two are symmetric: the export's column shape (Name, Email)
 * matches the bulk-upload parser, so the file can in principle be re-used
 * to top up another deployment.
 */
const exportUsers = async (req, res) => {
  try {
    const users = await User.find()
      .sort({ createdAt: -1 })
      .select('name email')
      .lean();

    const rows = [
      ['Name', 'Email'],
      ...users.map((u) => [u.name || '', u.email || '']),
    ];

    const sheet = XLSX.utils.aoa_to_sheet(rows);
    // Reasonable starting column widths so the file is legible without manual
    // resizing in Excel / Numbers / Sheets.
    sheet['!cols'] = [{ wch: 24 }, { wch: 36 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Users');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Filename includes the IST date so multiple exports don't overwrite each
    // other in the operator's Downloads folder.
    const istNow = new Date(Date.now() + 330 * 60 * 1000);
    const stamp =
      istNow.getUTCFullYear() + '-' +
      String(istNow.getUTCMonth() + 1).padStart(2, '0') + '-' +
      String(istNow.getUTCDate()).padStart(2, '0');
    const filename = `prompt-kaizen-users-${stamp}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    return res.end(buffer);
  } catch (err) {
    console.error('exportUsers error:', err);
    return res.status(500).json({ message: 'Failed to export users.' });
  }
};

module.exports = {
  stats,
  listUsers,
  listPrompts,
  bulkUploadUsers,
  exportUsers,
  deleteUser,
  resetUserPassword,
};
