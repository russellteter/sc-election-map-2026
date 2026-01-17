/**
 * Demo Data Generator
 *
 * Generates realistic demo data for states without live API access.
 * Data is based on real demographics and historical election patterns.
 *
 * Usage: npx tsx scripts/generate-demo-data.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { generateDeterministicName } from './lib/generators/names';
import type {
  Candidate,
  Incumbent,
  District,
  ElectionResult,
  DistrictElectionHistory,
  VoterIntelligenceProfile,
  OpportunityScore,
  MobilizationData,
  StateConfig,
} from './lib/generators/types';

// State configurations with baseline political data
const STATE_CONFIGS: StateConfig[] = [
  {
    code: 'NC',
    name: 'North Carolina',
    chambers: { house: { count: 120 }, senate: { count: 50 } },
    presidentialMargin2024: -3.2,
    baselinePartisanship: -0.05, // Slight R lean
  },
  {
    code: 'GA',
    name: 'Georgia',
    chambers: { house: { count: 180 }, senate: { count: 56 } },
    presidentialMargin2024: -2.1,
    baselinePartisanship: -0.03, // Very competitive
  },
  {
    code: 'FL',
    name: 'Florida',
    chambers: { house: { count: 120 }, senate: { count: 40 } },
    presidentialMargin2024: -13.2,
    baselinePartisanship: -0.15, // Moderate R lean
  },
  {
    code: 'VA',
    name: 'Virginia',
    chambers: { house: { count: 100 }, senate: { count: 40 } },
    presidentialMargin2024: 6.3,
    baselinePartisanship: 0.08, // Slight D lean
  },
];

/**
 * Seeded random number generator for consistent data
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  pick<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Generate district-level margin based on state baseline and district variation
 */
function generateDistrictMargin(
  stateConfig: StateConfig,
  chamber: 'house' | 'senate',
  districtNum: number,
  rng: SeededRandom
): number {
  // Base margin from state's presidential result
  const baseMargin = stateConfig.presidentialMargin2024;

  // Add district-level variation (gerrymandering creates safe districts)
  const districtVariation = rng.nextFloat(-25, 25);

  // Some districts are very safe (packed)
  const isSafeDistrict = rng.next() < 0.4;
  const safeBonus = isSafeDistrict ? rng.nextFloat(15, 35) * (rng.next() < 0.5 ? -1 : 1) : 0;

  return Math.max(-100, Math.min(100, baseMargin + districtVariation + safeBonus));
}

/**
 * Generate election history for a district
 */
function generateElectionHistory(
  stateConfig: StateConfig,
  chamber: 'house' | 'senate',
  districtNum: number
): DistrictElectionHistory {
  const rng = new SeededRandom(hashCode(`${stateConfig.code}-${chamber}-${districtNum}-elections`));

  const baseMargin = generateDistrictMargin(stateConfig, chamber, districtNum, rng);

  const generateYearResult = (year: number, baseMargin: number): ElectionResult => {
    // Add year-specific swing
    const yearSwing = year === 2024 ? 0 : year === 2022 ? rng.nextFloat(-3, 5) : rng.nextFloat(-5, 5);
    const margin = Math.max(-100, Math.min(100, baseMargin + yearSwing));

    const isUncontested = Math.abs(margin) > 35 && rng.next() < 0.3;
    const finalMargin = isUncontested ? 100 : Math.abs(margin);

    const totalVotes = rng.nextInt(8000, 25000);
    const winnerParty: 'Democratic' | 'Republican' = margin > 0 ? 'Democratic' : 'Republican';

    const winnerPct = isUncontested ? 100 : 50 + finalMargin / 2;
    const winnerVotes = Math.round(totalVotes * (winnerPct / 100));

    return {
      year,
      totalVotes,
      winner: {
        name: generateDeterministicName(stateConfig.code, chamber, districtNum, year),
        party: winnerParty,
        votes: winnerVotes,
        percentage: winnerPct,
      },
      margin: finalMargin,
      marginVotes: isUncontested ? totalVotes : Math.round(totalVotes * (finalMargin / 100)),
      uncontested: isUncontested,
      dem_pct: margin > 0 ? winnerPct / 100 : (100 - winnerPct) / 100,
      rep_pct: margin > 0 ? (100 - winnerPct) / 100 : winnerPct / 100,
    };
  };

  const elections = {
    '2024': generateYearResult(2024, baseMargin),
    '2022': generateYearResult(2022, baseMargin),
    '2020': generateYearResult(2020, baseMargin),
  };

  const avgMargin = (elections['2024'].margin + elections['2022'].margin + elections['2020'].margin) / 3;
  const hasSwung = elections['2024'].winner.party !== elections['2020'].winner.party;
  const contestedRaces = Object.values(elections).filter(e => !e.uncontested).length;
  const dominantParty = baseMargin > 0 ? 'Democratic' : 'Republican';

  return {
    districtNumber: districtNum,
    elections,
    competitiveness: {
      score: avgMargin < 5 ? 1 : avgMargin < 10 ? 2 : avgMargin < 20 ? 3 : avgMargin < 35 ? 4 : 5,
      avgMargin,
      hasSwung,
      contestedRaces,
      dominantParty,
    },
  };
}

/**
 * Generate candidates for a district
 */
function generateCandidates(
  stateConfig: StateConfig,
  chamber: 'house' | 'senate',
  districtNum: number,
  electionHistory: DistrictElectionHistory
): District {
  const rng = new SeededRandom(hashCode(`${stateConfig.code}-${chamber}-${districtNum}-candidates`));

  const lastElection = electionHistory.elections['2024'];
  const margin = lastElection.margin;
  const dominantParty = electionHistory.competitiveness.dominantParty;

  // Generate incumbent
  const incumbent: Incumbent = {
    name: lastElection.winner.name,
    party: lastElection.winner.party,
    yearsInOffice: rng.nextInt(2, 20),
  };

  const candidates: Candidate[] = [];

  // Chance of incumbent running
  const incumbentRunning = rng.next() < 0.85;
  if (incumbentRunning) {
    candidates.push({
      name: incumbent.name.split(' ').reverse().join(', '),
      party: incumbent.party,
      status: 'filed',
      filedDate: `2025-${rng.nextInt(3, 12).toString().padStart(2, '0')}-${rng.nextInt(1, 28).toString().padStart(2, '0')}`,
      isIncumbent: true,
      source: 'demo',
    });
  }

  // Generate challengers based on competitiveness
  const oppositionParty: 'Democratic' | 'Republican' = dominantParty === 'Democratic' ? 'Republican' : 'Democratic';

  // Close races more likely to have challengers
  const challengerChance = margin < 10 ? 0.8 : margin < 20 ? 0.5 : margin < 35 ? 0.25 : 0.1;

  if (rng.next() < challengerChance) {
    // Democratic challenger (for our purposes, we focus on Dem recruitment)
    const demChallenger: Candidate = {
      name: generateDeterministicName(stateConfig.code, chamber, districtNum, 1).split(' ').reverse().join(', '),
      party: 'Democratic',
      status: rng.pick(['filed', 'filed', 'announced']),
      filedDate: rng.next() < 0.7
        ? `2025-${rng.nextInt(6, 12).toString().padStart(2, '0')}-${rng.nextInt(1, 28).toString().padStart(2, '0')}`
        : `2026-01-${rng.nextInt(1, 15).toString().padStart(2, '0')}`,
      isIncumbent: false,
      source: 'demo',
    };

    // Only add if there isn't already a Dem incumbent
    if (dominantParty !== 'Democratic' || !incumbentRunning) {
      candidates.push(demChallenger);
    }
  }

  // Sometimes add Republican challengers in Dem districts
  if (dominantParty === 'Democratic' && rng.next() < challengerChance * 0.7) {
    candidates.push({
      name: generateDeterministicName(stateConfig.code, chamber, districtNum, 2).split(' ').reverse().join(', '),
      party: 'Republican',
      status: rng.pick(['filed', 'announced']),
      filedDate: `2025-${rng.nextInt(8, 12).toString().padStart(2, '0')}-${rng.nextInt(1, 28).toString().padStart(2, '0')}`,
      isIncumbent: false,
      source: 'demo',
    });
  }

  // Sometimes add unknown party candidates
  if (rng.next() < 0.1) {
    candidates.push({
      name: generateDeterministicName(stateConfig.code, chamber, districtNum, 3).split(' ').reverse().join(', '),
      party: null,
      status: 'filed',
      filedDate: `2025-${rng.nextInt(9, 12).toString().padStart(2, '0')}-${rng.nextInt(1, 28).toString().padStart(2, '0')}`,
      isIncumbent: false,
      source: 'demo',
    });
  }

  return {
    districtNumber: districtNum,
    candidates,
    incumbent,
  };
}

/**
 * Generate voter intelligence profile
 */
function generateVoterIntelligence(
  stateConfig: StateConfig,
  chamber: 'house' | 'senate',
  districtNum: number,
  electionHistory: DistrictElectionHistory
): VoterIntelligenceProfile {
  const rng = new SeededRandom(hashCode(`${stateConfig.code}-${chamber}-${districtNum}-vi`));

  const baseVoters = chamber === 'house'
    ? rng.nextInt(20000, 60000)
    : rng.nextInt(80000, 200000);

  const margin = electionHistory.elections['2024'].margin;
  const dominantParty = electionHistory.competitiveness.dominantParty;

  // Registration breakdown based on margin
  const baseRegistration = 0.33;
  const marginEffect = margin / 200; // Small effect
  const demReg = Math.max(0.15, Math.min(0.55, baseRegistration + (dominantParty === 'Democratic' ? marginEffect : -marginEffect)));
  const repReg = Math.max(0.15, Math.min(0.55, baseRegistration + (dominantParty === 'Republican' ? marginEffect : -marginEffect)));
  const indReg = 1 - demReg - repReg - 0.02;

  const turnout2024 = rng.nextFloat(0.55, 0.75);
  const turnout2022 = turnout2024 - rng.nextFloat(0.1, 0.2);
  const turnout2020 = turnout2024 + rng.nextFloat(-0.05, 0.05);

  const urbanization = rng.pick(['urban', 'suburban', 'suburban', 'rural']) as 'urban' | 'suburban' | 'rural';

  return {
    districtNumber: districtNum,
    registeredVoters: baseVoters,
    turnout2024,
    turnout2022,
    turnout2020,
    registration: {
      democratic: Math.round(baseVoters * demReg),
      republican: Math.round(baseVoters * repReg),
      independent: Math.round(baseVoters * indReg),
      other: Math.round(baseVoters * 0.02),
    },
    demographics: {
      medianAge: rng.nextInt(35, 55),
      collegeEducated: rng.nextFloat(0.2, 0.5),
      urbanization,
      diversityIndex: rng.nextFloat(0.2, 0.7),
    },
    trends: {
      registrationTrend: rng.nextFloat(-2, 3), // % change in D registration
      turnoutTrend: rng.nextFloat(-1, 2),
      demographicShift: rng.nextFloat(-1, 2),
    },
  };
}

/**
 * Generate opportunity score
 */
function generateOpportunityScore(
  stateConfig: StateConfig,
  chamber: 'house' | 'senate',
  districtNum: number,
  electionHistory: DistrictElectionHistory,
  candidates: District,
  voterIntel: VoterIntelligenceProfile
): OpportunityScore {
  const margin = electionHistory.elections['2024'].margin;
  const dominantParty = electionHistory.competitiveness.dominantParty;
  const hasDemCandidate = candidates.candidates.some(c => c.party === 'Democratic');
  const isDemIncumbent = candidates.incumbent?.party === 'Democratic';

  // Calculate factors
  const marginFactor = Math.max(0, 100 - margin * 2); // Lower margin = higher opportunity
  const registrationFactor = (voterIntel.registration.democratic / voterIntel.registeredVoters) * 100;
  const turnoutGapFactor = (voterIntel.turnout2020 - voterIntel.turnout2022) * 100; // Higher 2020 turnout = Dem advantage
  const demographicFactor = (voterIntel.demographics.collegeEducated + voterIntel.demographics.diversityIndex) * 50;
  const incumbentFactor = isDemIncumbent ? 80 : (candidates.incumbent ? 20 : 50);

  // Calculate overall score
  let overallScore = (marginFactor * 0.35 + registrationFactor * 0.2 + turnoutGapFactor * 0.15 +
    demographicFactor * 0.15 + incumbentFactor * 0.15);

  // Adjust for incumbent party
  if (isDemIncumbent) {
    overallScore = Math.max(overallScore, 60); // Defensive seats have baseline score
  } else if (dominantParty === 'Republican' && margin > 30) {
    overallScore = Math.min(overallScore, 25); // Very safe R seats capped
  }

  overallScore = Math.max(0, Math.min(100, overallScore));

  // Determine category
  let category: OpportunityScore['category'];
  let recommendation: string;

  if (isDemIncumbent) {
    category = 'DEFENSIVE';
    recommendation = margin < 10
      ? 'Priority defensive seat - ensure strong candidate support'
      : 'Monitor for challenger strength';
  } else if (margin < 5) {
    category = 'HIGH_OPPORTUNITY';
    recommendation = hasDemCandidate
      ? 'Maximum investment recommended - winnable district'
      : 'URGENT: Recruit strong candidate immediately';
  } else if (margin < 15) {
    category = 'EMERGING';
    recommendation = hasDemCandidate
      ? 'Strong investment opportunity with good candidate'
      : 'Recruit candidate - district becoming competitive';
  } else if (margin < 30) {
    category = 'LONG_SHOT';
    recommendation = 'Long-term investment - build party infrastructure';
  } else {
    category = 'SAFE_R';
    recommendation = 'Low priority - focus resources elsewhere';
  }

  return {
    districtNumber: districtNum,
    overallScore: Math.round(overallScore),
    factors: {
      marginFactor: Math.round(marginFactor),
      registrationFactor: Math.round(registrationFactor),
      turnoutGapFactor: Math.round(turnoutGapFactor),
      demographicFactor: Math.round(demographicFactor),
      incumbentFactor: Math.round(incumbentFactor),
    },
    category,
    recommendation,
  };
}

/**
 * Generate mobilization data
 */
function generateMobilizationData(
  stateConfig: StateConfig,
  chamber: 'house' | 'senate',
  districtNum: number,
  voterIntel: VoterIntelligenceProfile,
  opportunity: OpportunityScore
): MobilizationData {
  const rng = new SeededRandom(hashCode(`${stateConfig.code}-${chamber}-${districtNum}-mob`));

  const totalDems = voterIntel.registration.democratic;
  const independents = voterIntel.registration.independent;

  // Calculate mobilization universes
  const lowPropensityDems = Math.round(totalDems * rng.nextFloat(0.15, 0.3));
  const persuadables = Math.round(independents * rng.nextFloat(0.1, 0.25));
  const registrationTargets = Math.round(voterIntel.registeredVoters * rng.nextFloat(0.02, 0.08));

  const baselineTurnout = voterIntel.turnout2022;
  const mobilizationLift = opportunity.overallScore > 60
    ? rng.nextFloat(0.03, 0.08)
    : rng.nextFloat(0.01, 0.04);

  let contactStrategy: string;
  if (opportunity.category === 'HIGH_OPPORTUNITY') {
    contactStrategy = 'Full contact program: doors, phones, digital, mail';
  } else if (opportunity.category === 'EMERGING') {
    contactStrategy = 'Targeted contact: persuasion mail + digital';
  } else if (opportunity.category === 'DEFENSIVE') {
    contactStrategy = 'Base mobilization: GOTV focus on low-propensity Dems';
  } else {
    contactStrategy = 'Minimal contact: digital only';
  }

  return {
    districtNumber: districtNum,
    universe: {
      totalTargets: lowPropensityDems + persuadables + registrationTargets,
      lowPropensityDems,
      persuadables,
      registrationTargets,
    },
    projectedTurnout: {
      baseline: Math.round(baselineTurnout * 100) / 100,
      withMobilization: Math.round((baselineTurnout + mobilizationLift) * 100) / 100,
      lift: Math.round(mobilizationLift * 100) / 100,
    },
    contactStrategy,
  };
}

/**
 * Generate all data for a state
 */
function generateStateData(stateConfig: StateConfig): void {
  console.log(`\nGenerating data for ${stateConfig.name} (${stateConfig.code})...`);

  const outputDir = path.join(__dirname, '..', 'public', 'data', 'states', stateConfig.code.toLowerCase());

  // Ensure directories exist
  fs.mkdirSync(path.join(outputDir, 'demo'), { recursive: true });

  const chambers: ('house' | 'senate')[] = ['house', 'senate'];

  for (const chamber of chambers) {
    const districtCount = stateConfig.chambers[chamber].count;
    console.log(`  Generating ${chamber} data (${districtCount} districts)...`);

    // Initialize data structures
    const candidatesData: Record<string, District> = {};
    const electionsData: Record<string, DistrictElectionHistory> = {};
    const voterIntelData: Record<string, VoterIntelligenceProfile> = {};
    const opportunityData: Record<string, OpportunityScore> = {};
    const mobilizationData: Record<string, MobilizationData> = {};

    for (let i = 1; i <= districtCount; i++) {
      // Generate election history first (determines partisan baseline)
      const electionHistory = generateElectionHistory(stateConfig, chamber, i);
      electionsData[String(i)] = electionHistory;

      // Generate candidates based on election history
      const candidates = generateCandidates(stateConfig, chamber, i, electionHistory);
      candidatesData[String(i)] = candidates;

      // Generate voter intelligence
      const voterIntel = generateVoterIntelligence(stateConfig, chamber, i, electionHistory);
      voterIntelData[String(i)] = voterIntel;

      // Generate opportunity score
      const opportunity = generateOpportunityScore(stateConfig, chamber, i, electionHistory, candidates, voterIntel);
      opportunityData[String(i)] = opportunity;

      // Generate mobilization data
      const mobilization = generateMobilizationData(stateConfig, chamber, i, voterIntel, opportunity);
      mobilizationData[String(i)] = mobilization;
    }

    // Write chamber-specific data
    const chamberSuffix = chamber === 'house' ? 'house' : 'senate';

    // Write to demo subdirectory
    fs.writeFileSync(
      path.join(outputDir, 'demo', `${chamberSuffix}-voter-intelligence.json`),
      JSON.stringify(voterIntelData, null, 2)
    );
    fs.writeFileSync(
      path.join(outputDir, 'demo', `${chamberSuffix}-opportunity-scores.json`),
      JSON.stringify(opportunityData, null, 2)
    );
    fs.writeFileSync(
      path.join(outputDir, 'demo', `${chamberSuffix}-mobilization.json`),
      JSON.stringify(mobilizationData, null, 2)
    );

    // Store for combined output
    if (chamber === 'house') {
      (candidatesData as any)._house = candidatesData;
      (electionsData as any)._house = electionsData;
    } else {
      (candidatesData as any)._senate = candidatesData;
      (electionsData as any)._senate = electionsData;
    }
  }

  // Generate combined candidates.json (matches SC format)
  const houseElections: Record<string, DistrictElectionHistory> = {};
  const senateElections: Record<string, DistrictElectionHistory> = {};
  const houseCandidates: Record<string, District> = {};
  const senateCandidates: Record<string, District> = {};

  for (let i = 1; i <= stateConfig.chambers.house.count; i++) {
    const electionHistory = generateElectionHistory(stateConfig, 'house', i);
    houseElections[String(i)] = electionHistory;
    houseCandidates[String(i)] = generateCandidates(stateConfig, 'house', i, electionHistory);
  }

  for (let i = 1; i <= stateConfig.chambers.senate.count; i++) {
    const electionHistory = generateElectionHistory(stateConfig, 'senate', i);
    senateElections[String(i)] = electionHistory;
    senateCandidates[String(i)] = generateCandidates(stateConfig, 'senate', i, electionHistory);
  }

  // Write combined files
  fs.writeFileSync(
    path.join(outputDir, 'candidates.json'),
    JSON.stringify({
      lastUpdated: new Date().toISOString(),
      source: 'demo-generated',
      house: houseCandidates,
      senate: senateCandidates,
    }, null, 2)
  );

  fs.writeFileSync(
    path.join(outputDir, 'elections.json'),
    JSON.stringify({
      lastUpdated: new Date().toISOString(),
      source: 'demo-generated',
      years: [2020, 2022, 2024],
      house: houseElections,
      senate: senateElections,
    }, null, 2)
  );

  console.log(`  Wrote data to ${outputDir}`);
}

/**
 * Main function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Demo Data Generator - Blue Intelligence');
  console.log('='.repeat(60));

  for (const stateConfig of STATE_CONFIGS) {
    generateStateData(stateConfig);
  }

  console.log('\n' + '='.repeat(60));
  console.log('Demo data generation complete!');
  console.log('='.repeat(60));

  // Print summary
  let totalDistricts = 0;
  for (const state of STATE_CONFIGS) {
    const districts = state.chambers.house.count + state.chambers.senate.count;
    totalDistricts += districts;
    console.log(`${state.code}: ${districts} districts`);
  }
  console.log(`Total: ${totalDistricts} districts with demo data`);
}

main().catch(console.error);
