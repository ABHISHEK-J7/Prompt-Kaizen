/**
 * Celebration helpers. Locked to the flame/cream palette and lazy-loaded so the
 * confetti dependency only ships when something actually celebrates.
 */

// Two-color confetti burst from both sides — used for 90+ scores.
export async function fireCelebrationConfetti() {
  const { default: confetti } = await import('canvas-confetti');
  const colors = ['#F15D23', '#212529'];
  const end = Date.now() + 900;

  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 65,
      startVelocity: 55,
      origin: { x: 0, y: 0.85 },
      colors,
      scalar: 0.9,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 65,
      startVelocity: 55,
      origin: { x: 1, y: 0.85 },
      colors,
      scalar: 0.9,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();

  // Final celebratory burst from the centre.
  setTimeout(() => {
    confetti({
      particleCount: 90,
      spread: 100,
      origin: { y: 0.55 },
      colors,
      scalar: 1.1,
    });
  }, 320);
}

/**
 * Synthesizes a warm two-note chime with the Web Audio API. No audio file
 * needed and the user can dismiss it via the system mute. We unlock the
 * AudioContext lazily so Safari/iOS do not throw.
 */
let _audioCtx = null;
function getAudioCtx() {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  if (!_audioCtx) _audioCtx = new Ctor();
  if (_audioCtx.state === 'suspended') _audioCtx.resume().catch(() => {});
  return _audioCtx;
}

export function playCelebrationChime() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const tone = (freq, start, dur = 0.28, vol = 0.18) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(vol, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.05);
    };

    // C5 → E5 chime.
    tone(523.25, 0.00);
    tone(659.25, 0.18, 0.36, 0.16);
  } catch {
    /* swallow — celebration audio is best-effort */
  }
}
