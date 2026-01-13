/**
 * Census Bureau Geocoder Integration for SC Election Map Voter Guide
 *
 * Uses JSONP to bypass CORS restrictions (Census API doesn't support CORS)
 * Returns state legislative district information for SC addresses
 */

export interface GeocodingResult {
  success: boolean;
  normalizedAddress: string | null;
  houseDistrict: number | null;
  senateDistrict: number | null;
  county: string | null;
  error?: string;
}

// Counter for unique callback names
let jsonpCounter = 0;

/**
 * Lookup an address using the Census Bureau Geocoder with JSONP
 * Returns the SC House and Senate district numbers for the address
 */
export async function lookupAddress(address: string): Promise<GeocodingResult> {
  // Validate address has more than just a ZIP code
  const trimmedAddress = address.trim();
  if (!trimmedAddress) {
    return {
      success: false,
      normalizedAddress: null,
      houseDistrict: null,
      senateDistrict: null,
      county: null,
      error: 'Please enter an address',
    };
  }

  // Check if it's ZIP-only (reject per user requirement)
  const zipOnlyPattern = /^\d{5}(-\d{4})?$/;
  if (zipOnlyPattern.test(trimmedAddress)) {
    return {
      success: false,
      normalizedAddress: null,
      houseDistrict: null,
      senateDistrict: null,
      county: null,
      error: 'Please enter a full street address, not just a ZIP code. Example: "123 Main St, Columbia, SC 29201"',
    };
  }

  return new Promise((resolve) => {
    const callbackName = `censusCallback_${Date.now()}_${jsonpCounter++}`;
    const timeout = 15000; // 15 second timeout

    // Build the Census Geocoder URL with JSONP
    const baseUrl = 'https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress';
    const params = new URLSearchParams({
      address: trimmedAddress,
      benchmark: 'Public_AR_Current',
      vintage: 'Current_Current',
      layers: 'State Legislative Districts - Lower,State Legislative Districts - Upper,Counties',
      format: 'jsonp',
      callback: callbackName,
    });

    const url = `${baseUrl}?${params.toString()}`;

    // Set up timeout
    const timeoutId = setTimeout(() => {
      cleanup();
      resolve({
        success: false,
        normalizedAddress: null,
        houseDistrict: null,
        senateDistrict: null,
        county: null,
        error: 'Request timed out. Please try again.',
      });
    }, timeout);

    // Define the callback function on window
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as unknown as Record<string, unknown>)[callbackName] = (data: CensusApiResponse) => {
      cleanup();
      resolve(parseGeocodingResponse(data));
    };

    // Clean up function
    const cleanup = () => {
      clearTimeout(timeoutId);
      delete (window as unknown as Record<string, unknown>)[callbackName];
      const script = document.getElementById(callbackName);
      if (script) {
        script.remove();
      }
    };

    // Create and inject the script
    const script = document.createElement('script');
    script.id = callbackName;
    script.src = url;
    script.onerror = () => {
      cleanup();
      resolve({
        success: false,
        normalizedAddress: null,
        houseDistrict: null,
        senateDistrict: null,
        county: null,
        error: 'Failed to connect to geocoding service. Please check your internet connection.',
      });
    };

    document.head.appendChild(script);
  });
}

/**
 * Parse the Census API response and extract district information
 */
function parseGeocodingResponse(data: CensusApiResponse): GeocodingResult {
  const matches = data?.result?.addressMatches;

  if (!matches || matches.length === 0) {
    return {
      success: false,
      normalizedAddress: null,
      houseDistrict: null,
      senateDistrict: null,
      county: null,
      error: 'Address not found. Please check the address and try again. Make sure to include city and state.',
    };
  }

  const match = matches[0];
  const geographies = match.geographies || {};

  // Extract House district (State Legislative Districts - Lower)
  const houseLower = geographies['2024 State Legislative Districts - Lower'];
  const houseDistrict = houseLower?.[0]?.SLDL
    ? parseInt(houseLower[0].SLDL, 10)
    : null;

  // Extract Senate district (State Legislative Districts - Upper)
  const senateUpper = geographies['2024 State Legislative Districts - Upper'];
  const senateDistrict = senateUpper?.[0]?.SLDU
    ? parseInt(senateUpper[0].SLDU, 10)
    : null;

  // Extract county
  const counties = geographies['Counties'];
  const county = counties?.[0]?.NAME || null;

  // Build normalized address string
  const addr = match.addressComponents;
  const normalizedAddress = match.matchedAddress ||
    `${addr.fromAddress} ${addr.streetName} ${addr.suffixType}, ${addr.city}, ${addr.state} ${addr.zip}`;

  // Check if we got SC districts
  if (houseDistrict === null && senateDistrict === null) {
    return {
      success: false,
      normalizedAddress,
      houseDistrict: null,
      senateDistrict: null,
      county,
      error: 'This address does not appear to be in South Carolina, or district data is unavailable.',
    };
  }

  return {
    success: true,
    normalizedAddress,
    houseDistrict,
    senateDistrict,
    county,
  };
}

// Census API Response Types
interface CensusApiResponse {
  result?: {
    addressMatches?: AddressMatch[];
  };
}

interface AddressMatch {
  matchedAddress: string;
  coordinates: { x: number; y: number };
  addressComponents: {
    fromAddress: string;
    streetName: string;
    suffixType: string;
    city: string;
    state: string;
    zip: string;
  };
  geographies?: {
    '2024 State Legislative Districts - Lower'?: Array<{ SLDL: string }>;
    '2024 State Legislative Districts - Upper'?: Array<{ SLDU: string }>;
    'Counties'?: Array<{ NAME: string }>;
  };
}
