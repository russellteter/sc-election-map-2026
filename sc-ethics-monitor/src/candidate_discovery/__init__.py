"""
Candidate Discovery module for SC Ethics Monitor.

Provides multi-source candidate discovery, deduplication, and aggregation
for populating the Google Sheets with known candidates.

Components:
- sources/base.py: Base classes and dataclasses
- deduplicator.py: Name matching and deduplication
- rate_limiter.py: API rate limiting utility
- aggregator.py: Multi-source aggregation
- sheets_integration.py: Google Sheets sync for discovered candidates
"""

from .sources.base import (
    DiscoveredCandidate,
    MergedCandidate,
    ConflictRecord,
    CandidateSource,
)
from .deduplicator import CandidateDeduplicator
from .rate_limiter import RateLimiter
from .aggregator import (
    AggregationResult,
    SourceResult,
    CandidateAggregator,
)

# Lazy import for sheets_integration to avoid circular import issues
# when running tests without full src package
def _get_sheets_classes():
    from .sheets_integration import SyncResult, DiscoverySheetIntegration
    return SyncResult, DiscoverySheetIntegration

__all__ = [
    "DiscoveredCandidate",
    "MergedCandidate",
    "ConflictRecord",
    "CandidateSource",
    "CandidateDeduplicator",
    "RateLimiter",
    "AggregationResult",
    "SourceResult",
    "CandidateAggregator",
    # sheets_integration classes available via direct import
]
