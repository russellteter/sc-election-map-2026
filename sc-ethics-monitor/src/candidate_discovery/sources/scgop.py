"""
South Carolina Republican Party (SCGOP) source adapter for candidate discovery.

Scrapes candidate information from the SCGOP website.
All candidates from this source are Republicans (party="R").

URL Patterns:
- Main Site: https://sc.gop/ (redirected from www.scgop.com)
- News: https://sc.gop/news/
- Election Info: External vote.gop site

Note: The SCGOP website does not currently have a dedicated 2026 candidates page.
This source tracks candidate announcements from news releases and
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


class SCGOPSource(CandidateSource):
    """
    Candidate source adapter for South Carolina Republican Party (SCGOP).

    Scrapes the SCGOP website to discover Republican candidates and
    endorsements.

    All candidates from this source have:
    - party = "R" (Republican)
    - party_confidence = "HIGH" (authoritative party source)

    Attributes:
        source_name: "scgop"
        source_priority: 3 (party-specific)
    """

    # Base URLs for SCGOP pages
    BASE_URL = "https://sc.gop"
    NEWS_URL = "https://sc.gop/news/"
    CANDIDATES_URL = "https://sc.gop/candidates/"  # May not exist yet
    ENDORSED_URL = "https://sc.gop/endorsed/"  # May not exist yet

    # Potential candidate page URLs (checked in order)
    CANDIDATE_URLS = [
        "https://sc.gop/candidates/",
        "https://sc.gop/2026-candidates/",
        "https://sc.gop/endorsed-candidates/",
        "https://sc.gop/our-candidates/",
        "https://sc.gop/news/",  # Fallback to news for announcements
    ]

    # District patterns for parsing
    HOUSE_DISTRICT_PATTERN = re.compile(
        r"(?:House|HD|District)\s*(?:#?\s*)?(\d{1,3})",
        re.IGNORECASE
    )
    SENATE_DISTRICT_PATTERN = re.compile(
        r"(?:Senate|SD|State\s*Senate)\s*(?:District\s*)?(?:#?\s*)?(\d{1,2})",
        re.IGNORECASE
    )

    # Name extraction patterns
    NAME_BOLD_PATTERN = re.compile(r"\*\*([^*]+)\*\*")
    NAME_HEADING_PATTERN = re.compile(r"^#{1,4}\s+(.+?)(?:\s*[-\u2013\u2014]|\s*$)", re.MULTILINE)

    # Pattern to identify candidate announcements in news
    CANDIDATE_ANNOUNCEMENT_PATTERN = re.compile(
        r"(?:candidate|running|announces|filed|filing|campaign)\s+(?:for)?\s*"
        r"(?:SC|South\s*Carolina)?\s*(?:State)?\s*(?:House|Senate|District)",
        re.IGNORECASE
    )

    @property
    def source_name(self) -> str:
        """Return the source identifier."""
        return "scgop"

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
        Initialize the SCGOP source.

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
        # Check for Senate district first (more specific)
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
        Parse candidates from SCGOP page markdown.

        Handles various page layouts:
        - Candidate lists with names and districts
        - News articles with candidate announcements
        - Tables with candidate information

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
                "privacy", "copyright", "navigation", "store"
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

                    # Determine filing status from context
                    line_lower = line.lower()
                    if "filed" in line_lower or "filing" in line_lower:
                        filing_status = "filed"
                    elif "announced" in line_lower or "running" in line_lower:
                        filing_status = "declared"
                    elif "incumbent" in line_lower:
                        filing_status = None
                    else:
                        filing_status = "declared"

                    is_incumbent = "incumbent" in line_lower

                    candidate = DiscoveredCandidate(
                        name=name,
                        district_id=district_id,
                        party="R",
                        party_confidence="HIGH",
                        source=self.source_name,
                        source_url=source_url,
                        filing_status=filing_status,
                        incumbent=is_incumbent,
                        additional_data={
                            "section": current_section[:50] if current_section else "",
                            "raw_line": line[:100],
                        },
                    )
                    candidates.append(candidate)
                    logger.debug(f"Found SCGOP candidate: {name} in {district_id}")

        # Strategy 2: Parse news-style announcements
        # Pattern: "JD Chaplin ... SC Senate District 29" or similar
        announcement_pattern = re.compile(
            r"([A-Z][a-z]+(?:\s+[A-Z]\.?)?(?:\s+[A-Z][a-z]+)+)"
            r"[^.]*?"
            r"(?:SC|South\s*Carolina)?\s*(?:State)?\s*(Senate|House)\s*"
            r"(?:District\s*)?(\d{1,3})",
            re.IGNORECASE
        )

        for match in announcement_pattern.finditer(markdown):
            name = match.group(1).strip()
            chamber = match.group(2).lower()
            district_num = int(match.group(3))

            # Validate district number
            if chamber == "senate" and not (1 <= district_num <= SC_SENATE_DISTRICTS):
                continue
            if chamber == "house" and not (1 <= district_num <= SC_HOUSE_DISTRICTS):
                continue

            if not self._is_valid_name(name):
                continue

            district_id = self._district_id_from_parts(chamber, district_num)
            key = (name.lower(), district_id)

            if key in seen:
                continue
            seen.add(key)

            candidate = DiscoveredCandidate(
                name=name,
                district_id=district_id,
                party="R",
                party_confidence="HIGH",
                source=self.source_name,
                source_url=source_url,
                filing_status="declared",
                incumbent=False,
                additional_data={
                    "extraction_method": "news_announcement",
                },
            )
            candidates.append(candidate)

        # Strategy 3: Parse bold names with district context
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
                if not (1 <= district_num <= SC_SENATE_DISTRICTS):
                    continue
            elif "house" in context.lower():
                chamber = "house"
                if not (1 <= district_num <= SC_HOUSE_DISTRICTS):
                    continue
            else:
                # Default to house if district number is in range
                if district_num <= SC_SENATE_DISTRICTS:
                    # Could be either - skip ambiguous
                    continue
                chamber = "house"

            if not self._is_valid_name(name):
                continue

            district_id = self._district_id_from_parts(chamber, district_num)
            key = (name.lower(), district_id)

            if key in seen:
                continue
            seen.add(key)

            candidate = DiscoveredCandidate(
                name=name,
                district_id=district_id,
                party="R",
                party_confidence="HIGH",
                source=self.source_name,
                source_url=source_url,
                filing_status="declared",
                incumbent=False,
            )
            candidates.append(candidate)

        logger.info(f"Parsed {len(candidates)} candidates from SCGOP page")
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
                r"^[-*]?\s*([A-Z][a-zA-Z\.\s]+?)(?:\s*[-\u2013\u2014]\s*(?:District|Dist|HD|SD|House|Senate))",
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
            "congress", "president", "contact", "office",
            "south carolina", "sc gop", "party"
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
        Discover Republican candidates from SCGOP website.

        Attempts to scrape candidate pages in order of preference.
        Falls back to news page for candidate announcements.

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
        logger.info(f"SCGOP discovery complete: {len(unique_candidates)} candidates")
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
        logger.info("Cleared SCGOP source caches")

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
