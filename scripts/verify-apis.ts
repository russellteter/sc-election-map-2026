#!/usr/bin/env npx tsx
/**
 * API Verification Script
 *
 * Tests BallotReady and TargetSmart API connectivity with real credentials.
 * Run with: npx tsx scripts/verify-apis.ts
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// =============================================================================
// Configuration
// =============================================================================

const BALLOTREADY_BASE_URL = 'https://api.civicengine.com';
const TARGETSMART_BASE_URL = 'https://api.targetsmart.com';

const BALLOTREADY_KEY = process.env.NEXT_PUBLIC_BALLOTREADY_KEY || '';
const TARGETSMART_KEY = process.env.NEXT_PUBLIC_TARGETSMART_KEY || '';

const TIMEOUT_MS = 10000; // 10 second timeout

interface ApiVerificationResult {
  status: 'success' | 'error';
  message: string;
  sampleData?: unknown;
  responseTime?: number;
}

interface VerificationOutput {
  timestamp: string;
  ballotready: ApiVerificationResult;
  targetsmart: ApiVerificationResult;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Fetch with timeout support
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Parse error message from various error types
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return 'Request timed out after 10 seconds';
    }
    if (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND')) {
      return 'API unreachable - network error';
    }
    return error.message;
  }
  return 'Unknown error occurred';
}

// =============================================================================
// BallotReady Verification
// =============================================================================

async function verifyBallotReady(): Promise<ApiVerificationResult> {
  const startTime = Date.now();

  // Check for API key
  if (!BALLOTREADY_KEY) {
    return {
      status: 'error',
      message: 'Missing API key (NEXT_PUBLIC_BALLOTREADY_KEY)',
    };
  }

  try {
    // Test 1: Get elections for SC
    const electionsUrl = `${BALLOTREADY_BASE_URL}/elections?state=SC&upcoming=true`;

    const response = await fetchWithTimeout(
      electionsUrl,
      {
        method: 'GET',
        headers: {
          'x-api-key': BALLOTREADY_KEY,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      },
      TIMEOUT_MS
    );

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const status = response.status;
      if (status === 401 || status === 403) {
        return {
          status: 'error',
          message: `Invalid API key or access denied (HTTP ${status})`,
          responseTime,
        };
      }
      if (status === 404) {
        return {
          status: 'error',
          message: `Endpoint not found (HTTP ${status}) - API may have changed`,
          responseTime,
        };
      }
      if (status >= 500) {
        return {
          status: 'error',
          message: `Server error (HTTP ${status}) - try again later`,
          responseTime,
        };
      }
      return {
        status: 'error',
        message: `API error: HTTP ${status}`,
        responseTime,
      };
    }

    const data = await response.json();

    // Validate response structure
    if (!data || typeof data !== 'object') {
      return {
        status: 'error',
        message: 'Invalid response format from API',
        responseTime,
      };
    }

    return {
      status: 'success',
      message: 'API verified - connection successful',
      sampleData: {
        electionsCount: Array.isArray(data.elections) ? data.elections.length : 0,
        hasElections: Array.isArray(data.elections) && data.elections.length > 0,
        firstElection: Array.isArray(data.elections) && data.elections[0]
          ? {
              name: data.elections[0].name,
              date: data.elections[0].election_day,
              type: data.elections[0].election_type,
            }
          : null,
      },
      responseTime,
    };

  } catch (error) {
    return {
      status: 'error',
      message: getErrorMessage(error),
      responseTime: Date.now() - startTime,
    };
  }
}

// =============================================================================
// TargetSmart Verification
// =============================================================================

async function verifyTargetSmart(): Promise<ApiVerificationResult> {
  const startTime = Date.now();

  // Check for API key
  if (!TARGETSMART_KEY) {
    return {
      status: 'error',
      message: 'Missing API key (NEXT_PUBLIC_TARGETSMART_KEY)',
    };
  }

  try {
    // Test: District lookup for a sample SC address (State House in Columbia)
    const districtUrl = new URL(`${TARGETSMART_BASE_URL}/service/district`);
    districtUrl.searchParams.set('street_address', '1100 Gervais St');
    districtUrl.searchParams.set('city', 'Columbia');
    districtUrl.searchParams.set('state', 'SC');
    districtUrl.searchParams.set('zip', '29201');

    const response = await fetchWithTimeout(
      districtUrl.toString(),
      {
        method: 'GET',
        headers: {
          'x-api-key': TARGETSMART_KEY,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      },
      TIMEOUT_MS
    );

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const status = response.status;
      if (status === 401 || status === 403) {
        return {
          status: 'error',
          message: `Invalid API key or access denied (HTTP ${status})`,
          responseTime,
        };
      }
      if (status === 404) {
        return {
          status: 'error',
          message: `Endpoint not found (HTTP ${status}) - API may have changed`,
          responseTime,
        };
      }
      if (status >= 500) {
        return {
          status: 'error',
          message: `Server error (HTTP ${status}) - try again later`,
          responseTime,
        };
      }
      return {
        status: 'error',
        message: `API error: HTTP ${status}`,
        responseTime,
      };
    }

    const data = await response.json();

    // Validate response structure
    if (!data || typeof data !== 'object') {
      return {
        status: 'error',
        message: 'Invalid response format from API',
        responseTime,
      };
    }

    return {
      status: 'success',
      message: 'API verified - connection successful',
      sampleData: {
        state: data.state,
        hasStateHouse: !!data.state_house,
        hasStateSenate: !!data.state_senate,
        hasCongressional: !!data.congressional,
        stateHouseDistrict: data.state_house?.district,
        stateSenateDistrict: data.state_senate?.district,
      },
      responseTime,
    };

  } catch (error) {
    return {
      status: 'error',
      message: getErrorMessage(error),
      responseTime: Date.now() - startTime,
    };
  }
}

// =============================================================================
// Main Execution
// =============================================================================

async function main(): Promise<void> {
  console.log('🔍 SC Election Map 2026 - API Verification\n');
  console.log('Testing API connectivity...\n');

  const [ballotreadyResult, targetsmartResult] = await Promise.all([
    verifyBallotReady(),
    verifyTargetSmart(),
  ]);

  const output: VerificationOutput = {
    timestamp: new Date().toISOString(),
    ballotready: ballotreadyResult,
    targetsmart: targetsmartResult,
  };

  // Print human-readable summary
  console.log('='.repeat(60));
  console.log('BallotReady API');
  console.log('='.repeat(60));
  if (ballotreadyResult.status === 'success') {
    console.log(`✅ Status: ${ballotreadyResult.message}`);
    console.log(`   Response time: ${ballotreadyResult.responseTime}ms`);
    if (ballotreadyResult.sampleData) {
      const sample = ballotreadyResult.sampleData as Record<string, unknown>;
      console.log(`   Elections found: ${sample.electionsCount}`);
      if (sample.firstElection) {
        const election = sample.firstElection as Record<string, string>;
        console.log(`   Next election: ${election.name} (${election.date})`);
      }
    }
  } else {
    console.log(`❌ Status: ERROR`);
    console.log(`   Message: ${ballotreadyResult.message}`);
    if (ballotreadyResult.responseTime) {
      console.log(`   Response time: ${ballotreadyResult.responseTime}ms`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('TargetSmart API');
  console.log('='.repeat(60));
  if (targetsmartResult.status === 'success') {
    console.log(`✅ Status: ${targetsmartResult.message}`);
    console.log(`   Response time: ${targetsmartResult.responseTime}ms`);
    if (targetsmartResult.sampleData) {
      const sample = targetsmartResult.sampleData as Record<string, unknown>;
      console.log(`   State: ${sample.state}`);
      console.log(`   State House District: ${sample.stateHouseDistrict ?? 'N/A'}`);
      console.log(`   State Senate District: ${sample.stateSenateDistrict ?? 'N/A'}`);
    }
  } else {
    console.log(`❌ Status: ERROR`);
    console.log(`   Message: ${targetsmartResult.message}`);
    if (targetsmartResult.responseTime) {
      console.log(`   Response time: ${targetsmartResult.responseTime}ms`);
    }
  }

  // Print JSON output
  console.log('\n' + '='.repeat(60));
  console.log('JSON Output');
  console.log('='.repeat(60));
  console.log(JSON.stringify(output, null, 2));

  // Exit with appropriate code
  const hasErrors =
    ballotreadyResult.status === 'error' ||
    targetsmartResult.status === 'error';

  if (hasErrors) {
    console.log('\n⚠️  One or more APIs failed verification');
    process.exit(1);
  } else {
    console.log('\n✅ All APIs verified successfully');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
