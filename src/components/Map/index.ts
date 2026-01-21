/**
 * Map Components Index
 *
 * Exports all map-related components for easy importing.
 */

// SVG-based maps
export { default as DistrictMap } from './DistrictMap';
export { default as MapTooltip } from './MapTooltip';
export { default as Legend } from './Legend';
export { default as ChamberToggle } from './ChamberToggle';
export { default as AnimatedMapContainer } from './AnimatedMapContainer';

// Leaflet-based maps (lazy-loadable)
export { default as LeafletMap } from './LeafletMap';
export { LeafletMap as LeafletMapNamed } from './LeafletMap';
export { default as DistrictGeoJSONLayer } from './DistrictGeoJSONLayer';
export { DistrictGeoJSONLayer as DistrictGeoJSONLayerNamed } from './DistrictGeoJSONLayer';

// Hybrid container (SVG default, Leaflet on demand)
export { default as HybridMapContainer } from './HybridMapContainer';
export { HybridMapContainer as HybridMapContainerNamed } from './HybridMapContainer';

// Utilities
export { injectPatterns } from './patterns';

// Re-export types
export type { ChamberType } from '@/lib/leafletLoader';
