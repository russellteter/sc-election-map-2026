'use client';

import { useState } from 'react';

interface AddressInputProps {
  onSubmit: (address: string) => void;
  isLoading: boolean;
  error?: string | null;
  statusMessage?: string | null;
}

export default function AddressInput({ onSubmit, isLoading, error, statusMessage }: AddressInputProps) {
  const [address, setAddress] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim() && !isLoading) {
      onSubmit(address.trim());
    }
  };

  return (
    <div className="glass-surface rounded-lg p-6 animate-entrance">
      <h2
        className="font-display font-semibold text-xl mb-2"
        style={{ color: 'var(--text-color)' }}
      >
        Find Your Districts
      </h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
        Enter your South Carolina address to see the candidates running in your House and Senate districts.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <div
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--text-muted)' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main Street, Columbia, SC 29201"
              disabled={isLoading}
              className="w-full pl-10 pr-4 py-3 rounded-lg text-base transition-all focus:outline-none focus:ring-2"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-color)',
                fontSize: '16px',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--class-purple)';
                e.target.style.boxShadow = '0 0 0 3px var(--class-purple-bg)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-subtle)';
                e.target.style.boxShadow = 'none';
              }}
              aria-label="Enter your South Carolina address"
              aria-describedby={error ? 'address-error' : undefined}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !address.trim()}
            className="px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'var(--class-purple)',
              color: 'white',
            }}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Looking up...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Find My Districts
              </span>
            )}
          </button>
        </div>
      </form>

      {/* Status Message */}
      {statusMessage && !error && (
        <div
          className="flex items-center gap-2 mt-4 p-3 rounded-lg"
          style={{
            background: 'var(--class-purple-bg)',
            border: '1px solid var(--class-purple-light)',
          }}
        >
          <svg className="w-4 h-4 flex-shrink-0 animate-spin" style={{ color: 'var(--class-purple)' }} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-sm" style={{ color: 'var(--class-purple)' }}>
            {statusMessage}
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          id="address-error"
          className="flex items-start gap-2 mt-4 p-3 rounded-lg animate-entrance"
          style={{
            background: 'var(--color-at-risk-bg)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
          }}
          role="alert"
        >
          <svg
            className="w-5 h-5 flex-shrink-0 mt-0.5"
            style={{ color: 'var(--color-at-risk)' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm" style={{ color: 'var(--color-at-risk)' }}>
            {error}
          </p>
        </div>
      )}

      {/* Help Text */}
      <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
        Enter a complete street address including city. ZIP codes alone are not supported.
      </p>
    </div>
  );
}
