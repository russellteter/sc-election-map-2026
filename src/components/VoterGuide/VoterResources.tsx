'use client';

import { useState } from 'react';
import type { ElectionDatesData, ElectionDate } from '@/types/schema';

interface VoterResourcesProps {
  data: ElectionDatesData;
}

export default function VoterResources({ data }: VoterResourcesProps) {
  const [showAllDates, setShowAllDates] = useState(false);

  // Get upcoming dates (from today onwards)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingDates = data.dates
    .filter(d => new Date(d.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const importantDates = upcomingDates.filter(d => d.important);
  const displayDates = showAllDates ? upcomingDates : importantDates.slice(0, 4);

  // Find next important date for countdown
  const nextImportant = importantDates[0];
  const daysUntilNext = nextImportant
    ? Math.ceil((new Date(nextImportant.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="space-y-6 animate-in animate-in-delay-4">
      {/* Section Header */}
      <div className="section-header-accent">
        <div
          className="section-header-icon"
          style={{
            background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
            border: '1px solid #6EE7B7',
          }}
        >
          <svg className="w-5 h-5" style={{ color: '#059669' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="font-display font-semibold text-lg" style={{ color: 'var(--text-color)' }}>
            Voter Resources
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Important dates and tools for the 2026 election
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Registration Check */}
        <a
          href={data.resources.voterRegistration.checkStatus}
          target="_blank"
          rel="noopener noreferrer"
          className="voter-card race-card-lift p-4"
          style={{ textDecoration: 'none' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
                border: '1px solid #93C5FD',
              }}
            >
              <svg className="w-5 h-5" style={{ color: '#1D4ED8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text-color)' }}>
                Check Registration
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Verify you're registered to vote
              </p>
            </div>
          </div>
        </a>

        {/* Find Polling Place */}
        <a
          href={data.resources.pollingPlace.lookup}
          target="_blank"
          rel="noopener noreferrer"
          className="voter-card race-card-lift p-4"
          style={{ textDecoration: 'none' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                border: '1px solid #FCD34D',
              }}
            >
              <svg className="w-5 h-5" style={{ color: '#B45309' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text-color)' }}>
                Find Polling Place
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Locate where to vote
              </p>
            </div>
          </div>
        </a>

        {/* Absentee Info */}
        <a
          href={data.resources.absenteeVoting.info}
          target="_blank"
          rel="noopener noreferrer"
          className="voter-card race-card-lift p-4"
          style={{ textDecoration: 'none' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)',
                border: '1px solid #C4B5FD',
              }}
            >
              <svg className="w-5 h-5" style={{ color: '#7C3AED' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text-color)' }}>
                Vote by Mail
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Absentee ballot info
              </p>
            </div>
          </div>
        </a>
      </div>

      {/* Countdown to Next Important Date */}
      {nextImportant && daysUntilNext !== null && (
        <div
          className="rounded-lg p-4"
          style={{
            background: daysUntilNext <= 7
              ? 'linear-gradient(135deg, #FEF2F2 0%, #FECACA 100%)'
              : daysUntilNext <= 30
              ? 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)'
              : 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
            border: `1px solid ${daysUntilNext <= 7 ? '#FCA5A5' : daysUntilNext <= 30 ? '#FCD34D' : '#6EE7B7'}`,
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Coming Up
              </p>
              <p className="font-medium" style={{ color: 'var(--text-color)' }}>
                {nextImportant.title}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {formatDate(nextImportant.date)}
              </p>
            </div>
            <div className="text-right">
              <p
                className="font-display font-bold text-2xl"
                style={{
                  color: daysUntilNext <= 7 ? '#DC2626' : daysUntilNext <= 30 ? '#B45309' : '#059669',
                }}
              >
                {daysUntilNext}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                days away
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Election Timeline */}
      <div className="voter-glass-surface rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-display font-semibold" style={{ color: 'var(--text-color)' }}>
            2026 Election Calendar
          </h4>
          <button
            onClick={() => setShowAllDates(!showAllDates)}
            className="text-xs font-medium underline no-print"
            style={{ color: 'var(--class-purple)' }}
          >
            {showAllDates ? 'Show key dates' : 'Show all dates'}
          </button>
        </div>

        <div className="space-y-3">
          {displayDates.map((date, index) => (
            <DateItem key={date.id} date={date} isLast={index === displayDates.length - 1} />
          ))}
        </div>

        {/* Add to Calendar */}
        <div className="mt-4 pt-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <a
            href={data.resources.countyOffices}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs underline"
            style={{ color: 'var(--class-purple)' }}
          >
            Find your county election office
          </a>
          <button
            onClick={() => downloadCalendar(data.dates)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80 no-print"
            style={{
              background: 'var(--class-purple-bg)',
              color: 'var(--class-purple)',
              border: '1px solid var(--class-purple-light)',
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Add to Calendar
          </button>
        </div>
      </div>
    </div>
  );
}

interface DateItemProps {
  date: ElectionDate;
  isLast: boolean;
}

function DateItem({ date, isLast }: DateItemProps) {
  const isPast = new Date(date.date) < new Date();
  const isElection = date.type === 'election';

  const iconColor = isElection
    ? '#DC2626'
    : date.type === 'deadline'
    ? '#B45309'
    : '#059669';

  const iconBg = isElection
    ? 'linear-gradient(135deg, #FEF2F2 0%, #FECACA 100%)'
    : date.type === 'deadline'
    ? 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)'
    : 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)';

  return (
    <div className={`flex gap-3 ${isPast ? 'opacity-50' : ''}`}>
      {/* Timeline indicator */}
      <div className="flex flex-col items-center">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg }}
        >
          {isElection ? (
            <svg className="w-4 h-4" style={{ color: iconColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          ) : date.type === 'deadline' ? (
            <svg className="w-4 h-4" style={{ color: iconColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" style={{ color: iconColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </div>
        {!isLast && (
          <div className="w-0.5 h-full min-h-[20px]" style={{ background: 'var(--border-subtle)' }} />
        )}
      </div>

      {/* Content */}
      <div className="pb-4">
        <p className="text-xs font-medium" style={{ color: iconColor }}>
          {formatDate(date.date)}
        </p>
        <p className="font-medium text-sm" style={{ color: 'var(--text-color)' }}>
          {date.title}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {date.description}
        </p>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function downloadCalendar(dates: ElectionDate[]) {
  // Generate ICS file content
  const icsContent = generateICS(dates);

  // Create and trigger download
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'sc-2026-elections.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function generateICS(dates: ElectionDate[]): string {
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const events = dates.map(date => {
    const dateFormatted = date.date.replace(/-/g, '');
    // For all-day events, end date should be the next day
    const endDate = new Date(date.date + 'T00:00:00');
    endDate.setDate(endDate.getDate() + 1);
    const endDateFormatted = endDate.toISOString().slice(0, 10).replace(/-/g, '');

    return `BEGIN:VEVENT
DTSTART;VALUE=DATE:${dateFormatted}
DTEND;VALUE=DATE:${endDateFormatted}
SUMMARY:${date.title}
DESCRIPTION:${date.description}
UID:${date.id}@sc-election-map-2026
DTSTAMP:${now}
END:VEVENT`;
  }).join('\n');

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SC Election Map 2026//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:SC 2026 Elections
X-WR-TIMEZONE:America/New_York
${events}
END:VCALENDAR`;
}
