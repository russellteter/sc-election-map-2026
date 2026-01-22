"""
Google Sheets integration for Candidate Discovery.

Integrates discovered candidates with the existing Google Sheets workflow:
- Matches discovered candidates to existing sheet records
- Adds new candidates as placeholder records
- Updates existing records with new source data
- Respects party_locked flags

This module extends the existing SheetsSync with discovery-specific logic.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional, Any

from .sources.base import MergedCandidate

logger = logging.getLogger(__name__)


@dataclass
class SyncResult:
    """
    Result of syncing discovered candidates to Google Sheets.

    Attributes:
        added: List of candidate names that were added
        updated: List of candidate names that were updated
        skipped: List of candidate names skipped (locked or unchanged)
        errors: List of error messages
        timestamp: When sync was performed
    """
    added: list[str] = field(default_factory=list)
    updated: list[str] = field(default_factory=list)
    skipped: list[str] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
    timestamp: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )

    @property
    def total_processed(self) -> int:
        """Return total candidates processed."""
        return len(self.added) + len(self.updated) + len(self.skipped)

    @property
    def success_rate(self) -> float:
        """Return success rate (added + updated / total)."""
        total = self.total_processed
        if total == 0:
            return 1.0
        return (len(self.added) + len(self.updated)) / total

    def __str__(self) -> str:
        """Return human-readable summary."""
        return (
            f"SyncResult: {len(self.added)} added, "
            f"{len(self.updated)} updated, "
            f"{len(self.skipped)} skipped, "
            f"{len(self.errors)} errors"
        )


class DiscoverySheetIntegration:
    """
    Integrates candidate discovery with Google Sheets.

    Uses the existing SheetsSync instance to:
    - Match discovered candidates to existing records
    - Add new candidates with discovery source info
    - Update existing records while respecting locks

    Attributes:
        sheets: SheetsSync instance for sheet operations
        similarity_threshold: Threshold for fuzzy name matching
    """

    # Default similarity threshold for name matching
    SIMILARITY_THRESHOLD = 0.85

    def __init__(
        self,
        sheets_sync: Any,  # SheetsSync type, using Any to avoid import issues
        similarity_threshold: float = None,
    ):
        """
        Initialize the integration.

        Args:
            sheets_sync: Existing SheetsSync instance (must be connected)
            similarity_threshold: Override for name similarity threshold
        """
        self.sheets = sheets_sync
        self.similarity_threshold = (
            similarity_threshold
            if similarity_threshold is not None
            else self.SIMILARITY_THRESHOLD
        )

    def _build_name_index(
        self,
        sheet_state: dict,
    ) -> dict[str, list[str]]:
        """
        Build an index of normalized names to report IDs.

        This enables fast fuzzy matching of discovered candidates
        to existing sheet records.

        Args:
            sheet_state: Current sheet state from read_sheet_state()

        Returns:
            Dict mapping normalized names to list of report_ids
        """
        # We need candidate names, but sheet_state only has report_ids
        # We'll get full candidate data from the sheet
        all_candidates = self.sheets.get_all_candidates()

        name_index: dict[str, list[str]] = {}

        for candidate in all_candidates:
            report_id = candidate.get("report_id", "")
            name = candidate.get("candidate_name", "")
            district_id = candidate.get("district_id", "")

            if not report_id or not name:
                continue

            # Create composite key: normalized_name|district_id
            normalized = self._normalize_name(name)
            key = f"{normalized}|{district_id}"

            if key not in name_index:
                name_index[key] = []
            name_index[key].append(report_id)

        logger.debug(f"Built name index with {len(name_index)} entries")
        return name_index

    def _normalize_name(self, name: str) -> str:
        """
        Normalize a name for comparison.

        Applies the same normalizations as CandidateDeduplicator:
        - Lowercase
        - Remove suffixes (Jr., Sr., III, etc.)
        - Remove middle initials
        - Remove punctuation
        - Collapse whitespace

        Args:
            name: Original name

        Returns:
            Normalized name
        """
        if not name:
            return ""

        # Lowercase
        name = name.lower()

        # Remove common suffixes
        suffixes = [
            " jr.", " jr", " sr.", " sr",
            " iii", " ii", " iv", " v",
            " 3rd", " 2nd", " 4th",
        ]
        for suffix in suffixes:
            if name.endswith(suffix):
                name = name[:-len(suffix)]

        # Handle comma-separated suffixes
        name = re.sub(r',\s*(jr\.?|sr\.?|iii?|iv|v|2nd|3rd|4th)\s*$', '', name)

        # Remove middle initials
        name = re.sub(r'\b[a-z]\.\s*', '', name)
        name = re.sub(r'\s+[a-z]\s+', ' ', name)

        # Remove punctuation
        name = re.sub(r'[.,\'-]', '', name)

        # Collapse whitespace
        name = ' '.join(name.split())

        return name.strip()

    def _calculate_similarity(self, s1: str, s2: str) -> float:
        """
        Calculate string similarity using longest common subsequence.

        Args:
            s1: First string (normalized)
            s2: Second string (normalized)

        Returns:
            Similarity score between 0 and 1
        """
        if not s1 or not s2:
            return 0.0

        if s1 == s2:
            return 1.0

        m, n = len(s1), len(s2)

        # DP table for LCS
        dp = [[0] * (n + 1) for _ in range(m + 1)]

        for i in range(1, m + 1):
            for j in range(1, n + 1):
                if s1[i - 1] == s2[j - 1]:
                    dp[i][j] = dp[i - 1][j - 1] + 1
                else:
                    dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])

        lcs_length = dp[m][n]

        # LCS ratio
        return (2 * lcs_length) / (m + n)

    def _names_fuzzy_match(self, name1: str, name2: str) -> bool:
        """
        Check if two names likely refer to the same person.

        Uses normalization and similarity calculation.

        Args:
            name1: First name
            name2: Second name

        Returns:
            True if names match within threshold
        """
        n1 = self._normalize_name(name1)
        n2 = self._normalize_name(name2)

        # Exact match after normalization
        if n1 == n2:
            return True

        # Empty name check
        if not n1 or not n2:
            return False

        # Fuzzy match
        similarity = self._calculate_similarity(n1, n2)
        return similarity >= self.similarity_threshold

    def _find_existing(
        self,
        candidate: MergedCandidate,
        sheet_state: dict,
        name_index: dict[str, list[str]],
    ) -> Optional[str]:
        """
        Find existing sheet record matching a discovered candidate.

        Matching strategy:
        1. Exact match on normalized name + district_id
        2. Fuzzy match on name within same district

        Args:
            candidate: Discovered candidate to match
            sheet_state: Current sheet state
            name_index: Pre-built name index

        Returns:
            report_id if match found, None otherwise
        """
        # Try exact match first
        normalized = self._normalize_name(candidate.name)
        exact_key = f"{normalized}|{candidate.district_id}"

        if exact_key in name_index:
            report_ids = name_index[exact_key]
            if report_ids:
                logger.debug(
                    f"Exact match for {candidate.name}: {report_ids[0]}"
                )
                return report_ids[0]

        # Try fuzzy match within same district
        all_candidates = self.sheets.get_all_candidates()
        district_candidates = [
            c for c in all_candidates
            if c.get("district_id") == candidate.district_id
        ]

        for existing in district_candidates:
            existing_name = existing.get("candidate_name", "")
            if self._names_fuzzy_match(candidate.name, existing_name):
                report_id = existing.get("report_id", "")
                logger.debug(
                    f"Fuzzy match for {candidate.name} -> "
                    f"{existing_name}: {report_id}"
                )
                return report_id

        return None

    def sync_discovered_candidates(
        self,
        candidates: list[MergedCandidate],
    ) -> SyncResult:
        """
        Sync discovered candidates to Google Sheets.

        For each candidate:
        1. Check if already exists in sheet (by name + district)
        2. If exists and not locked: update with new source data
        3. If new: add as placeholder record
        4. If locked: skip

        Args:
            candidates: List of MergedCandidate objects to sync

        Returns:
            SyncResult with added, updated, and skipped lists
        """
        result = SyncResult()

        if not candidates:
            logger.info("No candidates to sync")
            return result

        logger.info(f"Syncing {len(candidates)} discovered candidates to sheet")

        # Read current sheet state
        sheet_state = self.sheets.read_sheet_state()
        name_index = self._build_name_index(sheet_state)

        for candidate in candidates:
            try:
                # Find existing record
                existing_id = self._find_existing(
                    candidate, sheet_state, name_index
                )

                if existing_id:
                    # Check if locked
                    existing = sheet_state.get(existing_id, {})
                    if existing.get("party_locked"):
                        logger.debug(
                            f"Skipping locked candidate: {candidate.name}"
                        )
                        result.skipped.append(candidate.name)
                        continue

                    # Update existing record with new source info
                    self._update_existing_candidate(
                        existing_id, candidate, existing
                    )
                    result.updated.append(candidate.name)
                    logger.debug(f"Updated: {candidate.name}")

                else:
                    # Add new candidate
                    self._add_new_candidate(candidate)
                    result.added.append(candidate.name)
                    logger.debug(f"Added: {candidate.name}")

            except Exception as e:
                error_msg = f"Error syncing {candidate.name}: {e}"
                logger.error(error_msg)
                result.errors.append(error_msg)

        logger.info(str(result))
        return result

    def _update_existing_candidate(
        self,
        report_id: str,
        candidate: MergedCandidate,
        existing: dict,
    ) -> None:
        """
        Update an existing sheet record with discovered data.

        Only updates detection fields if:
        - Existing has no party OR
        - Discovered party has higher confidence

        Args:
            report_id: Existing record's report_id
            candidate: Discovered candidate with new data
            existing: Existing record data from sheet_state
        """
        # Determine if we should update party detection
        existing_party = existing.get("detected_party")
        existing_confidence = existing.get("detection_confidence", "UNKNOWN")

        should_update_party = False

        if not existing_party:
            # No existing party - update if we have one
            should_update_party = candidate.party is not None
        elif candidate.party:
            # Both have party - check confidence
            confidence_order = {"HIGH": 3, "MEDIUM": 2, "LOW": 1, "UNKNOWN": 0}
            existing_score = confidence_order.get(existing_confidence, 0)
            new_score = confidence_order.get(candidate.party_confidence, 0)
            should_update_party = new_score > existing_score

        # Build update dict
        update_kwargs = {
            "report_id": report_id,
            "candidate_name": candidate.name,
            "district_id": candidate.district_id,
            "filed_date": "",  # Don't overwrite filing date from ethics
            "ethics_report_url": "",  # Don't overwrite ethics URL
            "is_incumbent": candidate.incumbent,
        }

        if should_update_party:
            update_kwargs.update({
                "detected_party": candidate.party,
                "detection_confidence": candidate.party_confidence,
                "detection_source": candidate.party_source,
                "detection_evidence_url": (
                    candidate.source_urls.get(candidate.party_source, "")
                    if candidate.party_source else ""
                ),
            })

        # Call sheets add_candidate (handles update logic)
        self.sheets.add_candidate(**update_kwargs)

    def _add_new_candidate(
        self,
        candidate: MergedCandidate,
    ) -> None:
        """
        Add a new discovered candidate as a placeholder record.

        Creates a minimal record that can be enriched later
        when the candidate files with Ethics Commission.

        Args:
            candidate: Discovered candidate to add
        """
        # Generate a temporary report_id for discovered candidates
        # Format: DISC-{source}-{district}-{timestamp}
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
        temp_id = f"DISC-{candidate.primary_source or 'unknown'}-{candidate.district_id}-{timestamp}"

        # Get evidence URL from primary source
        evidence_url = ""
        if candidate.primary_source:
            evidence_url = candidate.source_urls.get(candidate.primary_source, "")

        self.sheets.add_candidate(
            report_id=temp_id,
            candidate_name=candidate.name,
            district_id=candidate.district_id,
            filed_date="",  # Unknown - not from ethics
            ethics_report_url="",  # Not from ethics
            is_incumbent=candidate.incumbent,
            detected_party=candidate.party,
            detection_confidence=candidate.party_confidence,
            detection_source=candidate.party_source,
            detection_evidence_url=evidence_url,
        )

    def get_unmatched_candidates(
        self,
        candidates: list[MergedCandidate],
    ) -> list[MergedCandidate]:
        """
        Find discovered candidates not in the sheet.

        Useful for identifying candidates to add or
        investigating data quality issues.

        Args:
            candidates: List of discovered candidates

        Returns:
            List of candidates not found in sheet
        """
        sheet_state = self.sheets.read_sheet_state()
        name_index = self._build_name_index(sheet_state)

        unmatched = []
        for candidate in candidates:
            existing_id = self._find_existing(
                candidate, sheet_state, name_index
            )
            if not existing_id:
                unmatched.append(candidate)

        return unmatched

    def get_candidates_needing_party(self) -> list[dict]:
        """
        Find sheet candidates without party that discovery might help.

        Returns:
            List of candidate dicts needing party information
        """
        all_candidates = self.sheets.get_all_candidates()

        return [
            c for c in all_candidates
            if not c.get("final_party")
            and c.get("party_locked") != "Yes"
        ]
