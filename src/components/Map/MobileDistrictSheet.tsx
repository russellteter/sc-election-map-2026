'use client';

import { useEffect, useCallback, useRef } from 'react';
import type { District, DistrictElectionHistory } from '@/types/schema';
import type { LensId } from '@/types/lens';
import { DEFAULT_LENS } from '@/types/lens';
import {
  getDistrictCategory,
  getCategoryLabel,
  type OpportunityData,
} from '@/lib/districtColors';

interface MobileDistrictSheetProps {
  /** Whether the sheet is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Selected district data */
  district: District | null;
  /** Chamber type */
  chamber: 'house' | 'senate';
  /** Chamber display name */
  chamberName: string;
  /** Election history for the district */
  electionHistory?: DistrictElectionHistory | null;
  /** Opportunity data for the district */
  opportunityData?: OpportunityData | null;
  /** Active lens */
  activeLens?: LensId;
  /** Handler for "View Details" action */
  onViewDetails?: () => void;
}

/**
 * MobileDistrictSheet - Bottom sheet for mobile district interactions
 *
 * Features:
 * - Slide-up animation from bottom
 * - District info summary
 * - Candidate list
 * - "View Details" button for navigation
 * - Touch-friendly close (swipe down or tap overlay)
 * - Focus trap for accessibility
 */
export default function MobileDistrictSheet({
  isOpen,
  onClose,
  district,
  chamber,
  chamberName,
  electionHistory,
  opportunityData,
  activeLens = DEFAULT_LENS,
  onViewDetails,
}: MobileDistrictSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle swipe down to close
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (startYRef.current === null) return;

    const deltaY = e.touches[0].clientY - startYRef.current;
    if (deltaY > 100) {
      onClose();
      startYRef.current = null;
    }
  }, [onClose]);

  const handleTouchEnd = useCallback(() => {
    startYRef.current = null;
  }, []);

  if (!district) return null;

  // Calculate data
  const category = getDistrictCategory(district, electionHistory || undefined, opportunityData || undefined, activeLens);
  const categoryLabel = getCategoryLabel(category, activeLens);

  const hasDem = district.candidates.some((c) => c.party?.toLowerCase() === 'democratic');
  const hasRep = district.candidates.some((c) => c.party?.toLowerCase() === 'republican');

  const incumbentText = district.incumbent
    ? `${district.incumbent.name} (${district.incumbent.party === 'Democratic' ? 'D' : district.incumbent.party === 'Republican' ? 'R' : '?'})`
    : 'Open seat';

  return (
    <>
      {/* Overlay */}
      <div
        className={`bottom-sheet-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`bottom-sheet ${isOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle */}
        <div className="bottom-sheet-handle" aria-hidden="true">
          <div className="bottom-sheet-handle-bar" />
        </div>

        {/* Header */}
        <div className="bottom-sheet-header">
          <div>
            <span className="bottom-sheet-chamber">{chamberName}</span>
            <h2 id="sheet-title" className="bottom-sheet-title">
              District {district.districtNumber}
            </h2>
          </div>
          <button
            type="button"
            className="bottom-sheet-close"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="bottom-sheet-content">
          {/* Info Grid */}
          <div className="bottom-sheet-grid">
            <div className="bottom-sheet-item">
              <span className="bottom-sheet-label">Incumbent</span>
              <span className="bottom-sheet-value">{incumbentText}</span>
            </div>
            <div className="bottom-sheet-item">
              <span className="bottom-sheet-label">Status</span>
              <span className="bottom-sheet-value">
                {hasDem && hasRep ? 'Contested' : hasDem ? 'Dem filed' : hasRep ? 'Rep only' : 'No candidates'}
              </span>
            </div>
            <div className="bottom-sheet-item">
              <span className="bottom-sheet-label">Candidates</span>
              <span className="bottom-sheet-value">{district.candidates.length}</span>
            </div>
            <div className="bottom-sheet-item">
              <span className="bottom-sheet-label">Category</span>
              <span className="bottom-sheet-value bottom-sheet-category">{categoryLabel}</span>
            </div>
          </div>

          {/* Candidates Preview */}
          {district.candidates.length > 0 && (
            <div className="bottom-sheet-candidates">
              <h3 className="bottom-sheet-section-title">Candidates</h3>
              <ul className="bottom-sheet-candidate-list">
                {district.candidates.slice(0, 3).map((candidate, idx) => (
                  <li key={idx} className="bottom-sheet-candidate">
                    <span className={`bottom-sheet-party-dot ${candidate.party?.toLowerCase() === 'democratic' ? 'democrat' : candidate.party?.toLowerCase() === 'republican' ? 'republican' : 'unknown'}`} />
                    <span className="bottom-sheet-candidate-name">{candidate.name}</span>
                    <span className="bottom-sheet-candidate-party">{candidate.party || 'Unknown'}</span>
                  </li>
                ))}
                {district.candidates.length > 3 && (
                  <li className="bottom-sheet-more">+{district.candidates.length - 3} more</li>
                )}
              </ul>
            </div>
          )}

          {/* Action Button */}
          {onViewDetails && (
            <button
              type="button"
              className="bottom-sheet-action"
              onClick={onViewDetails}
            >
              View Full Details
            </button>
          )}
        </div>
      </div>
    </>
  );
}
