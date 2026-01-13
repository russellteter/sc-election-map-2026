/**
 * Tests for helper functions used in components.
 * These functions are defined inline in DistrictMap.tsx but we test their logic here.
 */

interface Candidate {
  name: string;
  party: string | null;
  status: string;
  filedDate: string | null;
  ethicsUrl: string | null;
  reportId: string;
  source: string;
}

interface District {
  districtNumber: number;
  candidates: Candidate[];
}

// Recreate getDistrictColor logic for testing
function getDistrictColor(district: District | undefined): string {
  if (!district || district.candidates.length === 0) {
    return '#e5e7eb'; // gray-200 - no candidates (vacant)
  }

  const hasDemocrat = district.candidates.some(
    (c) => c.party?.toLowerCase() === 'democratic'
  );
  const hasRepublican = district.candidates.some(
    (c) => c.party?.toLowerCase() === 'republican'
  );

  if (hasDemocrat && hasRepublican) {
    return '#a855f7'; // purple-500 - contested
  } else if (hasDemocrat) {
    return '#3b82f6'; // blue-500 - Democrat only
  } else if (hasRepublican) {
    return '#ef4444'; // red-500 - Republican only
  } else {
    return '#fbbf24'; // amber-400 - candidates with unknown party
  }
}

// Recreate getDistrictStatusLabel logic for testing
function getDistrictStatusLabel(district: District | undefined): string {
  if (!district || district.candidates.length === 0) {
    return 'No candidates filed';
  }

  const hasDemocrat = district.candidates.some(
    (c) => c.party?.toLowerCase() === 'democratic'
  );
  const hasRepublican = district.candidates.some(
    (c) => c.party?.toLowerCase() === 'republican'
  );

  const candidateCount = district.candidates.length;
  const candidateText = candidateCount === 1 ? '1 candidate' : `${candidateCount} candidates`;

  if (hasDemocrat && hasRepublican) {
    return `Contested race with ${candidateText}, both Democratic and Republican`;
  } else if (hasDemocrat) {
    return `${candidateText}, Democratic`;
  } else if (hasRepublican) {
    return `${candidateText}, Republican`;
  } else {
    return `${candidateText} filed, party unknown`;
  }
}

// Helper to create test candidates
function createCandidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    name: 'Test Candidate',
    party: null,
    status: 'filed',
    filedDate: '2026-01-01',
    ethicsUrl: null,
    reportId: '12345',
    source: 'ethics',
    ...overrides,
  };
}

describe('getDistrictColor', () => {
  it('returns gray for undefined district', () => {
    expect(getDistrictColor(undefined)).toBe('#e5e7eb');
  });

  it('returns gray for empty candidates array', () => {
    const district: District = { districtNumber: 1, candidates: [] };
    expect(getDistrictColor(district)).toBe('#e5e7eb');
  });

  it('returns blue for Democratic candidate only', () => {
    const district: District = {
      districtNumber: 1,
      candidates: [createCandidate({ party: 'Democratic' })],
    };
    expect(getDistrictColor(district)).toBe('#3b82f6');
  });

  it('returns red for Republican candidate only', () => {
    const district: District = {
      districtNumber: 1,
      candidates: [createCandidate({ party: 'Republican' })],
    };
    expect(getDistrictColor(district)).toBe('#ef4444');
  });

  it('returns purple for both Democratic and Republican', () => {
    const district: District = {
      districtNumber: 1,
      candidates: [
        createCandidate({ party: 'Democratic' }),
        createCandidate({ party: 'Republican' }),
      ],
    };
    expect(getDistrictColor(district)).toBe('#a855f7');
  });

  it('returns amber for unknown party', () => {
    const district: District = {
      districtNumber: 1,
      candidates: [createCandidate({ party: null })],
    };
    expect(getDistrictColor(district)).toBe('#fbbf24');
  });

  it('handles case-insensitive party names', () => {
    const district: District = {
      districtNumber: 1,
      candidates: [createCandidate({ party: 'DEMOCRATIC' })],
    };
    expect(getDistrictColor(district)).toBe('#3b82f6');
  });
});

describe('getDistrictStatusLabel', () => {
  it('returns "No candidates filed" for undefined district', () => {
    expect(getDistrictStatusLabel(undefined)).toBe('No candidates filed');
  });

  it('returns "No candidates filed" for empty candidates', () => {
    const district: District = { districtNumber: 1, candidates: [] };
    expect(getDistrictStatusLabel(district)).toBe('No candidates filed');
  });

  it('returns singular form for one candidate', () => {
    const district: District = {
      districtNumber: 1,
      candidates: [createCandidate({ party: 'Democratic' })],
    };
    expect(getDistrictStatusLabel(district)).toBe('1 candidate, Democratic');
  });

  it('returns plural form for multiple candidates', () => {
    const district: District = {
      districtNumber: 1,
      candidates: [
        createCandidate({ party: 'Democratic' }),
        createCandidate({ party: 'Republican' }),
      ],
    };
    expect(getDistrictStatusLabel(district)).toBe(
      'Contested race with 2 candidates, both Democratic and Republican'
    );
  });

  it('returns Republican label for Republican only', () => {
    const district: District = {
      districtNumber: 1,
      candidates: [createCandidate({ party: 'Republican' })],
    };
    expect(getDistrictStatusLabel(district)).toBe('1 candidate, Republican');
  });

  it('returns party unknown for null party', () => {
    const district: District = {
      districtNumber: 1,
      candidates: [createCandidate({ party: null })],
    };
    expect(getDistrictStatusLabel(district)).toBe('1 candidate filed, party unknown');
  });

  it('returns contested for multiple unknown parties', () => {
    const district: District = {
      districtNumber: 1,
      candidates: [
        createCandidate({ party: null }),
        createCandidate({ party: null }),
      ],
    };
    expect(getDistrictStatusLabel(district)).toBe('2 candidates filed, party unknown');
  });
});
