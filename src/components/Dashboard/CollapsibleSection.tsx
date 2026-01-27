'use client';

import { useState, type ReactNode } from 'react';

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  badge?: ReactNode;
  children: ReactNode;
}

export default function CollapsibleSection({
  title,
  defaultOpen = false,
  badge,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className="border-b"
      style={{ borderColor: 'var(--class-purple-light)' }}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center px-4 py-3 text-left"
        aria-expanded={isOpen}
      >
        <span
          className="text-xs font-semibold uppercase tracking-wider font-display flex-1"
          style={{ color: 'var(--text-muted)' }}
        >
          {title}
        </span>
        {badge && <span className="mr-2">{badge}</span>}
        <svg
          className="w-4 h-4 collapsible-chevron"
          data-open={isOpen}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: 'var(--text-muted)' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className="collapsible-content" data-open={isOpen}>
        <div>
          <div className="collapsible-inner px-4 pb-4 pt-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
