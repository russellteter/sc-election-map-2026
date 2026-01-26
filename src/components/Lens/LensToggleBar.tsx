'use client';

import { useCallback, useState, useEffect } from 'react';
import type { LensId } from '@/types/lens';
import { LENS_DEFINITIONS, ALL_LENS_IDS } from '@/types/lens';

const LENS_INTRO_KEY = 'hasSeenLensIntro';

interface LensToggleBarProps {
  /** Currently active lens */
  activeLens: LensId;
  /** Callback when lens changes */
  onLensChange: (lens: LensId) => void;
  /** Additional CSS class */
  className?: string;
  /** Use compact mode (short labels) */
  compact?: boolean;
}

/**
 * LensToggleBar - Horizontal pill-button group for switching lens views
 *
 * Features:
 * - Pill-button design with active state styling
 * - Keyboard accessible (role="tablist")
 * - Mobile: horizontal scroll with short labels
 * - Desktop: full labels with descriptions on hover
 */
export default function LensToggleBar({
  activeLens,
  onLensChange,
  className = '',
  compact = false,
}: LensToggleBarProps) {
  const [showIntro, setShowIntro] = useState(false);

  // Check if user has seen intro on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasSeen = localStorage.getItem(LENS_INTRO_KEY);
    if (!hasSeen) {
      setShowIntro(true);
    }
  }, []);

  const dismissIntro = useCallback(() => {
    setShowIntro(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LENS_INTRO_KEY, 'true');
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = ALL_LENS_IDS.indexOf(activeLens);
      let newIndex = currentIndex;

      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        newIndex = currentIndex === 0 ? ALL_LENS_IDS.length - 1 : currentIndex - 1;
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        newIndex = currentIndex === ALL_LENS_IDS.length - 1 ? 0 : currentIndex + 1;
      } else if (e.key === 'Home') {
        e.preventDefault();
        newIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        newIndex = ALL_LENS_IDS.length - 1;
      }

      if (newIndex !== currentIndex) {
        onLensChange(ALL_LENS_IDS[newIndex]);
      }
    },
    [activeLens, onLensChange]
  );

  return (
    <div className="lens-toggle-container" style={{ position: 'relative' }}>
      {/* First-visit onboarding intro */}
      {showIntro && (
        <div className="lens-intro-overlay" onClick={dismissIntro}>
          <div className="lens-intro-card" onClick={(e) => e.stopPropagation()}>
            <div className="lens-intro-header">
              <span className="lens-intro-badge">New Feature</span>
              <h3 className="lens-intro-title">Visualization Lenses</h3>
            </div>
            <p className="lens-intro-desc">
              Switch between different views of the map data:
            </p>
            <ul className="lens-intro-list">
              <li><strong>Incumbents</strong> - Who currently holds each seat</li>
              <li><strong>Dem Filing</strong> - Where Democrats have filed vs gaps</li>
              <li><strong>Opportunity</strong> - Strategic flip opportunities by margin</li>
              <li><strong>Battleground</strong> - Contested races with both parties</li>
            </ul>
            <button type="button" className="lens-intro-button" onClick={dismissIntro}>
              Got it
            </button>
          </div>
        </div>
      )}

      <div
        role="tablist"
        aria-label="Map visualization lens"
        className={`lens-toggle-bar ${className}`}
        onKeyDown={handleKeyDown}
      >
        {ALL_LENS_IDS.map((lensId) => {
          const lens = LENS_DEFINITIONS[lensId];
          const isActive = lensId === activeLens;

          return (
            <button
              key={lensId}
              role="tab"
              type="button"
              id={`lens-tab-${lensId}`}
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              className={`lens-toggle-button ${isActive ? 'lens-toggle-active' : ''}`}
              onClick={() => onLensChange(lensId)}
              title={lens.description}
            >
              <span className="lens-toggle-label">
                {compact ? lens.shortLabel : lens.label}
              </span>
            </button>
          );
        })}

      <style jsx>{`
        .lens-toggle-bar {
          display: flex;
          gap: 0.25rem;
          padding: 0.25rem;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(8px);
          border-radius: 0.75rem;
          border: 1px solid rgba(0, 0, 0, 0.1);
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }

        .lens-toggle-bar::-webkit-scrollbar {
          display: none;
        }

        .lens-toggle-button {
          flex-shrink: 0;
          padding: 0.5rem 0.875rem;
          border: none;
          border-radius: 0.5rem;
          background: transparent;
          color: #4B5563;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }

        .lens-toggle-button:hover:not(.lens-toggle-active) {
          background: rgba(0, 0, 0, 0.05);
        }

        .lens-toggle-button:focus-visible {
          outline: 2px solid #6366F1;
          outline-offset: 2px;
        }

        .lens-toggle-active {
          background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
          color: white;
          box-shadow: 0 2px 4px rgba(99, 102, 241, 0.3);
        }

        .lens-toggle-label {
          display: block;
        }

        /* Mobile: use compact labels */
        @media (max-width: 640px) {
          .lens-toggle-button {
            padding: 0.375rem 0.625rem;
            font-size: 0.75rem;
          }
        }
      `}</style>
      </div>
    </div>
  );
}
