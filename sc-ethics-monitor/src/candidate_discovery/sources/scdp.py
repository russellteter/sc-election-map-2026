"""
South Carolina Democratic Party (SCDP) source adapter for candidate discovery.

Scrapes candidate information from the SCDP website.
All candidates from this source are Democrats (party="D").

URL Patterns:
- Elected Officials: https://scdp.org/our-party/elected-officials/
- Candidate Resources: https://scdp.org/candidate-resources-toolkit/

Note: The SCDP website does not currently have a dedicated 2026 candidates page.
This source primarily tracks current elected officials (incumbents) and
endorsed candidates when announced.
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
    import os
    FIRECRAWL_API_KEY = os.environ.get("FIRECRAWL_API_KEY")
    FIRECRAWL_RPM = int(os.environ.get("FIRECRAWL_RPM", "30"))
    SC_HOUSE_DISTRICTS = 124
    SC_SENATE_DISTRICTS = 46

logger = logging.getLogger(__name__)


class SCDPSource(CandidateSource):
    """
    Candidate source adapter for South Carolina Democratic Party (SCDP).

    Scrapes the SCDP website to discover Democratic candidates and
    current Democratic officeholders (incumbents).

    All candidates from this source have:
    - party = "D" (Democrat)
    - party_confidence = "HIGH" (authoritative party source)

    Attributes:
        source_name: "scdp"
        source_priority: 3 (party-specific)
    """

    # Base URLs for SCDP pages
    BASE_URL = "https://scdp.org"
    ELECTED_OFFICIALS_URL = "https://scdp.org/our-party/elected-officials/"
    CANDIDATES_URL = "https://scdp.org/candidates/"  # May not exist yet for 2026
    ENDORSED_URL = "https://scdp.org/endorsed-candidates/"  # May not exist yet

    # Potential candidate page URLs (checked in order)
    CANDIDATE_URLS = [
        "https://scdp.org/candidates/",
        "https://scdp.org/2026-candidates/",
        "https://scdp.org/endorsed-candidates/",
        "https://scdp.org/our-party/elected-officials/",
    ]

    # District patterns for parsing
    # Note: House pattern is more restrictive to avoid matching generic "District X"
    HOUSE_DISTRICT_PATTERN = re.compile(
        r"(?:House|HD|House\s+District)\s*(?:#?\s*)?(\d{1,3})",
        re.IGNORECASE
    )
    SENATE_DISTRICT_PATTERN = re.compile(
        r"(?:Senate|SD|State\s*Senate|Senate\s+District)\s*(?:#?\s*)?(\d{1,2})",
        re.IGNORECASE
    )

    # Name extraction patterns
    # Pattern: **Name** or ### Name or - Name
    NAME_BOLD_PATTERN = re.compile(r"\*\*([^*]+)\*\*")
    NAME_HEADING_PATTERN = re.compile(r"^#{1,4}\s+(.+?)(?:\s*[-\u2013\u2014]|\s*$)", re.MULTILINE)
    NAME_LIST_PATTERN = re.compile(r"^[-*]\s+(.+?)(?:\s*[-\u2013\u2014]|\s*$)", re.MULTILINE)

    # Pattern to identify district context
    DISTRICT_CONTEXT_PATTERN = re.compile(
        r"(?:District|Dist\.?)\s*(\d{1,3})",
        re.IGNORECASE
    )

    @property
    def source_name(self) -> str:
        """Return the source identifier."""
        return "scdp"

    @property
    def source_priority(self) -> int:
        """Return the source priority (3 = party-specific)."""
        return 3

    def __init__(
        self,
        firecrawl_api_key: Optional[str] = None,
        rate_limit: Optional[int] = None,
    ):
        """
        Initialize the SCDP source.

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

        # Cache for scraped pages (url -> markdown)
        self._page_cache: dict[str, str] = {}

        # Cache for discovered candidates
        self._candidates_cache: list[DiscoveredCandidate] = []

    def _district_id_from_parts(self, chamber: str, district_num: int) -> str:
        """
        Create district_id from chamber and number.

        Args:
            chamber: "house" or "senate"
            district_num: District number

        Returns:
            District ID (e.g., "SC-House-042")
        """
        chamber_title = chamber.title()
        return f"SC-{chamber_title}-{district_num:03d}"

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True,
    )
    async def _scrape_page(self, url: str) -> Optional[str]:
        """
        Scrape a page using Firecrawl.

        Args:
            url: URL to scrape

        Returns:
            Markdown content of the page, or None on error
        """
        if not self.api_key:
            logger.error("Cannot scrape: No Firecrawl API key configured")
            return None

        # Check cache first
        if url in self._page_cache:
            logger.debug(f"Using cached page for {url}")
            return self._page_cache[url]

        # Respect rate limit
        await self.rate_limiter.wait()

        try:
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

            logger.debug(f"Scraping {url}")
            response = requests.post(api_url, headers=headers, json=payload, timeout=30)

            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("data", {}).get("markdown"):
                    markdown = data["data"]["markdown"]
                    self._page_cache[url] = markdown
                    logger.info(f"Successfully scraped {url}")
                    return markdown
                else:
                    logger.warning(f"No markdown in response for {url}")
                    return None
            elif response.status_code == 404:
                logger.info(f"Page not found: {url}")
                return None
            elif response.status_code == 429:
                logger.warning(f"Rate limited while scraping {url}")
                raise Exception("Rate limited - will retry")
            else:
                logger.error(
                    f"Failed to scrape {url}: "
                    f"HTTP {response.status_code} - {response.text[:200]}"
                )
                return None

        except requests.RequestException as e:
            logger.error(f"Request error scraping {url}: {e}")
            raise

    def _extract_district_from_text(self, text: str) -> tuple[Optional[str], Optional[int]]:
        """
        Extract chamber and district number from text.

        Args:
            text: Text potentially containing district info

        Returns:
            Tuple of (chamber, district_num) or (None, None)
        """
        # Check for Senate district first (more specific pattern)
        senate_match = self.SENATE_DISTRICT_PATTERN.search(text)
        if senate_match:
            district_num = int(senate_match.group(1))
            if 1 <= district_num <= SC_SENATE_DISTRICTS:
                return "senate", district_num

        # Check for House district
        house_match = self.HOUSE_DISTRICT_PATTERN.search(text)
        if house_match:
            district_num = int(house_match.group(1))
            if 1 <= district_num <= SC_HOUSE_DISTRICTS:
                return "house", district_num

        return None, None

    def _parse_candidates(
        self,
        markdown: str,
        source_url: str,
    ) -> list[DiscoveredCandidate]:
        """
        Parse candidates from SCDP page markdown.

        Handles various page layouts:
        - Lists with names and districts
        - Tables with candidate information
        - Cards/sections for each candidate

        Args:
            markdown: Page content in markdown format
            source_url: URL of the source page

        Returns:
            List of discovered candidates
        """
        candidates = []
        seen = set()  # (name_lower, district_id) to dedupe

        if not markdown:
            return candidates

        # Strategy 1: Look for "Name - District X" patterns
        lines = markdown.split("\n")
        current_section = ""

        for i, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue

            # Track section headers
            if line.startswith("#"):
                current_section = line.lower()
                continue

            # Skip navigation, footer, etc.
            if any(skip in line.lower() for skip in [
                "donate", "volunteer", "contact", "subscribe",
                "privacy", "copyright", "navigation"
            ]):
                continue

            # Look for district context in this line
            chamber, district_num = self._extract_district_from_text(line)

            if chamber and district_num:
                # Find name in this line or nearby lines
                names = self._extract_names_from_line(line)

                for name in names:
                    district_id = self._district_id_from_parts(chamber, district_num)
                    key = (name.lower(), district_id)

                    if key in seen:
                        continue
                    seen.add(key)

                    # Determine if incumbent based on section or text
                    is_incumbent = (
                        "elected" in current_section or
                        "incumbent" in line.lower() or
                        "current" in current_section
                    )

                    candidate = DiscoveredCandidate(
                        name=name,
                        district_id=district_id,
                        party="D",
                        party_confidence="HIGH",
                        source=self.source_name,
                        source_url=source_url,
                        filing_status="declared" if not is_incumbent else None,
                        incumbent=is_incumbent,
                        additional_data={
                            "section": current_section[:50] if current_section else "",
                            "raw_line": line[:100],
                        },
                    )
                    candidates.append(candidate)
                    logger.debug(f"Found SCDP candidate: {name} in {district_id}")

        # Strategy 2: Parse bold names with district context
        # Look for patterns like "**John Smith** - District 42"
        bold_pattern = re.compile(
            r"\*\*([^*]+)\*\*[^*]*?(?:District|Dist\.?)\s*(\d{1,3})",
            re.IGNORECASE
        )
        for match in bold_pattern.finditer(markdown):
            name = match.group(1).strip()
            district_num = int(match.group(2))

            # Determine chamber from context
            context_start = max(0, match.start() - 200)
            context = markdown[context_start:match.end()]

            if "senate" in context.lower():
                chamber = "senate"
            elif "house" in context.lower():
                chamber = "house"
            else:
                # Default to house if district number is in range
                if district_num <= SC_SENATE_DISTRICTS:
                    # Could be either - skip ambiguous
                    continue
                chamber = "house"

            district_id = self._district_id_from_parts(chamber, district_num)
            key = (name.lower(), district_id)

            if key in seen:
                continue
            seen.add(key)

            candidate = DiscoveredCandidate(
                name=name,
                district_id=district_id,
                party="D",
                party_confidence="HIGH",
                source=self.source_name,
                source_url=source_url,
                filing_status="declared",
                incumbent=False,
            )
            candidates.append(candidate)

        logger.info(f"Parsed {len(candidates)} candidates from SCDP page")
        return candidates

    def _extract_names_from_line(self, line: str) -> list[str]:
        """
        Extract candidate names from a line of text.

        Args:
            line: Line of text

        Returns:
            List of names found
        """
        names = []

        # Try bold pattern first
        bold_matches = self.NAME_BOLD_PATTERN.findall(line)
        for match in bold_matches:
            name = match.strip()
            if self._is_valid_name(name):
                names.append(name)

        # If no bold names, try to extract from line start
        if not names:
            # Pattern: "- Name - District" or "Name - District"
            name_district_pattern = re.compile(
                r"^[-*]?\s*([A-Z][a-zA-Z\.\s]+?)(?:\s*[-\u2013\u2014]\s*(?:District|Dist|HD|SD))",
                re.IGNORECASE
            )
            match = name_district_pattern.match(line)
            if match:
                name = match.group(1).strip()
                if self._is_valid_name(name):
                    names.append(name)

        return names

    def _is_valid_name(self, name: str) -> bool:
        """
        Check if a string is a valid candidate name.

        Args:
            name: Potential name string

        Returns:
            True if likely a valid name
        """
        if not name or len(name) < 3:
            return False

        # Skip obvious non-names
        skip_words = [
            "district", "house", "senate", "state", "county",
            "election", "vote", "democratic", "republican",
            "congress", "president", "contact", "office"
        ]
        name_lower = name.lower()
        if any(word in name_lower for word in skip_words):
            return False

        # Should have at least two words (first and last name)
        parts = name.split()
        if len(parts) < 2:
            return False

        # First part should look like a first name (starts with capital)
        if not parts[0][0].isupper():
            return False

        return True

    async def discover_candidates(
        self,
        chambers: list[str] = None,
    ) -> list[DiscoveredCandidate]:
        """
        Discover Democratic candidates from SCDP website.

        Attempts to scrape candidate pages in order of preference.
        Falls back to elected officials page for incumbent information.

        Args:
            chambers: List of chambers to filter ("house", "senate").
                     Returns all if None.

        Returns:
            List of discovered candidates
        """
        if chambers is None:
            chambers = ["house", "senate"]

        all_candidates = []

        # Try each potential candidate URL
        for url in self.CANDIDATE_URLS:
            try:
                markdown = await self._scrape_page(url)
                if markdown:
                    candidates = self._parse_candidates(markdown, url)
                    if candidates:
                        all_candidates.extend(candidates)
                        logger.info(f"Found {len(candidates)} candidates from {url}")
            except Exception as e:
                logger.error(f"Error scraping {url}: {e}")
                continue

        # Filter by chamber if specified
        if chambers:
            chambers_lower = [c.lower() for c in chambers]
            all_candidates = [
                c for c in all_candidates
                if any(chamber in c.district_id.lower() for chamber in chambers_lower)
            ]

        # Deduplicate by (name, district_id)
        seen = set()
        unique_candidates = []
        for c in all_candidates:
            key = (c.name.lower(), c.district_id)
            if key not in seen:
                seen.add(key)
                unique_candidates.append(c)

        self._candidates_cache = unique_candidates
        logger.info(f"SCDP discovery complete: {len(unique_candidates)} candidates")
        return unique_candidates

    def extract_district_candidates(
        self,
        district_id: str,
    ) -> list[DiscoveredCandidate]:
        """
        Get candidates for a specific district.

        Uses cached data from discover_candidates().

        Args:
            district_id: District identifier (e.g., "SC-House-042")

        Returns:
            List of candidates for that district
        """
        return [
            c for c in self._candidates_cache
            if c.district_id == district_id
        ]

    async def extract_district_candidates_async(
        self,
        district_id: str,
    ) -> list[DiscoveredCandidate]:
        """
        Get candidates for a specific district with async support.

        If cache is empty, runs discovery first.

        Args:
            district_id: District identifier (e.g., "SC-House-042")

        Returns:
            List of candidates for that district
        """
        if not self._candidates_cache:
            await self.discover_candidates()

        return self.extract_district_candidates(district_id)

    def clear_cache(self) -> None:
        """Clear all cached data."""
        self._page_cache.clear()
        self._candidates_cache.clear()
        logger.info("Cleared SCDP source caches")

    def get_cache_stats(self) -> dict:
        """
        Get cache statistics.

        Returns:
            Dict with cache statistics
        """
        return {
            "pages_cached": len(self._page_cache),
            "candidates_cached": len(self._candidates_cache),
        }
