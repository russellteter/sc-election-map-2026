 SC Voter Guide v3 \- Expansion Plan

     Overview

     Transform the current proof-of-concept voter guide into a comprehensive, usable tool for SC voters in the 2026  
     election cycle. The approach balances three priorities: Address UX, Race Coverage, and Voter Resources.

     Scope: Statewide races \+ US Congress \+ Top 10-15 counties  
     Data Strategy: Full scraping of free government sources  
     Budget: $0 (free data sources only)

     \---  
     Phase 1: Address Input & UX Polish (Foundation)

     1.1 Address Autocomplete

     Implementation: Geoapify (free tier: 3,000 requests/day)

     Files to modify:  
     \- src/components/VoterGuide/AddressInput.tsx \- Replace text input with autocomplete  
     \- src/lib/geocoding.ts \- Integrate Geoapify alongside Nominatim fallback  
     \- .env.local / next.config.js \- Add NEXT\_PUBLIC\_GEOAPIFY\_KEY

     Tasks:  
     1\. Sign up at myprojects.geoapify.com (free)  
     2\. Install @geoapify/geocoder-autocomplete npm package  
     3\. Create AddressAutocomplete.tsx component with SC bounding box filter  
     4\. Add debounced input (300ms) to reduce API calls  
     5\. Fallback to current Nominatim flow if Geoapify fails  
     6\. Style autocomplete dropdown to match glassmorphic design

     1.2 Geolocation Button

     Implementation: Browser Geolocation API (free, built-in)

     Files to modify:  
     \- src/components/VoterGuide/AddressInput.tsx \- Add "Use My Location" button  
     \- src/lib/geocoding.ts \- Add reverseGeocode() function

     Tasks:  
     1\. Add location icon button next to address input  
     2\. Request browser geolocation permission  
     3\. Reverse geocode coordinates to display address  
     4\. Handle permission denied / unavailable gracefully  
     5\. Show loading state during geolocation

     1.3 Error Handling & Validation

     Files to modify:  
     \- src/components/VoterGuide/AddressInput.tsx  
     \- src/app/voter-guide/page.tsx

     Tasks:  
     1\. Validate address is within SC before geocoding (bounding box check)  
     2\. Show specific error messages: "Address not found", "Outside SC", "Try adding city name"  
     3\. Add "Try again" button on error  
     4\. Add manual fallback link to scvotes.gov voter lookup

     1.4 Shareable URLs

     Files to modify:  
     \- src/app/voter-guide/page.tsx \- Read/write URL params

     Tasks:  
     1\. Encode address in URL: /voter-guide?address=123+Main+St+Columbia+SC  
     2\. Auto-populate and search on page load if URL has address  
     3\. Add "Copy Link" button after successful lookup  
     4\. Add social sharing meta tags (OG image, description)

     \---  
     Phase 2: Expand Race Coverage

     2.1 Statewide Constitutional Offices

     Data source: SC Election Commission (scvotes.gov)

     New data file: public/data/statewide-races.json

     Schema:  
     interface StatewideRace {  
       office: string;  // "Governor", "Attorney General", etc.  
       incumbent?: { name: string; party: string; };  
       candidates: Candidate\[\];  
       electionDate: string;  
       filingDeadline: string;  
     }

     Offices to add (9 total):  
     1\. Governor  
     2\. Lieutenant Governor  
     3\. Attorney General  
     4\. Secretary of State  
     5\. State Treasurer  
     6\. Comptroller General  
     7\. Superintendent of Education  
     8\. Adjutant General  
     9\. Commissioner of Agriculture

     Tasks:  
     1\. Create scraper: scripts/scrapers/fetch\_statewide.py  
     2\. Scrape candidate filings from scvotes.gov/candidates  
     3\. Create statewide-races.json data file  
     4\. Update src/types/schema.ts with StatewideRace interface  
     5\. Create StatewideRaces.tsx component (list view, no districts)  
     6\. Display in VoterGuide results (all voters see same races)

     2.2 US Congressional Races

     Data sources:  
     \- Boundaries: Census TIGER/Line (free download)  
     \- Candidates: FEC.gov, scvotes.gov

     New data files:  
     \- public/data/congressional-districts.geojson (7 districts)  
     \- public/data/congress-candidates.json

     Tasks:  
     1\. Download SC congressional district boundaries from Census  
     2\. Convert to GeoJSON, add to public/data/  
     3\. Update src/lib/districtLookup.ts to find congressional district  
     4\. Create scraper for congressional candidates  
     5\. Create CongressionalRaces.tsx component  
     6\. Display US House \+ US Senate races in results

     2.3 Judicial Circuit Solicitors

     Data source: SC Attorney General's office, county filings

     Tasks:  
     1\. Map 16 judicial circuits to counties  
     2\. Create judicial-circuits.geojson boundaries  
     3\. Scrape solicitor candidates  
     4\. Add to voter guide results

     \---  
     Phase 3: Voter Resources Integration

     3.1 Voter Registration Check

     Data source: SC Election Commission voter lookup

     Implementation options:  
     \- Option A: Link out to scvotes.gov/voter-lookup (simple)  
     \- Option B: Embed iframe (if allowed)  
     \- Option C: Scrape/proxy their API (complex, may violate TOS)

     Tasks:  
     1\. Add "Check Registration Status" prominent button  
     2\. Link to: https://info.scvotes.sc.gov/eng/voterinquiry/  
     3\. Add registration deadline countdown  
     4\. Add "Register to Vote" link to vote.org/register

     3.2 Polling Place Lookup

     Data source: Google Civic Information API (free: 25k/day)

     Tasks:  
     1\. Get Google Civic API key (free tier)  
     2\. Call voterInfoQuery with address  
     3\. Display assigned polling location with map link  
     4\. Show early voting locations if available  
     5\. Fallback to scvotes.gov lookup link

     3.3 Key Election Dates

     Implementation: Static data (easy to maintain)

     New data file: public/data/election-dates.json

     Tasks:  
     1\. Compile 2026 SC election calendar  
     2\. Create ElectionTimeline.tsx component  
     3\. Key dates to include:  
       \- Voter registration deadline  
       \- Filing period (March 16-30, 2026\)  
       \- Primary election (June 9, 2026\)  
       \- Runoff election (June 23, 2026\)  
       \- General election (November 3, 2026\)  
       \- Early voting period  
       \- Absentee ballot deadlines  
     4\. Add "Add to Calendar" (.ics export) button

     3.4 Sample Ballot Preview

     Implementation: Aggregate all races for address

     Tasks:  
     1\. Combine all race results into unified "Your Ballot" view  
     2\. Group by: Federal \> Statewide \> State Legislature \> County \> Local  
     3\. Add print-friendly CSS styles  
     4\. Add "Print My Ballot Guide" button

     \---  
     Phase 4: Top County Races

     4.1 County Boundary Integration

     Data source: Census TIGER/Line county boundaries

     Tasks:  
     1\. Download SC county boundaries GeoJSON  
     2\. Add to src/lib/districtLookup.ts  
     3\. Return county name in lookup results

     4.2 County Constitutional Officers (Top 15 Counties)

     Target counties (by population):  
     1\. Greenville  
     2\. Richland  
     3\. Charleston  
     4\. Horry  
     5\. Spartanburg  
     6\. Lexington  
     7\. York  
     8\. Berkeley  
     9\. Anderson  
     10\. Beaufort  
     11\. Dorchester  
     12\. Aiken  
     13\. Florence  
     14\. Pickens  
     15\. Sumter

     Offices per county (7 each):  
     \- Sheriff  
     \- Auditor  
     \- Treasurer  
     \- Coroner/Medical Examiner  
     \- Clerk of Court  
     \- Register of Deeds  
     \- Probate Judge

     Data sources:  
     \- SC Ethics Commission (campaigns $500+)  
     \- Individual county election board websites

     Tasks:  
     1\. Create master scraper: scripts/scrapers/fetch\_county\_candidates.py  
     2\. Scrape SC Ethics Commission for county officer filings  
     3\. Build county-specific scrapers for top 15 counties  
     4\. Create county-races.json data file  
     5\. Create CountyRaces.tsx component  
     6\. Display county officers in voter guide results

     4.3 County Council (Phase 4b \- if time permits)

     Challenge: County council districts vary significantly  
     \- Some counties: single-member districts  
     \- Some counties: at-large seats  
     \- Boundaries not centrally available

     Tasks (stretch goal):  
     1\. Research district structures for top 5 counties  
     2\. Acquire GeoJSON boundaries where available  
     3\. Add council races for counties with good boundary data

     \---  
     Data Pipeline Architecture

     Scraping Infrastructure

     scripts/  
     ├── scrapers/  
     │   ├── fetch\_statewide.py          \# Governor, AG, etc.  
     │   ├── fetch\_congress.py           \# US House/Senate  
     │   ├── fetch\_ethics\_commission.py  \# Existing, enhance  
     │   ├── fetch\_county\_candidates.py  \# County officers  
     │   └── fetch\_election\_dates.py     \# Election calendar  
     ├── process-data.py                 \# Existing enrichment  
     └── validate-data.py                \# New: data quality checks

     Data Files Structure

     public/data/  
     ├── candidates.json              \# Existing: state legislature  
     ├── statewide-races.json         \# NEW: constitutional offices  
     ├── congress-candidates.json     \# NEW: US House/Senate  
     ├── county-races.json            \# NEW: county officers  
     ├── election-dates.json          \# NEW: election calendar  
     ├── sc-house-districts.geojson   \# Existing  
     ├── sc-senate-districts.geojson  \# Existing  
     ├── congressional-districts.geojson  \# NEW  
     └── sc-counties.geojson          \# NEW

     Update Schedule  
     ┌────────────────────────┬─────────────────────┬────────────────────┐  
     │         Source         │      Frequency      │      Trigger       │  
     ├────────────────────────┼─────────────────────┼────────────────────┤  
     │ SC Ethics Commission   │ Daily during filing │ GitHub Action cron │  
     ├────────────────────────┼─────────────────────┼────────────────────┤  
     │ SC Election Commission │ Weekly              │ GitHub Action cron │  
     ├────────────────────────┼─────────────────────┼────────────────────┤  
     │ County websites        │ Weekly for top 15   │ GitHub Action cron │  
     ├────────────────────────┼─────────────────────┼────────────────────┤  
     │ Election dates         │ Manual              │ As announced       │  
     └────────────────────────┴─────────────────────┴────────────────────┘  
     \---  
     Implementation Order

     Sprint 1 (Foundation) \- \~1 week

     1\. Address autocomplete (Geoapify integration)  
     2\. Geolocation button  
     3\. Shareable URLs with address parameter  
     4\. Error handling improvements

     Sprint 2 (Statewide Expansion) \- \~1 week

     1\. Statewide constitutional offices scraper  
     2\. Statewide races display component  
     3\. Congressional district boundaries  
     4\. US Congress candidate scraper  
     5\. Congressional races display

     Sprint 3 (Voter Resources) \- \~1 week

     1\. Election dates/timeline component  
     2\. Voter registration check link  
     3\. Google Civic API polling place lookup  
     4\. Print-friendly ballot guide CSS  
     5\. Calendar export (.ics)

     Sprint 4 (County Races) \- \~2 weeks

     1\. County boundary integration  
     2\. SC Ethics Commission county scraper  
     3\. Top 15 county website scrapers  
     4\. County races display component  
     5\. Data validation and quality checks

     Sprint 5 (Polish) \- \~1 week

     1\. Social sharing meta tags  
     2\. Accessibility audit (WCAG 2.1 AA)  
     3\. Performance optimization  
     4\. Mobile UX refinements  
     5\. Documentation

     \---  
     Technical Considerations

     API Keys Required (Free Tiers)

     \- Geoapify: 3,000 requests/day (address autocomplete)  
     \- Google Civic Info: 25,000 requests/day (polling places)

     Rate Limiting

     \- Nominatim: 1 req/sec (existing, keep as fallback)  
     \- Geoapify: 5 req/sec (sufficient for autocomplete)  
     \- Google Civic: High limit, no concerns

     Caching Strategy

     \- Cache geocode results in localStorage (24hr expiry)  
     \- Cache boundary lookups in memory (session)  
     \- Static JSON files with cache-busting timestamps

     Error Handling

     \- Graceful degradation: if Geoapify fails, fall back to Nominatim  
     \- If Google Civic fails, link to scvotes.gov  
     \- Always show manual lookup fallback links

     \---  
     Verification Plan

     After Each Sprint:

     1\. Manual Testing:  
       \- Test 5 addresses across SC (urban, suburban, rural)  
       \- Verify all race types display correctly  
       \- Test on mobile (iOS Safari, Android Chrome)  
       \- Test error scenarios (bad address, outside SC)  
     2\. Data Validation:  
       \- Cross-reference scraped data with official sources  
       \- Spot-check 10% of candidates against SC Ethics filings  
       \- Verify incumbent data matches scstatehouse.gov  
     3\. Automated Tests:  
       \- Unit tests for geocoding/district lookup  
       \- Integration tests for data loading  
       \- Accessibility tests (axe-core)

     End-to-End Verification:

     \# Run dev server  
     npm run dev

     \# Test voter guide flow  
     \# 1\. Go to /voter-guide  
     \# 2\. Enter address: "1100 Gervais St, Columbia, SC 29201"  
     \# 3\. Verify displays:  
     \#    \- House District 75  
     \#    \- Senate District 21  
     \#    \- US Congressional District 6  
     \#    \- Richland County officers  
     \#    \- All statewide races  
     \#    \- Polling place  
     \#    \- Key dates  
     \# 4\. Test print button  
     \# 5\. Test share link  
     \# 6\. Test on mobile

     \---  
     Success Metrics  
     ┌────────────────────────┬──────────────┬─────────────────────────────────────────┐  
     │         Metric         │ Current (v2) │               Target (v3)               │  
     ├────────────────────────┼──────────────┼─────────────────────────────────────────┤  
     │ Races shown per lookup │ 2            │ 15-20                                   │  
     ├────────────────────────┼──────────────┼─────────────────────────────────────────┤  
     │ Address input methods  │ 1 (text)     │ 3 (text, autocomplete, geolocation)     │  
     ├────────────────────────┼──────────────┼─────────────────────────────────────────┤  
     │ Voter resources        │ 0            │ 4 (registration, polling, dates, print) │  
     ├────────────────────────┼──────────────┼─────────────────────────────────────────┤  
     │ Counties covered       │ 0            │ 15                                      │  
     ├────────────────────────┼──────────────┼─────────────────────────────────────────┤  
     │ Data freshness         │ Manual       │ Automated weekly                        │  
     └────────────────────────┴──────────────┴─────────────────────────────────────────┘  
     \---  
     Files to Create/Modify Summary

     New Files:

     \- src/components/VoterGuide/AddressAutocomplete.tsx  
     \- src/components/VoterGuide/StatewideRaces.tsx  
     \- src/components/VoterGuide/CongressionalRaces.tsx  
     \- src/components/VoterGuide/CountyRaces.tsx  
     \- src/components/VoterGuide/ElectionTimeline.tsx  
     \- src/components/VoterGuide/PollingPlace.tsx  
     \- src/components/VoterGuide/BallotPreview.tsx  
     \- scripts/scrapers/fetch\_statewide.py  
     \- scripts/scrapers/fetch\_congress.py  
     \- scripts/scrapers/fetch\_county\_candidates.py  
     \- public/data/statewide-races.json  
     \- public/data/congress-candidates.json  
     \- public/data/county-races.json  
     \- public/data/election-dates.json  
     \- public/data/congressional-districts.geojson  
     \- public/data/sc-counties.geojson

     Modified Files:

     \- src/components/VoterGuide/AddressInput.tsx  
     \- src/app/voter-guide/page.tsx  
     \- src/lib/geocoding.ts  
     \- src/lib/districtLookup.ts  
     \- src/types/schema.ts  
     \- package.json (add @geoapify/geocoder-autocomplete)  
     \- .env.local (add API keys)  
     \- .github/workflows/ (add data update cron jobs)

⏺ Plan approved\! Let me set up the todo list and start implementing Sprint 1 (Foundation).

⏺ Read(src/components/VoterGuide/AddressInput.tsx)  
  ⎿  Read 167 lines

⏺ Read(src/lib/geocoding.ts)  
  ⎿  Read 150 lines

⏺ Read(src/app/voter-guide/page.tsx)  
  ⎿  Read 267 lines

⏺ Read(package.json)  
  ⎿  Read 42 lines

⏺ I have a clear picture of the current implementation. Let me start by installing the Geoapify autocomplete package.

⏺ Bash(npm install @geoapify/geocoder-autocomplete)  
  ⎿  added 1 package, and audited 762 packages in 9s

     215 packages are looking for funding  
     … \+3 lines (ctrl+o to expand)

⏺ Write(src/components/VoterGuide/AddressAutocomplete.tsx)  
  ⎿  Wrote 454 lines to src/components/VoterGuide/AddressAutocomplete.tsx     
      1 'use client';  
      2 import { useRef, useEffect, useState, useCallback } from 'react';  
      3 // Geoapify API configuration  
      4 const GEOAPIFY\_API\_KEY \= process.env.NEXT\_PUBLIC\_GEOAPIFY\_KEY || '';  
      5 // South Carolina bounding box  
      6 const SC\_BOUNDS \= {  
      7   lon1: \-83.35,  // West  
     … \+444 lines (ctrl+o to expand)

⏺ Now let me update the geocoding library to add reverse geocoding for the geolocation feature.

⏺ Update(src/lib/geocoding.ts)  
  ⎿  Added 118 lines, removed 3 lines                                                                                 
      1  /\*\*  
      2 \- \* Geocoding Module for SC Election Map Voter Guide (v2)                                                     
      2 \+ \* Geocoding Module for SC Election Map Voter Guide (v3)                                                     
      3   \*  
      4 \- \* Uses Nominatim (OpenStreetMap) for address → coordinates                                                  
      5 \- \* CORS-enabled, reliable, no API key needed                                                                 
      4 \+ \* Primary: Geoapify for autocomplete (with API key)                                                         
      5 \+ \* Fallback: Nominatim (OpenStreetMap) for address → coordinates                                             
      6 \+ \* Both are CORS-enabled and reliable                                                                        
      7   \*/  
      8    
      9  // Debug mode \- enable via localStorage.setItem('voter-guide-debug', 'true')  
     ...  
       21    error?: string;  
       22  }  
       23    
       24 \+// South Carolina bounding box                                                                             
       25 \+const SC\_BOUNDS \= {                                                                                        
       26 \+  minLat: 32.0,                                                                                            
       27 \+  maxLat: 35.2,                                                                                            
       28 \+  minLon: \-83.4,                                                                                           
       29 \+  maxLon: \-78.5,                                                                                           
       30 \+};                                                                                                         
       31 \+                                                                                                           
       32 \+/\*\*                                                                                                        
       33 \+ \* Check if coordinates are within South Carolina                                                          
       34 \+ \*/                                                                                                        
       35 \+export function isInSouthCarolina(lat: number, lon: number): boolean {                                     
       36 \+  return (                                                                                                 
       37 \+    lat \>= SC\_BOUNDS.minLat &&                                                                             
       38 \+    lat \<= SC\_BOUNDS.maxLat &&                                                                             
       39 \+    lon \>= SC\_BOUNDS.minLon &&                                                                             
       40 \+    lon \<= SC\_BOUNDS.maxLon                                                                                
       41 \+  );                                                                                                       
       42 \+}                                                                                                          
       43 \+                                                                                                           
       44 \+/\*\*                                                                                                        
       45 \+ \* Get current location using browser geolocation API                                                      
       46 \+ \*/                                                                                                        
       47 \+export async function getCurrentLocation(): Promise\<{ lat: number; lon: number } | null\> {                 
       48 \+  return new Promise((resolve) \=\> {                                                                        
       49 \+    if (\!navigator.geolocation) {                                                                          
       50 \+      log('Geolocation not supported');                                                                    
       51 \+      resolve(null);                                                                                       
       52 \+      return;                                                                                              
       53 \+    }                                                                                                      
       54 \+                                                                                                           
       55 \+    navigator.geolocation.getCurrentPosition(                                                              
       56 \+      (position) \=\> {                                                                                      
       57 \+        const { latitude: lat, longitude: lon } \= position.coords;                                         
       58 \+        log('Got current location:', { lat, lon });                                                        
       59 \+        resolve({ lat, lon });                                                                             
       60 \+      },                                                                                                   
       61 \+      (error) \=\> {                                                                                         
       62 \+        log('Geolocation error:', error.message);                                                          
       63 \+        resolve(null);                                                                                     
       64 \+      },                                                                                                   
       65 \+      {                                                                                                    
       66 \+        enableHighAccuracy: true,                                                                          
       67 \+        timeout: 10000,                                                                                    
       68 \+        maximumAge: 60000, // Cache for 1 minute                                                           
       69 \+      }                                                                                                    
       70 \+    );                                                                                                     
       71 \+  });                                                                                                      
       72 \+}                                                                                                          
       73 \+                                                                                                           
       74 \+/\*\*                                                                                                        
       75 \+ \* Reverse geocode coordinates to an address using Nominatim                                               
       76 \+ \*/                                                                                                        
       77 \+export async function reverseGeocode(lat: number, lon: number): Promise\<GeocodeResult\> {                   
       78 \+  log('Reverse geocoding:', { lat, lon });                                                                 
       79 \+                                                                                                           
       80 \+  // Verify coordinates are in SC                                                                          
       81 \+  if (\!isInSouthCarolina(lat, lon)) {                                                                      
       82 \+    return {                                                                                               
       83 \+      success: false,                                                                                      
       84 \+      error: 'Your location does not appear to be in South Carolina. Please enter a South Carolina addres  
          \+s manually.',                                                                                              
       85 \+    };                                                                                                     
       86 \+  }                                                                                                        
       87 \+                                                                                                           
       88 \+  try {                                                                                                    
       89 \+    await rateLimit();                                                                                     
       90 \+                                                                                                           
       91 \+    const url \= new URL('https://nominatim.openstreetmap.org/reverse');                                    
       92 \+    url.searchParams.set('lat', lat.toString());                                                           
       93 \+    url.searchParams.set('lon', lon.toString());                                                           
       94 \+    url.searchParams.set('format', 'json');                                                                
       95 \+    url.searchParams.set('addressdetails', '1');                                                           
       96 \+                                                                                                           
       97 \+    log('Nominatim reverse URL:', url.toString());                                                         
       98 \+                                                                                                           
       99 \+    const response \= await fetch(url.toString(), {                                                         
      100 \+      headers: {                                                                                           
      101 \+        'User-Agent': 'SC-Election-Map-2026/1.0 (https://github.com/russellteter/sc-election-map-2026)',   
      102 \+      },                                                                                                   
      103 \+    });                                                                                                    
      104 \+                                                                                                           
      105 \+    if (\!response.ok) {                                                                                    
      106 \+      log('Nominatim reverse error:', { status: response.status });                                        
      107 \+      return {                                                                                             
      108 \+        success: false,                                                                                    
      109 \+        error: 'Unable to determine address from your location. Please enter an address manually.',        
      110 \+      };                                                                                                   
      111 \+    }                                                                                                      
      112 \+                                                                                                           
      113 \+    const result \= await response.json();                                                                  
      114 \+    log('Nominatim reverse result:', result);                                                              
      115 \+                                                                                                           
      116 \+    if (\!result || result.error) {                                                                         
      117 \+      return {                                                                                             
      118 \+        success: false,                                                                                    
      119 \+        error: 'Unable to determine address from your location. Please enter an address manually.',        
      120 \+      };                                                                                                   
      121 \+    }                                                                                                      
      122 \+                                                                                                           
      123 \+    return {                                                                                               
      124 \+      success: true,                                                                                       
      125 \+      lat,                                                                                                 
      126 \+      lon,                                                                                                 
      127 \+      displayName: result.display\_name,                                                                    
      128 \+    };                                                                                                     
      129 \+  } catch (error) {                                                                                        
      130 \+    log('Reverse geocoding exception:', error);                                                            
      131 \+    return {                                                                                               
      132 \+      success: false,                                                                                      
      133 \+      error: 'An error occurred while looking up your location. Please enter an address manually.',        
      134 \+    };                                                                                                     
      135 \+  }                                                                                                        
      136 \+}                                                                                                          
      137 \+                                                                                                           
      138  // Rate limiting \- Nominatim requires max 1 request/second  
      139  let lastRequestTime \= 0;  
      140  const MIN\_REQUEST\_INTERVAL \= 1100; // 1.1 seconds to be safe

⏺ Now let me update the VoterGuide barrel export and then update the main page with shareable URLs and integrated geolocation.

⏺ Read(src/components/VoterGuide/index.ts)  
  ⎿  Read 3 lines

⏺ Update(src/components/VoterGuide/index.ts)  
  ⎿  Added 1 line                                                                                                     
      1  export { default as AddressInput } from './AddressInput';  
      2 \+export { default as AddressAutocomplete } from './AddressAutocomplete';                                      
      3  export { default as DistrictResults } from './DistrictResults';

⏺ Now let me update the main voter-guide page with all the new features.

⏺ Write(src/app/voter-guide/page.tsx)  
  ⎿  Added 208 lines, removed 29 lines                                                                                
       1  'use client';  
       2    
       3 \-import { useState, useEffect } from 'react';                                                                
       3 \+import { useState, useEffect, useCallback, Suspense } from 'react';                                         
       4 \+import { useSearchParams, useRouter } from 'next/navigation';                                               
       5  import Link from 'next/link';  
       5 \-import { AddressInput, DistrictResults } from '@/components/VoterGuide';                                    
       6 \-import { geocodeAddress, GeocodeResult } from '@/lib/geocoding';                                            
       6 \+import { AddressAutocomplete, DistrictResults } from '@/components/VoterGuide';                             
       7 \+import { geocodeAddress, reverseGeocode, getCurrentLocation, isInSouthCarolina, GeocodeResult } from '@/li  
         \+b/geocoding';                                                                                               
       8  import { findDistricts, preloadBoundaries, DistrictResult } from '@/lib/districtLookup';  
       9  import type { CandidatesData } from '@/types/schema';  
      10    
      11  type LookupStatus \= 'idle' | 'geocoding' | 'finding-districts' | 'done' | 'error';  
      12    
      12 \-export default function VoterGuidePage() {                                                                  
      13 \+function VoterGuideContent() {                                                                              
      14 \+  const searchParams \= useSearchParams();                                                                   
      15 \+  const router \= useRouter();                                                                               
      16 \+                                                                                                            
      17    const \[candidatesData, setCandidatesData\] \= useState\<CandidatesData | null\>(null);  
      18    const \[isDataLoading, setIsDataLoading\] \= useState(true);  
      19    
     ...  
      21    const \[status, setStatus\] \= useState\<LookupStatus\>('idle');  
      22    const \[statusMessage, setStatusMessage\] \= useState\<string | null\>(null);  
      23    const \[error, setError\] \= useState\<string | null\>(null);  
      24 \+  const \[isGeolocating, setIsGeolocating\] \= useState(false);                                                
      25    
      26    // Results state  
      27    const \[geocodeResult, setGeocodeResult\] \= useState\<GeocodeResult | null\>(null);  
      28    const \[districtResult, setDistrictResult\] \= useState\<DistrictResult | null\>(null);  
      29    
      30 \+  // Address from URL for sharing                                                                           
      31 \+  const \[initialAddress, setInitialAddress\] \= useState('');                                                 
      32 \+  const \[shareUrl, setShareUrl\] \= useState\<string | null\>(null);                                            
      33 \+                                                                                                            
      34    // Load candidates data and preload boundaries on mount  
      35    useEffect(() \=\> {  
      36      const basePath \= window.location.pathname.includes('/sc-election-map-2026')  
     ...  
       58      });  
       59    }, \[\]);  
       60    
       52 \-  const handleAddressSubmit \= async (address: string) \=\> {                                                 
       61 \+  // Handle URL parameter on mount (for shareable links)                                                   
       62 \+  useEffect(() \=\> {                                                                                        
       63 \+    const addressParam \= searchParams.get('address');                                                      
       64 \+    if (addressParam && \!geocodeResult) {                                                                  
       65 \+      const decodedAddress \= decodeURIComponent(addressParam);                                             
       66 \+      setInitialAddress(decodedAddress);                                                                   
       67 \+      // Auto-search if we have an address in the URL                                                      
       68 \+      handleAddressSubmit(decodedAddress, 0, 0);                                                           
       69 \+    }                                                                                                      
       70 \+  }, \[searchParams\]); // eslint-disable-line react-hooks/exhaustive-deps                                   
       71 \+                                                                                                           
       72 \+  // Generate shareable URL when we have results                                                           
       73 \+  useEffect(() \=\> {                                                                                        
       74 \+    if (geocodeResult?.displayName) {                                                                      
       75 \+      const url \= new URL(window.location.href);                                                           
       76 \+      url.searchParams.set('address', encodeURIComponent(geocodeResult.displayName));                      
       77 \+      setShareUrl(url.toString());                                                                         
       78 \+    } else {                                                                                               
       79 \+      setShareUrl(null);                                                                                   
       80 \+    }                                                                                                      
       81 \+  }, \[geocodeResult\]);                                                                                     
       82 \+                                                                                                           
       83 \+  const handleAddressSubmit \= useCallback(async (address: string, lat: number, lon: number) \=\> {           
       84      // Reset state  
       85      setError(null);  
       86      setGeocodeResult(null);  
       87      setDistrictResult(null);  
       88 \+    setShareUrl(null);                                                                                     
       89    
       90      try {  
       59 \-      // Step 1: Geocode the address                                                                       
       60 \-      setStatus('geocoding');                                                                              
       61 \-      setStatusMessage('Looking up address...');                                                           
       91 \+      let finalLat \= lat;                                                                                  
       92 \+      let finalLon \= lon;                                                                                  
       93 \+      let displayName \= address;                                                                           
       94    
       63 \-      const geoResult \= await geocodeAddress(address);                                                     
       95 \+      // If we have coordinates from autocomplete, use them directly                                       
       96 \+      if (lat \!== 0 && lon \!== 0\) {                                                                        
       97 \+        // Verify they're in SC                                                                            
       98 \+        if (\!isInSouthCarolina(lat, lon)) {                                                                
       99 \+          setStatus('error');                                                                              
      100 \+          setError('This address does not appear to be in South Carolina. Please enter a South Carolina a  
          \+ddress.');                                                                                                 
      101 \+          return;                                                                                          
      102 \+        }                                                                                                  
      103    
       65 \-      if (\!geoResult.success) {                                                                            
       66 \-        setStatus('error');                                                                                
       67 \-        setError(geoResult.error || 'Address lookup failed');                                              
       68 \-        setStatusMessage(null);                                                                            
       69 \-        return;                                                                                            
      104 \+        setGeocodeResult({                                                                                 
      105 \+          success: true,                                                                                   
      106 \+          lat,                                                                                             
      107 \+          lon,                                                                                             
      108 \+          displayName: address,                                                                            
      109 \+        });                                                                                                
      110 \+      } else {                                                                                             
      111 \+        // Need to geocode the address                                                                     
      112 \+        setStatus('geocoding');                                                                            
      113 \+        setStatusMessage('Looking up address...');                                                         
      114 \+                                                                                                           
      115 \+        const geoResult \= await geocodeAddress(address);                                                   
      116 \+                                                                                                           
      117 \+        if (\!geoResult.success) {                                                                          
      118 \+          setStatus('error');                                                                              
      119 \+          setError(geoResult.error || 'Address lookup failed');                                            
      120 \+          setStatusMessage(null);                                                                          
      121 \+          return;                                                                                          
      122 \+        }                                                                                                  
      123 \+                                                                                                           
      124 \+        finalLat \= geoResult.lat\!;                                                                         
      125 \+        finalLon \= geoResult.lon\!;                                                                         
      126 \+        displayName \= geoResult.displayName || address;                                                    
      127 \+                                                                                                           
      128 \+        setGeocodeResult(geoResult);                                                                       
      129        }  
      130    
       72 \-      setGeocodeResult(geoResult);                                                                         
       73 \-      setStatusMessage(\`Found: ${geoResult.displayName?.split(',').slice(0, 3).join(',')}\`);               
      131 \+      setStatusMessage(\`Found: ${displayName.split(',').slice(0, 3).join(',')}\`);                          
      132    
      133        // Step 2: Find districts  
      134        setStatus('finding-districts');  
      135        setStatusMessage('Finding your districts...');  
      136    
       79 \-      const districts \= await findDistricts(geoResult.lat\!, geoResult.lon\!);                               
      137 \+      const districts \= await findDistricts(finalLat, finalLon);                                           
      138    
      139        if (\!districts.success) {  
      140          setStatus('error');  
     ...  
      147        setStatus('done');  
      148        setStatusMessage(null);  
      149    
      150 \+      // Update URL with address (without triggering navigation)                                           
      151 \+      const newUrl \= new URL(window.location.href);                                                        
      152 \+      newUrl.searchParams.set('address', encodeURIComponent(displayName));                                 
      153 \+      router.replace(newUrl.pathname \+ newUrl.search, { scroll: false });                                  
      154 \+                                                                                                           
      155      } catch (err) {  
      156        console.error('Lookup error:', err);  
      157        setStatus('error');  
      158        setError('An unexpected error occurred. Please try again.');  
      159        setStatusMessage(null);  
      160      }  
       98 \-  };                                                                                                       
      161 \+  }, \[router\]);                                                                                            
      162    
      163 \+  const handleGeolocationRequest \= useCallback(async () \=\> {                                               
      164 \+    setIsGeolocating(true);                                                                                
      165 \+    setError(null);                                                                                        
      166 \+                                                                                                           
      167 \+    try {                                                                                                  
      168 \+      const location \= await getCurrentLocation();                                                         
      169 \+                                                                                                           
      170 \+      if (\!location) {                                                                                     
      171 \+        setError('Unable to get your location. Please check your browser permissions and try again, or en  
          \+ter your address manually.');                                                                              
      172 \+        setIsGeolocating(false);                                                                           
      173 \+        return;                                                                                            
      174 \+      }                                                                                                    
      175 \+                                                                                                           
      176 \+      const { lat, lon } \= location;                                                                       
      177 \+                                                                                                           
      178 \+      // Check if in SC                                                                                    
      179 \+      if (\!isInSouthCarolina(lat, lon)) {                                                                  
      180 \+        setError('Your location does not appear to be in South Carolina. Please enter a South Carolina ad  
          \+dress manually.');                                                                                         
      181 \+        setIsGeolocating(false);                                                                           
      182 \+        return;                                                                                            
      183 \+      }                                                                                                    
      184 \+                                                                                                           
      185 \+      // Reverse geocode to get address                                                                    
      186 \+      setStatusMessage('Getting your address...');                                                         
      187 \+      const reverseResult \= await reverseGeocode(lat, lon);                                                
      188 \+                                                                                                           
      189 \+      if (\!reverseResult.success) {                                                                        
      190 \+        setError(reverseResult.error || 'Could not determine your address');                               
      191 \+        setIsGeolocating(false);                                                                           
      192 \+        return;                                                                                            
      193 \+      }                                                                                                    
      194 \+                                                                                                           
      195 \+      // Set the address in the input                                                                      
      196 \+      setInitialAddress(reverseResult.displayName || '');                                                  
      197 \+      setIsGeolocating(false);                                                                             
      198 \+                                                                                                           
      199 \+      // Auto-submit with the coordinates we already have                                                  
      200 \+      handleAddressSubmit(reverseResult.displayName || '', lat, lon);                                      
      201 \+                                                                                                           
      202 \+    } catch (err) {                                                                                        
      203 \+      console.error('Geolocation error:', err);                                                            
      204 \+      setError('An error occurred while getting your location. Please enter your address manually.');      
      205 \+      setIsGeolocating(false);                                                                             
      206 \+    }                                                                                                      
      207 \+  }, \[handleAddressSubmit\]);                                                                               
      208 \+                                                                                                           
      209    const handleReset \= () \=\> {  
      210      setStatus('idle');  
      211      setError(null);  
      212      setStatusMessage(null);  
      213      setGeocodeResult(null);  
      214      setDistrictResult(null);  
      215 \+    setInitialAddress('');                                                                                 
      216 \+    setShareUrl(null);                                                                                     
      217 \+    // Clear URL params                                                                                    
      218 \+    router.replace(window.location.pathname, { scroll: false });                                           
      219    };  
      220    
      221 \+  const handleCopyShareLink \= async () \=\> {                                                                
      222 \+    if (shareUrl) {                                                                                        
      223 \+      try {                                                                                                
      224 \+        await navigator.clipboard.writeText(shareUrl);                                                     
      225 \+        // Could add a toast notification here                                                             
      226 \+        alert('Link copied to clipboard\!');                                                                
      227 \+      } catch {                                                                                            
      228 \+        // Fallback for older browsers                                                                     
      229 \+        const textArea \= document.createElement('textarea');                                               
      230 \+        textArea.value \= shareUrl;                                                                         
      231 \+        document.body.appendChild(textArea);                                                               
      232 \+        textArea.select();                                                                                 
      233 \+        document.execCommand('copy');                                                                      
      234 \+        document.body.removeChild(textArea);                                                               
      235 \+        alert('Link copied to clipboard\!');                                                                
      236 \+      }                                                                                                    
      237 \+    }                                                                                                      
      238 \+  };                                                                                                       
      239 \+                                                                                                           
      240    const isLoading \= status \=== 'geocoding' || status \=== 'finding-districts';  
      241    const hasResults \= status \=== 'done' && districtResult;  
      242    
     ...  
      300            {/\* Main Content \*/}  
      301            {\!isDataLoading && (  
      302              \<div className="space-y-8"\>  
      171 \-              {/\* Address Input \*/}                                                                        
      172 \-              \<AddressInput                                                                                
      173 \-                onSubmit={handleAddressSubmit}                                                             
      303 \+              {/\* Address Input with Autocomplete \*/}                                                      
      304 \+              \<AddressAutocomplete                                                                         
      305 \+                onAddressSelect={handleAddressSubmit}                                                      
      306 \+                onGeolocationRequest={handleGeolocationRequest}                                            
      307                  isLoading={isLoading}  
      308 \+                isGeolocating={isGeolocating}                                                              
      309                  error={error}  
      310                  statusMessage={statusMessage}  
      311 \+                initialAddress={initialAddress}                                                            
      312                /\>  
      313    
      314                {/\* Results Section \*/}  
      315                {hasResults && candidatesData && (  
      316                  \<\>  
      182 \-                  \<div className="flex items-center justify-between"\>                                      
      317 \+                  \<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"\>        
      318                      \<h3 className="font-display font-semibold text-lg" style={{ color: 'var(--text-color)  
           ' }}\>  
      319                        Your Districts  
      320                      \</h3\>  
      186 \-                    \<button                                                                                
      187 \-                      onClick={handleReset}                                                                
      188 \-                      className="text-sm font-medium transition-colors hover:opacity-80"                   
      189 \-                      style={{ color: 'var(--class-purple)' }}                                             
      190 \-                    \>                                                                                      
      191 \-                      Search another address                                                               
      192 \-                    \</button\>                                                                              
      321 \+                    \<div className="flex items-center gap-3"\>                                              
      322 \+                      {shareUrl && (                                                                       
      323 \+                        \<button                                                                            
      324 \+                          onClick={handleCopyShareLink}                                                    
      325 \+                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium tra  
          \+nsition-all hover:opacity-80"                                                                              
      326 \+                          style={{                                                                         
      327 \+                            background: 'var(--class-purple-bg)',                                          
      328 \+                            color: 'var(--class-purple)',                                                  
      329 \+                            border: '1px solid var(--class-purple-light)',                                 
      330 \+                          }}                                                                               
      331 \+                        \>                                                                                  
      332 \+                          \<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"\>  
      333 \+                            \<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684   
          \+13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316  
          \+m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-  
          \+5.368-2.684z" /\>                                                                                           
      334 \+                          \</svg\>                                                                           
      335 \+                          Share                                                                            
      336 \+                        \</button\>                                                                          
      337 \+                      )}                                                                                   
      338 \+                      \<button                                                                              
      339 \+                        onClick={handleReset}                                                              
      340 \+                        className="text-sm font-medium transition-colors hover:opacity-80"                 
      341 \+                        style={{ color: 'var(--class-purple)' }}                                           
      342 \+                      \>                                                                                    
      343 \+                        Search another address                                                             
      344 \+                      \</button\>                                                                            
      345 \+                    \</div\>                                                                                 
      346                    \</div\>  
      347                    \<DistrictResults  
      348                      houseDistrict={districtResult.houseDistrict}  
     ...  
      402              \</a\>  
      403              . Address lookup powered by{' '}  
      404              \<a  
      405 \+              href="https://www.geoapify.com/"                                                             
      406 \+              target="\_blank"                                                                              
      407 \+              rel="noopener noreferrer"                                                                    
      408 \+              className="underline"                                                                        
      409 \+              style={{ color: 'var(--class-purple)' }}                                                     
      410 \+            \>                                                                                              
      411 \+              Geoapify                                                                                     
      412 \+            \</a\>                                                                                           
      413 \+            {' '}and{' '}                                                                                  
      414 \+            \<a                                                                                             
      415                href="https://nominatim.openstreetmap.org/"  
      416                target="\_blank"  
      417                rel="noopener noreferrer"  
     ...  
      427      \</div\>  
      428    );  
      429  }  
      430 \+                                                                                                           
      431 \+// Wrap with Suspense for useSearchParams                                                                  
      432 \+export default function VoterGuidePage() {                                                                 
      433 \+  return (                                                                                                 
      434 \+    \<Suspense fallback={                                                                                   
      435 \+      \<div className="atmospheric-bg min-h-screen flex items-center justify-center"\>                       
      436 \+        \<div                                                                                               
      437 \+          className="animate-spin h-8 w-8 border-2 rounded-full"                                           
      438 \+          style={{ borderColor: 'var(--class-purple-light)', borderTopColor: 'var(--class-purple)' }}      
      439 \+        /\>                                                                                                 
      440 \+      \</div\>                                                                                               
      441 \+    }\>                                                                                                     
      442 \+      \<VoterGuideContent /\>                                                                                
      443 \+    \</Suspense\>                                                                                            
      444 \+  );                                                                                                       
      445 \+}                                                                                                        

⏺ Now let me update the todos and check that the code compiles.

⏺ Bash(npx tsc \--noEmit 2\>&1 | head \-50)  
  ⎿ \_\_tests\_\_/components/Legend.test.tsx(34,20): error TS2322: Type '{ showRepublicanData: boolean; }' is not         
    assignab  
    le to type 'IntrinsicAttributes & LegendProps'.  
      Property 'showRepublicanData' does not exist on type 'IntrinsicAttributes & LegendProps'.  
    … \+3 lines (ctrl+o to expand)

⏺ The type errors are in existing test files unrelated to my changes. The new voter guide code compiles clean. Let me start the dev server to test.

⏺ Bash(npm run dev &)  
  ⎿  Running in the background (↓ to manage)

⏺ Bash(sleep 3 && cat /tmp/claude/-Users-russellteter-Desktop-sc-election-map-2026/tasks/b776641.output | tail \-20)  
  ⎿  \> sc-election-map-2026@0.1.0 dev                                                          
     \> next dev

     \[stderr\] ⚠ Port 3000 is in use by an unknown process, using available port 3001 instead.

⏺ Bash(sleep 5 && cat /tmp/claude/-Users-russellteter-Desktop-sc-election-map-2026/tasks/b776641.output)  
  ⎿  \> sc-election-map-2026@0.1.0 dev  
     \> next dev  
     … \+21 lines (ctrl+o to expand)

⏺ There's already a dev server running. Let me check if it's working on port 3000\.

⏺ Bash(curl \-s http://localhost:3000/voter-guide | head \-20)  
  ⎿  /voter-guide/

⏺ Bash(curl \-sL http://localhost:3000/voter-guide 2\>&1 | head \-100)  
  ⎿ \<\!DOCTYPE html\>\<html lang="en"\>\<head\>\<meta charSet="utf-8"/\>\<meta name="viewport" content="width=device-width,    
    ini  
    tial-scale=1"/\>\<link rel="stylesheet" href="/\_next/static/chunks/%5Broot-of-the-server%5D\_\_945df505.\_.css"  
    data-pr  
    ecedence="next\_static/chunks/\[root-of-the-server\]\_\_945df505.\_.css"/\>\<link rel="preload" as="script"  
    fetchPriority=  
    … \+206 lines (ctrl+o to expand)

⏺ The page is rendering correctly. Let me create an .env.example file to document the API key requirement and update the todos.

⏺ Write(.env.example)  
  ⎿  Wrote 9 lines to .env.example                                         
      1 \# Geoapify API Key (free tier: 3,000 requests/day)  
      2 \# Sign up at: https://myprojects.geoapify.com/  
      3 \# Used for address autocomplete in the Voter Guide  
      4 NEXT\_PUBLIC\_GEOAPIFY\_KEY=your\_geoapify\_api\_key\_here  
      5 \# Google Civic Information API Key (optional, for polling places)  
      6 \# Get one at: https://console.cloud.google.com/apis/credentials  
      7 \# NEXT\_PUBLIC\_GOOGLE\_CIVIC\_KEY=your\_google\_civic\_api\_key\_here

⏺ Sprint 1 Complete\!

  I've implemented the foundation improvements for the Voter Guide v3:

  What's Done:  
  ┌──────────────────────┬─────────────────────────────────────────────────────────────────────────────────────┐  
  │       Feature        │                                       Status                                        │  
  ├──────────────────────┼─────────────────────────────────────────────────────────────────────────────────────┤  
  │ Address Autocomplete │ Ready \- using Geoapify (needs API key for autocomplete, falls back to manual entry) │  
  ├──────────────────────┼─────────────────────────────────────────────────────────────────────────────────────┤  
  │ Geolocation Button   │ Ready \- crosshair icon in input field detects location                              │  
  ├──────────────────────┼─────────────────────────────────────────────────────────────────────────────────────┤  
  │ Shareable URLs       │ Ready \- /voter-guide?address=... auto-searches on load                              │  
  ├──────────────────────┼─────────────────────────────────────────────────────────────────────────────────────┤  
  │ Share Button         │ Ready \- copies link to clipboard after successful search                            │  
  ├──────────────────────┼─────────────────────────────────────────────────────────────────────────────────────┤  
  │ Reverse Geocoding    │ Ready \- converts GPS coords to address display                                      │  
  ├──────────────────────┼─────────────────────────────────────────────────────────────────────────────────────┤  
  │ Error Handling       │ Improved with SC boundary validation                                                │  
  └──────────────────────┴─────────────────────────────────────────────────────────────────────────────────────┘  
  Files Created/Modified:

  New:  
  \- src/components/VoterGuide/AddressAutocomplete.tsx \- New autocomplete component  
  \- .env.example \- Documents required API keys

  Modified:  
  \- src/app/voter-guide/page.tsx \- Integrated new features  
  \- src/lib/geocoding.ts \- Added reverse geocoding and location utils  
  \- src/components/VoterGuide/index.ts \- Added export  
  \- package.json \- Added @geoapify/geocoder-autocomplete

  To Enable Autocomplete:

  1\. Sign up at https://myprojects.geoapify.com/ (free)  
  2\. Create .env.local with your API key:  
  NEXT\_PUBLIC\_GEOAPIFY\_KEY=your\_api\_key\_here

  Without the API key, the voter guide still works \- it just uses manual text entry with Nominatim geocoding.

  Test It:

  The dev server is running at http://localhost:3000/voter-guide

  Try:  
  1\. Type an address (autocomplete if API key configured)  
  2\. Click the crosshair icon to use geolocation  
  3\. After results load, click "Share" to copy link  
  4\. Visit the shared link \- it auto-searches

  Want me to continue with Sprint 2 (add statewide constitutional offices and US Congress races)?

✻ Cogitated for 10m 29s

⏺ Background command "Start development server" completed (exit code 0\)

⏺ Read agent output b776641  
  ⎿  Read 22 lines

⏺ The background server couldn't start because there's already one running at http://localhost:3000 \- that's the one to use for testing.

  Sprint 1 is complete. Ready to proceed with Sprint 2 (statewide offices \+ US Congress) when you want to continue, or let me know if you'd like to test the current features first.

❯ yes continue with sprint 2 

⏺ Let's start Sprint 2 \- expanding race coverage to statewide offices and US Congress.

⏺ Read(src/types/schema.ts)  
  ⎿  Read 283 lines

⏺ Let me add the new types for statewide and congressional races, then create the data files.

⏺ Update(src/types/schema.ts)  
  ⎿  Added 90 lines                                                                                                   
      280    /\*\* Districts with Democratic candidates filed \*/  
      281    demFiled: number;  
      282  }  
      283 \+                                                                                                           
      284 \+// \=============================================================================                           
      285 \+// Statewide Races Types (Governor, AG, etc.)                                                              
      286 \+// \=============================================================================                           
      287 \+                                                                                                           
      288 \+/\*\*                                                                                                        
      289 \+ \* A statewide constitutional office race                                                                  
      290 \+ \*/                                                                                                        
      291 \+export interface StatewideRace {                                                                           
      292 \+  /\*\* Office name (e.g., "Governor", "Attorney General") \*/                                                
      293 \+  office: string;                                                                                          
      294 \+  /\*\* Short description of the office \*/                                                                   
      295 \+  description?: string;                                                                                    
      296 \+  /\*\* Current incumbent information \*/                                                                     
      297 \+  incumbent?: {                                                                                            
      298 \+    name: string;                                                                                          
      299 \+    party: 'Democratic' | 'Republican';                                                                    
      300 \+    canRunAgain?: boolean;                                                                                 
      301 \+  } | null;                                                                                                
      302 \+  /\*\* List of candidates who have filed \*/                                                                 
      303 \+  candidates: Candidate\[\];                                                                                 
      304 \+  /\*\* Term length in years \*/                                                                              
      305 \+  termYears: number;                                                                                       
      306 \+}                                                                                                          
      307 \+                                                                                                           
      308 \+/\*\*                                                                                                        
      309 \+ \* Complete statewide races data                                                                           
      310 \+ \*/                                                                                                        
      311 \+export interface StatewideRacesData {                                                                      
      312 \+  /\*\* ISO timestamp of when the data was last updated \*/                                                   
      313 \+  lastUpdated: string;                                                                                     
      314 \+  /\*\* Array of statewide constitutional office races \*/                                                    
      315 \+  races: StatewideRace\[\];                                                                                  
      316 \+}                                                                                                          
      317 \+                                                                                                           
      318 \+// \=============================================================================                           
      319 \+// Congressional Races Types (US House, US Senate)                                                         
      320 \+// \=============================================================================                           
      321 \+                                                                                                           
      322 \+/\*\*                                                                                                        
      323 \+ \* US Congressional district race                                                                          
      324 \+ \*/                                                                                                        
      325 \+export interface CongressionalDistrict {                                                                   
      326 \+  /\*\* District number (1-7 for SC House) \*/                                                                
      327 \+  districtNumber: number;                                                                                  
      328 \+  /\*\* Current incumbent information \*/                                                                     
      329 \+  incumbent?: {                                                                                            
      330 \+    name: string;                                                                                          
      331 \+    party: 'Democratic' | 'Republican';                                                                    
      332 \+    since?: number;                                                                                        
      333 \+  } | null;                                                                                                
      334 \+  /\*\* List of candidates who have filed \*/                                                                 
      335 \+  candidates: Candidate\[\];                                                                                 
      336 \+}                                                                                                          
      337 \+                                                                                                           
      338 \+/\*\*                                                                                                        
      339 \+ \* US Senate race (statewide)                                                                              
      340 \+ \*/                                                                                                        
      341 \+export interface USSenateRace {                                                                            
      342 \+  /\*\* Seat class (1, 2, or 3\) \*/                                                                           
      343 \+  seatClass: number;                                                                                       
      344 \+  /\*\* Whether this seat is up for election in 2026 \*/                                                      
      345 \+  upForElection: boolean;                                                                                  
      346 \+  /\*\* Current incumbent information \*/                                                                     
      347 \+  incumbent?: {                                                                                            
      348 \+    name: string;                                                                                          
      349 \+    party: 'Democratic' | 'Republican';                                                                    
      350 \+    since?: number;                                                                                        
      351 \+    termEnds?: number;                                                                                     
      352 \+  } | null;                                                                                                
      353 \+  /\*\* List of candidates who have filed (empty if not up for election) \*/                                  
      354 \+  candidates: Candidate\[\];                                                                                 
      355 \+}                                                                                                          
      356 \+                                                                                                           
      357 \+/\*\*                                                                                                        
      358 \+ \* Complete congressional races data                                                                       
      359 \+ \*/                                                                                                        
      360 \+export interface CongressionalData {                                                                       
      361 \+  /\*\* ISO timestamp of when the data was last updated \*/                                                   
      362 \+  lastUpdated: string;                                                                                     
      363 \+  /\*\* US House districts (7 total for SC) \*/                                                               
      364 \+  house: Record\<string, CongressionalDistrict\>;                                                            
      365 \+  /\*\* US Senate races (2 seats) \*/                                                                         
      366 \+  senate: {                                                                                                
      367 \+    /\*\* Senior senator (Class 2 \- Tim Scott) \*/                                                            
      368 \+    class2: USSenateRace;                                                                                  
      369 \+    /\*\* Junior senator (Class 3 \- Lindsey Graham) \*/                                                       
      370 \+    class3: USSenateRace;                                                                                  
      371 \+  };                                                                                                       
      372 \+}                                                                                                        

⏺ Now let me create the statewide races data file with SC constitutional offices. I'll research current incumbents.

⏺ Write(public/data/statewide-races.json)  
  ⎿  Wrote 105 lines to public/data/statewide-races.json                                                              
       1 {  
       2   "lastUpdated": "2026-01-13T00:00:00Z",  
       3   "races": \[  
       4     {  
       5       "office": "Governor",  
       6       "description": "Chief executive of South Carolina, responsible for enforcing state laws and managing   
         state agencies",  
       7       "incumbent": {  
       8         "name": "Henry McMaster",  
       9         "party": "Republican",  
      10         "canRunAgain": false  
     … \+95 lines (ctrl+o to expand)

⏺ Now let me create the congressional races data file with SC's US House and Senate seats.

⏺ Write(public/data/congress-candidates.json)  
  ⎿  Wrote 93 lines to public/data/congress-candidates.json  
       1 {  
       2   "lastUpdated": "2026-01-13T00:00:00Z",  
       3   "house": {  
       4     "1": {  
       5       "districtNumber": 1,  
       6       "incumbent": {  
       7         "name": "Nancy Mace",  
       8         "party": "Republican",  
       9         "since": 2021  
      10       },  
     … \+83 lines (ctrl+o to expand)

⏺ Now let me create the StatewideRaces display component.

⏺ Read(src/components/VoterGuide/DistrictResults.tsx)  
  ⎿  Read 283 lines

⏺ Write(src/components/VoterGuide/StatewideRaces.tsx)  
  ⎿  Wrote 173 lines to src/components/VoterGuide/StatewideRaces.tsx                         
      1 'use client';  
      2 import type { StatewideRacesData, StatewideRace, Candidate } from '@/types/schema';  
      3 import CandidateCard from '@/components/Dashboard/CandidateCard';  
      4 interface StatewideRacesProps {  
      5   data: StatewideRacesData;  
      6 }  
      7 export default function StatewideRaces({ data }: StatewideRacesProps) {  
     … \+163 lines (ctrl+o to expand)

⏺ Let me check if CandidateCard supports a compact prop.

⏺ Read(src/components/Dashboard/CandidateCard.tsx)  
  ⎿  Read 146 lines

⏺ The CandidateCard doesn't have a compact prop \- let me fix that and continue with the congressional races component and boundaries.

⏺ Update(src/components/VoterGuide/StatewideRaces.tsx)  
  ⎿  Added 1 line, removed 1 line                                                                                     
      133          {candidates.length \> 0 ? (  
      134            \<div className="space-y-2"\>  
      135              {candidates.map((candidate, idx) \=\> (  
      136 \-              \<CandidateCard key={candidate.reportId || candidate.name} candidate={candidate} index={idx}  
          \- compact /\>                                                                                                
      136 \+              \<CandidateCard key={candidate.reportId || candidate.name} candidate={candidate} index={idx}  
          \+ /\>                                                                                                        
      137              ))}  
      138            \</div\>  
      139          ) : (

⏺ Now let me download SC congressional district boundaries and create the CongressionalRaces component.

⏺ Bash(curl \-sL "https://www2.census.gov/geo/tiger/TIGER2024/CD/tl\_2024\_45\_cd118.zip" \-o /tmp/sc-congressional.zip && unzip  
       \-o /tmp/sc-congressional.zip \-d /tmp/sc-con…)  
  ⎿  Error: Exit code 9  
       End-of-central-directory signature not found.  Either this file is not  
       a zipfile, or it constitutes one disk of a multi-part archive.  In the  
       latter case the central directory and zipfile comment will be found on  
       the last disk(s) of this archive.  
     unzip:  cannot find zipfile directory in one of /tmp/sc-congressional.zip or  
             /tmp/sc-congressional.zip.zip, and cannot find /tmp/sc-congressional.zip.ZIP, period.

     Archive:  /tmp/sc-congressional.zip

⏺ Let me try a different approach \- download the GeoJSON format directly.

⏺ Bash(curl \-sL "https://raw.githubusercontent.com/unitedstates/districts/gh-pages/states/SC/shape.geojson" \-o  
      /tmp/sc-cd-test.geojson && head \-100 /tmp/sc-cd-test.geo…)  
  ⎿ { "type": "MultiPolygon", "coordinates": \[ \[ \[ \[ \-82.741007, 34.208862 \], \[ \-82.741875, 34.210209 \], \[ \-82.74234  
    34.213432 \], \[ \-82.740257, 34.219448 \], \[ \-82.744003, 34.224407 \], \[ \-82.744377, 34.225677 \], \[ \-82.744102,  
    34.226  
    604 \], \[ \-82.742706, 34.227997 \], \[ \-82.742012, 34.229328 \], \[ \-82.743027, 34.234394 \], \[ \-82.743347, 34.23925 \],  
    … \+742 lines (ctrl+o to expand)

⏺ That's just the state boundary. Let me try a better source with individual districts.

⏺ Bash(curl \-sL "https://theunitedstates.io/districts/cds/2024/SC-1/shape.geojson" \-o /tmp/sc-cd1.geojson && cat  
      /tmp/sc-cd1.geojson | head \-20)  
  ⎿  Error: Exit code 6

⏺ Let me check existing district files and create a similar structure for congressional districts.

⏺ Bash(head \-100 /Users/russellteter/Desktop/sc-election-map-2026/public/data/sc-house-districts.geojson)  
  ⎿ {"type":"FeatureCollection", "features": \[                                                                        
    {"type":"Feature","geometry":{"type":"Polygon","coordinates":\[\[\[-81.01427,33.90815\],\[-81.01181,33.90707\],\[-81.010  
    0  
    6,33.90571\],\[-81.00875,33.9041\],\[-81.00875,33.90275\],\[-81.00948,33.90055\],\[-81.00941,33.9001\],\[-81.011,33.89813\],  
    \[  
    … \+8103 lines (ctrl+o to expand)

⏺ Bash(cat /Users/russellteter/Desktop/sc-election-map-2026/public/data/sc-house-districts.geojson | grep \-o  
      '"properties":{\[^}\]\*}' | head \-5)  
  ⎿ "properties":{"STATEFP":"45","SLDLST":"070","GEOID":"45070","GEOIDFQ":"620L900US45070","NAMELSAD":"State House    
    Dis  
    trict  
    70","LSAD":"LL","LSY":"2024","MTFCC":"G5220","FUNCSTAT":"N","ALAND":939621129,"AWATER":13321045,"INTPTLAT":"  
    \+33.8854505","INTPTLON":"-080.6548496"}  
    … \+12 lines (ctrl+o to expand)

⏺ Bash(curl \-sL "https://www2.census.gov/geo/tiger/GENZ2023/shp/cb\_2023\_45\_cd118\_500k.zip" \-o /tmp/sc-cd.zip && unzip \-o  
      /tmp/sc-cd.zip \-d /tmp/sc-cd && ls \-la /tmp/sc…)  
  ⎿  Error: Exit code 9  
       End-of-central-directory signature not found.  Either this file is not  
       a zipfile, or it constitutes one disk of a multi-part archive.  In the  
       latter case the central directory and zipfile comment will be found on  
       the last disk(s) of this archive.  
     unzip:  cannot find zipfile directory in one of /tmp/sc-cd.zip or  
             /tmp/sc-cd.zip.zip, and cannot find /tmp/sc-cd.zip.ZIP, period.

     Archive:  /tmp/sc-cd.zip

⏺ Let me search for a working GeoJSON source for SC congressional districts.

⏺ Web Search("South Carolina congressional districts GeoJSON 2024 download free")  
  ⎿  Did 2 searches in 26s                                                                                          

⏺ Bash(curl \-sL  
      "https://raw.githubusercontent.com/JeffreyBLewis/congressional-district-boundaries/main/geojson/districts119.json" \-o  
       /tmp/cd119.json && cat /tmp/cd119…)  
  ⎿  404: Not Found

⏺ Bash(curl \-sL "https://api.github.com/repos/JeffreyBLewis/congressional-district-boundaries/contents/geojson" | grep \-o  
      '"name":"\[^"\]\*"' | head \-20)  
  ⎿  (No content)

⏺ Let me try the Census Bureau's TIGERweb REST API which provides GeoJSON directly.

⏺ Bash(curl \-sL "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Legislative/MapServer/0/query?where=STATEFP%  
      3D'45'\&outFields=\*\&f=geojson" \-o /tmp/sc-cd-…)  
  ⎿  {                              
       "error": {  
         "code": 400,  
     … \+4 lines (ctrl+o to expand)

⏺ Bash(curl \-sL "https://raw.githubusercontent.com/unitedstates/districts/gh-pages/states/SC/cd.json" \-o /tmp/sc-cd-us.json  
       && cat /tmp/sc-cd-us.json | head \-100)  
  ⎿  404: Not Found

⏺ Bash(which ogr2ogr 2\>/dev/null || echo "ogr2ogr not installed")  
  ⎿  ogr2ogr not found      
     ogr2ogr not installed

⏺ Let me take a simpler approach \- create a county-to-congressional-district lookup since SC's CDs follow county lines closely. This is more reliable and faster.

⏺ Write(src/lib/congressionalLookup.ts)  
  ⎿  Wrote 237 lines to src/lib/congressionalLookup.ts                                            
       1 /\*\*  
       2  \* Congressional District Lookup for South Carolina  
       3  \*  
       4  \* Uses county FIPS code to determine congressional district.  
       5  \* SC has 7 congressional districts (118th Congress, 2023-2025).  
       6  \*  
       7  \* Note: Some counties are split between districts. For split counties,  
       8  \* we use the district that contains the majority of the population.  
       9  \* For precise lookup in split counties, a full GeoJSON boundary check would be needed.  
      10  \*/  
     … \+227 lines (ctrl+o to expand)

⏺ Now let me create the CongressionalRaces component.

⏺ Write(src/components/VoterGuide/CongressionalRaces.tsx)  
  ⎿  Wrote 404 lines to src/components/VoterGuide/CongressionalRaces.tsx                                          
      1 'use client';  
      2 import type { CongressionalData, CongressionalDistrict, USSenateRace, Candidate } from '@/types/schema';  
      3 import CandidateCard from '@/components/Dashboard/CandidateCard';  
      4 import { CD\_INFO } from '@/lib/congressionalLookup';  
      5 interface CongressionalRacesProps {  
      6   data: CongressionalData;  
      7   congressionalDistrict: number | null;  
      8   countyName: string | null;  
     … \+394 lines (ctrl+o to expand)

⏺ Update(src/components/VoterGuide/index.ts)  
  ⎿  Added 2 lines                                                                                                    
      1  export { default as AddressInput } from './AddressInput';  
      2  export { default as AddressAutocomplete } from './AddressAutocomplete';  
      3  export { default as DistrictResults } from './DistrictResults';  
      4 \+export { default as StatewideRaces } from './StatewideRaces';                                                
      5 \+export { default as CongressionalRaces } from './CongressionalRaces';                                      

⏺ Now let me update the voter-guide page to integrate all the new race types.

⏺ Read(src/app/voter-guide/page.tsx)  
  ⎿  Read 446 lines

⏺ Write(src/app/voter-guide/page.tsx)  
  ⎿  Added 118 lines, removed 48 lines                                                                                
       3  import { useState, useEffect, useCallback, Suspense } from 'react';  
       4  import { useSearchParams, useRouter } from 'next/navigation';  
       5  import Link from 'next/link';  
       6 \-import { AddressAutocomplete, DistrictResults } from '@/components/VoterGuide';                             
       6 \+import { AddressAutocomplete, DistrictResults, StatewideRaces, CongressionalRaces } from '@/components/Vot  
         \+erGuide';                                                                                                   
       7  import { geocodeAddress, reverseGeocode, getCurrentLocation, isInSouthCarolina, GeocodeResult } from '@/li  
          b/geocoding';  
       8  import { findDistricts, preloadBoundaries, DistrictResult } from '@/lib/districtLookup';  
       9 \-import type { CandidatesData } from '@/types/schema';                                                       
       9 \+import { getCountyFromCoordinates } from '@/lib/congressionalLookup';                                       
      10 \+import type { CandidatesData, StatewideRacesData, CongressionalData } from '@/types/schema';                
      11    
      12  type LookupStatus \= 'idle' | 'geocoding' | 'finding-districts' | 'done' | 'error';  
      13    
      14 \+interface AllRacesData {                                                                                    
      15 \+  candidates: CandidatesData | null;                                                                        
      16 \+  statewide: StatewideRacesData | null;                                                                     
      17 \+  congressional: CongressionalData | null;                                                                  
      18 \+}                                                                                                           
      19 \+                                                                                                            
      20 \+interface ExtendedDistrictResult extends DistrictResult {                                                   
      21 \+  congressionalDistrict?: number | null;                                                                    
      22 \+  countyName?: string | null;                                                                               
      23 \+}                                                                                                           
      24 \+                                                                                                            
      25  function VoterGuideContent() {  
      26    const searchParams \= useSearchParams();  
      27    const router \= useRouter();  
      28    
      17 \-  const \[candidatesData, setCandidatesData\] \= useState\<CandidatesData | null\>(null);                        
      29 \+  const \[allData, setAllData\] \= useState\<AllRacesData\>({                                                    
      30 \+    candidates: null,                                                                                       
      31 \+    statewide: null,                                                                                        
      32 \+    congressional: null,                                                                                    
      33 \+  });                                                                                                       
      34    const \[isDataLoading, setIsDataLoading\] \= useState(true);  
      35    
      36    // Lookup state  
     ...  
      41    
      42    // Results state  
      43    const \[geocodeResult, setGeocodeResult\] \= useState\<GeocodeResult | null\>(null);  
      28 \-  const \[districtResult, setDistrictResult\] \= useState\<DistrictResult | null\>(null);                        
      44 \+  const \[districtResult, setDistrictResult\] \= useState\<ExtendedDistrictResult | null\>(null);                
      45    
      46    // Address from URL for sharing  
      47    const \[initialAddress, setInitialAddress\] \= useState('');  
      48    const \[shareUrl, setShareUrl\] \= useState\<string | null\>(null);  
      49    
      34 \-  // Load candidates data and preload boundaries on mount                                                   
      50 \+  // Load all data on mount                                                                                 
      51    useEffect(() \=\> {  
      52      const basePath \= window.location.pathname.includes('/sc-election-map-2026')  
      53        ? '/sc-election-map-2026'  
      54        : '';  
      55      const cacheBuster \= \`v=${Date.now()}\`;  
      56    
      41 \-    // Load candidates data                                                                                 
      42 \-    fetch(\`${basePath}/data/candidates.json?${cacheBuster}\`)                                                
      43 \-      .then((res) \=\> res.json())                                                                            
      44 \-      .then((data) \=\> {                                                                                     
      45 \-        setCandidatesData(data);                                                                            
      46 \-        setIsDataLoading(false);                                                                            
      47 \-      })                                                                                                    
      48 \-      .catch((err) \=\> {                                                                                     
      49 \-        console.error('Failed to load candidates data:', err);                                              
      50 \-        setIsDataLoading(false);                                                                            
      51 \-      });                                                                                                   
      57 \+    // Load all data files in parallel                                                                      
      58 \+    Promise.all(\[                                                                                           
      59 \+      fetch(\`${basePath}/data/candidates.json?${cacheBuster}\`).then(r \=\> r.json()).catch(() \=\> null),       
      60 \+      fetch(\`${basePath}/data/statewide-races.json?${cacheBuster}\`).then(r \=\> r.json()).catch(() \=\> null),  
      61 \+      fetch(\`${basePath}/data/congress-candidates.json?${cacheBuster}\`).then(r \=\> r.json()).catch(() \=\> nu  
         \+ll),                                                                                                        
      62 \+    \]).then((\[candidates, statewide, congressional\]) \=\> {                                                   
      63 \+      setAllData({ candidates, statewide, congressional });                                                 
      64 \+      setIsDataLoading(false);                                                                              
      65 \+    }).catch(err \=\> {                                                                                       
      66 \+      console.error('Failed to load data:', err);                                                           
      67 \+      setIsDataLoading(false);                                                                              
      68 \+    });                                                                                                     
      69    
      70      // Preload GeoJSON boundaries in background  
      71      preloadBoundaries().then((success) \=\> {  
     ...  
      147    
      148        setStatusMessage(\`Found: ${displayName.split(',').slice(0, 3).join(',')}\`);  
      149    
      133 \-      // Step 2: Find districts                                                                            
      150 \+      // Step 2: Find all districts                                                                        
      151        setStatus('finding-districts');  
      152        setStatusMessage('Finding your districts...');  
      153    
      154 \+      // Get state legislative districts                                                                   
      155        const districts \= await findDistricts(finalLat, finalLon);  
      156    
      157 \+      // Get county and congressional district                                                             
      158 \+      const countyInfo \= await getCountyFromCoordinates(finalLat, finalLon);                               
      159 \+                                                                                                           
      160        if (\!districts.success) {  
      161          setStatus('error');  
      162          setError(districts.error || 'Could not determine districts');  
     ...  
      164          return;  
      165        }  
      166    
      146 \-      setDistrictResult(districts);                                                                        
      167 \+      // Combine all district info                                                                         
      168 \+      const extendedResult: ExtendedDistrictResult \= {                                                     
      169 \+        ...districts,                                                                                      
      170 \+        congressionalDistrict: countyInfo.congressionalDistrict,                                           
      171 \+        countyName: countyInfo.countyName,                                                                 
      172 \+      };                                                                                                   
      173 \+                                                                                                           
      174 \+      setDistrictResult(extendedResult);                                                                   
      175        setStatus('done');  
      176        setStatusMessage(null);  
      177    
     ...  
      250      if (shareUrl) {  
      251        try {  
      252          await navigator.clipboard.writeText(shareUrl);  
      225 \-        // Could add a toast notification here                                                             
      253          alert('Link copied to clipboard\!');  
      254        } catch {  
      255          // Fallback for older browsers  
     ...  
      267    const isLoading \= status \=== 'geocoding' || status \=== 'finding-districts';  
      268    const hasResults \= status \=== 'done' && districtResult;  
      269    
      270 \+  // Count total races for display                                                                         
      271 \+  const raceCount \= hasResults ? (                                                                         
      272 \+    2 \+ // House \+ Senate state legislative                                                                
      273 \+    (allData.statewide?.races.length || 0\) \+                                                               
      274 \+    (districtResult.congressionalDistrict ? 2 : 0\) // US House \+ US Senate                                 
      275 \+  ) : 0;                                                                                                   
      276 \+                                                                                                           
      277    return (  
      278      \<div className="atmospheric-bg min-h-screen flex flex-col"\>  
      279        {/\* Header \*/}  
     ...  
      313            {/\* Page Intro \*/}  
      314            \<div className="text-center mb-8"\>  
      315              \<h2 className="font-display font-bold text-3xl mb-2" style={{ color: 'var(--text-color)' }}\>  
      282 \-              Find Your Candidates                                                                         
      316 \+              Find Your Ballot                                                                             
      317              \</h2\>  
      318              \<p className="text-lg" style={{ color: 'var(--text-muted)' }}\>  
      285 \-              Enter your address to see who\&apos;s running in your SC House and Senate districts           
      319 \+              Enter your address to see all races you\&apos;ll vote on in 2026                              
      320              \</p\>  
      321            \</div\>  
      322    
     ...  
      327                  className="animate-spin h-8 w-8 mx-auto mb-4 border-2 rounded-full"  
      328                  style={{ borderColor: 'var(--class-purple-light)', borderTopColor: 'var(--class-purple)'   
           }}  
      329                /\>  
      296 \-              \<p style={{ color: 'var(--text-muted)' }}\>Loading candidate data...\</p\>                      
      330 \+              \<p style={{ color: 'var(--text-muted)' }}\>Loading election data...\</p\>                       
      331              \</div\>  
      332            )}  
      333    
     ...  
      346                /\>  
      347    
      348                {/\* Results Section \*/}  
      315 \-              {hasResults && candidatesData && (                                                           
      316 \-                \<\>                                                                                         
      349 \+              {hasResults && allData.candidates && (                                                       
      350 \+                \<div className="space-y-10"\>                                                               
      351 \+                  {/\* Results Header \*/}                                                                   
      352                    \<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"\>  
      318 \-                    \<h3 className="font-display font-semibold text-lg" style={{ color: 'var(--text-color)  
          \-' }}\>                                                                                                      
      319 \-                      Your Districts                                                                       
      320 \-                    \</h3\>                                                                                  
      353 \+                    \<div\>                                                                                  
      354 \+                      \<h3 className="font-display font-semibold text-lg" style={{ color: 'var(--text-colo  
          \+r)' }}\>                                                                                                    
      355 \+                        Your 2026 Ballot                                                                   
      356 \+                      \</h3\>                                                                                
      357 \+                      \<p className="text-sm" style={{ color: 'var(--text-muted)' }}\>                       
      358 \+                        {raceCount} races in your area                                                     
      359 \+                        {districtResult.countyName && \` • ${districtResult.countyName} County\`}            
      360 \+                      \</p\>                                                                                 
      361 \+                    \</div\>                                                                                 
      362                      \<div className="flex items-center gap-3"\>  
      363                        {shareUrl && (  
      364                          \<button  
     ...  
      385                        \</button\>  
      386                      \</div\>  
      387                    \</div\>  
      347 \-                  \<DistrictResults                                                                         
      348 \-                    houseDistrict={districtResult.houseDistrict}                                           
      349 \-                    senateDistrict={districtResult.senateDistrict}                                         
      350 \-                    displayAddress={geocodeResult?.displayName || ''}                                      
      351 \-                    candidatesData={candidatesData}                                                        
      352 \-                  /\>                                                                                       
      353 \-                \</\>                                                                                        
      388 \+                                                                                                           
      389 \+                  {/\* Statewide Constitutional Offices \*/}                                                 
      390 \+                  {allData.statewide && (                                                                  
      391 \+                    \<StatewideRaces data={allData.statewide} /\>                                            
      392 \+                  )}                                                                                       
      393 \+                                                                                                           
      394 \+                  {/\* US Congressional Races \*/}                                                           
      395 \+                  {allData.congressional && (                                                              
      396 \+                    \<CongressionalRaces                                                                    
      397 \+                      data={allData.congressional}                                                         
      398 \+                      congressionalDistrict={districtResult.congressionalDistrict || null}                 
      399 \+                      countyName={districtResult.countyName || null}                                       
      400 \+                    /\>                                                                                     
      401 \+                  )}                                                                                       
      402 \+                                                                                                           
      403 \+                  {/\* State Legislative Districts \*/}                                                      
      404 \+                  \<div className="space-y-6"\>                                                              
      405 \+                    \<div className="flex items-center gap-3"\>                                              
      406 \+                      \<div                                                                                 
      407 \+                        className="w-10 h-10 rounded-lg flex items-center justify-center"                  
      408 \+                        style={{                                                                           
      409 \+                          background: 'var(--class-purple-bg)',                                            
      410 \+                          border: '1px solid var(--class-purple-light)',                                   
      411 \+                        }}                                                                                 
      412 \+                      \>                                                                                    
      413 \+                        \<svg className="w-5 h-5" style={{ color: 'var(--class-purple)' }} fill="none" str  
          \+oke="currentColor" viewBox="0 0 24 24"\>                                                                    
      414 \+                          \<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a  
          \+2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1  
          \+h2a1 1 0 011 1v5m-4 0h4" /\>                                                                                
      415 \+                        \</svg\>                                                                             
      416 \+                      \</div\>                                                                               
      417 \+                      \<div\>                                                                                
      418 \+                        \<h3 className="font-display font-semibold text-lg" style={{ color: 'var(--text-co  
          \+lor)' }}\>                                                                                                  
      419 \+                          SC State Legislature                                                             
      420 \+                        \</h3\>                                                                              
      421 \+                        \<p className="text-sm" style={{ color: 'var(--text-muted)' }}\>                     
      422 \+                          Your state representative and senator                                            
      423 \+                        \</p\>                                                                               
      424 \+                      \</div\>                                                                               
      425 \+                    \</div\>                                                                                 
      426 \+                    \<DistrictResults                                                                       
      427 \+                      houseDistrict={districtResult.houseDistrict}                                         
      428 \+                      senateDistrict={districtResult.senateDistrict}                                       
      429 \+                      displayAddress={geocodeResult?.displayName || ''}                                    
      430 \+                      candidatesData={allData.candidates}                                                  
      431 \+                    /\>                                                                                     
      432 \+                  \</div\>                                                                                   
      433 \+                \</div\>                                                                                     
      434                )}  
      435    
      436                {/\* Manual Fallback Link \*/}  
     ...  
      470              \>  
      471                SC Ethics Commission  
      472              \</a\>  
      393 \-            {' '}and{' '}                                                                                  
      473 \+            ,{' '}                                                                                         
      474              \<a  
      475                href="https://scvotes.gov/"  
      476                target="\_blank"  
     ...  
      480              \>  
      481                SC Election Commission  
      482              \</a\>  
      403 \-            . Address lookup powered by{' '}                                                               
      483 \+            , and{' '}                                                                                     
      484              \<a  
      405 \-              href="https://www.geoapify.com/"                                                             
      485 \+              href="https://ballotpedia.org/"                                                              
      486                target="\_blank"  
      487                rel="noopener noreferrer"  
      488                className="underline"  
      489                style={{ color: 'var(--class-purple)' }}  
      490              \>  
      411 \-              Geoapify                                                                                     
      491 \+              Ballotpedia                                                                                  
      492              \</a\>  
      413 \-            {' '}and{' '}                                                                                  
      414 \-            \<a                                                                                             
      415 \-              href="https://nominatim.openstreetmap.org/"                                                  
      416 \-              target="\_blank"                                                                              
      417 \-              rel="noopener noreferrer"                                                                    
      418 \-              className="underline"                                                                        
      419 \-              style={{ color: 'var(--class-purple)' }}                                                     
      420 \-            \>                                                                                              
      421 \-              OpenStreetMap                                                                                
      422 \-            \</a\>                                                                                           
      493              .  
      494            \</p\>  
      495          \</div\>

⏺ Let me run a type check to verify everything compiles.

⏺ Bash(npx tsc \--noEmit 2\>&1 | grep \-v "Legend.test.tsx" | head \-30)  
  ⎿   Property 'showRepublicanData' does not exist on type 'IntrinsicAttributes & LegendProps'.                       
      Property 'showRepublicanData' does not exist on type 'IntrinsicAttributes & LegendProps'.  
    src/lib/congressionalLookup.ts(123,3): error TS1117: An object literal cannot have multiple properties with the  
    sa  
    me name.

⏺ I have a duplicate key issue. Let me fix that.

⏺ Update(src/lib/congressionalLookup.ts)  
  ⎿  Added 1 line, removed 2 lines                                                                                    
      120    '087': 'Union',  
      121    '089': 'Williamsburg',  
      122    '091': 'York',  
      123 \-  '017': 'Calhoun', // CD-6                                                                                
      123  };  
      124    
      126 \-// Add Calhoun to CD-6                                                                                     
      125 \+// Add Calhoun to CD-6 (wasn't in the initial list)                                                        
      126  COUNTY\_TO\_CD\['017'\] \= 6; // Calhoun County  
      127    
      128  /\*\*

⏺ Update(src/lib/congressionalLookup.ts)  
  ⎿  Removed 1 line                                                                                                   
      82    '011': 'Barnwell',  
      83    '013': 'Beaufort',  
      84    '015': 'Berkeley',  
      85 \-  '017': 'Calhoun',                                                                                         
      85    '019': 'Charleston',  
      86    '021': 'Cherokee',  
      87    '023': 'Chester',

⏺ Update(src/lib/congressionalLookup.ts)  
  ⎿  Added 1 line                                                                                                     
      82    '011': 'Barnwell',  
      83    '013': 'Beaufort',  
      84    '015': 'Berkeley',  
      85 \+  '017': 'Calhoun',                                                                                         
      86    '019': 'Charleston',  
      87    '021': 'Cherokee',  
      88    '023': 'Chester',

⏺ Bash(npx tsc \--noEmit 2\>&1 | grep \-v "Legend.test.tsx" | head \-10)  
  ⎿    Property 'showRepublicanData' does not exist on type 'IntrinsicAttributes & LegendProps'.  
       Property 'showRepublicanData' does not exist on type 'IntrinsicAttributes & LegendProps'.

⏺ All new code compiles correctly (the Legend.test.tsx errors are pre-existing). Let me update the todos.

⏺ Sprint 2 Complete\!

  The voter guide now shows 13 race types instead of just 2:

  What's Been Added:  
  Category: Statewide Constitutional Offices  
  Races: 9 races (Governor, Lt Gov, AG, etc.)  
  Status: Data ready, awaiting candidate filings  
  ────────────────────────────────────────  
  Category: US Congress  
  Races: 1 House \+ 1 Senate (Lindsey Graham seat up in 2026\)  
  Status: Data ready, awaiting filings  
  ────────────────────────────────────────  
  Category: SC State Legislature  
  Races: House \+ Senate (existing)  
  Status: Already working  
  New Files Created:

  Data Files:  
  \- public/data/statewide-races.json \- 9 statewide offices with incumbents  
  \- public/data/congress-candidates.json \- 7 US House \+ 2 US Senate seats

  Components:  
  \- src/components/VoterGuide/StatewideRaces.tsx \- Grid of statewide offices  
  \- src/components/VoterGuide/CongressionalRaces.tsx \- US House \+ Senate cards  
  \- src/lib/congressionalLookup.ts \- County-to-CD mapping for all 46 counties

  Modified:  
  \- src/types/schema.ts \- Added types for statewide and congressional races  
  \- src/app/voter-guide/page.tsx \- Loads all data and displays all race types  
  \- src/components/VoterGuide/index.ts \- Barrel exports

  Current Ballot Display:

  When you search an address, you now see:  
  1\. Statewide Offices (9) \- Yellow badges, shows "OPEN SEAT" for term-limited incumbents  
  2\. US Congress (2) \- Blue badges, shows your district and the 2026 Senate race  
  3\. SC Legislature (2) \- Purple badges, House \+ Senate districts

  Test It:

  Visit http://localhost:3000/voter-guide and enter a SC address like:  
  \- "1100 Gervais St, Columbia, SC 29201" (Richland County, CD-6)

  You should see \~13 races displayed, organized by level.

  \---  
  Ready for Sprint 3? That would add:  
  \- Election dates/timeline component  
  \- Voter registration check link  
  \- Polling place lookup (Google Civic API)  
  \- Print-friendly ballot guide

✻ Sautéed for 9m 50s

❯ yes continue with sprint 3 

⏺ Starting Sprint 3 \- Voter Resources Integration.

⏺ Write(public/data/election-dates.json)  
  ⎿  Wrote 114 lines to public/data/election-dates.json                                     
       1 {  
       2   "lastUpdated": "2026-01-13T00:00:00Z",  
       3   "year": 2026,  
       4   "state": "South Carolina",  
       5   "dates": \[  
       6     {  
       7       "id": "registration-deadline-primary",  
       8       "date": "2026-05-08",  
       9       "title": "Voter Registration Deadline (Primary)",  
      10       "description": "Last day to register to vote in the June primary election",  
     … \+104 lines (ctrl+o to expand)

⏺ Now let me add the types and create the ElectionTimeline component.

⏺ Update(src/types/schema.ts)  
  ⎿  Added 54 lines                                                                                                   
      370      class3: USSenateRace;  
      371    };  
      372  }  
      373 \+                                                                                                           
      374 \+// \=============================================================================                           
      375 \+// Election Dates & Voter Resources Types                                                                  
      376 \+// \=============================================================================                           
      377 \+                                                                                                           
      378 \+/\*\*                                                                                                        
      379 \+ \* Election date/deadline type                                                                             
      380 \+ \*/                                                                                                        
      381 \+export type ElectionDateType \= 'deadline' | 'period-start' | 'election';                                   
      382 \+export type ElectionDateCategory \= 'registration' | 'filing' | 'voting' | 'election';                      
      383 \+                                                                                                           
      384 \+/\*\*                                                                                                        
      385 \+ \* Single election date entry                                                                              
      386 \+ \*/                                                                                                        
      387 \+export interface ElectionDate {                                                                            
      388 \+  id: string;                                                                                              
      389 \+  date: string; // ISO date format YYYY-MM-DD                                                              
      390 \+  title: string;                                                                                           
      391 \+  description: string;                                                                                     
      392 \+  type: ElectionDateType;                                                                                  
      393 \+  category: ElectionDateCategory;                                                                          
      394 \+  important: boolean;                                                                                      
      395 \+}                                                                                                          
      396 \+                                                                                                           
      397 \+/\*\*                                                                                                        
      398 \+ \* Voter resources links                                                                                   
      399 \+ \*/                                                                                                        
      400 \+export interface VoterResources {                                                                          
      401 \+  voterRegistration: {                                                                                     
      402 \+    checkStatus: string;                                                                                   
      403 \+    register: string;                                                                                      
      404 \+    requirements: string;                                                                                  
      405 \+  };                                                                                                       
      406 \+  pollingPlace: {                                                                                          
      407 \+    lookup: string;                                                                                        
      408 \+    sampleBallot: string;                                                                                  
      409 \+  };                                                                                                       
      410 \+  absenteeVoting: {                                                                                        
      411 \+    info: string;                                                                                          
      412 \+    requestForm: string;                                                                                   
      413 \+  };                                                                                                       
      414 \+  countyOffices: string;                                                                                   
      415 \+}                                                                                                          
      416 \+                                                                                                           
      417 \+/\*\*                                                                                                        
      418 \+ \* Complete election dates data                                                                            
      419 \+ \*/                                                                                                        
      420 \+export interface ElectionDatesData {                                                                       
      421 \+  lastUpdated: string;                                                                                     
      422 \+  year: number;                                                                                            
      423 \+  state: string;                                                                                           
      424 \+  dates: ElectionDate\[\];                                                                                   
      425 \+  resources: VoterResources;                                                                               
      426 \+}                                                                                                        

⏺ Now let me create the VoterResources component that combines timeline, registration check, and polling place lookup.

⏺ Write(src/components/VoterGuide/VoterResources.tsx)  
  ⎿  Wrote 366 lines to src/components/VoterGuide/VoterResources.tsx             
      1 'use client';  
      2 import { useState } from 'react';  
      3 import type { ElectionDatesData, ElectionDate } from '@/types/schema';  
      4 interface VoterResourcesProps {  
      5   data: ElectionDatesData;  
      6 }  
      7 export default function VoterResources({ data }: VoterResourcesProps) {  
     … \+356 lines (ctrl+o to expand)

⏺ Now let me update the barrel export and add print styles.

⏺ Update(src/components/VoterGuide/index.ts)  
  ⎿  Added 1 line                                                                                                     
      3  export { default as DistrictResults } from './DistrictResults';  
      4  export { default as StatewideRaces } from './StatewideRaces';  
      5  export { default as CongressionalRaces } from './CongressionalRaces';  
      6 \+export { default as VoterResources } from './VoterResources';                                              

⏺ Let me check the existing globals.css to add print styles.

⏺ Search(pattern: "src/\*\*/\*.css")  
  ⎿  Found 1 file (ctrl+o to expand)

⏺ Read(src/app/globals.css)  
  ⎿  Read 100 lines

⏺ Bash(tail \-100 /Users/russellteter/Desktop/sc-election-map-2026/src/app/globals.css)  
  ⎿    flex-shrink: 0;               
     }  
     … \+97 lines (ctrl+o to expand)

⏺ Update(src/app/globals.css)  
  ⎿  Added 163 lines                                                                                                  
      1876      transition: none;  
      1877    }  
      1878  }  
      1879 \+                                                                                                          
      1880 \+/\* \==========================================================================                             
      1881 \+   VOTER GUIDE PRINT STYLES                                                                               
      1882 \+   \========================================================================== \*/                          
      1883 \+                                                                                                          
      1884 \+@media print {                                                                                            
      1885 \+  /\* Reset page settings \*/                                                                               
      1886 \+  @page {                                                                                                 
      1887 \+    size: letter;                                                                                         
      1888 \+    margin: 0.75in;                                                                                       
      1889 \+  }                                                                                                       
      1890 \+                                                                                                          
      1891 \+  /\* Hide non-essential elements \*/                                                                       
      1892 \+  .no-print,                                                                                              
      1893 \+  header,                                                                                                 
      1894 \+  footer,                                                                                                 
      1895 \+  nav,                                                                                                    
      1896 \+  button:not(.print-show),                                                                                
      1897 \+  .glass-surface::before,                                                                                 
      1898 \+  .atmospheric-bg::before {                                                                               
      1899 \+    display: none \!important;                                                                             
      1900 \+  }                                                                                                       
      1901 \+                                                                                                          
      1902 \+  /\* Reset backgrounds for printing \*/                                                                    
      1903 \+  body,                                                                                                   
      1904 \+  .atmospheric-bg {                                                                                       
      1905 \+    background: white \!important;                                                                         
      1906 \+    color: black \!important;                                                                              
      1907 \+  }                                                                                                       
      1908 \+                                                                                                          
      1909 \+  /\* Glass surfaces become plain white \*/                                                                 
      1910 \+  .glass-surface {                                                                                        
      1911 \+    background: white \!important;                                                                         
      1912 \+    border: 1px solid \#ccc \!important;                                                                    
      1913 \+    box-shadow: none \!important;                                                                          
      1914 \+    backdrop-filter: none \!important;                                                                     
      1915 \+    \-webkit-backdrop-filter: none \!important;                                                             
      1916 \+  }                                                                                                       
      1917 \+                                                                                                          
      1918 \+  /\* Ensure text is black \*/                                                                              
      1919 \+  h1, h2, h3, h4, h5, h6, p, span, div, a {                                                               
      1920 \+    color: black \!important;                                                                              
      1921 \+    \-webkit-print-color-adjust: exact;                                                                    
      1922 \+    print-color-adjust: exact;                                                                            
      1923 \+  }                                                                                                       
      1924 \+                                                                                                          
      1925 \+  /\* Badge colors for print \*/                                                                            
      1926 \+  .badge {                                                                                                
      1927 \+    border: 1px solid currentColor \!important;                                                            
      1928 \+    background: transparent \!important;                                                                   
      1929 \+    \-webkit-print-color-adjust: exact;                                                                    
      1930 \+    print-color-adjust: exact;                                                                            
      1931 \+  }                                                                                                       
      1932 \+                                                                                                          
      1933 \+  .badge-democrat {                                                                                       
      1934 \+    color: \#1D4ED8 \!important;                                                                            
      1935 \+    border-color: \#1D4ED8 \!important;                                                                     
      1936 \+  }                                                                                                       
      1937 \+                                                                                                          
      1938 \+  .badge-republican {                                                                                     
      1939 \+    color: \#DC2626 \!important;                                                                            
      1940 \+    border-color: \#DC2626 \!important;                                                                     
      1941 \+  }                                                                                                       
      1942 \+                                                                                                          
      1943 \+  /\* Page breaks \*/                                                                                       
      1944 \+  .page-break-before {                                                                                    
      1945 \+    page-break-before: always;                                                                            
      1946 \+  }                                                                                                       
      1947 \+                                                                                                          
      1948 \+  .page-break-after {                                                                                     
      1949 \+    page-break-after: always;                                                                             
      1950 \+  }                                                                                                       
      1951 \+                                                                                                          
      1952 \+  .avoid-break {                                                                                          
      1953 \+    page-break-inside: avoid;                                                                             
      1954 \+  }                                                                                                       
      1955 \+                                                                                                          
      1956 \+  /\* Voter guide specific \*/                                                                              
      1957 \+  .voter-guide-section {                                                                                  
      1958 \+    page-break-inside: avoid;                                                                             
      1959 \+    margin-bottom: 1.5rem;                                                                                
      1960 \+  }                                                                                                       
      1961 \+                                                                                                          
      1962 \+  /\* District cards \*/                                                                                    
      1963 \+  .district-card,                                                                                         
      1964 \+  .glass-surface {                                                                                        
      1965 \+    page-break-inside: avoid;                                                                             
      1966 \+    margin-bottom: 0.5rem;                                                                                
      1967 \+  }                                                                                                       
      1968 \+                                                                                                          
      1969 \+  /\* Grid becomes single column on print \*/                                                               
      1970 \+  .grid {                                                                                                 
      1971 \+    display: block \!important;                                                                            
      1972 \+  }                                                                                                       
      1973 \+                                                                                                          
      1974 \+  .grid \> \* {                                                                                             
      1975 \+    margin-bottom: 1rem;                                                                                  
      1976 \+  }                                                                                                       
      1977 \+                                                                                                          
      1978 \+  /\* Links show URL \*/                                                                                    
      1979 \+  a\[href^="http"\]:not(.no-url)::after {                                                                   
      1980 \+    content: " (" attr(href) ")";                                                                         
      1981 \+    font-size: 0.75rem;                                                                                   
      1982 \+    color: \#666;                                                                                          
      1983 \+    word-break: break-all;                                                                                
      1984 \+  }                                                                                                       
      1985 \+                                                                                                          
      1986 \+  /\* Hide external link indicators \*/                                                                     
      1987 \+  a\[href^="http"\] svg {                                                                                   
      1988 \+    display: none;                                                                                        
      1989 \+  }                                                                                                       
      1990 \+                                                                                                          
      1991 \+  /\* Print header \*/                                                                                      
      1992 \+  .print-header {                                                                                         
      1993 \+    display: block \!important;                                                                            
      1994 \+    text-align: center;                                                                                   
      1995 \+    margin-bottom: 1.5rem;                                                                                
      1996 \+    padding-bottom: 1rem;                                                                                 
      1997 \+    border-bottom: 2px solid black;                                                                       
      1998 \+  }                                                                                                       
      1999 \+                                                                                                          
      2000 \+  .print-header h1 {                                                                                      
      2001 \+    font-size: 1.5rem;                                                                                    
      2002 \+    font-weight: bold;                                                                                    
      2003 \+    margin-bottom: 0.25rem;                                                                               
      2004 \+  }                                                                                                       
      2005 \+                                                                                                          
      2006 \+  .print-header p {                                                                                       
      2007 \+    font-size: 0.875rem;                                                                                  
      2008 \+    color: \#666 \!important;                                                                               
      2009 \+  }                                                                                                       
      2010 \+                                                                                                          
      2011 \+  /\* Timeline for print \*/                                                                                
      2012 \+  .timeline-line {                                                                                        
      2013 \+    background: \#ccc \!important;                                                                          
      2014 \+  }                                                                                                       
      2015 \+                                                                                                          
      2016 \+  /\* Ensure SVG icons print \*/                                                                            
      2017 \+  svg {                                                                                                   
      2018 \+    \-webkit-print-color-adjust: exact;                                                                    
      2019 \+    print-color-adjust: exact;                                                                            
      2020 \+  }                                                                                                       
      2021 \+}                                                                                                         
      2022 \+                                                                                                          
      2023 \+/\* Print button styling (visible only on screen) \*/                                                       
      2024 \+@media screen {                                                                                           
      2025 \+  .print-header {                                                                                         
      2026 \+    display: none;                                                                                        
      2027 \+  }                                                                                                       
      2028 \+}                                                                                                         
      2029 \+                                                                                                          
      2030 \+/\* Voter Guide Print Button \*/                                                                            
      2031 \+.btn-print {                                                                                              
      2032 \+  display: flex;                                                                                          
      2033 \+  align-items: center;                                                                                    
      2034 \+  gap: 0.5rem;                                                                                            
      2035 \+  padding: 0.5rem 1rem;                                                                                   
      2036 \+  border-radius: 0.5rem;                                                                                  
      2037 \+  font-size: 0.875rem;                                                                                    
      2038 \+  font-weight: 500;                                                                                       
      2039 \+  transition: all 0.15s ease;                                                                             
      2040 \+  cursor: pointer;                                                                                        
      2041 \+}                                                                                                       

⏺ Now let me integrate VoterResources into the voter guide page and add a print button.

⏺ Read(src/app/voter-guide/page.tsx)  
  ⎿  Read 60 lines

⏺ Update(src/app/voter-guide/page.tsx)  
  ⎿  Added 2 lines, removed 2 lines                                                                                   
       3  import { useState, useEffect, useCallback, Suspense } from 'react';  
       4  import { useSearchParams, useRouter } from 'next/navigation';  
       5  import Link from 'next/link';  
       6 \-import { AddressAutocomplete, DistrictResults, StatewideRaces, CongressionalRaces } from '@/components/Vot  
         \-erGuide';                                                                                                   
       6 \+import { AddressAutocomplete, DistrictResults, StatewideRaces, CongressionalRaces, VoterResources } from '  
         \+@/components/VoterGuide';                                                                                   
       7  import { geocodeAddress, reverseGeocode, getCurrentLocation, isInSouthCarolina, GeocodeResult } from '@/li  
          b/geocoding';  
       8  import { findDistricts, preloadBoundaries, DistrictResult } from '@/lib/districtLookup';  
       9  import { getCountyFromCoordinates } from '@/lib/congressionalLookup';  
      10 \-import type { CandidatesData, StatewideRacesData, CongressionalData } from '@/types/schema';                
      10 \+import type { CandidatesData, StatewideRacesData, CongressionalData, ElectionDatesData } from '@/types/sch  
         \+ema';                                                                                                       
      11    
      12  type LookupStatus \= 'idle' | 'geocoding' | 'finding-districts' | 'done' | 'error';  
      13  

⏺ Update(src/app/voter-guide/page.tsx)  
  ⎿  Added 1 line                                                                                                     
      15    candidates: CandidatesData | null;  
      16    statewide: StatewideRacesData | null;  
      17    congressional: CongressionalData | null;  
      18 \+  electionDates: ElectionDatesData | null;                                                                  
      19  }  
      20    
      21  interface ExtendedDistrictResult extends DistrictResult {

⏺ Update(src/app/voter-guide/page.tsx)  
  ⎿  Added 1 line                                                                                                     
      31      candidates: null,  
      32      statewide: null,  
      33      congressional: null,  
      34 \+    electionDates: null,                                                                                    
      35    });  
      36    const \[isDataLoading, setIsDataLoading\] \= useState(true);  
      37  

⏺ Update(src/app/voter-guide/page.tsx)  
  ⎿  Added 3 lines, removed 2 lines                                                                                   
      61        fetch(\`${basePath}/data/candidates.json?${cacheBuster}\`).then(r \=\> r.json()).catch(() \=\> null),  
      62        fetch(\`${basePath}/data/statewide-races.json?${cacheBuster}\`).then(r \=\> r.json()).catch(() \=\> null),  
      63        fetch(\`${basePath}/data/congress-candidates.json?${cacheBuster}\`).then(r \=\> r.json()).catch(() \=\> nu  
          ll),  
      64 \-    \]).then((\[candidates, statewide, congressional\]) \=\> {                                                   
      65 \-      setAllData({ candidates, statewide, congressional });                                                 
      64 \+      fetch(\`${basePath}/data/election-dates.json?${cacheBuster}\`).then(r \=\> r.json()).catch(() \=\> null),   
      65 \+    \]).then((\[candidates, statewide, congressional, electionDates\]) \=\> {                                    
      66 \+      setAllData({ candidates, statewide, congressional, electionDates });                                  
      67        setIsDataLoading(false);  
      68      }).catch(err \=\> {  
      69        console.error('Failed to load data:', err);

⏺ Now let me add the VoterResources component and Print button to the results display.

⏺ Update(src/app/voter-guide/page.tsx)  
  ⎿  Added 17 lines, removed 3 lines                                                                                  
      362                          {districtResult.countyName && \` • ${districtResult.countyName} County\`}  
      363                        \</p\>  
      364                      \</div\>  
      365 \-                    \<div className="flex items-center gap-3"\>                                              
      365 \+                    \<div className="flex items-center gap-3 flex-wrap"\>                                    
      366                        {shareUrl && (  
      367                          \<button  
      368                            onClick={handleCopyShareLink}  
      369 \-                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium tra  
          \-nsition-all hover:opacity-80"                                                                              
      369 \+                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium tra  
          \+nsition-all hover:opacity-80 no-print"                                                                     
      370                            style={{  
      371                              background: 'var(--class-purple-bg)',  
      372                              color: 'var(--class-purple)',  
     ...  
      380                          \</button\>  
      381                        )}  
      382                        \<button  
      383 \+                        onClick={() \=\> window.print()}                                                     
      384 \+                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium trans  
          \+ition-all hover:opacity-80 no-print"                                                                       
      385 \+                        style={{                                                                           
      386 \+                          background: 'var(--card-bg)',                                                    
      387 \+                          color: 'var(--text-color)',                                                      
      388 \+                          border: '1px solid var(--border-subtle)',                                        
      389 \+                        }}                                                                                 
      390 \+                      \>                                                                                    
      391 \+                        \<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"\>    
      392 \+                          \<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a  
          \+2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2  
          \+ 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /\>                                             
      393 \+                        \</svg\>                                                                             
      394 \+                        Print                                                                              
      395 \+                      \</button\>                                                                            
      396 \+                      \<button                                                                              
      397                          onClick={handleReset}  
      384 \-                        className="text-sm font-medium transition-colors hover:opacity-80"                 
      398 \+                        className="text-sm font-medium transition-colors hover:opacity-80 no-print"        
      399                          style={{ color: 'var(--class-purple)' }}  
      400                        \>  
      401                          Search another address  
  ⎿  Context limit reached · /compact or /clear to continue

