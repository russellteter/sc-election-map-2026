'use client';

import { useMemo } from 'react';
import {
  useDemographicData,
  DEMOGRAPHIC_LAYERS,
  DEMOGRAPHIC_COLOR_SCALES,
  type DemographicLayer,
} from '@/hooks/useDemographicData';
import type { Chamber } from '@/types/schema';

interface DemographicOverlayProps {
  /** State code */
  stateCode: string;
  /** Chamber being viewed */
  chamber: Chamber;
  /** Currently active demographic layer */
  activeLayer?: string;
  /** Callback when layer changes */
  onLayerChange?: (layer: string) => void;
  /** Callback when district is clicked */
  onDistrictClick?: (districtNumber: number) => void;
  /** Additional className */
  className?: string;
}

/**
 * Color scale legend component
 */
function ColorScaleLegend({
  layer,
}: {
  layer: DemographicLayer;
}) {
  const scale = DEMOGRAPHIC_COLOR_SCALES[layer];

  // Generate 5 steps for the legend
  const steps = useMemo(() => {
    const range = scale.max - scale.min;
    const stepSize = range / 4;
    return Array.from({ length: 5 }, (_, i) => {
      const value = scale.min + stepSize * i;
      return {
        value,
        color: scale.getColor(value),
        label: scale.formatValue(value),
      };
    });
  }, [scale]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        {steps.map((step, i) => (
          <div key={i} className="flex flex-col items-center">
            <div
              className="w-8 h-4 rounded-sm"
              style={{ backgroundColor: step.color }}
            />
            <span
              className="text-[9px] mt-1"
              style={{ color: 'var(--text-muted)' }}
            >
              {i === 0 || i === 2 || i === 4 ? step.label : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * District stats card component
 */
function DistrictStatCard({
  label,
  value,
  sublabel,
  color,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  color?: string;
}) {
  return (
    <div className="text-center">
      <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
      <div
        className="text-xl font-bold font-display"
        style={{ color: color || 'var(--text-color)' }}
      >
        {value}
      </div>
      {sublabel && (
        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          {sublabel}
        </div>
      )}
    </div>
  );
}

/**
 * DemographicOverlay - Voter Intelligence Choropleth
 *
 * Displays demographic data as a choropleth overlay on the map.
 *
 * Layers:
 * - Registration: Democrat share of Dem+Rep registrations
 * - Turnout: 2024 voter turnout rate
 * - Education: Percent with college degree
 * - Urbanization: Urban/Suburban/Rural classification
 * - Diversity: Racial diversity index
 *
 * @example
 * ```tsx
 * <DemographicOverlay
 *   stateCode="SC"
 *   chamber="house"
 *   activeLayer="registration"
 *   onLayerChange={(layer) => setLayer(layer)}
 * />
 * ```
 */
export default function DemographicOverlay({
  stateCode,
  chamber,
  activeLayer = 'registration',
  onLayerChange,
  onDistrictClick,
  className = '',
}: DemographicOverlayProps) {
  const currentLayer = activeLayer as DemographicLayer;

  const {
    data,
    isLoading,
    error,
    colorScale,
    getDistrictColor,
    // getDistrictValue exposed by hook for map overlay integration
    summary,
  } = useDemographicData({
    stateCode,
    chamber,
    activeLayer: currentLayer,
  });

  // Get top districts for current layer
  const topDistricts = useMemo(() => {
    if (!data) return [];

    const districts = Object.values(data)
      .map((d) => ({
        districtNumber: d.districtNumber,
        value: colorScale.getValue(d),
        formatted: colorScale.formatValue(colorScale.getValue(d)),
        color: getDistrictColor(d.districtNumber),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    return districts;
  }, [data, colorScale, getDistrictColor]);

  // Loading state
  if (isLoading) {
    return (
      <div className={`demographic-overlay ${className}`}>
        <div className="glass-surface rounded-xl p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className={`demographic-overlay ${className}`}>
        <div className="glass-surface rounded-xl p-4 text-center">
          <div
            className="w-10 h-10 mx-auto mb-3 rounded-full flex items-center justify-center"
            style={{ background: 'var(--color-at-risk-bg)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="var(--color-at-risk)" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Demographic data not available for {stateCode}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`demographic-overlay ${className}`}>
      {/* Header */}
      <div
        className="glass-surface rounded-t-xl p-4 border-b"
        style={{ borderColor: 'var(--class-purple-light)' }}
      >
        <h2 className="font-display font-bold text-lg" style={{ color: 'var(--text-color)' }}>
          Demographic Overlay
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {colorScale.label} - {colorScale.description}
        </p>
      </div>

      {/* Layer selector */}
      <div
        className="glass-surface p-3 border-b"
        style={{ borderColor: 'var(--class-purple-light)' }}
      >
        <div className="flex flex-wrap gap-2">
          {DEMOGRAPHIC_LAYERS.map((layer) => {
            const isActive = currentLayer === layer.id;
            return (
              <button
                key={layer.id}
                onClick={() => onLayerChange?.(layer.id)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${isActive ? 'shadow-sm' : 'hover:opacity-80'}
                `}
                style={{
                  background: isActive
                    ? 'linear-gradient(135deg, var(--class-purple-bg) 0%, #E0E7FF 100%)'
                    : 'var(--card-bg)',
                  color: isActive ? 'var(--class-purple)' : 'var(--text-muted)',
                  border: `1px solid ${isActive ? 'var(--class-purple-light)' : 'var(--border-subtle)'}`,
                }}
              >
                <span role="img" aria-hidden="true">{layer.icon}</span>
                {layer.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary stats */}
      {summary && (
        <div
          className="glass-surface p-4 border-b"
          style={{ borderColor: 'var(--class-purple-light)' }}
        >
          <div className="grid grid-cols-4 gap-4">
            <DistrictStatCard
              label="Districts"
              value={summary.totalDistricts}
            />
            <DistrictStatCard
              label="Average"
              value={colorScale.formatValue(summary.avgValue)}
              color="var(--class-purple)"
            />
            <DistrictStatCard
              label="Min"
              value={colorScale.formatValue(summary.minValue)}
            />
            <DistrictStatCard
              label="Max"
              value={colorScale.formatValue(summary.maxValue)}
            />
          </div>
        </div>
      )}

      {/* Color scale legend */}
      <div
        className="glass-surface p-3 border-b"
        style={{ borderColor: 'var(--class-purple-light)' }}
      >
        <ColorScaleLegend layer={currentLayer} />
      </div>

      {/* Top districts list */}
      <div className="glass-surface p-4">
        <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-muted)' }}>
          Top 10 Districts
        </h3>
        <div className="space-y-2">
          {topDistricts.map((district, index) => (
            <button
              key={district.districtNumber}
              onClick={() => onDistrictClick?.(district.districtNumber)}
              className="w-full flex items-center justify-between p-2 rounded-lg border transition-all hover:shadow-sm hover:-translate-y-0.5"
              style={{
                background: 'var(--card-bg)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: index < 3 ? district.color : 'var(--class-purple-light)',
                    color: index < 3 ? 'white' : 'var(--text-color)',
                  }}
                >
                  {index + 1}
                </span>
                <span className="font-medium" style={{ color: 'var(--text-color)' }}>
                  District {district.districtNumber}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                  {district.formatted}
                </span>
                <div
                  className="w-4 h-4 rounded-sm"
                  style={{ backgroundColor: district.color }}
                />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div
        className="glass-surface rounded-b-xl p-3 text-center border-t"
        style={{ borderColor: 'var(--class-purple-light)' }}
      >
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Data source: Voter registration files and census data
        </p>
      </div>
    </div>
  );
}
