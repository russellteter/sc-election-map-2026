'use client';

import type { JudicialRacesData, StatewideJudicialCourt, CircuitCourt, JudicialSeat } from '@/types/schema';
import { DemoBadge } from '@/components/ui';

interface JudicialRacesProps {
  data: JudicialRacesData;
  countyName: string | null;
  stateCode?: string;
}

export default function JudicialRaces({ data, countyName, stateCode = 'SC' }: JudicialRacesProps) {
  // Find the user's circuit based on their county
  const userCircuit = countyName
    ? data.circuitCourts.find(circuit =>
        circuit.counties.some(c => c.toLowerCase() === countyName.toLowerCase())
      )
    : null;

  return (
    <div className="space-y-6 animate-in animate-in-delay-1">
      {/* Section Header */}
      <div className="section-header-accent">
        <div
          className="section-header-icon"
          style={{
            background: 'linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)',
            border: '1px solid #A5B4FC',
          }}
        >
          <svg className="w-5 h-5" style={{ color: '#4338CA' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {/* Scales of Justice icon */}
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display font-semibold text-lg" style={{ color: 'var(--text-color)' }}>
              Judicial Offices
            </h3>
            {stateCode !== 'SC' && <DemoBadge />}
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            State and circuit court positions
          </p>
        </div>
      </div>

      {/* Selection Process Info Card */}
      <div
        className="rounded-lg p-4"
        style={{
          background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
          border: '1px solid #C7D2FE',
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: '#4338CA' }}
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm mb-1" style={{ color: '#312E81' }}>
              How SC Selects Judges
            </h4>
            <p className="text-sm" style={{ color: '#4338CA' }}>
              {data.selectionInfo.description}
            </p>
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              <strong>Your role:</strong> {data.selectionInfo.voterRole}
            </p>
          </div>
        </div>
      </div>

      {/* Statewide Courts */}
      {data.statewideJudicial.map((court) => (
        <StatewideCourtSection key={court.court} court={court} />
      ))}

      {/* Circuit Court Section */}
      {userCircuit ? (
        <CircuitCourtSection circuit={userCircuit} countyName={countyName!} />
      ) : (
        <div className="glass-surface rounded-lg p-6 text-center">
          <div
            className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)',
              border: '1px solid #A5B4FC',
            }}
          >
            <svg className="w-6 h-6" style={{ color: '#4338CA' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h4 className="font-display font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
            Enter your address to see your circuit court
          </h4>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            South Carolina has 16 judicial circuits. Your circuit court handles civil and criminal cases in your area.
          </p>
        </div>
      )}

      {/* Learn More Link */}
      <div className="flex justify-center pt-2">
        <a
          href="https://www.sccourts.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium transition-all hover:opacity-80"
          style={{ color: 'var(--class-purple)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          SC Judicial Branch Website
        </a>
      </div>
    </div>
  );
}

interface StatewideCourtSectionProps {
  court: StatewideJudicialCourt;
}

function StatewideCourtSection({ court }: StatewideCourtSectionProps) {
  // Determine colors based on court type
  const isSupremeCourt = court.court.includes('Supreme');
  const accentColor = isSupremeCourt ? '#4338CA' : '#6366F1';
  const bgGradient = isSupremeCourt
    ? 'linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)'
    : 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)';
  const borderColor = isSupremeCourt ? '#A5B4FC' : '#C4B5FD';

  return (
    <div className="voter-card p-4">
      {/* Court Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-display font-semibold" style={{ color: 'var(--text-color)' }}>
              {court.court}
            </h4>
            <span
              className="badge text-xs flex-shrink-0"
              style={{
                background: bgGradient,
                color: accentColor,
                border: `1px solid ${borderColor}`,
              }}
            >
              STATEWIDE
            </span>
          </div>
          {court.description && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {court.description}
            </p>
          )}
        </div>
      </div>

      {/* Seats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {court.seats.map((seat) => (
          <JudicialSeatCard
            key={seat.seat}
            seat={seat}
            termYears={court.termYears}
            accentColor={accentColor}
            bgGradient={bgGradient}
            borderColor={borderColor}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 flex items-center justify-between text-xs" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <span style={{ color: 'var(--text-muted)' }}>{court.termYears}-year terms</span>
        <a
          href={`https://ballotpedia.org/South_Carolina_${court.court.replace(/SC /g, '').replace(/ /g, '_')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
          style={{ color: 'var(--class-purple)' }}
        >
          Learn more
        </a>
      </div>
    </div>
  );
}

interface JudicialSeatCardProps {
  seat: JudicialSeat;
  termYears: number;
  accentColor: string;
  bgGradient: string;
  borderColor: string;
}

function JudicialSeatCard({ seat, accentColor, bgGradient, borderColor }: JudicialSeatCardProps) {
  const termEndYear = parseInt(seat.termEnd, 10);
  const currentYear = new Date().getFullYear();
  const isUpForReelection = termEndYear <= currentYear + 1;

  return (
    <div
      className="rounded-lg p-3"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {/* Seat Name */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          {seat.seat}
        </span>
        {isUpForReelection && (
          <span
            className="badge text-xs"
            style={{
              background: bgGradient,
              color: accentColor,
              border: `1px solid ${borderColor}`,
            }}
          >
            {termEndYear === currentYear ? 'THIS YEAR' : `${termEndYear}`}
          </span>
        )}
      </div>

      {/* Incumbent Name */}
      <p className="font-medium text-sm" style={{ color: 'var(--text-color)' }}>
        {seat.incumbent}
      </p>

      {/* Term End */}
      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
        Term ends {seat.termEnd}
      </p>
    </div>
  );
}

interface CircuitCourtSectionProps {
  circuit: CircuitCourt;
  countyName: string;
}

function CircuitCourtSection({ circuit, countyName }: CircuitCourtSectionProps) {
  return (
    <div className="voter-card p-4">
      {/* Circuit Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-display font-semibold" style={{ color: 'var(--text-color)' }}>
              {circuit.circuit} Judicial Circuit
            </h4>
            <span
              className="badge text-xs flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
                color: '#047857',
                border: '1px solid #6EE7B7',
              }}
            >
              YOUR CIRCUIT
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Circuit Court for {countyName} County
          </p>
        </div>
      </div>

      {/* Counties in Circuit */}
      <div
        className="rounded-lg p-3 mb-4"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
          Counties in this circuit
        </p>
        <div className="flex flex-wrap gap-2">
          {circuit.counties.map((county) => (
            <span
              key={county}
              className="badge text-xs"
              style={{
                background: county.toLowerCase() === countyName.toLowerCase()
                  ? 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)'
                  : 'var(--class-purple-light)',
                color: county.toLowerCase() === countyName.toLowerCase()
                  ? '#047857'
                  : 'var(--class-purple)',
                border: county.toLowerCase() === countyName.toLowerCase()
                  ? '1px solid #6EE7B7'
                  : '1px solid var(--border-subtle)',
              }}
            >
              {county}
            </span>
          ))}
        </div>
      </div>

      {/* Judge Information */}
      {circuit.judges.length > 0 && (
        <div
          className="rounded-lg p-3"
          style={{
            background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
            border: '1px dashed #86EFAC',
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: '#059669' }}
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h5 className="font-display font-semibold text-sm mb-1" style={{ color: '#065F46' }}>
                Circuit Court Judges
              </h5>
              <p className="text-sm" style={{ color: '#047857' }}>
                {circuit.judges[0].description}
              </p>
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                Circuit court judges serve 6-year terms and rotate through the counties in their circuit. They are elected by the General Assembly.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-3 flex items-center justify-between text-xs" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <span style={{ color: 'var(--text-muted)' }}>6-year terms (legislative election)</span>
        <a
          href="https://www.sccourts.org/courts/trial-courts/circuit-court/circuit-map/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
          style={{ color: 'var(--class-purple)' }}
        >
          View Circuit Map
        </a>
      </div>
    </div>
  );
}
