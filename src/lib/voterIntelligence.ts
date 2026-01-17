/**
 * Voter Intelligence Aggregation Utilities
 *
 * Combines data from BallotReady and TargetSmart APIs with local
 * opportunity scoring to provide comprehensive strategic insights.
 */

import {
  getLiveElectionTimeline,
  getPollingPlaces,
  enrichCandidate,
  findRecruitmentOpportunities,
  type LiveElectionTimeline,
  type EnrichedCandidate,
  type RecruitmentOpportunity,
} from './ballotready';

import {
  getDistrictElectorateProfile,
  getMobilizationScore,
  getEarlyVoteTracking,
  getDistrictDonorSummary,
  type DistrictElectorateProfile,
  type MobilizationUniverse,
  type EarlyVoteTracking,
  type DistrictDonorSummary,
} from './targetsmart';

import type { Candidate, DistrictOpportunity } from '@/types/schema';

// =============================================================================
// Combined Intelligence Types
// =============================================================================

/**
 * Enhanced opportunity score combining historical margins with voter intelligence
 */
export interface EnhancedOpportunityScore {
  districtNumber: number;
  chamber: 'house' | 'senate';

  // Original opportunity data
  originalScore: number;
  originalTier: string;

  // Voter intelligence adjustments
  mobilizationBonus: number;
  turnoutAdjustment: number;
  donorCapacityBonus: number;

  // Final enhanced score
  enhancedScore: number;
  enhancedTier: string;

  // Key insights
  insights: {
    lowTurnoutDemCount: number;
    swingVoterCount: number;
    estimatedVotePickup: number;
    donorCapacity: 'high' | 'medium' | 'low';
  };
}

/**
 * Complete district intelligence package
 */
export interface DistrictIntelligence {
  districtNumber: number;
  chamber: 'house' | 'senate';

  // From local data
  opportunity: DistrictOpportunity;
  candidates: Candidate[];

  // From BallotReady
  enrichedCandidates?: EnrichedCandidate[];
  recruitmentNeeded: boolean;

  // From TargetSmart
  electorateProfile?: DistrictElectorateProfile;
  mobilizationUniverse?: MobilizationUniverse;
  earlyVoteData?: EarlyVoteTracking;
  donorSummary?: DistrictDonorSummary;

  // Combined analysis
  enhancedScore: EnhancedOpportunityScore;
  strategicRecommendations: string[];
}

/**
 * Election dashboard with live data
 */
export interface ElectionDashboard {
  timeline: LiveElectionTimeline | null;

  // Quick stats
  daysUntilElection: number;
  filingDeadlinesCount: number;
  nextMilestone: string | null;

  // District summaries
  recruitmentOpportunities: number;
  highMobilizationDistricts: number;

  // Last updated
  updatedAt: string;
}

// =============================================================================
// Core Intelligence Functions
// =============================================================================

/**
 * Get the election dashboard with live timeline data
 */
export async function getElectionDashboard(): Promise<ElectionDashboard> {
  const timeline = await getLiveElectionTimeline();

  return {
    timeline,
    daysUntilElection: timeline?.daysUntilElection ?? 0,
    filingDeadlinesCount: timeline?.filingDeadlines.length ?? 0,
    nextMilestone: timeline?.nextMilestone?.name ?? null,
    recruitmentOpportunities: 0, // Will be calculated separately
    highMobilizationDistricts: 0, // Will be calculated separately
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Get comprehensive intelligence for a single district
 */
export async function getDistrictIntelligence(
  chamber: 'house' | 'senate',
  districtNumber: number,
  opportunity: DistrictOpportunity,
  candidates: Candidate[]
): Promise<DistrictIntelligence> {
  // Fetch all intelligence data in parallel
  const [electorateProfile, earlyVoteData, donorSummary] = await Promise.all([
    getDistrictElectorateProfile(chamber, districtNumber),
    getEarlyVoteTracking(chamber, districtNumber),
    getDistrictDonorSummary(chamber, districtNumber),
  ]);

  // Enrich candidates with BallotReady data
  const enrichedCandidates = await Promise.all(
    candidates.map((c) => enrichCandidate(c))
  );

  // Calculate enhanced opportunity score
  const enhancedScore = calculateEnhancedScore(
    opportunity,
    chamber,
    districtNumber,
    electorateProfile,
    donorSummary
  );

  // Generate strategic recommendations
  const recommendations = generateRecommendations(
    opportunity,
    electorateProfile,
    donorSummary,
    earlyVoteData
  );

  return {
    districtNumber,
    chamber,
    opportunity,
    candidates,
    enrichedCandidates,
    recruitmentNeeded: !opportunity.flags.hasDemocrat,
    electorateProfile: electorateProfile ?? undefined,
    mobilizationUniverse: electorateProfile?.mobilizationUniverse,
    earlyVoteData: earlyVoteData ?? undefined,
    donorSummary: donorSummary ?? undefined,
    enhancedScore,
    strategicRecommendations: recommendations,
  };
}

/**
 * Calculate enhanced opportunity score with voter intelligence
 */
function calculateEnhancedScore(
  opportunity: DistrictOpportunity,
  chamber: 'house' | 'senate',
  districtNumber: number,
  electorateProfile: DistrictElectorateProfile | null,
  donorSummary: DistrictDonorSummary | null
): EnhancedOpportunityScore {
  let enhancedScore = opportunity.opportunityScore;
  let mobilizationBonus = 0;
  let turnoutAdjustment = 0;
  let donorCapacityBonus = 0;

  // Mobilization bonus: +5-15 points for high mobilization potential
  if (electorateProfile?.mobilizationUniverse) {
    const mob = electorateProfile.mobilizationUniverse;
    if (mob.lowTurnoutDems.potential === 'high') {
      mobilizationBonus = 15;
    } else if (mob.lowTurnoutDems.potential === 'medium') {
      mobilizationBonus = 8;
    } else {
      mobilizationBonus = 3;
    }
  }

  // Turnout adjustment: Consider if turnout is typically lower than average
  if (electorateProfile?.turnoutProfile) {
    const avgTurnout = electorateProfile.turnoutProfile.averageTurnout.general;
    if (avgTurnout < 50) {
      // Low turnout districts may have more upside
      turnoutAdjustment = 5;
    } else if (avgTurnout > 70) {
      // High turnout districts have less room for growth
      turnoutAdjustment = -3;
    }
  }

  // Donor capacity bonus: +3-8 points for strong local donor base
  if (donorSummary) {
    const demGiving = donorSummary.partyGiving.democratic;
    const totalGiving =
      donorSummary.partyGiving.democratic +
      donorSummary.partyGiving.republican +
      donorSummary.partyGiving.nonPartisan;

    if (demGiving > 100000 || demGiving / totalGiving > 0.4) {
      donorCapacityBonus = 8;
    } else if (demGiving > 50000 || demGiving / totalGiving > 0.25) {
      donorCapacityBonus = 5;
    } else if (demGiving > 20000) {
      donorCapacityBonus = 3;
    }
  }

  enhancedScore = Math.min(
    100,
    Math.max(
      0,
      enhancedScore + mobilizationBonus + turnoutAdjustment + donorCapacityBonus
    )
  );

  // Determine enhanced tier
  let enhancedTier = opportunity.tier;
  if (enhancedScore >= 70) {
    enhancedTier = 'HIGH_OPPORTUNITY';
  } else if (enhancedScore >= 50) {
    enhancedTier = 'EMERGING';
  } else if (enhancedScore >= 30) {
    enhancedTier = 'BUILD';
  }

  return {
    districtNumber,
    chamber,
    originalScore: opportunity.opportunityScore,
    originalTier: opportunity.tier,
    mobilizationBonus,
    turnoutAdjustment,
    donorCapacityBonus,
    enhancedScore,
    enhancedTier,
    insights: {
      lowTurnoutDemCount:
        electorateProfile?.mobilizationUniverse.lowTurnoutDems.count ?? 0,
      swingVoterCount:
        electorateProfile?.mobilizationUniverse.swingVoters.count ?? 0,
      estimatedVotePickup:
        electorateProfile?.mobilizationUniverse.estimatedVotePickup ?? 0,
      donorCapacity:
        donorCapacityBonus >= 8
          ? 'high'
          : donorCapacityBonus >= 5
            ? 'medium'
            : 'low',
    },
  };
}

/**
 * Generate strategic recommendations based on all available data
 */
function generateRecommendations(
  opportunity: DistrictOpportunity,
  electorateProfile: DistrictElectorateProfile | null,
  donorSummary: DistrictDonorSummary | null,
  earlyVoteData: EarlyVoteTracking | null
): string[] {
  const recommendations: string[] = [];

  // Candidate recruitment recommendation
  if (!opportunity.flags.hasDemocrat && opportunity.opportunityScore >= 40) {
    recommendations.push(
      'PRIORITY: Recruit a Democratic candidate. This district has competitive potential.'
    );
  }

  // Mobilization recommendations
  if (electorateProfile?.mobilizationUniverse) {
    const mob = electorateProfile.mobilizationUniverse;

    if (mob.lowTurnoutDems.potential === 'high') {
      recommendations.push(
        `MOBILIZE: ${mob.lowTurnoutDems.count.toLocaleString()} low-turnout Democratic voters identified. Focus on turnout operations.`
      );
    }

    if (mob.swingVoters.count > 1000) {
      recommendations.push(
        `PERSUADE: ${mob.swingVoters.count.toLocaleString()} swing voters available for persuasion.`
      );
    }
  }

  // Donor recommendations
  if (donorSummary) {
    if (donorSummary.donorCapacity.major > 50) {
      recommendations.push(
        `FUNDRAISE: ${donorSummary.donorCapacity.major} major donors ($1000+) in district. Schedule in-district fundraising events.`
      );
    }

    if (donorSummary.trend === 'increasing') {
      recommendations.push(
        'MOMENTUM: Democratic giving is trending upward. Capitalize on enthusiasm.'
      );
    }
  }

  // Early vote recommendations (during election season)
  if (earlyVoteData) {
    const demReturned = earlyVoteData.ballotsReturned.democratic;
    const repReturned = earlyVoteData.ballotsReturned.republican;

    if (demReturned < repReturned * 0.8) {
      recommendations.push(
        'URGENT: Democratic ballot returns trailing Republican. Increase chase efforts.'
      );
    } else if (demReturned > repReturned * 1.2) {
      recommendations.push(
        'STRONG: Democratic ballot returns ahead. Maintain momentum.'
      );
    }
  }

  // Open seat recommendation
  if (opportunity.flags.openSeat) {
    recommendations.push(
      'OPEN SEAT: No incumbent advantage. Invest early in name recognition and voter contact.'
    );
  }

  // Trending recommendation
  if (opportunity.flags.trendingDem) {
    recommendations.push(
      'TRENDING: Margins have been moving Democratic. Build on momentum with targeted outreach.'
    );
  }

  return recommendations;
}

// =============================================================================
// Batch Intelligence Functions
// =============================================================================

/**
 * Get recruitment opportunities across all districts
 */
export async function getAllRecruitmentOpportunities(
  opportunityData: {
    house: Record<string, DistrictOpportunity>;
    senate: Record<string, DistrictOpportunity>;
  }
): Promise<{
  house: RecruitmentOpportunity[];
  senate: RecruitmentOpportunity[];
}> {
  const [houseOpps, senateOpps] = await Promise.all([
    findRecruitmentOpportunities(
      Object.fromEntries(
        Object.entries(opportunityData.house).map(([k, v]) => [
          k,
          {
            opportunityScore: v.opportunityScore,
            tier: v.tier,
            flags: { hasDemocrat: v.flags.hasDemocrat },
          },
        ])
      ),
      'house'
    ),
    findRecruitmentOpportunities(
      Object.fromEntries(
        Object.entries(opportunityData.senate).map(([k, v]) => [
          k,
          {
            opportunityScore: v.opportunityScore,
            tier: v.tier,
            flags: { hasDemocrat: v.flags.hasDemocrat },
          },
        ])
      ),
      'senate'
    ),
  ]);

  return {
    house: houseOpps,
    senate: senateOpps,
  };
}

/**
 * Get high-mobilization districts across both chambers
 */
export async function getHighMobilizationSummary(): Promise<{
  house: { districtNumber: number; score: number; potential: string }[];
  senate: { districtNumber: number; score: number; potential: string }[];
}> {
  const results = {
    house: [] as { districtNumber: number; score: number; potential: string }[],
    senate: [] as { districtNumber: number; score: number; potential: string }[],
  };

  // Get profiles for all districts
  for (let i = 1; i <= 124; i++) {
    const profile = await getDistrictElectorateProfile('house', i);
    if (profile && profile.mobilizationUniverse.mobilizationPriority >= 50) {
      results.house.push({
        districtNumber: i,
        score: profile.mobilizationUniverse.mobilizationPriority,
        potential: profile.mobilizationUniverse.lowTurnoutDems.potential,
      });
    }
  }

  for (let i = 1; i <= 46; i++) {
    const profile = await getDistrictElectorateProfile('senate', i);
    if (profile && profile.mobilizationUniverse.mobilizationPriority >= 50) {
      results.senate.push({
        districtNumber: i,
        score: profile.mobilizationUniverse.mobilizationPriority,
        potential: profile.mobilizationUniverse.lowTurnoutDems.potential,
      });
    }
  }

  // Sort by score
  results.house.sort((a, b) => b.score - a.score);
  results.senate.sort((a, b) => b.score - a.score);

  return results;
}

// =============================================================================
// Polling Place Integration
// =============================================================================

export interface PollingLocationResult {
  pollingPlace: {
    name: string;
    address: string;
    hours?: string;
  } | null;
  earlyVoting: {
    name: string;
    address: string;
    dates: string;
    hours?: string;
  }[];
  dropBoxes: {
    name: string;
    address: string;
  }[];
}

/**
 * Get polling locations for an address
 */
export async function getPollingLocations(
  address: string
): Promise<PollingLocationResult> {
  try {
    const response = await getPollingPlaces({ address });

    return {
      pollingPlace: response.polling_places?.[0]
        ? {
            name: response.polling_places[0].name,
            address: response.polling_places[0].address.formatted ||
              `${response.polling_places[0].address.street}, ${response.polling_places[0].address.city}, ${response.polling_places[0].address.state} ${response.polling_places[0].address.zip}`,
            hours: response.polling_places[0].hours?.[0]
              ? `${response.polling_places[0].hours[0].start_time} - ${response.polling_places[0].hours[0].end_time}`
              : undefined,
          }
        : null,
      earlyVoting: (response.early_voting_locations || []).map((loc) => ({
        name: loc.name,
        address: loc.address.formatted ||
          `${loc.address.street}, ${loc.address.city}, ${loc.address.state} ${loc.address.zip}`,
        dates: loc.hours?.length
          ? `${loc.hours[0].date} - ${loc.hours[loc.hours.length - 1].date}`
          : 'Check local listings',
        hours: loc.hours?.[0]
          ? `${loc.hours[0].start_time} - ${loc.hours[0].end_time}`
          : undefined,
      })),
      dropBoxes: (response.drop_boxes || []).map((box) => ({
        name: box.name,
        address: box.address.formatted ||
          `${box.address.street}, ${box.address.city}, ${box.address.state} ${box.address.zip}`,
      })),
    };
  } catch (error) {
    console.error('Failed to get polling locations:', error);
    return {
      pollingPlace: null,
      earlyVoting: [],
      dropBoxes: [],
    };
  }
}

// Types are exported inline with their interface definitions above
