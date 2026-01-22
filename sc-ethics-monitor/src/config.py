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

# Tab names
TAB_DISTRICTS = "Districts"
TAB_CANDIDATES = "Candidates"
TAB_RACE_ANALYSIS = "Race Analysis"
TAB_RESEARCH_QUEUE = "Research Queue"
TAB_SYNC_LOG = "Sync Log"

# Candidates tab column mapping (0-indexed)
# New structure with bidirectional sync support
CANDIDATES_COLUMNS = {
    # Auto-populated columns (written by system)
    "report_id": 0,                 # A - Unique identifier from Ethics
    "candidate_name": 1,            # B - Full name
    "district_id": 2,               # C - e.g., "SC-House-042"
    "filed_date": 3,                # D - Date filed with Ethics
    "ethics_report_url": 4,         # E - Link to Ethics filing
    "is_incumbent": 5,              # F - Yes/No
    "detected_party": 6,            # G - Auto-detected party (D/R/I/O)
    "detection_confidence": 7,       # H - HIGH/MEDIUM/LOW/UNKNOWN
    "detection_source": 8,          # I - Source of detection
    "detection_evidence_url": 9,    # J - URL supporting detection

    # Manual columns (preserved during sync)
    "manual_party_override": 10,    # K - User-entered party override
    "final_party": 11,              # L - Formula: IF(K<>"",K,G)
    "party_locked": 12,             # M - Yes = skip re-detection

    # Timestamps and notes
    "detection_timestamp": 13,      # N - When party was last detected
    "notes": 14,                    # O - User notes
    "last_synced": 15,              # P - Last sync timestamp
}

# Candidates tab header row
CANDIDATES_HEADERS = [
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

# Districts tab columns
DISTRICTS_COLUMNS = {
    "district_id": 0,               # A - e.g., "SC-House-042"
    "district_name": 1,             # B - Human readable name
    "chamber": 2,                   # C - House/Senate
    "district_number": 3,           # D - Number
    "incumbent_name": 4,            # E - Current officeholder
    "incumbent_party": 5,           # F - D/R
    "incumbent_since": 6,           # G - Year elected
    "next_election": 7,             # H - 2026
}

DISTRICTS_HEADERS = [
    "district_id",
    "district_name",
    "chamber",
    "district_number",
    "incumbent_name",
    "incumbent_party",
    "incumbent_since",
    "next_election",
]

# Race Analysis tab columns
RACE_ANALYSIS_COLUMNS = {
    "district_id": 0,               # A
    "district_name": 1,             # B
    "incumbent_name": 2,            # C
    "incumbent_party": 3,           # D
    "dem_candidates": 4,            # E - Count of D candidates (from final_party)
    "rep_candidates": 5,            # F - Count of R candidates
    "other_candidates": 6,          # G - Count of I/O candidates
    "race_status": 7,               # H - Contested/Unopposed-R/Unopposed-D/Open
    "recruitment_priority": 8,      # I - High-D-Recruit/Open-Seat/Monitor/Low
    "needs_research": 9,            # J - Count of LOW/UNKNOWN confidence
    "last_computed": 10,            # K - Timestamp
}

RACE_ANALYSIS_HEADERS = [
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

# Research Queue tab columns
RESEARCH_QUEUE_COLUMNS = {
    "report_id": 0,                 # A
    "candidate_name": 1,            # B
    "district_id": 2,               # C
    "detected_party": 3,            # D
    "confidence": 4,                # E
    "suggested_search": 5,          # F - Pre-built Google search
    "scdp_link": 6,                 # G - Link to SCDP search
    "scgop_link": 7,                # H - Link to SCGOP search
    "status": 8,                    # I - Pending/In-Progress/Resolved
    "assigned_to": 9,               # J - Researcher name
    "resolution_notes": 10,         # K - Notes on resolution
    "resolved_date": 11,            # L - When resolved
    "added_date": 12,               # M - When added to queue
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

# Sync Log tab columns
SYNC_LOG_COLUMNS = {
    "timestamp": 0,                 # A
    "event_type": 1,                # B - SYNC/SCAN/PARTY_DETECT/ERROR
    "details": 2,                   # C
    "candidates_added": 3,          # D
    "candidates_updated": 4,        # E
    "party_detections": 5,          # F
    "errors": 6,                    # G
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

# Detection confidence levels
CONFIDENCE_LEVELS = ["HIGH", "MEDIUM", "LOW", "UNKNOWN"]

# Research Queue statuses
RESEARCH_STATUSES = ["Pending", "In-Progress", "Resolved"]

# Recruitment priority levels
RECRUITMENT_PRIORITIES = [
    "High-D-Recruit",   # Unopposed-R district with no D filed
    "Open-Seat",        # Incumbent not running
    "Monitor",          # Contested race
    "Low",              # Unopposed-D or already contested
]

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
