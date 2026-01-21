/**
 * Extract South Carolina counties from US counties GeoJSON
 * SC FIPS code is "45"
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const SOURCE_URL = 'https://raw.githubusercontent.com/plotly/datasets/master/geojson-counties-fips.json';
const OUTPUT_PATH = path.join(__dirname, '../public/data/sc-counties.geojson');

console.log('Fetching US counties GeoJSON...');

https.get(SOURCE_URL, (res) => {
  let data = '';

  res.on('data', chunk => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const geojson = JSON.parse(data);
      console.log('Total US counties:', geojson.features.length);

      // Filter to SC counties (FIPS code 45)
      const scCounties = geojson.features.filter(f => f.properties.STATE === '45');
      console.log('SC counties found:', scCounties.length);

      // Create filtered GeoJSON
      const scGeoJson = {
        type: 'FeatureCollection',
        features: scCounties
      };

      // Write to file
      fs.writeFileSync(OUTPUT_PATH, JSON.stringify(scGeoJson));
      console.log('Saved to:', OUTPUT_PATH);

      // List county names
      const names = scCounties.map(f => f.properties.NAME).sort();
      console.log('\nCounties:', names.join(', '));

    } catch (err) {
      console.error('Error parsing GeoJSON:', err.message);
      process.exit(1);
    }
  });

}).on('error', (err) => {
  console.error('Error fetching GeoJSON:', err.message);
  process.exit(1);
});
