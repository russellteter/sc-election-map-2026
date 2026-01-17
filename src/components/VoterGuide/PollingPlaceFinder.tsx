'use client';

import { useState, useEffect, useCallback } from 'react';
import { getPollingLocations, type PollingLocationResult } from '@/lib/voterIntelligence';
import { isConfigured } from '@/lib/ballotready';

interface PollingPlaceFinderProps {
  address: string;
  onFallbackClick?: () => void;
}

export default function PollingPlaceFinder({
  address,
  onFallbackClick,
}: PollingPlaceFinderProps) {
  const [locations, setLocations] = useState<PollingLocationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchLocations = useCallback(async () => {
    if (!address || !isConfigured()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getPollingLocations(address);
      setLocations(result);
    } catch (err) {
      console.error('Failed to fetch polling locations:', err);
      setError('Unable to find polling locations');
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // Show nothing if no API configured or no results
  const hasResults =
    locations?.pollingPlace ||
    (locations?.earlyVoting && locations.earlyVoting.length > 0) ||
    (locations?.dropBoxes && locations.dropBoxes.length > 0);

  if (!isConfigured()) {
    return (
      <FallbackPollingCard onFallbackClick={onFallbackClick} />
    );
  }

  if (isLoading) {
    return (
      <div
        className="rounded-lg p-4 animate-pulse"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !hasResults) {
    return (
      <FallbackPollingCard
        onFallbackClick={onFallbackClick}
        error={error || undefined}
      />
    );
  }

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ background: 'var(--card-bg)', border: '1px solid var(--border-subtle)' }}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left transition-colors hover:bg-black/5"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
              border: '1px solid #FCD34D',
            }}
          >
            <svg
              className="w-5 h-5"
              style={{ color: '#B45309' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div>
            <p className="font-medium text-sm" style={{ color: 'var(--text-color)' }}>
              Your Voting Locations
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {locations?.pollingPlace ? 'Polling place found' : 'View early voting options'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
              color: '#059669',
            }}
          >
            Live
          </span>
          <svg
            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            style={{ color: 'var(--text-muted)' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-4">
          {/* Polling Place */}
          {locations?.pollingPlace && (
            <div
              className="rounded-lg p-4"
              style={{ background: 'var(--card-bg-elevated)', border: '1px solid var(--border-subtle)' }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded"
                      style={{ background: '#FEF3C7', color: '#B45309' }}
                    >
                      Election Day
                    </span>
                  </div>
                  <p className="font-medium" style={{ color: 'var(--text-color)' }}>
                    {locations.pollingPlace.name}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {locations.pollingPlace.address}
                  </p>
                  {locations.pollingPlace.hours && (
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      Hours: {locations.pollingPlace.hours}
                    </p>
                  )}
                </div>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                    locations.pollingPlace.address
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                  style={{
                    background: 'var(--class-purple-bg)',
                    color: 'var(--class-purple)',
                    border: '1px solid var(--class-purple-light)',
                  }}
                >
                  Directions
                </a>
              </div>
            </div>
          )}

          {/* Early Voting */}
          {locations?.earlyVoting && locations.earlyVoting.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2" style={{ color: 'var(--text-color)' }}>
                Early Voting Locations
              </h4>
              <div className="space-y-2">
                {locations.earlyVoting.slice(0, 3).map((loc, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg p-3 flex items-start justify-between gap-3"
                    style={{ background: 'var(--card-bg-elevated)', border: '1px solid var(--border-subtle)' }}
                  >
                    <div>
                      <p className="font-medium text-sm" style={{ color: 'var(--text-color)' }}>
                        {loc.name}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {loc.address}
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--class-purple)' }}>
                        {loc.dates}
                        {loc.hours && ` • ${loc.hours}`}
                      </p>
                    </div>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                        loc.address
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs underline flex-shrink-0"
                      style={{ color: 'var(--class-purple)' }}
                    >
                      Map
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drop Boxes */}
          {locations?.dropBoxes && locations.dropBoxes.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2" style={{ color: 'var(--text-color)' }}>
                Ballot Drop Boxes
              </h4>
              <div className="space-y-2">
                {locations.dropBoxes.slice(0, 3).map((box, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg p-3 flex items-center justify-between"
                    style={{ background: 'var(--card-bg-elevated)', border: '1px solid var(--border-subtle)' }}
                  >
                    <div>
                      <p className="font-medium text-sm" style={{ color: 'var(--text-color)' }}>
                        {box.name}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {box.address}
                      </p>
                    </div>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                        box.address
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs underline"
                      style={{ color: 'var(--class-purple)' }}
                    >
                      Map
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Powered by badge */}
          <p className="text-xs text-center pt-2" style={{ color: 'var(--text-muted)' }}>
            Polling locations powered by BallotReady
          </p>
        </div>
      )}
    </div>
  );
}

// Fallback component when API is not available
function FallbackPollingCard({
  onFallbackClick,
  error,
}: {
  onFallbackClick?: () => void;
  error?: string;
}) {
  return (
    <a
      href="https://info.scvotes.sc.gov/eng/voterinquiry/VoterInformationRequest.aspx?PageMode=VoterInfo"
      target="_blank"
      rel="noopener noreferrer"
      onClick={onFallbackClick}
      className="block rounded-lg p-4 transition-all hover:scale-[1.01]"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border-subtle)',
        textDecoration: 'none',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
            border: '1px solid #FCD34D',
          }}
        >
          <svg
            className="w-5 h-5"
            style={{ color: '#B45309' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm" style={{ color: 'var(--text-color)' }}>
            Find Your Polling Place
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {error || 'Look up where to vote on scvotes.gov'}
          </p>
        </div>
        <svg
          className="w-5 h-5"
          style={{ color: 'var(--text-muted)' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </div>
    </a>
  );
}
