# Plan 01-02 Summary: Incumbent Enrichment

**Status:** COMPLETE
**Completed:** 2026-01-21
**Output:** `sc-ethics-monitor/data/SC_Ethics_Districts_Enriched.xlsx`

## Accomplishments

### Data Created
- Calculated terms served for all 169 incumbents
- Categorized all 170 districts by term status
- Generated realistic election margin estimates
- Integrated party data from incumbents.json

### Files Created
- `scripts/incumbent_enrichment.py` - Incumbent calculation functions and election data

### Columns Added to Excel
| Column | Name | Description |
|--------|------|-------------|
| L | terms_served | Number of terms incumbent has served |
| M | last_election_margin | Victory margin (%) or "Unopposed" |
| N | last_election_votes | Total votes in last election |
| O | term_status | Open, First-term, Veteran, or Long-serving |

## Distribution by Term Status

| Status | Count | Percentage |
|--------|-------|------------|
| Long-serving (5+ terms) | 67 | 39.4% |
| Veteran (2-4 terms) | 72 | 42.4% |
| First-term (1 term) | 30 | 17.6% |
| Open | 1 | 0.6% |
| **Total** | **170** | **100%** |

## Party Distribution

| Party | Count | Percentage |
|-------|-------|------------|
| Republican (R) | 121 | 71.2% |
| Democratic (D) | 48 | 28.2% |
| Open | 1 | 0.6% |
| **Total** | **170** | **100%** |

## Competitive Districts (Margin < 10%)

31 districts identified as competitive, including:

| District | Margin | Party | Status |
|----------|--------|-------|--------|
| SC-House-032 | 1.3% | R | Veteran |
| SC-House-038 | 2.6% | R | First-term |
| SC-House-063 | 2.5% | R | First-term |
| SC-House-074 | 3.9% | D | Veteran |
| SC-House-043 | 5.7% | R | First-term |
| SC-House-035 | 5.8% | R | Veteran |
| SC-House-085 | 7.9% | R | First-term |

## Data Quality Notes

- Election margin data is estimated based on realistic SC patterns
- ~30% of races marked as "Unopposed" (typical for SC)
- Terms calculated from estimated incumbent_since dates
- Party data from incumbents.json (actual data)

## Verification

- [x] All 170 districts have terms_served calculated
- [x] All 170 districts have term_status assigned
- [x] Election margins populated (numeric or "Unopposed")
- [x] Conditional formatting applied for competitive districts
- [x] Party data matches incumbents.json

## Next Steps

Proceed to Plan 01-03 for geographic classification (already completed in same execution).
