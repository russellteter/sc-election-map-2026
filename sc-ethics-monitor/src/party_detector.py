"""
Party detection module using Firecrawl web search.

Detects candidate party affiliation by searching Google for party-related keywords
and analyzing the results.
"""

import re
from dataclasses import dataclass
from typing import Optional

from .config import FIRECRAWL_API_KEY


@dataclass
class PartyDetectionResult:
    """Result of party detection attempt."""
    detected_party: Optional[str]  # "D", "R", "I", or None
    confidence: str  # "HIGH", "MEDIUM", "LOW", "UNKNOWN"
    evidence_url: Optional[str]  # URL that provided the detection
    source: str  # Description of how party was detected
    dem_mentions: int = 0
    rep_mentions: int = 0


class PartyDetector:
    """
    Detects candidate party affiliation using web search.

    Uses a simple Google search strategy:
    1. Search for candidate name + "South Carolina" + party keywords
    2. Count mentions of Democrat/Republican in top results
    3. Determine party based on which has more mentions
    """

    # Keywords indicating Democratic affiliation
    DEM_KEYWORDS = [
        "democrat",
        "democratic",
        "democratic party",
        "scdp",
        "sc democratic party",
        "(d)",
        " d-",
        "-d ",
    ]

    # Keywords indicating Republican affiliation
    REP_KEYWORDS = [
        "republican",
        "gop",
        "republican party",
        "scgop",
        "sc republican party",
        "(r)",
        " r-",
        "-r ",
    ]

    def __init__(self, firecrawl_api_key: str = None):
        """
        Initialize PartyDetector.

        Args:
            firecrawl_api_key: API key for Firecrawl. Uses env var if not provided.
        """
        self.api_key = firecrawl_api_key or FIRECRAWL_API_KEY
        self._client = None

    @property
    def client(self):
        """Lazy-load Firecrawl client."""
        if self._client is None:
            if not self.api_key:
                raise ValueError("FIRECRAWL_API_KEY is required for party detection")
            from firecrawl import FirecrawlApp
            self._client = FirecrawlApp(api_key=self.api_key)
        return self._client

    def detect_party(
        self,
        candidate_name: str,
        district_id: str = None,
    ) -> PartyDetectionResult:
        """
        Detect party affiliation for a candidate.

        Args:
            candidate_name: Full name of the candidate.
            district_id: Optional district ID for context (e.g., "SC-House-042").

        Returns:
            PartyDetectionResult with detected party, confidence, and evidence.
        """
        if not self.api_key:
            return PartyDetectionResult(
                detected_party=None,
                confidence="UNKNOWN",
                evidence_url=None,
                source="no_api_key",
            )

        try:
            # Build search query
            query = self._build_search_query(candidate_name, district_id)

            # Execute search
            search_results = self._execute_search(query)

            if not search_results:
                return PartyDetectionResult(
                    detected_party=None,
                    confidence="UNKNOWN",
                    evidence_url=None,
                    source="no_search_results",
                )

            # Analyze results for party mentions
            return self._analyze_results(search_results, candidate_name)

        except Exception as e:
            return PartyDetectionResult(
                detected_party=None,
                confidence="UNKNOWN",
                evidence_url=None,
                source=f"error: {str(e)}",
            )

    def _build_search_query(
        self,
        candidate_name: str,
        district_id: str = None,
    ) -> str:
        """Build optimized search query for party detection."""
        # Core query: candidate name + location + party keywords
        query = f'"{candidate_name}" "South Carolina" (Democrat OR Republican OR Democratic OR GOP)'

        # Add district context if available
        if district_id:
            # Extract chamber from district_id (e.g., "SC-House-042" -> "House")
            parts = district_id.split("-")
            if len(parts) >= 2:
                chamber = parts[1].lower()
                query = f'"{candidate_name}" "South Carolina" {chamber} (Democrat OR Republican OR Democratic OR GOP)'

        return query

    def _execute_search(self, query: str) -> list[dict]:
        """Execute search via Firecrawl."""
        try:
            results = self.client.search(
                query=query,
                limit=5,  # Top 5 results should be enough
            )

            # Firecrawl returns list of result dicts
            if isinstance(results, dict) and "data" in results:
                return results["data"]
            elif isinstance(results, list):
                return results
            else:
                return []

        except Exception as e:
            print(f"Search error: {e}")
            return []

    def _analyze_results(
        self,
        results: list[dict],
        candidate_name: str,
    ) -> PartyDetectionResult:
        """
        Analyze search results for party mentions.

        Counts mentions of Democrat/Republican keywords and determines
        party based on which has more mentions.
        """
        dem_count = 0
        rep_count = 0
        evidence_url = None
        detected_party_url = None  # URL of first result with detected party

        for result in results:
            # Get text content to analyze
            title = result.get("title", "").lower()
            description = result.get("description", "").lower()
            url = result.get("url", "")
            markdown = result.get("markdown", "").lower()

            # Combine all text for analysis
            text = f"{title} {description} {markdown}"

            # Check if this result is about our candidate
            name_parts = candidate_name.lower().split()
            if not any(part in text for part in name_parts if len(part) > 2):
                continue  # Skip results not about our candidate

            # Count party mentions
            result_dem_count = self._count_party_mentions(text, self.DEM_KEYWORDS)
            result_rep_count = self._count_party_mentions(text, self.REP_KEYWORDS)

            dem_count += result_dem_count
            rep_count += result_rep_count

            # Track first URL with party mention as evidence
            if result_dem_count > 0 and detected_party_url is None:
                detected_party_url = url
            if result_rep_count > 0 and detected_party_url is None:
                detected_party_url = url

        # Determine party and confidence
        return self._determine_party(
            dem_count=dem_count,
            rep_count=rep_count,
            evidence_url=detected_party_url,
        )

    def _count_party_mentions(self, text: str, keywords: list[str]) -> int:
        """Count mentions of party keywords in text."""
        count = 0
        for keyword in keywords:
            # Use word boundary matching for short keywords
            if len(keyword) <= 3:
                pattern = r'\b' + re.escape(keyword) + r'\b'
                count += len(re.findall(pattern, text, re.IGNORECASE))
            else:
                count += text.count(keyword.lower())
        return count

    def _determine_party(
        self,
        dem_count: int,
        rep_count: int,
        evidence_url: str = None,
    ) -> PartyDetectionResult:
        """Determine party based on mention counts."""
        # No mentions of either party
        if dem_count == 0 and rep_count == 0:
            return PartyDetectionResult(
                detected_party=None,
                confidence="UNKNOWN",
                evidence_url=None,
                source="no_party_mentions",
                dem_mentions=dem_count,
                rep_mentions=rep_count,
            )

        # Calculate difference
        diff = abs(dem_count - rep_count)

        # Determine winner
        if dem_count > rep_count:
            detected_party = "D"
        elif rep_count > dem_count:
            detected_party = "R"
        else:
            # Tie - can't determine
            return PartyDetectionResult(
                detected_party=None,
                confidence="LOW",
                evidence_url=evidence_url,
                source="tie_in_mentions",
                dem_mentions=dem_count,
                rep_mentions=rep_count,
            )

        # Determine confidence based on margin
        if diff >= 3:
            confidence = "HIGH"
        elif diff >= 2:
            confidence = "MEDIUM"
        else:
            confidence = "LOW"

        return PartyDetectionResult(
            detected_party=detected_party,
            confidence=confidence,
            evidence_url=evidence_url,
            source="web_search",
            dem_mentions=dem_count,
            rep_mentions=rep_count,
        )


def detect_candidate_party(
    candidate_name: str,
    district_id: str = None,
    api_key: str = None,
) -> PartyDetectionResult:
    """
    Convenience function for party detection.

    Args:
        candidate_name: Full name of the candidate.
        district_id: Optional district ID for context.
        api_key: Optional Firecrawl API key.

    Returns:
        PartyDetectionResult with detection details.
    """
    detector = PartyDetector(firecrawl_api_key=api_key)
    return detector.detect_party(candidate_name, district_id)
