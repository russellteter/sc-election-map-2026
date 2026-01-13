'use client';

import { useState, useEffect, ReactNode } from 'react';

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  storageKey?: string;
  className?: string;
  headerClassName?: string;
}

/**
 * CollapsibleSection component - Glassmorphic collapsible panels with localStorage persistence
 *
 * Features:
 * - Animated chevron rotation (180deg on toggle)
 * - CSS Grid-based height animation (no JS height calc)
 * - localStorage sync with `storageKey` prop
 * - `prefers-reduced-motion` support
 * - Glassmorphic styling consistent with design system
 */
export default function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  storageKey,
  className = '',
  headerClassName = '',
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Restore state from localStorage on mount
  useEffect(() => {
    if (storageKey) {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored !== null) {
          setIsOpen(stored === 'true');
        }
      } catch (e) {
        // localStorage might be disabled
        console.warn('CollapsibleSection: Failed to read from localStorage', e);
      }
    }
  }, [storageKey]);

  // Persist state to localStorage
  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);

    if (storageKey) {
      try {
        localStorage.setItem(storageKey, String(newState));
      } catch (e) {
        console.warn('CollapsibleSection: Failed to write to localStorage', e);
      }
    }
  };

  return (
    <section className={`collapsible-section ${className}`}>
      <button
        onClick={handleToggle}
        className={`collapsible-header ${headerClassName}`}
        aria-expanded={isOpen}
        aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${title}`}
      >
        <span className="collapsible-title">{title}</span>
        <svg
          className={`collapsible-chevron ${isOpen ? 'open' : 'closed'}`}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <div
        className={`collapsible-content ${isOpen ? 'open' : 'closed'}`}
        style={{
          display: 'grid',
          gridTemplateRows: isOpen ? '1fr' : '0fr',
          transition: 'grid-template-rows 0.3s var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1))',
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          {children}
        </div>
      </div>
    </section>
  );
}
