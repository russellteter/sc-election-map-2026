'use client';

import { useState } from 'react';
import Link from 'next/link';
import USMap from '@/components/Landing/USMap';
import StateModal from '@/components/Landing/StateModal';
import { getActiveStates, type AnyStateConfig } from '@/lib/stateConfig';
import { BASE_PATH } from '@/lib/constants';

export default function LandingPage() {
  const [selectedInactiveState, setSelectedInactiveState] = useState<AnyStateConfig | null>(null);
  const activeStates = getActiveStates();

  return (
    <div className="atmospheric-bg min-h-screen flex flex-col">
      {/* Hero Section */}
      <header className="glass-surface border-b" style={{ borderColor: 'var(--class-purple-light)' }}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-display" style={{ color: 'var(--text-color)' }}>
                Blue Intelligence
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                National Election Intelligence Platform
              </p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Link
                href={`${BASE_PATH}/about`}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-all hover:opacity-80"
                style={{ color: 'var(--text-color)' }}
              >
                About
              </Link>
              <Link
                href={`${BASE_PATH}/contact`}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-all"
                style={{
                  background: 'var(--class-purple)',
                  color: 'white',
                }}
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Value Proposition */}
        <section className="py-12 md:py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4" style={{ color: 'var(--text-color)' }}>
              Win More Races with Data-Driven Intelligence
            </h2>
            <p className="text-lg mb-8" style={{ color: 'var(--text-muted)' }}>
              Comprehensive election intelligence for Democratic campaigns. Identify opportunities,
              track candidates, and mobilize voters across all 50 states.
            </p>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-4 mb-12">
              <div className="glass-surface rounded-xl p-6 text-left" style={{ borderColor: 'var(--class-purple-light)' }}>
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                  style={{ background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="var(--class-purple)" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
                  Opportunity Scoring
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Identify winnable districts based on historical margins, voter registration trends, and demographic shifts.
                </p>
              </div>

              <div className="glass-surface rounded-xl p-6 text-left" style={{ borderColor: 'var(--class-purple-light)' }}>
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                  style={{ background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="#059669" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
                  Voter Intelligence
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Electorate profiles, mobilization universes, and turnout projections for every district.
                </p>
              </div>

              <div className="glass-surface rounded-xl p-6 text-left" style={{ borderColor: 'var(--class-purple-light)' }}>
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                  style={{ background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="#D97706" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
                  Campaign Tracking
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Real-time candidate filings, endorsement tracking, and early vote monitoring.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* US Map Section */}
        <section className="py-8 px-4" style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
          <div className="max-w-6xl mx-auto">
            <h3 className="text-xl font-semibold text-center mb-6" style={{ color: 'var(--text-color)' }}>
              Select a State to Explore
            </h3>
            <USMap onInactiveStateClick={setSelectedInactiveState} />
          </div>
        </section>

        {/* Active States Quick Links */}
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-xl font-semibold text-center mb-6" style={{ color: 'var(--text-color)' }}>
              Available States
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {activeStates.map((state) => (
                <Link
                  key={state.code}
                  href={`${BASE_PATH}/${state.code.toLowerCase()}`}
                  className="glass-surface rounded-xl p-4 text-center transition-all hover:shadow-lg hover:-translate-y-1"
                  style={{ borderColor: 'var(--class-purple-light)' }}
                >
                  <div
                    className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2"
                    style={{ background: 'linear-gradient(135deg, var(--class-purple-bg) 0%, #E0E7FF 100%)' }}
                  >
                    <span className="text-lg font-bold" style={{ color: 'var(--class-purple)' }}>
                      {state.code}
                    </span>
                  </div>
                  <p className="font-medium text-sm" style={{ color: 'var(--text-color)' }}>
                    {state.name}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {state.chambers.house.count + state.chambers.senate.count} districts
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section
          className="py-12 px-4"
          style={{ background: 'linear-gradient(135deg, var(--class-purple-bg) 0%, #E0E7FF 100%)' }}
        >
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold font-display mb-4" style={{ color: 'var(--text-color)' }}>
              Ready to Transform Your Campaign Strategy?
            </h3>
            <p className="mb-6" style={{ color: 'var(--text-muted)' }}>
              Contact us to unlock full access to voter intelligence data, custom opportunity scoring,
              and dedicated campaign support.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={`${BASE_PATH}/contact`}
                className="px-6 py-3 rounded-lg font-medium transition-all hover:opacity-90"
                style={{
                  background: 'var(--class-purple)',
                  color: 'white',
                }}
              >
                Request a Demo
              </Link>
              <a
                href="mailto:info@blue-intelligence.com"
                className="px-6 py-3 rounded-lg font-medium transition-all hover:opacity-80"
                style={{
                  background: 'white',
                  color: 'var(--class-purple)',
                  border: '1px solid var(--class-purple-light)',
                }}
              >
                info@blue-intelligence.com
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        className="glass-surface border-t py-6 px-4"
        style={{ borderColor: 'var(--class-purple-light)' }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="font-semibold" style={{ color: 'var(--text-color)' }}>
                Blue Intelligence
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Empowering Democratic campaigns with data-driven intelligence
              </p>
            </div>
            <div className="flex items-center gap-6">
              <Link href={`${BASE_PATH}/about`} className="text-sm hover:underline" style={{ color: 'var(--text-muted)' }}>
                About
              </Link>
              <Link href={`${BASE_PATH}/contact`} className="text-sm hover:underline" style={{ color: 'var(--text-muted)' }}>
                Contact
              </Link>
              <a
                href="https://github.com/russellteter/blue-intelligence"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm hover:underline"
                style={{ color: 'var(--text-muted)' }}
              >
                GitHub
              </a>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t text-center text-xs" style={{ borderColor: 'var(--class-purple-light)', color: 'var(--text-muted)' }}>
            <p>
              Demo data shown for illustration purposes. Contact us for access to live voter intelligence data.
            </p>
          </div>
        </div>
      </footer>

      {/* Inactive State Modal */}
      <StateModal state={selectedInactiveState} onClose={() => setSelectedInactiveState(null)} />
    </div>
  );
}
