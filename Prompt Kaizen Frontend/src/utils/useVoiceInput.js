import { useEffect, useRef, useState } from 'react';

/**
 * Web Speech API wrapper. Returns dictation lifecycle + a method to start/stop.
 *
 *   const { supported, listening, error, start, stop } = useVoiceInput({
 *     onResult: (chunk) => append(chunk),
 *   });
 *
 * - Only the *final* recognized transcript chunks are emitted (no partials).
 * - Continuous listening — caller controls stop.
 * - Unmount safe: recognition is aborted on cleanup.
 */
export function useVoiceInput({ onResult, lang } = {}) {
  const SR = typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null;
  const supported = !!SR;

  const recognitionRef = useRef(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supported) return;
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = lang || (typeof navigator !== 'undefined' ? navigator.language : 'en-US');

    recognition.onresult = (event) => {
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
      }
      if (final && onResultRef.current) onResultRef.current(final.trim());
    };
    recognition.onerror = (e) => {
      // `aborted` / `no-speech` are noisy and not actionable — swallow them.
      if (e.error && e.error !== 'aborted' && e.error !== 'no-speech') {
        setError(`Mic error: ${e.error}`);
      }
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    return () => {
      try { recognition.abort(); } catch { /* noop */ }
    };
  }, [supported, lang, SR]);

  const start = () => {
    setError('');
    if (!recognitionRef.current || listening) return;
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch (e) {
      setError(e?.message || 'Could not start microphone.');
    }
  };
  const stop = () => {
    if (!recognitionRef.current) return;
    try { recognitionRef.current.stop(); } catch { /* noop */ }
    setListening(false);
  };

  return { supported, listening, error, start, stop };
}
