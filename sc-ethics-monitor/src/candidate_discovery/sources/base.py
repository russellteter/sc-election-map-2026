"""
Base classes and dataclasses for candidate discovery sources.

Defines:
- DiscoveredCandidate: A candidate discovered from an external source
- MergedCandidate: A candidate merged from multiple sources
- ConflictRecord: Tracks conflicts between sources
- CandidateSource: Abstract base class for source adapters
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional


@dataclass
class DiscoveredCandidate:
    """
    A candidate discovered from an external source.

    Attributes:
        name: Full name of the candidate
        district_id: District identifier (e.g., "SC-House-042")
        party: Party affiliation code (D, R, I, O) or None
        party_confidence: Confidence level (HIGH, MEDIUM, LOW, UNKNOWN)
        source: Source identifier (e.g., "ballotpedia", "scdp")
        source_url: URL where the candidate was found
        filing_status: Filing status (certified, filed, declared, rumored)
        discovered_date: ISO timestamp when discovered
        incumbent: Whether candidate is the incumbent
        additional_data: Extra source-specific data
    """
    name: str
    district_id: str
    party: Optional[str] = None
    party_confidence: str = "UNKNOWN"
    source: str = ""
    source_url: str = ""
    filing_status: Optional[str] = None
    discovered_date: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    incumbent: bool = False
    additional_data: dict = field(default_factory=dict)

    def __post_init__(self):
        """Validate and normalize fields after initialization."""
        # Normalize party to uppercase single letter
        if self.party:
            self.party = self.party.upper()
            if self.party not in ("D", "R", "I", "O"):
                # Try to extract from full name
                party_lower = self.party.lower()
                if "democrat" in party_lower:
                    self.party = "D"
                elif "republican" in party_lower:
                    self.party = "R"
                elif "independent" in party_lower:
                    self.party = "I"
                else:
                    self.party = "O"

        # Normalize confidence
        valid_confidences = {"HIGH", "MEDIUM", "LOW", "UNKNOWN"}
        if self.party_confidence.upper() not in valid_confidences:
            self.party_confidence = "UNKNOWN"
        else:
            self.party_confidence = self.party_confidence.upper()


@dataclass
class MergedCandidate:
    """
    A candidate merged from multiple discovery sources.

    Extends DiscoveredCandidate with multi-source tracking.

    Attributes:
        name: Canonical name (from highest priority source)
        district_id: District identifier
        party: Best party determination
        party_confidence: Confidence level for party
        party_source: Source that provided the party
        sources: List of source identifiers
        source_urls: Dict mapping source to URL
        filing_status: Best filing status
        incumbent: Whether candidate is incumbent
        discovered_date: Earliest discovery date
        source_records: Original DiscoveredCandidate records
        primary_source: Highest priority source
    """
    name: str
    district_id: str
    party: Optional[str] = None
    party_confidence: str = "UNKNOWN"
    party_source: Optional[str] = None
    sources: list[str] = field(default_factory=list)
    source_urls: dict[str, str] = field(default_factory=dict)
    filing_status: Optional[str] = None
    incumbent: bool = False
    discovered_date: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    source_records: list[DiscoveredCandidate] = field(default_factory=list)
    primary_source: Optional[str] = None

    @property
    def has_multiple_sources(self) -> bool:
        """Check if candidate was found in multiple sources."""
        return len(self.sources) > 1

    @property
    def has_party(self) -> bool:
        """Check if party has been determined."""
        return self.party is not None and self.party_confidence != "UNKNOWN"


@dataclass
class ConflictRecord:
    """
    Records a conflict between sources for manual review.

    Attributes:
        candidate_name: Name of the candidate
        district_id: District identifier
        conflict_type: Type of conflict (party, name, filing_status)
        values: List of conflicting values
        resolution: The resolved value
        resolution_source: Source used for resolution
        requires_review: Whether manual review is needed
        notes: Additional notes about the conflict
    """
    candidate_name: str
    district_id: str
    conflict_type: str
    values: list = field(default_factory=list)
    resolution: Optional[str] = None
    resolution_source: Optional[str] = None
    requires_review: bool = False
    notes: str = ""

    def __str__(self) -> str:
        """Return human-readable conflict description."""
        return (
            f"Conflict ({self.conflict_type}): {self.candidate_name} "
            f"in {self.district_id} - values: {self.values}, "
            f"resolved to: {self.resolution}"
        )


class CandidateSource(ABC):
    """
    Abstract base class for candidate discovery sources.

    Each source adapter must implement:
    - source_name: Unique identifier for this source
    - source_priority: Priority for conflict resolution (1 = highest)
    - discover_candidates(): Discover all candidates from this source
    - extract_district_candidates(): Get candidates for a specific district
    """

    @property
    @abstractmethod
    def source_name(self) -> str:
        """
        Unique identifier for this source.

        Returns:
            Source name (e.g., "ballotpedia", "scdp", "scgop")
        """
        pass

    @property
    @abstractmethod
    def source_priority(self) -> int:
        """
        Priority for conflict resolution.

        Lower numbers = higher priority.
        1 = Ethics Commission (authoritative)
        2 = Ballotpedia (comprehensive)
        3 = Party websites (party-specific)
        4 = Election Commission (official)
        5 = Web search (discovery)

        Returns:
            Priority number (1-10)
        """
        pass

    @abstractmethod
    async def discover_candidates(
        self,
        chambers: list[str] = None,
    ) -> list[DiscoveredCandidate]:
        """
        Discover all candidates from this source.

        Args:
            chambers: List of chambers to search ("house", "senate").
                     Defaults to both if None.

        Returns:
            List of discovered candidates.
        """
        pass

    @abstractmethod
    def extract_district_candidates(
        self,
        district_id: str,
    ) -> list[DiscoveredCandidate]:
        """
        Get candidates for a specific district.

        Args:
            district_id: District identifier (e.g., "SC-House-042")

        Returns:
            List of candidates for that district.
        """
        pass

    def _parse_district_id(self, district_id: str) -> tuple[str, int]:
        """
        Parse district_id into chamber and number.

        Args:
            district_id: District identifier (e.g., "SC-House-042")

        Returns:
            Tuple of (chamber, district_number)

        Raises:
            ValueError: If district_id format is invalid
        """
        parts = district_id.split("-")
        if len(parts) != 3 or parts[0] != "SC":
            raise ValueError(f"Invalid district_id format: {district_id}")

        chamber = parts[1].lower()
        if chamber not in ("house", "senate"):
            raise ValueError(f"Invalid chamber in district_id: {district_id}")

        try:
            district_num = int(parts[2])
        except ValueError:
            raise ValueError(f"Invalid district number in district_id: {district_id}")

        return chamber, district_num
