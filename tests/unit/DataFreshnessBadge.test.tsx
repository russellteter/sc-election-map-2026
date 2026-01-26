/**
 * Unit tests for DataFreshnessBadge component
 *
 * Tests the data freshness indicator including:
 * - Freshness variant calculation (fresh, recent, stale)
 * - Relative time formatting
 * - Accessibility attributes
 * - Reduced motion support
 */

import { render, screen } from '@testing-library/react';
import { DataFreshnessBadge } from '@/components/ui/DataFreshnessBadge';

// Mock useReducedMotion hook
jest.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: jest.fn(() => false),
}));

import { useReducedMotion } from '@/hooks/useReducedMotion';
const mockUseReducedMotion = useReducedMotion as jest.MockedFunction<typeof useReducedMotion>;

describe('DataFreshnessBadge', () => {
  beforeEach(() => {
    // Reset mock before each test
    mockUseReducedMotion.mockReturnValue(false);
    // Mock current date to a fixed point
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-26T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Freshness variants', () => {
    it('should show "fresh" variant for data updated less than 24 hours ago', () => {
      // 2 hours ago
      const lastUpdated = new Date('2026-01-26T10:00:00Z').toISOString();
      render(<DataFreshnessBadge lastUpdated={lastUpdated} />);

      const badge = screen.getByRole('status');
      expect(badge).toHaveStyle({ background: '#ECFDF5' }); // Fresh green bg
      expect(badge).toHaveStyle({ color: '#059669' }); // Fresh green text
    });

    it('should show "recent" variant for data updated 1-7 days ago', () => {
      // 3 days ago
      const lastUpdated = new Date('2026-01-23T12:00:00Z').toISOString();
      render(<DataFreshnessBadge lastUpdated={lastUpdated} />);

      const badge = screen.getByRole('status');
      expect(badge).toHaveStyle({ background: '#F1F5F9' }); // Recent gray bg
      expect(badge).toHaveStyle({ color: '#64748B' }); // Recent gray text
    });

    it('should show "stale" variant for data updated more than 7 days ago', () => {
      // 10 days ago
      const lastUpdated = new Date('2026-01-16T12:00:00Z').toISOString();
      render(<DataFreshnessBadge lastUpdated={lastUpdated} />);

      const badge = screen.getByRole('status');
      expect(badge).toHaveStyle({ background: '#FEF3C7' }); // Stale amber bg
      expect(badge).toHaveStyle({ color: '#B45309' }); // Stale amber text
    });
  });

  describe('Relative time formatting', () => {
    it('should display "Just now" for very recent updates', () => {
      const lastUpdated = new Date('2026-01-26T11:59:30Z').toISOString(); // 30 seconds ago
      render(<DataFreshnessBadge lastUpdated={lastUpdated} />);

      expect(screen.getByText(/Just now/i)).toBeInTheDocument();
    });

    it('should display minutes for updates less than an hour ago', () => {
      const lastUpdated = new Date('2026-01-26T11:30:00Z').toISOString(); // 30 minutes ago
      render(<DataFreshnessBadge lastUpdated={lastUpdated} />);

      expect(screen.getByText(/30m ago/i)).toBeInTheDocument();
    });

    it('should display hours for updates less than 24 hours ago', () => {
      const lastUpdated = new Date('2026-01-26T06:00:00Z').toISOString(); // 6 hours ago
      render(<DataFreshnessBadge lastUpdated={lastUpdated} />);

      expect(screen.getByText(/6h ago/i)).toBeInTheDocument();
    });

    it('should display "Yesterday" for updates from previous day', () => {
      const lastUpdated = new Date('2026-01-25T12:00:00Z').toISOString(); // 1 day ago
      render(<DataFreshnessBadge lastUpdated={lastUpdated} />);

      expect(screen.getByText(/Yesterday/i)).toBeInTheDocument();
    });

    it('should display days for updates 2-6 days ago', () => {
      const lastUpdated = new Date('2026-01-23T12:00:00Z').toISOString(); // 3 days ago
      render(<DataFreshnessBadge lastUpdated={lastUpdated} />);

      expect(screen.getByText(/3d ago/i)).toBeInTheDocument();
    });

    it('should display formatted date for updates older than 7 days', () => {
      const lastUpdated = new Date('2026-01-10T12:00:00Z').toISOString(); // 16 days ago
      render(<DataFreshnessBadge lastUpdated={lastUpdated} />);

      expect(screen.getByText(/Jan 10/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have role="status" for screen reader announcements', () => {
      const lastUpdated = new Date('2026-01-26T10:00:00Z').toISOString();
      render(<DataFreshnessBadge lastUpdated={lastUpdated} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have aria-label with full date information', () => {
      const lastUpdated = new Date('2026-01-26T10:00:00Z').toISOString();
      render(<DataFreshnessBadge lastUpdated={lastUpdated} />);

      const badge = screen.getByRole('status');
      const ariaLabel = badge.getAttribute('aria-label');
      expect(ariaLabel).toContain('Data last updated');
      expect(ariaLabel).toContain('January');
      expect(ariaLabel).toContain('26');
      expect(ariaLabel).toContain('2026');
    });

    it('should have title attribute for tooltip', () => {
      const lastUpdated = new Date('2026-01-26T10:00:00Z').toISOString();
      render(<DataFreshnessBadge lastUpdated={lastUpdated} />);

      const badge = screen.getByRole('status');
      expect(badge.getAttribute('title')).toBe(badge.getAttribute('aria-label'));
    });
  });

  describe('Reduced motion support', () => {
    it('should show pulse animation when fresh and motion is enabled', () => {
      mockUseReducedMotion.mockReturnValue(false);
      const lastUpdated = new Date('2026-01-26T10:00:00Z').toISOString();
      const { container } = render(<DataFreshnessBadge lastUpdated={lastUpdated} />);

      // Check for pulse span
      const pulseElement = container.querySelector('.animate-ping');
      expect(pulseElement).toBeInTheDocument();
    });

    it('should not show pulse animation when user prefers reduced motion', () => {
      mockUseReducedMotion.mockReturnValue(true);
      const lastUpdated = new Date('2026-01-26T10:00:00Z').toISOString();
      const { container } = render(<DataFreshnessBadge lastUpdated={lastUpdated} />);

      // Pulse should not be present
      const pulseElement = container.querySelector('.animate-ping');
      expect(pulseElement).not.toBeInTheDocument();
    });

    it('should not show pulse animation for non-fresh data', () => {
      mockUseReducedMotion.mockReturnValue(false);
      const lastUpdated = new Date('2026-01-20T12:00:00Z').toISOString(); // 6 days ago
      const { container } = render(<DataFreshnessBadge lastUpdated={lastUpdated} />);

      const pulseElement = container.querySelector('.animate-ping');
      expect(pulseElement).not.toBeInTheDocument();
    });
  });

  describe('Stale data attention indicator', () => {
    it('should show warning icon for stale data', () => {
      const lastUpdated = new Date('2026-01-10T12:00:00Z').toISOString(); // 16 days ago
      const { container } = render(<DataFreshnessBadge lastUpdated={lastUpdated} />);

      // Should have an SVG with warning path (triangle with exclamation)
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();

      // The warning icon has a path with "m-6.938 4h13.856" (triangle shape)
      const warningPath = container.querySelector('svg path[d*="m-6.938"]');
      expect(warningPath).toBeInTheDocument();
    });

    it('should show clock icon for fresh/recent data', () => {
      const lastUpdated = new Date('2026-01-26T10:00:00Z').toISOString();
      const { container } = render(<DataFreshnessBadge lastUpdated={lastUpdated} />);

      // Clock icon has path with "M12 8v4l3 3"
      const clockPath = container.querySelector('svg path[d*="M12 8v4l3 3"]');
      expect(clockPath).toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      const lastUpdated = new Date('2026-01-26T10:00:00Z').toISOString();
      render(<DataFreshnessBadge lastUpdated={lastUpdated} className="custom-class" />);

      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('custom-class');
    });
  });
});
