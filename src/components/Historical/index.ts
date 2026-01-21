/**
 * Historical Comparison Components
 *
 * Phase 15-02: Historical Comparison Overlay
 * Shows margin changes between election cycles with diverging color scale.
 */

export { default as HistoricalComparison } from './HistoricalComparison';
export { getHistoricalDeltaColor, getHistoricalDeltaLabel, HISTORICAL_DELTA_COLORS } from './HistoricalComparison';
export {
  useHistoricalComparison,
  COMPARISON_PERIODS,
  type ComparisonPeriod,
  type DistrictDelta,
  type ComparisonSummary,
} from '@/hooks/useHistoricalComparison';
