"""
Google Sheets Sync - Simplified sync for SC Ethics Monitor.

This module handles reading from AND writing to Google Sheets
with a simplified 3-tab structure.

Key Principle: Single 'party' column - system writes, user can edit.
"""

import json
import re
from collections import defaultdict
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional

try:
    import gspread
    from google.oauth2.service_account import Credentials
    from tenacity import (
        retry,
        stop_after_attempt,
        wait_exponential,
        retry_if_exception_type,
    )
except ImportError:
    print("Required packages not installed. Run: pip install gspread google-auth tenacity")
    raise


# Retry decorator for Google Sheets API calls
# Retries 3 times with exponential backoff (2s, 4s, 8s)
def sheets_retry():
    """Create a retry decorator for Google Sheets API operations."""
    return retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=2, min=2, max=10),
        retry=retry_if_exception_type((gspread.exceptions.APIError, ConnectionError)),
        reraise=True,
    )

from .config import (
    SPREADSHEET_ID,
    TAB_CANDIDATES,
    TAB_DISTRICTS,
    TAB_RACE_ANALYSIS,
    TAB_SOURCE_OF_TRUTH,
    CANDIDATES_COLUMNS,
    CANDIDATES_HEADERS,
    DISTRICTS_COLUMNS,
    DISTRICTS_HEADERS,
    RACE_ANALYSIS_COLUMNS,
    RACE_ANALYSIS_HEADERS,
    SOURCE_OF_TRUTH_COLUMNS,
    PROTECTED_COLUMNS,
    NEW_CANDIDATE_DAYS,
    GOOGLE_SHEETS_CREDENTIALS,
    SC_HOUSE_DISTRICTS,
    SC_SENATE_DISTRICTS,
)


class SheetsSync:
    """
    Simplified sync manager for Google Sheets.

    Handles:
    - Reading existing candidates (to check for existing party values)
    - Writing new/updated candidates
    - Updating race analysis
    - 3-tab structure only (Districts, Candidates, Race Analysis)
    """

    def __init__(self, credentials_path: str = None):
        """
        Initialize SheetsSync.

        Args:
            credentials_path: Path to Google service account credentials JSON.
                            Defaults to GOOGLE_SHEETS_CREDENTIALS from config.
        """
        self.credentials_path = credentials_path or GOOGLE_SHEETS_CREDENTIALS
        self.client = None
        self.spreadsheet = None
        self._sheet_cache = {}

    def connect(self) -> bool:
        """
        Connect to Google Sheets API.

        Returns:
            True if connection successful, False otherwise.
        """
        try:
            scopes = [
                "https://www.googleapis.com/auth/spreadsheets",
                "https://www.googleapis.com/auth/drive.file",
            ]

            creds = Credentials.from_service_account_file(
                self.credentials_path,
                scopes=scopes
            )

            self.client = gspread.authorize(creds)
            self.spreadsheet = self.client.open_by_key(SPREADSHEET_ID)

            return True

        except FileNotFoundError:
            print(f"Error: Credentials file not found: {self.credentials_path}")
            return False
        except Exception as e:
            print(f"Error connecting to Google Sheets: {e}")
            return False

    def _get_or_create_worksheet(self, tab_name: str, headers: list) -> gspread.Worksheet:
        """
        Get worksheet by name, creating it if it doesn't exist.

        Args:
            tab_name: Name of the worksheet tab.
            headers: Header row to add if creating new sheet.

        Returns:
            gspread.Worksheet object.
        """
        if tab_name in self._sheet_cache:
            return self._sheet_cache[tab_name]

        try:
            worksheet = self.spreadsheet.worksheet(tab_name)
        except gspread.WorksheetNotFound:
            worksheet = self.spreadsheet.add_worksheet(
                title=tab_name,
                rows=1000,
                cols=len(headers)
            )
            worksheet.append_row(headers)

        self._sheet_cache[tab_name] = worksheet
        return worksheet

    def _col_letter(self, col_index: int) -> str:
        """Convert 0-based column index to letter (0 -> A, 1 -> B, etc)."""
        return chr(ord('A') + col_index)

    # =========================================================================
    # Read Sheet State
    # =========================================================================

    @sheets_retry()
    def read_candidates(self) -> dict:
        """
        Read existing candidates from sheet, indexed by report_id.

        Expects simplified 9-column format:
        A: district_id, B: candidate_name, C: party, D: filed_date,
        E: report_id, F: ethics_url, G: is_incumbent, H: notes, I: last_synced

        Includes retry logic for transient API failures.

        Returns:
            Dict keyed by report_id with candidate data:
            {
                "district_id": str,
                "candidate_name": str,
                "party": str or None,
                "filed_date": str,
                "is_incumbent": bool,
                "notes": str or None,
                "row_number": int,
            }
        """
        worksheet = self._get_or_create_worksheet(TAB_CANDIDATES, CANDIDATES_HEADERS)

        all_values = worksheet.get_all_values()

        if len(all_values) <= 1:
            return {}  # Only header or empty

        # Use simplified column indices
        col_map = CANDIDATES_COLUMNS

        candidates = {}

        for row_idx, row in enumerate(all_values[1:], start=2):
            report_id_idx = col_map["report_id"]
            if len(row) <= report_id_idx or not row[report_id_idx]:
                continue  # Skip empty rows

            report_id = row[report_id_idx]

            def safe_get(col_name):
                idx = col_map.get(col_name, -1)
                if idx >= 0 and idx < len(row):
                    return row[idx] if row[idx] else None
                return None

            candidates[report_id] = {
                "district_id": safe_get("district_id"),
                "candidate_name": safe_get("candidate_name"),
                "party": safe_get("party"),
                "filed_date": safe_get("filed_date"),
                "ethics_url": safe_get("ethics_url"),
                "is_incumbent": safe_get("is_incumbent") in ("Yes", "TRUE", "true", True),
                "notes": safe_get("notes"),
                "last_synced": safe_get("last_synced"),
                "row_number": row_idx,
            }

        return candidates

    def get_existing_party(self, report_id: str, candidates: dict = None) -> Optional[str]:
        """
        Get existing party value for a candidate.

        If user has manually edited the party, this preserves their edit.

        Args:
            report_id: The candidate's report ID.
            candidates: Optional pre-loaded candidates dict.

        Returns:
            Existing party value or None.
        """
        if candidates is None:
            candidates = self.read_candidates()

        return candidates.get(report_id, {}).get("party")

    # =========================================================================
    # Add/Update Candidates
    # =========================================================================

    @sheets_retry()
    def add_candidate(
        self,
        district_id: str,
        candidate_name: str,
        party: str = None,
        filed_date: str = None,
        report_id: str = None,
        ethics_url: str = None,
        is_incumbent: bool = False,
        notes: str = None,
        existing_candidates: dict = None,
    ) -> dict:
        """
        Add or update a candidate in the sheet.

        If candidate exists and has a party value, preserve it unless
        a new party is explicitly provided. Includes retry logic for
        transient API failures.

        Uses simplified 9-column format:
        A: district_id, B: candidate_name, C: party, D: filed_date,
        E: report_id, F: ethics_url, G: is_incumbent, H: notes, I: last_synced

        Args:
            district_id: District identifier (e.g., "SC-House-042").
            candidate_name: Full candidate name.
            party: Party code (D/R/I/O) or None.
            filed_date: Date filed with Ethics.
            report_id: Unique report ID from Ethics Commission.
            ethics_url: URL to Ethics filing.
            is_incumbent: Whether candidate is the incumbent.
            notes: Optional notes.
            existing_candidates: Optional pre-loaded candidates dict.

        Returns:
            Dict with {"action": "added"|"updated", "details": str}
        """
        worksheet = self._get_or_create_worksheet(TAB_CANDIDATES, CANDIDATES_HEADERS)

        if existing_candidates is None:
            existing_candidates = self.read_candidates()

        now = datetime.now(timezone.utc).isoformat()

        existing = existing_candidates.get(report_id)

        # Build hyperlink formula for ethics_url
        ethics_url_value = ""
        if ethics_url:
            # Create clickable hyperlink
            ethics_url_value = f'=HYPERLINK("{ethics_url}", "View Filing")'

        if existing:
            # Candidate exists - update row
            row_num = existing["row_number"]

            # Preserve existing party if new party not provided
            final_party = party if party else existing.get("party", "")

            # Preserve existing notes if new notes not provided
            final_notes = notes if notes is not None else existing.get("notes", "")

            # Simplified format: district_id, candidate_name, party, filed_date, report_id, ethics_url, is_incumbent, notes, last_synced
            row_data = [
                district_id,
                candidate_name,
                final_party or "",
                filed_date or "",
                report_id or "",
                ethics_url_value,
                "Yes" if is_incumbent else "No",
                final_notes or "",
                now,
            ]
            worksheet.update(f"A{row_num}:I{row_num}", [row_data], value_input_option="USER_ENTERED")

            return {
                "action": "updated",
                "details": f"Updated {candidate_name}, party={final_party}"
            }

        else:
            # New candidate - add row (simplified format)
            row_data = [
                district_id,
                candidate_name,
                party or "",
                filed_date or "",
                report_id or "",
                ethics_url_value,
                "Yes" if is_incumbent else "No",
                notes or "",
                now,
            ]

            worksheet.append_row(row_data, value_input_option="USER_ENTERED")

            return {
                "action": "added",
                "details": f"Added new candidate {candidate_name}"
            }

    def sync_candidates(
        self,
        candidates: list[dict],
        existing_candidates: dict = None,
    ) -> dict:
        """
        Sync multiple candidates to the sheet.

        Args:
            candidates: List of candidate dicts with required fields.
            existing_candidates: Optional pre-loaded existing candidates.

        Returns:
            Summary dict with counts: added, updated, errors.
        """
        if existing_candidates is None:
            existing_candidates = self.read_candidates()

        results = {"added": 0, "updated": 0, "errors": 0}

        for candidate in candidates:
            try:
                result = self.add_candidate(
                    district_id=candidate.get("district_id", ""),
                    candidate_name=candidate.get("candidate_name", ""),
                    party=candidate.get("party") or candidate.get("detected_party"),
                    filed_date=candidate.get("filed_date", ""),
                    report_id=candidate.get("report_id", ""),
                    ethics_url=candidate.get("ethics_url") or candidate.get("ethics_report_url", ""),
                    is_incumbent=candidate.get("is_incumbent", False),
                    notes=candidate.get("notes"),
                    existing_candidates=existing_candidates,
                )

                if result["action"] == "added":
                    results["added"] += 1
                elif result["action"] == "updated":
                    results["updated"] += 1

            except Exception as e:
                print(f"Error syncing candidate {candidate.get('report_id')}: {e}")
                results["errors"] += 1

        return results

    # =========================================================================
    # Districts Tab
    # =========================================================================

    def initialize_districts(self, incumbents_data: dict = None) -> int:
        """
        Initialize the Districts tab with all 170 SC legislative districts.

        Args:
            incumbents_data: Optional dict with incumbent info by chamber/district.

        Returns:
            Number of districts initialized.
        """
        worksheet = self._get_or_create_worksheet(TAB_DISTRICTS, DISTRICTS_HEADERS)

        # Clear existing data (except header)
        worksheet.clear()
        worksheet.append_row(DISTRICTS_HEADERS)

        rows = []

        # House districts (1-124)
        for i in range(1, SC_HOUSE_DISTRICTS + 1):
            district_id = f"SC-House-{i:03d}"
            incumbent = None
            if incumbents_data:
                incumbent = incumbents_data.get("house", {}).get(str(i), {})

            rows.append([
                district_id,
                f"SC House District {i}",
                "House",
                i,
                incumbent.get("name", "") if incumbent else "",
                incumbent.get("party", "") if incumbent else "",
            ])

        # Senate districts (1-46)
        for i in range(1, SC_SENATE_DISTRICTS + 1):
            district_id = f"SC-Senate-{i:03d}"
            incumbent = None
            if incumbents_data:
                incumbent = incumbents_data.get("senate", {}).get(str(i), {})

            rows.append([
                district_id,
                f"SC Senate District {i}",
                "Senate",
                i,
                incumbent.get("name", "") if incumbent else "",
                incumbent.get("party", "") if incumbent else "",
            ])

        # Batch append all rows
        worksheet.append_rows(rows)

        return len(rows)

    @sheets_retry()
    def get_districts(self) -> dict:
        """
        Get all districts indexed by district_id.

        Includes retry logic for transient API failures.

        Returns:
            Dict mapping district_id to district data.
        """
        worksheet = self._get_or_create_worksheet(TAB_DISTRICTS, DISTRICTS_HEADERS)

        all_values = worksheet.get_all_values()

        if len(all_values) <= 1:
            return {}

        districts = {}
        headers = all_values[0]

        for row in all_values[1:]:
            if not row or not row[0]:
                continue

            record = {}
            for i, header in enumerate(headers):
                if i < len(row):
                    record[header] = row[i]

            district_id = record.get("district_id", "")
            if district_id:
                districts[district_id] = record

        return districts

    # =========================================================================
    # Race Analysis Tab
    # =========================================================================

    @sheets_retry()
    def update_race_analysis(self, districts_data: dict = None) -> dict:
        """
        Update the Race Analysis tab with simplified structure.

        Computes:
        - challenger_count: Total filed candidates (excluding incumbent)
        - dem_filed: Y/N - Has a Democrat filed?
        - needs_dem_candidate: Y/N - Unopposed R, needs D candidate

        Includes retry logic for transient API failures.

        Args:
            districts_data: Optional dict with district/incumbent info.

        Returns:
            Summary dict with districts updated.
        """
        worksheet = self._get_or_create_worksheet(TAB_RACE_ANALYSIS, RACE_ANALYSIS_HEADERS)

        # Get all candidates
        candidates = self.read_candidates()

        # Get districts if not provided
        if districts_data is None:
            districts_data = self.get_districts()

        # Build candidate counts by district
        district_stats = {}

        for report_id, candidate in candidates.items():
            district_id = candidate.get("district_id", "")
            if not district_id:
                continue

            if district_id not in district_stats:
                district_stats[district_id] = {
                    "total_count": 0,
                    "dem_count": 0,
                    "rep_count": 0,
                    "incumbent_filed": False,
                }

            party = candidate.get("party", "")
            is_incumbent = candidate.get("is_incumbent", False)

            district_stats[district_id]["total_count"] += 1

            if party == "D":
                district_stats[district_id]["dem_count"] += 1
            elif party == "R":
                district_stats[district_id]["rep_count"] += 1

            if is_incumbent:
                district_stats[district_id]["incumbent_filed"] = True

        # Clear existing data (except header)
        worksheet.clear()
        worksheet.append_row(RACE_ANALYSIS_HEADERS)

        # Build analysis rows for all districts
        rows = []

        # All districts
        all_district_ids = []
        for i in range(1, SC_HOUSE_DISTRICTS + 1):
            all_district_ids.append(f"SC-House-{i:03d}")
        for i in range(1, SC_SENATE_DISTRICTS + 1):
            all_district_ids.append(f"SC-Senate-{i:03d}")

        needs_dem_count = 0

        for district_id in all_district_ids:
            # Get district info
            district_info = districts_data.get(district_id, {})
            incumbent_name = district_info.get("incumbent_name", "")
            incumbent_party = district_info.get("incumbent_party", "")

            # Get stats
            stats = district_stats.get(district_id, {
                "total_count": 0,
                "dem_count": 0,
                "rep_count": 0,
                "incumbent_filed": False,
            })

            # Calculate challenger count (excludes incumbent)
            challenger_count = stats["total_count"]
            if stats["incumbent_filed"]:
                challenger_count -= 1

            # Dem filed?
            dem_filed = "Y" if stats["dem_count"] > 0 else "N"

            # Needs Dem candidate?
            # Y if: incumbent is R, no D filed, and (incumbent filed OR no one filed)
            needs_dem = "N"
            if incumbent_party == "R" and stats["dem_count"] == 0:
                needs_dem = "Y"
                needs_dem_count += 1

            # Calculate priority tier
            # A - Flip Target: R incumbent, no D filed
            # B - Defend: D incumbent, no D filed (needs replacement/protection)
            # C - Competitive: Multiple candidates, some competition
            # D - Covered: D filed
            priority_tier = self._calculate_priority_tier(
                incumbent_party=incumbent_party,
                dem_count=stats["dem_count"],
                challenger_count=challenger_count,
            )

            rows.append([
                district_id,
                incumbent_name,
                incumbent_party,
                challenger_count,
                dem_filed,
                needs_dem,
                priority_tier,
            ])

        # Batch append all rows
        if rows:
            worksheet.append_rows(rows)

        return {
            "districts_analyzed": len(rows),
            "needs_dem_candidates": needs_dem_count,
        }

    def get_race_summary(self) -> dict:
        """
        Get summary of race analysis.

        Returns:
            Dict with counts.
        """
        worksheet = self._get_or_create_worksheet(TAB_RACE_ANALYSIS, RACE_ANALYSIS_HEADERS)

        all_values = worksheet.get_all_values()

        if len(all_values) <= 1:
            return {"total": 0, "needs_dem": 0, "dem_filed": 0}

        total = len(all_values) - 1
        needs_dem = sum(1 for row in all_values[1:] if len(row) > 5 and row[5] == "Y")
        dem_filed = sum(1 for row in all_values[1:] if len(row) > 4 and row[4] == "Y")

        return {
            "total": total,
            "needs_dem": needs_dem,
            "dem_filed": dem_filed,
        }

    def get_districts_needing_dem(self) -> list[dict]:
        """
        Get districts where needs_dem_candidate = Y.

        Returns:
            List of district dicts needing Democratic candidates.
        """
        worksheet = self._get_or_create_worksheet(TAB_RACE_ANALYSIS, RACE_ANALYSIS_HEADERS)

        all_values = worksheet.get_all_values()

        if len(all_values) <= 1:
            return []

        headers = all_values[0]
        results = []

        for row in all_values[1:]:
            if len(row) < len(headers):
                continue

            needs_dem = row[RACE_ANALYSIS_COLUMNS["needs_dem_candidate"]]
            if needs_dem == "Y":
                district = {}
                for i, header in enumerate(headers):
                    if i < len(row):
                        district[header] = row[i]
                results.append(district)

        return results

    # =========================================================================
    # Utility Methods
    # =========================================================================

    def get_all_candidates(self) -> list[dict]:
        """
        Get all candidates from the sheet as a list of dicts.

        Returns:
            List of candidate dicts with all columns.
        """
        candidates = self.read_candidates()
        return list(candidates.values())

    # =========================================================================
    # Source of Truth Tab Sync
    # =========================================================================

    def _parse_district_id(self, district_id: str) -> tuple:
        """
        Parse district_id like 'SC-House-042' into (chamber, number).

        Returns:
            Tuple of (chamber, district_number).
        """
        if not district_id or not district_id.startswith("SC-"):
            return None, None

        parts = district_id.split("-")
        if len(parts) != 3:
            return None, None

        chamber = parts[1]  # House or Senate
        try:
            district_num = int(parts[2])
        except ValueError:
            return None, None

        return chamber, district_num

    def _extract_url_from_hyperlink(self, formula: str) -> str:
        """Extract URL from a HYPERLINK formula."""
        if not formula:
            return ""
        if formula.startswith("=HYPERLINK"):
            match = re.search(r'HYPERLINK\("([^"]+)"', formula)
            if match:
                return match.group(1)
        return formula

    def _is_recent_filing(self, filed_date: str, days: int = None) -> bool:
        """Check if a filing date is within the recent window."""
        if days is None:
            days = NEW_CANDIDATE_DAYS

        if not filed_date:
            return False

        try:
            # Try various date formats
            for fmt in ["%Y-%m-%d", "%m/%d/%Y", "%m-%d-%Y"]:
                try:
                    filing_dt = datetime.strptime(filed_date, fmt)
                    break
                except ValueError:
                    continue
            else:
                return False

            cutoff = datetime.now() - timedelta(days=days)
            return filing_dt >= cutoff

        except Exception:
            return False

    def _normalize_party(self, party: str) -> str:
        """Normalize party code to single character."""
        if not party:
            return "?"
        party = party.strip().upper()
        if party in ("D", "DEMOCRAT", "DEMOCRATIC"):
            return "D"
        elif party in ("R", "REPUBLICAN"):
            return "R"
        elif party in ("I", "INDEPENDENT"):
            return "I"
        elif party in ("O", "OTHER"):
            return "O"
        return "?"

    def _calculate_priority_tier(
        self,
        incumbent_party: str,
        dem_count: int,
        challenger_count: int,
    ) -> str:
        """
        Calculate priority tier for a district.

        Priority tiers:
        - A - Flip Target: R incumbent, no D filed (highest priority)
        - B - Defend: D incumbent, no D filed (needs protection/replacement)
        - C - Competitive: Multiple candidates, some competition
        - D - Covered: D filed (race is covered)

        Args:
            incumbent_party: Party of incumbent (D/R or empty)
            dem_count: Number of Democratic candidates filed
            challenger_count: Total number of challengers

        Returns:
            Priority tier string (A/B/C/D)
        """
        # D - Covered: Democrat filed, race is covered
        if dem_count > 0:
            return "D - Covered"

        # A - Flip Target: R incumbent, no D filed
        if incumbent_party == "R" and dem_count == 0:
            return "A - Flip Target"

        # B - Defend: D incumbent, no D filed yet (may need replacement)
        if incumbent_party == "D" and dem_count == 0:
            return "B - Defend"

        # C - Competitive: Multiple challengers but no clear picture
        if challenger_count >= 2:
            return "C - Competitive"

        # Default - Open seat or unclear
        return "C - Competitive"

    def _sort_candidates(self, candidates: list) -> list:
        """
        Sort candidates: D first, then R, then others, then by filed date.

        This ensures Democrats are in slot 1 when present for easy scanning.
        """
        def sort_key(c):
            party = c.get("party", "?")
            # Priority: D=0, R=1, others=2
            party_order = 0 if party == "D" else 1 if party == "R" else 2
            # Secondary sort by filed date (earliest first)
            filed_date = c.get("filed_date", "9999-99-99")
            return (party_order, filed_date)

        return sorted(candidates, key=sort_key)

    def _build_sot_row_data(
        self,
        dem_filed: str,
        cand1: dict,
        cand2: dict,
        cand3: dict,
        last_updated: str
    ) -> list:
        """
        Build row data for columns N through AF.

        Returns a list of values for columns N through AF (indices 13-31),
        with spacer columns as empty strings.
        """
        def cand_values(c):
            if c is None:
                return ["", "", "", ""]
            return [
                c.get("name", ""),
                c.get("party", "?"),
                c.get("filed_date", ""),
                c.get("ethics_url", ""),
            ]

        c1 = cand_values(cand1)
        c2 = cand_values(cand2)
        c3 = cand_values(cand3)

        # Build row: N through AF
        # N=dem_filed, O=spacer, P-S=cand1, T=spacer, U-X=cand2, Y=spacer, Z-AC=cand3, AD=spacer, AE=skip(protected), AF=last_updated
        return [
            dem_filed,       # N (13) - Dem Filed
            "",              # O (14) - spacer
            c1[0],           # P (15) - Challenger 1 name
            c1[1],           # Q (16) - Party
            c1[2],           # R (17) - Filed Date
            c1[3],           # S (18) - Ethics URL
            "",              # T (19) - spacer
            c2[0],           # U (20) - Challenger 2 name
            c2[1],           # V (21) - Party
            c2[2],           # W (22) - Filed Date
            c2[3],           # X (23) - Ethics URL
            "",              # Y (24) - spacer
            c3[0],           # Z (25) - Challenger 3 name
            c3[1],           # AA (26) - Party
            c3[2],           # AB (27) - Filed Date
            c3[3],           # AC (28) - Ethics URL
            "",              # AD (29) - spacer
            "",              # AE (30) - Bench/Potential (SKIP - protected)
            last_updated,    # AF (31) - Last Updated
        ]

    @sheets_retry()
    def sync_to_source_of_truth(self, candidates: dict = None) -> dict:
        """
        Sync Candidates tab data to Source of Truth dynamic columns.

        Includes retry logic for transient API failures.

        Uses new slot-based structure where each candidate gets their own cells:
        - Challenger 1: P (name), Q (party), R (date), S (URL)
        - Challenger 2: U (name), V (party), W (date), X (URL)
        - Challenger 3: Z (name), AA (party), AB (date), AC (URL)

        This method:
        - Reads candidates (or uses provided dict)
        - Groups candidates by district
        - Filters out incumbents (they're in static columns)
        - Sorts candidates (D first, then R, then others)
        - Assigns to slots 1, 2, 3 (max 3 candidates per district)
        - Auto-calculates Dem Filed (Y if any D candidate)
        - Highlights new candidates (within NEW_CANDIDATE_DAYS)
        - NEVER touches Bench/Potential column (AE)

        Args:
            candidates: Optional pre-loaded candidates dict (by report_id).
                       If None, reads from Candidates tab.

        Returns:
            Summary dict with sync results.
        """
        results = {
            "rows_updated": 0,
            "dem_candidates": 0,
            "rep_candidates": 0,
            "other_candidates": 0,
            "new_candidates_flagged": 0,
            "districts_with_1_challenger": 0,
            "districts_with_2_challengers": 0,
            "districts_with_3_plus_challengers": 0,
            "errors": [],
        }

        # Get candidates if not provided
        if candidates is None:
            candidates = self.read_candidates()

        # Get Source of Truth worksheet
        try:
            sot_worksheet = self.spreadsheet.worksheet(TAB_SOURCE_OF_TRUTH)
        except Exception as e:
            results["errors"].append(f"Could not find Source of Truth tab: {e}")
            return results

        # Read existing Source of Truth data to get row numbers
        sot_data = sot_worksheet.get_all_values()

        # Build mapping of (chamber, district_num) -> row number
        # Assumes Column A = chamber, Column B = district_number
        district_row_map = {}
        for row_idx, row in enumerate(sot_data[1:], start=2):  # Skip header
            if len(row) >= 2 and row[0] and row[1]:
                chamber = row[0]
                try:
                    district_num = int(row[1])
                    district_row_map[(chamber, district_num)] = row_idx
                except ValueError:
                    continue

        # Group candidates by district
        candidates_by_district = defaultdict(list)

        for report_id, candidate in candidates.items():
            district_id = candidate.get("district_id", "")
            chamber, district_num = self._parse_district_id(district_id)

            if chamber is None or district_num is None:
                continue

            # Skip incumbents - they're in static columns
            if candidate.get("is_incumbent", False):
                continue

            # Normalize party
            party = self._normalize_party(candidate.get("party", ""))
            if party == "D":
                results["dem_candidates"] += 1
            elif party == "R":
                results["rep_candidates"] += 1
            else:
                results["other_candidates"] += 1

            # Extract URL from hyperlink formula if present
            ethics_url = self._extract_url_from_hyperlink(candidate.get("ethics_url", ""))

            # Check if recent
            is_new = self._is_recent_filing(candidate.get("filed_date", ""))
            if is_new:
                results["new_candidates_flagged"] += 1

            candidates_by_district[(chamber, district_num)].append({
                "name": candidate.get("candidate_name", ""),
                "party": party,
                "filed_date": candidate.get("filed_date", ""),
                "ethics_url": ethics_url,
                "report_id": report_id,
                "is_new": is_new,
            })

        # Analyze distribution
        for (chamber, district_num), cands in candidates_by_district.items():
            count = len(cands)
            if count == 1:
                results["districts_with_1_challenger"] += 1
            elif count == 2:
                results["districts_with_2_challengers"] += 1
            elif count >= 3:
                results["districts_with_3_plus_challengers"] += 1

        # Prepare batch updates
        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        rows_to_highlight = []
        row_data_map = {}

        for (chamber, district_num), row_num in district_row_map.items():
            district_cands = candidates_by_district.get((chamber, district_num), [])

            # Sort candidates: D first, then R, then others
            sorted_cands = self._sort_candidates(district_cands)

            # Assign to slots (max 3)
            cand1 = sorted_cands[0] if len(sorted_cands) > 0 else None
            cand2 = sorted_cands[1] if len(sorted_cands) > 1 else None
            cand3 = sorted_cands[2] if len(sorted_cands) > 2 else None

            # Calculate Dem Filed
            has_dem = any(c["party"] == "D" for c in district_cands)
            dem_filed = "Y" if has_dem else "N"

            # Check for new candidates
            has_new = any(c.get("is_new", False) for c in district_cands)
            if has_new:
                rows_to_highlight.append(row_num)

            # Only set last_updated if there are candidates
            last_updated = now if district_cands else ""

            # Build row data for columns N through AF
            row_values = self._build_sot_row_data(dem_filed, cand1, cand2, cand3, last_updated)
            row_data_map[row_num] = row_values

        # Use batch_update for efficiency (single API call)
        sorted_rows = sorted(row_data_map.keys())

        if sorted_rows:
            min_row = min(sorted_rows)
            max_row = max(sorted_rows)

            # Build a 2D array for the entire range
            all_rows = []
            for row_num in range(min_row, max_row + 1):
                if row_num in row_data_map:
                    all_rows.append(row_data_map[row_num])
                else:
                    # Empty row placeholder (maintains N column default)
                    all_rows.append(["N"] + [""] * 18)  # N through AF (19 columns)

            # Single batch update for columns N through AF
            cell_range = f"N{min_row}:AF{max_row}"
            try:
                sot_worksheet.update(values=all_rows, range_name=cell_range, value_input_option="USER_ENTERED")
                results["rows_updated"] = len(all_rows)
            except Exception as e:
                results["errors"].append(f"Batch update failed: {e}")

        # Apply highlighting to rows with new candidates
        if rows_to_highlight:
            self.highlight_new_candidates(sot_worksheet, rows_to_highlight)

        return results

    def highlight_new_candidates(
        self,
        worksheet,
        row_numbers: list,
        color: dict = None,
    ) -> None:
        """
        Apply yellow background to rows with newly added candidates.

        Args:
            worksheet: gspread.Worksheet object
            row_numbers: List of row numbers to highlight
            color: Optional RGB color dict (default: light yellow)
        """
        if not row_numbers:
            return

        if color is None:
            # Light yellow background
            color = {"red": 1.0, "green": 1.0, "blue": 0.8}

        # Build batch update requests for formatting
        requests = []

        for row_num in row_numbers:
            # Highlight columns N through AF (indices 13-31)
            requests.append({
                "repeatCell": {
                    "range": {
                        "sheetId": worksheet.id,
                        "startRowIndex": row_num - 1,  # 0-indexed
                        "endRowIndex": row_num,
                        "startColumnIndex": 13,  # N
                        "endColumnIndex": 32,    # AF (exclusive, so 32)
                    },
                    "cell": {
                        "userEnteredFormat": {
                            "backgroundColor": color
                        }
                    },
                    "fields": "userEnteredFormat.backgroundColor"
                }
            })

        # Execute batch update
        if requests:
            try:
                self.spreadsheet.batch_update({"requests": requests})
            except Exception as e:
                print(f"Warning: Could not apply highlighting: {e}")

    def clear_new_candidate_highlights(
        self,
        worksheet = None,
    ) -> None:
        """
        Clear all yellow highlights from Source of Truth tab.

        Call this before sync to reset highlights, then apply fresh ones.
        """
        if worksheet is None:
            try:
                worksheet = self.spreadsheet.worksheet(TAB_SOURCE_OF_TRUTH)
            except Exception:
                return

        # Get total rows
        all_values = worksheet.get_all_values()
        total_rows = len(all_values)

        if total_rows <= 1:
            return

        # Clear formatting for all data rows, columns N-AF
        requests = [{
            "repeatCell": {
                "range": {
                    "sheetId": worksheet.id,
                    "startRowIndex": 1,  # Skip header
                    "endRowIndex": total_rows,
                    "startColumnIndex": 13,  # N
                    "endColumnIndex": 32,    # AF (exclusive)
                },
                "cell": {
                    "userEnteredFormat": {
                        "backgroundColor": {"red": 1.0, "green": 1.0, "blue": 1.0}
                    }
                },
                "fields": "userEnteredFormat.backgroundColor"
            }
        }]

        try:
            self.spreadsheet.batch_update({"requests": requests})
        except Exception as e:
            print(f"Warning: Could not clear highlights: {e}")


# Convenience function for quick operations
def quick_sync(credentials_path: str = None) -> SheetsSync:
    """
    Create and connect a SheetsSync instance.

    Args:
        credentials_path: Optional path to credentials file.

    Returns:
        Connected SheetsSync instance.
    """
    sync = SheetsSync(credentials_path)
    if not sync.connect():
        raise RuntimeError("Failed to connect to Google Sheets")
    return sync
