"""
Candidate Discovery module for SC Ethics Monitor.

Provides multi-source candidate discovery, deduplication, and aggregation
for populating the Google Sheets with known candidates.

Components:
- sources/base.py: Base classes and dataclasses
- deduplicator.py: Name matching and deduplication
- rate_limiter.py: API rate limiting utility
"""

from .sources.base import (
    DiscoveredCandidate,
    MergedCandidate,
    ConflictRecord,
    CandidateSource,
)
from .deduplicator import CandidateDeduplicator
from .rate_limiter import RateLimiter

__all__ = [
    "DiscoveredCandidate",
    "MergedCandidate",
    "ConflictRecord",
    "CandidateSource",
    "CandidateDeduplicator",
    "RateLimiter",
]
