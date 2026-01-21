/**
 * Extract Congressional District GeoJSON for specific states
 * Uses Census Bureau Cartographic Boundary Files (GeoJSON format)
 *
 * Usage: node scripts/extract-state-congressional.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Census Bureau 118th Congress (2023-2024) cartographic boundary file
// 500k resolution is a good balance between detail and file size
const SOURCE_URL = 'https://www2.census.gov/geo/tiger/GENZ2023/shp/cb_2023_us_cd118_500k.zip';

// Alternative: Use the pre-converted GeoJSON from github
const GEOJSON_URL = 'https://raw.githubusercontent.com/OpenDataDE/State-zip-code-GeoJSON/master/us_congressional_districts.json';

// State FIPS codes for our target states
const STATE_FIPS = {
  'NC': '37', // North Carolina
  'GA': '13', // Georgia
  'FL': '12', // Florida
  'VA': '51', // Virginia
};

const OUTPUT_DIR = path.join(__dirname, '../public/data');

// Try alternative source
const ALT_SOURCE = 'https://theunitedstates.io/districts/cds/2022/all.geojson';

console.log('Fetching US Congressional Districts GeoJSON from theunitedstates.io...');

function fetchAndParse(url, callback) {
  https.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Node.js script)'
    }
  }, (res) => {
    if (res.statusCode === 301 || res.statusCode === 302) {
      console.log('Redirecting to:', res.headers.location);
      fetchAndParse(res.headers.location, callback);
      return;
    }

    if (res.statusCode !== 200) {
      callback(new Error(`HTTP ${res.statusCode}`), null);
      return;
    }

    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => callback(null, data));
  }).on('error', (err) => callback(err, null));
}

fetchAndParse(ALT_SOURCE, (err, data) => {
  if (err) {
    console.error('Error fetching from primary source:', err.message);
    console.log('\nTrying backup approach with manual district definitions...');
    createMinimalGeoJSON();
    return;
  }

  try {
    const geojson = JSON.parse(data);
    console.log('Total US congressional districts:', geojson.features.length);

    processGeoJSON(geojson);
  } catch (parseErr) {
    console.error('Error parsing GeoJSON:', parseErr.message);
    console.log('\nTrying backup approach with manual district definitions...');
    createMinimalGeoJSON();
  }
});

function processGeoJSON(geojson) {
  // Extract districts for each state
  for (const [stateCode, fips] of Object.entries(STATE_FIPS)) {
    const stateDistricts = geojson.features.filter(f => {
      // Check various property formats
      const stateFips = f.properties?.STATEFP ||
                        f.properties?.STATEFP20 ||
                        f.properties?.state ||
                        f.id?.substring(0, 2);
      return stateFips === fips;
    });

    console.log(`${stateCode} congressional districts found:`, stateDistricts.length);

    if (stateDistricts.length > 0) {
      // Create state-specific GeoJSON
      const stateGeoJson = {
        type: 'FeatureCollection',
        features: stateDistricts.map(f => {
          // Normalize property names to match SC format
          const cd = f.properties?.CD118FP ||
                     f.properties?.CD116FP ||
                     f.properties?.district ||
                     f.properties?.CD ||
                     f.id?.substring(2) ||
                     '00';
          return {
            type: 'Feature',
            geometry: f.geometry,
            properties: {
              CD118FP: String(cd).padStart(2, '0'),
              STATEFP: fips,
              NAME: f.properties?.NAME || `Congressional District ${cd}`,
            }
          };
        })
      };

      // Write to file
      const outputPath = path.join(OUTPUT_DIR, `${stateCode.toLowerCase()}-congressional-districts.geojson`);
      fs.writeFileSync(outputPath, JSON.stringify(stateGeoJson));
      console.log(`Saved to: ${outputPath}`);
    }
  }

  console.log('\nDone! Congressional district files created.');
}

/**
 * Create minimal placeholder GeoJSON files
 * These will have bounding box polygons for each state's districts
 * Real data should be downloaded from Census Bureau
 */
function createMinimalGeoJSON() {
  console.log('Creating placeholder GeoJSON files...');
  console.log('NOTE: These are bounding-box approximations.');
  console.log('For production, download real data from Census Bureau.\n');

  // State district counts (118th Congress)
  const districtCounts = {
    'NC': 14, // North Carolina has 14 congressional districts
    'GA': 14, // Georgia has 14 congressional districts
    'FL': 28, // Florida has 28 congressional districts
    'VA': 11, // Virginia has 11 congressional districts
  };

  // Approximate state bounds
  const stateBounds = {
    'NC': { minLat: 33.84, maxLat: 36.59, minLng: -84.32, maxLng: -75.46 },
    'GA': { minLat: 30.36, maxLat: 35.00, minLng: -85.61, maxLng: -80.84 },
    'FL': { minLat: 24.52, maxLat: 31.00, minLng: -87.63, maxLng: -80.03 },
    'VA': { minLat: 36.54, maxLat: 39.47, minLng: -83.68, maxLng: -75.17 },
  };

  for (const [stateCode, count] of Object.entries(districtCounts)) {
    const bounds = stateBounds[stateCode];
    const fips = STATE_FIPS[stateCode];

    // Create simple grid of districts (placeholder)
    const features = [];
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);

    const latStep = (bounds.maxLat - bounds.minLat) / rows;
    const lngStep = (bounds.maxLng - bounds.minLng) / cols;

    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;

      const minLat = bounds.minLat + row * latStep;
      const maxLat = minLat + latStep;
      const minLng = bounds.minLng + col * lngStep;
      const maxLng = minLng + lngStep;

      features.push({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [minLng, minLat],
            [maxLng, minLat],
            [maxLng, maxLat],
            [minLng, maxLat],
            [minLng, minLat],
          ]]
        },
        properties: {
          CD118FP: String(i + 1).padStart(2, '0'),
          STATEFP: fips,
          NAME: `Congressional District ${i + 1}`,
        }
      });
    }

    const stateGeoJson = {
      type: 'FeatureCollection',
      features
    };

    const outputPath = path.join(OUTPUT_DIR, `${stateCode.toLowerCase()}-congressional-districts.geojson`);
    fs.writeFileSync(outputPath, JSON.stringify(stateGeoJson));
    console.log(`Created placeholder: ${outputPath} (${count} districts)`);
  }

  console.log('\nPlaceholder files created.');
  console.log('For accurate boundaries, download from:');
  console.log('https://www.census.gov/geographies/mapping-files/time-series/geo/cartographic-boundary.html');
}
