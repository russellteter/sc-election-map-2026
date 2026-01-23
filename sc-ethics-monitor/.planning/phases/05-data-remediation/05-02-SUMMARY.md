# 05-02 Summary: Fix Race Analysis Aggregation

## Execution Date
2026-01-22

## Tasks Completed

### Task 1: Analyze current update_race_analysis() Logic
Location: `src/sheets_sync.py:630-801`

The function:
1. Gets all candidates via `get_all_candidates()`
2. Counts candidates by district using `final_party`
3. Clears Race Analysis tab and rebuilds it
4. Sets race_status based on candidate party mix

### Task 2: Identify Aggregation Bug
**Root Cause Found (line 666):**
```python
final_party = candidate.get("final_party", "")
```

The `final_party` column is a spreadsheet formula (`=IF(K{row}<>"",K{row},G{row})`) that wasn't populated in the raw data. When reading candidates, only columns A-I were filled, leaving `final_party` (column L) empty.

**Result:** All candidates had empty `final_party`, so counts were always 0.

### Task 3: Fix Candidate Reading Logic
**Fix Applied:**
```python
# Use final_party, fallback to detected_party if final_party is empty
final_party = candidate.get("final_party", "") or candidate.get("detected_party", "")
```

This ensures we use `detected_party` when `final_party` isn't populated.

### Task 4: Fix Grouping and Counting Logic
No changes needed - the grouping logic was correct, just receiving empty party values.

### Task 5: Fix race_status Calculation
No changes needed - race_status logic was already correct:
- "Contested" = has both D and R
- "Unopposed-D" = only D candidates or D incumbent with no opponents
- "Unopposed-R" = only R candidates or R incumbent with no opponents
- "Unknown" = no data

### Task 6: Re-run Race Analysis Update
```bash
python -c "from src.sheets_sync import SheetsSync; ..."
```

**Important:** Must pass `districts_data` parameter with incumbent info, otherwise the function clears incumbent data when rebuilding the tab.

### Task 7: Verify Counts
**Sample Verification:**
| District | Incumbent | Party | dem_candidates | rep_candidates | Status |
|----------|-----------|-------|----------------|----------------|--------|
| SC-House-003 | Phillip Bowers | R | 0 | 1 | Unopposed-R |
| SC-House-050 | Keishan M. Scott | D | 1 | 0 | Unopposed-D |
| SC-House-052 | Jermaine L. Johnson Sr. | D | 1 | 0 | Unopposed-D |
| SC-House-088 | John Lastinger | R | 0 | 1 | Unopposed-R |

All counts verified correct against Candidates tab.

## Fix Details

### File Modified
`src/sheets_sync.py` line 666

### Change
```diff
-            # Use final_party, not detected_party!
-            final_party = candidate.get("final_party", "")
+            # Use final_party, fallback to detected_party if final_party is empty
+            # (final_party may be empty because it's a formula column that wasn't populated)
+            final_party = candidate.get("final_party", "") or candidate.get("detected_party", "")
```

## Statistics After Fix

### Priority Breakdown (170 districts)
| Priority | Count | Description |
|----------|-------|-------------|
| High-D-Recruit | 121 | R incumbent, no D candidate filed |
| Low | 48 | D incumbent (already held) |
| Open-Seat | 1 | No incumbent (District 98) |
| Monitor | 0 | Contested districts |

### Candidate Count Summary
| Metric | Count |
|--------|-------|
| Total candidates in sheet | 28 |
| With D party | 5 |
| With R party | 2 |
| Unknown party | 21 |

### Districts with Filed Candidates
| Party | Districts with Candidates |
|-------|---------------------------|
| Democrat | 5 (Districts 50, 52, 70, 91, 113) |
| Republican | 2 (Districts 3, 88) |

## Success Criteria
- [x] Race Analysis shows actual candidate counts (not all zeros)
- [x] dem_candidates + rep_candidates + other_candidates = total per district
- [x] race_status accurately reflects each district's competitive situation
- [x] No errors during update execution

## Usage Note
When running `update_race_analysis()`, always pass incumbent data:

```python
import json
from pathlib import Path
from src.sheets_sync import SheetsSync

# Load incumbents
with open('../src/data/party-data.json') as f:
    party_data = json.load(f)

# Transform party names (Republican->R, Democratic->D)
districts_data = {'house': {}, 'senate': {}}
for dist_num, info in party_data['incumbents']['house'].items():
    party_code = 'R' if info['party'] == 'Republican' else 'D'
    districts_data['house'][dist_num] = {'name': info['name'], 'party': party_code}
# ... same for senate

sync = SheetsSync()
sync.connect()
sync.update_race_analysis(districts_data=districts_data)
```

## Recommendations
1. Consider populating `final_party` column directly instead of using formula
2. Add a helper function to load incumbents in the correct format
3. Document that `update_race_analysis()` requires incumbent data parameter
