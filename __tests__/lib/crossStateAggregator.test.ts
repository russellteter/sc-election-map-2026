/**
 * Tests for crossStateAggregator.ts
 *
 * Tests cross-state comparison and aggregation utilities
 */

import {
  calculateStateSummary,
  aggregateCrossStateComparison,
  getMetricValue,
  getMetricConfig,
  type StateSummary,
  type ComparisonMetric,
} from '@/lib/crossStateAggregator';
import type { CandidatesData, Chamber } from '@/types/schema';

// =============================================================================
// Test Fixtures
// =============================================================================

/**
 * Create mock candidates data for testing
 */
function createMockCandidatesData(options: {
  houseDistricts?: number;
  senateDistricts?: number;
  demIncumbents?: number[];
  repIncumbents?: number[];
  demChallengers?: number[];
  openSeats?: number[];
}): CandidatesData {
  const {
    houseDistricts = 5,
    senateDistricts = 3,
    demIncumbents = [],
    repIncumbents = [1, 2],
    demChallengers = [],
    openSeats = [],
  } = options;

  const createDistricts = (count: number, chamber: Chamber) => {
    const districts: CandidatesData['house'] = {};
    for (let i = 1; i <= count; i++) {
      const isDemIncumbent = demIncumbents.includes(i);
      const isRepIncumbent = repIncumbents.includes(i);
      const hasDemChallenger = demChallengers.includes(i);
      const isOpenSeat = openSeats.includes(i);

      const candidates = [];

      // Add incumbent if not open seat
      if (!isOpenSeat) {
        if (isDemIncumbent) {
          candidates.push({
            name: `Dem Incumbent ${i}`,
            party: 'Democratic',
            status: 'filed',
            filedDate: '2024-01-15',
            ethicsUrl: null,
            reportId: `D${i}`,
            source: 'test',
            isIncumbent: true,
          });
        } else if (isRepIncumbent) {
          candidates.push({
            name: `Rep Incumbent ${i}`,
            party: 'Republican',
            status: 'filed',
            filedDate: '2024-01-15',
            ethicsUrl: null,
            reportId: `R${i}`,
            source: 'test',
            isIncumbent: true,
          });
        }
      }

      // Add dem challenger if specified
      if (hasDemChallenger && !isDemIncumbent) {
        candidates.push({
          name: `Dem Challenger ${i}`,
          party: 'Democratic',
          status: 'filed',
          filedDate: '2024-02-01',
          ethicsUrl: null,
          reportId: `DC${i}`,
          source: 'test',
          isIncumbent: false,
        });
      }

      districts[String(i)] = {
        districtNumber: i,
        candidates,
        incumbent: isOpenSeat
          ? null
          : isDemIncumbent
          ? { name: `Dem Incumbent ${i}`, party: 'Democratic' }
          : isRepIncumbent
          ? { name: `Rep Incumbent ${i}`, party: 'Republican' }
          : null,
      };
    }
    return districts;
  };

  return {
    lastUpdated: new Date().toISOString(),
    house: createDistricts(houseDistricts, 'house'),
    senate: createDistricts(senateDistricts, 'senate'),
  };
}

// =============================================================================
// calculateStateSummary Tests
// =============================================================================

describe('calculateStateSummary', () => {
  it('returns zeroed summary when candidatesData is null', () => {
    const summary = calculateStateSummary('SC', 'South Carolina', 'house', null);

    expect(summary).toEqual({
      stateCode: 'SC',
      stateName: 'South Carolina',
      chamber: 'house',
      totalDistricts: 0,
      demIncumbents: 0,
      repIncumbents: 0,
      demChallengers: 0,
      contested: 0,
      uncontested: 0,
      openSeats: 0,
      demCoverage: 0,
      competitiveDistricts: 0,
    });
  });

  it('correctly counts total districts', () => {
    const data = createMockCandidatesData({ houseDistricts: 10 });
    const summary = calculateStateSummary('SC', 'South Carolina', 'house', data);

    expect(summary.totalDistricts).toBe(10);
  });

  it('correctly counts Democratic incumbents', () => {
    const data = createMockCandidatesData({
      houseDistricts: 5,
      demIncumbents: [1, 3, 5],
      repIncumbents: [2, 4],
    });
    const summary = calculateStateSummary('SC', 'South Carolina', 'house', data);

    expect(summary.demIncumbents).toBe(3);
    expect(summary.repIncumbents).toBe(2);
  });

  it('correctly counts Republican incumbents', () => {
    const data = createMockCandidatesData({
      houseDistricts: 6,
      demIncumbents: [1],
      repIncumbents: [2, 3, 4, 5, 6],
    });
    const summary = calculateStateSummary('SC', 'South Carolina', 'house', data);

    expect(summary.repIncumbents).toBe(5);
  });

  it('correctly counts Democratic challengers', () => {
    const data = createMockCandidatesData({
      houseDistricts: 5,
      demIncumbents: [1],
      repIncumbents: [2, 3, 4, 5],
      demChallengers: [2, 3], // Dems challenging R-held seats
    });
    const summary = calculateStateSummary('SC', 'South Carolina', 'house', data);

    expect(summary.demChallengers).toBe(2);
  });

  it('correctly counts contested races (both parties present)', () => {
    const data = createMockCandidatesData({
      houseDistricts: 5,
      repIncumbents: [1, 2, 3, 4, 5],
      demChallengers: [1, 2, 3], // 3 contested races
    });
    const summary = calculateStateSummary('SC', 'South Carolina', 'house', data);

    expect(summary.contested).toBe(3);
    // Districts 4 and 5 have only R incumbent, no D challenger
    expect(summary.uncontested).toBe(2);
  });

  it('correctly counts open seats', () => {
    const data = createMockCandidatesData({
      houseDistricts: 5,
      demIncumbents: [1],
      repIncumbents: [2, 3],
      openSeats: [4, 5],
    });
    const summary = calculateStateSummary('SC', 'South Carolina', 'house', data);

    expect(summary.openSeats).toBe(2);
  });

  it('calculates demCoverage percentage correctly', () => {
    const data = createMockCandidatesData({
      houseDistricts: 10,
      demIncumbents: [1, 2], // 2 D incumbents
      repIncumbents: [3, 4, 5, 6, 7, 8, 9, 10],
      demChallengers: [3, 4, 5], // 3 more with D challengers
    });
    const summary = calculateStateSummary('SC', 'South Carolina', 'house', data);

    // 5 out of 10 have Dem presence (2 incumbents + 3 challengers)
    expect(summary.demCoverage).toBe(50);
  });

  it('handles 100% demCoverage', () => {
    const data = createMockCandidatesData({
      houseDistricts: 5,
      demIncumbents: [1, 2, 3, 4, 5],
    });
    const summary = calculateStateSummary('SC', 'South Carolina', 'house', data);

    expect(summary.demCoverage).toBe(100);
  });

  it('handles 0% demCoverage', () => {
    const data = createMockCandidatesData({
      houseDistricts: 5,
      demIncumbents: [],
      repIncumbents: [1, 2, 3, 4, 5],
      demChallengers: [],
    });
    const summary = calculateStateSummary('SC', 'South Carolina', 'house', data);

    expect(summary.demCoverage).toBe(0);
  });

  it('works with senate chamber', () => {
    const data = createMockCandidatesData({
      senateDistricts: 10,
      demIncumbents: [1, 2, 3],
      repIncumbents: [4, 5, 6, 7, 8, 9, 10],
    });
    const summary = calculateStateSummary('SC', 'South Carolina', 'senate', data);

    expect(summary.chamber).toBe('senate');
    expect(summary.totalDistricts).toBe(10);
    expect(summary.demIncumbents).toBe(3);
  });
});

// =============================================================================
// aggregateCrossStateComparison Tests
// =============================================================================

describe('aggregateCrossStateComparison', () => {
  it('aggregates data from multiple states', () => {
    const scData = createMockCandidatesData({
      houseDistricts: 100,
      demIncumbents: [1, 2, 3, 4, 5], // 5 D incumbents
      repIncumbents: Array.from({ length: 95 }, (_, i) => i + 6), // 95 R incumbents
    });

    const ncData = createMockCandidatesData({
      houseDistricts: 120,
      demIncumbents: Array.from({ length: 40 }, (_, i) => i + 1), // 40 D incumbents
      repIncumbents: Array.from({ length: 80 }, (_, i) => i + 41), // 80 R incumbents
    });

    const states = [
      { code: 'SC', name: 'South Carolina', data: scData },
      { code: 'NC', name: 'North Carolina', data: ncData },
    ];

    const result = aggregateCrossStateComparison(states, 'house');

    expect(result.states).toHaveLength(2);
    expect(result.totals.totalDistricts).toBe(220); // 100 + 120
    expect(result.totals.totalDemIncumbents).toBe(45); // 5 + 40
    expect(result.totals.totalRepIncumbents).toBe(175); // 95 + 80
  });

  it('calculates average demCoverage across states', () => {
    const stateA = createMockCandidatesData({
      houseDistricts: 10,
      demIncumbents: [1, 2, 3, 4, 5, 6, 7, 8], // 80% coverage
      repIncumbents: [9, 10],
    });

    const stateB = createMockCandidatesData({
      houseDistricts: 10,
      demIncumbents: [1, 2], // 20% coverage
      repIncumbents: [3, 4, 5, 6, 7, 8, 9, 10],
    });

    const states = [
      { code: 'A', name: 'State A', data: stateA },
      { code: 'B', name: 'State B', data: stateB },
    ];

    const result = aggregateCrossStateComparison(states, 'house');

    // Average of 80% and 20% = 50%
    expect(result.totals.avgDemCoverage).toBe(50);
  });

  it('ranks states by coverage (highest first)', () => {
    const stateHigh = createMockCandidatesData({
      houseDistricts: 10,
      demIncumbents: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // 100%
    });

    const stateMedium = createMockCandidatesData({
      houseDistricts: 10,
      demIncumbents: [1, 2, 3, 4, 5], // 50%
      repIncumbents: [6, 7, 8, 9, 10],
    });

    const stateLow = createMockCandidatesData({
      houseDistricts: 10,
      demIncumbents: [1], // 10%
      repIncumbents: [2, 3, 4, 5, 6, 7, 8, 9, 10],
    });

    const states = [
      { code: 'LOW', name: 'Low Coverage', data: stateLow },
      { code: 'HIGH', name: 'High Coverage', data: stateHigh },
      { code: 'MED', name: 'Medium Coverage', data: stateMedium },
    ];

    const result = aggregateCrossStateComparison(states, 'house');

    expect(result.rankings.byCoverage[0].stateCode).toBe('HIGH');
    expect(result.rankings.byCoverage[1].stateCode).toBe('MED');
    expect(result.rankings.byCoverage[2].stateCode).toBe('LOW');
  });

  it('ranks states by competitive races (highest first)', () => {
    const stateFew = createMockCandidatesData({
      houseDistricts: 10,
      repIncumbents: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      demChallengers: [1], // 1 contested
    });

    const stateMany = createMockCandidatesData({
      houseDistricts: 10,
      repIncumbents: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      demChallengers: [1, 2, 3, 4, 5, 6, 7, 8], // 8 contested
    });

    const states = [
      { code: 'FEW', name: 'Few Contested', data: stateFew },
      { code: 'MANY', name: 'Many Contested', data: stateMany },
    ];

    const result = aggregateCrossStateComparison(states, 'house');

    expect(result.rankings.byCompetitive[0].stateCode).toBe('MANY');
    expect(result.rankings.byCompetitive[1].stateCode).toBe('FEW');
  });

  it('ranks states by open seats (highest first)', () => {
    const stateFewOpen = createMockCandidatesData({
      houseDistricts: 10,
      repIncumbents: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      openSeats: [10], // 1 open
    });

    const stateManyOpen = createMockCandidatesData({
      houseDistricts: 10,
      repIncumbents: [1, 2, 3, 4, 5],
      openSeats: [6, 7, 8, 9, 10], // 5 open
    });

    const states = [
      { code: 'FEW', name: 'Few Open', data: stateFewOpen },
      { code: 'MANY', name: 'Many Open', data: stateManyOpen },
    ];

    const result = aggregateCrossStateComparison(states, 'house');

    expect(result.rankings.byOpenSeats[0].stateCode).toBe('MANY');
    expect(result.rankings.byOpenSeats[1].stateCode).toBe('FEW');
  });

  it('handles empty states array', () => {
    const result = aggregateCrossStateComparison([], 'house');

    expect(result.states).toHaveLength(0);
    expect(result.totals.totalDistricts).toBe(0);
    expect(result.totals.avgDemCoverage).toBe(0);
  });

  it('handles states with null data', () => {
    const states = [
      { code: 'SC', name: 'South Carolina', data: null },
      { code: 'NC', name: 'North Carolina', data: null },
    ];

    const result = aggregateCrossStateComparison(states, 'house');

    expect(result.states).toHaveLength(2);
    expect(result.totals.totalDistricts).toBe(0);
    expect(result.states[0].totalDistricts).toBe(0);
  });

  it('calculates total contested races', () => {
    const stateA = createMockCandidatesData({
      houseDistricts: 10,
      repIncumbents: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      demChallengers: [1, 2, 3], // 3 contested
    });

    const stateB = createMockCandidatesData({
      houseDistricts: 10,
      repIncumbents: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      demChallengers: [1, 2, 3, 4, 5, 6, 7], // 7 contested
    });

    const states = [
      { code: 'A', name: 'State A', data: stateA },
      { code: 'B', name: 'State B', data: stateB },
    ];

    const result = aggregateCrossStateComparison(states, 'house');

    expect(result.totals.totalContested).toBe(10); // 3 + 7
  });
});

// =============================================================================
// getMetricValue Tests
// =============================================================================

describe('getMetricValue', () => {
  const mockSummary: StateSummary = {
    stateCode: 'SC',
    stateName: 'South Carolina',
    chamber: 'house',
    totalDistricts: 124,
    demIncumbents: 24,
    repIncumbents: 100,
    demChallengers: 15,
    contested: 35,
    uncontested: 89,
    openSeats: 5,
    demCoverage: 45.5,
    competitiveDistricts: 12,
  };

  it('returns demCoverage correctly', () => {
    expect(getMetricValue(mockSummary, 'demCoverage')).toBe(45.5);
  });

  it('returns contested correctly', () => {
    expect(getMetricValue(mockSummary, 'contested')).toBe(35);
  });

  it('returns openSeats correctly', () => {
    expect(getMetricValue(mockSummary, 'openSeats')).toBe(5);
  });

  it('returns demIncumbents correctly', () => {
    expect(getMetricValue(mockSummary, 'demIncumbents')).toBe(24);
  });

  it('returns totalDistricts correctly', () => {
    expect(getMetricValue(mockSummary, 'totalDistricts')).toBe(124);
  });
});

// =============================================================================
// getMetricConfig Tests
// =============================================================================

describe('getMetricConfig', () => {
  const metrics: ComparisonMetric[] = [
    'demCoverage',
    'contested',
    'openSeats',
    'demIncumbents',
    'totalDistricts',
  ];

  it.each(metrics)('returns valid config for %s', (metric) => {
    const config = getMetricConfig(metric);

    expect(config).toHaveProperty('label');
    expect(config).toHaveProperty('format');
    expect(config).toHaveProperty('color');
    expect(typeof config.label).toBe('string');
    expect(typeof config.format).toBe('function');
    expect(typeof config.color).toBe('string');
  });

  it('demCoverage config formats with percentage', () => {
    const config = getMetricConfig('demCoverage');
    expect(config.format(45.67)).toBe('46%');
    expect(config.format(100)).toBe('100%');
    expect(config.format(0)).toBe('0%');
  });

  it('contested config formats as plain number', () => {
    const config = getMetricConfig('contested');
    expect(config.format(35)).toBe('35');
    expect(config.format(0)).toBe('0');
  });

  it('openSeats config formats as plain number', () => {
    const config = getMetricConfig('openSeats');
    expect(config.format(12)).toBe('12');
  });

  it('demIncumbents config formats as plain number', () => {
    const config = getMetricConfig('demIncumbents');
    expect(config.format(24)).toBe('24');
  });

  it('totalDistricts config formats as plain number', () => {
    const config = getMetricConfig('totalDistricts');
    expect(config.format(124)).toBe('124');
  });

  it('each metric has a distinct color', () => {
    const colors = metrics.map((m) => getMetricConfig(m).color);
    const uniqueColors = new Set(colors);
    expect(uniqueColors.size).toBe(metrics.length);
  });

  it('all colors are valid hex colors', () => {
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    metrics.forEach((metric) => {
      const config = getMetricConfig(metric);
      expect(config.color).toMatch(hexColorRegex);
    });
  });
});

// =============================================================================
// Edge Cases and Integration Tests
// =============================================================================

describe('crossStateAggregator - Edge Cases', () => {
  it('handles districts with no candidates at all', () => {
    const data: CandidatesData = {
      lastUpdated: new Date().toISOString(),
      house: {
        '1': { districtNumber: 1, candidates: [], incumbent: null },
        '2': { districtNumber: 2, candidates: [], incumbent: null },
      },
      senate: {},
    };

    const summary = calculateStateSummary('SC', 'South Carolina', 'house', data);

    expect(summary.totalDistricts).toBe(2);
    expect(summary.contested).toBe(0);
    expect(summary.uncontested).toBe(0);
    expect(summary.demCoverage).toBe(0);
  });

  it('handles mixed party in same district', () => {
    const data: CandidatesData = {
      lastUpdated: new Date().toISOString(),
      house: {
        '1': {
          districtNumber: 1,
          candidates: [
            {
              name: 'Dem Candidate',
              party: 'Democratic',
              status: 'filed',
              filedDate: '2024-01-01',
              ethicsUrl: null,
              reportId: 'D1',
              source: 'test',
            },
            {
              name: 'Rep Candidate',
              party: 'Republican',
              status: 'filed',
              filedDate: '2024-01-01',
              ethicsUrl: null,
              reportId: 'R1',
              source: 'test',
            },
          ],
          incumbent: null,
        },
      },
      senate: {},
    };

    const summary = calculateStateSummary('SC', 'South Carolina', 'house', data);

    expect(summary.contested).toBe(1);
    expect(summary.demCoverage).toBe(100);
  });

  it('handles case-insensitive party matching', () => {
    const data: CandidatesData = {
      lastUpdated: new Date().toISOString(),
      house: {
        '1': {
          districtNumber: 1,
          candidates: [
            {
              name: 'Dem 1',
              party: 'democratic', // lowercase
              status: 'filed',
              filedDate: '2024-01-01',
              ethicsUrl: null,
              reportId: 'D1',
              source: 'test',
            },
            {
              name: 'Rep 1',
              party: 'REPUBLICAN', // uppercase
              status: 'filed',
              filedDate: '2024-01-01',
              ethicsUrl: null,
              reportId: 'R1',
              source: 'test',
            },
          ],
          incumbent: null,
        },
      },
      senate: {},
    };

    const summary = calculateStateSummary('SC', 'South Carolina', 'house', data);

    expect(summary.contested).toBe(1);
    expect(summary.demCoverage).toBe(100);
  });

  it('handles candidates with null party', () => {
    const data: CandidatesData = {
      lastUpdated: new Date().toISOString(),
      house: {
        '1': {
          districtNumber: 1,
          candidates: [
            {
              name: 'Unknown Candidate',
              party: null,
              status: 'filed',
              filedDate: '2024-01-01',
              ethicsUrl: null,
              reportId: 'U1',
              source: 'test',
            },
          ],
          incumbent: null,
        },
      },
      senate: {},
    };

    const summary = calculateStateSummary('SC', 'South Carolina', 'house', data);

    expect(summary.totalDistricts).toBe(1);
    expect(summary.demCoverage).toBe(0);
    expect(summary.contested).toBe(0);
    expect(summary.uncontested).toBe(1); // Has candidate but no D/R pair
  });
});
