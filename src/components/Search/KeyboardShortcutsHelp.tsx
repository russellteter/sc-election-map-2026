'use client';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  if (!isOpen) return null;

  const shortcuts = [
    { category: 'Lens', items: [
      { key: '1', description: 'Incumbents lens' },
      { key: '2', description: 'Dem Filing lens' },
      { key: '3', description: 'Opportunity lens' },
      { key: '4', description: 'Battleground lens' },
    ]},
    { category: 'Navigation', items: [
      { key: 'H', description: 'Switch to House' },
      { key: 'S', description: 'Switch to Senate' },
      { key: 'J / ↓ / ←', description: 'Previous district' },
      { key: 'K / ↑ / →', description: 'Next district' },
    ]},
    { category: 'Search', items: [
      { key: '/', description: 'Focus search bar' },
      { key: '⌘K / Ctrl+K', description: 'Focus search bar' },
    ]},
    { category: 'General', items: [
      { key: 'Escape', description: 'Clear selection / close panels' },
      { key: '?', description: 'Toggle this help' },
    ]},
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-xl shadow-xl overflow-hidden"
        style={{
          background: 'var(--card-bg, #FFFFFF)',
          border: '1px solid var(--class-purple-light, #DAD7FA)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'var(--class-purple-light, #DAD7FA)' }}
        >
          <h2
            id="shortcuts-title"
            className="text-lg font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Keyboard Shortcuts
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:opacity-70 transition-opacity"
            style={{ color: 'var(--color-text-muted, #4A5568)' }}
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          {shortcuts.map((section) => (
            <div key={section.category} className="mb-4 last:mb-0">
              <h3
                className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: 'var(--color-text-muted, #4A5568)' }}
              >
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.items.map((shortcut) => (
                  <div key={shortcut.key} className="flex items-center justify-between">
                    <span
                      className="text-sm"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {shortcut.description}
                    </span>
                    <kbd
                      className="px-2 py-1 text-xs font-mono rounded border"
                      style={{
                        background: 'var(--class-purple-bg, #F6F6FE)',
                        borderColor: 'var(--class-purple-light, #DAD7FA)',
                        color: 'var(--class-purple, #4739E7)',
                      }}
                    >
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-3 text-center text-xs border-t"
          style={{
            background: 'var(--class-purple-bg, #F6F6FE)',
            borderColor: 'var(--class-purple-light, #DAD7FA)',
            color: 'var(--color-text-muted, #4A5568)',
          }}
        >
          Press <kbd className="px-1 py-0.5 text-xs font-mono rounded" style={{ background: 'white', border: '1px solid var(--class-purple-light)' }}>?</kbd> to toggle this help
        </div>
      </div>
    </div>
  );
}
