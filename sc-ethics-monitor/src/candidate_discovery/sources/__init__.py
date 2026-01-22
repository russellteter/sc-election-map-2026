"""
Candidate Discovery Sources.

This package contains source adapters for discovering candidates
from various external sources:
- base.py: Abstract base class and dataclasses
- ballotpedia.py: Ballotpedia scraper
- scdp.py: SC Democratic Party scraper
- scgop.py: SC Republican Party scraper
- election_commission.py: SC Election Commission API (future)
"""

from .base import (
    DiscoveredCandidate,
    MergedCandidate,
    ConflictRecord,
    CandidateSource,
)
from .ballotpedia import BallotpediaSource
from .scdp import SCDPSource
from .scgop import SCGOPSource

__all__ = [
    "DiscoveredCandidate",
    "MergedCandidate",
    "ConflictRecord",
    "CandidateSource",
    "BallotpediaSource",
    "SCDPSource",
    "SCGOPSource",
]
