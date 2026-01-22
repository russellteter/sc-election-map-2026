"""
Candidate Discovery Sources.

This package contains source adapters for discovering candidates
from various external sources:
- base.py: Abstract base class and dataclasses
- ballotpedia.py: Ballotpedia scraper (future)
- scdp.py: SC Democratic Party scraper (future)
- scgop.py: SC Republican Party scraper (future)
- election_commission.py: SC Election Commission API (future)
"""

from .base import (
    DiscoveredCandidate,
    MergedCandidate,
    ConflictRecord,
    CandidateSource,
)

__all__ = [
    "DiscoveredCandidate",
    "MergedCandidate",
    "ConflictRecord",
    "CandidateSource",
]
