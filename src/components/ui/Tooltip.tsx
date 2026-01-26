'use client';

import { ReactNode } from 'react';

interface TooltipProps {
  /** Tooltip content text */
  content: string;
  /** Position of tooltip relative to trigger */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** The trigger element */
  children: ReactNode;
  /** Additional CSS class */
  className?: string;
}

/**
 * Tooltip - CSS-only tooltip component
 *
 * Features:
 * - No JavaScript required for show/hide
 * - Smooth fade-in animation
 * - Accessible via aria-describedby
 * - Mobile-friendly (touch to show)
 */
export default function Tooltip({
  content,
  position = 'top',
  children,
  className = '',
}: TooltipProps) {
  const tooltipId = `tooltip-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <span className={`tooltip-wrapper ${className}`} data-tooltip-position={position}>
      <span className="tooltip-trigger" aria-describedby={tooltipId}>
        {children}
      </span>
      <span id={tooltipId} role="tooltip" className="tooltip-content">
        {content}
      </span>

      <style jsx>{`
        .tooltip-wrapper {
          position: relative;
          display: inline-flex;
        }

        .tooltip-trigger {
          display: inline-flex;
        }

        .tooltip-content {
          position: absolute;
          z-index: 50;
          padding: 0.375rem 0.625rem;
          font-size: 0.75rem;
          font-weight: 500;
          line-height: 1.4;
          color: white;
          background: rgba(17, 24, 39, 0.95);
          border-radius: 0.375rem;
          white-space: nowrap;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.15s ease, visibility 0.15s ease;
          pointer-events: none;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
                      0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        /* Arrow */
        .tooltip-content::after {
          content: '';
          position: absolute;
          border: 5px solid transparent;
        }

        /* Position: top (default) */
        [data-tooltip-position='top'] .tooltip-content {
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
        }

        [data-tooltip-position='top'] .tooltip-content::after {
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border-top-color: rgba(17, 24, 39, 0.95);
        }

        /* Position: bottom */
        [data-tooltip-position='bottom'] .tooltip-content {
          top: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
        }

        [data-tooltip-position='bottom'] .tooltip-content::after {
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          border-bottom-color: rgba(17, 24, 39, 0.95);
        }

        /* Position: left */
        [data-tooltip-position='left'] .tooltip-content {
          right: calc(100% + 8px);
          top: 50%;
          transform: translateY(-50%);
        }

        [data-tooltip-position='left'] .tooltip-content::after {
          left: 100%;
          top: 50%;
          transform: translateY(-50%);
          border-left-color: rgba(17, 24, 39, 0.95);
        }

        /* Position: right */
        [data-tooltip-position='right'] .tooltip-content {
          left: calc(100% + 8px);
          top: 50%;
          transform: translateY(-50%);
        }

        [data-tooltip-position='right'] .tooltip-content::after {
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
          border-right-color: rgba(17, 24, 39, 0.95);
        }

        /* Show on hover/focus */
        .tooltip-wrapper:hover .tooltip-content,
        .tooltip-trigger:focus-within + .tooltip-content {
          opacity: 1;
          visibility: visible;
        }

        /* Mobile: show on touch/tap */
        @media (hover: none) {
          .tooltip-trigger:active + .tooltip-content {
            opacity: 1;
            visibility: visible;
          }
        }
      `}</style>
    </span>
  );
}
