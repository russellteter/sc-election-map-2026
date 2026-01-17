/**
 * State District Map Generator
 *
 * Generates simplified SVG district maps for states that don't have
 * real TIGER/Line shapefiles converted yet. These are placeholder maps
 * with correct district counts and proper ID formatting.
 *
 * In production, these would be replaced with real boundary data from:
 * - Census TIGER/Line shapefiles (SLDL + SLDU)
 * - Converted via mapshaper.org or QGIS to SVG
 */

import * as fs from 'fs';
import * as path from 'path';

interface StateMapConfig {
  code: string;
  name: string;
  chambers: {
    house: { count: number; name: string };
    senate: { count: number; name: string };
  };
  // Approximate aspect ratio and shape hints
  shape: 'wide' | 'tall' | 'square' | 'irregular';
  aspectRatio: number; // width / height
}

const STATE_CONFIGS: StateMapConfig[] = [
  {
    code: 'NC',
    name: 'North Carolina',
    chambers: {
      house: { count: 120, name: 'house' },
      senate: { count: 50, name: 'senate' },
    },
    shape: 'wide',
    aspectRatio: 2.5,
  },
  {
    code: 'GA',
    name: 'Georgia',
    chambers: {
      house: { count: 180, name: 'house' },
      senate: { count: 56, name: 'senate' },
    },
    shape: 'tall',
    aspectRatio: 0.75,
  },
  {
    code: 'FL',
    name: 'Florida',
    chambers: {
      house: { count: 120, name: 'house' },
      senate: { count: 40, name: 'senate' },
    },
    shape: 'irregular', // Peninsula shape
    aspectRatio: 0.9,
  },
  {
    code: 'VA',
    name: 'Virginia',
    chambers: {
      house: { count: 100, name: 'house' },
      senate: { count: 40, name: 'senate' },
    },
    shape: 'wide',
    aspectRatio: 2.2,
  },
];

/**
 * Generate a grid-based approximation of a state's shape
 */
function generateStateOutline(
  config: StateMapConfig,
  width: number,
  height: number
): { included: boolean[][] } {
  const rows = Math.ceil(Math.sqrt(config.chambers.house.count / config.aspectRatio));
  const cols = Math.ceil(config.chambers.house.count / rows);

  const grid: boolean[][] = [];

  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      // By default, include all cells
      let included = true;

      // Apply shape-specific masks
      if (config.shape === 'wide') {
        // Slight curve on top and bottom
        const centerRow = rows / 2;
        const edgeFactor = Math.abs(r - centerRow) / centerRow;
        const maxCols = cols - Math.floor(edgeFactor * 2);
        included = c < maxCols;
      } else if (config.shape === 'tall') {
        // Slight narrowing at bottom
        const bottomFactor = r / rows;
        const maxCols = cols - Math.floor(bottomFactor * 3);
        included = c < maxCols;
      } else if (config.shape === 'irregular' && config.code === 'FL') {
        // Florida peninsula shape
        if (r < rows * 0.3) {
          // Panhandle - narrow strip at top
          included = c < cols * 0.4;
        } else {
          // Peninsula - narrower, centered
          const centerC = cols * 0.6;
          const peninsulaWidth = cols * 0.5 * (1 - (r - rows * 0.3) / (rows * 0.7) * 0.4);
          included = Math.abs(c - centerC) < peninsulaWidth / 2;
        }
      }

      grid[r][c] = included;
    }
  }

  return { included: grid };
}

/**
 * Generate SVG path for a single district cell
 */
function generateDistrictPath(
  x: number,
  y: number,
  width: number,
  height: number,
  id: string,
  chamberPrefix: string,
  districtNum: number
): string {
  // Add slight randomness to make it look more organic
  const jitter = () => (Math.random() - 0.5) * 2;

  const points = [
    `${x + jitter()} ${y + jitter()}`,
    `${x + width + jitter()} ${y + jitter()}`,
    `${x + width + jitter()} ${y + height + jitter()}`,
    `${x + jitter()} ${y + height + jitter()}`,
  ];

  return `<path id="${chamberPrefix}-${districtNum}" d="M ${points[0]} L ${points[1]} L ${points[2]} L ${points[3]} Z" fill="#E5E7EB" stroke="#374151" stroke-width="0.5"/>`;
}

/**
 * Generate complete SVG for a chamber
 */
function generateChamberSvg(
  config: StateMapConfig,
  chamber: 'house' | 'senate'
): string {
  const chamberConfig = config.chambers[chamber];
  const districtCount = chamberConfig.count;

  // Calculate grid dimensions
  const aspectRatio = config.aspectRatio;
  const cols = Math.ceil(Math.sqrt(districtCount * aspectRatio));
  const rows = Math.ceil(districtCount / cols);

  // SVG dimensions
  const svgWidth = 800;
  const svgHeight = Math.round(svgWidth / aspectRatio);
  const padding = 20;

  const cellWidth = (svgWidth - padding * 2) / cols;
  const cellHeight = (svgHeight - padding * 2) / rows;

  // Generate outline mask for state shape
  const outline = generateStateOutline(config, svgWidth, svgHeight);

  // Generate district paths
  const paths: string[] = [];
  let districtNum = 1;

  for (let r = 0; r < rows && districtNum <= districtCount; r++) {
    for (let c = 0; c < cols && districtNum <= districtCount; c++) {
      // Check if this cell should be included based on state shape
      if (outline.included[r]?.[c] !== false) {
        const x = padding + c * cellWidth;
        const y = padding + r * cellHeight;

        paths.push(
          generateDistrictPath(
            x,
            y,
            cellWidth - 1,
            cellHeight - 1,
            `${config.code.toLowerCase()}-${chamber}`,
            chamber,
            districtNum
          )
        );
        districtNum++;
      }
    }
  }

  // If we haven't placed all districts (due to shape masking), add remaining
  while (districtNum <= districtCount) {
    // Find an empty spot or add to existing areas
    for (let r = 0; r < rows && districtNum <= districtCount; r++) {
      for (let c = 0; c < cols && districtNum <= districtCount; c++) {
        if (outline.included[r]?.[c] === false) {
          outline.included[r][c] = true;
          const x = padding + c * cellWidth;
          const y = padding + r * cellHeight;

          paths.push(
            generateDistrictPath(
              x,
              y,
              cellWidth - 1,
              cellHeight - 1,
              `${config.code.toLowerCase()}-${chamber}`,
              chamber,
              districtNum
            )
          );
          districtNum++;
          break;
        }
      }
    }
    // Emergency exit to prevent infinite loop
    if (districtNum <= districtCount) {
      const x = padding + ((districtNum - 1) % cols) * cellWidth;
      const y = padding + Math.floor((districtNum - 1) / cols) * cellHeight;
      paths.push(
        generateDistrictPath(
          x,
          y,
          cellWidth - 1,
          cellHeight - 1,
          `${config.code.toLowerCase()}-${chamber}`,
          chamber,
          districtNum
        )
      );
      districtNum++;
    }
  }

  return `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" version="1.2" baseProfile="tiny" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" stroke-linecap="round" stroke-linejoin="round">
<g id="${config.code.toLowerCase()}_${chamber}_districts">
${paths.join('\n')}
</g>
</svg>`;
}

/**
 * Main function to generate all state maps
 */
async function main() {
  const mapsDir = path.join(__dirname, '..', 'public', 'maps');

  // Ensure maps directory exists
  if (!fs.existsSync(mapsDir)) {
    fs.mkdirSync(mapsDir, { recursive: true });
  }

  console.log('Generating state district maps...\n');

  for (const config of STATE_CONFIGS) {
    console.log(`${config.name} (${config.code}):`);

    // Generate House map
    const houseMapPath = path.join(mapsDir, `${config.code.toLowerCase()}-house-districts.svg`);
    const houseSvg = generateChamberSvg(config, 'house');
    fs.writeFileSync(houseMapPath, houseSvg);
    console.log(`  - House: ${config.chambers.house.count} districts -> ${houseMapPath}`);

    // Generate Senate map
    const senateMapPath = path.join(mapsDir, `${config.code.toLowerCase()}-senate-districts.svg`);
    const senateSvg = generateChamberSvg(config, 'senate');
    fs.writeFileSync(senateMapPath, senateSvg);
    console.log(`  - Senate: ${config.chambers.senate.count} districts -> ${senateMapPath}`);
  }

  console.log('\nMap generation complete!');
  console.log('\nNote: These are simplified placeholder maps.');
  console.log('For production, replace with real TIGER/Line boundary data.');
}

main().catch(console.error);
