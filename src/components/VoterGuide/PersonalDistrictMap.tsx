'use client';

import { useEffect, useState, useCallback, useRef, Suspense, lazy } from 'react';
import { importLeaflet, SC_BOUNDS, SC_CENTER, TILE_LAYERS, GEOJSON_PATHS, getBasePath, getDistrictPropertyKey } from '@/lib/leafletLoader';
import { getGeoJsonFromCache, setGeoJsonInCache } from '@/lib/cacheUtils';
import { getDistrictFillColor, getCongressionalFillColor, SC_CONGRESSIONAL_REPS } from '@/lib/districtColors';
import type { Map as LeafletMap, LatLngExpression, Marker as LeafletMarker, Layer, PathOptions, LatLngBounds } from 'leaflet';
import type { FeatureCollection, Feature, Polygon, MultiPolygon } from 'geojson';
import type { CandidatesData, ElectionsData } from '@/types/schema';

interface PersonalDistrictMapProps {
  /** User's latitude */
  lat: number;
  /** User's longitude */
  lon: number;
  /** User's house district number */
  houseDistrict: number | null;
  /** User's senate district number */
  senateDistrict: number | null;
  /** User's congressional district number */
  congressionalDistrict: number | null;
  /** Candidate data for coloring (optional) */
  candidatesData?: CandidatesData | null;
  /** Election data for margin-based coloring (optional) */
  electionsData?: ElectionsData | null;
  /** Display address for popup */
  displayAddress?: string;
  /** Additional className */
  className?: string;
  /** Animate zoom to user location on mount (default: true) */
  animateOnMount?: boolean;
  /** Initial chamber to show (default: 'house') */
  initialChamber?: 'house' | 'senate' | 'congressional';
}

type ChamberType = 'house' | 'senate' | 'congressional';

/**
 * Loading placeholder
 */
function MapLoadingPlaceholder() {
  return (
    <div className="personal-district-map-loading">
      <div className="leaflet-loading-content">
        <div className="leaflet-loading-spinner" />
        <span>Loading your district map...</span>
      </div>
    </div>
  );
}

/**
 * PersonalDistrictMap - Interactive map centered on user's location
 *
 * Shows the user's address with a marker, surrounded by their district boundaries.
 * Animates from state view to user location on mount.
 *
 * Features:
 * - Animated zoom from state to user location
 * - User location marker with popup
 * - District boundaries (House, Senate, Congressional)
 * - Chamber toggle to switch views
 * - Glassmorphic styling matching design system
 */
export default function PersonalDistrictMap({
  lat,
  lon,
  houseDistrict,
  senateDistrict,
  congressionalDistrict,
  candidatesData,
  electionsData,
  displayAddress,
  className = '',
  animateOnMount = true,
  initialChamber = 'house',
}: PersonalDistrictMapProps) {
  const [leaflet, setLeaflet] = useState<Awaited<ReturnType<typeof importLeaflet>>>(null);
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [chamber, setChamber] = useState<ChamberType>(initialChamber);
  const [geoJsonData, setGeoJsonData] = useState<Record<ChamberType, FeatureCollection | null>>({
    house: null,
    senate: null,
    congressional: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hasAnimated, setHasAnimated] = useState(false);
  const markerRef = useRef<LeafletMarker | null>(null);
  const geoJsonLayerRef = useRef<Layer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const userLocation: LatLngExpression = [lat, lon];

  // Load Leaflet
  useEffect(() => {
    importLeaflet().then(setLeaflet);
  }, []);

  // Load GeoJSON for current chamber
  useEffect(() => {
    if (!chamber) return;
    if (geoJsonData[chamber]) return; // Already loaded

    const cacheKey = `sc-${chamber}-districts`;

    async function loadGeoJSON() {
      try {
        // Try cache first
        const cached = await getGeoJsonFromCache(cacheKey);
        if (cached) {
          setGeoJsonData(prev => ({ ...prev, [chamber]: cached }));
          return;
        }

        // Fetch from network
        const basePath = getBasePath();
        const path = GEOJSON_PATHS[chamber];
        const response = await fetch(`${basePath}${path}`);

        if (!response.ok) throw new Error(`Failed to load ${chamber} GeoJSON`);

        const data = await response.json();
        setGeoJsonData(prev => ({ ...prev, [chamber]: data }));

        // Cache for future
        setGeoJsonInCache(cacheKey, data).catch(console.error);
      } catch (err) {
        console.error(`Failed to load ${chamber} GeoJSON:`, err);
      }
    }

    loadGeoJSON();
  }, [chamber, geoJsonData]);

  // Initialize map
  useEffect(() => {
    if (!leaflet || !containerRef.current) return;

    const { L } = leaflet;

    // Create map starting at state level (will animate to user)
    const newMap = L.map(containerRef.current, {
      center: SC_CENTER,
      zoom: 7,
      minZoom: 6,
      maxZoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    // Add tile layer
    const tileConfig = TILE_LAYERS.positron;
    L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: tileConfig.maxZoom,
      subdomains: tileConfig.subdomains,
    }).addTo(newMap);

    // Add zoom control (top right)
    L.control.zoom({ position: 'topright' }).addTo(newMap);

    // Add attribution (bottom right)
    L.control.attribution({ position: 'bottomright' }).addTo(newMap);

    setMap(newMap);
    setIsLoading(false);

    return () => {
      newMap.remove();
    };
  }, [leaflet]);

  // Add user marker
  useEffect(() => {
    if (!map || !leaflet) return;

    const { L } = leaflet;

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.remove();
    }

    // Create custom icon for user location
    const userIcon = L.divIcon({
      className: 'user-location-marker',
      html: `
        <div class="user-marker-pulse"></div>
        <div class="user-marker-dot"></div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    // Add marker
    const marker = L.marker(userLocation, { icon: userIcon }).addTo(map);

    // Add popup with address
    if (displayAddress) {
      marker.bindPopup(`
        <div class="user-popup">
          <strong>Your Location</strong>
          <p>${displayAddress}</p>
          <p class="districts-info">
            ${houseDistrict ? `House District ${houseDistrict}` : ''}
            ${houseDistrict && senateDistrict ? ' • ' : ''}
            ${senateDistrict ? `Senate District ${senateDistrict}` : ''}
            ${congressionalDistrict ? ` • US Congress CD-${congressionalDistrict}` : ''}
          </p>
        </div>
      `, { className: 'glassmorphic-popup' });
    }

    markerRef.current = marker;

    return () => {
      marker.remove();
    };
  }, [map, leaflet, lat, lon, displayAddress, houseDistrict, senateDistrict, congressionalDistrict]);

  // Animate to user location on mount
  useEffect(() => {
    if (!map || !animateOnMount || hasAnimated) return;

    // Small delay to let map initialize
    const timer = setTimeout(() => {
      map.flyTo(userLocation, 11, {
        duration: 1.5,
        easeLinearity: 0.25,
      });
      setHasAnimated(true);

      // Open popup after animation
      setTimeout(() => {
        if (markerRef.current) {
          markerRef.current.openPopup();
        }
      }, 1600);
    }, 500);

    return () => clearTimeout(timer);
  }, [map, animateOnMount, hasAnimated, userLocation]);

  // Get user's district number for current chamber
  const getUserDistrict = useCallback(() => {
    switch (chamber) {
      case 'house': return houseDistrict;
      case 'senate': return senateDistrict;
      case 'congressional': return congressionalDistrict;
    }
  }, [chamber, houseDistrict, senateDistrict, congressionalDistrict]);

  // Style function for GeoJSON
  const getStyle = useCallback((feature: Feature<Polygon | MultiPolygon> | undefined): PathOptions => {
    if (!feature) return {};

    const propKey = getDistrictPropertyKey(chamber);
    const districtId = feature.properties?.[propKey];
    if (!districtId) return {};

    const districtNum = parseInt(String(districtId), 10);
    const isUserDistrict = districtNum === getUserDistrict();

    // Get fill color
    let fillColor: string;
    if (chamber === 'congressional') {
      fillColor = getCongressionalFillColor(String(districtId).padStart(2, '0'));
    } else {
      const districtData = candidatesData?.[chamber]?.[String(districtNum)];
      const electionHistory = electionsData?.[chamber]?.[String(districtNum)];
      fillColor = getDistrictFillColor(districtData, electionHistory, true);
    }

    return {
      fillColor,
      fillOpacity: isUserDistrict ? 0.6 : 0.3,
      color: isUserDistrict ? '#1E40AF' : '#64748B',
      weight: isUserDistrict ? 3 : 1,
      opacity: isUserDistrict ? 1 : 0.6,
    };
  }, [chamber, candidatesData, electionsData, getUserDistrict]);

  // Add GeoJSON layer
  useEffect(() => {
    if (!map || !leaflet || !geoJsonData[chamber]) return;

    const { L } = leaflet;

    // Remove existing layer
    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current);
    }

    // Add new layer
    const layer = L.geoJSON(geoJsonData[chamber]!, {
      style: (feature) => getStyle(feature as Feature<Polygon | MultiPolygon>),
      onEachFeature: (feature, featureLayer) => {
        const propKey = getDistrictPropertyKey(chamber);
        const districtId = feature.properties?.[propKey];
        if (!districtId) return;

        const districtNum = parseInt(String(districtId), 10);
        const isUserDistrict = districtNum === getUserDistrict();

        // Tooltip
        let tooltipContent = '';
        if (chamber === 'congressional') {
          const rep = SC_CONGRESSIONAL_REPS[String(districtId).padStart(2, '0')];
          tooltipContent = `<strong>US Congressional District ${districtNum}</strong>`;
          if (rep) {
            tooltipContent += `<br>${rep.name} (${rep.party})`;
          }
        } else {
          tooltipContent = `<strong>${chamber === 'house' ? 'House' : 'Senate'} District ${districtNum}</strong>`;
        }

        if (isUserDistrict) {
          tooltipContent += '<br><em>Your district</em>';
        }

        featureLayer.bindTooltip(tooltipContent, { sticky: true });

        // Hover effects
        featureLayer.on('mouseover', () => {
          if (!isUserDistrict) {
            (featureLayer as L.Path).setStyle({ fillOpacity: 0.5 });
          }
        });

        featureLayer.on('mouseout', () => {
          (featureLayer as L.Path).setStyle(getStyle(feature as Feature<Polygon | MultiPolygon>));
        });
      },
    }).addTo(map);

    geoJsonLayerRef.current = layer;

    return () => {
      layer.remove();
    };
  }, [map, leaflet, chamber, geoJsonData, getStyle, getUserDistrict]);

  // Chamber options
  const chamberOptions = [
    { value: 'house' as const, label: 'House', district: houseDistrict },
    { value: 'senate' as const, label: 'Senate', district: senateDistrict },
    { value: 'congressional' as const, label: 'Congress', district: congressionalDistrict },
  ];

  // Zoom to user district
  const zoomToMyDistrict = useCallback(() => {
    if (!map) return;
    map.flyTo(userLocation, 11, { duration: 0.8 });
    setTimeout(() => {
      if (markerRef.current) {
        markerRef.current.openPopup();
      }
    }, 900);
  }, [map, userLocation]);

  // Zoom to state
  const zoomToState = useCallback(() => {
    if (!map) return;
    map.flyToBounds(SC_BOUNDS as LatLngBounds, { duration: 0.8, padding: [20, 20] });
  }, [map]);

  return (
    <div className={`personal-district-map ${className}`}>
      {/* Chamber Toggle */}
      <div className="personal-map-controls">
        <div className="chamber-toggle-group">
          {chamberOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setChamber(option.value)}
              className={`chamber-btn ${chamber === option.value ? 'active' : ''}`}
              disabled={option.district === null}
              title={option.district === null ? 'District not found' : `View ${option.label} District ${option.district}`}
            >
              {option.label}
              {option.district !== null && (
                <span className="district-badge">#{option.district}</span>
              )}
            </button>
          ))}
        </div>
        <div className="zoom-controls">
          <button onClick={zoomToMyDistrict} className="zoom-btn" title="Zoom to my location">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button onClick={zoomToState} className="zoom-btn" title="View full state">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div
        ref={containerRef}
        className="personal-map-container"
      />

      {/* Loading overlay */}
      {isLoading && <MapLoadingPlaceholder />}

      {/* District Info Badge */}
      <div className="district-info-badge">
        <span className="badge-label">Your {chamber === 'congressional' ? 'Congressional' : chamber === 'house' ? 'House' : 'Senate'} District:</span>
        <span className="badge-value">#{getUserDistrict() || '—'}</span>
      </div>
    </div>
  );
}
