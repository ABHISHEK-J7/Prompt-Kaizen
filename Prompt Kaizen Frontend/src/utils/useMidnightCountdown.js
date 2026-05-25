import { useEffect, useRef, useState } from 'react';

const IST_OFFSET_MS = 330 * 60 * 1000; // +05:30

/**
 * Returns the number of milliseconds until the next IST midnight (00:00 +05:30).
 * The instant is the same global moment for every user regardless of where
 * they live, so the daily challenge rolls over simultaneously for everyone.
 */
function msUntilNextIstMidnight() {
  const now = Date.now();
  const ist = new Date(now + IST_OFFSET_MS);
  // Treat IST clock as if it were UTC, take next "midnight", then subtract the
  // IST offset to get the actual UTC instant of that IST midnight.
  const nextIstMidnightAsIfUtc = Date.UTC(
    ist.getUTCFullYear(),
    ist.getUTCMonth(),
    ist.getUTCDate() + 1,
    0, 0, 0, 0,
  );
  const nextUtcInstant = nextIstMidnightAsIfUtc - IST_OFFSET_MS;
  return Math.max(0, nextUtcInstant - now);
}

function format(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours   = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return {
    hours,
    minutes,
    seconds,
    hh: String(hours).padStart(2, '0'),
    mm: String(minutes).padStart(2, '0'),
    ss: String(seconds).padStart(2, '0'),
    totalMs: ms,
    expired: ms <= 0,
  };
}

// Max jitter applied to the post-midnight refetch. Without this, every active
// client fires the same request in the same second when the IST date rolls
// over — a synchronized thundering herd against the backend. Spreading the
// fire across MIDNIGHT_JITTER_MAX_MS milliseconds flattens that spike.
const MIDNIGHT_JITTER_MAX_MS = 30_000;

/**
 * Live countdown to the next IST midnight. Re-renders once per second.
 * Fires `onElapsed` exactly once when the countdown crosses zero, with a
 * uniform random 0–30s delay so 2k+ clients don't all hammer the backend at
 * the same instant. The visible countdown still hits zero on time.
 */
export function useMidnightCountdown(onElapsed) {
  const [ms, setMs] = useState(msUntilNextIstMidnight);
  const firedRef = useRef(false);
  const jitterTimerRef = useRef(null);
  const onElapsedRef = useRef(onElapsed);
  onElapsedRef.current = onElapsed;

  useEffect(() => {
    let intervalId;

    const tick = () => {
      const next = msUntilNextIstMidnight();
      setMs(next);
      if (next <= 0 && !firedRef.current) {
        firedRef.current = true;
        const jitter = Math.floor(Math.random() * MIDNIGHT_JITTER_MAX_MS);
        jitterTimerRef.current = setTimeout(() => {
          jitterTimerRef.current = null;
          try { onElapsedRef.current?.(); } catch { /* noop */ }
        }, jitter);
      }
      if (next > 0) firedRef.current = false;
    };

    const initialDelay = 1000 - (Date.now() % 1000);
    const timeoutId = setTimeout(() => {
      tick();
      intervalId = setInterval(tick, 1000);
    }, initialDelay);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
      if (jitterTimerRef.current) {
        clearTimeout(jitterTimerRef.current);
        jitterTimerRef.current = null;
      }
    };
  }, []);

  return format(ms);
}
