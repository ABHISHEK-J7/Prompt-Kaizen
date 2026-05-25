import toast from 'react-hot-toast';

const MESSAGE = 'Copy and paste are disabled here — please type your prompt.';

/**
 * Returns a set of React event handlers that disable copy / paste / drag-drop
 * on a `textarea` (or any focusable element). Used on the Analyzer and Contest
 * answer fields to discourage paste-from-AI cheating.
 *
 * Listening for the `copy` / `paste` events covers BOTH the keyboard shortcut
 * (Ctrl/Cmd + C / V) and the right-click context-menu action — the browser
 * fires those events regardless of how the user initiated the operation.
 *
 * The `id` option on the toast dedupes so rapid Ctrl-V mashing doesn't pile
 * up a stack of notices.
 */
export function lockClipboardProps() {
  const block = (e) => {
    e.preventDefault();
    toast.error(MESSAGE, { id: 'clipboard-blocked' });
  };
  return {
    onCopy: block,
    onPaste: block,
    onContextMenu: (e) => e.preventDefault(),
    onDrop: (e) => e.preventDefault(),
    // Discourage the OS-level drag preview too.
    onDragStart: (e) => e.preventDefault(),
  };
}
