# SC Ethics Monitor - Google Sheets Source of Truth

A bidirectional sync system for tracking South Carolina legislative candidates from SC Ethics Commission filings to a Google Sheets dashboard.

## Overview

This system transforms Google Sheets from a write-only log into a true **Source of Truth** for SC election data:

- **170 Districts**: All SC House (124) and Senate (46) districts tracked
- **Bidirectional Sync**: Reads AND writes, respecting manual edits
- **Party Detection**: Auto-detect with manual override support
- **Research Queue**: Tracks candidates needing party verification
- **Race Analysis**: Recruitment priorities using final_party

## Key Principle

**Manual overrides take precedence.** If a user sets `manual_party_override` or `party_locked=Yes`, the system respects those values.

## Quick Start

```bash
# Install dependencies
cd sc-ethics-monitor
pip install -r requirements.txt

# Set up credentials (Google Service Account JSON)
export GOOGLE_SHEETS_CREDENTIALS=path/to/credentials.json

# Initialize the sheet
python scripts/initialize_sheet.py

# Run daily monitor (dry run first)
python -m src.monitor --dry-run

# Run for real
python -m src.monitor --skip-scrape --scrape-data ../scripts/data/ethics-state.json
```

## Sheet Structure

### Tabs

| Tab | Purpose |
|-----|---------|
| Districts | All 170 SC legislative districts with incumbent info |
| Candidates | Filed candidates with party detection |
| Race Analysis | Computed race status and recruitment priorities |
| Research Queue | Candidates needing manual party verification |
| Sync Log | Audit trail of all operations |

### Candidates Tab Columns

| Column | Field | Auto/Manual |
|--------|-------|-------------|
| A | report_id | Auto |
| B | candidate_name | Auto |
| C | district_id | Auto |
| D | filed_date | Auto |
| E | ethics_report_url | Auto |
| F | is_incumbent | Auto |
| G | detected_party | Auto |
| H | detection_confidence | Auto |
| I | detection_source | Auto |
| J | detection_evidence_url | Auto |
| **K** | **manual_party_override** | **Manual** |
| **L** | **final_party** | **Formula** |
| **M** | **party_locked** | **Manual** |
| N | detection_timestamp | Auto |
| **O** | **notes** | **Manual** |
| P | last_synced | Auto |

### Key Manual Columns

- **manual_party_override** (K): Set to D/R/I/O to override auto-detection
- **party_locked** (M): Set to "Yes" to skip all re-detection for this candidate
- **final_party** (L): Formula that shows manual override if set, else detected party
- **notes** (O): Free-form notes, preserved across syncs

## Data Flow

```
┌─────────────────────┐
│  Ethics Website     │
│  (Daily Scan)       │
└─────────┬───────────┘
          │ New filings
          ▼
┌─────────────────────┐
│  Party Detection    │◄──── Skip if party_locked=Yes
└─────────┬───────────┘
          │
          ▼
┌─────────────────────────────────────────────┐
│           GOOGLE SHEETS (Source of Truth)    │
│  • manual_party_override (user input)        │
│  • final_party = IF(manual, manual, detect)  │
│  • party_locked (skip re-detection)          │
└─────────────────────────────────────────────┘
          │
    ┌─────┴─────┐
    ▼           ▼
  Email      Race Analysis
  Reports    (uses final_party)
```

## Usage

### Daily Monitor

```bash
# Full run with ethics scraping
python -m src.monitor

# Dry run (no changes)
python -m src.monitor --dry-run

# Use cached scrape data
python -m src.monitor --skip-scrape --scrape-data data/ethics.json
```

### Candidate Discovery

Multi-source candidate discovery from Ballotpedia, SCDP, and SCGOP.

```bash
# Run discovery during daily monitor (scheduled weekly by default)
python -m src.monitor

# Force discovery to run regardless of schedule
python -m src.monitor --force-discovery

# Force discovery via environment variable
FORCE_DISCOVERY=1 python -m src.monitor

# Dry run with discovery (test without changes)
python -m src.monitor --dry-run --force-discovery
```

**Discovery Sources:**
- **Ballotpedia** (priority 2): Comprehensive candidate listings
- **SCDP** (priority 3): South Carolina Democratic Party website
- **SCGOP** (priority 3): South Carolina GOP website

**Configuration (Environment Variables):**

```bash
# Enable/disable discovery (default: true)
DISCOVERY_ENABLED=true

# Discovery frequency: daily, weekly, manual (default: weekly)
DISCOVERY_FREQUENCY=weekly

# Sources to use (comma-separated, default: all three)
DISCOVERY_SOURCES=ballotpedia,scdp,scgop

# Name matching threshold (default: 0.85)
NAME_SIMILARITY_THRESHOLD=0.85

# Firecrawl rate limit (default: 30 requests/minute)
FIRECRAWL_RPM=30
```

**Discovery Pipeline:**

1. Sources scrape candidate data from external websites
2. Candidates are deduplicated using fuzzy name matching
3. Conflicts between sources are detected and logged
4. New candidates are added to Google Sheets as placeholders
5. Coverage report is generated and included in email notifications

### Verification Script

Verify the discovery pipeline is working correctly:

```bash
# Run all verification tests
python scripts/verify_discovery.py

# Dry run (no API calls)
python scripts/verify_discovery.py --dry-run

# Test specific source
python scripts/verify_discovery.py --source ballotpedia

# Limit districts tested
python scripts/verify_discovery.py --districts 3

# Verbose output
python scripts/verify_discovery.py --verbose

# Output results to JSON
python scripts/verify_discovery.py --output results.json
```

### Validation Tests

```bash
# Run validation tests
python -m src.test_validation

# Verify specific behaviors
python -m src.test_validation --credentials creds.json
```

### Run Pipeline Tests

```bash
# Run end-to-end discovery pipeline tests
pytest tests/test_discovery_pipeline.py -v

# Run all tests
pytest tests/ -v
```

### Python API

```python
from src.sheets_sync import SheetsSync

# Connect
sync = SheetsSync("credentials.json")
sync.connect()

# Read current state (respects manual edits)
state = sync.read_sheet_state()

# Check if candidate is locked
if sync.is_party_locked("12345", state):
    print("Skipping party detection - locked")

# Add/update candidate (preserves manual columns)
sync.add_candidate(
    report_id="12345",
    candidate_name="John Smith",
    district_id="SC-House-042",
    filed_date="2026-01-15",
    ethics_report_url="https://...",
    is_incumbent=False,
    detected_party="D",
    detection_confidence="HIGH",
    sheet_state=state,
)

# Update race analysis
sync.update_race_analysis()

# Get high-priority recruitment districts
priorities = sync.get_high_priority_districts()
```

## Formatting

The sheet includes:

- **Frozen headers** on all tabs
- **Party colors**: D=Blue, R=Red, I/O=Gray
- **Confidence colors**: HIGH=Green, MEDIUM=Yellow, LOW=Orange, UNKNOWN=Red
- **Dropdowns**: manual_party_override (D/R/I/O), party_locked (Yes), status

## Environment Variables

```bash
# Required
GOOGLE_SHEETS_CREDENTIALS=path/to/service-account.json

# Optional (for email notifications)
RESEND_API_KEY=your_resend_key
EMAIL_FROM=alerts@example.com
EMAIL_TO=team@example.com

# Optional (for party detection and discovery)
FIRECRAWL_API_KEY=your_firecrawl_key

# Candidate Discovery Configuration
DISCOVERY_ENABLED=true              # Enable/disable discovery
DISCOVERY_FREQUENCY=weekly          # daily, weekly, or manual
DISCOVERY_SOURCES=ballotpedia,scdp,scgop  # Sources to use
FORCE_DISCOVERY=1                   # Force discovery this run (one-time)
NAME_SIMILARITY_THRESHOLD=0.85      # Fuzzy matching threshold
FIRECRAWL_RPM=30                    # Rate limit for Firecrawl API
```

## Google Sheets URL

https://docs.google.com/spreadsheets/d/17j_KFZFUw-ESBQlKlIccUMpGCFq_XdeL6WYph7zkxQo/edit

## File Structure

```
sc-ethics-monitor/
├── src/
│   ├── __init__.py               # Package exports
│   ├── config.py                 # Column definitions, constants
│   ├── sheets_sync.py            # Bidirectional Google Sheets sync
│   ├── sheet_formatting.py       # Formatting utilities
│   ├── monitor.py                # Daily monitoring workflow
│   ├── party_detector.py         # Party detection logic
│   ├── test_validation.py        # Validation tests
│   └── candidate_discovery/      # Multi-source discovery pipeline
│       ├── __init__.py
│       ├── aggregator.py         # Source aggregation and deduplication
│       ├── deduplicator.py       # Fuzzy name matching
│       ├── rate_limiter.py       # API rate limiting
│       ├── reporter.py           # Coverage reports
│       ├── sheets_integration.py # Sheets sync for discovered candidates
│       └── sources/              # Source adapters
│           ├── __init__.py
│           ├── base.py           # Base classes and data structures
│           ├── ballotpedia.py    # Ballotpedia scraper
│           ├── scdp.py           # SCDP scraper
│           └── scgop.py          # SCGOP scraper
├── scripts/
│   ├── initialize_sheet.py       # One-time sheet setup
│   └── verify_discovery.py       # Pipeline verification script
├── tests/
│   ├── test_aggregator.py        # Aggregator tests
│   ├── test_ballotpedia_source.py
│   ├── test_deduplicator.py
│   ├── test_discovery_pipeline.py # End-to-end pipeline tests
│   ├── test_party_sources.py
│   └── test_sheets_integration.py
├── requirements.txt              # Python dependencies
└── README.md                     # This file
```

## Verification Checklist

After implementation, verify:

- [ ] Manual overrides preserved after sync
- [ ] Party_locked candidates skip re-detection
- [ ] Race Analysis uses final_party (not detected_party)
- [ ] Formatting applied (colors, dropdowns, frozen headers)
- [ ] Research Queue populated for LOW/UNKNOWN candidates
- [ ] Email notifications include party badges
