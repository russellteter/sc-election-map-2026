"""
Ballotpedia source adapter for candidate discovery.

Scrapes candidate information from Ballotpedia district pages
for South Carolina House and Senate races.

URL Patterns:
- House: https://ballotpedia.org/South_Carolina_House_of_Representatives_District_{N}
- Senate: https://ballotpedia.org/South_Carolina_State_Senate_District_{N}

District counts:
- SC House: 124 districts
- SC Senate: 46 districts
"""

import logging
import re
from datetime import datetime, timezone
from typing import Optional

import requests
from tenacity import retry, stop_after_attempt, wait_exponential

from ..rate_limiter import RateLimiter
from .base import CandidateSource, DiscoveredCandidate

# Import config - handle both direct import and package import
try:
    from config import (
        FIRECRAWL_API_KEY,
        FIRECRAWL_RPM,
        SC_HOUSE_DISTRICTS,
        SC_SENATE_DISTRICTS,
    )
except ImportError:
    # Fallback for when running from different contexts
    import os
    FIRECRAWL_API_KEY = os.environ.get("FIRECRAWL_API_KEY")
    FIRECRAWL_RPM = int(os.environ.get("FIRECRAWL_RPM", "30"))
    SC_HOUSE_DISTRICTS = 124
    SC_SENATE_DISTRICTS = 46

logger = logging.getLogger(__name__)


class BallotpediaSource(CandidateSource):
    """
    Candidate source adapter for Ballotpedia.

    Scrapes district pages to discover candidates running in
    the 2026 South Carolina state legislative elections.

    Attributes:
        source_name: "ballotpedia"
        source_priority: 2 (comprehensive but not authoritative)
    """

    # Base URL templates for district pages
    URL_TEMPLATES = {
        "house": "https://ballotpedia.org/South_Carolina_House_of_Representatives_District_{n}",
        "senate": "https://ballotpedia.org/South_Carolina_State_Senate_District_{n}",
    }

    # District counts by chamber
    DISTRICT_COUNTS = {
        "house": SC_HOUSE_DISTRICTS,  # 124
        "senate": SC_SENATE_DISTRICTS,  # 46
    }

    # Regex patterns for parsing candidates
    # Pattern: **Name** (Party)
    CANDIDATE_PATTERN = re.compile(
        r"\*\*([^*]+)\*\*\s*\(([^)]+)\)",
        re.MULTILINE
    )

    # Pattern to detect 2026 election section
    ELECTION_2026_PATTERN = re.compile(
        r"(?:2026|General\s+election)",
        re.IGNORECASE
    )

    # Pattern to detect incumbent status
    INCUMBENT_PATTERN = re.compile(
        r"\bincumbent\b",
        re.IGNORECASE
    )

    # Party normalization mapping
    PARTY_MAP = {
        "democratic": "D",
        "democrat": "D",
        "republican": "R",
        "gop": "R",
        "independent": "I",
        "libertarian": "O",
        "green": "O",
        "constitution": "O",
        "nonpartisan": "O",
    }

    @property
    def source_name(self) -> str:
        """Return the source identifier."""
        return "ballotpedia"

    @property
    def source_priority(self) -> int:
        """Return the source priority (2 = comprehensive)."""
        return 2

    def __init__(
        self,
        firecrawl_api_key: Optional[str] = None,
        rate_limit: Optional[int] = None,
    ):
        """
        Initialize the Ballotpedia source.

        Args:
            firecrawl_api_key: Firecrawl API key (defaults to env var)
            rate_limit: Requests per minute (defaults to FIRECRAWL_RPM)
        """
        self.api_key = firecrawl_api_key or FIRECRAWL_API_KEY
        if not self.api_key:
            logger.warning(
                "No Firecrawl API key provided. "
                "Set FIRECRAWL_API_KEY environment variable."
            )

        rpm = rate_limit or FIRECRAWL_RPM
        self.rate_limiter = RateLimiter(requests_per_minute=rpm)

        # Cache for scraped pages (district_id -> markdown)
        self._page_cache: dict[str, str] = {}

        # Cache for discovered candidates
        self._candidates_cache: dict[str, list[DiscoveredCandidate]] = {}

    def _build_url(self, chamber: str, district_num: int) -> str:
        """
        Build Ballotpedia URL for a district.

        Args:
            chamber: "house" or "senate"
            district_num: District number

        Returns:
            Full Ballotpedia URL for the district

        Raises:
            ValueError: If chamber is invalid
        """
        chamber = chamber.lower()
        if chamber not in self.URL_TEMPLATES:
            raise ValueError(f"Invalid chamber: {chamber}. Must be 'house' or 'senate'")

        return self.URL_TEMPLATES[chamber].format(n=district_num)

    def _district_id_from_parts(self, chamber: str, district_num: int) -> str:
        """
        Create district_id from chamber and number.

        Args:
            chamber: "house" or "senate"
            district_num: District number

        Returns:
            District ID (e.g., "SC-House-042")
        """
        chamber_title = chamber.title()  # "house" -> "House"
        return f"SC-{chamber_title}-{district_num:03d}"

    def _normalize_party(self, party_text: str) -> Optional[str]:
        """
        Normalize party text to single-letter code.

        Args:
            party_text: Party text (e.g., "Democratic", "Republican")

        Returns:
            Normalized party code (D, R, I, O) or None if unknown
        """
        if not party_text:
            return None

        # Clean and lowercase
        party_clean = party_text.strip().lower()

        # Check direct mapping
        for key, code in self.PARTY_MAP.items():
            if key in party_clean:
                return code

        # Unknown party
        logger.debug(f"Unknown party text: {party_text}")
        return None

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True,
    )
    async def _scrape_district_page(
        self,
        url: str,
        district_id: str,
    ) -> Optional[str]:
        """
        Scrape a Ballotpedia district page using Firecrawl.

        Args:
            url: Full Ballotpedia URL
            district_id: District identifier for logging

        Returns:
            Markdown content of the page, or None on error
        """
        if not self.api_key:
            logger.error("Cannot scrape: No Firecrawl API key configured")
            return None

        # Check cache first
        if district_id in self._page_cache:
            logger.debug(f"Using cached page for {district_id}")
            return self._page_cache[district_id]

        # Respect rate limit
        await self.rate_limiter.wait()

        try:
            # Firecrawl API endpoint
            api_url = "https://api.firecrawl.dev/v1/scrape"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            }
            payload = {
                "url": url,
                "formats": ["markdown"],
                "onlyMainContent": True,
            }

            logger.debug(f"Scraping {url} for {district_id}")
            response = requests.post(api_url, headers=headers, json=payload, timeout=30)

            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("data", {}).get("markdown"):
                    markdown = data["data"]["markdown"]
                    self._page_cache[district_id] = markdown
                    logger.info(f"Successfully scraped {district_id}")
                    return markdown
                else:
                    logger.warning(f"No markdown in response for {district_id}")
                    return None
            elif response.status_code == 429:
                logger.warning(f"Rate limited while scraping {district_id}")
                raise Exception("Rate limited - will retry")
            else:
                logger.error(
                    f"Failed to scrape {district_id}: "
                    f"HTTP {response.status_code} - {response.text[:200]}"
                )
                return None

        except requests.RequestException as e:
            logger.error(f"Request error scraping {district_id}: {e}")
            raise

    def _extract_election_section(self, markdown: str) -> tuple[str, bool]:
        """
        Extract the 2026 election section from the markdown.

        Args:
            markdown: Full page markdown

        Returns:
            Tuple of (section_text, has_2026_section)
        """
        # Try to find 2026 election section
        section_pattern = re.compile(
            r"##\s*2026\s+election.*?(?=##\s*(?:Previous|20(?:2[0-4]|1\d))|$)",
            re.IGNORECASE | re.DOTALL
        )
        match = section_pattern.search(markdown)
        if match:
            return match.group(0), True

        # Alternative: Look for "General election" with 2026
        alt_pattern = re.compile(
            r"###?\s*(?:General\s+election|Candidates).*?(?=###?\s*(?:Primary|Previous)|$)",
            re.IGNORECASE | re.DOTALL
        )
        match = alt_pattern.search(markdown)
        if match and "2026" in markdown[:match.end()]:
            return match.group(0), True

        # No 2026 section found
        return "", False

    def _parse_candidates(
        self,
        markdown: str,
        district_id: str,
        source_url: str,
    ) -> list[DiscoveredCandidate]:
        """
        Parse candidates from Ballotpedia page markdown.

        Looks for the 2026 election section and extracts candidates
        using the pattern: **Name** (Party)

        Args:
            markdown: Page content in markdown format
            district_id: District identifier
            source_url: URL of the source page

        Returns:
            List of discovered candidates
        """
        candidates = []
        seen_names = set()  # Deduplicate within same parsing

        if not markdown:
            logger.debug(f"No markdown content for {district_id}")
            return candidates

        # Extract 2026 election section
        election_section, has_2026_election = self._extract_election_section(markdown)
        if not has_2026_election:
            logger.debug(f"No 2026 election section found for {district_id}")
            # Fall back to full page but filter more aggressively
            election_section = markdown

        # Find all candidate matches within the election section
        matches = self.CANDIDATE_PATTERN.findall(election_section)

        for name, party_text in matches:
            # Clean up name
            name = name.strip()
            if not name or len(name) < 2:
                continue

            # Skip obvious non-candidate entries
            if any(skip in name.lower() for skip in [
                "district", "election", "general", "primary",
                "state", "house", "senate", "candidates"
            ]):
                continue

            # Skip duplicates (same name may appear multiple times)
            name_key = name.lower()
            if name_key in seen_names:
                continue
            seen_names.add(name_key)

            # Normalize party
            party = self._normalize_party(party_text)
            party_confidence = "HIGH" if party else "UNKNOWN"

            # Check for incumbent status - look only in the same line/paragraph
            # Find the specific occurrence in the election section
            name_pattern = re.compile(
                rf"\*\*{re.escape(name)}\*\*[^#\n]*",
                re.IGNORECASE
            )
            name_match = name_pattern.search(election_section)
            is_incumbent = False
            if name_match:
                context = name_match.group(0).lower()
                is_incumbent = "incumbent" in context

            candidate = DiscoveredCandidate(
                name=name,
                district_id=district_id,
                party=party,
                party_confidence=party_confidence,
                source=self.source_name,
                source_url=source_url,
                filing_status="declared",  # Ballotpedia typically lists declared candidates
                incumbent=is_incumbent,
                additional_data={
                    "raw_party_text": party_text.strip(),
                    "has_2026_section": has_2026_election,
                },
            )
            candidates.append(candidate)
            logger.debug(f"Found candidate: {name} ({party}) in {district_id}")

        logger.info(f"Parsed {len(candidates)} candidates from {district_id}")
        return candidates

    async def discover_candidates(
        self,
        chambers: list[str] = None,
    ) -> list[DiscoveredCandidate]:
        """
        Discover all candidates from Ballotpedia.

        Iterates through all SC House (124) and Senate (46) districts,
        scraping each page and parsing candidates.

        Args:
            chambers: List of chambers to search ("house", "senate").
                     Defaults to both if None.

        Returns:
            List of all discovered candidates
        """
        if chambers is None:
            chambers = ["house", "senate"]

        all_candidates = []

        for chamber in chambers:
            chamber = chamber.lower()
            if chamber not in self.DISTRICT_COUNTS:
                logger.warning(f"Skipping invalid chamber: {chamber}")
                continue

            district_count = self.DISTRICT_COUNTS[chamber]
            logger.info(
                f"Discovering candidates for {chamber} "
                f"({district_count} districts)"
            )

            for district_num in range(1, district_count + 1):
                district_id = self._district_id_from_parts(chamber, district_num)
                url = self._build_url(chamber, district_num)

                try:
                    markdown = await self._scrape_district_page(url, district_id)
                    if markdown:
                        candidates = self._parse_candidates(
                            markdown, district_id, url
                        )
                        all_candidates.extend(candidates)
                        self._candidates_cache[district_id] = candidates
                except Exception as e:
                    logger.error(f"Error processing {district_id}: {e}")
                    continue

        logger.info(f"Total candidates discovered: {len(all_candidates)}")
        return all_candidates

    def extract_district_candidates(
        self,
        district_id: str,
    ) -> list[DiscoveredCandidate]:
        """
        Get candidates for a specific district.

        Uses cached data if available, otherwise returns empty list.
        For live scraping of a single district, use _scrape_district_page
        and _parse_candidates directly.

        Args:
            district_id: District identifier (e.g., "SC-House-042")

        Returns:
            List of candidates for that district
        """
        # Check cache first
        if district_id in self._candidates_cache:
            return self._candidates_cache[district_id]

        # Parse district ID to build URL
        try:
            chamber, district_num = self._parse_district_id(district_id)
        except ValueError as e:
            logger.error(f"Invalid district_id: {e}")
            return []

        # Check if we have cached markdown
        if district_id in self._page_cache:
            url = self._build_url(chamber, district_num)
            candidates = self._parse_candidates(
                self._page_cache[district_id],
                district_id,
                url,
            )
            self._candidates_cache[district_id] = candidates
            return candidates

        # No cached data available
        logger.warning(
            f"No cached data for {district_id}. "
            "Call discover_candidates() first or use async scraping."
        )
        return []

    async def extract_district_candidates_async(
        self,
        district_id: str,
    ) -> list[DiscoveredCandidate]:
        """
        Get candidates for a specific district with async scraping.

        Scrapes the district page if not cached.

        Args:
            district_id: District identifier (e.g., "SC-House-042")

        Returns:
            List of candidates for that district
        """
        # Check cache first
        if district_id in self._candidates_cache:
            return self._candidates_cache[district_id]

        # Parse district ID
        try:
            chamber, district_num = self._parse_district_id(district_id)
        except ValueError as e:
            logger.error(f"Invalid district_id: {e}")
            return []

        # Build URL and scrape
        url = self._build_url(chamber, district_num)

        try:
            markdown = await self._scrape_district_page(url, district_id)
            if markdown:
                candidates = self._parse_candidates(markdown, district_id, url)
                self._candidates_cache[district_id] = candidates
                return candidates
        except Exception as e:
            logger.error(f"Error extracting candidates for {district_id}: {e}")

        return []

    def clear_cache(self) -> None:
        """Clear all cached data."""
        self._page_cache.clear()
        self._candidates_cache.clear()
        logger.info("Cleared Ballotpedia source caches")

    def get_cache_stats(self) -> dict:
        """
        Get cache statistics.

        Returns:
            Dict with cache statistics
        """
        return {
            "pages_cached": len(self._page_cache),
            "districts_cached": len(self._candidates_cache),
            "total_candidates_cached": sum(
                len(c) for c in self._candidates_cache.values()
            ),
        }
