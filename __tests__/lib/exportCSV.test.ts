/**
 * Tests for exportCSV.ts
 *
 * Tests CSV export functionality including field escaping, row building, and downloads
 */

import {
  buildTableRows,
  exportToCSV,
  exportFilteredToCSV,
  type StrategicTableRow,
} from '@/lib/exportCSV';
import type {
  CandidatesData,
  OpportunityData,
  ElectionsData,
} from '@/types/schema';

// =============================================================================
// Test Fixtures
// =============================================================================

/**
 * Create minimal mock candidates data
 */
function createMockCandidatesData(): CandidatesData {
  return {
    lastUpdated: '2024-01-15T10:00:00Z',
    house: {
      '1': {
        districtNumber: 1,
        candidates: [
          {
            name: 'John Smith',
            party: 'Democratic',
            status: 'filed',
            filedDate: '2024-01-10',
            ethicsUrl: 'https://ethics.sc.gov/1',
            reportId: 'D001',
            source: 'ethics',
            isIncumbent: false,
          },
          {
            name: 'Jane Doe',
            party: 'Republican',
            status: 'filed',
            filedDate: '2024-01-05',
            ethicsUrl: 'https://ethics.sc.gov/2',
            reportId: 'R001',
            source: 'ethics',
            isIncumbent: true,
          },
        ],
        incumbent: { name: 'Jane Doe', party: 'Republican' },
      },
      '2': {
        districtNumber: 2,
        candidates: [
          {
            name: 'Bob Wilson',
            party: 'Republican',
            status: 'filed',
            filedDate: '2024-01-08',
            ethicsUrl: 'https://ethics.sc.gov/3',
            reportId: 'R002',
            source: 'ethics',
            isIncumbent: true,
          },
        ],
        incumbent: { name: 'Bob Wilson', party: 'Republican' },
      },
      '3': {
        districtNumber: 3,
        candidates: [],
        incumbent: null, // Open seat
      },
    },
    senate: {
      '1': {
        districtNumber: 1,
        candidates: [
          {
            name: 'Alice Brown',
            party: 'Democratic',
            status: 'filed',
            filedDate: '2024-01-12',
            ethicsUrl: null,
            reportId: 'D101',
            source: 'ethics',
            isIncumbent: true,
          },
        ],
        incumbent: { name: 'Alice Brown', party: 'Democratic' },
      },
    },
  };
}

/**
 * Create minimal mock opportunity data
 */
function createMockOpportunityData(): OpportunityData {
  return {
    lastUpdated: '2024-01-15T10:00:00Z',
    house: {
      '1': {
        districtNumber: 1,
        opportunityScore: 75,
        tier: 'HIGH_OPPORTUNITY',
        tierLabel: 'High Opportunity',
        factors: {
          competitiveness: 0.8,
          marginTrend: 0.7,
          incumbency: 0.5,
          candidatePresence: 1.0,
          openSeatBonus: false,
        },
        metrics: {
          avgMargin: 5.2,
          trendChange: 2.1,
          competitivenessScore: 78,
        },
        flags: {
          needsCandidate: false,
          openSeat: false,
          trendingDem: true,
          defensive: false,
          hasDemocrat: true,
        },
        recommendation: 'Strong flip opportunity',
      },
      '2': {
        districtNumber: 2,
        opportunityScore: 45,
        tier: 'BUILD',
        tierLabel: 'Build',
        factors: {
          competitiveness: 0.4,
          marginTrend: 0.3,
          incumbency: 0.5,
          candidatePresence: 0.0,
          openSeatBonus: false,
        },
        metrics: {
          avgMargin: 12.5,
          trendChange: 0.5,
          competitivenessScore: 42,
        },
        flags: {
          needsCandidate: true,
          openSeat: false,
          trendingDem: false,
          defensive: false,
          hasDemocrat: false,
        },
        recommendation: 'Recruit candidate',
      },
      '3': {
        districtNumber: 3,
        opportunityScore: 85,
        tier: 'HIGH_OPPORTUNITY',
        tierLabel: 'High Opportunity',
        factors: {
          competitiveness: 0.9,
          marginTrend: 0.8,
          incumbency: 1.0,
          candidatePresence: 0.0,
          openSeatBonus: true,
        },
        metrics: {
          avgMargin: 3.1,
          trendChange: 4.2,
          competitivenessScore: 88,
        },
        flags: {
          needsCandidate: true,
          openSeat: true,
          trendingDem: true,
          defensive: false,
          hasDemocrat: false,
        },
        recommendation: 'Priority open seat',
      },
    },
    senate: {
      '1': {
        districtNumber: 1,
        opportunityScore: 30,
        tier: 'DEFENSIVE',
        tierLabel: 'Defensive',
        factors: {
          competitiveness: 0.3,
          marginTrend: 0.4,
          incumbency: 0.5,
          candidatePresence: 1.0,
          openSeatBonus: false,
        },
        metrics: {
          avgMargin: 8.5,
          trendChange: -1.2,
          competitivenessScore: 35,
        },
        flags: {
          needsCandidate: false,
          openSeat: false,
          trendingDem: false,
          defensive: true,
          hasDemocrat: true,
        },
        recommendation: 'Protect incumbent',
      },
    },
  };
}

/**
 * Create minimal mock elections data
 */
function createMockElectionsData(): ElectionsData {
  return {
    lastUpdated: '2024-01-15T10:00:00Z',
    house: {
      '1': {
        districtNumber: 1,
        elections: {
          '2024': {
            year: 2024,
            totalVotes: 25000,
            winner: { name: 'Jane Doe', party: 'Republican', votes: 13500, percentage: 54 },
            runnerUp: { name: 'Previous Dem', party: 'Democratic', votes: 11500, percentage: 46 },
            margin: 8,
            marginVotes: 2000,
          },
        },
        competitiveness: {
          score: 72,
          avgMargin: 8.5,
          hasSwung: false,
          contestedRaces: 3,
          dominantParty: 'Republican',
        },
      },
      '2': {
        districtNumber: 2,
        elections: {
          '2024': {
            year: 2024,
            totalVotes: 30000,
            winner: { name: 'Bob Wilson', party: 'Republican', votes: 20000, percentage: 66.7 },
            margin: 33.4,
            marginVotes: 10000,
            uncontested: false,
          },
        },
        competitiveness: {
          score: 25,
          avgMargin: 28.5,
          hasSwung: false,
          contestedRaces: 2,
          dominantParty: 'Republican',
        },
      },
      '3': {
        districtNumber: 3,
        elections: {},
        competitiveness: {
          score: 50,
          avgMargin: 5.0,
          hasSwung: true,
          contestedRaces: 1,
          dominantParty: null,
        },
      },
    },
    senate: {
      '1': {
        districtNumber: 1,
        elections: {
          '2024': {
            year: 2024,
            totalVotes: 45000,
            winner: { name: 'Alice Brown', party: 'Democratic', votes: 26000, percentage: 57.8 },
            runnerUp: { name: 'Rep Challenger', party: 'Republican', votes: 19000, percentage: 42.2 },
            margin: 15.6,
            marginVotes: 7000,
          },
        },
        competitiveness: {
          score: 42,
          avgMargin: 12.3,
          hasSwung: false,
          contestedRaces: 4,
          dominantParty: 'Democratic',
        },
      },
    },
  };
}

// =============================================================================
// Mock DOM APIs
// =============================================================================

// Track captured CSV content for assertions
let capturedCSVContent: string = '';
let capturedFilename: string = '';

// Mock URL functions
const mockCreateObjectURL = jest.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = jest.fn();

// Mock element methods
const mockClick = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();

const mockLink = {
  href: '',
  download: '',
  style: { display: '' },
  click: mockClick,
};

// Store original implementations
const OriginalBlob = global.Blob;

beforeAll(() => {
  // Mock Blob to capture content
  global.Blob = jest.fn(function(content: BlobPart[], options?: BlobPropertyBag) {
    capturedCSVContent = content[0] as string;
    return { content, options } as unknown as Blob;
  }) as unknown as typeof Blob;

  global.URL.createObjectURL = mockCreateObjectURL;
  global.URL.revokeObjectURL = mockRevokeObjectURL;

  jest.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLElement);
  jest.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild as unknown as typeof document.body.appendChild);
  jest.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild as unknown as typeof document.body.removeChild);
});

afterAll(() => {
  global.Blob = OriginalBlob;
  jest.restoreAllMocks();
});

beforeEach(() => {
  jest.clearAllMocks();
  capturedCSVContent = '';
  capturedFilename = '';
  mockLink.href = '';
  mockLink.download = '';
});

// =============================================================================
// buildTableRows Tests
// =============================================================================

describe('buildTableRows', () => {
  const candidatesData = createMockCandidatesData();
  const opportunityData = createMockOpportunityData();
  const electionsData = createMockElectionsData();

  it('builds rows for house chamber', () => {
    const rows = buildTableRows(
      candidatesData,
      opportunityData,
      electionsData,
      'house'
    );

    expect(rows).toHaveLength(3);
    expect(rows[0].chamber).toBe('house');
  });

  it('builds rows for senate chamber', () => {
    const rows = buildTableRows(
      candidatesData,
      opportunityData,
      electionsData,
      'senate'
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].chamber).toBe('senate');
  });

  it('correctly formats district ID', () => {
    const houseRows = buildTableRows(
      candidatesData,
      opportunityData,
      electionsData,
      'house'
    );
    const senateRows = buildTableRows(
      candidatesData,
      opportunityData,
      electionsData,
      'senate'
    );

    expect(houseRows[0].districtId).toBe('HD-1');
    expect(senateRows[0].districtId).toBe('SD-1');
  });

  it('identifies incumbent correctly', () => {
    const rows = buildTableRows(
      candidatesData,
      opportunityData,
      electionsData,
      'house'
    );

    const district1 = rows.find((r) => r.districtNumber === 1);
    expect(district1?.incumbent).toBe('Jane Doe');
    expect(district1?.incumbentParty).toBe('Republican');
  });

  it('identifies open seats', () => {
    const rows = buildTableRows(
      candidatesData,
      opportunityData,
      electionsData,
      'house'
    );

    const district3 = rows.find((r) => r.districtNumber === 3);
    expect(district3?.incumbent).toBe('Open Seat');
    expect(district3?.incumbentParty).toBe('N/A');
    expect(district3?.openSeat).toBe(true);
  });

  it('identifies Democratic challenger', () => {
    const rows = buildTableRows(
      candidatesData,
      opportunityData,
      electionsData,
      'house'
    );

    const district1 = rows.find((r) => r.districtNumber === 1);
    expect(district1?.challenger).toBe('John Smith');
    expect(district1?.challengerParty).toBe('Democratic');
  });

  it('extracts opportunity tier data', () => {
    const rows = buildTableRows(
      candidatesData,
      opportunityData,
      electionsData,
      'house'
    );

    const district1 = rows.find((r) => r.districtNumber === 1);
    expect(district1?.tier).toBe('HIGH_OPPORTUNITY');
    expect(district1?.tierLabel).toBe('High Opportunity');
    expect(district1?.opportunityScore).toBe(75);
  });

  it('formats 2024 margin correctly for Republican winner', () => {
    const rows = buildTableRows(
      candidatesData,
      opportunityData,
      electionsData,
      'house'
    );

    const district1 = rows.find((r) => r.districtNumber === 1);
    expect(district1?.margin2024).toBe(8);
    expect(district1?.marginDisplay).toBe('+8.0%');
  });

  it('handles missing election data', () => {
    const rows = buildTableRows(
      candidatesData,
      opportunityData,
      electionsData,
      'house'
    );

    const district3 = rows.find((r) => r.districtNumber === 3);
    expect(district3?.margin2024).toBeNull();
    expect(district3?.marginDisplay).toBe('N/A');
  });

  it('includes strategic flags', () => {
    const rows = buildTableRows(
      candidatesData,
      opportunityData,
      electionsData,
      'house'
    );

    const district1 = rows.find((r) => r.districtNumber === 1);
    expect(district1?.hasDemocrat).toBe(true);
    expect(district1?.needsCandidate).toBe(false);

    const district2 = rows.find((r) => r.districtNumber === 2);
    expect(district2?.hasDemocrat).toBe(false);
    expect(district2?.needsCandidate).toBe(true);
  });

  it('includes recommendation text', () => {
    const rows = buildTableRows(
      candidatesData,
      opportunityData,
      electionsData,
      'house'
    );

    const district1 = rows.find((r) => r.districtNumber === 1);
    expect(district1?.recommendation).toBe('Strong flip opportunity');

    const district3 = rows.find((r) => r.districtNumber === 3);
    expect(district3?.recommendation).toBe('Priority open seat');
  });

  it('skips districts without opportunity data', () => {
    const modifiedOpportunity: OpportunityData = {
      ...opportunityData,
      house: {
        '1': opportunityData.house['1'],
        // District 2 and 3 missing
      },
    };

    const rows = buildTableRows(
      candidatesData,
      modifiedOpportunity,
      electionsData,
      'house'
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].districtNumber).toBe(1);
  });
});

// =============================================================================
// CSV Escaping Tests (via integration)
// =============================================================================

describe('CSV field escaping', () => {
  it('handles values with commas', () => {
    const rows: StrategicTableRow[] = [
      {
        districtId: 'HD-1',
        districtNumber: 1,
        chamber: 'house',
        incumbent: 'Smith, John Jr.',
        incumbentParty: 'Republican',
        challenger: 'Doe, Jane',
        challengerParty: 'Democratic',
        tier: 'HIGH_OPPORTUNITY',
        tierLabel: 'High Opportunity',
        opportunityScore: 75,
        margin2024: 8,
        marginDisplay: '+8.0%',
        hasDemocrat: true,
        hasRepublican: true,
        needsCandidate: false,
        openSeat: false,
        recommendation: 'Strong flip opportunity',
      },
    ];

    exportToCSV(rows, 'test.csv');

    // Names with commas should be quoted
    expect(capturedCSVContent).toContain('"Smith, John Jr."');
    expect(capturedCSVContent).toContain('"Doe, Jane"');
  });

  it('handles values with quotes', () => {
    const rows: StrategicTableRow[] = [
      {
        districtId: 'HD-1',
        districtNumber: 1,
        chamber: 'house',
        incumbent: 'John "The Rock" Smith',
        incumbentParty: 'Republican',
        challenger: '',
        challengerParty: '',
        tier: 'BUILD',
        tierLabel: 'Build',
        opportunityScore: 45,
        margin2024: null,
        marginDisplay: 'N/A',
        hasDemocrat: false,
        hasRepublican: true,
        needsCandidate: true,
        openSeat: false,
        recommendation: 'Recruit candidate',
      },
    ];

    exportToCSV(rows, 'test.csv');

    // Quotes should be escaped by doubling
    expect(capturedCSVContent).toContain('"John ""The Rock"" Smith"');
  });

  it('handles values with newlines', () => {
    const rows: StrategicTableRow[] = [
      {
        districtId: 'HD-1',
        districtNumber: 1,
        chamber: 'house',
        incumbent: 'John Smith',
        incumbentParty: 'Republican',
        challenger: '',
        challengerParty: '',
        tier: 'BUILD',
        tierLabel: 'Build',
        opportunityScore: 45,
        margin2024: null,
        marginDisplay: 'N/A',
        hasDemocrat: false,
        hasRepublican: true,
        needsCandidate: true,
        openSeat: false,
        recommendation: 'First line\nSecond line',
      },
    ];

    exportToCSV(rows, 'test.csv');

    // Newlines should be preserved within quotes
    expect(capturedCSVContent).toContain('"First line\nSecond line"');
  });

  it('handles null and undefined values', () => {
    const rows: StrategicTableRow[] = [
      {
        districtId: 'HD-1',
        districtNumber: 1,
        chamber: 'house',
        incumbent: 'Open Seat',
        incumbentParty: 'N/A',
        challenger: '',
        challengerParty: '',
        tier: 'HIGH_OPPORTUNITY',
        tierLabel: 'High Opportunity',
        opportunityScore: 85,
        margin2024: null,
        marginDisplay: 'N/A',
        hasDemocrat: false,
        hasRepublican: false,
        needsCandidate: true,
        openSeat: true,
        recommendation: 'Priority open seat',
      },
    ];

    // Should not throw
    expect(() => exportToCSV(rows, 'test.csv')).not.toThrow();
  });
});

// =============================================================================
// exportToCSV Tests
// =============================================================================

describe('exportToCSV', () => {
  it('creates a Blob with CSV content type', () => {
    const rows: StrategicTableRow[] = [
      {
        districtId: 'HD-1',
        districtNumber: 1,
        chamber: 'house',
        incumbent: 'John Smith',
        incumbentParty: 'Republican',
        challenger: 'Jane Doe',
        challengerParty: 'Democratic',
        tier: 'HIGH_OPPORTUNITY',
        tierLabel: 'High Opportunity',
        opportunityScore: 75,
        margin2024: 8,
        marginDisplay: '+8.0%',
        hasDemocrat: true,
        hasRepublican: true,
        needsCandidate: false,
        openSeat: false,
        recommendation: 'Strong flip opportunity',
      },
    ];

    exportToCSV(rows, 'test.csv');

    expect(global.Blob).toHaveBeenCalledWith(
      expect.any(Array),
      { type: 'text/csv;charset=utf-8;' }
    );
  });

  it('triggers file download with correct filename', () => {
    const rows: StrategicTableRow[] = [];
    exportToCSV(rows, 'my-export.csv');

    expect(mockLink.download).toBe('my-export.csv');
    expect(mockClick).toHaveBeenCalled();
  });

  it('uses default filename when not provided', () => {
    const rows: StrategicTableRow[] = [];
    exportToCSV(rows);

    expect(mockLink.download).toBe('sc-election-strategic-data.csv');
  });

  it('includes header row', () => {
    const rows: StrategicTableRow[] = [];
    exportToCSV(rows, 'test.csv');

    expect(capturedCSVContent).toContain('District');
    expect(capturedCSVContent).toContain('Chamber');
    expect(capturedCSVContent).toContain('Incumbent');
    expect(capturedCSVContent).toContain('Strategic Tier');
    expect(capturedCSVContent).toContain('Opportunity Score');
  });

  it('cleans up resources after download', () => {
    const rows: StrategicTableRow[] = [];
    exportToCSV(rows, 'test.csv');

    expect(mockRemoveChild).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});

// =============================================================================
// exportFilteredToCSV Tests
// =============================================================================

describe('exportFilteredToCSV', () => {
  const allRows: StrategicTableRow[] = [
    {
      districtId: 'HD-1',
      districtNumber: 1,
      chamber: 'house',
      incumbent: 'Rep 1',
      incumbentParty: 'Republican',
      challenger: 'Dem 1',
      challengerParty: 'Democratic',
      tier: 'HIGH_OPPORTUNITY',
      tierLabel: 'High Opportunity',
      opportunityScore: 80,
      margin2024: 5,
      marginDisplay: '+5.0%',
      hasDemocrat: true,
      hasRepublican: true,
      needsCandidate: false,
      openSeat: false,
      recommendation: 'Flip target',
    },
    {
      districtId: 'HD-2',
      districtNumber: 2,
      chamber: 'house',
      incumbent: 'Rep 2',
      incumbentParty: 'Republican',
      challenger: '',
      challengerParty: '',
      tier: 'BUILD',
      tierLabel: 'Build',
      opportunityScore: 45,
      margin2024: 15,
      marginDisplay: '+15.0%',
      hasDemocrat: false,
      hasRepublican: true,
      needsCandidate: true,
      openSeat: false,
      recommendation: 'Recruit',
    },
    {
      districtId: 'HD-3',
      districtNumber: 3,
      chamber: 'house',
      incumbent: 'Dem 1',
      incumbentParty: 'Democratic',
      challenger: '',
      challengerParty: '',
      tier: 'DEFENSIVE',
      tierLabel: 'Defensive',
      opportunityScore: 30,
      margin2024: -10,
      marginDisplay: '-10.0%',
      hasDemocrat: true,
      hasRepublican: false,
      needsCandidate: false,
      openSeat: false,
      recommendation: 'Protect',
    },
  ];

  it('exports all rows when no filter provided', () => {
    exportFilteredToCSV(allRows, 'house');

    const lines = capturedCSVContent.split('\r\n');

    // Header + 3 data rows
    expect(lines.length).toBe(4);
  });

  it('filters by single tier', () => {
    exportFilteredToCSV(allRows, 'house', ['HIGH_OPPORTUNITY']);

    const lines = capturedCSVContent.split('\r\n');

    // Header + 1 data row
    expect(lines.length).toBe(2);
    expect(capturedCSVContent).toContain('HD-1');
    expect(capturedCSVContent).not.toContain('HD-2');
  });

  it('filters by multiple tiers', () => {
    exportFilteredToCSV(allRows, 'house', ['HIGH_OPPORTUNITY', 'DEFENSIVE']);

    const lines = capturedCSVContent.split('\r\n');

    // Header + 2 data rows
    expect(lines.length).toBe(3);
    expect(capturedCSVContent).toContain('HD-1');
    expect(capturedCSVContent).toContain('HD-3');
    expect(capturedCSVContent).not.toContain('HD-2');
  });

  it('generates correct filename for house chamber', () => {
    // Mock Date to get consistent filename
    const RealDate = Date;
    const mockDate = new Date('2024-06-15T12:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation((...args) => {
      if (args.length === 0) return mockDate;
      // @ts-expect-error - constructor overload
      return new RealDate(...args);
    });

    exportFilteredToCSV(allRows, 'house');

    expect(mockLink.download).toBe('sc-house-strategic-2024-06-15.csv');

    // Restore only Date mock, not all mocks
    (global.Date as jest.Mock).mockRestore();
  });

  it('generates correct filename for senate chamber', () => {
    const RealDate = Date;
    const mockDate = new Date('2024-06-15T12:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation((...args) => {
      if (args.length === 0) return mockDate;
      // @ts-expect-error - constructor overload
      return new RealDate(...args);
    });

    exportFilteredToCSV(allRows, 'senate');

    expect(mockLink.download).toBe('sc-senate-strategic-2024-06-15.csv');

    // Restore only Date mock, not all mocks
    (global.Date as jest.Mock).mockRestore();
  });

  it('handles empty tier filter array', () => {
    exportFilteredToCSV(allRows, 'house', []);

    const lines = capturedCSVContent.split('\r\n');

    // All rows exported when filter is empty array
    expect(lines.length).toBe(4);
  });

  it('handles filter with no matches', () => {
    exportFilteredToCSV(allRows, 'house', ['NONEXISTENT_TIER']);

    const lines = capturedCSVContent.split('\r\n');

    // Only header row
    expect(lines.length).toBe(1);
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('exportCSV - Integration', () => {
  it('builds and exports complete workflow', () => {
    const candidatesData = createMockCandidatesData();
    const opportunityData = createMockOpportunityData();
    const electionsData = createMockElectionsData();

    const rows = buildTableRows(
      candidatesData,
      opportunityData,
      electionsData,
      'house'
    );

    expect(() => exportToCSV(rows, 'integration-test.csv')).not.toThrow();

    expect(mockClick).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalled();
  });

  it('handles full data pipeline with filtering', () => {
    const candidatesData = createMockCandidatesData();
    const opportunityData = createMockOpportunityData();
    const electionsData = createMockElectionsData();

    const rows = buildTableRows(
      candidatesData,
      opportunityData,
      electionsData,
      'house'
    );

    // Filter to high opportunity only
    exportFilteredToCSV(rows, 'house', ['HIGH_OPPORTUNITY']);

    // Should only contain HIGH_OPPORTUNITY rows (districts 1 and 3)
    expect(capturedCSVContent).toContain('HD-1');
    expect(capturedCSVContent).toContain('HD-3');
    expect(capturedCSVContent).not.toContain('HD-2');
  });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe('exportCSV - Edge Cases', () => {
  it('handles empty rows array', () => {
    expect(() => exportToCSV([], 'empty.csv')).not.toThrow();

    // Should still have header
    expect(capturedCSVContent).toContain('District');
    // But no data rows
    const lines = capturedCSVContent.split('\r\n');
    expect(lines.length).toBe(1);
  });

  it('handles boolean values correctly', () => {
    const rows: StrategicTableRow[] = [
      {
        districtId: 'HD-1',
        districtNumber: 1,
        chamber: 'house',
        incumbent: 'Test',
        incumbentParty: 'Republican',
        challenger: '',
        challengerParty: '',
        tier: 'BUILD',
        tierLabel: 'Build',
        opportunityScore: 50,
        margin2024: null,
        marginDisplay: 'N/A',
        hasDemocrat: true,
        hasRepublican: false,
        needsCandidate: true,
        openSeat: false,
        recommendation: 'Test',
      },
    ];

    exportToCSV(rows, 'test.csv');

    // Booleans should be stringified
    expect(capturedCSVContent).toContain('true');
    expect(capturedCSVContent).toContain('false');
  });

  it('handles numeric zero values', () => {
    const rows: StrategicTableRow[] = [
      {
        districtId: 'HD-1',
        districtNumber: 1,
        chamber: 'house',
        incumbent: 'Test',
        incumbentParty: 'Republican',
        challenger: '',
        challengerParty: '',
        tier: 'BUILD',
        tierLabel: 'Build',
        opportunityScore: 0,
        margin2024: 0,
        marginDisplay: '0.0%',
        hasDemocrat: false,
        hasRepublican: true,
        needsCandidate: true,
        openSeat: false,
        recommendation: 'Test',
      },
    ];

    exportToCSV(rows, 'test.csv');

    // Zero should be preserved, not treated as empty
    expect(capturedCSVContent).toMatch(/,0,/);
  });
});
