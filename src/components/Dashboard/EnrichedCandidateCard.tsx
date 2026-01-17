'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { enrichCandidate, type EnrichedCandidate } from '@/lib/ballotready';
import type { Candidate } from '@/types/schema';

interface EnrichedCandidateCardProps {
  candidate: Candidate;
  chamber: 'house' | 'senate';
  districtNumber: number;
  showEnrichment?: boolean;
}

export default function EnrichedCandidateCard({
  candidate,
  chamber,
  districtNumber,
  showEnrichment = true,
}: EnrichedCandidateCardProps) {
  const [enrichedData, setEnrichedData] = useState<EnrichedCandidate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!showEnrichment) return;

    async function fetchEnrichment() {
      setIsLoading(true);
      try {
        const data = await enrichCandidate(candidate);
        setEnrichedData(data);
      } catch (error) {
        console.error('Failed to enrich candidate:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEnrichment();
  }, [candidate, showEnrichment]);

  const isDemocrat = candidate.party?.toLowerCase() === 'democratic';
  const isRepublican = candidate.party?.toLowerCase() === 'republican';
  const partyColor = isDemocrat ? '#1D4ED8' : isRepublican ? '#DC2626' : '#6B7280';
  const partyBg = isDemocrat ? '#DBEAFE' : isRepublican ? '#FEF2F2' : '#F3F4F6';

  // Format name (handle "Last, First" format)
  const formatName = (name: string) => {
    if (name.includes(',')) {
      const [last, first] = name.split(',').map((s) => s.trim());
      return `${first} ${last}`;
    }
    return name;
  };

  const hasEnrichment =
    enrichedData &&
    (enrichedData.photoUrl ||
      enrichedData.biography ||
      enrichedData.endorsements?.length ||
      enrichedData.campaignWebsite);

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-300"
      style={{
        background: 'var(--card-bg)',
        border: `1px solid ${isExpanded ? partyColor : 'var(--border-subtle)'}`,
        boxShadow: isExpanded ? `0 4px 20px ${partyColor}20` : undefined,
      }}
    >
      {/* Main Card */}
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Photo or Placeholder */}
          <div
            className="w-16 h-16 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center"
            style={{
              background: enrichedData?.photoUrl ? undefined : partyBg,
              border: `1px solid ${partyColor}40`,
            }}
          >
            {enrichedData?.photoUrl ? (
              <img
                src={enrichedData.photoUrl}
                alt={candidate.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <svg
                className="w-8 h-8"
                style={{ color: partyColor }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-display font-semibold" style={{ color: 'var(--text-color)' }}>
                  {formatName(candidate.name)}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ background: partyBg, color: partyColor }}
                  >
                    {candidate.party || 'Unknown'}
                  </span>
                  {candidate.isIncumbent && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{ background: '#F3F4F6', color: '#6B7280' }}
                    >
                      Incumbent
                    </span>
                  )}
                </div>
              </div>

              {/* View Race Link */}
              <Link
                href={`/race/${chamber}/${districtNumber}`}
                className="text-xs font-medium px-2 py-1 rounded hover:opacity-80"
                style={{ background: partyColor, color: 'white' }}
              >
                View Race
              </Link>
            </div>

            {/* Filing Info */}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              {candidate.filedDate && (
                <span>
                  Filed: {new Date(candidate.filedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
              {candidate.ethicsUrl && (
                <a
                  href={candidate.ethicsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:opacity-80"
                  style={{ color: 'var(--class-purple)' }}
                >
                  Ethics Filing
                </a>
              )}
            </div>

            {/* Enrichment Preview */}
            {hasEnrichment && (
              <div className="mt-3 flex items-center gap-2">
                {enrichedData.endorsements && enrichedData.endorsements.length > 0 && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: '#ECFDF5', color: '#059669' }}
                  >
                    {enrichedData.endorsements.length} endorsement
                    {enrichedData.endorsements.length !== 1 ? 's' : ''}
                  </span>
                )}
                {enrichedData.campaignWebsite && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: '#DBEAFE', color: '#1D4ED8' }}
                  >
                    Campaign Site
                  </span>
                )}
                {!isExpanded && (
                  <button
                    onClick={() => setIsExpanded(true)}
                    className="text-xs underline"
                    style={{ color: 'var(--class-purple)' }}
                  >
                    See more
                  </button>
                )}
              </div>
            )}

            {isLoading && (
              <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                <div
                  className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"
                />
                Loading profile...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && hasEnrichment && (
        <div
          className="px-4 pb-4 space-y-4"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          {/* Biography */}
          {enrichedData.biography && (
            <div className="pt-4">
              <h5 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
                About
              </h5>
              <p className="text-sm" style={{ color: 'var(--text-color)' }}>
                {enrichedData.biography.length > 300
                  ? `${enrichedData.biography.substring(0, 300)}...`
                  : enrichedData.biography}
              </p>
            </div>
          )}

          {/* Education & Experience */}
          {(enrichedData.education || enrichedData.experience) && (
            <div className="grid grid-cols-2 gap-4">
              {enrichedData.education && (
                <div>
                  <h5 className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
                    Education
                  </h5>
                  <p className="text-sm" style={{ color: 'var(--text-color)' }}>
                    {enrichedData.education}
                  </p>
                </div>
              )}
              {enrichedData.experience && (
                <div>
                  <h5 className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
                    Experience
                  </h5>
                  <p className="text-sm" style={{ color: 'var(--text-color)' }}>
                    {enrichedData.experience}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Endorsements */}
          {enrichedData.endorsements && enrichedData.endorsements.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
                Endorsements
              </h5>
              <div className="flex flex-wrap gap-2">
                {enrichedData.endorsements.slice(0, 6).map((endorsement, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-1 rounded-full"
                    style={{ background: '#ECFDF5', color: '#059669' }}
                  >
                    {endorsement.endorser_name}
                  </span>
                ))}
                {enrichedData.endorsements.length > 6 && (
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    +{enrichedData.endorsements.length - 6} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Issue Stances */}
          {enrichedData.issueStances && enrichedData.issueStances.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
                Issue Positions
              </h5>
              <div className="space-y-2">
                {enrichedData.issueStances.slice(0, 3).map((stance, idx) => (
                  <div key={idx} className="text-sm">
                    <span className="font-medium" style={{ color: 'var(--text-color)' }}>
                      {stance.issue}:
                    </span>{' '}
                    <span style={{ color: 'var(--text-muted)' }}>{stance.stance}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          <div className="flex flex-wrap gap-3 pt-2">
            {enrichedData.campaignWebsite && (
              <a
                href={enrichedData.campaignWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm font-medium hover:underline"
                style={{ color: 'var(--class-purple)' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                Campaign Website
              </a>
            )}
            {enrichedData.socialMedia?.facebook && (
              <a
                href={enrichedData.socialMedia.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:opacity-80"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
            )}
            {enrichedData.socialMedia?.twitter && (
              <a
                href={enrichedData.socialMedia.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-500 hover:opacity-80"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            )}
          </div>

          {/* Collapse Button */}
          <button
            onClick={() => setIsExpanded(false)}
            className="w-full text-center text-xs underline pt-2"
            style={{ color: 'var(--class-purple)' }}
          >
            Show less
          </button>
        </div>
      )}
    </div>
  );
}
