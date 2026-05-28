const User = require('../models/User');
const { istMidnightToday, isSameIstDay } = require('./dailyChallenge');

const DICTATION_DAILY_LIMIT = Number(process.env.DICTATION_DAILY_LIMIT) || 3;

/**
 * Returns the user's effective dictation usage for the current IST day, with
 * the per-day counter virtually reset if their last use was on a previous day.
 * Read-only helper — no DB writes.
 *
 * { limit, usedToday, remainingToday }
 */
function getDictationStatus(user) {
  const today = istMidnightToday();
  const sameDay = isSameIstDay(user?.dictationUsedDate, today);
  const usedToday = sameDay ? (user?.dictationsUsedToday || 0) : 0;
  return {
    limit: DICTATION_DAILY_LIMIT,
    usedToday,
    remainingToday: Math.max(0, DICTATION_DAILY_LIMIT - usedToday),
  };
}

/**
 * Atomically increments the user's dictation counter for today and persists
 * the change in a single MongoDB round-trip. Handles three cases in one
 * conditional update:
 *
 *   - Never dictated before / last dictation was on a previous IST day:
 *     reset counter to 1 and stamp today's date.
 *   - Last dictation is today and counter < limit: increment counter, keep date.
 *   - Last dictation is today and counter == limit: filter doesn't match →
 *     throws DICTATION_LIMIT_REACHED.
 *
 * No more "increment in memory then save() best-effort" — the old pattern
 * silently lost counter increments if the save failed, and could double-tick
 * under concurrent requests. This version is race-safe and never drifts.
 */
async function consumeDictation(userId) {
  const today = istMidnightToday();

  const result = await User.findOneAndUpdate(
    {
      _id: userId,
      $or: [
        { dictationUsedDate: null },
        { dictationUsedDate: { $lt: today } },
        {
          dictationUsedDate: { $gte: today },
          dictationsUsedToday: { $lt: DICTATION_DAILY_LIMIT },
        },
      ],
    },
    [
      {
        $set: {
          dictationsUsedToday: {
            $cond: [
              { $gte: ['$dictationUsedDate', today] },
              { $add: [{ $ifNull: ['$dictationsUsedToday', 0] }, 1] },
              1,
            ],
          },
          dictationUsedDate: today,
        },
      },
    ],
    { new: true }
  );

  if (!result) {
    const err = new Error(
      `Your daily limit of ${DICTATION_DAILY_LIMIT} dictations has been exhausted. Try again tomorrow.`
    );
    err.code = 'DICTATION_LIMIT_REACHED';
    throw err;
  }

  return {
    limit: DICTATION_DAILY_LIMIT,
    usedToday: result.dictationsUsedToday,
    remainingToday: Math.max(0, DICTATION_DAILY_LIMIT - result.dictationsUsedToday),
  };
}

module.exports = {
  DICTATION_DAILY_LIMIT,
  getDictationStatus,
  consumeDictation,
};
