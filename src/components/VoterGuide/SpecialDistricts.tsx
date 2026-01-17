'use client';

import { useState } from 'react';
import type {
  SpecialDistrictsData,
  CountySpecialDistricts,
  SpecialDistrict,
  SpecialDistrictType,
} from '@/types/schema';
import { DemoBadge } from '@/components/ui';

interface SpecialDistrictsProps {
  data: SpecialDistrictsData;
  countyName: string | null;
}

// Icons for each district type
const DISTRICT_TYPE_ICONS: Record<SpecialDistrictType, React.ReactNode> = {
  soil_water: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  ),
  fire: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"
      />
    </svg>
  ),
  water_sewer: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
      />
    </svg>
  ),
  recreation: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    </svg>
  ),
  hospital: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </svg>
  ),
  transit: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7h8m-8 4h8m-8 4h4m-4 4h.01M12 19h.01M16 19h.01M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"
      />
    </svg>
  ),
  other: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z"
      />
    </svg>
  ),
};

// Labels for each district type
const DISTRICT_TYPE_LABELS: Record<SpecialDistrictType, string> = {
  soil_water: 'Soil & Water Conservation',
  fire: 'Fire Districts',
  water_sewer: 'Water & Sewer',
  recreation: 'Recreation',
  hospital: 'Hospital Districts',
  transit: 'Transit Authorities',
  other: 'Other Special Districts',
};

// Color schemes for each district type
const DISTRICT_TYPE_COLORS: Record<
  SpecialDistrictType,
  { bg: string; border: string; text: string; iconBg: string }
> = {
  soil_water: {
    bg: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
    border: '#6EE7B7',
    text: '#047857',
    iconBg: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
  },
  fire: {
    bg: 'linear-gradient(135deg, #FEF2F2 0%, #FECACA 100%)',
    border: '#F87171',
    text: '#B91C1C',
    iconBg: 'linear-gradient(135deg, #FECACA 0%, #FCA5A5 100%)',
  },
  water_sewer: {
    bg: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
    border: '#60A5FA',
    text: '#1D4ED8',
    iconBg: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
  },
  recreation: {
    bg: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
    border: '#A78BFA',
    text: '#6D28D9',
    iconBg: 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)',
  },
  hospital: {
    bg: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)',
    border: '#F9A8D4',
    text: '#BE185D',
    iconBg: 'linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%)',
  },
  transit: {
    bg: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
    border: '#FCD34D',
    text: '#B45309',
    iconBg: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
  },
  other: {
    bg: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
    border: '#94A3B8',
    text: '#475569',
    iconBg: 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)',
  },
};

export default function SpecialDistricts({ data, countyName }: SpecialDistrictsProps) {
  // Find county data if available
  const countyData: CountySpecialDistricts | null = countyName
    ? data.districts.find((d) => d.county === countyName) || null
    : null;

  // Group districts by type
  const districtsByType = countyData
    ? groupDistrictsByType(countyData.specialDistricts)
    : null;

  return (
    <div className="space-y-6 animate-in animate-in-delay-4">
      {/* Section Header */}
      <div className="section-header-accent">
        <div
          className="section-header-icon"
          style={{
            background: 'linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)',
            border: '1px solid #A5B4FC',
          }}
        >
          <svg
            className="w-5 h-5"
            style={{ color: '#4338CA' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display font-semibold text-lg" style={{ color: 'var(--text-color)' }}>
              {countyName ? `${countyName} County Special Districts` : 'Special Districts'}
            </h3>
            <DemoBadge />
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {countyName
              ? 'Local special purpose districts in your area'
              : 'Fire, water, recreation, and other special purpose districts'}
          </p>
        </div>
      </div>

      {/* District groups or fallback message */}
      {districtsByType && Object.keys(districtsByType).length > 0 ? (
        <div className="space-y-4">
          {Object.entries(districtsByType).map(([type, districts]) => (
            <DistrictTypeSection
              key={type}
              type={type as SpecialDistrictType}
              districts={districts}
            />
          ))}
        </div>
      ) : (
        <div className="glass-surface rounded-lg p-6 text-center">
          <div
            className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)',
              border: '1px solid #A5B4FC',
            }}
          >
            <svg
              className="w-6 h-6"
              style={{ color: '#4338CA' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h4
            className="font-display font-semibold mb-2"
            style={{ color: 'var(--text-color)' }}
          >
            Special district information coming soon
          </h4>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            {countyName
              ? `Special district elections for ${countyName} County will be available once filing information is released.`
              : 'Enter your address above to see special districts in your area.'}
          </p>
          <a
            href="https://scvotes.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
            style={{
              background: 'linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)',
              color: '#4338CA',
              border: '1px solid #A5B4FC',
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            SC Votes - Election Information
          </a>
        </div>
      )}
    </div>
  );
}

interface DistrictTypeSectionProps {
  type: SpecialDistrictType;
  districts: SpecialDistrict[];
}

function DistrictTypeSection({ type, districts }: DistrictTypeSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const colors = DISTRICT_TYPE_COLORS[type];
  const icon = DISTRICT_TYPE_ICONS[type];
  const label = DISTRICT_TYPE_LABELS[type];

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
      }}
    >
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ color: colors.text }}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center"
            style={{
              background: colors.iconBg,
              border: `1px solid ${colors.border}`,
            }}
          >
            {icon}
          </div>
          <div className="text-left">
            <span className="font-display font-semibold text-sm">{label}</span>
            <span
              className="ml-2 text-xs font-medium"
              style={{ opacity: 0.7 }}
            >
              ({districts.length} district{districts.length !== 1 ? 's' : ''})
            </span>
          </div>
        </div>
        <svg
          className={`w-5 h-5 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {districts.map((district) => (
              <DistrictCard key={district.name} district={district} colors={colors} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface DistrictCardProps {
  district: SpecialDistrict;
  colors: { bg: string; border: string; text: string; iconBg: string };
}

function DistrictCard({ district, colors }: DistrictCardProps) {
  const totalCandidates = district.seats.reduce(
    (sum, seat) => sum + seat.candidates.length,
    0
  );

  return (
    <div
      className="rounded-md p-3"
      style={{
        background: 'rgba(255, 255, 255, 0.6)',
        border: `1px solid ${colors.border}`,
      }}
    >
      {/* District Name */}
      <h5
        className="font-medium text-sm mb-2"
        style={{ color: 'var(--text-color)' }}
      >
        {district.name}
      </h5>

      {/* Seats */}
      <div className="space-y-2">
        {district.seats.map((seat, idx) => (
          <div
            key={`${seat.position}-${idx}`}
            className="rounded px-2 py-1.5"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-xs font-medium"
                style={{ color: 'var(--text-muted)' }}
              >
                {seat.position}
              </span>
              <span
                className="badge text-xs"
                style={{
                  background: colors.iconBg,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                }}
              >
                {seat.candidates.length} candidate
                {seat.candidates.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Candidates */}
            {seat.candidates.length > 0 ? (
              <div className="mt-2 space-y-1">
                {seat.candidates.map((candidate, cidx) => (
                  <div
                    key={`${candidate.name}-${cidx}`}
                    className="flex items-center justify-between text-xs"
                  >
                    <span style={{ color: 'var(--text-color)' }}>
                      {candidate.name}
                    </span>
                    {candidate.incumbent && (
                      <span
                        className="badge text-xs"
                        style={{
                          background: 'var(--color-healthy-bg)',
                          color: 'var(--color-healthy)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        Incumbent
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p
                className="text-xs mt-1 italic"
                style={{ color: 'var(--text-muted)' }}
              >
                No candidates filed yet
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        className="mt-2 pt-2 text-xs"
        style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}
      >
        {totalCandidates} total candidate{totalCandidates !== 1 ? 's' : ''} | Filing: March 16-30, 2026
      </div>
    </div>
  );
}

/**
 * Group special districts by their type
 */
function groupDistrictsByType(
  districts: SpecialDistrict[]
): Record<SpecialDistrictType, SpecialDistrict[]> {
  const grouped: Partial<Record<SpecialDistrictType, SpecialDistrict[]>> = {};

  // Define the order we want types to appear
  const typeOrder: SpecialDistrictType[] = [
    'soil_water',
    'fire',
    'water_sewer',
    'recreation',
    'hospital',
    'transit',
    'other',
  ];

  // Group districts
  districts.forEach((district) => {
    if (!grouped[district.type]) {
      grouped[district.type] = [];
    }
    grouped[district.type]!.push(district);
  });

  // Return in defined order, filtering out empty groups
  const result: Record<SpecialDistrictType, SpecialDistrict[]> = {} as Record<
    SpecialDistrictType,
    SpecialDistrict[]
  >;

  typeOrder.forEach((type) => {
    if (grouped[type] && grouped[type]!.length > 0) {
      result[type] = grouped[type]!;
    }
  });

  return result;
}
