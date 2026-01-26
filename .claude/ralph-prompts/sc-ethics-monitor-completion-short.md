# SC Ethics Monitor Plan Completion - Short Invocation

## Completion Promise

Verify and complete all 15 plans across 5 phases in `sc-ethics-monitor/.planning/phases/`.
Do NOT trust ROADMAP status - verify each plan's success criteria independently.

---

## Loop Instructions

```
TASK: Verify and complete SC Ethics Monitor plans

LOCATION: /Users/russellteter/Desktop/sc-election-map-2026/sc-ethics-monitor/.planning/phases/

PHASES:
- 01-data-enrichment (3 plans)
- 02-usability-improvements (1 plan)
- 03-design-polish (1 plan)
- 04-candidate-discovery (5 plans)
- 05-data-remediation (5 plans)

FOR EACH PLAN:
1. Read {XX-YY}-PLAN.md
2. Run ALL <verification> items - don't trust SUMMARY claims
3. If verification fails: execute <tasks> in order
4. Re-verify until all pass
5. Write/update {XX-YY}-SUMMARY.md with actual results
6. Update ROADMAP.md status

CREDENTIALS:
- Google credentials: ../google-service-account copy.json
- Sheet ID: 17j_KFZFUw-ESBQlKlIccUMpGCFq_XdeL6WYph7zkxQo
- Firecrawl API: fc-be841b8715cb4097b861321f2fa87e98

VERIFICATION PATTERN:
```python
# Connect to Google Sheets
import gspread
from google.oauth2.service_account import Credentials
creds = Credentials.from_service_account_file('../google-service-account copy.json', scopes=['https://www.googleapis.com/auth/spreadsheets'])
gc = gspread.authorize(creds)
sheet = gc.open_by_key('17j_KFZFUw-ESBQlKlIccUMpGCFq_XdeL6WYph7zkxQo')
```

COMPLETE WHEN:
- All 15 plans have verified SUMMARY.md
- All verification items pass
- ROADMAP.md reflects actual state
- Report: "{X}/15 plans verified complete"
```

---

## Quick Reference

| Phase | Plans | Key Verification |
|-------|-------|-----------------|
| 01 | 01-01, 01-02, 01-03 | Excel file exists, 170 districts enriched |
| 02 | 02-01 | Lists tab, validation, formula columns |
| 03 | 03-01 | Dashboard tab, conditional formatting |
| 04 | 04-01 to 04-05 | candidate_discovery module, 213 tests pass |
| 05 | 05-01 to 05-05 | Party detection accurate, Race Analysis correct, 169 incumbents |
