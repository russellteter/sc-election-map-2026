'use client';

import { useState, useCallback, useMemo, Suspense, lazy } from 'react';
import AnalyticsTabBar from './AnalyticsTabBar';
import AnalyticsMap, { getDefaultLayerConfig } from './AnalyticsMap';
import ChamberToggle from '@/components/Map/ChamberToggle';
import Legend from '@/components/Map/Legend';
import { useAnalyticsUrl, ANALYTICS_TABS } from '@/hooks/useAnalyticsUrl';
import { useStateContext } from '@/context/StateContext';
import DemoBadge from '@/components/ui/DemoBadge';
import type { CandidatesData, ElectionsData, Chamber } from '@/types/schema';

// Dynamic imports for analytics panels
const ScenarioSimulator = lazy(() => import('@/components/Scenario/ScenarioSimulator'));
const HistoricalComparison = lazy(() => import('@/components/Historical/HistoricalComparison'));
const RecruitmentRadar = lazy(() => import('@/components/Recruitment/RecruitmentRadar'));
const ResourceHeatmap = lazy(() => import('@/components/ResourceHeatmap/ResourceHeatmap'));

// Placeholder components for new features (Phase C)
const DemographicOverlay = lazy(() => import('./DemographicOverlay'));
const CrossStateComparison = lazy(() => import('./CrossStateComparison'));
const EndorsementNetwork = lazy(() => import('./EndorsementNetwork'));

/**
 * Panel loading skeleton
 */
function PanelSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="glass-surface rounded-xl p-4">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
      </div>
      <div className="glass-surface rounded-xl p-4">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
      <div className="glass-surface rounded-xl p-4">
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}

interface AnalyticsDashboardProps {
  /** Candidates data */
  candidatesData: CandidatesData;
  /** Elections data */
  electionsData: ElectionsData | null;
  /** Additional className */
  className?: string;
}

/**
 * AnalyticsDashboard - Unified Analytics Dashboard Container
 *
 * Integrates 7 analytics features into a single tabbed interface:
 * - Scenario Simulator (Phase 15-01)
 * - Historical Comparison (Phase 15-02)
 * - Recruitment Radar (Phase 15-03)
 * - Resource Heatmap (Phase 15-04)
 * - Demographic Overlay (Phase 16-01 - new)
 * - Cross-State Comparison (Phase 16-02 - new)
 * - Endorsement Network (Phase 16-03 - new)
 *
 * Features:
 * - Tab-based navigation
 * - URL deep-linking
 * - Map integration with layer switching
 * - Mobile responsive with bottom nav
 * - Dynamic imports for performance
 */
export default function AnalyticsDashboard({
  candidatesData,
  electionsData,
  className = '',
}: AnalyticsDashboardProps) {
  const { stateConfig, stateCode, isDemo } = useStateContext();
  const {
    state: urlState,
    setTab,
    setChamber,
    setDistrict,
    setState: setUrlState,
  } = useAnalyticsUrl();

  // Local UI state
  const [hoveredDistrict, setHoveredDistrict] = useState<number | null>(null);
  const [showMobilePanel, setShowMobilePanel] = useState(false);

  // Derived state
  const activeTab = urlState.tab;
  const chamber = urlState.chamber as Chamber;
  const selectedDistrict = urlState.district ?? null;

  // District counts
  const houseCount = stateConfig.chambers.house.count;
  const senateCount = stateConfig.chambers.senate.count;
  const chamberLabel = chamber === 'house'
    ? stateConfig.chambers.house.name
    : stateConfig.chambers.senate.name;
  const totalSeats = chamber === 'house' ? houseCount : senateCount;
  const majorityThreshold = Math.floor(totalSeats / 2) + 1;

  // Handle district selection
  const handleDistrictSelect = useCallback((district: number | null) => {
    setDistrict(district ?? undefined);
  }, [setDistrict]);

  // Handle district click from panel
  const handlePanelDistrictClick = useCallback((district: number) => {
    setDistrict(district);
    // On mobile, also hide panel to show map
    if (window.innerWidth < 1024) {
      setShowMobilePanel(false);
    }
  }, [setDistrict]);

  // Get current tab info
  const currentTabInfo = useMemo(() => {
    return ANALYTICS_TABS.find(t => t.id === activeTab)!;
  }, [activeTab]);

  // Get layer config for current tab
  const layerConfig = useMemo(() => {
    return getDefaultLayerConfig(activeTab);
  }, [activeTab]);

  // Render the active panel content
  const renderPanelContent = () => {
    const commonProps = {
      stateCode,
      chamber,
      candidatesData,
      electionsData,
      chamberLabel,
    };

    switch (activeTab) {
      case 'scenario':
        return (
          <ScenarioSimulator
            {...commonProps}
            totalSeats={totalSeats}
            majorityThreshold={majorityThreshold}
          />
        );

      case 'historical':
        return (
          <HistoricalComparison
            {...commonProps}
          />
        );

      case 'recruitment':
        return (
          <RecruitmentRadar
            {...commonProps}
            minScore={urlState.minScore ?? 50}
            maxTargets={15}
            onTargetClick={handlePanelDistrictClick}
          />
        );

      case 'resources':
        return (
          <ResourceHeatmap
            {...commonProps}
            onDistrictClick={handlePanelDistrictClick}
          />
        );

      case 'demographics':
        return (
          <DemographicOverlay
            stateCode={stateCode}
            chamber={chamber}
            activeLayer={urlState.layer}
            onLayerChange={(layer) => setUrlState({ layer })}
            onDistrictClick={handlePanelDistrictClick}
          />
        );

      case 'comparison':
        return (
          <CrossStateComparison
            currentState={stateCode}
            chamber={chamber}
            selectedStates={urlState.states?.split(',') || ['sc', 'nc', 'ga']}
            onStatesChange={(states) => setUrlState({ states: states.join(',') })}
          />
        );

      case 'endorsements':
        return (
          <EndorsementNetwork
            stateCode={stateCode}
            chamber={chamber}
            activeTypes={urlState.endorsementType?.split(',') || []}
            onTypesChange={(types) => setUrlState({ endorsementType: types.join(',') })}
            onDistrictClick={handlePanelDistrictClick}
          />
        );

      default:
        return (
          <div className="glass-surface rounded-xl p-4 text-center">
            <p style={{ color: 'var(--text-muted)' }}>
              Select an analytics feature from the tabs above
            </p>
          </div>
        );
    }
  };

  return (
    <div className={`analytics-dashboard flex flex-col h-full ${className}`}>
      {/* Header */}
      <header
        className="glass-surface border-b px-4 py-3 sticky top-0 z-40"
        style={{ borderColor: 'var(--class-purple-light)' }}
      >
        <div className="flex flex-col gap-3">
          {/* Title row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-lg sm:text-xl font-bold font-display" style={{ color: 'var(--text-color)' }}>
                  {stateConfig.name} Analytics
                </h1>
                <p className="text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
                  {currentTabInfo.icon} {currentTabInfo.label}
                  {isDemo('candidates') && (
                    <span className="ml-2">
                      <DemoBadge />
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ChamberToggle chamber={chamber} onChange={setChamber} />
            </div>
          </div>

          {/* Tab bar (desktop) */}
          <div className="hidden md:block">
            <AnalyticsTabBar
              activeTab={activeTab}
              onTabChange={setTab}
              compact={false}
            />
          </div>

          {/* Tab bar (mobile - compact) */}
          <div className="md:hidden">
            <AnalyticsTabBar
              activeTab={activeTab}
              onTabChange={setTab}
              compact={true}
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Map area */}
        <div
          className={`
            flex-1 relative min-h-[300px] lg:min-h-0
            ${showMobilePanel ? 'hidden lg:block' : ''}
          `}
        >
          <AnalyticsMap
            stateCode={stateCode}
            activeTab={activeTab}
            chamber={chamber}
            candidatesData={candidatesData}
            electionsData={electionsData}
            selectedDistrict={selectedDistrict}
            hoveredDistrict={hoveredDistrict}
            onDistrictSelect={handleDistrictSelect}
            onDistrictHover={setHoveredDistrict}
            layerConfig={layerConfig}
            className="h-full"
          />
          <Legend />

          {/* Hover tooltip */}
          {hoveredDistrict && (
            <div
              className="absolute bottom-4 left-4 glass-surface rounded-lg p-3 shadow-lg z-10"
              style={{ borderColor: 'var(--class-purple-light)' }}
            >
              <span className="font-medium font-display" style={{ color: 'var(--text-color)' }}>
                {chamberLabel} District {hoveredDistrict}
              </span>
            </div>
          )}
        </div>

        {/* Panel area */}
        <aside
          className={`
            w-full lg:w-[420px] xl:w-[480px] glass-surface border-l overflow-y-auto
            ${showMobilePanel ? '' : 'hidden lg:block'}
          `}
          style={{ borderColor: 'var(--class-purple-light)' }}
        >
          <div className="p-4">
            <Suspense fallback={<PanelSkeleton />}>
              {renderPanelContent()}
            </Suspense>
          </div>
        </aside>
      </div>

      {/* Mobile toggle bar */}
      <div className="lg:hidden border-t p-2 glass-surface" style={{ borderColor: 'var(--class-purple-light)' }}>
        <div className="flex gap-2">
          <button
            onClick={() => setShowMobilePanel(false)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              !showMobilePanel ? 'shadow-sm' : ''
            }`}
            style={{
              background: !showMobilePanel
                ? 'linear-gradient(135deg, var(--class-purple-bg) 0%, #E0E7FF 100%)'
                : 'var(--card-bg)',
              color: !showMobilePanel ? 'var(--class-purple)' : 'var(--text-muted)',
              border: `1px solid ${!showMobilePanel ? 'var(--class-purple-light)' : 'var(--border-subtle)'}`,
            }}
          >
            Map
          </button>
          <button
            onClick={() => setShowMobilePanel(true)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              showMobilePanel ? 'shadow-sm' : ''
            }`}
            style={{
              background: showMobilePanel
                ? 'linear-gradient(135deg, var(--class-purple-bg) 0%, #E0E7FF 100%)'
                : 'var(--card-bg)',
              color: showMobilePanel ? 'var(--class-purple)' : 'var(--text-muted)',
              border: `1px solid ${showMobilePanel ? 'var(--class-purple-light)' : 'var(--border-subtle)'}`,
            }}
          >
            Panel
          </button>
        </div>
      </div>
    </div>
  );
}
