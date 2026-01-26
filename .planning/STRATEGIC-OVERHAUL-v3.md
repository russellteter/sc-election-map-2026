SC Election Map Strategic Overhaul                                                                                                                                             
                                                                                                                                                                                
 Multi-Lens Visualization System with Google Sheet Data Foundation                                                                                                              
                                                                                                                                                                                
 Project: Transform the SC Election Map from a static display into a dynamic strategic intelligence platform for Democratic campaign operatives.                                
                                                                                                                                                                                
 Date: 2026-01-23                                                                                                                                                               
                                                                                                                                                                                
 \---                                                                                                                                                                            
 Part I: Vision & Purpose                                                                                                                                                       
                                                                                                                                                                                
 The Strategic Problem                                                                                                                                                          
                                                                                                                                                                                
 The current SC Election Map (https://russellteter.github.io/sc-election-map-2026/sc?chamber=house) has a fundamental problem: the map colors don't accurately represent what   
  they claim to represent.                                                                                                                                                      
                                                                                                                                                                                
 Current Broken State:                                                                                                                                                          
 Looking at src/lib/districtColors.ts:62-102, the current getDistrictFillColor() function uses this priority:                                                                   
                                                                                                                                                                                
 // Current (BROKEN) logic:                                                                                                                                                     
 // 1\. isDemIncumbent → \#1E40AF (solid dark blue) \- "Current rep is Democrat"                                                                                                   
 // 2\. hasDemCandidate → \#3B82F6 (medium blue) \- "Dem filed to run"                                                                                                             
 // 3\. No Dem \+ Margin ≤15pts → crosshatch \- "No Dem filed, close race"                                                                                                         
 // 4\. No Dem \+ Margin \>15pts → \#E5E7EB (light gray) \- "Safe R seat"                                                                                                            
                                                                                                                                                                                
 The problem: This shows a Democratic operational view (where Dems have filed), NOT an accurate incumbent party map. When a campaign director first opens this map, they        
 expect to see: "Where do Republicans currently hold seats? Where do Democrats?" Instead, they see a confusing mix of incumbent status AND filing status in the same            
 visualization.                                                                                                                                                                 
                                                                                                                                                                                
 The Legend in src/components/Map/Legend.tsx compounds this confusion by labeling these as:                                                                                     
 \- "Dem Incumbent" \- Current representative is Democrat                                                                                                                         
 \- "Dem Challenger" \- Democrat filed to run                                                                                                                                     
 \- "Close Race" \- No Dem filed, margin ≤15pts                                                                                                                                   
 \- "Safe R Seat" \- No Dem filed, margin \>15pts                                                                                                                                  
                                                                                                                                                                                
 A user looking at "Close Race" (crosshatch) might think: "This seat is currently competitive" when it really means "No Democrat has filed here yet, but the margin was         
 ≤15pts in past elections."                                                                                                                                                     
                                                                                                                                                                                
 The Strategic Solution: Lens-Based Visualization                                                                                                                               
                                                                                                                                                                                
 The solution is to recognize that Democratic operatives need to view the same 170 districts through multiple strategic lenses, each answering a different question:            
 ┌──────────────────────┬─────────────────────────────────────────────────────────┬─────────────────────────────────────────────────────────┐                                   
 │         Lens         │                   Question It Answers                   │                        Use Case                         │                                   
 ├──────────────────────┼─────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────┤                                   
 │ Incumbents (Default) │ "Who currently holds each seat?"                        │ Baseline orientation, identifying current party control │                                   
 ├──────────────────────┼─────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────┤                                   
 │ Dem Filing Progress  │ "Where have Democrats filed to challenge?"              │ Recruiting, tracking filing progress                    │                                   
 ├──────────────────────┼─────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────┤                                   
 │ Opportunity Zones    │ "Where should we invest resources based on margin?"     │ Resource allocation, targeting                          │                                   
 ├──────────────────────┼─────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────┤                                   
 │ Battleground Races   │ "Which races have both candidates and are competitive?" │ Competitive race monitoring                             │                                   
 └──────────────────────┴─────────────────────────────────────────────────────────┴─────────────────────────────────────────────────────────┘                                   
 Each lens uses the same underlying data but colorizes districts differently to answer its specific strategic question.                                                         
                                                                                                                                                                                
 Why Google Sheets as Source of Truth?                                                                                                                                          
                                                                                                                                                                                
 The SC Democratic Party maintains a Google Sheet called "Challenge every seat 2026" that is:                                                                                   
 1\. Updated daily by field staff as they recruit candidates                                                                                                                     
 2\. Authoritative for incumbent information (which the Ethics Commission doesn't provide)                                                                                       
 3\. Strategic \- contains margin data and filing status tracked by the party                                                                                                     
                                                                                                                                                                                
 Spreadsheet Details:                                                                                                                                                           
 \- ID: 17j\_KFZFUw-ESBQlKlIccUMpGCFq\_XdeL6WYph7zkxQo                                                                                                                             
 \- Tab: "Desired Source of Truth"                                                                                                                                               
 \- 170 rows: 124 House \+ 46 Senate districts                                                                                                                                    
                                                                                                                                                                                
 Key Columns:                                                                                                                                                                   
 ┌────────┬─────────────────────────┬────────────────────────────────┐                                                                                                          
 │ Column │          Field          │            Purpose             │                                                                                                          
 ├────────┼─────────────────────────┼────────────────────────────────┤                                                                                                          
 │ A      │ Chamber                 │ "House" or "Senate"            │                                                                                                          
 ├────────┼─────────────────────────┼────────────────────────────────┤                                                                                                          
 │ B      │ District Number         │ 1-124 (House) or 1-46 (Senate) │                                                                                                          
 ├────────┼─────────────────────────┼────────────────────────────────┤                                                                                                          
 │ C      │ Incumbent Party         │ "R" or "D"                     │                                                                                                          
 ├────────┼─────────────────────────┼────────────────────────────────┤                                                                                                          
 │ D      │ Incumbent Name          │ Current officeholder           │                                                                                                          
 ├────────┼─────────────────────────┼────────────────────────────────┤                                                                                                          
 │ L      │ 2022 Margin             │ Victory margin (R-D points)    │                                                                                                          
 ├────────┼─────────────────────────┼────────────────────────────────┤                                                                                                          
 │ N      │ Democrat Filed          │ "Y" or "N"                     │                                                                                                          
 ├────────┼─────────────────────────┼────────────────────────────────┤                                                                                                          
 │ P-T    │ Filed Candidate Details │ Name, contact, status          │                                                                                                          
 └────────┴─────────────────────────┴────────────────────────────────┘                                                                                                          
 Why not just use Ethics Commission data?                                                                                                                                       
 \- Ethics filings don't include incumbent information (only challengers filing)                                                                                                 
 \- Ethics filings don't include historical margin data                                                                                                                          
 \- Ethics filings don't track party recruitment status                                                                                                                          
 \- The Sheet is the "single pane of glass" for campaign staff                                                                                                                   
                                                                                                                                                                                
 Merge Strategy: Sheet data is PRIMARY (incumbents, margins, filing status). Ethics Commission data is SUPPLEMENTARY (report IDs, filing URLs, detailed candidate info when     
 available).                                                                                                                                                                    
                                                                                                                                                                                
 \---                                                                                                                                                                            
 Part II: Data Pipeline Architecture                                                                                                                                            
                                                                                                                                                                                
 2.1 Google Sheets Loader Script                                                                                                                                                
                                                                                                                                                                                
 Create: scripts/sheets\_loader.py                                                                                                                                               
                                                                                                                                                                                
 Purpose: Fetch the "Challenge every seat 2026" spreadsheet and convert to JSON.                                                                                                
                                                                                                                                                                                
 Authentication Pattern: Reuse the existing sc-ethics-monitor service account pattern from sc-ethics-monitor/src/sheets\_sync.py. The credentials are already stored as GitHub   
  secrets.                                                                                                                                                                      
                                                                                                                                                                                
 Implementation Details:                                                                                                                                                        
                                                                                                                                                                                
 \# scripts/sheets\_loader.py                                                                                                                                                     
                                                                                                                                                                                
 """                                                                                                                                                                            
 Google Sheets Loader for SC Election Map                                                                                                                                       
                                                                                                                                                                                
 Fetches the "Challenge every seat 2026" spreadsheet and converts to JSON                                                                                                       
 matching the existing candidates.json schema structure.                                                                                                                        
                                                                                                                                                                                
 Authentication: Uses service account credentials from GOOGLE\_CREDENTIALS\_JSON env var                                                                                          
                                                                                                                                                                                
 Column Mapping (from "Desired Source of Truth" tab):                                                                                                                           
   A: chamber ("House" / "Senate")                                                                                                                                              
   B: district\_number (1-124 for House, 1-46 for Senate)                                                                                                                        
   C: incumbent\_party ("R" / "D")                                                                                                                                               
   D: incumbent\_name                                                                                                                                                            
   L: margin\_2022 (numeric, positive \= R advantage)                                                                                                                             
   N: democrat\_filed ("Y" / "N")                                                                                                                                                
   P: dem\_candidate\_name                                                                                                                                                        
   Q: dem\_candidate\_email                                                                                                                                                       
   R: dem\_candidate\_phone                                                                                                                                                       
   S: dem\_candidate\_status                                                                                                                                                      
   T: dem\_candidate\_notes                                                                                                                                                       
 """                                                                                                                                                                            
                                                                                                                                                                                
 import gspread                                                                                                                                                                 
 from google.oauth2.service\_account import Credentials                                                                                                                          
 import json                                                                                                                                                                    
 import os                                                                                                                                                                      
 from datetime import datetime                                                                                                                                                  
 from typing import TypedDict, Optional                                                                                                                                         
                                                                                                                                                                                
 \# Type definitions for output schema                                                                                                                                           
 class Incumbent(TypedDict):                                                                                                                                                    
     name: str                                                                                                                                                                  
     party: str  \# "Democratic" or "Republican"                                                                                                                                 
                                                                                                                                                                                
 class Candidate(TypedDict):                                                                                                                                                    
     name: str                                                                                                                                                                  
     party: str                                                                                                                                                                 
     email: Optional\[str\]                                                                                                                                                       
     phone: Optional\[str\]                                                                                                                                                       
     status: Optional\[str\]                                                                                                                                                      
                                                                                                                                                                                
 class District(TypedDict):                                                                                                                                                     
     districtNumber: int                                                                                                                                                        
     incumbent: Optional\[Incumbent\]                                                                                                                                             
     candidates: list\[Candidate\]                                                                                                                                                
     margin2022: Optional\[float\]                                                                                                                                                
     democratFiled: bool                                                                                                                                                        
                                                                                                                                                                                
 class CandidatesData(TypedDict):                                                                                                                                               
     lastUpdated: str                                                                                                                                                           
     source: str                                                                                                                                                                
     house: dict\[str, District\]                                                                                                                                                 
     senate: dict\[str, District\]                                                                                                                                                
                                                                                                                                                                                
 \# Configuration                                                                                                                                                                
 SPREADSHEET\_ID \= os.environ.get('CHALLENGE\_SHEET\_ID', '17j\_KFZFUw-ESBQlKlIccUMpGCFq\_XdeL6WYph7zkxQo')                                                                          
 TAB\_NAME \= 'Desired Source of Truth'                                                                                                                                           
                                                                                                                                                                                
 \# Column indices (0-based)                                                                                                                                                     
 COL\_CHAMBER \= 0      \# A                                                                                                                                                       
 COL\_DISTRICT \= 1     \# B                                                                                                                                                       
 COL\_INC\_PARTY \= 2    \# C                                                                                                                                                       
 COL\_INC\_NAME \= 3     \# D                                                                                                                                                       
 COL\_MARGIN \= 11      \# L                                                                                                                                                       
 COL\_DEM\_FILED \= 13   \# N                                                                                                                                                       
 COL\_DEM\_NAME \= 15    \# P                                                                                                                                                       
 COL\_DEM\_EMAIL \= 16   \# Q                                                                                                                                                       
 COL\_DEM\_PHONE \= 17   \# R                                                                                                                                                       
 COL\_DEM\_STATUS \= 18  \# S                                                                                                                                                       
                                                                                                                                                                                
 def authenticate():                                                                                                                                                            
     """Authenticate with Google Sheets API using service account."""                                                                                                           
     creds\_json \= os.environ.get('GOOGLE\_CREDENTIALS\_JSON')                                                                                                                     
     if not creds\_json:                                                                                                                                                         
         raise ValueError("GOOGLE\_CREDENTIALS\_JSON environment variable not set")                                                                                               
                                                                                                                                                                                
     creds\_data \= json.loads(creds\_json)                                                                                                                                        
     scopes \= \['https://www.googleapis.com/auth/spreadsheets.readonly'\]                                                                                                         
     credentials \= Credentials.from\_service\_account\_info(creds\_data, scopes=scopes)                                                                                             
     return gspread.authorize(credentials)                                                                                                                                      
                                                                                                                                                                                
 def fetch\_sheet\_data(client) \-\> list\[list\[str\]\]:                                                                                                                               
     """Fetch all rows from the source of truth tab."""                                                                                                                         
     spreadsheet \= client.open\_by\_key(SPREADSHEET\_ID)                                                                                                                           
     worksheet \= spreadsheet.worksheet(TAB\_NAME)                                                                                                                                
     return worksheet.get\_all\_values()                                                                                                                                          
                                                                                                                                                                                
 def parse\_party(raw: str) \-\> str:                                                                                                                                              
     """Convert R/D to full party name."""                                                                                                                                      
     if raw.upper() \== 'D':                                                                                                                                                     
         return 'Democratic'                                                                                                                                                    
     elif raw.upper() \== 'R':                                                                                                                                                   
         return 'Republican'                                                                                                                                                    
     return 'Unknown'                                                                                                                                                           
                                                                                                                                                                                
 def parse\_margin(raw: str) \-\> Optional\[float\]:                                                                                                                                 
     """Parse margin value, handling various formats."""                                                                                                                        
     if not raw or raw.strip() \== '':                                                                                                                                           
         return None                                                                                                                                                            
     try:                                                                                                                                                                       
         \# Remove any non-numeric characters except decimal point and minus                                                                                                     
         cleaned \= ''.join(c for c in raw if c.isdigit() or c in '.-')                                                                                                          
         return float(cleaned)                                                                                                                                                  
     except ValueError:                                                                                                                                                         
         return None                                                                                                                                                            
                                                                                                                                                                                
 def parse\_row(row: list\[str\], row\_idx: int) \-\> Optional\[tuple\[str, District\]\]:                                                                                                 
     """Parse a single row into chamber \+ District data."""                                                                                                                     
     if len(row) \< 4:                                                                                                                                                           
         return None                                                                                                                                                            
                                                                                                                                                                                
     chamber \= row\[COL\_CHAMBER\].strip().lower() if row\[COL\_CHAMBER\] else ''                                                                                                     
     if chamber not in ('house', 'senate'):                                                                                                                                     
         return None                                                                                                                                                            
                                                                                                                                                                                
     try:                                                                                                                                                                       
         district\_num \= int(row\[COL\_DISTRICT\])                                                                                                                                  
     except (ValueError, IndexError):                                                                                                                                           
         print(f"Warning: Invalid district number at row {row\_idx \+ 1}")                                                                                                        
         return None                                                                                                                                                            
                                                                                                                                                                                
     \# Validate district ranges                                                                                                                                                 
     if chamber \== 'house' and not (1 \<= district\_num \<= 124):                                                                                                                  
         print(f"Warning: House district {district\_num} out of range at row {row\_idx \+ 1}")                                                                                     
         return None                                                                                                                                                            
     if chamber \== 'senate' and not (1 \<= district\_num \<= 46):                                                                                                                  
         print(f"Warning: Senate district {district\_num} out of range at row {row\_idx \+ 1}")                                                                                    
         return None                                                                                                                                                            
                                                                                                                                                                                
     \# Parse incumbent                                                                                                                                                          
     incumbent \= None                                                                                                                                                           
     inc\_party \= row\[COL\_INC\_PARTY\].strip() if len(row) \> COL\_INC\_PARTY else ''                                                                                                 
     inc\_name \= row\[COL\_INC\_NAME\].strip() if len(row) \> COL\_INC\_NAME else ''                                                                                                    
     if inc\_party and inc\_name:                                                                                                                                                 
         incumbent \= {                                                                                                                                                          
             'name': inc\_name,                                                                                                                                                  
             'party': parse\_party(inc\_party)                                                                                                                                    
         }                                                                                                                                                                      
                                                                                                                                                                                
     \# Parse Democrat filed                                                                                                                                                     
     dem\_filed\_raw \= row\[COL\_DEM\_FILED\].strip().upper() if len(row) \> COL\_DEM\_FILED else ''                                                                                     
     dem\_filed \= dem\_filed\_raw \== 'Y'                                                                                                                                           
                                                                                                                                                                                
     \# Parse candidates (just Democrat for now from Sheet)                                                                                                                      
     candidates \= \[\]                                                                                                                                                            
     if dem\_filed:                                                                                                                                                              
         dem\_name \= row\[COL\_DEM\_NAME\].strip() if len(row) \> COL\_DEM\_NAME else ''                                                                                                
         if dem\_name:                                                                                                                                                           
             candidates.append({                                                                                                                                                
                 'name': dem\_name,                                                                                                                                              
                 'party': 'Democratic',                                                                                                                                         
                 'email': row\[COL\_DEM\_EMAIL\].strip() if len(row) \> COL\_DEM\_EMAIL else None,                                                                                     
                 'phone': row\[COL\_DEM\_PHONE\].strip() if len(row) \> COL\_DEM\_PHONE else None,                                                                                     
                 'status': row\[COL\_DEM\_STATUS\].strip() if len(row) \> COL\_DEM\_STATUS else None,                                                                                  
             })                                                                                                                                                                 
                                                                                                                                                                                
     \# Parse margin                                                                                                                                                             
     margin \= parse\_margin(row\[COL\_MARGIN\]) if len(row) \> COL\_MARGIN else None                                                                                                  
                                                                                                                                                                                
     district: District \= {                                                                                                                                                     
         'districtNumber': district\_num,                                                                                                                                        
         'incumbent': incumbent,                                                                                                                                                
         'candidates': candidates,                                                                                                                                              
         'margin2022': margin,                                                                                                                                                  
         'democratFiled': dem\_filed                                                                                                                                             
     }                                                                                                                                                                          
                                                                                                                                                                                
     return (chamber, district)                                                                                                                                                 
                                                                                                                                                                                
 def build\_candidates\_data(rows: list\[list\[str\]\]) \-\> CandidatesData:                                                                                                            
     """Build the full candidates data structure from sheet rows."""                                                                                                            
     data: CandidatesData \= {                                                                                                                                                   
         'lastUpdated': datetime.utcnow().isoformat() \+ 'Z',                                                                                                                    
         'source': 'Google Sheets \- Challenge every seat 2026',                                                                                                                 
         'house': {},                                                                                                                                                           
         'senate': {}                                                                                                                                                           
     }                                                                                                                                                                          
                                                                                                                                                                                
     \# Skip header row                                                                                                                                                          
     for idx, row in enumerate(rows\[1:\], start=1):                                                                                                                              
         result \= parse\_row(row, idx)                                                                                                                                           
         if result:                                                                                                                                                             
             chamber, district \= result                                                                                                                                         
             district\_key \= str(district\['districtNumber'\])                                                                                                                     
             data\[chamber\]\[district\_key\] \= district                                                                                                                             
                                                                                                                                                                                
     return data                                                                                                                                                                
                                                                                                                                                                                
 def main():                                                                                                                                                                    
     """Main entry point."""                                                                                                                                                    
     client \= authenticate()                                                                                                                                                    
     rows \= fetch\_sheet\_data(client)                                                                                                                                            
     data \= build\_candidates\_data(rows)                                                                                                                                         
                                                                                                                                                                                
     \# Validation summary                                                                                                                                                       
     house\_count \= len(data\['house'\])                                                                                                                                           
     senate\_count \= len(data\['senate'\])                                                                                                                                         
     print(f"Loaded {house\_count} House districts, {senate\_count} Senate districts")                                                                                            
                                                                                                                                                                                
     if house\_count \!= 124:                                                                                                                                                     
         print(f"WARNING: Expected 124 House districts, got {house\_count}")                                                                                                     
     if senate\_count \!= 46:                                                                                                                                                     
         print(f"WARNING: Expected 46 Senate districts, got {senate\_count}")                                                                                                    
                                                                                                                                                                                
     \# Output                                                                                                                                                                   
     output\_path \= 'scripts/data/sheet-candidates.json'                                                                                                                         
     os.makedirs(os.path.dirname(output\_path), exist\_ok=True)                                                                                                                   
     with open(output\_path, 'w') as f:                                                                                                                                          
         json.dump(data, f, indent=2)                                                                                                                                           
                                                                                                                                                                                
     print(f"Wrote to {output\_path}")                                                                                                                                           
                                                                                                                                                                                
 if \_\_name\_\_ \== '\_\_main\_\_':                                                                                                                                                     
     main()                                                                                                                                                                     
                                                                                                                                                                                
 Output: scripts/data/sheet-candidates.json                                                                                                                                     
                                                                                                                                                                                
 Key Design Decisions:                                                                                                                                                          
 1\. Party names are normalized to full names ("Democratic"/"Republican") to match existing schema                                                                               
 2\. District numbers are validated against known counts (124 House, 46 Senate)                                                                                                  
 3\. Missing data is handled gracefully with Optional types                                                                                                                      
 4\. Output matches existing CandidatesData TypeScript interface                                                                                                                 
                                                                                                                                                                                
 \---                                                                                                                                                                            
 2.2 Data Merge Script                                                                                                                                                          
                                                                                                                                                                                
 Create: scripts/merge\_data.py                                                                                                                                                  
                                                                                                                                                                                
 Purpose: Combine Sheet data (primary) with Ethics Commission data (supplementary) into final candidates.json.                                                                  
                                                                                                                                                                                
 Merge Strategy:                                                                                                                                                                
                                                                                                                                                                                
 ┌─────────────────────────────────────────────────────────────────────┐                                                                                                        
 │                        DATA MERGE STRATEGY                          │                                                                                                        
 ├─────────────────────────────────────────────────────────────────────┤                                                                                                        
 │                                                                     │                                                                                                        
 │  SHEET DATA (Primary)          ETHICS DATA (Supplementary)          │                                                                                                        
 │  ─────────────────────         ────────────────────────────          │                                                                                                       
 │  ✓ Incumbent name/party        ✗ No incumbent info                  │                                                                                                        
 │  ✓ 2022 margin                 ✗ No historical data                 │                                                                                                        
 │  ✓ Democrat filed Y/N          ✓ All filed candidates               │                                                                                                        
 │  ✓ Basic candidate name        ✓ Report IDs, filing URLs            │                                                                                                        
 │                                ✓ Detailed candidate info            │                                                                                                        
 │                                                                     │                                                                                                        
 │  MERGE RESULT                                                       │                                                                                                        
 │  ────────────────                                                   │                                                                                                        
 │  • Incumbent: FROM SHEET (authoritative)                            │                                                                                                        
 │  • Margin: FROM SHEET (tracked by party)                            │                                                                                                        
 │  • Candidates: MERGED (Sheet for filing status, Ethics for details) │                                                                                                        
 │    \- If candidate in both: Ethics details win (more complete)       │                                                                                                        
 │    \- If only in Sheet: Use Sheet data                               │                                                                                                        
 │    \- If only in Ethics: Add to candidate list                       │                                                                                                        
 │                                                                     │                                                                                                        
 └─────────────────────────────────────────────────────────────────────┘                                                                                                        
                                                                                                                                                                                
 Implementation Details:                                                                                                                                                        
                                                                                                                                                                                
 \# scripts/merge\_data.py                                                                                                                                                        
                                                                                                                                                                                
 """                                                                                                                                                                            
 Data Merge Script for SC Election Map                                                                                                                                          
                                                                                                                                                                                
 Merges Google Sheet data (primary) with Ethics Commission data (supplementary)                                                                                                 
 to produce the final candidates.json used by the frontend.                                                                                                                     
                                                                                                                                                                                
 Priority Rules:                                                                                                                                                                
 1\. Incumbent info: Sheet is authoritative (Ethics has no incumbent data)                                                                                                       
 2\. Margin data: Sheet is authoritative (party-tracked)                                                                                                                         
 3\. Candidate list: Merged from both sources                                                                                                                                    
    \- Name matching uses fuzzy comparison (last name match)                                                                                                                     
    \- Ethics details (report IDs, URLs) override Sheet basics when matched                                                                                                      
    \- Candidates only in Ethics are added to list                                                                                                                               
 """                                                                                                                                                                            
                                                                                                                                                                                
 import json                                                                                                                                                                    
 from pathlib import Path                                                                                                                                                       
 from difflib import SequenceMatcher                                                                                                                                            
 from datetime import datetime                                                                                                                                                  
                                                                                                                                                                                
 def normalize\_name(name: str) \-\> str:                                                                                                                                          
     """Normalize name for comparison (lowercase, no punctuation)."""                                                                                                           
     return ''.join(c.lower() for c in name if c.isalnum() or c.isspace()).strip()                                                                                              
                                                                                                                                                                                
 def extract\_last\_name(name: str) \-\> str:                                                                                                                                       
     """Extract last name for fuzzy matching."""                                                                                                                                
     parts \= normalize\_name(name).split()                                                                                                                                       
     return parts\[-1\] if parts else ''                                                                                                                                          
                                                                                                                                                                                
 def names\_match(name1: str, name2: str) \-\> bool:                                                                                                                               
     """Check if two names likely refer to the same person."""                                                                                                                  
     \# Check last name match                                                                                                                                                    
     last1 \= extract\_last\_name(name1)                                                                                                                                           
     last2 \= extract\_last\_name(name2)                                                                                                                                           
     if last1 \== last2 and last1:                                                                                                                                               
         return True                                                                                                                                                            
                                                                                                                                                                                
     \# Full fuzzy match                                                                                                                                                         
     norm1 \= normalize\_name(name1)                                                                                                                                              
     norm2 \= normalize\_name(name2)                                                                                                                                              
     ratio \= SequenceMatcher(None, norm1, norm2).ratio()                                                                                                                        
     return ratio \> 0.8                                                                                                                                                         
                                                                                                                                                                                
 def merge\_candidate(sheet\_candidate: dict, ethics\_candidate: dict) \-\> dict:                                                                                                    
     """Merge a single candidate's data, preferring Ethics details."""                                                                                                          
     merged \= {\*\*sheet\_candidate}  \# Start with Sheet data                                                                                                                      
                                                                                                                                                                                
     \# Ethics fields that should override                                                                                                                                       
     ethics\_fields \= \['reportId', 'reportUrl', 'filingDate', 'committee',                                                                                                       
                      'treasurerName', 'address', 'city', 'state', 'zip'\]                                                                                                       
     for field in ethics\_fields:                                                                                                                                                
         if field in ethics\_candidate and ethics\_candidate\[field\]:                                                                                                              
             merged\[field\] \= ethics\_candidate\[field\]                                                                                                                            
                                                                                                                                                                                
     \# Keep the more complete name                                                                                                                                              
     if len(ethics\_candidate.get('name', '')) \> len(merged.get('name', '')):                                                                                                    
         merged\['name'\] \= ethics\_candidate\['name'\]                                                                                                                              
                                                                                                                                                                                
     return merged                                                                                                                                                              
                                                                                                                                                                                
 def merge\_district(sheet\_district: dict, ethics\_district: dict) \-\> dict:                                                                                                       
     """Merge data for a single district."""                                                                                                                                    
     merged \= {                                                                                                                                                                 
         'districtNumber': sheet\_district\['districtNumber'\],                                                                                                                    
         'incumbent': sheet\_district.get('incumbent'),  \# Always from Sheet                                                                                                     
         'margin2022': sheet\_district.get('margin2022'),  \# Always from Sheet                                                                                                   
         'democratFiled': sheet\_district.get('democratFiled', False),  \# From Sheet                                                                                             
         'candidates': \[\]                                                                                                                                                       
     }                                                                                                                                                                          
                                                                                                                                                                                
     sheet\_candidates \= sheet\_district.get('candidates', \[\])                                                                                                                    
     ethics\_candidates \= ethics\_district.get('candidates', \[\]) if ethics\_district else \[\]                                                                                       
                                                                                                                                                                                
     \# Track which Ethics candidates have been matched                                                                                                                          
     matched\_ethics \= set()                                                                                                                                                     
                                                                                                                                                                                
     \# Process Sheet candidates first                                                                                                                                           
     for sheet\_cand in sheet\_candidates:                                                                                                                                        
         \# Try to find matching Ethics candidate                                                                                                                                
         match\_found \= False                                                                                                                                                    
         for idx, ethics\_cand in enumerate(ethics\_candidates):                                                                                                                  
             if idx in matched\_ethics:                                                                                                                                          
                 continue                                                                                                                                                       
             if names\_match(sheet\_cand.get('name', ''), ethics\_cand.get('name', '')):                                                                                           
                 merged\['candidates'\].append(merge\_candidate(sheet\_cand, ethics\_cand))                                                                                          
                 matched\_ethics.add(idx)                                                                                                                                        
                 match\_found \= True                                                                                                                                             
                 break                                                                                                                                                          
                                                                                                                                                                                
         if not match\_found:                                                                                                                                                    
             merged\['candidates'\].append(sheet\_cand)                                                                                                                            
                                                                                                                                                                                
     \# Add unmatched Ethics candidates                                                                                                                                          
     for idx, ethics\_cand in enumerate(ethics\_candidates):                                                                                                                      
         if idx not in matched\_ethics:                                                                                                                                          
             merged\['candidates'\].append(ethics\_cand)                                                                                                                           
                                                                                                                                                                                
     return merged                                                                                                                                                              
                                                                                                                                                                                
 def merge\_all(sheet\_data: dict, ethics\_data: dict) \-\> dict:                                                                                                                    
     """Merge all districts from both sources."""                                                                                                                               
     merged \= {                                                                                                                                                                 
         'lastUpdated': datetime.utcnow().isoformat() \+ 'Z',                                                                                                                    
         'source': 'Merged: Google Sheets \+ SC Ethics Commission',                                                                                                              
         'house': {},                                                                                                                                                           
         'senate': {}                                                                                                                                                           
     }                                                                                                                                                                          
                                                                                                                                                                                
     for chamber in \['house', 'senate'\]:                                                                                                                                        
         sheet\_districts \= sheet\_data.get(chamber, {})                                                                                                                          
         ethics\_districts \= ethics\_data.get(chamber, {})                                                                                                                        
                                                                                                                                                                                
         \# All district numbers from Sheet (primary source)                                                                                                                     
         all\_districts \= set(sheet\_districts.keys())                                                                                                                            
         \# Add any districts only in Ethics                                                                                                                                     
         all\_districts.update(ethics\_districts.keys())                                                                                                                          
                                                                                                                                                                                
         for district\_key in all\_districts:                                                                                                                                     
             sheet\_dist \= sheet\_districts.get(district\_key)                                                                                                                     
             ethics\_dist \= ethics\_districts.get(district\_key)                                                                                                                   
                                                                                                                                                                                
             if sheet\_dist:                                                                                                                                                     
                 merged\[chamber\]\[district\_key\] \= merge\_district(sheet\_dist, ethics\_dist)                                                                                        
             elif ethics\_dist:                                                                                                                                                  
                 \# District only in Ethics (unusual but possible)                                                                                                               
                 merged\[chamber\]\[district\_key\] \= ethics\_dist                                                                                                                    
                                                                                                                                                                                
     return merged                                                                                                                                                              
                                                                                                                                                                                
 def main():                                                                                                                                                                    
     \# Load inputs                                                                                                                                                              
     sheet\_path \= Path('scripts/data/sheet-candidates.json')                                                                                                                    
     ethics\_path \= Path('public/data/candidates.json')  \# Current production file                                                                                               
                                                                                                                                                                                
     with open(sheet\_path) as f:                                                                                                                                                
         sheet\_data \= json.load(f)                                                                                                                                              
                                                                                                                                                                                
     \# Ethics data might not exist yet on first run                                                                                                                             
     ethics\_data \= {'house': {}, 'senate': {}}                                                                                                                                  
     if ethics\_path.exists():                                                                                                                                                   
         with open(ethics\_path) as f:                                                                                                                                           
             ethics\_data \= json.load(f)                                                                                                                                         
                                                                                                                                                                                
     \# Merge                                                                                                                                                                    
     merged \= merge\_all(sheet\_data, ethics\_data)                                                                                                                                
                                                                                                                                                                                
     \# Write output                                                                                                                                                             
     output\_path \= Path('public/data/candidates.json')                                                                                                                          
     with open(output\_path, 'w') as f:                                                                                                                                          
         json.dump(merged, f, indent=2)                                                                                                                                         
                                                                                                                                                                                
     \# Summary                                                                                                                                                                  
     house\_count \= len(merged\['house'\])                                                                                                                                         
     senate\_count \= len(merged\['senate'\])                                                                                                                                       
     total\_candidates \= sum(                                                                                                                                                    
         len(d.get('candidates', \[\]))                                                                                                                                           
         for chamber in \['house', 'senate'\]                                                                                                                                     
         for d in merged\[chamber\].values()                                                                                                                                      
     )                                                                                                                                                                          
                                                                                                                                                                                
     print(f"Merged data written to {output\_path}")                                                                                                                             
     print(f"  House districts: {house\_count}")                                                                                                                                 
     print(f"  Senate districts: {senate\_count}")                                                                                                                               
     print(f"  Total candidates: {total\_candidates}")                                                                                                                           
                                                                                                                                                                                
 if \_\_name\_\_ \== '\_\_main\_\_':                                                                                                                                                     
     main()                                                                                                                                                                     
                                                                                                                                                                                
 \---                                                                                                                                                                            
 2.3 Opportunity Tier Calculator                                                                                                                                                
                                                                                                                                                                                
 Modify/Create: scripts/calculate\_opportunity.py                                                                                                                                
                                                                                                                                                                                
 New Tiered System:                                                                                                                                                             
                                                                                                                                                                                
 The user requested a tiered opportunity system rather than binary "close race" vs "not close":                                                                                 
                                                                                                                                                                                
 ┌─────────────────────────────────────────────────────────────────────┐                                                                                                        
 │                    OPPORTUNITY TIER SYSTEM                          │                                                                                                        
 ├─────────────────────────────────────────────────────────────────────┤                                                                                                        
 │                                                                     │                                                                                                        
 │  Margin (R-D)     Tier              Label      Strategic Meaning    │                                                                                                        
 │  ──────────────   ─────────────     ────────   ─────────────────    │                                                                                                        
 │  0-5 pts          HIGH\_OPPORTUNITY  "Hot"      Winnable NOW         │                                                                                                        
 │  6-10 pts         EMERGING          "Warm"     Invest to flip       │                                                                                                        
 │  11-15 pts        BUILD             "Possible" Long-term build      │                                                                                                        
 │  16+ pts          NON\_COMPETITIVE   "Safe R"   Don't waste $        │                                                                                                        
 │  Dem incumbent    DEFENSIVE         "Held"     Protect this seat    │                                                                                                        
 │                                                                     │                                                                                                        
 │  This data drives the "Opportunity Zones" lens coloring             │                                                                                                        
 │                                                                     │                                                                                                        
 └─────────────────────────────────────────────────────────────────────┘                                                                                                        
                                                                                                                                                                                
 Output: public/data/opportunity.json                                                                                                                                           
                                                                                                                                                                                
 {                                                                                                                                                                              
   "lastUpdated": "2026-01-23T06:00:00Z",                                                                                                                                       
   "house": {                                                                                                                                                                   
     "1": {                                                                                                                                                                     
       "tier": "HIGH\_OPPORTUNITY",                                                                                                                                              
       "tierLabel": "Hot",                                                                                                                                                      
       "margin": 3.2,                                                                                                                                                           
       "democratFiled": true,                                                                                                                                                   
       "incumbentParty": "R"                                                                                                                                                    
     },                                                                                                                                                                         
     "2": {                                                                                                                                                                     
       "tier": "DEFENSIVE",                                                                                                                                                     
       "tierLabel": "Held",                                                                                                                                                     
       "margin": null,                                                                                                                                                          
       "democratFiled": true,                                                                                                                                                   
       "incumbentParty": "D"                                                                                                                                                    
     }                                                                                                                                                                          
   },                                                                                                                                                                           
   "senate": { ... }                                                                                                                                                            
 }                                                                                                                                                                              
                                                                                                                                                                                
 \---                                                                                                                                                                            
 2.4 GitHub Actions Workflow                                                                                                                                                    
                                                                                                                                                                                
 Create: .github/workflows/sync-challenge-sheet.yml                                                                                                                             
                                                                                                                                                                                
 Schedule: Nightly at 6 AM Eastern (11:00 UTC)                                                                                                                                  
                                                                                                                                                                                
 \# .github/workflows/sync-challenge-sheet.yml                                                                                                                                   
 name: Sync Challenge Sheet Data                                                                                                                                                
                                                                                                                                                                                
 on:                                                                                                                                                                            
   schedule:                                                                                                                                                                    
     \# 6 AM Eastern \= 11:00 UTC (5 AM during DST)                                                                                                                               
     \- cron: '0 11 \* \* \*'                                                                                                                                                       
   workflow\_dispatch:  \# Manual trigger for frontend button                                                                                                                     
                                                                                                                                                                                
 permissions:                                                                                                                                                                   
   contents: write                                                                                                                                                              
                                                                                                                                                                                
 jobs:                                                                                                                                                                          
   sync-data:                                                                                                                                                                   
     runs-on: ubuntu-latest                                                                                                                                                     
     steps:                                                                                                                                                                     
       \- name: Checkout repository                                                                                                                                              
         uses: actions/checkout@v4                                                                                                                                              
         with:                                                                                                                                                                  
           token: ${{ secrets.GITHUB\_TOKEN }}                                                                                                                                   
                                                                                                                                                                                
       \- name: Setup Python                                                                                                                                                     
         uses: actions/setup-python@v5                                                                                                                                          
         with:                                                                                                                                                                  
           python-version: '3.11'                                                                                                                                               
                                                                                                                                                                                
       \- name: Install dependencies                                                                                                                                             
         run: |                                                                                                                                                                 
           pip install gspread google-auth                                                                                                                                      
                                                                                                                                                                                
       \- name: Run Sheets Loader                                                                                                                                                
         env:                                                                                                                                                                   
           GOOGLE\_CREDENTIALS\_JSON: ${{ secrets.GOOGLE\_SHEETS\_CREDENTIALS\_JSON }}                                                                                               
           CHALLENGE\_SHEET\_ID: ${{ secrets.CHALLENGE\_SHEET\_ID }}                                                                                                                
         run: python scripts/sheets\_loader.py                                                                                                                                   
                                                                                                                                                                                
       \- name: Run Data Merge                                                                                                                                                   
         run: python scripts/merge\_data.py                                                                                                                                      
                                                                                                                                                                                
       \- name: Run Opportunity Calculator                                                                                                                                       
         run: python scripts/calculate\_opportunity.py                                                                                                                           
                                                                                                                                                                                
       \- name: Check for changes                                                                                                                                                
         id: git-check                                                                                                                                                          
         run: |                                                                                                                                                                 
           git diff \--quiet public/data/ || echo "changed=true" \>\> $GITHUB\_OUTPUT                                                                                               
                                                                                                                                                                                
       \- name: Commit and push                                                                                                                                                  
         if: steps.git-check.outputs.changed \== 'true'                                                                                                                          
         run: |                                                                                                                                                                 
           git config user.name "github-actions\[bot\]"                                                                                                                           
           git config user.email "github-actions\[bot\]@users.noreply.github.com"                                                                                                 
           git add public/data/                                                                                                                                                 
           git commit \-m "chore(data): sync from Challenge Sheet $(date \-u \+%Y-%m-%d)"                                                                                          
           git push                                                                                                                                                             
                                                                                                                                                                                
 Secrets Required:                                                                                                                                                              
 \- GOOGLE\_SHEETS\_CREDENTIALS\_JSON \- Service account JSON (existing)                                                                                                             
 \- CHALLENGE\_SHEET\_ID \- 17j\_KFZFUw-ESBQlKlIccUMpGCFq\_XdeL6WYph7zkxQo                                                                                                            
                                                                                                                                                                                
 \---                                                                                                                                                                            
 Part III: Frontend Lens System                                                                                                                                                 
                                                                                                                                                                                
 3.1 Lens Type Definitions                                                                                                                                                      
                                                                                                                                                                                
 Create: src/types/lens.ts                                                                                                                                                      
                                                                                                                                                                                
 This file defines the complete lens system with all types, colors, and configurations.                                                                                         
                                                                                                                                                                                
 // src/types/lens.ts                                                                                                                                                           
                                                                                                                                                                                
 /\*\*                                                                                                                                                                            
  \* Strategic Lens System                                                                                                                                                       
  \*                                                                                                                                                                             
  \* Lenses allow viewing the same district data through different strategic filters.                                                                                            
  \* Each lens answers a specific question for campaign operatives.                                                                                                              
  \*/                                                                                                                                                                            
                                                                                                                                                                                
 /\*\*                                                                                                                                                                            
  \* Available lens identifiers                                                                                                                                                  
  \*/                                                                                                                                                                            
 export type LensId \= 'incumbents' | 'dem-filing' | 'opportunity' | 'battleground';                                                                                             
                                                                                                                                                                                
 /\*\*                                                                                                                                                                            
  \* Legend item for a lens                                                                                                                                                      
  \*/                                                                                                                                                                            
 export interface LensLegendItem {                                                                                                                                              
   id: string;                                                                                                                                                                  
   color: string;                                                                                                                                                               
   pattern?: string;  // SVG pattern ID if applicable                                                                                                                           
   label: string;                                                                                                                                                               
   description: string;                                                                                                                                                         
 }                                                                                                                                                                              
                                                                                                                                                                                
 /\*\*                                                                                                                                                                            
  \* Complete lens definition                                                                                                                                                    
  \*/                                                                                                                                                                            
 export interface LensDefinition {                                                                                                                                              
   id: LensId;                                                                                                                                                                  
   label: string;                                                                                                                                                               
   shortLabel: string;  // For mobile/compact display                                                                                                                           
   description: string;  // Tooltip/help text                                                                                                                                   
   icon: string;  // Emoji or icon identifier                                                                                                                                   
   legendItems: LensLegendItem\[\];                                                                                                                                               
 }                                                                                                                                                                              
                                                                                                                                                                                
 /\*\*                                                                                                                                                                            
  \* LENS DEFINITIONS                                                                                                                                                            
  \*                                                                                                                                                                             
  \* Each lens has a specific strategic purpose and color scheme.                                                                                                                
  \*/                                                                                                                                                                            
 export const LENS\_DEFINITIONS: Record\<LensId, LensDefinition\> \= {                                                                                                              
   /\*\*                                                                                                                                                                          
    \* INCUMBENTS LENS (Default)                                                                                                                                                 
    \*                                                                                                                                                                           
    \* Purpose: Show current party control of each district                                                                                                                      
    \* Question: "Who currently holds each seat?"                                                                                                                                
    \* Use case: Baseline orientation, understanding current landscape                                                                                                           
    \*                                                                                                                                                                           
    \* Colors: Traditional red/blue, elegant/muted tones                                                                                                                         
    \*/                                                                                                                                                                          
   incumbents: {                                                                                                                                                                
     id: 'incumbents',                                                                                                                                                          
     label: 'Current Incumbents',                                                                                                                                               
     shortLabel: 'Incumbents',                                                                                                                                                  
     description: 'Shows which party currently holds each seat',                                                                                                                
     icon: '🏛️'                                                                                                                                                                 
     legendItems: \[                                                                                                                                                             
       {                                                                                                                                                                        
         id: 'dem-incumbent',                                                                                                                                                   
         color: '\#1E40AF',  // Elegant deep blue                                                                                                                                
         label: 'Democratic Seat',                                                                                                                                              
         description: 'Currently held by Democrat'                                                                                                                              
       },                                                                                                                                                                       
       {                                                                                                                                                                        
         id: 'rep-incumbent',                                                                                                                                                   
         color: '\#991B1B',  // Muted elegant red                                                                                                                                
         label: 'Republican Seat',                                                                                                                                              
         description: 'Currently held by Republican'                                                                                                                            
       },                                                                                                                                                                       
       {                                                                                                                                                                        
         id: 'open-seat',                                                                                                                                                       
         color: '\#6B7280',  // Warm gray                                                                                                                                        
         label: 'Open Seat',                                                                                                                                                    
         description: 'No incumbent (retiring/new district)'                                                                                                                    
       },                                                                                                                                                                       
       {                                                                                                                                                                        
         id: 'unknown',                                                                                                                                                         
         color: '\#D1D5DB',  // Light gray                                                                                                                                       
         label: 'Unknown',                                                                                                                                                      
         description: 'Incumbent data not available'                                                                                                                            
       }                                                                                                                                                                        
     \]                                                                                                                                                                          
   },                                                                                                                                                                           
                                                                                                                                                                                
   /\*\*                                                                                                                                                                          
    \* DEM FILING PROGRESS LENS                                                                                                                                                  
    \*                                                                                                                                                                           
    \* Purpose: Track where Democrats have filed to challenge                                                                                                                    
    \* Question: "Where have we recruited candidates?"                                                                                                                           
    \* Use case: Recruiting, tracking "challenge every seat" progress                                                                                                            
    \*                                                                                                                                                                           
    \* Colors: Blue for coverage, amber/orange for gaps needing candidates                                                                                                       
    \*/                                                                                                                                                                          
   'dem-filing': {                                                                                                                                                              
     id: 'dem-filing',                                                                                                                                                          
     label: 'Dem Filing Progress',                                                                                                                                              
     shortLabel: 'Filing',                                                                                                                                                      
     description: 'Tracks where Democrats have filed to run',                                                                                                                   
     icon: '📋',                                                                                                                                                                
     legendItems: \[                                                                                                                                                             
       {                                                                                                                                                                        
         id: 'dem-held',                                                                                                                                                        
         color: '\#1E40AF',  // Deep blue                                                                                                                                        
         label: 'Dem Incumbent',                                                                                                                                                
         description: 'Democratic incumbent (covered)'                                                                                                                          
       },                                                                                                                                                                       
       {                                                                                                                                                                        
         id: 'dem-filed',                                                                                                                                                       
         color: '\#2563EB',  // Bright blue                                                                                                                                      
         label: 'Dem Filed',                                                                                                                                                    
         description: 'Democrat filed to challenge'                                                                                                                             
       },                                                                                                                                                                       
       {                                                                                                                                                                        
         id: 'needs-hot',                                                                                                                                                       
         color: '\#D97706',  // Urgent amber                                                                                                                                     
         label: 'Needs Candidate (Hot)',                                                                                                                                        
         description: 'No Dem, margin ≤5pts \- RECRUIT NOW'                                                                                                                      
       },                                                                                                                                                                       
       {                                                                                                                                                                        
         id: 'needs-warm',                                                                                                                                                      
         color: '\#EA580C',  // Warm orange                                                                                                                                      
         label: 'Needs Candidate (Warm)',                                                                                                                                       
         description: 'No Dem, margin 6-15pts'                                                                                                                                  
       },                                                                                                                                                                       
       {                                                                                                                                                                        
         id: 'covered',                                                                                                                                                         
         color: '\#9CA3AF',  // Muted gray                                                                                                                                       
         label: 'Safe R / Low Priority',                                                                                                                                        
         description: 'No Dem, margin \>15pts'                                                                                                                                   
       }                                                                                                                                                                        
     \]                                                                                                                                                                          
   },                                                                                                                                                                           
                                                                                                                                                                                
   /\*\*                                                                                                                                                                          
    \* OPPORTUNITY ZONES LENS                                                                                                                                                    
    \*                                                                                                                                                                           
    \* Purpose: Show where resources should be invested based on competitiveness                                                                                                 
    \* Question: "Where should we spend money?"                                                                                                                                  
    \* Use case: Resource allocation, targeting, budgeting                                                                                                                       
    \*                                                                                                                                                                           
    \* Colors: Heat map style \- hot (red/coral) to cool (gray)                                                                                                                   
    \*/                                                                                                                                                                          
   opportunity: {                                                                                                                                                               
     id: 'opportunity',                                                                                                                                                         
     label: 'Opportunity Zones',                                                                                                                                                
     shortLabel: 'Opportunity',                                                                                                                                                 
     description: 'Prioritizes districts by competitiveness',                                                                                                                   
     icon: '🎯',                                                                                                                                                                
     legendItems: \[                                                                                                                                                             
       {                                                                                                                                                                        
         id: 'hot',                                                                                                                                                             
         color: '\#EF4444',  // Vivid coral/red                                                                                                                                  
         label: 'Hot (≤5pts)',                                                                                                                                                  
         description: 'Highly competitive \- top investment priority'                                                                                                            
       },                                                                                                                                                                       
       {                                                                                                                                                                        
         id: 'warm',                                                                                                                                                            
         color: '\#F59E0B',  // Amber                                                                                                                                            
         label: 'Warm (6-10pts)',                                                                                                                                               
         description: 'Emerging opportunity \- invest to build'                                                                                                                  
       },                                                                                                                                                                       
       {                                                                                                                                                                        
         id: 'possible',                                                                                                                                                        
         color: '\#FDE047',  // Soft yellow                                                                                                                                      
         label: 'Possible (11-15pts)',                                                                                                                                          
         description: 'Long-term opportunity \- build infrastructure'                                                                                                            
       },                                                                                                                                                                       
       {                                                                                                                                                                        
         id: 'long-shot',                                                                                                                                                       
         color: '\#E5E7EB',  // Cool gray                                                                                                                                        
         label: 'Long Shot (\>15pts)',                                                                                                                                           
         description: 'Non-competitive \- deprioritize'                                                                                                                          
       },                                                                                                                                                                       
       {                                                                                                                                                                        
         id: 'defensive',                                                                                                                                                       
         color: '\#1E40AF',  // Deep blue                                                                                                                                        
         label: 'Defensive (Dem Held)',                                                                                                                                         
         description: 'Protect this seat \- defensive priority'                                                                                                                  
       }                                                                                                                                                                        
     \]                                                                                                                                                                          
   },                                                                                                                                                                           
                                                                                                                                                                                
   /\*\*                                                                                                                                                                          
    \* BATTLEGROUND RACES LENS                                                                                                                                                   
    \*                                                                                                                                                                           
    \* Purpose: Show contested races with candidates from both parties                                                                                                           
    \* Question: "Which races have head-to-head matchups?"                                                                                                                       
    \* Use case: Competitive race monitoring, GOTV targeting                                                                                                                     
    \*                                                                                                                                                                           
    \* Colors: Blue/red for contested, purple for tossups, gray for uncontested                                                                                                  
    \*/                                                                                                                                                                          
   battleground: {                                                                                                                                                              
     id: 'battleground',                                                                                                                                                        
     label: 'Battleground Races',                                                                                                                                               
     shortLabel: 'Battleground',                                                                                                                                                
     description: 'Shows races with candidates from both parties',                                                                                                              
     icon: '⚔️',                                                                                                                                                                
     legendItems: \[                                                                                                                                                             
       {                                                                                                                                                                        
         id: 'contested-dem-adv',                                                                                                                                               
         color: '\#3B82F6',  // Blue                                                                                                                                             
         label: 'Contested (Dem Adv)',                                                                                                                                          
         description: 'Both filed, Dem margin advantage'                                                                                                                        
       },                                                                                                                                                                       
       {                                                                                                                                                                        
         id: 'contested-tossup',                                                                                                                                                
         color: '\#7C3AED',  // Purple                                                                                                                                           
         label: 'Contested (Tossup)',                                                                                                                                           
         description: 'Both filed, within 5pts'                                                                                                                                 
       },                                                                                                                                                                       
       {                                                                                                                                                                        
         id: 'contested-rep-adv',                                                                                                                                               
         color: '\#EF4444',  // Red                                                                                                                                              
         label: 'Contested (Rep Adv)',                                                                                                                                          
         description: 'Both filed, Rep margin advantage'                                                                                                                        
       },                                                                                                                                                                       
       {                                                                                                                                                                        
         id: 'uncontested-dem',                                                                                                                                                 
         color: '\#1E40AF',  // Solid blue                                                                                                                                       
         label: 'Uncontested Dem',                                                                                                                                              
         description: 'Only Dem filed/incumbent'                                                                                                                                
       },                                                                                                                                                                       
       {                                                                                                                                                                        
         id: 'uncontested-rep',                                                                                                                                                 
         color: '\#991B1B',  // Solid red                                                                                                                                        
         label: 'Uncontested Rep',                                                                                                                                              
         description: 'Only Rep filed/incumbent'                                                                                                                                
       },                                                                                                                                                                       
       {                                                                                                                                                                        
         id: 'no-candidates',                                                                                                                                                   
         color: '\#E5E7EB',  // Light gray                                                                                                                                       
         label: 'No Candidates',                                                                                                                                                
         description: 'No one has filed yet'                                                                                                                                    
       }                                                                                                                                                                        
     \]                                                                                                                                                                          
   }                                                                                                                                                                            
 };                                                                                                                                                                             
                                                                                                                                                                                
 /\*\*                                                                                                                                                                            
  \* Get color for a district based on active lens                                                                                                                               
  \*/                                                                                                                                                                            
 export function getLensColor(                                                                                                                                                  
   lensId: LensId,                                                                                                                                                              
   categoryId: string                                                                                                                                                           
 ): string {                                                                                                                                                                    
   const lens \= LENS\_DEFINITIONS\[lensId\];                                                                                                                                       
   const item \= lens.legendItems.find(i \=\> i.id \=== categoryId);                                                                                                                
   return item?.color || '\#D1D5DB';                                                                                                                                             
 }                                                                                                                                                                              
                                                                                                                                                                                
 /\*\*                                                                                                                                                                            
  \* Default lens when no URL parameter specified                                                                                                                                
  \*/                                                                                                                                                                            
 export const DEFAULT\_LENS: LensId \= 'incumbents';                                                                                                                              
                                                                                                                                                                                
 \---                                                                                                                                                                            
 3.2 Lens Toggle Bar Component                                                                                                                                                  
                                                                                                                                                                                
 Create: src/components/Lens/LensToggleBar.tsx                                                                                                                                  
                                                                                                                                                                                
 This is the primary UI for switching between lenses. It appears above the map, below the FilterPanel.                                                                          
                                                                                                                                                                                
 Design Specifications:                                                                                                                                                         
 \- Horizontal pill-button group (similar to existing ChamberToggle)                                                                                                             
 \- Active state: Purple/blue gradient background                                                                                                                                
 \- Inactive state: White/transparent with subtle border                                                                                                                         
 \- Mobile: Horizontal scroll with compact labels                                                                                                                                
 \- Keyboard accessible with proper focus states                                                                                                                                 
                                                                                                                                                                                
 // src/components/Lens/LensToggleBar.tsx                                                                                                                                       
                                                                                                                                                                                
 'use client';                                                                                                                                                                  
                                                                                                                                                                                
 import { type LensId, LENS\_DEFINITIONS, DEFAULT\_LENS } from '@/types/lens';                                                                                                    
                                                                                                                                                                                
 interface LensToggleBarProps {                                                                                                                                                 
   activeLens: LensId;                                                                                                                                                          
   onLensChange: (lens: LensId) \=\> void;                                                                                                                                        
   className?: string;                                                                                                                                                          
 }                                                                                                                                                                              
                                                                                                                                                                                
 /\*\*                                                                                                                                                                            
  \* Lens Toggle Bar                                                                                                                                                             
  \*                                                                                                                                                                             
  \* Allows users to switch between different strategic views of the map.                                                                                                        
  \* Each lens changes the coloring scheme to answer a different strategic question.                                                                                             
  \*/                                                                                                                                                                            
 export default function LensToggleBar({                                                                                                                                        
   activeLens,                                                                                                                                                                  
   onLensChange,                                                                                                                                                                
   className \= ''                                                                                                                                                               
 }: LensToggleBarProps) {                                                                                                                                                       
   const lensIds: LensId\[\] \= \['incumbents', 'dem-filing', 'opportunity', 'battleground'\];                                                                                       
                                                                                                                                                                                
   return (                                                                                                                                                                     
     \<div                                                                                                                                                                       
       className={\`lens-toggle-bar ${className}\`}                                                                                                                               
       role="tablist"                                                                                                                                                           
       aria-label="Map view lenses"                                                                                                                                             
     \>                                                                                                                                                                          
       \<div className="lens-toggle-container"\>                                                                                                                                  
         {lensIds.map((lensId) \=\> {                                                                                                                                             
           const lens \= LENS\_DEFINITIONS\[lensId\];                                                                                                                               
           const isActive \= activeLens \=== lensId;                                                                                                                              
                                                                                                                                                                                
           return (                                                                                                                                                             
             \<button                                                                                                                                                            
               key={lensId}                                                                                                                                                     
               type="button"                                                                                                                                                    
               role="tab"                                                                                                                                                       
               aria-selected={isActive}                                                                                                                                         
               aria-controls={\`lens-panel-${lensId}\`}                                                                                                                           
               className={\`lens-toggle-button ${isActive ? 'lens-active' : ''}\`}                                                                                                
               onClick={() \=\> onLensChange(lensId)}                                                                                                                             
               title={lens.description}                                                                                                                                         
             \>                                                                                                                                                                  
               \<span className="lens-icon" aria-hidden="true"\>                                                                                                                  
                 {lens.icon}                                                                                                                                                    
               \</span\>                                                                                                                                                          
               \<span className="lens-label"\>{lens.shortLabel}\</span\>                                                                                                            
               \<span className="lens-label-full"\>{lens.label}\</span\>                                                                                                            
             \</button\>                                                                                                                                                          
           );                                                                                                                                                                   
         })}                                                                                                                                                                    
       \</div\>                                                                                                                                                                   
                                                                                                                                                                                
       {/\* Active lens description (visible on hover/focus) \*/}                                                                                                                 
       \<div className="lens-description" aria-live="polite"\>                                                                                                                    
         {LENS\_DEFINITIONS\[activeLens\].description}                                                                                                                             
       \</div\>                                                                                                                                                                   
     \</div\>                                                                                                                                                                     
   );                                                                                                                                                                           
 }                                                                                                                                                                              
                                                                                                                                                                                
 CSS (add to existing stylesheets):                                                                                                                                             
                                                                                                                                                                                
 /\* Lens Toggle Bar Styles \*/                                                                                                                                                   
 .lens-toggle-bar {                                                                                                                                                             
   display: flex;                                                                                                                                                               
   flex-direction: column;                                                                                                                                                      
   gap: 0.5rem;                                                                                                                                                                 
 }                                                                                                                                                                              
                                                                                                                                                                                
 .lens-toggle-container {                                                                                                                                                       
   display: flex;                                                                                                                                                               
   gap: 0.5rem;                                                                                                                                                                 
   overflow-x: auto;                                                                                                                                                            
   \-webkit-overflow-scrolling: touch;                                                                                                                                           
   scrollbar-width: none;                                                                                                                                                       
   padding: 0.25rem;                                                                                                                                                            
 }                                                                                                                                                                              
                                                                                                                                                                                
 .lens-toggle-container::-webkit-scrollbar {                                                                                                                                    
   display: none;                                                                                                                                                               
 }                                                                                                                                                                              
                                                                                                                                                                                
 .lens-toggle-button {                                                                                                                                                          
   display: flex;                                                                                                                                                               
   align-items: center;                                                                                                                                                         
   gap: 0.5rem;                                                                                                                                                                 
   padding: 0.5rem 1rem;                                                                                                                                                        
   border-radius: 9999px;                                                                                                                                                       
   font-size: 0.875rem;                                                                                                                                                         
   font-weight: 500;                                                                                                                                                            
   white-space: nowrap;                                                                                                                                                         
   transition: all 0.2s ease;                                                                                                                                                   
   border: 1px solid var(--class-purple-light, \#E0E7FF);                                                                                                                        
   background: var(--card-bg, white);                                                                                                                                           
   color: var(--text-color, \#1F2937);                                                                                                                                           
   cursor: pointer;                                                                                                                                                             
 }                                                                                                                                                                              
                                                                                                                                                                                
 .lens-toggle-button:hover {                                                                                                                                                    
   background: var(--class-purple-bg, \#EEF2FF);                                                                                                                                 
 }                                                                                                                                                                              
                                                                                                                                                                                
 .lens-toggle-button:focus-visible {                                                                                                                                            
   outline: 2px solid var(--class-purple, \#4739E7);                                                                                                                             
   outline-offset: 2px;                                                                                                                                                         
 }                                                                                                                                                                              
                                                                                                                                                                                
 .lens-toggle-button.lens-active {                                                                                                                                              
   background: linear-gradient(135deg, var(--class-purple, \#4739E7) 0%, \#6366F1 100%);                                                                                          
   color: white;                                                                                                                                                                
   border-color: transparent;                                                                                                                                                   
 }                                                                                                                                                                              
                                                                                                                                                                                
 .lens-icon {                                                                                                                                                                   
   font-size: 1rem;                                                                                                                                                             
 }                                                                                                                                                                              
                                                                                                                                                                                
 /\* Hide full label on mobile, show short label \*/                                                                                                                              
 .lens-label-full {                                                                                                                                                             
   display: none;                                                                                                                                                               
 }                                                                                                                                                                              
                                                                                                                                                                                
 @media (min-width: 768px) {                                                                                                                                                    
   .lens-label {                                                                                                                                                                
     display: none;                                                                                                                                                             
   }                                                                                                                                                                            
   .lens-label-full {                                                                                                                                                           
     display: inline;                                                                                                                                                           
   }                                                                                                                                                                            
 }                                                                                                                                                                              
                                                                                                                                                                                
 .lens-description {                                                                                                                                                            
   font-size: 0.75rem;                                                                                                                                                          
   color: var(--text-muted, \#6B7280);                                                                                                                                           
   padding-left: 0.5rem;                                                                                                                                                        
 }                                                                                                                                                                              
                                                                                                                                                                                
 \---                                                                                                                                                                            
 3.3 useLens Hook                                                                                                                                                               
                                                                                                                                                                                
 Create: src/hooks/useLens.ts                                                                                                                                                   
                                                                                                                                                                                
 Manages lens state with URL synchronization for shareable links.                                                                                                               
                                                                                                                                                                                
 // src/hooks/useLens.ts                                                                                                                                                        
                                                                                                                                                                                
 'use client';                                                                                                                                                                  
                                                                                                                                                                                
 import { useState, useEffect, useCallback } from 'react';                                                                                                                      
 import { type LensId, DEFAULT\_LENS } from '@/types/lens';                                                                                                                      
                                                                                                                                                                                
 interface UseLensOptions {                                                                                                                                                     
   defaultLens?: LensId;                                                                                                                                                        
 }                                                                                                                                                                              
                                                                                                                                                                                
 interface UseLensReturn {                                                                                                                                                      
   activeLens: LensId;                                                                                                                                                          
   setActiveLens: (lens: LensId) \=\> void;                                                                                                                                       
 }                                                                                                                                                                              
                                                                                                                                                                                
 /\*\*                                                                                                                                                                            
  \* useLens Hook                                                                                                                                                                
  \*                                                                                                                                                                             
  \* Manages the active lens state with URL synchronization.                                                                                                                     
  \* \- Reads ?lens= param on mount                                                                                                                                               
  \* \- Updates URL when lens changes                                                                                                                                             
  \* \- Defaults to 'incumbents' when no param                                                                                                                                    
  \*/                                                                                                                                                                            
 export function useLens(options: UseLensOptions \= {}): UseLensReturn {                                                                                                         
   const { defaultLens \= DEFAULT\_LENS } \= options;                                                                                                                              
                                                                                                                                                                                
   const \[activeLens, setActiveLensState\] \= useState\<LensId\>(defaultLens);                                                                                                      
                                                                                                                                                                                
   // Read from URL on mount                                                                                                                                                    
   useEffect(() \=\> {                                                                                                                                                            
     if (typeof window \=== 'undefined') return;                                                                                                                                 
                                                                                                                                                                                
     const params \= new URLSearchParams(window.location.search);                                                                                                                
     const urlLens \= params.get('lens') as LensId | null;                                                                                                                       
                                                                                                                                                                                
     // Validate the lens ID                                                                                                                                                    
     const validLenses: LensId\[\] \= \['incumbents', 'dem-filing', 'opportunity', 'battleground'\];                                                                                 
     if (urlLens && validLenses.includes(urlLens)) {                                                                                                                            
       setActiveLensState(urlLens);                                                                                                                                             
     }                                                                                                                                                                          
   }, \[\]);                                                                                                                                                                      
                                                                                                                                                                                
   // Update URL when lens changes                                                                                                                                              
   const setActiveLens \= useCallback((lens: LensId) \=\> {                                                                                                                        
     setActiveLensState(lens);                                                                                                                                                  
                                                                                                                                                                                
     if (typeof window \=== 'undefined') return;                                                                                                                                 
                                                                                                                                                                                
     const params \= new URLSearchParams(window.location.search);                                                                                                                
                                                                                                                                                                                
     // Only add lens param if not the default                                                                                                                                  
     if (lens \=== DEFAULT\_LENS) {                                                                                                                                               
       params.delete('lens');                                                                                                                                                   
     } else {                                                                                                                                                                   
       params.set('lens', lens);                                                                                                                                                
     }                                                                                                                                                                          
                                                                                                                                                                                
     // Update URL without reload                                                                                                                                               
     const newUrl \= params.toString()                                                                                                                                           
       ? \`${window.location.pathname}?${params.toString()}\`                                                                                                                     
       : window.location.pathname;                                                                                                                                              
     window.history.replaceState({}, '', newUrl);                                                                                                                               
   }, \[\]);                                                                                                                                                                      
                                                                                                                                                                                
   return {                                                                                                                                                                     
     activeLens,                                                                                                                                                                
     setActiveLens                                                                                                                                                              
   };                                                                                                                                                                           
 }                                                                                                                                                                              
                                                                                                                                                                                
 \---                                                                                                                                                                            
 3.4 Lens-Aware District Colors                                                                                                                                                 
                                                                                                                                                                                
 Modify: src/lib/districtColors.ts                                                                                                                                              
                                                                                                                                                                                
 Add lens parameter to all color functions. This is the core logic change.                                                                                                      
                                                                                                                                                                                
 Key Changes:                                                                                                                                                                   
 1\. Add LensId parameter to getDistrictFillColor()                                                                                                                              
 2\. Create separate color determination functions for each lens                                                                                                                 
 3\. Keep existing functions for backwards compatibility (default to incumbents lens)                                                                                            
                                                                                                                                                                                
 // Add to src/lib/districtColors.ts                                                                                                                                            
                                                                                                                                                                                
 import type { LensId } from '@/types/lens';                                                                                                                                    
                                                                                                                                                                                
 /\*\*                                                                                                                                                                            
  \* LENS COLOR PALETTES                                                                                                                                                         
  \*                                                                                                                                                                             
  \* Each lens has its own color scheme optimized for its strategic purpose.                                                                                                     
  \*/                                                                                                                                                                            
 export const LENS\_COLORS \= {                                                                                                                                                   
   // Incumbents lens \- traditional red/blue                                                                                                                                    
   incumbents: {                                                                                                                                                                
     DEM\_HELD: '\#1E40AF',      // Elegant deep blue                                                                                                                             
     REP\_HELD: '\#991B1B',      // Muted elegant red                                                                                                                             
     OPEN\_SEAT: '\#6B7280',     // Warm gray                                                                                                                                     
     UNKNOWN: '\#D1D5DB',       // Light gray                                                                                                                                    
   },                                                                                                                                                                           
                                                                                                                                                                                
   // Dem Filing lens \- blue coverage, amber/orange gaps                                                                                                                        
   'dem-filing': {                                                                                                                                                              
     DEM\_INCUMBENT: '\#1E40AF', // Deep blue                                                                                                                                     
     DEM\_FILED: '\#2563EB',     // Bright blue                                                                                                                                   
     NEEDS\_HOT: '\#D97706',     // Urgent amber (margin ≤5)                                                                                                                      
     NEEDS\_WARM: '\#EA580C',    // Warm orange (margin 6-15)                                                                                                                     
     COVERED: '\#9CA3AF',       // Muted gray (safe R)                                                                                                                           
   },                                                                                                                                                                           
                                                                                                                                                                                
   // Opportunity lens \- heat map                                                                                                                                               
   opportunity: {                                                                                                                                                               
     HOT: '\#EF4444',           // Vivid coral (≤5pts)                                                                                                                           
     WARM: '\#F59E0B',          // Amber (6-10pts)                                                                                                                               
     POSSIBLE: '\#FDE047',      // Soft yellow (11-15pts)                                                                                                                        
     LONG\_SHOT: '\#E5E7EB',     // Cool gray (\>15pts)                                                                                                                            
     DEFENSIVE: '\#1E40AF',     // Deep blue (Dem held)                                                                                                                          
   },                                                                                                                                                                           
                                                                                                                                                                                
   // Battleground lens \- contested races                                                                                                                                       
   battleground: {                                                                                                                                                              
     CONTESTED\_DEM: '\#3B82F6', // Blue (Dem advantage)                                                                                                                          
     CONTESTED\_TOSSUP: '\#7C3AED', // Purple                                                                                                                                     
     CONTESTED\_REP: '\#EF4444', // Red (Rep advantage)                                                                                                                           
     UNCONTESTED\_DEM: '\#1E40AF', // Solid blue                                                                                                                                  
     UNCONTESTED\_REP: '\#991B1B', // Solid red                                                                                                                                   
     NO\_CANDIDATES: '\#E5E7EB', // Light gray                                                                                                                                    
   }                                                                                                                                                                            
 } as const;                                                                                                                                                                    
                                                                                                                                                                                
 /\*\*                                                                                                                                                                            
  \* Get category ID for a district based on active lens                                                                                                                         
  \*                                                                                                                                                                             
  \* This determines which legend item the district maps to.                                                                                                                     
  \*/                                                                                                                                                                            
 export function getDistrictCategory(                                                                                                                                           
   district: District | undefined,                                                                                                                                              
   electionHistory: DistrictElectionHistory | undefined,                                                                                                                        
   opportunityData: OpportunityTier | undefined,                                                                                                                                
   lens: LensId                                                                                                                                                                 
 ): string {                                                                                                                                                                    
   if (\!district) return 'unknown';                                                                                                                                             
                                                                                                                                                                                
   const isDemIncumbent \= district.incumbent?.party \=== 'Democratic';                                                                                                           
   const isRepIncumbent \= district.incumbent?.party \=== 'Republican';                                                                                                           
   const hasDemCandidate \= district.candidates.some(                                                                                                                            
     c \=\> c.party?.toLowerCase() \=== 'democratic'                                                                                                                               
   );                                                                                                                                                                           
   const hasRepCandidate \= district.candidates.some(                                                                                                                            
     c \=\> c.party?.toLowerCase() \=== 'republican'                                                                                                                               
   );                                                                                                                                                                           
                                                                                                                                                                                
   const margin \= opportunityData?.margin ??                                                                                                                                    
     electionHistory?.elections?.\['2024'\]?.margin ??                                                                                                                            
     electionHistory?.elections?.\['2022'\]?.margin ??                                                                                                                            
     100;                                                                                                                                                                       
                                                                                                                                                                                
   switch (lens) {                                                                                                                                                              
     case 'incumbents':                                                                                                                                                         
       if (isDemIncumbent) return 'dem-incumbent';                                                                                                                              
       if (isRepIncumbent) return 'rep-incumbent';                                                                                                                              
       if (\!district.incumbent) return 'open-seat';                                                                                                                             
       return 'unknown';                                                                                                                                                        
                                                                                                                                                                                
     case 'dem-filing':                                                                                                                                                         
       if (isDemIncumbent) return 'dem-held';                                                                                                                                   
       if (hasDemCandidate) return 'dem-filed';                                                                                                                                 
       if (margin \<= 5\) return 'needs-hot';                                                                                                                                     
       if (margin \<= 15\) return 'needs-warm';                                                                                                                                   
       return 'covered';                                                                                                                                                        
                                                                                                                                                                                
     case 'opportunity':                                                                                                                                                        
       if (isDemIncumbent) return 'defensive';                                                                                                                                  
       if (margin \<= 5\) return 'hot';                                                                                                                                           
       if (margin \<= 10\) return 'warm';                                                                                                                                         
       if (margin \<= 15\) return 'possible';                                                                                                                                     
       return 'long-shot';                                                                                                                                                      
                                                                                                                                                                                
     case 'battleground':                                                                                                                                                       
       const isContested \= hasDemCandidate && hasRepCandidate;                                                                                                                  
       if (isContested) {                                                                                                                                                       
         if (margin \<= 5\) return 'contested-tossup';                                                                                                                            
         if (isDemIncumbent || hasDemCandidate && margin \< 0\) return 'contested-dem-adv';                                                                                       
         return 'contested-rep-adv';                                                                                                                                            
       }                                                                                                                                                                        
       if (hasDemCandidate || isDemIncumbent) return 'uncontested-dem';                                                                                                         
       if (hasRepCandidate || isRepIncumbent) return 'uncontested-rep';                                                                                                         
       return 'no-candidates';                                                                                                                                                  
                                                                                                                                                                                
     default:                                                                                                                                                                   
       return 'unknown';                                                                                                                                                        
   }                                                                                                                                                                            
 }                                                                                                                                                                              
                                                                                                                                                                                
 /\*\*                                                                                                                                                                            
  \* Get fill color for a district with lens support                                                                                                                             
  \*                                                                                                                                                                             
  \* @param district \- District data                                                                                                                                             
  \* @param electionHistory \- Historical election data                                                                                                                           
  \* @param opportunityData \- Opportunity tier data                                                                                                                              
  \* @param lens \- Active lens (defaults to 'incumbents')                                                                                                                        
  \* @param useSolidColors \- Use solid colors (for Leaflet)                                                                                                                      
  \*/                                                                                                                                                                            
 export function getDistrictFillColorWithLens(                                                                                                                                  
   district: District | undefined,                                                                                                                                              
   electionHistory: DistrictElectionHistory | undefined,                                                                                                                        
   opportunityData: OpportunityTier | undefined,                                                                                                                                
   lens: LensId \= 'incumbents',                                                                                                                                                 
   useSolidColors \= false                                                                                                                                                       
 ): string {                                                                                                                                                                    
   const category \= getDistrictCategory(district, electionHistory, opportunityData, lens);                                                                                      
                                                                                                                                                                                
   // Map category to color based on lens                                                                                                                                       
   const lensColors \= LENS\_COLORS\[lens\];                                                                                                                                        
                                                                                                                                                                                
   switch (lens) {                                                                                                                                                              
     case 'incumbents':                                                                                                                                                         
       switch (category) {                                                                                                                                                      
         case 'dem-incumbent': return lensColors.DEM\_HELD;                                                                                                                      
         case 'rep-incumbent': return lensColors.REP\_HELD;                                                                                                                      
         case 'open-seat': return lensColors.OPEN\_SEAT;                                                                                                                         
         default: return lensColors.UNKNOWN;                                                                                                                                    
       }                                                                                                                                                                        
                                                                                                                                                                                
     case 'dem-filing':                                                                                                                                                         
       switch (category) {                                                                                                                                                      
         case 'dem-held': return lensColors.DEM\_INCUMBENT;                                                                                                                      
         case 'dem-filed': return lensColors.DEM\_FILED;                                                                                                                         
         case 'needs-hot': return lensColors.NEEDS\_HOT;                                                                                                                         
         case 'needs-warm': return lensColors.NEEDS\_WARM;                                                                                                                       
         default: return lensColors.COVERED;                                                                                                                                    
       }                                                                                                                                                                        
                                                                                                                                                                                
     case 'opportunity':                                                                                                                                                        
       switch (category) {                                                                                                                                                      
         case 'defensive': return lensColors.DEFENSIVE;                                                                                                                         
         case 'hot': return lensColors.HOT;                                                                                                                                     
         case 'warm': return lensColors.WARM;                                                                                                                                   
         case 'possible': return lensColors.POSSIBLE;                                                                                                                           
         default: return lensColors.LONG\_SHOT;                                                                                                                                  
       }                                                                                                                                                                        
                                                                                                                                                                                
     case 'battleground':                                                                                                                                                       
       switch (category) {                                                                                                                                                      
         case 'contested-dem-adv': return lensColors.CONTESTED\_DEM;                                                                                                             
         case 'contested-tossup': return lensColors.CONTESTED\_TOSSUP;                                                                                                           
         case 'contested-rep-adv': return lensColors.CONTESTED\_REP;                                                                                                             
         case 'uncontested-dem': return lensColors.UNCONTESTED\_DEM;                                                                                                             
         case 'uncontested-rep': return lensColors.UNCONTESTED\_REP;                                                                                                             
         default: return lensColors.NO\_CANDIDATES;                                                                                                                              
       }                                                                                                                                                                        
                                                                                                                                                                                
     default:                                                                                                                                                                   
       return '\#D1D5DB';                                                                                                                                                        
   }                                                                                                                                                                            
 }                                                                                                                                                                              
                                                                                                                                                                                
 \---                                                                                                                                                                            
 3.5 Dynamic Legend Component                                                                                                                                                   
                                                                                                                                                                                
 Modify: src/components/Map/Legend.tsx                                                                                                                                          
                                                                                                                                                                                
 Update to accept activeLens prop and render appropriate legend items.                                                                                                          
                                                                                                                                                                                
 // src/components/Map/Legend.tsx \- Updated                                                                                                                                     
                                                                                                                                                                                
 'use client';                                                                                                                                                                  
                                                                                                                                                                                
 import { useState } from 'react';                                                                                                                                              
 import { type LensId, LENS\_DEFINITIONS, DEFAULT\_LENS } from '@/types/lens';                                                                                                    
                                                                                                                                                                                
 interface LegendProps {                                                                                                                                                        
   className?: string;                                                                                                                                                          
   activeLens?: LensId;                                                                                                                                                         
 }                                                                                                                                                                              
                                                                                                                                                                                
 /\*\*                                                                                                                                                                            
  \* Dynamic Legend Component                                                                                                                                                    
  \*                                                                                                                                                                             
  \* Renders legend items based on the active lens.                                                                                                                              
  \* Falls back to incumbents lens if not specified.                                                                                                                             
  \*/                                                                                                                                                                            
 export default function Legend({                                                                                                                                               
   className \= '',                                                                                                                                                              
   activeLens \= DEFAULT\_LENS                                                                                                                                                    
 }: LegendProps) {                                                                                                                                                              
   const \[isCollapsed, setIsCollapsed\] \= useState(false);                                                                                                                       
                                                                                                                                                                                
   const lens \= LENS\_DEFINITIONS\[activeLens\];                                                                                                                                   
   const legendItems \= lens.legendItems;                                                                                                                                        
                                                                                                                                                                                
   return (                                                                                                                                                                     
     \<div className={\`legend-overlay ${isCollapsed ? 'legend-collapsed' : ''} ${className}\`}\>                                                                                   
       {/\* Header with collapse toggle \*/}                                                                                                                                      
       \<button                                                                                                                                                                  
         type="button"                                                                                                                                                          
         className="legend-header"                                                                                                                                              
         onClick={() \=\> setIsCollapsed(\!isCollapsed)}                                                                                                                           
         aria-expanded={\!isCollapsed}                                                                                                                                           
         aria-controls="legend-content"                                                                                                                                         
       \>                                                                                                                                                                        
         \<span className="legend-title"\>                                                                                                                                        
           {lens.icon} {lens.shortLabel}                                                                                                                                        
         \</span\>                                                                                                                                                                
         \<svg                                                                                                                                                                   
           className={\`legend-toggle-icon ${isCollapsed ? 'legend-toggle-collapsed' : ''}\`}                                                                                     
           fill="none"                                                                                                                                                          
           stroke="currentColor"                                                                                                                                                
           viewBox="0 0 24 24"                                                                                                                                                  
           width="16"                                                                                                                                                           
           height="16"                                                                                                                                                          
         \>                                                                                                                                                                      
           \<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /\>                                                                             
         \</svg\>                                                                                                                                                                 
       \</button\>                                                                                                                                                                
                                                                                                                                                                                
       {/\* Legend content \*/}                                                                                                                                                   
       {\!isCollapsed && (                                                                                                                                                       
         \<div id="legend-content" className="legend-content"\>                                                                                                                   
           \<table className="legend-table" role="list" aria-label="District status legend"\>                                                                                     
             \<tbody\>                                                                                                                                                            
               {legendItems.map((item) \=\> (                                                                                                                                     
                 \<tr key={item.id} role="listitem"\>                                                                                                                             
                   \<td className="legend-swatch-cell"\>                                                                                                                          
                     {item.pattern ? (                                                                                                                                          
                       \<span                                                                                                                                                    
                         className={\`legend-swatch legend-pattern-${item.pattern}\`}                                                                                             
                         aria-hidden="true"                                                                                                                                     
                       /\>                                                                                                                                                       
                     ) : (                                                                                                                                                      
                       \<span                                                                                                                                                    
                         className="legend-swatch"                                                                                                                              
                         style={{ backgroundColor: item.color }}                                                                                                                
                         aria-hidden="true"                                                                                                                                     
                       /\>                                                                                                                                                       
                     )}                                                                                                                                                         
                   \</td\>                                                                                                                                                        
                   \<td className="legend-label-cell"\>                                                                                                                           
                     \<span className="legend-label"\>{item.label}\</span\>                                                                                                         
                   \</td\>                                                                                                                                                        
                   \<td className="legend-desc-cell"\>                                                                                                                            
                     \<span className="legend-desc"\>{item.description}\</span\>                                                                                                    
                   \</td\>                                                                                                                                                        
                 \</tr\>                                                                                                                                                          
               ))}                                                                                                                                                              
             \</tbody\>                                                                                                                                                           
           \</table\>                                                                                                                                                             
           \<p className="legend-footnote"\>                                                                                                                                      
             {activeLens \=== 'opportunity'                                                                                                                                      
               ? 'Margins from 2022 election (SC Democratic Party)'                                                                                                             
               : 'Source: SC Ethics Commission \+ Challenge Sheet'}                                                                                                              
           \</p\>                                                                                                                                                                 
         \</div\>                                                                                                                                                                 
       )}                                                                                                                                                                       
     \</div\>                                                                                                                                                                     
   );                                                                                                                                                                           
 }                                                                                                                                                                              
                                                                                                                                                                                
 \---                                                                                                                                                                            
 3.6 Lens-Aware KPI Cards                                                                                                                                                       
                                                                                                                                                                                
 Modify KPI section in: src/app/\[state\]/page.tsx                                                                                                                                
                                                                                                                                                                                
 Each lens should show different KPIs relevant to its strategic purpose.                                                                                                        
                                                                                                                                                                                
 // KPIs change based on active lens                                                                                                                                            
 const lensKPIs \= useMemo(() \=\> {                                                                                                                                               
   if (\!candidatesData || \!electionsData) return null;                                                                                                                          
                                                                                                                                                                                
   const districts \= candidatesData\[chamber\];                                                                                                                                   
   const elections \= electionsData\[chamber\];                                                                                                                                    
   const totalDistricts \= Object.keys(districts).length;                                                                                                                        
                                                                                                                                                                                
   // Calculate base metrics                                                                                                                                                    
   let demIncumbents \= 0;                                                                                                                                                       
   let repIncumbents \= 0;                                                                                                                                                       
   let demFiled \= 0;                                                                                                                                                            
   let contested \= 0;                                                                                                                                                           
   let hotOpportunities \= 0;                                                                                                                                                    
   let warmOpportunities \= 0;                                                                                                                                                   
   let possibleOpportunities \= 0;                                                                                                                                               
   let needsCandidate \= 0;                                                                                                                                                      
                                                                                                                                                                                
   for (const \[districtNum, district\] of Object.entries(districts)) {                                                                                                           
     const hasDem \= district.candidates.some(c \=\> c.party?.toLowerCase() \=== 'democratic');                                                                                     
     const hasRep \= district.candidates.some(c \=\> c.party?.toLowerCase() \=== 'republican');                                                                                     
     const isDemIncumbent \= district.incumbent?.party \=== 'Democratic';                                                                                                         
     const isRepIncumbent \= district.incumbent?.party \=== 'Republican';                                                                                                         
                                                                                                                                                                                
     if (isDemIncumbent) demIncumbents++;                                                                                                                                       
     if (isRepIncumbent) repIncumbents++;                                                                                                                                       
     if (hasDem || isDemIncumbent) demFiled++;                                                                                                                                  
     if (hasDem && hasRep) contested++;                                                                                                                                         
                                                                                                                                                                                
     if (\!hasDem && \!isDemIncumbent) {                                                                                                                                          
       const electionHistory \= elections\[districtNum\];                                                                                                                          
       const margin \= electionHistory?.elections?.\['2022'\]?.margin ?? 100;                                                                                                      
                                                                                                                                                                                
       if (margin \<= 5\) hotOpportunities++;                                                                                                                                     
       else if (margin \<= 10\) warmOpportunities++;                                                                                                                              
       else if (margin \<= 15\) possibleOpportunities++;                                                                                                                          
                                                                                                                                                                                
       if (margin \<= 15\) needsCandidate++;                                                                                                                                      
     }                                                                                                                                                                          
   }                                                                                                                                                                            
                                                                                                                                                                                
   // Return KPIs based on active lens                                                                                                                                          
   switch (activeLens) {                                                                                                                                                        
     case 'incumbents':                                                                                                                                                         
       return \[                                                                                                                                                                 
         { label: 'Dem Seats', value: demIncumbents, color: '\#1E40AF', subtitle: 'Current Dem control' },                                                                       
         { label: 'Rep Seats', value: repIncumbents, color: '\#991B1B', subtitle: 'Current Rep control' },                                                                       
         { label: 'Open Seats', value: totalDistricts \- demIncumbents \- repIncumbents, color: '\#6B7280', subtitle: 'No incumbent' },                                            
         { label: 'Total Districts', value: totalDistricts, color: '\#374151', subtitle: chamber \=== 'house' ? 'House' : 'Senate' }                                              
       \];                                                                                                                                                                       
                                                                                                                                                                                
     case 'dem-filing':                                                                                                                                                         
       return \[                                                                                                                                                                 
         { label: 'Dem Filed', value: demFiled, color: '\#2563EB', subtitle: \`of ${totalDistricts} districts\` },                                                                 
         { label: 'Needs Candidate', value: needsCandidate, color: '\#D97706', subtitle: 'Margin ≤15pts' },                                                                      
         { label: 'Coverage', value: \`${Math.round(demFiled / totalDistricts \* 100)}%\`, color: '\#059669', subtitle: 'Filing progress' },                                        
         { label: 'Priority', value: hotOpportunities, color: '\#DC2626', subtitle: 'Hot (≤5pts)' }                                                                              
       \];                                                                                                                                                                       
                                                                                                                                                                                
     case 'opportunity':                                                                                                                                                        
       return \[                                                                                                                                                                 
         { label: 'Hot Zones', value: hotOpportunities, color: '\#EF4444', subtitle: '≤5pt margin' },                                                                            
         { label: 'Warm Zones', value: warmOpportunities, color: '\#F59E0B', subtitle: '6-10pt margin' },                                                                        
         { label: 'Possible', value: possibleOpportunities, color: '\#FDE047', subtitle: '11-15pt margin' },                                                                     
         { label: 'Defensive', value: demIncumbents, color: '\#1E40AF', subtitle: 'Protect Dem seats' }                                                                          
       \];                                                                                                                                                                       
                                                                                                                                                                                
     case 'battleground':                                                                                                                                                       
       return \[                                                                                                                                                                 
         { label: 'Contested', value: contested, color: '\#7C3AED', subtitle: 'Both D & R filed' },                                                                              
         { label: 'Dem Uncontested', value: demFiled \- contested, color: '\#1E40AF', subtitle: 'Only Dem filed' },                                                               
         { label: 'Rep Uncontested', value: repIncumbents \- contested, color: '\#991B1B', subtitle: 'Only Rep filed' },                                                          
         { label: 'None Filed', value: totalDistricts \- demFiled \- (repIncumbents \- contested), color: '\#9CA3AF', subtitle: 'No candidates' }                                   
       \];                                                                                                                                                                       
                                                                                                                                                                                
     default:                                                                                                                                                                   
       return \[\];                                                                                                                                                               
   }                                                                                                                                                                            
 }, \[candidatesData, electionsData, chamber, activeLens\]);                                                                                                                      
                                                                                                                                                                                
 \---                                                                                                                                                                            
 3.7 Sync Data Button                                                                                                                                                           
                                                                                                                                                                                
 Create: src/components/Admin/SyncDataButton.tsx                                                                                                                                
                                                                                                                                                                                
 Allows manual triggering of the data sync workflow from the frontend.                                                                                                          
                                                                                                                                                                                
 // src/components/Admin/SyncDataButton.tsx                                                                                                                                     
                                                                                                                                                                                
 'use client';                                                                                                                                                                  
                                                                                                                                                                                
 import { useState } from 'react';                                                                                                                                              
                                                                                                                                                                                
 interface SyncDataButtonProps {                                                                                                                                                
   className?: string;                                                                                                                                                          
 }                                                                                                                                                                              
                                                                                                                                                                                
 /\*\*                                                                                                                                                                            
  \* Sync Data Button                                                                                                                                                            
  \*                                                                                                                                                                             
  \* Triggers the GitHub Actions workflow to sync data from the Challenge Sheet.                                                                                                 
  \* Only works with proper GitHub token configured.                                                                                                                             
  \*/                                                                                                                                                                            
 export default function SyncDataButton({ className \= '' }: SyncDataButtonProps) {                                                                                              
   const \[isSyncing, setIsSyncing\] \= useState(false);                                                                                                                           
   const \[lastSync, setLastSync\] \= useState\<string | null\>(null);                                                                                                               
   const \[error, setError\] \= useState\<string | null\>(null);                                                                                                                     
                                                                                                                                                                                
   const handleSync \= async () \=\> {                                                                                                                                             
     setIsSyncing(true);                                                                                                                                                        
     setError(null);                                                                                                                                                            
                                                                                                                                                                                
     try {                                                                                                                                                                      
       // Trigger GitHub Actions workflow dispatch                                                                                                                              
       const response \= await fetch(                                                                                                                                            
         'https://api.github.com/repos/russellteter/sc-election-map-2026/actions/workflows/sync-challenge-sheet.yml/dispatches',                                                
         {                                                                                                                                                                      
           method: 'POST',                                                                                                                                                      
           headers: {                                                                                                                                                           
             'Authorization': \`token ${process.env.NEXT\_PUBLIC\_GITHUB\_PAT}\`,                                                                                                    
             'Accept': 'application/vnd.github.v3+json',                                                                                                                        
             'Content-Type': 'application/json'                                                                                                                                 
           },                                                                                                                                                                   
           body: JSON.stringify({                                                                                                                                               
             ref: 'main'                                                                                                                                                        
           })                                                                                                                                                                   
         }                                                                                                                                                                      
       );                                                                                                                                                                       
                                                                                                                                                                                
       if (response.status \=== 204\) {                                                                                                                                           
         setLastSync(new Date().toLocaleTimeString());                                                                                                                          
         // Note: The actual data update happens asynchronously                                                                                                                 
         // User will need to refresh after workflow completes (\~1-2 min)                                                                                                       
       } else {                                                                                                                                                                 
         throw new Error(\`Unexpected response: ${response.status}\`);                                                                                                            
       }                                                                                                                                                                        
     } catch (err) {                                                                                                                                                            
       setError(err instanceof Error ? err.message : 'Sync failed');                                                                                                            
     } finally {                                                                                                                                                                
       setIsSyncing(false);                                                                                                                                                     
     }                                                                                                                                                                          
   };                                                                                                                                                                           
                                                                                                                                                                                
   // Don't render if no PAT configured                                                                                                                                         
   if (\!process.env.NEXT\_PUBLIC\_GITHUB\_PAT) {                                                                                                                                   
     return null;                                                                                                                                                               
   }                                                                                                                                                                            
                                                                                                                                                                                
   return (                                                                                                                                                                     
     \<div className={\`sync-button-container ${className}\`}\>                                                                                                                     
       \<button                                                                                                                                                                  
         type="button"                                                                                                                                                          
         onClick={handleSync}                                                                                                                                                   
         disabled={isSyncing}                                                                                                                                                   
         className="sync-button"                                                                                                                                                
         title="Sync data from Challenge Sheet"                                                                                                                                 
       \>                                                                                                                                                                        
         {isSyncing ? (                                                                                                                                                         
           \<\>                                                                                                                                                                   
             \<svg className="sync-spinner" viewBox="0 0 24 24" width="16" height="16"\>                                                                                          
               \<circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="31.4" strokeDashoffset="10" /\>                                 
             \</svg\>                                                                                                                                                             
             \<span\>Syncing...\</span\>                                                                                                                                            
           \</\>                                                                                                                                                                  
         ) : (                                                                                                                                                                  
           \<\>                                                                                                                                                                   
             \<svg className="sync-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"\>                                                           
               \<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0        
 01-15.357-2m15.357 2H15" /\>                                                                                                                                                    
             \</svg\>                                                                                                                                                             
             \<span\>Sync Data\</span\>                                                                                                                                             
           \</\>                                                                                                                                                                  
         )}                                                                                                                                                                     
       \</button\>                                                                                                                                                                
                                                                                                                                                                                
       {lastSync && (                                                                                                                                                           
         \<span className="sync-status success"\>                                                                                                                                 
           ✓ Triggered at {lastSync}                                                                                                                                            
         \</span\>                                                                                                                                                                
       )}                                                                                                                                                                       
                                                                                                                                                                                
       {error && (                                                                                                                                                              
         \<span className="sync-status error"\>                                                                                                                                   
           ✗ {error}                                                                                                                                                            
         \</span\>                                                                                                                                                                
       )}                                                                                                                                                                       
     \</div\>                                                                                                                                                                     
   );                                                                                                                                                                           
 }                                                                                                                                                                              
                                                                                                                                                                                
 \---                                                                                                                                                                            
 Part IV: Integration                                                                                                                                                           
                                                                                                                                                                                
 4.1 State Page Updates                                                                                                                                                         
                                                                                                                                                                                
 Modify: src/app/\[state\]/page.tsx                                                                                                                                               
                                                                                                                                                                                
 This is the main integration point. Changes needed:                                                                                                                            
                                                                                                                                                                                
 1\. Import and use useLens hook                                                                                                                                                 
 2\. Add \<LensToggleBar\> between FilterPanel and Map                                                                                                                             
 3\. Pass activeLens to map components and Legend                                                                                                                                
 4\. Update KPI rendering based on lens                                                                                                                                          
 5\. Ensure filters and lenses work together                                                                                                                                     
                                                                                                                                                                                
 Key Integration Points:                                                                                                                                                        
                                                                                                                                                                                
 // src/app/\[state\]/page.tsx \- Key additions                                                                                                                                    
                                                                                                                                                                                
 import { useLens } from '@/hooks/useLens';                                                                                                                                     
 import LensToggleBar from '@/components/Lens/LensToggleBar';                                                                                                                   
 import type { LensId } from '@/types/lens';                                                                                                                                    
                                                                                                                                                                                
 export default function StateDashboard() {                                                                                                                                     
   // ... existing state ...                                                                                                                                                    
                                                                                                                                                                                
   // ADD: Lens state management                                                                                                                                                
   const { activeLens, setActiveLens } \= useLens();                                                                                                                             
                                                                                                                                                                                
   // ... existing logic ...                                                                                                                                                    
                                                                                                                                                                                
   return (                                                                                                                                                                     
     \<div className="atmospheric-bg min-h-screen flex flex-col"\>                                                                                                                
       {/\* ... Header ... \*/}                                                                                                                                                   
                                                                                                                                                                                
       {/\* Filter Bar \*/}                                                                                                                                                       
       \<div className="border-b animate-entrance stagger-2" style={{ background: '\#FAFAFA', borderColor: '\#E2E8F0' }}\>                                                          
         \<div className="max-w-7xl mx-auto px-4 py-2"\>                                                                                                                          
           \<FilterPanel filters={filters} onFilterChange={setFilters} variant="horizontal" /\>                                                                                   
         \</div\>                                                                                                                                                                 
       \</div\>                                                                                                                                                                   
                                                                                                                                                                                
       {/\* ADD: Lens Toggle Bar \*/}                                                                                                                                             
       \<div className="border-b" style={{ background: 'white', borderColor: '\#E2E8F0' }}\>                                                                                       
         \<div className="max-w-7xl mx-auto px-4 py-2"\>                                                                                                                          
           \<LensToggleBar                                                                                                                                                       
             activeLens={activeLens}                                                                                                                                            
             onLensChange={setActiveLens}                                                                                                                                       
           /\>                                                                                                                                                                   
         \</div\>                                                                                                                                                                 
       \</div\>                                                                                                                                                                   
                                                                                                                                                                                
       {/\* Main content \*/}                                                                                                                                                     
       \<div className="flex-1 flex flex-col lg:flex-row"\>                                                                                                                       
         \<div className="flex-1 flex flex-col p-4"\>                                                                                                                             
           {/\* KPIs \- now lens-aware \*/}                                                                                                                                        
           {lensKPIs && (                                                                                                                                                       
             \<div className="kpi-grid mb-4"\>                                                                                                                                    
               {lensKPIs.map((kpi, idx) \=\> (                                                                                                                                    
                 \<div key={kpi.label} className="kpi-card" style={{ animationDelay: \`${idx \* 50}ms\` }}\>                                                                         
                   \<div className="label" style={{ color: kpi.color }}\>{kpi.label}\</div\>                                                                                        
                   \<div className="value font-display" style={{ color: kpi.color }}\>{kpi.value}\</div\>                                                                           
                   \<div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}\>{kpi.subtitle}\</div\>                                                                    
                 \</div\>                                                                                                                                                         
               ))}                                                                                                                                                              
             \</div\>                                                                                                                                                             
           )}                                                                                                                                                                   
                                                                                                                                                                                
           {/\* Map \*/}                                                                                                                                                          
           \<div id="map-container" className="flex-1 map-container min-h-\[400px\] relative"\>                                                                                     
             \<NavigableDistrictMap                                                                                                                                              
               stateCode={stateCode}                                                                                                                                            
               chamber={chamber}                                                                                                                                                
               candidatesData={candidatesData}                                                                                                                                  
               electionsData={electionsData}                                                                                                                                    
               selectedDistrict={selectedDistrict}                                                                                                                              
               onDistrictSelect={setSelectedDistrict}                                                                                                                           
               onDistrictHover={setHoveredDistrict}                                                                                                                             
               filteredDistricts={filteredDistricts}                                                                                                                            
               activeLens={activeLens}  // ADD: Pass lens to map                                                                                                                
               enableNavigation={true}                                                                                                                                          
             /\>                                                                                                                                                                 
                                                                                                                                                                                
             {/\* Legend \- now lens-aware \*/}                                                                                                                                    
             \<Legend activeLens={activeLens} /\>                                                                                                                                 
           \</div\>                                                                                                                                                               
         \</div\>                                                                                                                                                                 
                                                                                                                                                                                
         {/\* ... Side panel ... \*/}                                                                                                                                             
       \</div\>                                                                                                                                                                   
     \</div\>                                                                                                                                                                     
   );                                                                                                                                                                           
 }                                                                                                                                                                              
                                                                                                                                                                                
 4.2 Map Component Updates                                                                                                                                                      
                                                                                                                                                                                
 Modify: src/components/Map/DistrictMap.tsx (and NavigableDistrictMap.tsx)                                                                                                      
                                                                                                                                                                                
 Add activeLens prop and update color determination.                                                                                                                            
                                                                                                                                                                                
 // Add to props interface                                                                                                                                                      
 interface DistrictMapProps {                                                                                                                                                   
   // ... existing props ...                                                                                                                                                    
   activeLens?: LensId;                                                                                                                                                         
 }                                                                                                                                                                              
                                                                                                                                                                                
 // In the component, use lens for coloring                                                                                                                                     
 const districtColor \= getDistrictFillColorWithLens(                                                                                                                            
   district,                                                                                                                                                                    
   electionHistory,                                                                                                                                                             
   opportunityData,                                                                                                                                                             
   activeLens,                                                                                                                                                                  
   false // useSolidColors                                                                                                                                                      
 );                                                                                                                                                                             
                                                                                                                                                                                
 \---                                                                                                                                                                            
 Part V: Critical Files Summary                                                                                                                                                 
                                                                                                                                                                                
 New Files to Create                                                                                                                                                            
 ┌────────────────────────────────────────────┬─────────────────────────────────────────┐                                                                                       
 │                    File                    │                 Purpose                 │                                                                                       
 ├────────────────────────────────────────────┼─────────────────────────────────────────┤                                                                                       
 │ scripts/sheets\_loader.py                   │ Fetch and parse Google Sheet data       │                                                                                       
 ├────────────────────────────────────────────┼─────────────────────────────────────────┤                                                                                       
 │ scripts/merge\_data.py                      │ Merge Sheet \+ Ethics Commission data    │                                                                                       
 ├────────────────────────────────────────────┼─────────────────────────────────────────┤                                                                                       
 │ scripts/calculate\_opportunity.py           │ Calculate opportunity tiers             │                                                                                       
 ├────────────────────────────────────────────┼─────────────────────────────────────────┤                                                                                       
 │ .github/workflows/sync-challenge-sheet.yml │ Nightly sync automation                 │                                                                                       
 ├────────────────────────────────────────────┼─────────────────────────────────────────┤                                                                                       
 │ src/types/lens.ts                          │ Lens type definitions and color schemes │                                                                                       
 ├────────────────────────────────────────────┼─────────────────────────────────────────┤                                                                                       
 │ src/hooks/useLens.ts                       │ Lens state management with URL sync     │                                                                                       
 ├────────────────────────────────────────────┼─────────────────────────────────────────┤                                                                                       
 │ src/components/Lens/LensToggleBar.tsx      │ Lens selector UI component              │                                                                                       
 ├────────────────────────────────────────────┼─────────────────────────────────────────┤                                                                                       
 │ src/components/Admin/SyncDataButton.tsx    │ Manual sync trigger button              │                                                                                       
 └────────────────────────────────────────────┴─────────────────────────────────────────┘                                                                                       
 Files to Modify                                                                                                                                                                
 ┌─────────────────────────────────────────────┬────────────────────────────────────────────────┐                                                                               
 │                    File                     │                    Changes                     │                                                                               
 ├─────────────────────────────────────────────┼────────────────────────────────────────────────┤                                                                               
 │ src/lib/districtColors.ts                   │ Add lens-aware color functions                 │                                                                               
 ├─────────────────────────────────────────────┼────────────────────────────────────────────────┤                                                                               
 │ src/components/Map/Legend.tsx               │ Accept activeLens prop, render dynamic items   │                                                                               
 ├─────────────────────────────────────────────┼────────────────────────────────────────────────┤                                                                               
 │ src/components/Map/DistrictMap.tsx          │ Accept activeLens prop, use new color function │                                                                               
 ├─────────────────────────────────────────────┼────────────────────────────────────────────────┤                                                                               
 │ src/components/Map/NavigableDistrictMap.tsx │ Pass activeLens through                        │                                                                               
 ├─────────────────────────────────────────────┼────────────────────────────────────────────────┤                                                                               
 │ src/app/\[state\]/page.tsx                    │ Integrate lens system, add LensToggleBar       │                                                                               
 └─────────────────────────────────────────────┴────────────────────────────────────────────────┘                                                                               
 Data Files (Auto-Generated)                                                                                                                                                    
 ┌────────────────────────────────────┬───────────────────────────────┐                                                                                                         
 │                File                │            Source             │                                                                                                         
 ├────────────────────────────────────┼───────────────────────────────┤                                                                                                         
 │ public/data/candidates.json        │ Merged Sheet \+ Ethics data    │                                                                                                         
 ├────────────────────────────────────┼───────────────────────────────┤                                                                                                         
 │ public/data/opportunity.json       │ Calculated opportunity tiers  │                                                                                                         
 ├────────────────────────────────────┼───────────────────────────────┤                                                                                                         
 │ scripts/data/sheet-candidates.json │ Raw Sheet data (intermediate) │                                                                                                         
 └────────────────────────────────────┴───────────────────────────────┘                                                                                                         
 \---                                                                                                                                                                            
 Part VI: Verification Plan                                                                                                                                                     
                                                                                                                                                                                
 Data Pipeline Testing                                                                                                                                                          
                                                                                                                                                                                
 1\. Sheets Loader Test                                                                                                                                                          
 \# Set credentials and run locally                                                                                                                                              
 export GOOGLE\_CREDENTIALS\_JSON=$(cat credentials.json)                                                                                                                         
 python scripts/sheets\_loader.py                                                                                                                                                
                                                                                                                                                                                
 \# Verify output                                                                                                                                                                
 cat scripts/data/sheet-candidates.json | jq '.house | keys | length'                                                                                                           
 \# Expected: 124                                                                                                                                                                
 2\. Merge Script Test                                                                                                                                                           
 python scripts/merge\_data.py                                                                                                                                                   
                                                                                                                                                                                
 \# Verify merged output                                                                                                                                                         
 cat public/data/candidates.json | jq '.source'                                                                                                                                 
 \# Expected: "Merged: Google Sheets \+ SC Ethics Commission"                                                                                                                     
 3\. GitHub Action Test                                                                                                                                                          
   \- Trigger workflow manually via GitHub UI                                                                                                                                    
   \- Verify commit created with updated data                                                                                                                                    
   \- Check that website reflects changes after build                                                                                                                            
                                                                                                                                                                                
 Frontend Testing                                                                                                                                                               
                                                                                                                                                                                
 1\. Default View                                                                                                                                                                
   \- Navigate to /sc?chamber=house                                                                                                                                              
   \- Verify map shows red/blue incumbent colors                                                                                                                                 
   \- Verify legend shows "Incumbents" lens items                                                                                                                                
 2\. Lens Switching                                                                                                                                                              
   \- Click each lens button                                                                                                                                                     
   \- Verify map colors change appropriately                                                                                                                                     
   \- Verify legend updates to match lens                                                                                                                                        
   \- Verify KPIs update to match lens                                                                                                                                           
 3\. URL State                                                                                                                                                                   
   \- Select "Opportunity" lens                                                                                                                                                  
   \- Copy URL (should include ?lens=opportunity)                                                                                                                                
   \- Open in new tab                                                                                                                                                            
   \- Verify Opportunity lens is active                                                                                                                                          
 4\. Filters \+ Lenses                                                                                                                                                            
   \- Select "Democratic" party filter                                                                                                                                           
   \- Verify districts are filtered                                                                                                                                              
   \- Switch lenses                                                                                                                                                              
   \- Verify filter persists across lens changes                                                                                                                                 
 5\. Mobile Testing                                                                                                                                                              
   \- View on 375px viewport                                                                                                                                                     
   \- Verify lens toggle scrolls horizontally                                                                                                                                    
   \- Verify short labels shown                                                                                                                                                  
   \- Verify legend is collapsible                                                                                                                                               
                                                                                                                                                                                
 End-to-End Flow                                                                                                                                                                
                                                                                                                                                                                
 1\. Update Google Sheet with test change (e.g., change one district's "Democrat Filed" to "Y")                                                                                  
 2\. Trigger manual sync via button (or wait for nightly)                                                                                                                        
 3\. After \~2 minutes, refresh website                                                                                                                                           
 4\. Verify the district now shows as "Dem Filed" in Filing Progress lens                                                                                                        
 5\. Verify all 4 lenses display correctly with new data                                                                                                                         
                                                                                                                                                                                
 \---                                                                                                                                                                            
 Part VII: Success Criteria                                                                                                                                                     
 ┌───────────────────────┬────────────────────────────────────────────────────┐                                                                                                 
 │       Criterion       │                    Verification                    │                                                                                                 
 ├───────────────────────┼────────────────────────────────────────────────────┤                                                                                                 
 │ Accurate Default View │ Map correctly shows R/D incumbents from Sheet data │                                                                                                 
 ├───────────────────────┼────────────────────────────────────────────────────┤                                                                                                 
 │ All 4 Lenses Working  │ Each lens changes colors and legend appropriately  │                                                                                                 
 ├───────────────────────┼────────────────────────────────────────────────────┤                                                                                                 
 │ Data Sync             │ Nightly sync updates website automatically         │                                                                                                 
 ├───────────────────────┼────────────────────────────────────────────────────┤                                                                                                 
 │ Manual Refresh        │ Frontend button triggers sync successfully         │                                                                                                 
 ├───────────────────────┼────────────────────────────────────────────────────┤                                                                                                 
 │ Filters Preserved     │ Existing filter system works alongside lenses      │                                                                                                 
 ├───────────────────────┼────────────────────────────────────────────────────┤                                                                                                 
 │ Both Chambers         │ House and Senate both work with all lenses         │                                                                                                 
 ├───────────────────────┼────────────────────────────────────────────────────┤                                                                                                 
 │ Mobile Responsive     │ Lens toggle and legend work on mobile              │                                                                                                 
 ├───────────────────────┼────────────────────────────────────────────────────┤                                                                                                 
 │ URL Shareable         │ Lens state persists in URL for sharing             │                                                                                                 
 ├───────────────────────┼────────────────────────────────────────────────────┤                                                                                                 
 │ KPIs Update           │ KPI cards show relevant stats per lens             │                                                                                                 
 ├───────────────────────┼────────────────────────────────────────────────────┤                                                                                                 
 │ Performance           │ No perceptible delay when switching lenses         │                                                                                                 
 └───────────────────────┴────────────────────────────────────────────────────┘                                                                                                 
 \---                                                                                                                                                                            
 Part VIII: Risk Mitigation                                                                                                                                                     
                                                                                                                                                                                
 If Google Sheet is Unavailable                                                                                                                                                 
                                                                                                                                                                                
 \- Fallback: Use cached candidates.json from last successful sync                                                                                                               
 \- Detection: Sheets Loader logs error, workflow doesn't commit                                                                                                                 
 \- Recovery: Manual re-run of workflow after Sheet access restored                                                                                                              
                                                                                                                                                                                
 If Lens Param is Invalid                                                                                                                                                       
                                                                                                                                                                                
 \- Behavior: Default to incumbents lens                                                                                                                                         
 \- Validation: useLens hook validates against known lens IDs                                                                                                                    
                                                                                                                                                                                
 If Ethics Commission Data Missing                                                                                                                                              
                                                                                                                                                                                
 \- Impact: Candidate details (report IDs, URLs) not available                                                                                                                   
 \- Mitigation: Sheet data still provides basic candidate info                                                                                                                   
 \- User Impact: Minimal \- core functionality preserved                                                                                                                          
                                                                                                                                                                                
 Performance Concerns                                                                                                                                                           
                                                                                                                                                                                
 \- Issue: Lens switching could be slow with 170 districts                                                                                                                       
 \- Mitigation: Memoize color calculations, use React.memo on map                                                                                                                
 \- Budget: Lens switch should feel instant (\<100ms)                                                                                                                             
                                                                                                                                                                                
 \---                                                                                                                                                                            
 This plan provides the complete vision, purpose, and implementation details for transforming the SC Election Map into a strategic intelligence platform with multi-lens        
 visualization capabilities.

