/**
 * Geocoding Module for SC Election Map Voter Guide (v2)
 *
 * Uses Nominatim (OpenStreetMap) for address → coordinates
 * CORS-enabled, reliable, no API key needed
 */

// Debug mode - enable via localStorage.setItem('voter-guide-debug', 'true')
const DEBUG = typeof window !== 'undefined' && localStorage.getItem('voter-guide-debug') === 'true';

function log(message: string, data?: unknown) {
  if (DEBUG) console.log(`[Geocoding] ${message}`, data || '');
}

export interface GeocodeResult {
  success: boolean;
  lat?: number;
  lon?: number;
  displayName?: string;
  error?: string;
}

// Rate limiting - Nominatim requires max 1 request/second
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1100; // 1.1 seconds to be safe

async function rateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    log(`Rate limiting: waiting ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  lastRequestTime = Date.now();
}

/**
 * Geocode an address using Nominatim (OpenStreetMap)
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const trimmedAddress = address.trim();

  // Input validation
  if (!trimmedAddress) {
    return { success: false, error: 'Please enter an address' };
  }

  // Reject ZIP-only inputs
  const zipOnlyPattern = /^\d{5}(-\d{4})?$/;
  if (zipOnlyPattern.test(trimmedAddress)) {
    return {
      success: false,
      error: 'Please enter a full street address, not just a ZIP code. Example: "123 Main St, Columbia, SC 29201"'
    };
  }

  // Check for South Carolina in the address (add if missing for better results)
  const addressLower = trimmedAddress.toLowerCase();
  const hasSC = addressLower.includes(' sc') || addressLower.includes('south carolina') ||
                addressLower.includes(', sc') || addressLower.includes(',sc');

  let searchAddress = trimmedAddress;
  if (!hasSC) {
    // Append SC if not present (helps with geocoding accuracy)
    searchAddress = `${trimmedAddress}, SC`;
    log('Address missing SC, appending:', searchAddress);
  }

  log('Geocoding address:', searchAddress);

  try {
    // Rate limit before making request
    await rateLimit();

    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', searchAddress);
    url.searchParams.set('format', 'json');
    url.searchParams.set('countrycodes', 'us');
    url.searchParams.set('limit', '1');
    url.searchParams.set('addressdetails', '1');

    log('Nominatim URL:', url.toString());

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'SC-Election-Map-2026/1.0 (https://github.com/russellteter/sc-election-map-2026)'
      }
    });

    if (!response.ok) {
      log('Nominatim error:', { status: response.status, statusText: response.statusText });
      return {
        success: false,
        error: `Geocoding service error: ${response.statusText}. Please try again.`
      };
    }

    const results = await response.json();
    log('Nominatim results:', results);

    if (!results || results.length === 0) {
      return {
        success: false,
        error: 'Address not found. Please check the address and try again. Make sure to include street, city, and state.'
      };
    }

    const result = results[0];
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);

    // Verify it's in South Carolina (rough bounding box check)
    // SC bounds: lat 32.0-35.2, lon -83.4 to -78.5
    if (lat < 32.0 || lat > 35.2 || lon < -83.4 || lon > -78.5) {
      log('Address outside SC bounds:', { lat, lon });
      return {
        success: false,
        error: 'This address does not appear to be in South Carolina. Please enter a South Carolina address.'
      };
    }

    log('Geocoding successful:', { lat, lon, displayName: result.display_name });

    return {
      success: true,
      lat,
      lon,
      displayName: result.display_name
    };

  } catch (error) {
    log('Geocoding exception:', error);

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        success: false,
        error: 'Unable to connect to geocoding service. Please check your internet connection.'
      };
    }

    return {
      success: false,
      error: 'An error occurred while looking up your address. Please try again.'
    };
  }
}
