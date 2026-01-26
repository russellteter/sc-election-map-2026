'use client';

import { useEffect, useCallback, useRef } from 'react';
import type { LensId } from '@/types/lens';

interface KeyboardShortcutsOptions {
  onToggleChamber?: () => void;
  onFocusSearch?: () => void;
  onClearSelection?: () => void;
  onNextDistrict?: () => void;
  onPrevDistrict?: () => void;
  onToggleHelp?: () => void;
  /** Callback for direct lens switching (1-4 keys) */
  onSetLens?: (lens: LensId) => void;
  enabled?: boolean;
}

// Lens order for number key mapping (1-4)
const LENS_ORDER: LensId[] = ['incumbents', 'dem-filing', 'opportunity', 'battleground'];

export function useKeyboardShortcuts({
  onToggleChamber,
  onFocusSearch,
  onClearSelection,
  onNextDistrict,
  onPrevDistrict,
  onToggleHelp,
  onSetLens,
  enabled = true,
}: KeyboardShortcutsOptions) {
  const helpVisibleRef = useRef(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in input fields
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Escape to blur input and clear selection
        if (e.key === 'Escape') {
          target.blur();
          onClearSelection?.();
          e.preventDefault();
        }
        return;
      }

      // Meta/Ctrl key combinations
      if (e.metaKey || e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case 'k':
            // Cmd/Ctrl + K: Focus search
            e.preventDefault();
            onFocusSearch?.();
            break;
        }
        return;
      }

      // Single key shortcuts
      switch (e.key.toLowerCase()) {
        case 'h':
          // H: Switch to House
          onToggleChamber?.();
          break;
        case 's':
          // S: Switch to Senate (or toggle if already on House)
          onToggleChamber?.();
          break;
        case '/':
          // /: Focus search (vim-style)
          e.preventDefault();
          onFocusSearch?.();
          break;
        case 'escape':
          // Escape: Clear selection
          onClearSelection?.();
          break;
        case 'j':
        case 'arrowdown':
          // J or Down: Next district
          e.preventDefault();
          onNextDistrict?.();
          break;
        case 'k':
        case 'arrowup':
          // K or Up: Previous district
          e.preventDefault();
          onPrevDistrict?.();
          break;
        case '?':
          // ?: Toggle help
          if (e.shiftKey) {
            e.preventDefault();
            helpVisibleRef.current = !helpVisibleRef.current;
            onToggleHelp?.();
          }
          break;
        case 'arrowleft':
          // Left arrow: Previous district (alternate)
          e.preventDefault();
          onPrevDistrict?.();
          break;
        case 'arrowright':
          // Right arrow: Next district (alternate)
          e.preventDefault();
          onNextDistrict?.();
          break;
        case '1':
        case '2':
        case '3':
        case '4':
          // 1-4: Direct lens switching
          if (onSetLens) {
            const lensIndex = parseInt(e.key, 10) - 1;
            if (lensIndex >= 0 && lensIndex < LENS_ORDER.length) {
              e.preventDefault();
              onSetLens(LENS_ORDER[lensIndex]);
            }
          }
          break;
      }
    },
    [
      enabled,
      onToggleChamber,
      onFocusSearch,
      onClearSelection,
      onNextDistrict,
      onPrevDistrict,
      onToggleHelp,
      onSetLens,
    ]
  );

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [enabled, handleKeyDown]);

  return {
    shortcuts: [
      { key: '/', description: 'Focus search' },
      { key: 'Cmd/Ctrl + K', description: 'Focus search' },
      { key: 'H', description: 'Switch to House' },
      { key: 'S', description: 'Switch to Senate' },
      { key: 'Escape', description: 'Clear selection' },
      { key: 'J / ↓ / ←', description: 'Previous district' },
      { key: 'K / ↑ / →', description: 'Next district' },
      { key: '1', description: 'Incumbents lens' },
      { key: '2', description: 'Dem Filing lens' },
      { key: '3', description: 'Opportunity lens' },
      { key: '4', description: 'Battleground lens' },
      { key: '?', description: 'Show shortcuts' },
    ],
  };
}
