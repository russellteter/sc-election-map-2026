'use client';

import { useState, useEffect } from 'react';
import DistrictMap from '@/components/Map/DistrictMap';
import Legend from '@/components/Map/Legend';
import ChamberToggle from '@/components/Map/ChamberToggle';
import SidePanel from '@/components/Dashboard/SidePanel';

interface Candidate {
  name: string;
  party: string | null;
  status: string;
  filedDate: string | null;
  ethicsUrl: string | null;
  reportId: string;
  source: string;
}

interface District {
  districtNumber: number;
  candidates: Candidate[];
}

interface CandidatesData {
  lastUpdated: string;
  house: Record<string, District>;
  senate: Record<string, District>;
}

export default function Home() {
  const [chamber, setChamber] = useState<'house' | 'senate'>('house');
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<number | null>(null);
  const [candidatesData, setCandidatesData] = useState<CandidatesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load candidates data
  useEffect(() => {
    // Use relative path from current page
    const basePath = window.location.pathname.includes('/sc-election-map-2026')
      ? '/sc-election-map-2026'
      : '';
    fetch(`${basePath}/data/candidates.json`)
      .then((res) => res.json())
      .then((data) => {
        setCandidatesData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load candidates data:', err);
        setIsLoading(false);
      });
  }, []);

  // Clear selection when chamber changes
  useEffect(() => {
    setSelectedDistrict(null);
  }, [chamber]);

  const selectedDistrictData = selectedDistrict && candidatesData
    ? candidatesData[chamber][String(selectedDistrict)]
    : null;

  // Calculate statistics
  const stats = candidatesData ? calculateStats(candidatesData, chamber) : null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading election data...</p>
        </div>
      </div>
    );
  }

  if (!candidatesData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-red-600">
          <p>Failed to load election data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Skip link for keyboard users */}
      <a
        href="#map-container"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg"
      >
        Skip to map
      </a>

      {/* Live region for screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {selectedDistrict
          ? `Selected ${chamber === 'house' ? 'House' : 'Senate'} District ${selectedDistrict}`
          : hoveredDistrict
          ? `Hovering over ${chamber === 'house' ? 'House' : 'Senate'} District ${hoveredDistrict}`
          : ''}
      </div>

      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                SC 2026 Election Map
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Tracking {chamber === 'house' ? '124 House' : '46 Senate'} districts
              </p>
            </div>
            <ChamberToggle chamber={chamber} onChange={setChamber} />
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Map section */}
        <div className="flex-1 flex flex-col p-4">
          {/* Stats bar */}
          {stats && (
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats.democrats}</div>
                  <div className="text-sm text-gray-600">Democrats</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{stats.republicans}</div>
                  <div className="text-sm text-gray-600">Republicans</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-500">{stats.unknown}</div>
                  <div className="text-sm text-gray-600">Unknown Party</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-400">{stats.empty}</div>
                  <div className="text-sm text-gray-600">No Candidates</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{stats.enrichmentPercent}%</div>
                  <div className="text-sm text-gray-600">Party Data</div>
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        stats.enrichmentPercent >= 70
                          ? 'bg-green-500'
                          : stats.enrichmentPercent >= 40
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${stats.enrichmentPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Map container */}
          <div
            id="map-container"
            className="flex-1 bg-white rounded-lg shadow-sm p-4 min-h-[400px]"
            role="region"
            aria-label="Interactive district map"
          >
            <DistrictMap
              chamber={chamber}
              candidatesData={candidatesData}
              selectedDistrict={selectedDistrict}
              onDistrictClick={setSelectedDistrict}
              onDistrictHover={setHoveredDistrict}
            />
          </div>

          {/* Legend */}
          <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
            <Legend />
          </div>

          {/* Hover info */}
          {hoveredDistrict && (
            <div className="fixed bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 border">
              <span className="font-medium">
                {chamber === 'house' ? 'House' : 'Senate'} District {hoveredDistrict}
              </span>
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="w-full lg:w-96 bg-white border-l shadow-sm">
          <SidePanel
            chamber={chamber}
            district={selectedDistrictData}
            onClose={() => setSelectedDistrict(null)}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t py-4 px-4">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-600">
          <p>
            Data updated: {new Date(candidatesData.lastUpdated).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
          <p className="mt-1">
            Source:{' '}
            <a
              href="https://ethicsfiling.sc.gov/public/campaign-reports/reports"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              SC Ethics Commission
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

function calculateStats(data: CandidatesData, chamber: 'house' | 'senate') {
  let democrats = 0;
  let republicans = 0;
  let unknown = 0;
  let empty = 0;
  let totalCandidates = 0;
  let enrichedCandidates = 0;

  const districts = data[chamber];
  for (const district of Object.values(districts)) {
    if (district.candidates.length === 0) {
      empty++;
    } else {
      const hasDem = district.candidates.some(
        (c) => c.party?.toLowerCase() === 'democratic'
      );
      const hasRep = district.candidates.some(
        (c) => c.party?.toLowerCase() === 'republican'
      );

      if (hasDem) democrats++;
      if (hasRep) republicans++;
      if (!hasDem && !hasRep) unknown++;

      // Count individual candidates for enrichment stats
      for (const candidate of district.candidates) {
        totalCandidates++;
        if (candidate.party) {
          enrichedCandidates++;
        }
      }
    }
  }

  const enrichmentPercent = totalCandidates > 0
    ? Math.round((enrichedCandidates / totalCandidates) * 100)
    : 0;

  return { democrats, republicans, unknown, empty, totalCandidates, enrichedCandidates, enrichmentPercent };
}
