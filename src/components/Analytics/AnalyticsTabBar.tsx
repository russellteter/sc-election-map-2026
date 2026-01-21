'use client';

import { useCallback, useRef, useEffect } from 'react';
import { ANALYTICS_TABS, type AnalyticsTab } from '@/hooks/useAnalyticsUrl';

interface AnalyticsTabBarProps {
  /** Currently active tab */
  activeTab: AnalyticsTab;
  /** Callback when tab is clicked */
  onTabChange: (tab: AnalyticsTab) => void;
  /** Additional className */
  className?: string;
  /** Compact mode for mobile */
  compact?: boolean;
}

/**
 * AnalyticsTabBar - Tab navigation for analytics dashboard
 *
 * Features:
 * - Horizontal scrollable tabs on mobile
 * - Active tab indicator
 * - Keyboard navigation (arrow keys)
 * - Focus management
 */
export default function AnalyticsTabBar({
  activeTab,
  onTabChange,
  className = '',
  compact = false,
}: AnalyticsTabBarProps) {
  const tabRefs = useRef<Map<AnalyticsTab, HTMLButtonElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll active tab into view
  useEffect(() => {
    const activeButton = tabRefs.current.get(activeTab);
    if (activeButton && containerRef.current) {
      const container = containerRef.current;
      const buttonRect = activeButton.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // Check if button is outside visible area
      if (buttonRect.left < containerRect.left || buttonRect.right > containerRect.right) {
        activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeTab]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, currentIndex: number) => {
    let newIndex = currentIndex;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      newIndex = (currentIndex + 1) % ANALYTICS_TABS.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      newIndex = (currentIndex - 1 + ANALYTICS_TABS.length) % ANALYTICS_TABS.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      newIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      newIndex = ANALYTICS_TABS.length - 1;
    } else {
      return;
    }

    const newTab = ANALYTICS_TABS[newIndex];
    onTabChange(newTab.id);
    tabRefs.current.get(newTab.id)?.focus();
  }, [onTabChange]);

  return (
    <div
      ref={containerRef}
      className={`analytics-tab-bar ${className}`}
      role="tablist"
      aria-label="Analytics sections"
    >
      <div
        className={`flex ${compact ? 'gap-1' : 'gap-2'} overflow-x-auto scrollbar-hide pb-1`}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {ANALYTICS_TABS.map((tab, index) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              ref={(el) => {
                if (el) tabRefs.current.set(tab.id, el);
              }}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`
                flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
                whitespace-nowrap transition-all duration-200
                focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                ${isActive
                  ? 'shadow-sm'
                  : 'hover:opacity-80'
                }
              `}
              style={{
                background: isActive
                  ? 'linear-gradient(135deg, var(--class-purple-bg) 0%, #E0E7FF 100%)'
                  : 'var(--card-bg)',
                color: isActive ? 'var(--class-purple)' : 'var(--text-muted)',
                border: `1px solid ${isActive ? 'var(--class-purple-light)' : 'var(--border-subtle)'}`,
                ['--tw-ring-color' as string]: 'var(--class-purple)',
              }}
            >
              <span className="text-base" role="img" aria-hidden="true">
                {tab.icon}
              </span>
              <span className={compact ? 'hidden sm:inline' : ''}>
                {compact ? tab.shortLabel : tab.label}
              </span>
              {compact && (
                <span className="sm:hidden">
                  {tab.shortLabel}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Hide scrollbar styles */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

/**
 * Mobile-specific tab bar variant with bottom navigation style
 */
export function MobileAnalyticsTabBar({
  activeTab,
  onTabChange,
  className = '',
}: Omit<AnalyticsTabBarProps, 'compact'>) {
  return (
    <div
      className={`mobile-analytics-tabs ${className}`}
      role="tablist"
      aria-label="Analytics sections"
    >
      <div className="grid grid-cols-7 gap-0.5 p-1 bg-white/50 rounded-xl backdrop-blur-sm">
        {ANALYTICS_TABS.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              id={`tab-mobile-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex flex-col items-center justify-center py-1.5 px-1 rounded-lg
                transition-all duration-200 min-h-[52px]
                ${isActive ? 'shadow-sm' : ''}
              `}
              style={{
                background: isActive
                  ? 'linear-gradient(135deg, var(--class-purple-bg) 0%, #E0E7FF 100%)'
                  : 'transparent',
                color: isActive ? 'var(--class-purple)' : 'var(--text-muted)',
              }}
            >
              <span className="text-lg" role="img" aria-hidden="true">
                {tab.icon}
              </span>
              <span
                className="text-[9px] font-medium mt-0.5 leading-tight text-center"
                style={{ lineHeight: 1.1 }}
              >
                {tab.shortLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
