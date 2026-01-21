/**
 * Resource Heatmap Components
 *
 * Phase 15-04: Resource Allocation Heatmap
 * Heat overlay showing where campaign investment yields maximum ROI
 * based on opportunity, mobilization, donor capacity, and trending.
 */

export {
  default as ResourceHeatmap,
  IntensityBadge,
  AllocationCard,
  IntensityLegend,
} from './ResourceHeatmap';
export {
  useResourceHeatmap,
  type ResourceAllocation,
  type ResourceHeatmapSummary,
  type ResourceHeatmapFilters,
} from '@/hooks/useResourceHeatmap';
