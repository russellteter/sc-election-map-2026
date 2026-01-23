# Ralph Loop: SC Ethics Monitor Plan Completion

## Completion Promise

I will systematically verify and complete all plans in `/Users/russellteter/Desktop/sc-election-map-2026/sc-ethics-monitor/.planning/phases/`. For each plan, I will:

1. **Verify actual completion** by running the plan's verification commands and success criteria
2. **Execute incomplete work** following the plan's tasks in order
3. **Write SUMMARY.md** documenting what was done and any deviations
4. **Update ROADMAP.md** with accurate status

I will NOT trust existing "COMPLETE" markers in ROADMAP.md without verification.

---

## Loop Prompt

```
OBJECTIVE: Verify and complete all SC Ethics Monitor implementation plans.

WORKING DIRECTORY: /Users/russellteter/Desktop/sc-election-map-2026/sc-ethics-monitor

PLANS LOCATION: .planning/phases/

GOOGLE SHEET ID: 17j_KFZFUw-ESBQlKlIccUMpGCFq_XdeL6WYph7zkxQo

GOOGLE CREDENTIALS: ../google-service-account copy.json

FIRECRAWL API KEY: fc-be841b8715cb4097b861321f2fa87e98

---

## Phase Order

Process phases in order:
1. Phase 01: Data Enrichment (01-01, 01-02, 01-03)
2. Phase 02: Usability Improvements (02-01)
3. Phase 03: Design Polish (03-01)
4. Phase 04: Candidate Discovery (04-01 through 04-05)
5. Phase 05: Data Remediation (05-01 through 05-05)

---

## For Each Plan

### Step 1: Read the Plan
Read `.planning/phases/{phase}/{plan}-PLAN.md` to understand:
- <objective> - What must be achieved
- <tasks> - Specific implementation steps
- <verification> - Checkboxes that must pass
- <success_criteria> - Metrics for completion
- <output> - Required SUMMARY.md content

### Step 2: Check for Existing SUMMARY
If `.planning/phases/{phase}/{plan}-SUMMARY.md` exists:
- Read it to understand what was claimed complete
- Do NOT trust it blindly - proceed to verification

### Step 3: Run Verification
Execute ALL verification items from the plan:
- Run test commands (pytest, python -c, etc.)
- Check file existence (ls, glob)
- Verify Google Sheet data via Python gspread
- Check counts match expected values

Document verification results:
```
VERIFICATION: {plan}
[ ] Item 1: {result}
[ ] Item 2: {result}
...
PASSED: X/Y items
STATUS: COMPLETE | INCOMPLETE | PARTIAL
```

### Step 4: Execute Incomplete Tasks
If verification failed or SUMMARY doesn't exist:

For each <task> in the plan:
1. Read the <action> section
2. Execute the implementation
3. Run the <verify> command
4. Confirm <done> criteria met
5. Move to next task

### Step 5: Re-run Verification
After task execution, re-run all verification items.
All must pass before marking complete.

### Step 6: Write SUMMARY
Create/update `.planning/phases/{phase}/{plan}-SUMMARY.md` with:
- Execution date
- Tasks completed
- Verification results (all passing)
- Any deviations from plan
- Files created/modified

### Step 7: Update ROADMAP
After each phase completes, update `.planning/ROADMAP.md`:
- Change plan status to COMPLETE
- Update deliverables checkboxes
- Add results table if metrics changed

---

## Verification Commands Reference

### Check Google Sheet Connection
```python
import gspread
from google.oauth2.service_account import Credentials
creds = Credentials.from_service_account_file(
    '../google-service-account copy.json',
    scopes=['https://www.googleapis.com/auth/spreadsheets']
)
gc = gspread.authorize(creds)
sheet = gc.open_by_key('17j_KFZFUw-ESBQlKlIccUMpGCFq_XdeL6WYph7zkxQo')
print("Connected:", sheet.title)
```

### Check Candidates Tab
```python
ws = sheet.worksheet('Candidates')
data = ws.get_all_records()
print(f"Candidates: {len(data)}")
parties = {}
for c in data:
    p = c.get('detected_party') or 'UNKNOWN'
    parties[p] = parties.get(p, 0) + 1
print(f"By party: {parties}")
```

### Check Race Analysis Tab
```python
ws = sheet.worksheet('Race Analysis')
data = ws.get_all_records()
print(f"Districts: {len(data)}")
dem = sum(r.get('dem_candidates', 0) for r in data)
rep = sum(r.get('rep_candidates', 0) for r in data)
print(f"D candidates: {dem}, R candidates: {rep}")
incumbents = sum(1 for r in data if r.get('incumbent_name'))
print(f"With incumbents: {incumbents}")
```

### Run Discovery Pipeline Tests
```bash
cd /Users/russellteter/Desktop/sc-election-map-2026/sc-ethics-monitor
python scripts/verify_discovery.py --dry-run --verbose
```

### Run Party Detection
```bash
cd /Users/russellteter/Desktop/sc-election-map-2026/sc-ethics-monitor
python scripts/run_party_detection.py --force
```

### Check Module Imports
```bash
cd /Users/russellteter/Desktop/sc-election-map-2026/sc-ethics-monitor
python -c "from src.candidate_discovery import CandidateAggregator, BallotpediaSource"
python -c "from src.sheets_sync import SheetsSync"
python -c "from src.party_detector import PartyDetector"
```

### Run Tests
```bash
cd /Users/russellteter/Desktop/sc-election-map-2026/sc-ethics-monitor
pytest tests/ -v --tb=short
```

---

## Expected Final State

When all plans are truly complete:

### Data State
- 28+ candidates in Candidates tab
- 7+ with detected party (D or R)
- 169/170 incumbents in Race Analysis
- 121 High-D-Recruit priority districts
- 0 data conflicts

### File State
- All 15 PLAN.md files have corresponding SUMMARY.md
- All modules in src/candidate_discovery/ exist and import
- All tests in tests/ pass
- Excel file exists at data/SC_Ethics_Districts_Enriched.xlsx

### System State
- Discovery pipeline runs without errors (may return 0 candidates)
- Party detection runs without errors
- Sheets sync runs without errors
- All verification commands succeed

---

## Failure Handling

If a verification fails:
1. Document the failure in detail
2. Analyze root cause
3. Implement fix following plan tasks
4. Re-verify after fix
5. If unfixable, document in SUMMARY as known issue

If external dependency unavailable (API down, sheet inaccessible):
1. Document the dependency issue
2. Skip to next verifiable item
3. Return to blocked items when dependency restored

---

## Progress Tracking

After each plan, report:
```
PROGRESS: {completed}/{total} plans verified complete
CURRENT: Phase {X}, Plan {Y}
NEXT: Phase {X}, Plan {Z}
BLOCKED: {list any blocked plans}
```

When all plans verified:
```
ALL PLANS COMPLETE
Total: 15 plans across 5 phases
Verified: YYYY-MM-DD
```
```

---

## Invocation

To start the Ralph Loop:
```
/ralph-loop
```

Paste this prompt when prompted for the loop instructions, or reference this file:
```
@.claude/ralph-prompts/sc-ethics-monitor-completion.md
```
