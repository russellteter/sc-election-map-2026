#!/bin/bash
# Data refresh pipeline for SC Election Map
# Orchestrates the full pipeline: scrape → process → copy
#
# Usage:
#   ./scripts/refresh-data.sh           # Quick refresh (5 pages)
#   ./scripts/refresh-data.sh --full    # Full scrape (15 pages)
#
# Prerequisites:
#   - Python 3.11+ with virtual environment at .venv/
#   - Playwright: pip install playwright && python -m playwright install chromium

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
VENV_DIR="$PROJECT_ROOT/.venv"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== SC Election Map Data Refresh ===${NC}"
echo "Started: $(date)"
echo ""

# Check for --full flag
MAX_PAGES=5
if [[ "$1" == "--full" ]]; then
    MAX_PAGES=15
    echo "Mode: Full scrape (${MAX_PAGES} pages per year)"
else
    echo "Mode: Quick refresh (${MAX_PAGES} pages)"
fi
echo ""

# Activate virtual environment
if [[ -d "$VENV_DIR" ]]; then
    source "$VENV_DIR/bin/activate"
else
    echo -e "${RED}Error: Virtual environment not found at $VENV_DIR${NC}"
    echo "Create one with: python3 -m venv .venv && source .venv/bin/activate && pip install playwright"
    exit 1
fi

# Check playwright is installed
if ! python -c "import playwright" 2>/dev/null; then
    echo -e "${RED}Error: Playwright not installed${NC}"
    echo "Install with: pip install playwright && python -m playwright install chromium"
    exit 1
fi

# Step 1: Scrape SC Ethics Commission
echo -e "${GREEN}[1/4] Scraping SC Ethics Commission...${NC}"
python "$SCRIPT_DIR/scrape-ethics.py" \
    --output "$SCRIPT_DIR/data/ethics-state.json" \
    --max-pages "$MAX_PAGES"

# Verify scrape output
if [[ ! -f "$SCRIPT_DIR/data/ethics-state.json" ]]; then
    echo -e "${RED}Error: Scrape failed - no output file${NC}"
    exit 1
fi

REPORT_COUNT=$(python -c "import json; d=json.load(open('$SCRIPT_DIR/data/ethics-state.json')); print(len(d.get('reports_with_metadata', {})))")
echo "  Scraped reports: $REPORT_COUNT"

# Step 2: Process ethics data with party enrichment
echo ""
echo -e "${GREEN}[2/4] Processing candidate data...${NC}"
python "$SCRIPT_DIR/process-data.py" "$SCRIPT_DIR/data/ethics-state.json"

# Step 3: Copy to public/data for deployment
echo ""
echo -e "${GREEN}[3/4] Copying to public/data/...${NC}"
cp "$PROJECT_ROOT/src/data/candidates.json" "$PROJECT_ROOT/public/data/candidates.json"

# Step 4: Verify
echo ""
echo -e "${GREEN}[4/4] Verification...${NC}"

# Count candidates in output
CANDIDATE_COUNT=$(python -c "
import json
d = json.load(open('$PROJECT_ROOT/public/data/candidates.json'))
total = 0
for chamber in ['house', 'senate']:
    for district in d.get(chamber, {}).values():
        total += len(district.get('candidates', []))
print(total)
")

# Count by party
PARTY_COUNTS=$(python -c "
import json
d = json.load(open('$PROJECT_ROOT/public/data/candidates.json'))
dem = rep = unknown = 0
for chamber in ['house', 'senate']:
    for district in d.get(chamber, {}).values():
        for c in district.get('candidates', []):
            p = c.get('party', '')
            if p == 'Democratic': dem += 1
            elif p == 'Republican': rep += 1
            else: unknown += 1
print(f'{dem} Democrats, {rep} Republicans, {unknown} unknown')
")

echo "  Total candidates: $CANDIDATE_COUNT"
echo "  Party breakdown: $PARTY_COUNTS"

echo ""
echo -e "${BLUE}=== Data Refresh Complete ===${NC}"
echo "Output: public/data/candidates.json"
echo "Finished: $(date)"
