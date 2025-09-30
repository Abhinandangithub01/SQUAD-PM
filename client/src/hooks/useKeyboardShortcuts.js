import { useEffect, useCallback } from 'react';

export const useKeyboardShortcuts = (shortcuts, enabled = true) => {
  const handleKeyPress = useCallback(
    (event) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs
      if (
        event.target.tagName === 'INPUT' ||
        event.target.tagName === 'TEXTAREA' ||
        event.target.isContentEditable
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      const ctrl = event.ctrlKey || event.metaKey;
      const shift = event.shiftKey;
      const alt = event.altKey;

      // Find matching shortcut
      Object.entries(shortcuts).forEach(([shortcutKey, handler]) => {
        const parts = shortcutKey.toLowerCase().split('+');
        const requiredKey = parts[parts.length - 1];
        const requiresCtrl = parts.includes('ctrl') || parts.includes('cmd');
        const requiresShift = parts.includes('shift');
        const requiresAlt = parts.includes('alt');

        if (
          key === requiredKey &&
          ctrl === requiresCtrl &&
          shift === requiresShift &&
          alt === requiresAlt
        ) {
          event.preventDefault();
          handler(event);
        }
      });
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [handleKeyPress, enabled]);
};

export default useKeyboardShortcuts;
