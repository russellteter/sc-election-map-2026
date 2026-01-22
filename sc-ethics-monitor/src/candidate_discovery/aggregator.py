"""
Candidate Aggregator for multi-source discovery.

Aggregates candidates from multiple sources, handles deduplication,
and tracks conflicts between sources.

Components:
- AggregationResult: Final aggregation output with stats
- SourceResult: Per-source discovery result
- CandidateAggregator: Main aggregation orchestrator
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional

from .deduplicator import CandidateDeduplicator
from .sources.base import (
    CandidateSource,
    ConflictRecord,
    DiscoveredCandidate,
    MergedCandidate,
)

logger = logging.getLogger(__name__)


@dataclass
class SourceResult:
    """
    Result from a single source's discovery attempt.

    Attributes:
        source_name: Identifier of the source
        success: Whether discovery completed successfully
        candidates: List of discovered candidates
        error: Error message if discovery failed
        partial_coverage: True if source only returned partial data
        duration_seconds: Time taken for discovery
    """
    source_name: str
    success: bool
    candidates: list[DiscoveredCandidate] = field(default_factory=list)
    error: Optional[str] = None
    partial_coverage: bool = False
    duration_seconds: float = 0.0

    @property
    def candidate_count(self) -> int:
        """Return the number of candidates discovered."""
        return len(self.candidates)


@dataclass
class AggregationResult:
    """
    Final result of multi-source candidate aggregation.

    Attributes:
        candidates: Deduplicated merged candidates
        source_stats: Results from each source
        conflicts: Detected conflicts between sources
        total_raw: Total candidates before deduplication
        total_deduplicated: Total candidates after deduplication
        timestamp: When aggregation was performed
    """
    candidates: list[MergedCandidate]
    source_stats: dict[str, SourceResult]
    conflicts: list[ConflictRecord]
    total_raw: int
    total_deduplicated: int
    timestamp: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )

    @property
    def successful_sources(self) -> list[str]:
        """Return list of sources that succeeded."""
        return [
            name for name, result in self.source_stats.items()
            if result.success
        ]

    @property
    def failed_sources(self) -> list[str]:
        """Return list of sources that failed."""
        return [
            name for name, result in self.source_stats.items()
            if not result.success
        ]

    @property
    def deduplication_ratio(self) -> float:
        """Return ratio of raw to deduplicated (1.0 = no duplicates)."""
        if self.total_raw == 0:
            return 1.0
        return self.total_deduplicated / self.total_raw

    @property
    def conflict_count(self) -> int:
        """Return number of conflicts detected."""
        return len(self.conflicts)


class CandidateAggregator:
    """
    Aggregates candidates from multiple discovery sources.

    Orchestrates the discovery process:
    1. Collects candidates from each source (sorted by priority)
    2. Deduplicates using fuzzy name matching
    3. Detects and records conflicts
    4. Returns aggregated results with statistics

    Attributes:
        sources: List of CandidateSource instances
        deduplicator: CandidateDeduplicator instance
    """

    def __init__(
        self,
        sources: list[CandidateSource],
        similarity_threshold: float = None,
    ):
        """
        Initialize the aggregator with discovery sources.

        Args:
            sources: List of CandidateSource instances to aggregate from
            similarity_threshold: Override for name similarity threshold
        """
        # Sort sources by priority (lower = higher priority)
        self.sources = sorted(sources, key=lambda s: s.source_priority)
        self.deduplicator = CandidateDeduplicator(
            similarity_threshold=similarity_threshold
        )

        logger.info(
            f"Initialized CandidateAggregator with {len(sources)} sources: "
            f"{[s.source_name for s in self.sources]}"
        )

    async def aggregate_all(
        self,
        chambers: list[str] = None,
    ) -> AggregationResult:
        """
        Aggregate candidates from all sources.

        Iterates through all sources in priority order, collecting
        candidates and handling errors gracefully.

        Args:
            chambers: List of chambers to search ("house", "senate").
                     Defaults to both if None.

        Returns:
            AggregationResult with merged candidates and statistics
        """
        import time

        if chambers is None:
            chambers = ["house", "senate"]

        all_candidates: list[DiscoveredCandidate] = []
        source_stats: dict[str, SourceResult] = {}

        logger.info(
            f"Starting aggregation from {len(self.sources)} sources "
            f"for chambers: {chambers}"
        )

        # Collect from each source
        for source in self.sources:
            source_name = source.source_name
            start_time = time.time()

            logger.info(f"Discovering candidates from {source_name}...")

            try:
                candidates = await source.discover_candidates(chambers=chambers)
                duration = time.time() - start_time

                source_stats[source_name] = SourceResult(
                    source_name=source_name,
                    success=True,
                    candidates=candidates,
                    duration_seconds=duration,
                )

                all_candidates.extend(candidates)
                logger.info(
                    f"  {source_name}: {len(candidates)} candidates "
                    f"in {duration:.1f}s"
                )

            except Exception as e:
                duration = time.time() - start_time
                error_msg = str(e)

                source_stats[source_name] = SourceResult(
                    source_name=source_name,
                    success=False,
                    error=error_msg,
                    duration_seconds=duration,
                )

                logger.error(f"  {source_name}: FAILED - {error_msg}")

        # Deduplicate
        logger.info(
            f"Deduplicating {len(all_candidates)} candidates..."
        )
        merged = self.deduplicator.deduplicate(all_candidates)
        logger.info(f"  Deduplicated to {len(merged)} unique candidates")

        # Detect conflicts
        conflicts = self._find_conflicts(merged)
        if conflicts:
            logger.warning(
                f"  Found {len(conflicts)} conflicts requiring review"
            )

        return AggregationResult(
            candidates=merged,
            source_stats=source_stats,
            conflicts=conflicts,
            total_raw=len(all_candidates),
            total_deduplicated=len(merged),
        )

    def _find_conflicts(
        self,
        candidates: list[MergedCandidate],
    ) -> list[ConflictRecord]:
        """
        Find conflicts between sources for merged candidates.

        Currently detects:
        - Party conflicts: Different sources report different parties

        Args:
            candidates: List of merged candidates to check

        Returns:
            List of ConflictRecord objects
        """
        conflicts = []

        for candidate in candidates:
            # Skip candidates with only one source
            if not candidate.has_multiple_sources:
                continue

            # Check for party conflicts
            party_values = {}
            for record in candidate.source_records:
                if record.party:
                    if record.party not in party_values:
                        party_values[record.party] = []
                    party_values[record.party].append(record.source)

            # If we have multiple different party values, it's a conflict
            if len(party_values) > 1:
                # Build conflict record
                values_with_sources = [
                    f"{party} (from: {', '.join(sources)})"
                    for party, sources in party_values.items()
                ]

                # Determine if manual review is needed
                # If one source is much higher priority, auto-resolve
                # If same priority or close, flag for review
                requires_review = self._should_flag_for_review(
                    candidate.source_records
                )

                conflict = ConflictRecord(
                    candidate_name=candidate.name,
                    district_id=candidate.district_id,
                    conflict_type="party",
                    values=values_with_sources,
                    resolution=candidate.party,
                    resolution_source=candidate.party_source,
                    requires_review=requires_review,
                    notes=self._build_conflict_notes(candidate, party_values),
                )
                conflicts.append(conflict)
                logger.debug(f"Party conflict detected: {conflict}")

        return conflicts

    def _should_flag_for_review(
        self,
        records: list[DiscoveredCandidate],
    ) -> bool:
        """
        Determine if a conflict should be flagged for manual review.

        Flags for review when:
        - Both party sites (scdp, scgop) report the candidate
        - Sources have similar priority levels

        Args:
            records: Source records for the candidate

        Returns:
            True if manual review is recommended
        """
        sources = {r.source for r in records if r.party}

        # If both party sites claim the candidate, definitely review
        if "scdp" in sources and "scgop" in sources:
            return True

        # Get unique priorities for sources with party
        priorities = set()
        for r in records:
            if r.party:
                priority = self.deduplicator._get_source_priority(r.source)
                priorities.add(priority)

        # If priorities are within 1 of each other, flag for review
        if priorities:
            max_p = max(priorities)
            min_p = min(priorities)
            if max_p - min_p <= 1 and len(priorities) > 1:
                return True

        return False

    def _build_conflict_notes(
        self,
        candidate: MergedCandidate,
        party_values: dict[str, list[str]],
    ) -> str:
        """
        Build descriptive notes for a conflict record.

        Args:
            candidate: The merged candidate
            party_values: Dict mapping party to list of sources

        Returns:
            Human-readable conflict description
        """
        parts = []

        for party, sources in party_values.items():
            parts.append(f"{party}: {', '.join(sources)}")

        note = f"Party disagreement: {'; '.join(parts)}. "
        note += f"Resolved to {candidate.party} from {candidate.party_source}."

        if candidate.party_confidence != "HIGH":
            note += f" (confidence: {candidate.party_confidence})"

        return note

    async def aggregate_for_district(
        self,
        district_id: str,
    ) -> list[MergedCandidate]:
        """
        Aggregate candidates for a specific district.

        Convenience method for single-district lookups.

        Args:
            district_id: District identifier (e.g., "SC-House-042")

        Returns:
            List of merged candidates for that district
        """
        # Parse district to determine chamber
        parts = district_id.split("-")
        if len(parts) != 3:
            logger.error(f"Invalid district_id format: {district_id}")
            return []

        chamber = parts[1].lower()

        # Run full aggregation for just that chamber
        result = await self.aggregate_all(chambers=[chamber])

        # Filter to just the requested district
        return [
            c for c in result.candidates
            if c.district_id == district_id
        ]

    def get_source_summary(self) -> dict:
        """
        Get summary of configured sources.

        Returns:
            Dict with source information
        """
        return {
            "sources": [
                {
                    "name": s.source_name,
                    "priority": s.source_priority,
                }
                for s in self.sources
            ],
            "total_sources": len(self.sources),
        }
