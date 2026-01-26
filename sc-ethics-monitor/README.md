# SC Ethics Monitor - Google Sheets Source of Truth

A simplified sync system for tracking South Carolina legislative candidates from SC Ethics Commission filings to a Google Sheets dashboard.

## Overview

This system provides a **single source of truth** for SC election data:

- **170 Districts**: All SC House (124) and Senate (46) districts tracked
- **Bidirectional Sync**: Reads AND writes, respecting manual edits
- **Party Detection**: Auto-detect with direct editing support
- **Race Analysis**: Simple Y/N flags for district status

## Key Principle

**Simple is better.** Single `party` column that system writes and users can edit directly. No complex formulas or lock mechanisms.

## Quick Start

```bash
# Install dependencies
cd sc-ethics-monitor
pip install -r requirements.txt

# Set up credentials (Google Service Account JSON)
export GOOGLE_SHEETS_CREDENTIALS=path/to/credentials.json

# Initialize the sheet (3-tab structure)
python scripts/initialize_sheet.py

# Run daily monitor (dry run first)
python -m src.monitor --dry-run

# Run for real
python -m src.monitor --skip-scrape --scrape-data ../scripts/data/ethics-state.json
```

## Sheet Structure

### Tabs (Simplified)

| Tab | Purpose | Columns |
|-----|---------|---------|
| Districts | All 170 SC legislative districts | 6 |
| Candidates | Filed candidates with party | 9 |
| Race Analysis | District status (Y/N flags) | 6 |

### Candidates Tab

| Column | Field | Description |
|--------|-------|-------------|
| A | district_id | e.g., "SC-House-042" |
| B | candidate_name | Full name |
| C | party | D/R/I/O (auto-detected, editable) |
| D | filed_date | Date filed with Ethics |
| E | report_id | Ethics filing ID |
| F | ethics_url | Clickable HYPERLINK |
| G | is_incumbent | Yes/No |
| H | notes | Free-form notes |
| I | last_synced | Timestamp |

**Key:** The `party` column is the only party column. System writes auto-detected value, you edit directly if wrong.

### Race Analysis Tab

| Column | Field | Description |
|--------|-------|-------------|
| A | district_id | e.g., "SC-House-042" |
| B | incumbent_name | Current officeholder |
| C | incumbent_party | D/R |
| D | challenger_count | Number filed (excluding incumbent) |
| E | dem_filed | Y/N |
| F | needs_dem_candidate | Y/N |

Simple Y/N flags instead of complex priority scoring.

### Districts Tab

| Column | Field | Description |
|--------|-------|-------------|
| A | district_id | e.g., "SC-House-042" |
| B | district_name | Human-readable name |
| C | chamber | House/Senate |
| D | district_number | Number |
| E | incumbent_name | Current officeholder |
| F | incumbent_party | D/R |

## Data Flow

```
Ethics Website (Daily)
        │
        ▼
  Party Detection
        │
        ▼
┌─────────────────────────────────────────┐
│    GOOGLE SHEETS (Source of Truth)      │
│                                         │
│  Candidates tab: party column           │
│  (auto-detected, user can edit)         │
└─────────────────────────────────────────┘
        │
        ▼
  Export to Web App
  (candidates.json)
```

## User Workflow

1. **Daily**: GitHub Action syncs new filings automatically
2. **Check**: Open Google Sheet, view Candidates or Race Analysis tab
3. **Fix errors**: Edit `party` column directly if auto-detection was wrong
4. **Web app**: Updates automatically via export

No research queue. No locking. No confidence scores.

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

### Export to Web App

```bash
# Export Google Sheets data to candidates.json
python scripts/export_to_webapp.py

# Dry run (preview without writing)
python scripts/export_to_webapp.py --dry-run

# Custom output path
python scripts/export_to_webapp.py --output path/to/candidates.json
```

Or integrated with monitor:
```bash
python -m src.monitor --skip-scrape --export-webapp
```

### Initialize/Migrate Sheet

```bash
# Dry run - see what would happen
python scripts/initialize_sheet.py --dry-run

# Initialize new 3-tab structure
python scripts/initialize_sheet.py

# Migrate from old 5-tab structure
python scripts/initialize_sheet.py --migrate

# Delete deprecated tabs (Research Queue, Sync Log)
python scripts/initialize_sheet.py --delete-legacy
```

### Backup Current Data

```bash
# Backup before migration
python scripts/backup_sheet.py

# Dry run
python scripts/backup_sheet.py --dry-run
```

### Python API

```python
from src.sheets_sync import SheetsSync

# Connect
sync = SheetsSync("credentials.json")
sync.connect()

# Read candidates (keyed by report_id)
candidates = sync.read_candidates()

# Add/update candidate
sync.add_candidate(
    district_id="SC-House-042",
    candidate_name="John Smith",
    party="D",  # Optional - preserves existing if not provided
    filed_date="2026-01-15",
    report_id="12345",
    ethics_url="https://...",
    is_incumbent=False,
)

# Update race analysis
sync.update_race_analysis()
```

## Automation

### Daily Sync (GitHub Action)

The SC Ethics Monitor runs automatically every day at 9am ET via GitHub Actions.

**Workflow:** `.github/workflows/ethics-monitor.yml`

**What it does:**
1. Connects to Google Sheets Source of Truth
2. Syncs latest candidate data from Ethics Commission
3. Exports to `public/data/candidates.json`
4. Commits changes if data updated

**Manual Trigger:**
Go to Actions > "SC Ethics Monitor Daily" > "Run workflow"

**Required Secrets:**
- `GOOGLE_SHEETS_CREDENTIALS_JSON`: Service account JSON
- `FIRECRAWL_API_KEY`: (Optional) For party detection
- `RESEND_API_KEY`: (Optional) For email notifications
- `EMAIL_TO`: (Optional) Email recipients

## Environment Variables

```bash
# Required
GOOGLE_SHEETS_CREDENTIALS=path/to/service-account.json

# Optional (for email notifications)
RESEND_API_KEY=your_resend_key
EMAIL_FROM=alerts@example.com
EMAIL_TO=team@example.com

# Optional (for party detection)
FIRECRAWL_API_KEY=your_firecrawl_key
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
│   ├── monitor.py                # Daily monitoring workflow (6 steps)
│   └── party_detector.py         # Party detection logic
├── scripts/
│   ├── initialize_sheet.py       # Sheet setup and migration
│   ├── backup_sheet.py           # Backup before migration
│   └── export_to_webapp.py       # Export to candidates.json
├── tests/
│   └── ...                       # Unit tests
├── requirements.txt              # Python dependencies
└── README.md                     # This file
```

## Simplified from Previous Version

The previous structure had:
- 5 tabs (now 3)
- 16 Candidates columns (now 9)
- Complex party workflow: `party_locked`, `manual_party_override`, `final_party` formula
- Research Queue and Sync Log tabs

Now it's just:
- 3 tabs
- Single `party` column (edit directly)
- Simple Y/N flags for race analysis
