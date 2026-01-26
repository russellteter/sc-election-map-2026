"""
Configuration for SC Ethics Monitor Google Sheets integration.

Defines column mappings, Google Sheets settings, and constants.
"""

import os
from pathlib import Path

# Project paths
PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "data"
CACHE_DIR = PROJECT_ROOT / "cache"

# Google Sheets configuration
SPREADSHEET_ID = "17j_KFZFUw-ESBQlKlIccUMpGCFq_XdeL6WYph7zkxQo"

# Tab names - Simplified 3-tab structure
TAB_DISTRICTS = "Districts"
TAB_CANDIDATES = "Candidates"
TAB_RACE_ANALYSIS = "Race Analysis"

# Legacy tab names (kept for backup/migration scripts)
TAB_RESEARCH_QUEUE = "Research Queue"  # DEPRECATED - removed in simplified version
TAB_SYNC_LOG = "Sync Log"  # DEPRECATED - removed in simplified version

# =============================================================================
# SOURCE OF TRUTH TAB - District-Centric View (170 rows)
# =============================================================================
# The "Desired Source of Truth" tab has static district info (A-L) and dynamic
# candidate tracking columns (M onwards). User created this tab manually with
# district info; automation populates candidate columns.
TAB_SOURCE_OF_TRUTH = "Source of Truth"

# Source of Truth dynamic column indices (0-indexed)
# Static columns A-L (0-11) are pre-populated and never touched by automation
# Dynamic columns M onwards (12+) are populated from Candidates tab
#
# NEW SHEET STRUCTURE (32 columns A-AF):
#   A-L (0-11): Static district info - NEVER touched
#   M (12): spacer
#   N (13): Dem Filed - Y/N dropdown, auto-calculated
#   O (14): spacer
#   --- Challenger 1 ---
#   P (15): Challenger 1 name
#   Q (16): Party - dropdown (D/R/I/O/?)
#   R (17): Filed Date
#   S (18): Ethics URL
#   T (19): spacer
#   --- Challenger 2 ---
#   U (20): Challenger 2 name
#   V (21): Party - dropdown (D/R/I/O/?)
#   W (22): Filed Date
#   X (23): Ethics URL
#   Y (24): spacer
#   --- Challenger 3 ---
#   Z (25): Challenger 3 name
#   AA (26): Party - dropdown (D/R/I/O/?)
#   AB (27): Filed Date
#   AC (28): Ethics URL
#   AD (29): spacer
#   --- Staff Columns ---
#   AE (30): Bench/Potential - PROTECTED (staff-entered)
#   AF (31): Last Updated - Auto timestamp
#
SOURCE_OF_TRUTH_COLUMNS = {
    # M (12) is a visual spacer - skipped
    "dem_filed": 13,           # N - Y/N auto-calc (Y if any D candidate)
    # O (14) is a visual spacer - skipped
    # Challenger 1
    "cand1_name": 15,          # P
    "cand1_party": 16,         # Q
    "cand1_date": 17,          # R
    "cand1_url": 18,           # S
    # T (19) is a visual spacer - skipped
    # Challenger 2
    "cand2_name": 20,          # U
    "cand2_party": 21,         # V
    "cand2_date": 22,          # W
    "cand2_url": 23,           # X
    # Y (24) is a visual spacer - skipped
    # Challenger 3
    "cand3_name": 25,          # Z
    "cand3_party": 26,         # AA
    "cand3_date": 27,          # AB
    "cand3_url": 28,           # AC
    # AD (29) is a visual spacer - skipped
    # Staff columns
    "bench_potential": 30,     # AE - PROTECTED (staff-entered)
    "last_updated": 31,        # AF - Auto timestamp
}

# Columns with data validation (dropdowns)
DROPDOWN_COLUMNS = {
    "dem_filed": ["Y", "N"],
    "cand1_party": ["D", "R", "I", "O", "?"],
    "cand2_party": ["D", "R", "I", "O", "?"],
    "cand3_party": ["D", "R", "I", "O", "?"],
}

# Columns that automation should NEVER write to
PROTECTED_COLUMNS = ["bench_potential"]

# Headers for dynamic columns (M through AF, starting at index 12)
SOURCE_OF_TRUTH_HEADERS_DYNAMIC = [
    "",                    # M (12) - spacer
    "Dem Filed",           # N (13)
    "",                    # O (14) - spacer
    "Challenger 1",        # P (15)
    "Party",               # Q (16)
    "Filed Date",          # R (17)
    "Ethics URL",          # S (18)
    "",                    # T (19) - spacer
    "Challenger 2",        # U (20)
    "Party",               # V (21)
    "Filed Date",          # W (22)
    "Ethics URL",          # X (23)
    "",                    # Y (24) - spacer
    "Challenger 3",        # Z (25)
    "Party",               # AA (26)
    "Filed Date",          # AB (27)
    "Ethics URL",          # AC (28)
    "",                    # AD (29) - spacer
    "Bench/Potential",     # AE (30)
    "Last Updated",        # AF (31)
]

# Column letter mapping for easy reference
SOURCE_OF_TRUTH_COL_LETTERS = {
    "dem_filed": "N",
    "cand1_name": "P",
    "cand1_party": "Q",
    "cand1_date": "R",
    "cand1_url": "S",
    "cand2_name": "U",
    "cand2_party": "V",
    "cand2_date": "W",
    "cand2_url": "X",
    "cand3_name": "Z",
    "cand3_party": "AA",
    "cand3_date": "AB",
    "cand3_url": "AC",
    "bench_potential": "AE",
    "last_updated": "AF",
}

# Number of days for "NEW" candidate highlighting
NEW_CANDIDATE_DAYS = 7

# =============================================================================
# SIMPLIFIED CANDIDATES TAB - 9 columns (A-I)
# =============================================================================
# Key simplification: Single 'party' column that system writes and users can edit.
# No more party_locked, manual_party_override, final_party formula complexity.
CANDIDATES_COLUMNS = {
    "district_id": 0,               # A - e.g., "SC-House-042"
    "candidate_name": 1,            # B - Full name
    "party": 2,                     # C - Party (D/R/I/O) - editable by user
    "filed_date": 3,                # D - Date filed with Ethics
    "report_id": 4,                 # E - Unique identifier from Ethics
    "ethics_url": 5,                # F - HYPERLINK formula to Ethics filing
    "is_incumbent": 6,              # G - Yes/No
    "notes": 7,                     # H - Optional user notes
    "last_synced": 8,               # I - Last sync timestamp
}

# Candidates tab header row
CANDIDATES_HEADERS = [
    "district_id",
    "candidate_name",
    "party",
    "filed_date",
    "report_id",
    "ethics_url",
    "is_incumbent",
    "notes",
    "last_synced",
]

# Legacy column mapping (for migration scripts)
CANDIDATES_COLUMNS_LEGACY = {
    "report_id": 0,
    "candidate_name": 1,
    "district_id": 2,
    "filed_date": 3,
    "ethics_report_url": 4,
    "is_incumbent": 5,
    "detected_party": 6,
    "detection_confidence": 7,
    "detection_source": 8,
    "detection_evidence_url": 9,
    "manual_party_override": 10,
    "final_party": 11,
    "party_locked": 12,
    "detection_timestamp": 13,
    "notes": 14,
    "last_synced": 15,
}

CANDIDATES_HEADERS_LEGACY = [
    "report_id",
    "candidate_name",
    "district_id",
    "filed_date",
    "ethics_report_url",
    "is_incumbent",
    "detected_party",
    "detection_confidence",
    "detection_source",
    "detection_evidence_url",
    "manual_party_override",
    "final_party",
    "party_locked",
    "detection_timestamp",
    "notes",
    "last_synced",
]

# =============================================================================
# DISTRICTS TAB - 6 columns (simplified from 8)
# =============================================================================
DISTRICTS_COLUMNS = {
    "district_id": 0,               # A - e.g., "SC-House-042"
    "district_name": 1,             # B - Human readable name
    "chamber": 2,                   # C - House/Senate
    "district_number": 3,           # D - Number
    "incumbent_name": 4,            # E - Current officeholder
    "incumbent_party": 5,           # F - D/R
}

DISTRICTS_HEADERS = [
    "district_id",
    "district_name",
    "chamber",
    "district_number",
    "incumbent_name",
    "incumbent_party",
]

# Legacy Districts columns (for migration)
DISTRICTS_COLUMNS_LEGACY = {
    "district_id": 0,
    "district_name": 1,
    "chamber": 2,
    "district_number": 3,
    "incumbent_name": 4,
    "incumbent_party": 5,
    "incumbent_since": 6,
    "next_election": 7,
}

DISTRICTS_HEADERS_LEGACY = [
    "district_id",
    "district_name",
    "chamber",
    "district_number",
    "incumbent_name",
    "incumbent_party",
    "incumbent_since",
    "next_election",
]

# =============================================================================
# RACE ANALYSIS TAB - 6 columns (simplified from 11)
# =============================================================================
# Simple boolean flags instead of complex priority scoring
RACE_ANALYSIS_COLUMNS = {
    "district_id": 0,               # A - e.g., "SC-House-042"
    "incumbent_name": 1,            # B - Current officeholder
    "incumbent_party": 2,           # C - D/R
    "challenger_count": 3,          # D - Total filed candidates (excluding incumbent)
    "dem_filed": 4,                 # E - Y/N - Has a Democrat filed?
    "needs_dem_candidate": 5,       # F - Y/N - Unopposed R, needs D candidate
}

RACE_ANALYSIS_HEADERS = [
    "district_id",
    "incumbent_name",
    "incumbent_party",
    "challenger_count",
    "dem_filed",
    "needs_dem_candidate",
]

# Legacy Race Analysis columns (for migration/reference)
RACE_ANALYSIS_COLUMNS_LEGACY = {
    "district_id": 0,
    "district_name": 1,
    "incumbent_name": 2,
    "incumbent_party": 3,
    "dem_candidates": 4,
    "rep_candidates": 5,
    "other_candidates": 6,
    "race_status": 7,
    "recruitment_priority": 8,
    "needs_research": 9,
    "last_computed": 10,
}

RACE_ANALYSIS_HEADERS_LEGACY = [
    "district_id",
    "district_name",
    "incumbent_name",
    "incumbent_party",
    "dem_candidates",
    "rep_candidates",
    "other_candidates",
    "race_status",
    "recruitment_priority",
    "needs_research",
    "last_computed",
]

# =============================================================================
# DEPRECATED TABS - Kept for migration/backup scripts only
# =============================================================================
# Research Queue tab columns (DEPRECATED)
RESEARCH_QUEUE_COLUMNS = {
    "report_id": 0,
    "candidate_name": 1,
    "district_id": 2,
    "detected_party": 3,
    "confidence": 4,
    "suggested_search": 5,
    "scdp_link": 6,
    "scgop_link": 7,
    "status": 8,
    "assigned_to": 9,
    "resolution_notes": 10,
    "resolved_date": 11,
    "added_date": 12,
}

RESEARCH_QUEUE_HEADERS = [
    "report_id",
    "candidate_name",
    "district_id",
    "detected_party",
    "confidence",
    "suggested_search",
    "scdp_link",
    "scgop_link",
    "status",
    "assigned_to",
    "resolution_notes",
    "resolved_date",
    "added_date",
]

# Sync Log tab columns (DEPRECATED)
SYNC_LOG_COLUMNS = {
    "timestamp": 0,
    "event_type": 1,
    "details": 2,
    "candidates_added": 3,
    "candidates_updated": 4,
    "party_detections": 5,
    "errors": 6,
}

SYNC_LOG_HEADERS = [
    "timestamp",
    "event_type",
    "details",
    "candidates_added",
    "candidates_updated",
    "party_detections",
    "errors",
]

# Party codes
PARTY_CODES = {
    "D": "Democrat",
    "R": "Republican",
    "I": "Independent",
    "O": "Other",
}

# Detection confidence levels (legacy - kept for migration)
CONFIDENCE_LEVELS = ["HIGH", "MEDIUM", "LOW", "UNKNOWN"]

# Research Queue statuses (DEPRECATED)
RESEARCH_STATUSES = ["Pending", "In-Progress", "Resolved"]

# SC Legislative Districts
SC_HOUSE_DISTRICTS = 124
SC_SENATE_DISTRICTS = 46

# Environment variables
def get_env(key: str, default: str = None) -> str:
    """Get environment variable with optional default."""
    return os.environ.get(key, default)

# API Keys (from environment)
FIRECRAWL_API_KEY = get_env("FIRECRAWL_API_KEY")
RESEND_API_KEY = get_env("RESEND_API_KEY")
GOOGLE_SHEETS_CREDENTIALS = get_env("GOOGLE_SHEETS_CREDENTIALS", "credentials.json")

# Email configuration
EMAIL_FROM = get_env("EMAIL_FROM", "alerts@sc-ethics-monitor.com")
EMAIL_TO = get_env("EMAIL_TO", "")  # Comma-separated list

# Logging
LOG_LEVEL = get_env("LOG_LEVEL", "INFO")

# Candidate Discovery configuration
DISCOVERY_ENABLED = get_env("DISCOVERY_ENABLED", "true").lower() == "true"
DISCOVERY_FREQUENCY = get_env("DISCOVERY_FREQUENCY", "weekly")  # daily, weekly, manual
DISCOVERY_SOURCES = get_env("DISCOVERY_SOURCES", "ballotpedia,scdp,scgop").split(",")
NAME_SIMILARITY_THRESHOLD = float(get_env("NAME_SIMILARITY_THRESHOLD", "0.85"))
FIRECRAWL_RPM = int(get_env("FIRECRAWL_RPM", "30"))  # Requests per minute
