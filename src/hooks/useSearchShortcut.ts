'use client';

import { useEffect, useCallback } from 'react';

/**
 * Options for useSearchShortcut hook
 */
export interface UseSearchShortcutOptions {
  /** Whether the shortcut is enabled (default: true) */
  enabled?: boolean;
  /** Keys that trigger the search (default: ['/', 'k']) */
  triggerKeys?: string[];
  /** Require Cmd/Ctrl for letter keys (default: true) */
  requireModifier?: boolean;
}

/**
 * useSearchShortcut - Register keyboard shortcuts to open search
 *
 * Default shortcuts:
 * - `/` - Opens search (vim-style)
 * - `Cmd+K` (Mac) / `Ctrl+K` (Windows) - Opens search
 *
 * @param onTrigger - Callback when shortcut is triggered
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * const [isSearchOpen, setIsSearchOpen] = useState(false);
 *
 * useSearchShortcut(() => setIsSearchOpen(true), {
 *   enabled: !isSearchOpen, // Disable when already open
 * });
 * ```
 */
export function useSearchShortcut(
  onTrigger: () => void,
  options: UseSearchShortcutOptions = {}
): void {
  const { enabled = true, triggerKeys = ['/', 'k'], requireModifier = true } = options;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      // Check if it's a trigger key
      if (!triggerKeys.includes(key)) return;

      // For letters (like 'k'), require Cmd/Ctrl modifier
      if (key.length === 1 && key >= 'a' && key <= 'z' && requireModifier) {
        if (!(e.metaKey || e.ctrlKey)) return;
      }

      // Prevent default (e.g., typing '/' in page)
      e.preventDefault();
      onTrigger();
    },
    [enabled, triggerKeys, requireModifier, onTrigger]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);
}

export default useSearchShortcut;
