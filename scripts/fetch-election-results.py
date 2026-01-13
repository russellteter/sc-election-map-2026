#!/usr/bin/env python3
"""
Fetch and process historical election results from SC Election Commission.
Downloads CSV from electionhistory.scvotes.gov and generates elections.json.
"""

import csv
import json
import urllib.request
import urllib.parse
from datetime import datetime
from pathlib import Path
from collections import defaultdict

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
DATA_DIR = PROJECT_ROOT / "src" / "data"
OUTPUT_FILE = DATA_DIR / "elections.json"

# SC Election History Database API
BASE_URL = "https://sc.elstats.civera.com/api/download_search.csv"

# Office IDs from the database (found via electionhistory.scvotes.gov UI)
OFFICE_ID_HOUSE = 599  # State House (1,482 contests)
OFFICE_ID_SENATE = 5   # State Senate (307 contests)


def build_search_url(office_id: int, from_year: int = 2020, to_year: int = 2025) -> str:
    """Build the CSV download URL for a given office."""
    search_params = {
        "global": {
            "years": {
                "from": from_year,
                "to": to_year
            }
        },
        "contests": {
            "candidates": [],
            "divisions": [],
            "offices": [{"id": office_id}]
        },
        "specialElectionsOnly": False,
        "voterStats": False,
        "stages": []
    }

    encoded = urllib.parse.quote(json.dumps(search_params, separators=(',', ':')))
    return f"{BASE_URL}?search={encoded}"


def download_csv(url: str) -> list[dict]:
    """Download and parse CSV from URL."""
    print(f"Downloading from: {url[:100]}...")

    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (compatible; SC-Election-Map/1.0)'
    })

    with urllib.request.urlopen(req, timeout=120) as response:
        content = response.read().decode('utf-8')

    lines = content.strip().split('\n')
    reader = csv.DictReader(lines)
    return list(reader)


def process_results(rows: list[dict], chamber: str) -> dict:
    """
    Process CSV rows into election results by district.

    Args:
        rows: CSV data rows
        chamber: 'house' or 'senate'

    Returns:
        Dict mapping district number to election results
    """
    # Structure: {district_num: {year: {candidate_name: {party, votes, is_winner}}}}
    district_data = defaultdict(lambda: defaultdict(lambda: defaultdict(dict)))

    for row in rows:
        # Filter to General elections only
        if row.get('election_type') != 'General':
            continue

        # Filter to County-level data (aggregate, not precinct)
        if row.get('division_type') != 'County':
            continue

        # Skip metadata rows
        candidate_name = row.get('candidate_name', '')
        if candidate_name in ('Write-In', 'Total Votes Cast', 'Total Ballots Cast', 'Overvotes/Undervotes'):
            continue

        # Extract year from election_date
        election_date = row.get('election_date', '')
        if not election_date:
            continue
        year = election_date[:4]

        # Extract district number
        district_name = row.get('district_name', '')
        if not district_name.isdigit():
            continue
        district_num = int(district_name)

        # Get party and votes
        party = row.get('candidate_party_name', '')
        votes = int(row.get('votes', 0) or 0)
        is_winner = row.get('is_winner', '').lower() == 'true'

        # Accumulate votes for this candidate
        key = (candidate_name, party)
        if key not in district_data[district_num][year]:
            district_data[district_num][year][key] = {
                'name': candidate_name,
                'party': party,
                'votes': 0,
                'is_winner': is_winner
            }

        district_data[district_num][year][key]['votes'] += votes
        # Update is_winner (True if any row says True)
        if is_winner:
            district_data[district_num][year][key]['is_winner'] = True

    # Convert to final structure with sorted candidates
    results = {}

    for district_num, years in district_data.items():
        district_results = {
            'districtNumber': district_num,
            'elections': {}
        }

        for year, candidates in years.items():
            # Sort candidates by votes (descending)
            sorted_candidates = sorted(
                candidates.values(),
                key=lambda x: x['votes'],
                reverse=True
            )

            if not sorted_candidates:
                continue

            # Calculate total votes and percentages
            total_votes = sum(c['votes'] for c in sorted_candidates)

            winner = sorted_candidates[0]
            runner_up = sorted_candidates[1] if len(sorted_candidates) > 1 else None

            winner_pct = round(winner['votes'] / total_votes * 100, 1) if total_votes > 0 else 0

            election_result = {
                'year': int(year),
                'totalVotes': total_votes,
                'winner': {
                    'name': winner['name'],
                    'party': winner['party'],
                    'votes': winner['votes'],
                    'percentage': winner_pct
                }
            }

            if runner_up and runner_up['votes'] > 0:
                runner_up_pct = round(runner_up['votes'] / total_votes * 100, 1) if total_votes > 0 else 0
                election_result['runnerUp'] = {
                    'name': runner_up['name'],
                    'party': runner_up['party'],
                    'votes': runner_up['votes'],
                    'percentage': runner_up_pct
                }
                election_result['margin'] = round(winner_pct - runner_up_pct, 1)
                election_result['marginVotes'] = winner['votes'] - runner_up['votes']
            else:
                # Uncontested race
                election_result['margin'] = 100.0
                election_result['marginVotes'] = winner['votes']
                election_result['uncontested'] = True

            district_results['elections'][year] = election_result

        # Calculate competitiveness score
        district_results['competitiveness'] = calculate_competitiveness(district_results['elections'])

        results[str(district_num)] = district_results

    return results


def calculate_competitiveness(elections: dict) -> dict:
    """
    Calculate competitiveness metrics for a district.

    Considers:
    - Average margin over recent elections
    - Whether district has flipped parties
    - Presence of contested races
    """
    margins = []
    parties_won = set()
    contested_count = 0

    # Look at recent elections (2024, 2022, 2020)
    for year in ['2024', '2022', '2020']:
        if year not in elections:
            continue

        election = elections[year]

        if not election.get('uncontested', False):
            contested_count += 1
            margins.append(election.get('margin', 100))

        winner_party = election.get('winner', {}).get('party', '')
        if winner_party:
            parties_won.add(winner_party)

    # Calculate average margin (only contested races)
    avg_margin = sum(margins) / len(margins) if margins else 100.0

    # Has the district swung between parties?
    has_swung = len(parties_won) > 1

    # Calculate competitiveness score (100 = most competitive)
    # Lower margins = more competitive
    if avg_margin <= 5:
        base_score = 95
    elif avg_margin <= 10:
        base_score = 80
    elif avg_margin <= 15:
        base_score = 60
    elif avg_margin <= 20:
        base_score = 40
    elif avg_margin <= 30:
        base_score = 20
    else:
        base_score = 10

    # Bonus for swing districts
    if has_swung:
        base_score = min(100, base_score + 10)

    # Reduce score if mostly uncontested
    if contested_count == 0:
        base_score = 5
    elif contested_count == 1:
        base_score = max(5, base_score - 20)

    return {
        'score': base_score,
        'avgMargin': round(avg_margin, 1),
        'hasSwung': has_swung,
        'contestedRaces': contested_count,
        'dominantParty': list(parties_won)[0] if len(parties_won) == 1 else None
    }


def main():
    print("SC Election History Data Processor")
    print("=" * 50)

    # Download House data
    print("\nFetching State House election results...")
    house_url = build_search_url(OFFICE_ID_HOUSE)
    house_rows = download_csv(house_url)
    print(f"  Downloaded {len(house_rows)} rows")

    # Download Senate data
    print("\nFetching State Senate election results...")
    senate_url = build_search_url(OFFICE_ID_SENATE)
    senate_rows = download_csv(senate_url)
    print(f"  Downloaded {len(senate_rows)} rows")

    # Process results
    print("\nProcessing House results...")
    house_results = process_results(house_rows, 'house')
    print(f"  Processed {len(house_results)} districts")

    print("\nProcessing Senate results...")
    senate_results = process_results(senate_rows, 'senate')
    print(f"  Processed {len(senate_results)} districts")

    # Generate output
    output = {
        'lastUpdated': datetime.utcnow().isoformat() + 'Z',
        'house': house_results,
        'senate': senate_results
    }

    # Statistics
    competitive_house = sum(1 for d in house_results.values() if d['competitiveness']['score'] >= 60)
    competitive_senate = sum(1 for d in senate_results.values() if d['competitiveness']['score'] >= 60)

    print("\n" + "=" * 50)
    print("Summary:")
    print(f"  House districts: {len(house_results)}")
    print(f"  Senate districts: {len(senate_results)}")
    print(f"  Competitive House districts (score >= 60): {competitive_house}")
    print(f"  Competitive Senate districts (score >= 60): {competitive_senate}")

    # Write output
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(output, f, indent=2)

    print(f"\nOutput written to: {OUTPUT_FILE}")


if __name__ == '__main__':
    main()
