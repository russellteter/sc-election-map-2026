"""
Candidate deduplication using fuzzy name matching.

Handles common name variations:
- "John Smith" vs "John H. Smith" vs "Johnny Smith"
- "Jr." suffix variations
- Middle initial presence/absence
- Case differences
"""

import re
from collections import defaultdict
from typing import Optional

from .sources.base import DiscoveredCandidate, MergedCandidate


class CandidateDeduplicator:
    """
    Deduplicates candidates across sources using fuzzy name matching.

    Strategy:
    - Group by district_id (exact match)
    - Within district, fuzzy match on name
    - Merge data from duplicate records

    Attributes:
        similarity_threshold: Minimum similarity score to consider a match (0-1)
    """

    # Default similarity threshold for name matching
    SIMILARITY_THRESHOLD = 0.85

    # Source priorities for conflict resolution (lower = higher priority)
    SOURCE_PRIORITIES = {
        "ethics_commission": 1,
        "ballotpedia": 2,
        "scdp": 3,
        "scgop": 3,
        "election_commission": 4,
        "web_search": 5,
    }

    # Filing status priority (earlier in list = more advanced)
    FILING_STATUS_ORDER = ["certified", "filed", "declared", "rumored", "unknown"]

    def __init__(self, similarity_threshold: float = None):
        """
        Initialize the deduplicator.

        Args:
            similarity_threshold: Override default similarity threshold (0-1)
        """
        if similarity_threshold is not None:
            self.similarity_threshold = similarity_threshold
        else:
            self.similarity_threshold = self.SIMILARITY_THRESHOLD

    def deduplicate(
        self,
        candidates: list[DiscoveredCandidate],
    ) -> list[MergedCandidate]:
        """
        Deduplicate candidates and merge data from multiple sources.

        Args:
            candidates: List of discovered candidates from all sources

        Returns:
            List of merged candidates with duplicates combined
        """
        if not candidates:
            return []

        # Group by district
        by_district: dict[str, list[DiscoveredCandidate]] = defaultdict(list)
        for candidate in candidates:
            by_district[candidate.district_id].append(candidate)

        merged_candidates = []

        for district_id, district_candidates in by_district.items():
            # Cluster by name similarity
            clusters = self._cluster_by_name(district_candidates)

            for cluster in clusters:
                merged = self._merge_cluster(cluster)
                merged_candidates.append(merged)

        return merged_candidates

    def _cluster_by_name(
        self,
        candidates: list[DiscoveredCandidate],
    ) -> list[list[DiscoveredCandidate]]:
        """
        Cluster candidates by name similarity.

        Uses a greedy clustering approach where each candidate is either
        added to an existing cluster or starts a new one.

        Args:
            candidates: List of candidates within a single district

        Returns:
            List of clusters (each cluster is a list of similar candidates)
        """
        if not candidates:
            return []

        clusters: list[list[DiscoveredCandidate]] = []
        used: set[int] = set()

        for i, c1 in enumerate(candidates):
            if i in used:
                continue

            cluster = [c1]
            used.add(i)

            for j, c2 in enumerate(candidates[i + 1:], i + 1):
                if j in used:
                    continue

                if self._names_match(c1.name, c2.name):
                    cluster.append(c2)
                    used.add(j)

            clusters.append(cluster)

        return clusters

    def _names_match(self, name1: str, name2: str) -> bool:
        """
        Check if two names likely refer to the same person.

        Args:
            name1: First name
            name2: Second name

        Returns:
            True if names match within threshold
        """
        # Normalize names
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

    def _normalize_name(self, name: str) -> str:
        """
        Normalize name for comparison.

        Normalizations:
        - Lowercase
        - Remove common suffixes (Jr., Sr., III, etc.)
        - Remove middle initials
        - Remove extra whitespace
        - Remove punctuation

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

        # Also handle comma-separated suffixes like "Smith, Jr."
        name = re.sub(r',\s*(jr\.?|sr\.?|iii?|iv|v|2nd|3rd|4th)\s*$', '', name)

        # Remove middle initials (single letter followed by period and space)
        name = re.sub(r'\b[a-z]\.\s*', '', name)

        # Remove standalone middle initials (single letter between words)
        name = re.sub(r'\s+[a-z]\s+', ' ', name)

        # Remove common punctuation
        name = re.sub(r'[.,\'-]', '', name)

        # Remove extra whitespace
        name = ' '.join(name.split())

        return name.strip()

    def _calculate_similarity(self, s1: str, s2: str) -> float:
        """
        Calculate string similarity using longest common subsequence ratio.

        The LCS ratio is calculated as: 2 * LCS_length / (len(s1) + len(s2))
        This gives a score between 0 and 1, where 1 is identical.

        Args:
            s1: First string (normalized)
            s2: Second string (normalized)

        Returns:
            Similarity score between 0 and 1
        """
        if not s1 or not s2:
            return 0.0

        # Exact match
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

    def _merge_cluster(
        self,
        cluster: list[DiscoveredCandidate],
    ) -> MergedCandidate:
        """
        Merge a cluster of duplicate candidates into one record.

        Resolution strategy:
        - Name: Use name from highest priority source
        - Party: Use party from highest priority source that has one
        - Filing status: Use most advanced status
        - Incumbent: True if any source says incumbent
        - Discovered date: Use earliest date

        Args:
            cluster: List of candidates representing the same person

        Returns:
            Merged candidate record
        """
        # Sort by source priority
        cluster.sort(key=lambda c: self._get_source_priority(c.source))

        primary = cluster[0]

        # Collect all sources and URLs
        sources = list(set(c.source for c in cluster if c.source))
        source_urls = {c.source: c.source_url for c in cluster if c.source_url}

        # Determine best party (from highest priority source with party)
        party = None
        party_confidence = "UNKNOWN"
        party_source = None

        for c in cluster:
            if c.party:
                party = c.party
                party_confidence = c.party_confidence
                party_source = c.source
                break

        # Determine incumbent status (any source saying incumbent)
        is_incumbent = any(c.incumbent for c in cluster)

        # Determine filing status (most advanced status)
        filing_statuses = [c.filing_status for c in cluster if c.filing_status]
        filing_status = self._best_filing_status(filing_statuses)

        # Determine earliest discovered date
        discovered_dates = [c.discovered_date for c in cluster if c.discovered_date]
        earliest_date = min(discovered_dates) if discovered_dates else primary.discovered_date

        return MergedCandidate(
            name=primary.name,
            district_id=primary.district_id,
            party=party,
            party_confidence=party_confidence,
            party_source=party_source,
            sources=sources,
            source_urls=source_urls,
            filing_status=filing_status,
            incumbent=is_incumbent,
            discovered_date=earliest_date,
            source_records=cluster,
            primary_source=primary.source,
        )

    def _get_source_priority(self, source: str) -> int:
        """
        Get priority for a source.

        Args:
            source: Source identifier

        Returns:
            Priority number (lower = higher priority)
        """
        return self.SOURCE_PRIORITIES.get(source, 10)

    def _best_filing_status(self, statuses: list[Optional[str]]) -> str:
        """
        Get most advanced filing status.

        Order of advancement: certified > filed > declared > rumored > unknown

        Args:
            statuses: List of filing statuses from all sources

        Returns:
            Most advanced status
        """
        if not statuses:
            return "unknown"

        # Filter out None values and lowercase for comparison
        valid_statuses = [s.lower() for s in statuses if s]

        if not valid_statuses:
            return "unknown"

        for status in self.FILING_STATUS_ORDER:
            if status in valid_statuses:
                return status

        return "unknown"

    def find_potential_duplicates(
        self,
        candidates: list[DiscoveredCandidate],
        threshold: float = None,
    ) -> list[tuple[DiscoveredCandidate, DiscoveredCandidate, float]]:
        """
        Find potential duplicates across all districts for review.

        Useful for finding cases where the same person might be running
        in different districts (data error) or identifying naming conflicts.

        Args:
            candidates: List of all candidates
            threshold: Similarity threshold (default: use instance threshold)

        Returns:
            List of tuples (candidate1, candidate2, similarity_score)
        """
        if threshold is None:
            threshold = self.similarity_threshold

        duplicates = []

        for i, c1 in enumerate(candidates):
            for c2 in candidates[i + 1:]:
                if c1.district_id != c2.district_id:
                    # Cross-district potential duplicate
                    n1 = self._normalize_name(c1.name)
                    n2 = self._normalize_name(c2.name)
                    similarity = self._calculate_similarity(n1, n2)

                    if similarity >= threshold:
                        duplicates.append((c1, c2, similarity))

        return duplicates
