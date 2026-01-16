 \# SC Election Map 2026 \- Project Bible                                                                                 
                                                                                                                         
  \> \*\*The definitive reference document for the SC Election Map project.\*\*                                               
  \> This document serves as the north star for all development, ensuring alignment with mission, strategic context,      
  and technical standards.                                                                                               
                                                                                                                         
  \---                                                                                                                    
                                                                                                                         
  \#\# Part 1: Mission & Vision                                                                                            
                                                                                                                         
  \#\#\# 1.1 The Core Mission                                                                                               
                                                                                                                         
  \*\*Help Democrats win more elections in South Carolina.\*\*                                                               
                                                                                                                         
  This is not a neutral voter information tool. While it presents as a professional, fact-based election resource,       
  every architectural decision, data integration, and feature prioritization serves the strategic goal of expanding      
  Democratic representation in the SC State Legislature.                                                                 
                                                                                                                         
  \#\#\# 1.2 The Problem We're Solving                                                                                      
                                                                                                                         
  South Carolina's legislature is dominated by Republicans:                                                              
  \- \*\*SC House\*\*: 124 seats, \~79% Republican control                                                                     
  \- \*\*SC Senate\*\*: 46 seats, \~80% Republican control                                                                     
                                                                                                                         
  Democrats face structural challenges:                                                                                  
  1\. \*\*No centralized intelligence\*\*: Campaign decisions made with incomplete data                                       
  2\. \*\*Recruitment gaps\*\*: Competitive districts go uncontested                                                          
  3\. \*\*Resource misallocation\*\*: Money and volunteers deployed inefficiently                                             
  4\. \*\*Voter disconnection\*\*: No comprehensive tool connecting voters to Democratic candidates                           
                                                                                                                         
  \#\#\# 1.3 The Vision                                                                                                     
                                                                                                                         
  Transform the SC Election Map from a \*\*static election visualization\*\* into a \*\*dynamic campaign intelligence          
  platform\*\* that:                                                                                                       
                                                                                                                         
  1\. \*\*For Voters\*\*: Provides comprehensive, personalized ballot information                                             
  2\. \*\*For Party Staff\*\*: Surfaces strategic opportunities across all 170 districts                                      
  3\. \*\*For Candidates\*\*: Identifies recruitment opportunities and funding sources                                        
  4\. \*\*For Campaigns\*\*: Enables data-driven resource allocation                                                          
                                                                                                                         
  \#\#\# 1.4 Success Metrics                                                                                                
                                                                                                                         
  | Metric | Current State | Target State |                                                                              
  |--------|---------------|--------------|                                                                              
  | Districts with Democratic candidates | \~40 of 124 House | 80+ of 124 House |                                         
  | Competitive races identified | Historical margins only | Turnout-adjusted projections |                              
  | Down-ballot coverage | State legislature only | All elected positions |                                              
  | Data freshness | Manual updates | Live API integration |                                                             
  | User actionability | View-only | Export, recruit, mobilize |                                                         
                                                                                                                         
  \---                                                                                                                    
                                                                                                                         
  \#\# Part 2: Strategic Context                                                                                           
                                                                                                                         
  \#\#\# 2.1 The Political Landscape                                                                                        
                                                                                                                         
  \*\*South Carolina 2026 Election Cycle\*\*:                                                                                
  \- All 124 House seats on ballot                                                                                        
  \- \~23 of 46 Senate seats on ballot (staggered terms)                                                                   
  \- Governor, Attorney General, other statewide offices                                                                  
  \- County offices, school boards, special districts                                                                     
                                                                                                                         
  \*\*Democratic Opportunities\*\*:                                                                                          
  \- Suburban districts trending toward Democrats                                                                         
  \- Open seats where incumbents retire                                                                                   
  \- Districts with narrow Republican margins (\<15 points)                                                                
  \- Down-ballot races with no Republican opposition                                                                      
                                                                                                                         
  \#\#\# 2.2 The Dual-Purpose Strategy                                                                                      
                                                                                                                         
  The tool operates on two levels:                                                                                       
                                                                                                                         
  \*\*Public Layer\*\* (Voter-Facing):                                                                                       
  \- Clean, professional, neutral-appearing interface                                                                     
  \- Comprehensive ballot information for any SC address                                                                  
  \- No overt partisan branding                                                                                           
  \- Builds trust and drives traffic                                                                                      
                                                                                                                         
  \*\*Strategic Layer\*\* (Party Operations):                                                                                
  \- Opportunity scoring algorithms (hidden from casual view)                                                             
  \- Recruitment pipeline identification                                                                                  
  \- Mobilization universe calculations                                                                                   
  \- Endorsement tracking                                                                                                 
  \- Resource allocation tools                                                                                            
                                                                                                                         
  \#\#\# 2.3 Key Stakeholders                                                                                               
                                                                                                                         
  | Stakeholder | Primary Needs | Features Serving Them |                                                                
  |-------------|---------------|----------------------|                                                                 
  | SC Democratic Party | Statewide strategy, resource allocation | Opportunity tiers, recruitment pipeline |            
  | House/Senate Caucus | Incumbent protection, pickup identification | Defensive flagging, competitive race analysis    
  |                                                                                                                      
  | Individual Campaigns | Voter data, fundraising leads | Electorate profiles, donor intelligence |                     
  | General Voters | Ballot information | Voter guide, polling places |                                                  
  | Potential Candidates | Filing info, district viability | Recruitment gap finder, eligibility requirements |          
                                                                                                                         
  \---                                                                                                                    
                                                                                                                         
  \#\# Part 3: Current State (Foundation)                                                                                  
                                                                                                                         
  \#\#\# 3.1 What Exists Today                                                                                              
                                                                                                                         
  \*\*Live URL\*\*: https://russellteter.github.io/sc-election-map-2026/                                                     
                                                                                                                         
  \*\*Core Features\*\*:                                                                                                     
  1\. \*\*Interactive District Map\*\* \- 170 clickable districts (124 House \+ 46 Senate)                                      
  2\. \*\*Voter Guide\*\* \- Address-based personalized ballot lookup                                                          
  3\. \*\*Race Detail Pages\*\* \- Historical data, incumbents, candidates                                                     
  4\. \*\*Strategic Opportunities\*\* \- Tier-based district classification                                                    
  5\. \*\*Table View\*\* \- Sortable/filterable data export                                                                    
                                                                                                                         
  \*\*Current Data Sources\*\*:                                                                                              
  | Source | Data Provided | Update Method |                                                                             
  |--------|---------------|---------------|                                                                             
  | SC Ethics Commission | Candidate filings, names, dates | Manual scrape |                                             
  | kjatwood SCHouseMap7.0 | Democratic candidate verification | Manual merge |                                          
  | SC Election Commission | Historical results (2020-2024) | Manual compilation |                                       
  | Geoapify | Address geocoding | Live API |                                                                            
  | GeoJSON Boundaries | District polygons | Static files |                                                              
                                                                                                                         
  \#\#\# 3.2 Technical Architecture                                                                                         
                                                                                                                         
  \*\*Stack\*\*:                                                                                                             
  \- Next.js 16.1.1 \+ React 19.2.3                                                                                        
  \- TypeScript (strict mode)                                                                                             
  \- Tailwind CSS v4 \+ Glassmorphic design system                                                                         
  \- Static export to GitHub Pages                                                                                        
                                                                                                                         
  \*\*Data Loading Strategy\*\* (3-Tier Progressive):                                                                        
  \`\`\`                                                                                                                    
  Tier 1 (Critical, 6.5KB): election-dates, statewide-races                                                              
  ↓ Loaded immediately                                                                                                   
  Tier 2 (On-Demand, 95KB): candidates, congress, county                                                                 
  ↓ Loaded after user action                                                                                             
  Tier 3 (Deferred, 30KB): judicial, school-board, special-districts                                                     
  ↓ Lazy loaded on scroll                                                                                                
  \`\`\`                                                                                                                    
                                                                                                                         
  \*\*Performance\*\*:                                                                                                       
  \- Build time: 6.7 seconds                                                                                              
  \- Bundle size: 2.0MB total                                                                                             
  \- Initial payload: 6.5KB (98.7% reduction from full load)                                                              
  \- 177 pre-rendered static pages                                                                                        
                                                                                                                         
  \#\#\# 3.3 Key Files & Locations                                                                                          
                                                                                                                         
  | Purpose | Location |                                                                                                 
  |---------|----------|                                                                                                 
  | Type definitions | \`src/types/schema.ts\` (730 lines) |                                                               
  | Data loading | \`src/lib/dataLoader.ts\` |                                                                             
  | District lookup | \`src/lib/districtLookup.ts\` |                                                                      
  | Constants | \`src/lib/constants.ts\` |                                                                                 
  | Main pages | \`src/app/\` (page.tsx, voter-guide/, opportunities/, race/) |                                            
  | Components | \`src/components/\` (Map, Dashboard, VoterGuide, Race, Intelligence) |                                    
  | Static data | \`public/data/\*.json\` |                                                                                 
  | GeoJSON | \`public/data/\*.geojson\` |                                                                                  
                                                                                                                         
  \#\#\# 3.4 Existing Strategic Features                                                                                    
                                                                                                                         
  \*\*Opportunity Scoring\*\* (in \`opportunity.json\`):                                                                       
  \`\`\`typescript                                                                                                          
  {                                                                                                                      
  opportunityScore: 0-100,                                                                                               
  tier: 'HIGH\_OPPORTUNITY' | 'EMERGING' | 'BUILD' | 'DEFENSIVE' | 'NON\_COMPETITIVE',                                     
  factors: {                                                                                                             
  competitiveness: number,                                                                                               
  marginTrend: number,                                                                                                   
  incumbency: number,                                                                                                    
  candidatePresence: number,                                                                                             
  openSeatBonus: number                                                                                                  
  },                                                                                                                     
  flags: {                                                                                                               
  needsCandidate: boolean,                                                                                               
  openSeat: boolean,                                                                                                     
  trendingDem: boolean,                                                                                                  
  swingDistrict: boolean                                                                                                 
  }                                                                                                                      
  }                                                                                                                      
  \`\`\`                                                                                                                    
                                                                                                                         
  \*\*Color Coding\*\* (Democratic-strategic):                                                                               
  \- Dark Blue (\#1E40AF): Democratic incumbent \- PROTECT                                                                  
  \- Medium Blue (\#3B82F6): Democratic challenger filed \- SUPPORT                                                         
  \- Crosshatch: Close race, no Democrat \- RECRUIT                                                                        
  \- Light Gray: Safe Republican \- DEPRIORITIZE                                                                           
                                                                                                                         
  \---                                                                                                                    
                                                                                                                         
  \#\# Part 4: The Transformation (API Integration)                                                                        
                                                                                                                         
  \#\#\# 4.1 The Two Data Powerhouses                                                                                       
                                                                                                                         
  We now have access to two transformative political data APIs that unlock capabilities far beyond what manual data      
  collection can achieve.                                                                                                
                                                                                                                         
  \#\#\#\# BallotReady API (CivicEngine)                                                                                     
                                                                                                                         
  \*\*What It Is\*\*: The most comprehensive database of U.S. elections and elected officials.                               
                                                                                                                         
  \*\*Authentication\*\*: API Key via \`x-api-key\` header                                                                     
  \*\*Base URL\*\*: \`https://api.civicengine.com\`                                                                            
  \*\*API Key\*\*: \`97e9a47f-c12b-b1ce-8a89-e1ecb1cd4131\`                                                                    
                                                                                                                         
  \*\*Key Endpoints\*\*:                                                                                                     
  | Endpoint | Purpose | Strategic Value |                                                                               
  |----------|---------|-----------------|                                                                               
  | \`/elections\` | Election metadata, dates | Timeline intelligence |                                                    
  | \`/positions\` | All elected positions by address | Down-ballot discovery |                                            
  | \`/candidates\` | Profiles, endorsements, photos | Candidate enrichment |                                              
  | \`/polling-places\` | Voting locations | GOTV infrastructure |                                                         
  | \`/officeholders\` | 200K+ current officials | Recruitment pipeline |                                                  
                                                                                                                         
  \*\*Data Available\*\*:                                                                                                    
  \- Candidate profiles with bios, issue stances, endorsements                                                            
  \- Every elected position from local to federal (not just state legislature)                                            
  \- 200,000+ officeholder records (potential candidate pipeline)                                                         
  \- Polling place and early voting information                                                                           
  \- Filing requirements and eligibility info                                                                             
  \- District/subdistrict polygon data                                                                                    
                                                                                                                         
  \*\*Why This Matters for Democrats\*\*:                                                                                    
  1\. \*\*Recruitment\*\*: BallotReady knows every school board member, city councilperson, and county commissioner \- the     
  bench for future state legislative candidates                                                                          
  2\. \*\*Complete Ballot\*\*: Voters see ALL races, increasing engagement                                                    
  3\. \*\*Filing Intelligence\*\*: Know exactly when/how to file for any position                                             
                                                                                                                         
  \---                                                                                                                    
                                                                                                                         
  \#\#\#\# TargetSmart API                                                                                                   
                                                                                                                         
  \*\*What It Is\*\*: The Democratic Party's voter file and modeling platform, used by campaigns nationwide.                 
                                                                                                                         
  \*\*Authentication\*\*: API Key (client-provisioned)                                                                       
  \*\*Base URL\*\*: \`https://api.targetsmart.com\`                                                                            
  \*\*API Key\*\*: \`e0893890-e080-5f98-8ebc-15066c9b1eb7\`                                                                    
                                                                                                                         
  \*\*Key Endpoints\*\*:                                                                                                     
  | Endpoint | Purpose | Strategic Value |                                                                               
  |----------|---------|-----------------|                                                                               
  | \`/voter/voter-registration-check\` | Verify registration | Registration drives |                                      
  | \`/voter/voter-suggest\` | Search voters | Interactive lookup |                                                        
  | \`/person/data-enhance\` | Enrich with models | Targeting intelligence |                                               
  | \`/service/district\` | District lookup | Geographic targeting |                                                       
                                                                                                                         
  \*\*Data Available\*\* (VoterBase \- 208M+ voters):                                                                         
  \- Voter registration status and history                                                                                
  \- Vote history records (who voted when)                                                                                
  \- \*\*Partisan scoring models\*\* (0-100 Democratic lean)                                                                  
  \- \*\*Turnout propensity models\*\* (who will vote)                                                                        
  \- Issue-support models (guns, abortion, education, etc.)                                                               
  \- Demographic data (age, race, income estimates)                                                                       
  \- Political district assignments                                                                                       
  \- \*\*ContributorBase\*\* (6.7B+ in contribution records)                                                                  
  \- Early voting/absentee tracking                                                                                       
                                                                                                                         
  \*\*Why This Matters for Democrats\*\*:                                                                                    
  1\. \*\*Mobilization\*\*: Know exactly which voters to contact in each district                                             
  2\. \*\*Persuasion\*\*: Identify swing voters vs. base voters                                                               
  3\. \*\*Turnout Modeling\*\*: Predict who will actually vote (not just who lives there)                                     
  4\. \*\*Fundraising\*\*: Find donors who gave to similar races                                                              
                                                                                                                         
  \---                                                                                                                    
                                                                                                                         
  \#\#\# 4.2 The Synergy: What Neither API Can Do Alone                                                                     
                                                                                                                         
  The transformative power comes from \*\*combining\*\* these data sources:                                                  
                                                                                                                         
  | Capability | BallotReady Alone | TargetSmart Alone | Combined |                                                      
  |------------|-------------------|-------------------|----------|                                                      
  | Find candidates for empty races | Position data only | Voter data only | Position \+ donor/activist data \=            
  recruitment pipeline |                                                                                                 
  | Predict competitiveness | Filing deadlines | Historical turnout | Filing \+ turnout models \= real projections |       
  | Allocate resources | Race count by area | Voter universes | Race density × voter universes \= optimal deployment |    
  | Build candidate pipeline | Current officeholders | Past donors | Officeholders \+ their donor networks \=              
  recruit-ready candidates |                                                                                             
                                                                                                                         
  \#\#\# 4.3 Five High-Value Combined Use Cases                                                                             
                                                                                                                         
  \*\*MUST HAVE (Critical for 2026)\*\*:                                                                                     
                                                                                                                         
  1\. \*\*Precision Candidate Recruitment Pipeline\*\*                                                                        
  \- Problem: 84 of 124 House districts have no Democratic candidate                                                      
  \- Solution: BallotReady identifies local Democratic officeholders (school board, city council) \+ TargetSmart           
  identifies their donor networks and activist history                                                                   
  \- Output: Ranked list of potential candidates with viability scores                                                    
                                                                                                                         
  2\. \*\*Turnout-Adjusted Opportunity Scoring\*\*                                                                            
  \- Problem: Current scores use backward-looking historical margins                                                      
  \- Solution: TargetSmart turnout models \+ BallotReady ballot depth \= predictive competitiveness                         
  \- Output: Districts that LOOK Republican but have sleeping Democratic electorates                                      
                                                                                                                         
  \*\*SHOULD HAVE (Significant Value)\*\*:                                                                                   
                                                                                                                         
  3\. \*\*Resource Optimizer\*\*                                                                                              
  \- Combine persuadable/mobilization universes with race density                                                         
  \- Answer: "Where should our 10 field organizers go?"                                                                   
                                                                                                                         
  4\. \*\*Down-Ballot Ecosystem Map\*\*                                                                                       
  \- Map Democratic strength at ALL levels                                                                                
  \- Build long-term pipeline, not just 2026 wins                                                                         
                                                                                                                         
  \*\*NICE TO HAVE (Party Operations)\*\*:                                                                                   
                                                                                                                         
  5\. \*\*Donor-Candidate Matchmaking\*\*                                                                                     
  \- Connect new candidates with donors who gave to similar races                                                         
                                                                                                                         
  \---                                                                                                                    
                                                                                                                         
  \#\# Part 5: Implementation Roadmap                                                                                      
                                                                                                                         
  \#\#\# 5.1 Phased Approach Overview                                                                                       
                                                                                                                         
  \`\`\`                                                                                                                    
  ┌─────────────────────────────────────────────────────────────────────────┐                                            
  │                    IMPLEMENTATION TIMELINE                               │                                           
  ├─────────────────────────────────────────────────────────────────────────┤                                            
  │  TIER 1: Foundation          │  TIER 2: Intelligence                    │                                            
  │  Weeks 1-3                   │  Weeks 4-8                               │                                            
  │  ─────────────────────────── │  ─────────────────────────────────────── │                                            
  │  • API clients \+ auth        │  • Recruitment pipeline                  │                                            
  │  • Election timeline         │  • Electorate profiles                   │                                            
  │  • Polling place finder      │  • Mobilization scoring                  │                                            
  ├─────────────────────────────────────────────────────────────────────────┤                                            
  │  TIER 3: Enrichment          │  TIER 4: Advanced                        │                                            
  │  Weeks 9-12                  │  Post-Launch                             │                                            
  │  ─────────────────────────── │  ─────────────────────────────────────── │                                            
  │  • Candidate enrichment      │  • Early vote tracking                   │                                            
  │  • Turnout-adjusted scores   │  • Resource optimizer                    │                                            
  │  • Endorsement dashboard     │  • Down-ballot ecosystem                 │                                            
  └─────────────────────────────────────────────────────────────────────────┘                                            
  \`\`\`                                                                                                                    
                                                                                                                         
  \#\#\# 5.2 Tier 1: Foundation (Weeks 1-3)                                                                                 
                                                                                                                         
  \*\*Goal\*\*: Establish API infrastructure \+ quick voter-facing wins                                                       
                                                                                                                         
  \#\#\#\# Feature 1.1: API Integration Layer                                                                                
  \*\*Files to Create\*\*:                                                                                                   
  \- \`src/lib/ballotready.ts\` \- BallotReady API client                                                                    
  \- \`src/lib/targetsmart.ts\` \- TargetSmart API client                                                                    
  \- \`src/types/ballotready.d.ts\` \- Type definitions                                                                      
  \- \`src/types/targetsmart.d.ts\` \- Type definitions                                                                      
  \- \`.env.local\` \- API credentials (gitignored)                                                                          
                                                                                                                         
  \*\*Implementation\*\*:                                                                                                    
  \`\`\`typescript                                                                                                          
  // src/lib/ballotready.ts                                                                                              
  const BALLOTREADY\_BASE \= 'https://api.civicengine.com';                                                                
  const API\_KEY \= process.env.NEXT\_PUBLIC\_BALLOTREADY\_KEY;                                                               
                                                                                                                         
  export async function getPositionsByAddress(address: string) {                                                         
  const response \= await fetch(\`${BALLOTREADY\_BASE}/positions?address=${encodeURIComponent(address)}\`, {                 
  headers: { 'x-api-key': API\_KEY }                                                                                      
  });                                                                                                                    
  return response.json();                                                                                                
  }                                                                                                                      
  \`\`\`                                                                                                                    
                                                                                                                         
  \#\#\#\# Feature 1.2: Election Timeline Enhancement                                                                        
  \- Replace static \`election-dates.json\` with BallotReady live data                                                      
  \- Add countdown components to key dates                                                                                
  \- Calendar export (ICS format) for voter reminders                                                                     
                                                                                                                         
  \#\#\#\# Feature 1.3: Polling Place Finder                                                                                 
  \- New component: \`src/components/VoterGuide/PollingPlaceFinder.tsx\`                                                    
  \- Add to Voter Guide after address lookup                                                                              
  \- Display early voting locations \+ hours                                                                               
  \- Driving directions link (Google Maps)                                                                                
                                                                                                                         
  \---                                                                                                                    
                                                                                                                         
  \#\#\# 5.3 Tier 2: Strategic Intelligence (Weeks 4-8)                                                                     
                                                                                                                         
  \*\*Goal\*\*: Core campaign value \- recruitment and mobilization                                                           
                                                                                                                         
  \#\#\#\# Feature 2.1: Candidate Recruitment Gap Finder                                                                     
  \*\*The Problem\*\*: 84 of 124 House districts have no Democratic candidate                                                
                                                                                                                         
  \*\*Solution\*\*:                                                                                                          
  \- New "Recruit" tab on \`/opportunities\` page                                                                           
  \- Filter: \`hasDemocrat: false\` AND \`opportunityScore \>= 50\`                                                            
  \- Display from BallotReady: filing requirements, deadlines, eligibility                                                
  \- Display from TargetSmart: nearby Democratic officeholders, their donor networks                                      
                                                                                                                         
  \*\*Files to Modify\*\*:                                                                                                   
  \- \`src/app/opportunities/page.tsx\` \- Add recruitment view                                                              
  \- \`src/components/Intelligence/RecruitmentPipeline.tsx\` \- New component                                                
                                                                                                                         
  \#\#\#\# Feature 2.2: District Electorate Profiles                                                                         
  \- Pre-compute aggregated TargetSmart data per district (privacy-safe)                                                  
  \- Store in \`public/data/voter-intelligence/house-profiles.json\`                                                        
  \- Display: Partisan breakdown, turnout propensity distribution, demographics                                           
                                                                                                                         
  \#\#\#\# Feature 2.3: Mobilization Opportunity Scores                                                                      
  \- Add \`mobilizationUniverse\` metric to opportunity scoring                                                             
  \- Identify "sleeping giant" districts (low turnout, high Dem lean)                                                     
  \- Integrate into strategic recommendations                                                                             
                                                                                                                         
  \---                                                                                                                    
                                                                                                                         
  \#\#\# 5.4 Tier 3: Enrichment (Weeks 9-12)                                                                                
                                                                                                                         
  \*\*Goal\*\*: Full data integration \+ enhanced features                                                                    
                                                                                                                         
  \#\#\#\# Feature 3.1: Candidate Profile Enrichment                                                                         
  \- Enhance \`CandidateCard\` with BallotReady data                                                                        
  \- Add: photos, bios, endorsements, issue stances                                                                       
  \- Link to campaign websites, social media                                                                              
                                                                                                                         
  \#\#\#\# Feature 3.2: Turnout-Adjusted Opportunity Scoring                                                                 
  \`\`\`                                                                                                                    
  Adjusted\_Score \= Historical\_Margin \+                                                                                   
  (TargetSmart\_Turnout\_Differential × Weight) \+                                                                          
  (BallotReady\_Ballot\_Depth × Weight)                                                                                    
  \`\`\`                                                                                                                    
  \- Districts that LOOK Republican may be competitive with right turnout                                                 
                                                                                                                         
  \#\#\#\# Feature 3.3: Endorsement Dashboard                                                                                
  \- Track which candidates have endorsements (from BallotReady)                                                          
  \- Gap analysis: which candidates need endorsements                                                                     
  \- Endorser database (Democratic-aligned organizations)                                                                 
                                                                                                                         
  \---                                                                                                                    
                                                                                                                         
  \#\#\# 5.5 Tier 4: Advanced (Post-Launch)                                                                                 
                                                                                                                         
  \*\*Goal\*\*: Party operations \+ election season features                                                                  
                                                                                                                         
  \- \*\*Early Vote Tracking\*\*: Real-time absentee/early vote returns by district                                           
  \- \*\*Resource Optimizer\*\*: Where to deploy field staff based on combined data                                           
  \- \*\*Down-Ballot Ecosystem Map\*\*: Democratic strength at all levels                                                     
                                                                                                                         
  \---                                                                                                                    
                                                                                                                         
  \#\# Part 6: Technical Specifications                                                                                    
                                                                                                                         
  \#\#\# 6.1 Architecture Decision: Hybrid Static \+ Dynamic                                                                 
                                                                                                                         
  \`\`\`                                                                                                                    
  ┌─────────────────────────────────────────────────────────────────────────┐                                            
  │                         SC Election Map Architecture                     │                                           
  ├─────────────────────────────────────────────────────────────────────────┤                                            
  │                                                                          │                                           
  │  ┌─────────────────────────┐    ┌─────────────────────────┐            │                                             
  │  │   STATIC DATA           │    │   DYNAMIC API CALLS     │            │                                             
  │  │   (GitHub Pages)        │    │   (On-Demand)           │            │                                             
  │  ├─────────────────────────┤    ├─────────────────────────┤            │                                             
  │  │ • GeoJSON boundaries    │    │ • Polling place lookup  │            │                                             
  │  │ • Historical elections  │    │ • Election timeline     │            │                                             
  │  │ • Pre-computed scores   │    │ • Voter registration    │            │                                             
  │  │ • Aggregated profiles   │    │ • Candidate enrichment  │            │                                             
  │  │ • Base candidate data   │    │ • Real-time updates     │            │                                             
  │  └─────────────────────────┘    └─────────────────────────┘            │                                             
  │                                                                          │                                           
  │  Decision: Client-side API keys (simpler, stays on GitHub Pages)        │                                            
  │  Rationale: Read-only public data, acceptable exposure                   │                                           
  └─────────────────────────────────────────────────────────────────────────┘                                            
  \`\`\`                                                                                                                    
                                                                                                                         
  \#\#\# 6.2 Files to Create                                                                                                
                                                                                                                         
  \`\`\`                                                                                                                    
  src/lib/                                                                                                               
  ├── ballotready.ts         \# BallotReady API client with caching                                                       
  ├── targetsmart.ts         \# TargetSmart API client with caching                                                       
  └── voterIntelligence.ts   \# Aggregation and scoring utilities                                                         
                                                                                                                         
  src/types/                                                                                                             
  ├── ballotready.d.ts       \# BallotReady response types                                                                
  └── targetsmart.d.ts       \# TargetSmart response types                                                                
                                                                                                                         
  src/components/Intelligence/                                                                                           
  ├── ElectorateProfile.tsx  \# District voter composition display                                                        
  ├── MobilizationCard.tsx   \# Mobilization opportunity display                                                          
  └── RecruitmentPipeline.tsx \# Candidate recruitment interface                                                          
                                                                                                                         
  src/components/VoterGuide/                                                                                             
  ├── PollingPlaceFinder.tsx \# Polling place lookup \+ map                                                                
  └── ElectionCountdown.tsx  \# Countdown timers to key dates                                                             
                                                                                                                         
  public/data/voter-intelligence/                                                                                        
  ├── house-profiles.json    \# Pre-computed House district profiles                                                      
  ├── senate-profiles.json   \# Pre-computed Senate district profiles                                                     
  └── mobilization-scores.json \# Mobilization opportunity scores                                                         
  \`\`\`                                                                                                                    
                                                                                                                         
  \#\#\# 6.3 Files to Modify                                                                                                
                                                                                                                         
  | File | Changes |                                                                                                     
  |------|---------|                                                                                                     
  | \`src/types/schema.ts\` | Add BallotReady/TargetSmart interfaces |                                                     
  | \`src/lib/dataLoader.ts\` | Integrate API calls into tier system |                                                     
  | \`src/lib/constants.ts\` | Add API endpoints, new data file paths |                                                    
  | \`src/app/opportunities/page.tsx\` | Add Recruitment tab, new metrics |                                                
  | \`src/app/voter-guide/page.tsx\` | Add polling place, election countdown |                                             
  | \`src/components/Dashboard/CandidateCard.tsx\` | Enrich with BallotReady data |                                        
  | \`src/components/Race/StrategicInsights.tsx\` | Add voter intelligence display |                                       
  | \`.env.local\` | Store API credentials |                                                                               
  | \`.env.example\` | Document required variables |                                                                       
                                                                                                                         
  \#\#\# 6.4 API Credentials                                                                                                
                                                                                                                         
  \*\*Store in \`.env.local\`\*\* (gitignored by default):                                                                     
  \`\`\`env                                                                                                                 
  NEXT\_PUBLIC\_BALLOTREADY\_KEY=97e9a47f-c12b-b1ce-8a89-e1ecb1cd4131                                                       
  NEXT\_PUBLIC\_TARGETSMART\_KEY=e0893890-e080-5f98-8ebc-15066c9b1eb7                                                       
  \`\`\`                                                                                                                    
                                                                                                                         
  \#\#\# 6.5 Data Refresh Strategy                                                                                          
                                                                                                                         
  | Data Type | Frequency | Storage | Rationale |                                                                        
  |-----------|-----------|---------|-----------|                                                                        
  | Election dates | Daily | API call | Deadlines change |                                                               
  | Candidate profiles | 6-hour cache | API \+ cache | Balance freshness/cost |                                           
  | Polling places | 1-hour cache | API call | Location-sensitive |                                                      
  | Voter aggregates | Weekly batch | Static JSON | Privacy \+ performance |                                              
  | Early vote tracking | Daily (season) | API call | Time-sensitive |                                                   
                                                                                                                         
  \---                                                                                                                    
                                                                                                                         
  \#\# Part 7: Operational Guidelines for Claude Code                                                                      
                                                                                                                         
  \#\#\# 7.1 Mission Alignment                                                                                              
                                                                                                                         
  \*\*ALWAYS REMEMBER\*\*: This tool exists to help Democrats win more elections in South Carolina. Every feature, every     
  decision, every line of code should serve this mission.                                                                
                                                                                                                         
  \*\*When implementing features, ask yourself\*\*:                                                                          
  1\. Does this help identify competitive districts?                                                                      
  2\. Does this help recruit candidates?                                                                                  
  3\. Does this help mobilize voters?                                                                                     
  4\. Does this help allocate resources efficiently?                                                                      
                                                                                                                         
  If the answer is "no" to all four, reconsider the feature.                                                             
                                                                                                                         
  \#\#\# 7.2 Design Principles                                                                                              
                                                                                                                         
  \*\*DO\*\*:                                                                                                                
  \- Maintain the professional, neutral-appearing public interface                                                        
  \- Prioritize Democratic-strategic features in the background                                                           
  \- Follow existing component patterns (see \`src/components/ui/\`)                                                        
  \- Use the established type system (\`src/types/schema.ts\`)                                                              
  \- Leverage the 3-tier data loading strategy                                                                            
  \- Keep mobile performance optimized (initial payload \<10KB)                                                            
                                                                                                                         
  \*\*DON'T\*\*:                                                                                                             
  \- Add overt Democratic branding to public-facing UI                                                                    
  \- Expose opportunity scoring algorithms prominently                                                                    
  \- Break the existing glassmorphic design system                                                                        
  \- Introduce new dependencies without clear justification                                                               
  \- Create one-off components that don't follow patterns                                                                 
  \- Add features that don't serve the core mission                                                                       
                                                                                                                         
  \#\#\# 7.3 Code Patterns to Follow                                                                                        
                                                                                                                         
  \*\*Component Creation\*\*:                                                                                                
  \`\`\`typescript                                                                                                          
  // Follow this pattern for new components                                                                              
  interface ComponentProps extends HTMLAttributes\<HTMLDivElement\> {                                                      
  variant?: 'default' | 'highlighted' | 'muted';                                                                         
  // ... props                                                                                                           
  }                                                                                                                      
                                                                                                                         
  const variantStyles: Record\<string, string\> \= {                                                                        
  default: '...',                                                                                                        
  highlighted: '...',                                                                                                    
  muted: '...',                                                                                                          
  };                                                                                                                     
                                                                                                                         
  export function Component({ variant \= 'default', ...props }: ComponentProps) {                                         
  return \<div className={variantStyles\[variant\]} {...props} /\>;                                                          
  }                                                                                                                      
  \`\`\`                                                                                                                    
                                                                                                                         
  \*\*Data Loading\*\*:                                                                                                      
  \`\`\`typescript                                                                                                          
  // Use the dataLoader singleton                                                                                        
  import { dataLoader } from '@/lib/dataLoader';                                                                         
                                                                                                                         
  // For new API integrations                                                                                            
  const data \= await dataLoader.loadWithCache('key', async () \=\> {                                                       
  const response \= await fetch(url, { headers });                                                                        
  return response.json();                                                                                                
  }, { ttl: 3600000 }); // 1 hour cache                                                                                  
  \`\`\`                                                                                                                    
                                                                                                                         
  \*\*Type Definitions\*\*:                                                                                                  
  \`\`\`typescript                                                                                                          
  // Add to src/types/schema.ts, grouped by domain                                                                       
  // Election Intelligence Types                                                                                         
  export interface ElectorateProfile {                                                                                   
  districtNumber: number;                                                                                                
  partisanComposition: {                                                                                                 
  democratic: number;                                                                                                    
  republican: number;                                                                                                    
  independent: number;                                                                                                   
  };                                                                                                                     
  turnoutPropensity: {                                                                                                   
  high: number;                                                                                                          
  medium: number;                                                                                                        
  low: number;                                                                                                           
  };                                                                                                                     
  mobilizationUniverse: number;                                                                                          
  }                                                                                                                      
  \`\`\`                                                                                                                    
                                                                                                                         
  \#\#\# 7.4 Quality Gates                                                                                                  
                                                                                                                         
  \*\*Before Committing\*\*:                                                                                                 
  \- \[ \] TypeScript compiles without errors                                                                               
  \- \[ \] ESLint passes                                                                                                    
  \- \[ \] Feature serves the Democratic mission                                                                            
  \- \[ \] Mobile performance not degraded                                                                                  
  \- \[ \] Follows existing patterns                                                                                        
                                                                                                                         
  \*\*Before Deploying\*\*:                                                                                                  
  \- \[ \] Test on mobile viewport (375px)                                                                                  
  \- \[ \] Verify API calls work with real credentials                                                                      
  \- \[ \] Check that strategic features don't leak to public UI                                                            
  \- \[ \] Confirm data freshness is appropriate                                                                            
                                                                                                                         
  \#\#\# 7.5 What NOT to Do                                                                                                 
                                                                                                                         
  1\. \*\*Don't drift from the mission\*\*: This is a Democratic campaign tool, not a neutral voter resource                  
  2\. \*\*Don't over-engineer\*\*: Solve the problem at hand, not hypothetical futures                                        
  3\. \*\*Don't expose strategy\*\*: Opportunity scoring, mobilization universes stay hidden                                  
  4\. \*\*Don't break mobile\*\*: Many users will access on phones                                                            
  5\. \*\*Don't add unnecessary dependencies\*\*: Keep the bundle lean                                                        
  6\. \*\*Don't create technical debt\*\*: Follow patterns, write clean code                                                  
                                                                                                                         
  \---                                                                                                                    
                                                                                                                         
  \#\# Part 8: Verification & Testing                                                                                      
                                                                                                                         
  \#\#\# 8.1 Phase Verification Checklists                                                                                  
                                                                                                                         
  \*\*Tier 1 Complete When\*\*:                                                                                              
  \- \[ \] API clients authenticate successfully to both BallotReady and TargetSmart                                        
  \- \[ \] Election timeline displays live data from BallotReady                                                            
  \- \[ \] Polling place finder returns results for any SC address                                                          
  \- \[ \] Build still completes in \<10 seconds                                                                             
  \- \[ \] No TypeScript errors                                                                                             
                                                                                                                         
  \*\*Tier 2 Complete When\*\*:                                                                                              
  \- \[ \] Recruitment pipeline shows correct empty competitive districts                                                   
  \- \[ \] Electorate profiles display for all 170 districts                                                                
  \- \[ \] Mobilization scores integrate into opportunity tiers                                                             
  \- \[ \] Export includes new fields                                                                                       
                                                                                                                         
  \*\*Tier 3 Complete When\*\*:                                                                                              
  \- \[ \] Candidate cards show enriched BallotReady profiles                                                               
  \- \[ \] Turnout-adjusted scores differ from historical-only                                                              
  \- \[ \] Endorsement dashboard populates correctly                                                                        
                                                                                                                         
  \#\#\# 8.2 End-to-End Test Script                                                                                         
                                                                                                                         
  1\. \*\*Voter Flow\*\*:                                                                                                     
  \- Enter SC address: "123 Main St, Columbia, SC 29201"                                                                  
  \- Verify: All races display (expanded via BallotReady)                                                                 
  \- Verify: Polling place shows with directions link                                                                     
  \- Verify: Election countdown displays key dates                                                                        
                                                                                                                         
  2\. \*\*Strategist Flow\*\*:                                                                                                
  \- Navigate to \`/opportunities\`                                                                                         
  \- Click "Recruit" tab                                                                                                  
  \- Verify: Districts with \`hasDemocrat: false\` and \`score \>= 50\` displayed                                              
  \- Verify: Filing requirements shown for each district                                                                  
  \- Export CSV → verify new mobilization fields included                                                                 
                                                                                                                         
  3\. \*\*Race Detail Flow\*\*:                                                                                               
  \- Click any district on map                                                                                            
  \- Verify: Enhanced strategic insights with voter intelligence                                                          
  \- Verify: Candidate cards show BallotReady enrichment (if available)                                                   
                                                                                                                         
  \#\#\# 8.3 Performance Budgets                                                                                            
                                                                                                                         
  | Metric | Target | Current |                                                                                          
  |--------|--------|---------|                                                                                          
  | Initial payload | \<10KB | 6.5KB |                                                                                    
  | Build time | \<15s | 6.7s |                                                                                           
  | Largest JS chunk | \<300KB | 256KB |                                                                                  
  | Total bundle | \<3MB | 2.0MB |                                                                                        
  | FCP | \<1.8s | TBD |                                                                                                  
                                                                                                                         
  \---                                                                                                                    
                                                                                                                         
  \#\# Part 9: Reference Information                                                                                       
                                                                                                                         
  \#\#\# 9.1 API Documentation Links                                                                                        
                                                                                                                         
  \- \[BallotReady API\](https://organizations.ballotready.org/ballotready-api)                                             
  \- \[BallotReady Developer Portal\](https://developers.civicengine.com/)                                                  
  \- \[TargetSmart API Overview\](https://docs.targetsmart.com/developers/tsapis/v2/index.html)                             
  \- \[TargetSmart Data Products\](https://docs.targetsmart.com/my\_tsmart/data-products.html)                               
  \- \[NGPVan Getting Started\](https://docs.ngpvan.com/docs/getting-started)                                               
                                                                                                                         
  \#\#\# 9.2 Project URLs                                                                                                   
                                                                                                                         
  \- \*\*Live Site\*\*: https://russellteter.github.io/sc-election-map-2026/                                                  
  \- \*\*Repository\*\*: (GitHub \- private)                                                                                   
  \- \*\*Data Source\*\*: SC Ethics Commission, kjatwood SCHouseMap7.0                                                        
                                                                                                                         
  \#\#\# 9.3 Key Contacts                                                                                                   
                                                                                                                         
  \- \*\*BallotReady Support\*\*: support@ballotready.org                                                                     
  \- \*\*TargetSmart Support\*\*: (via NGPVan)                                                                                
                                                                                                                         
  \---                                                                                                                    
                                                                                                                         
  \#\# Appendix: Quick Reference Card                                                                                      
                                                                                                                         
  \#\#\# API Credentials                                                                                                    
  \`\`\`                                                                                                                    
  BallotReady: 97e9a47f-c12b-b1ce-8a89-e1ecb1cd4131                                                                      
  TargetSmart: e0893890-e080-5f98-8ebc-15066c9b1eb7                                                                      
  \`\`\`                                                                                                                    
                                                                                                                         
  \#\#\# Key Commands                                                                                                       
  \`\`\`bash                                                                                                                
  \# Development                                                                                                          
  npm run dev                                                                                                            
                                                                                                                         
  \# Build                                                                                                                
  npm run build                                                                                                          
                                                                                                                         
  \# Test                                                                                                                 
  npm run test                                                                                                           
  npm run test:e2e                                                                                                       
  \`\`\`                                                                                                                    
                                                                                                                         
  \#\#\# Critical Files                                                                                                     
  \`\`\`                                                                                                                    
  src/types/schema.ts          \# Type definitions                                                                        
  src/lib/dataLoader.ts        \# Data loading                                                                            
  src/lib/constants.ts         \# Configuration                                                                           
  src/app/opportunities/page.tsx \# Strategy page                                                                         
  src/app/voter-guide/page.tsx   \# Voter guide                                                                           
  \`\`\`                                                                                                                    
                                                                                                                         
  \#\#\# Mission Statement                                                                                                  
  \*\*Help Democrats win more elections in South Carolina.\*\*                                                               
                                                                                                                         
  Every feature serves this goal. Stay focused. Stay strategic. Win seats.                                               
                                                                                                                         
                                                                                                                         
  If you need specific details from before exiting plan mode (like exact code snippets, error messages, or content you   
  generated), read the full transcript at: /Users/russellteter/.claude/projects/-Users-russellteter-Desktop-sc-electi    
  on-map-2026/3dae29c9-eb04-45cb-a379-f64d8a98fd4e.jsonl   
