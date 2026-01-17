'use client';

import { useState } from 'react';
import type { AnyStateConfig } from '@/types/stateConfig';

interface StateModalProps {
  state: AnyStateConfig | null;
  onClose: () => void;
}

export default function StateModal({ state, onClose }: StateModalProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!state) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would submit to an API
    console.log('Interest registered:', { state: state.code, email });
    setSubmitted(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="glass-surface rounded-2xl p-6 max-w-md w-full animate-entrance"
        style={{ borderColor: 'var(--class-purple-light)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold font-display" style={{ color: 'var(--text-color)' }}>
              {state.name}
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Coming Soon
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-4">
            <div
              className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
              style={{ background: 'var(--color-excellent-bg)' }}
            >
              <svg className="w-6 h-6" fill="none" stroke="var(--color-excellent)" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-medium" style={{ color: 'var(--text-color)' }}>
              Thank you for your interest!
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              We&apos;ll notify you when {state.name} is available.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              Blue Intelligence is expanding to cover all 50 states. Sign up to be notified when
              election intelligence for {state.name} becomes available.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-color)' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                  style={{
                    borderColor: 'var(--class-purple-light)',
                    background: 'white',
                  }}
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 rounded-lg font-medium transition-all hover:opacity-90"
                style={{
                  background: 'var(--class-purple)',
                  color: 'white',
                }}
              >
                Notify Me
              </button>
            </form>

            <p className="text-xs text-center mt-4" style={{ color: 'var(--text-muted)' }}>
              Or contact us at{' '}
              <a href="mailto:info@blue-intelligence.com" className="underline">
                info@blue-intelligence.com
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
