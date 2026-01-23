"""
Google Sheets Sync - Bidirectional sync for SC Ethics Monitor.

This module handles reading from AND writing to Google Sheets,
respecting manual user overrides and party_locked flags.

Key Principle: Manual overrides take precedence.
"""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

try:
    import gspread
    from google.oauth2.service_account import Credentials
except ImportError:
    print("Required packages not installed. Run: pip install gspread google-auth")
    raise

from .config import (
    SPREADSHEET_ID,
    TAB_CANDIDATES,
    TAB_DISTRICTS,
    TAB_RACE_ANALYSIS,
    TAB_RESEARCH_QUEUE,
    TAB_SYNC_LOG,
    CANDIDATES_COLUMNS,
    CANDIDATES_HEADERS,
    DISTRICTS_COLUMNS,
    DISTRICTS_HEADERS,
    RACE_ANALYSIS_COLUMNS,
    RACE_ANALYSIS_HEADERS,
    RESEARCH_QUEUE_COLUMNS,
    RESEARCH_QUEUE_HEADERS,
    SYNC_LOG_COLUMNS,
    SYNC_LOG_HEADERS,
    GOOGLE_SHEETS_CREDENTIALS,
    SC_HOUSE_DISTRICTS,
    SC_SENATE_DISTRICTS,
)


class SheetsSync:
    """
    Bidirectional sync manager for Google Sheets.

    Handles:
    - Reading existing sheet state (manual overrides, party_locked)
    - Writing new candidates while preserving manual edits
    - Updating race analysis using final_party
    - Managing research queue
    - Audit logging
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

    # =========================================================================
    # PHASE 1: Read Sheet State (Bidirectional Sync)
    # =========================================================================

    def read_sheet_state(self) -> dict:
        """
        Read existing candidates from sheet, extracting manual columns.

        This is the key method for bidirectional sync - it reads what's
        already in the sheet so we can preserve manual edits.

        Returns:
            Dict keyed by report_id with values:
            {
                "manual_party_override": str or None,
                "party_locked": bool,
                "final_party": str or None,
                "notes": str or None,
                "detected_party": str or None,
                "detection_confidence": str or None,
                "row_number": int,  # For updates
            }
        """
        worksheet = self._get_or_create_worksheet(TAB_CANDIDATES, CANDIDATES_HEADERS)

        # Get all values (includes header)
        all_values = worksheet.get_all_values()

        if len(all_values) <= 1:
            return {}  # Only header or empty

        state = {}

        for row_idx, row in enumerate(all_values[1:], start=2):  # Start at row 2 (after header)
            if len(row) < 1 or not row[0]:
                continue  # Skip empty rows

            report_id = row[CANDIDATES_COLUMNS["report_id"]]

            # Extract manual columns with safe indexing
            def safe_get(col_name):
                idx = CANDIDATES_COLUMNS.get(col_name, -1)
                if idx >= 0 and idx < len(row):
                    return row[idx] if row[idx] else None
                return None

            state[report_id] = {
                "manual_party_override": safe_get("manual_party_override"),
                "party_locked": safe_get("party_locked") == "Yes",
                "final_party": safe_get("final_party"),
                "notes": safe_get("notes"),
                "detected_party": safe_get("detected_party"),
                "detection_confidence": safe_get("detection_confidence"),
                "row_number": row_idx,
            }

        return state

    def is_party_locked(self, report_id: str, sheet_state: dict = None) -> bool:
        """
        Check if a candidate's party is locked (no re-detection).

        Args:
            report_id: The candidate's report ID.
            sheet_state: Optional pre-loaded sheet state dict.

        Returns:
            True if party_locked=Yes for this candidate.
        """
        if sheet_state is None:
            sheet_state = self.read_sheet_state()

        return sheet_state.get(report_id, {}).get("party_locked", False)

    def get_manual_override(self, report_id: str, sheet_state: dict = None) -> Optional[str]:
        """
        Get manual party override for a candidate.

        Args:
            report_id: The candidate's report ID.
            sheet_state: Optional pre-loaded sheet state dict.

        Returns:
            Manual party override (D/R/I/O) or None if not set.
        """
        if sheet_state is None:
            sheet_state = self.read_sheet_state()

        return sheet_state.get(report_id, {}).get("manual_party_override")

    # =========================================================================
    # PHASE 1: Add/Update Candidates (Respecting Overrides)
    # =========================================================================

    def add_candidate(
        self,
        report_id: str,
        candidate_name: str,
        district_id: str,
        filed_date: str,
        ethics_report_url: str,
        is_incumbent: bool,
        detected_party: str = None,
        detection_confidence: str = "UNKNOWN",
        detection_source: str = None,
        detection_evidence_url: str = None,
        sheet_state: dict = None,
    ) -> dict:
        """
        Add or update a candidate in the sheet, respecting manual overrides.

        This method:
        1. Checks if candidate already exists
        2. If party_locked=Yes: preserves ALL detection fields, only updates metadata
        3. If manual_party_override set: preserves it
        4. Only updates auto-detected fields for unlocked candidates

        Args:
            report_id: Unique report ID from Ethics Commission.
            candidate_name: Full candidate name.
            district_id: District identifier (e.g., "SC-House-042").
            filed_date: Date filed with Ethics.
            ethics_report_url: URL to Ethics filing.
            is_incumbent: Whether candidate is the incumbent.
            detected_party: Auto-detected party (D/R/I/O).
            detection_confidence: HIGH/MEDIUM/LOW/UNKNOWN.
            detection_source: Source of party detection.
            detection_evidence_url: URL supporting detection.
            sheet_state: Optional pre-loaded sheet state dict.

        Returns:
            Dict with {"action": "added"|"updated"|"skipped", "details": str}
        """
        worksheet = self._get_or_create_worksheet(TAB_CANDIDATES, CANDIDATES_HEADERS)

        if sheet_state is None:
            sheet_state = self.read_sheet_state()

        now = datetime.now(timezone.utc).isoformat()

        existing = sheet_state.get(report_id)

        if existing:
            # Candidate exists - check if we should update
            if existing.get("party_locked"):
                # Party locked - only update non-detection fields
                row_num = existing["row_number"]

                # Update only: filed_date, last_synced (if changed)
                updates = []

                # Update filed_date if different
                updates.append({
                    "range": f"{self._col_letter(CANDIDATES_COLUMNS['filed_date'])}{row_num}",
                    "values": [[filed_date]]
                })

                # Update last_synced
                updates.append({
                    "range": f"{self._col_letter(CANDIDATES_COLUMNS['last_synced'])}{row_num}",
                    "values": [[now]]
                })

                worksheet.batch_update(updates)

                return {
                    "action": "skipped",
                    "details": f"Party locked for {candidate_name} - preserved manual data"
                }

            else:
                # Not locked - update detection fields but preserve manual override
                row_num = existing["row_number"]

                # Preserve manual override if set
                manual_override = existing.get("manual_party_override")
                notes = existing.get("notes")

                # Build row data (keeping manual columns)
                row_data = self._build_candidate_row(
                    report_id=report_id,
                    candidate_name=candidate_name,
                    district_id=district_id,
                    filed_date=filed_date,
                    ethics_report_url=ethics_report_url,
                    is_incumbent=is_incumbent,
                    detected_party=detected_party,
                    detection_confidence=detection_confidence,
                    detection_source=detection_source,
                    detection_evidence_url=detection_evidence_url,
                    manual_party_override=manual_override,
                    notes=notes,
                    detection_timestamp=now,
                    last_synced=now,
                )

                # Update the entire row
                worksheet.update(f"A{row_num}:P{row_num}", [row_data])

                return {
                    "action": "updated",
                    "details": f"Updated {candidate_name}, preserved manual_party_override={manual_override}"
                }

        else:
            # New candidate - add new row
            row_data = self._build_candidate_row(
                report_id=report_id,
                candidate_name=candidate_name,
                district_id=district_id,
                filed_date=filed_date,
                ethics_report_url=ethics_report_url,
                is_incumbent=is_incumbent,
                detected_party=detected_party,
                detection_confidence=detection_confidence,
                detection_source=detection_source,
                detection_evidence_url=detection_evidence_url,
                detection_timestamp=now,
                last_synced=now,
            )

            worksheet.append_row(row_data)

            return {
                "action": "added",
                "details": f"Added new candidate {candidate_name}"
            }

    def _build_candidate_row(
        self,
        report_id: str,
        candidate_name: str,
        district_id: str,
        filed_date: str,
        ethics_report_url: str,
        is_incumbent: bool,
        detected_party: str = None,
        detection_confidence: str = "UNKNOWN",
        detection_source: str = None,
        detection_evidence_url: str = None,
        manual_party_override: str = None,
        party_locked: str = None,
        notes: str = None,
        detection_timestamp: str = None,
        last_synced: str = None,
    ) -> list:
        """Build a candidate row list matching column order."""
        # Column L (final_party) uses a formula
        final_party_formula = f'=IF(K{{row}}<>"",K{{row}},G{{row}})'

        return [
            report_id,                              # A
            candidate_name,                         # B
            district_id,                            # C
            filed_date,                             # D
            ethics_report_url,                      # E
            "Yes" if is_incumbent else "No",        # F
            detected_party or "",                   # G
            detection_confidence or "UNKNOWN",      # H
            detection_source or "",                 # I
            detection_evidence_url or "",           # J
            manual_party_override or "",            # K
            "",  # L - final_party (formula added separately)
            party_locked or "",                     # M
            detection_timestamp or "",              # N
            notes or "",                            # O
            last_synced or "",                      # P
        ]

    def _col_letter(self, col_index: int) -> str:
        """Convert 0-based column index to letter (0 -> A, 1 -> B, etc)."""
        return chr(ord('A') + col_index)

    def sync_candidates(
        self,
        candidates: list[dict],
        sheet_state: dict = None,
        skip_locked: bool = True,
    ) -> dict:
        """
        Sync multiple candidates to the sheet.

        Args:
            candidates: List of candidate dicts with required fields.
            sheet_state: Optional pre-loaded sheet state.
            skip_locked: If True, skip party detection for locked candidates.

        Returns:
            Summary dict with counts: added, updated, skipped, errors.
        """
        if sheet_state is None:
            sheet_state = self.read_sheet_state()

        results = {"added": 0, "updated": 0, "skipped": 0, "errors": 0}

        for candidate in candidates:
            try:
                report_id = candidate.get("report_id")

                # Check if we should skip party detection
                if skip_locked and self.is_party_locked(report_id, sheet_state):
                    result = self.add_candidate(
                        report_id=report_id,
                        candidate_name=candidate.get("candidate_name", ""),
                        district_id=candidate.get("district_id", ""),
                        filed_date=candidate.get("filed_date", ""),
                        ethics_report_url=candidate.get("ethics_report_url", ""),
                        is_incumbent=candidate.get("is_incumbent", False),
                        # Don't pass detection fields - preserve existing
                        sheet_state=sheet_state,
                    )
                else:
                    result = self.add_candidate(
                        report_id=report_id,
                        candidate_name=candidate.get("candidate_name", ""),
                        district_id=candidate.get("district_id", ""),
                        filed_date=candidate.get("filed_date", ""),
                        ethics_report_url=candidate.get("ethics_report_url", ""),
                        is_incumbent=candidate.get("is_incumbent", False),
                        detected_party=candidate.get("detected_party"),
                        detection_confidence=candidate.get("detection_confidence", "UNKNOWN"),
                        detection_source=candidate.get("detection_source"),
                        detection_evidence_url=candidate.get("detection_evidence_url"),
                        sheet_state=sheet_state,
                    )

                results[result["action"]] = results.get(result["action"], 0) + 1

            except Exception as e:
                print(f"Error syncing candidate {candidate.get('report_id')}: {e}")
                results["errors"] += 1

        return results

    # =========================================================================
    # Districts Tab Management
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
                incumbent.get("since", "") if incumbent else "",
                "2026",
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
                incumbent.get("since", "") if incumbent else "",
                "2026",
            ])

        # Batch append all rows
        worksheet.append_rows(rows)

        return len(rows)

    # =========================================================================
    # Sync Log
    # =========================================================================

    def log_sync(
        self,
        event_type: str,
        details: str,
        candidates_added: int = 0,
        candidates_updated: int = 0,
        party_detections: int = 0,
        errors: int = 0,
    ) -> None:
        """
        Add an entry to the Sync Log tab.

        Args:
            event_type: SYNC, SCAN, PARTY_DETECT, ERROR, etc.
            details: Description of what happened.
            candidates_added: Count of new candidates.
            candidates_updated: Count of updated candidates.
            party_detections: Count of party detections run.
            errors: Count of errors.
        """
        worksheet = self._get_or_create_worksheet(TAB_SYNC_LOG, SYNC_LOG_HEADERS)

        now = datetime.now(timezone.utc).isoformat()

        worksheet.append_row([
            now,
            event_type,
            details,
            candidates_added,
            candidates_updated,
            party_detections,
            errors,
        ])

    # =========================================================================
    # Utility Methods
    # =========================================================================

    def get_all_candidates(self) -> list[dict]:
        """
        Get all candidates from the sheet as a list of dicts.

        Returns:
            List of candidate dicts with all columns.
        """
        worksheet = self._get_or_create_worksheet(TAB_CANDIDATES, CANDIDATES_HEADERS)

        all_values = worksheet.get_all_values()

        if len(all_values) <= 1:
            return []

        candidates = []
        headers = all_values[0]

        for row in all_values[1:]:
            if not row or not row[0]:
                continue

            candidate = {}
            for i, header in enumerate(headers):
                if i < len(row):
                    candidate[header] = row[i]
                else:
                    candidate[header] = ""

            candidates.append(candidate)

        return candidates

    def get_candidates_by_district(self, district_id: str) -> list[dict]:
        """
        Get all candidates for a specific district.

        Args:
            district_id: e.g., "SC-House-042"

        Returns:
            List of candidate dicts for that district.
        """
        all_candidates = self.get_all_candidates()
        return [c for c in all_candidates if c.get("district_id") == district_id]

    def get_candidates_needing_research(self) -> list[dict]:
        """
        Get candidates with LOW/UNKNOWN confidence that aren't party_locked.

        Returns:
            List of candidate dicts needing party research.
        """
        all_candidates = self.get_all_candidates()

        return [
            c for c in all_candidates
            if c.get("detection_confidence") in ("LOW", "UNKNOWN")
            and c.get("party_locked") != "Yes"
        ]

    def apply_final_party_formula(self) -> int:
        """
        Populate final_party column with manual override or detected party.

        For each candidate row:
        - If manual_party_override (K) is set, use it
        - Otherwise use detected_party (G)
        - Write the result to final_party (L)

        Returns:
            Number of rows updated.
        """
        worksheet = self._get_or_create_worksheet(TAB_CANDIDATES, CANDIDATES_HEADERS)
        all_values = worksheet.get_all_values()

        if len(all_values) <= 1:
            return 0

        headers = all_values[0]
        try:
            detected_idx = headers.index("detected_party")
            override_idx = headers.index("manual_party_override")
            final_idx = headers.index("final_party")
        except ValueError as e:
            self.logger.error(f"Missing required column: {e}")
            return 0

        updates = []
        for row_num, row in enumerate(all_values[1:], start=2):
            if not row or len(row) <= final_idx:
                continue

            override = row[override_idx] if override_idx < len(row) else ""
            detected = row[detected_idx] if detected_idx < len(row) else ""
            current_final = row[final_idx] if final_idx < len(row) else ""

            # Compute new final_party
            new_final = override if override else detected

            # Only update if different
            if new_final != current_final:
                updates.append({
                    "range": f"L{row_num}",  # Column L is final_party
                    "values": [[new_final]]
                })

        if updates:
            worksheet.batch_update(updates)
            self.logger.info(f"Updated {len(updates)} final_party values")

        return len(updates)

    # =========================================================================
    # PHASE 3: Race Analysis (Using final_party)
    # =========================================================================

    def update_race_analysis(self, districts_data: dict = None) -> dict:
        """
        Update the Race Analysis tab using final_party (not detected_party).

        This is the key improvement from Phase 3 - we use final_party which
        respects manual overrides, not just detected_party.

        Args:
            districts_data: Optional dict with district/incumbent info.

        Returns:
            Summary dict with districts updated, priority counts.
        """
        worksheet = self._get_or_create_worksheet(TAB_RACE_ANALYSIS, RACE_ANALYSIS_HEADERS)

        # Get all candidates with their final_party
        all_candidates = self.get_all_candidates()

        # Build candidate counts by district
        district_stats = {}

        for candidate in all_candidates:
            district_id = candidate.get("district_id", "")
            if not district_id:
                continue

            if district_id not in district_stats:
                district_stats[district_id] = {
                    "dem_count": 0,
                    "rep_count": 0,
                    "other_count": 0,
                    "needs_research": 0,
                    "candidates": [],
                }

            # Use final_party, fallback to detected_party if final_party is empty
            # (final_party may be empty because it's a formula column that wasn't populated)
            final_party = candidate.get("final_party", "") or candidate.get("detected_party", "")

            if final_party == "D":
                district_stats[district_id]["dem_count"] += 1
            elif final_party == "R":
                district_stats[district_id]["rep_count"] += 1
            elif final_party:
                district_stats[district_id]["other_count"] += 1

            # Count needs_research (LOW/UNKNOWN and not locked)
            confidence = candidate.get("detection_confidence", "")
            locked = candidate.get("party_locked", "")
            if confidence in ("LOW", "UNKNOWN") and locked != "Yes":
                district_stats[district_id]["needs_research"] += 1

            district_stats[district_id]["candidates"].append(candidate)

        # Clear existing data (except header)
        worksheet.clear()
        worksheet.append_row(RACE_ANALYSIS_HEADERS)

        # Build analysis rows
        rows = []
        now = datetime.now(timezone.utc).isoformat()

        # Get districts info if provided
        if districts_data:
            all_districts = []
            for chamber in ["house", "senate"]:
                for dist_num in range(1, (SC_HOUSE_DISTRICTS if chamber == "house" else SC_SENATE_DISTRICTS) + 1):
                    district_id = f"SC-{chamber.capitalize()}-{dist_num:03d}"
                    all_districts.append({
                        "district_id": district_id,
                        "chamber": chamber,
                        "number": dist_num,
                    })
        else:
            # Generate all district IDs
            all_districts = []
            for i in range(1, SC_HOUSE_DISTRICTS + 1):
                all_districts.append({
                    "district_id": f"SC-House-{i:03d}",
                    "chamber": "house",
                    "number": i,
                })
            for i in range(1, SC_SENATE_DISTRICTS + 1):
                all_districts.append({
                    "district_id": f"SC-Senate-{i:03d}",
                    "chamber": "senate",
                    "number": i,
                })

        priority_counts = {
            "High-D-Recruit": 0,
            "Open-Seat": 0,
            "Monitor": 0,
            "Low": 0,
        }

        for district in all_districts:
            district_id = district["district_id"]
            stats = district_stats.get(district_id, {
                "dem_count": 0,
                "rep_count": 0,
                "other_count": 0,
                "needs_research": 0,
            })

            # Get incumbent info from districts_data if available
            incumbent_name = ""
            incumbent_party = ""
            if districts_data:
                chamber = district["chamber"]
                dist_num = str(district["number"])
                incumbent_info = districts_data.get(chamber, {}).get(dist_num, {})
                incumbent_name = incumbent_info.get("name", "")
                incumbent_party = incumbent_info.get("party", "")

            # Calculate race status
            dem_count = stats["dem_count"]
            rep_count = stats["rep_count"]
            other_count = stats["other_count"]
            total = dem_count + rep_count + other_count

            if total == 0:
                if incumbent_party == "R":
                    race_status = "Unopposed-R"
                elif incumbent_party == "D":
                    race_status = "Unopposed-D"
                else:
                    race_status = "Unknown"
            elif dem_count > 0 and rep_count > 0:
                race_status = "Contested"
            elif dem_count > 0:
                race_status = "Unopposed-D"
            elif rep_count > 0:
                race_status = "Unopposed-R"
            else:
                race_status = "Other"

            # Calculate recruitment priority
            if race_status == "Unopposed-R" and dem_count == 0:
                priority = "High-D-Recruit"
            elif not incumbent_name or incumbent_party == "":
                priority = "Open-Seat"
            elif race_status == "Contested":
                priority = "Monitor"
            else:
                priority = "Low"

            priority_counts[priority] = priority_counts.get(priority, 0) + 1

            # Build row
            rows.append([
                district_id,
                f"SC {district['chamber'].capitalize()} District {district['number']}",
                incumbent_name,
                incumbent_party,
                dem_count,
                rep_count,
                other_count,
                race_status,
                priority,
                stats["needs_research"],
                now,
            ])

        # Batch append all rows
        if rows:
            worksheet.append_rows(rows)

        return {
            "districts_analyzed": len(rows),
            "priority_counts": priority_counts,
            "timestamp": now,
        }

    def get_race_analysis_summary(self) -> dict:
        """
        Get summary of race analysis.

        Returns:
            Dict with counts by status and priority.
        """
        worksheet = self._get_or_create_worksheet(TAB_RACE_ANALYSIS, RACE_ANALYSIS_HEADERS)

        all_values = worksheet.get_all_values()

        if len(all_values) <= 1:
            return {"total": 0}

        summary = {
            "total": len(all_values) - 1,
            "by_status": {},
            "by_priority": {},
            "needs_research_total": 0,
        }

        for row in all_values[1:]:
            if len(row) < 11:
                continue

            status = row[RACE_ANALYSIS_COLUMNS["race_status"]]
            priority = row[RACE_ANALYSIS_COLUMNS["recruitment_priority"]]
            needs_research = row[RACE_ANALYSIS_COLUMNS["needs_research"]]

            summary["by_status"][status] = summary["by_status"].get(status, 0) + 1
            summary["by_priority"][priority] = summary["by_priority"].get(priority, 0) + 1

            try:
                summary["needs_research_total"] += int(needs_research) if needs_research else 0
            except ValueError:
                pass

        return summary

    def get_high_priority_districts(self) -> list[dict]:
        """
        Get districts with High-D-Recruit priority.

        Returns:
            List of district dicts that are high priority for recruitment.
        """
        worksheet = self._get_or_create_worksheet(TAB_RACE_ANALYSIS, RACE_ANALYSIS_HEADERS)

        all_values = worksheet.get_all_values()

        if len(all_values) <= 1:
            return []

        headers = all_values[0]
        high_priority = []

        for row in all_values[1:]:
            if len(row) < len(headers):
                continue

            priority = row[RACE_ANALYSIS_COLUMNS["recruitment_priority"]]
            if priority == "High-D-Recruit":
                district = {}
                for i, header in enumerate(headers):
                    if i < len(row):
                        district[header] = row[i]
                high_priority.append(district)

        return high_priority

    # =========================================================================
    # PHASE 5: Research Queue Management
    # =========================================================================

    def populate_research_queue(self) -> dict:
        """
        Populate Research Queue with candidates needing party verification.

        Auto-adds candidates with LOW/UNKNOWN confidence that aren't party_locked.
        Includes suggested search links.

        Returns:
            Summary dict with candidates added.
        """
        worksheet = self._get_or_create_worksheet(TAB_RESEARCH_QUEUE, RESEARCH_QUEUE_HEADERS)

        # Get candidates needing research
        candidates = self.get_candidates_needing_research()

        # Get existing queue to avoid duplicates
        existing = worksheet.get_all_values()
        existing_ids = set()
        if len(existing) > 1:
            for row in existing[1:]:
                if row and row[0]:
                    existing_ids.add(row[0])

        now = datetime.now(timezone.utc).isoformat()
        added = 0

        for candidate in candidates:
            report_id = candidate.get("report_id", "")
            if report_id in existing_ids:
                continue

            name = candidate.get("candidate_name", "")
            district_id = candidate.get("district_id", "")
            detected_party = candidate.get("detected_party", "")
            confidence = candidate.get("detection_confidence", "")

            # Build suggested search URL
            search_query = f'"{name}" "South Carolina" Democrat OR Republican'
            suggested_search = f"https://www.google.com/search?q={search_query.replace(' ', '+')}"

            # Party website links
            scdp_link = f"https://www.scdp.org/search?q={name.replace(' ', '+')}"
            scgop_link = f"https://www.scgop.com/search?q={name.replace(' ', '+')}"

            worksheet.append_row([
                report_id,
                name,
                district_id,
                detected_party,
                confidence,
                suggested_search,
                scdp_link,
                scgop_link,
                "Pending",          # status
                "",                 # assigned_to
                "",                 # resolution_notes
                "",                 # resolved_date
                now,                # added_date
            ])

            added += 1

        return {
            "candidates_added": added,
            "total_needing_research": len(candidates),
            "already_in_queue": len(candidates) - added,
        }

    def get_pending_research(self) -> list[dict]:
        """
        Get research queue items with Pending status.

        Returns:
            List of research items needing attention.
        """
        worksheet = self._get_or_create_worksheet(TAB_RESEARCH_QUEUE, RESEARCH_QUEUE_HEADERS)

        all_values = worksheet.get_all_values()

        if len(all_values) <= 1:
            return []

        headers = all_values[0]
        pending = []

        for row in all_values[1:]:
            if len(row) < len(headers):
                continue

            status = row[RESEARCH_QUEUE_COLUMNS["status"]]
            if status == "Pending":
                item = {}
                for i, header in enumerate(headers):
                    if i < len(row):
                        item[header] = row[i]
                pending.append(item)

        return pending

    def update_research_status(
        self,
        report_id: str,
        status: str,
        resolution_notes: str = None,
        assigned_to: str = None,
    ) -> bool:
        """
        Update status of a research queue item.

        Args:
            report_id: Candidate report ID.
            status: New status (Pending, In-Progress, Resolved).
            resolution_notes: Optional notes on resolution.
            assigned_to: Optional researcher name.

        Returns:
            True if updated successfully.
        """
        worksheet = self._get_or_create_worksheet(TAB_RESEARCH_QUEUE, RESEARCH_QUEUE_HEADERS)

        all_values = worksheet.get_all_values()

        for row_idx, row in enumerate(all_values[1:], start=2):
            if row and row[0] == report_id:
                updates = []

                # Update status
                status_col = self._col_letter(RESEARCH_QUEUE_COLUMNS["status"])
                updates.append({
                    "range": f"{status_col}{row_idx}",
                    "values": [[status]]
                })

                # Update assigned_to if provided
                if assigned_to is not None:
                    assigned_col = self._col_letter(RESEARCH_QUEUE_COLUMNS["assigned_to"])
                    updates.append({
                        "range": f"{assigned_col}{row_idx}",
                        "values": [[assigned_to]]
                    })

                # Update resolution_notes if provided
                if resolution_notes is not None:
                    notes_col = self._col_letter(RESEARCH_QUEUE_COLUMNS["resolution_notes"])
                    updates.append({
                        "range": f"{notes_col}{row_idx}",
                        "values": [[resolution_notes]]
                    })

                # If status is Resolved, set resolved_date
                if status == "Resolved":
                    resolved_col = self._col_letter(RESEARCH_QUEUE_COLUMNS["resolved_date"])
                    updates.append({
                        "range": f"{resolved_col}{row_idx}",
                        "values": [[datetime.now(timezone.utc).isoformat()]]
                    })

                worksheet.batch_update(updates)
                return True

        return False


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
