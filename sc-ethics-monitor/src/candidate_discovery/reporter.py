"""
Coverage Reporter for Candidate Discovery.

Generates reports on discovery coverage, including:
- Total districts vs districts with candidates
- Candidates by party breakdown
- Candidates by source breakdown
- Conflicts detected
- Coverage percentage

Used to track discovery effectiveness and identify gaps.
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional

from .aggregator import AggregationResult
from .sources.base import MergedCandidate

logger = logging.getLogger(__name__)


# Import config for district counts
try:
    from config import SC_HOUSE_DISTRICTS, SC_SENATE_DISTRICTS
except ImportError:
    import os
    SC_HOUSE_DISTRICTS = int(os.environ.get("SC_HOUSE_DISTRICTS", "124"))
    SC_SENATE_DISTRICTS = int(os.environ.get("SC_SENATE_DISTRICTS", "46"))


@dataclass
class CoverageReport:
    """
    Report on discovery coverage across districts.

    Attributes:
        total_districts: Total number of districts to track
        districts_with_candidates: Number of districts with at least one candidate
        districts_without_candidates: List of district IDs with no candidates
        candidates_by_party: Dict mapping party code to count
        candidates_by_source: Dict mapping source name to count
        conflicts_found: Number of conflicts detected
        timestamp: When report was generated
        chambers_analyzed: List of chambers included in report
    """
    total_districts: int = 170  # 124 House + 46 Senate
    districts_with_candidates: int = 0
    districts_without_candidates: list[str] = field(default_factory=list)
    candidates_by_party: dict[str, int] = field(default_factory=dict)
    candidates_by_source: dict[str, int] = field(default_factory=dict)
    conflicts_found: int = 0
    timestamp: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    chambers_analyzed: list[str] = field(default_factory=list)

    # Additional stats
    total_candidates: int = 0
    new_candidates_this_run: int = 0
    updated_candidates_this_run: int = 0

    def coverage_percentage(self) -> float:
        """
        Calculate the percentage of districts with candidates.

        Returns:
            Coverage percentage (0-100)
        """
        if self.total_districts == 0:
            return 0.0
        return (self.districts_with_candidates / self.total_districts) * 100

    def party_breakdown_str(self) -> str:
        """
        Format party breakdown as a string.

        Returns:
            String like "D: 45, R: 52, I: 3, Unknown: 20"
        """
        parts = []
        party_labels = {
            "D": "Democrat",
            "R": "Republican",
            "I": "Independent",
            "O": "Other",
            None: "Unknown",
        }
        for party, label in party_labels.items():
            count = self.candidates_by_party.get(party, 0)
            if count > 0:
                parts.append(f"{label}: {count}")
        return ", ".join(parts) if parts else "No candidates"

    def source_breakdown_str(self) -> str:
        """
        Format source breakdown as a string.

        Returns:
            String like "ballotpedia: 80, scdp: 45, scgop: 52"
        """
        parts = [f"{src}: {count}" for src, count in self.candidates_by_source.items()]
        return ", ".join(sorted(parts)) if parts else "No sources"


class CoverageReporter:
    """
    Generates coverage reports from aggregation results.

    Analyzes discovery results to calculate:
    - District coverage (which districts have candidates)
    - Party breakdown
    - Source breakdown
    - Conflict summary

    Used by the monitor to track discovery effectiveness.
    """

    def __init__(
        self,
        house_districts: int = None,
        senate_districts: int = None,
    ):
        """
        Initialize the reporter.

        Args:
            house_districts: Number of House districts (default: 124)
            senate_districts: Number of Senate districts (default: 46)
        """
        self.house_districts = house_districts or SC_HOUSE_DISTRICTS
        self.senate_districts = senate_districts or SC_SENATE_DISTRICTS
        self.total_districts = self.house_districts + self.senate_districts

    def generate_report(
        self,
        aggregation_result: AggregationResult,
        chambers: list[str] = None,
        new_count: int = 0,
        updated_count: int = 0,
    ) -> CoverageReport:
        """
        Generate a coverage report from an aggregation result.

        Args:
            aggregation_result: Result from CandidateAggregator.aggregate_all()
            chambers: Which chambers were analyzed (defaults to both)
            new_count: Number of new candidates added this run
            updated_count: Number of candidates updated this run

        Returns:
            CoverageReport with all metrics calculated
        """
        if chambers is None:
            chambers = ["house", "senate"]

        # Determine total districts based on chambers
        total = 0
        if "house" in chambers:
            total += self.house_districts
        if "senate" in chambers:
            total += self.senate_districts

        # Calculate districts with candidates
        districts_with = self._get_districts_with_candidates(
            aggregation_result.candidates
        )

        # Calculate districts without candidates
        districts_without = self._get_districts_without_candidates(
            districts_with, chambers
        )

        # Count candidates by party
        by_party = self._count_by_party(aggregation_result.candidates)

        # Count candidates by source
        by_source = self._count_by_source(aggregation_result)

        report = CoverageReport(
            total_districts=total,
            districts_with_candidates=len(districts_with),
            districts_without_candidates=districts_without,
            candidates_by_party=by_party,
            candidates_by_source=by_source,
            conflicts_found=aggregation_result.conflict_count,
            chambers_analyzed=chambers,
            total_candidates=aggregation_result.total_deduplicated,
            new_candidates_this_run=new_count,
            updated_candidates_this_run=updated_count,
        )

        logger.info(
            f"Generated coverage report: {report.coverage_percentage():.1f}% coverage, "
            f"{report.total_candidates} candidates"
        )

        return report

    def _get_districts_with_candidates(
        self,
        candidates: list[MergedCandidate],
    ) -> set[str]:
        """
        Get set of district IDs that have at least one candidate.

        Args:
            candidates: List of merged candidates

        Returns:
            Set of district IDs with candidates
        """
        return {c.district_id for c in candidates}

    def _get_districts_without_candidates(
        self,
        districts_with: set[str],
        chambers: list[str],
    ) -> list[str]:
        """
        Get list of district IDs without any candidates.

        Args:
            districts_with: Set of districts that have candidates
            chambers: Chambers being analyzed

        Returns:
            Sorted list of district IDs without candidates
        """
        all_districts = set()

        for chamber in chambers:
            if chamber == "house":
                for i in range(1, self.house_districts + 1):
                    all_districts.add(f"SC-House-{i:03d}")
            elif chamber == "senate":
                for i in range(1, self.senate_districts + 1):
                    all_districts.add(f"SC-Senate-{i:03d}")

        without = all_districts - districts_with
        return sorted(list(without))

    def _count_by_party(
        self,
        candidates: list[MergedCandidate],
    ) -> dict[str, int]:
        """
        Count candidates by party.

        Args:
            candidates: List of merged candidates

        Returns:
            Dict mapping party code to count
        """
        counts = {}
        for candidate in candidates:
            party = candidate.party  # May be None
            counts[party] = counts.get(party, 0) + 1
        return counts

    def _count_by_source(
        self,
        aggregation_result: AggregationResult,
    ) -> dict[str, int]:
        """
        Count candidates discovered by each source.

        Args:
            aggregation_result: Full aggregation result

        Returns:
            Dict mapping source name to candidate count
        """
        counts = {}
        for source_name, source_result in aggregation_result.source_stats.items():
            if source_result.success:
                counts[source_name] = source_result.candidate_count
        return counts


def format_text_report(report: CoverageReport) -> str:
    """
    Format a coverage report as human-readable text.

    Args:
        report: CoverageReport to format

    Returns:
        Multi-line text report
    """
    lines = [
        "=" * 60,
        "CANDIDATE DISCOVERY COVERAGE REPORT",
        f"Generated: {report.timestamp}",
        "=" * 60,
        "",
        "COVERAGE SUMMARY",
        "-" * 40,
        f"Total Districts:      {report.total_districts}",
        f"Districts with Data:  {report.districts_with_candidates}",
        f"Coverage:             {report.coverage_percentage():.1f}%",
        "",
        "CANDIDATES",
        "-" * 40,
        f"Total Candidates:     {report.total_candidates}",
        f"New This Run:         {report.new_candidates_this_run}",
        f"Updated This Run:     {report.updated_candidates_this_run}",
        "",
        "BY PARTY",
        "-" * 40,
    ]

    party_labels = {"D": "Democrat", "R": "Republican", "I": "Independent", "O": "Other"}
    for party, label in party_labels.items():
        count = report.candidates_by_party.get(party, 0)
        if count > 0:
            lines.append(f"  {label:15s}  {count:4d}")

    unknown_count = report.candidates_by_party.get(None, 0)
    if unknown_count > 0:
        lines.append(f"  {'Unknown':15s}  {unknown_count:4d}")

    lines.extend([
        "",
        "BY SOURCE",
        "-" * 40,
    ])

    for source, count in sorted(report.candidates_by_source.items()):
        lines.append(f"  {source:15s}  {count:4d}")

    if report.conflicts_found > 0:
        lines.extend([
            "",
            "CONFLICTS",
            "-" * 40,
            f"Conflicts Found:      {report.conflicts_found}",
            "(See conflict log for details)",
        ])

    # Districts without candidates (show first 10)
    if report.districts_without_candidates:
        lines.extend([
            "",
            "DISTRICTS WITHOUT CANDIDATES",
            "-" * 40,
        ])
        for district_id in report.districts_without_candidates[:10]:
            lines.append(f"  - {district_id}")
        if len(report.districts_without_candidates) > 10:
            remaining = len(report.districts_without_candidates) - 10
            lines.append(f"  ... and {remaining} more")

    lines.extend([
        "",
        "=" * 60,
    ])

    return "\n".join(lines)


def format_email_section(
    report: CoverageReport,
    show_districts_without: int = 5,
) -> str:
    """
    Format a coverage report as an HTML section for email.

    Args:
        report: CoverageReport to format
        show_districts_without: Max number of empty districts to list

    Returns:
        HTML string for email inclusion
    """
    # Coverage color based on percentage
    coverage_pct = report.coverage_percentage()
    if coverage_pct >= 80:
        coverage_color = "#22c55e"  # Green
    elif coverage_pct >= 60:
        coverage_color = "#eab308"  # Yellow
    else:
        coverage_color = "#ef4444"  # Red

    html = f"""
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <h3 style="margin: 0 0 12px 0; color: #374151;">Candidate Discovery Report</h3>

        <div style="display: flex; gap: 24px; flex-wrap: wrap; margin-bottom: 16px;">
            <div style="flex: 1; min-width: 150px;">
                <div style="font-size: 12px; color: #6b7280; text-transform: uppercase;">Coverage</div>
                <div style="font-size: 24px; font-weight: bold; color: {coverage_color};">
                    {coverage_pct:.1f}%
                </div>
                <div style="font-size: 12px; color: #6b7280;">
                    {report.districts_with_candidates} of {report.total_districts} districts
                </div>
            </div>

            <div style="flex: 1; min-width: 150px;">
                <div style="font-size: 12px; color: #6b7280; text-transform: uppercase;">Candidates</div>
                <div style="font-size: 24px; font-weight: bold; color: #374151;">
                    {report.total_candidates}
                </div>
                <div style="font-size: 12px; color: #6b7280;">
                    +{report.new_candidates_this_run} new, +{report.updated_candidates_this_run} updated
                </div>
            </div>
    """

    if report.conflicts_found > 0:
        html += f"""
            <div style="flex: 1; min-width: 150px;">
                <div style="font-size: 12px; color: #6b7280; text-transform: uppercase;">Conflicts</div>
                <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">
                    {report.conflicts_found}
                </div>
                <div style="font-size: 12px; color: #6b7280;">
                    Require review
                </div>
            </div>
        """

    html += """
        </div>
    """

    # Party breakdown
    if report.candidates_by_party:
        html += """
        <div style="margin-bottom: 12px;">
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">By Party</div>
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        """
        party_colors = {
            "D": ("#dbeafe", "#1d4ed8"),  # Blue
            "R": ("#fee2e2", "#b91c1c"),  # Red
            "I": ("#f3f4f6", "#6b7280"),  # Gray
            "O": ("#fef3c7", "#d97706"),  # Orange
            None: ("#f3f4f6", "#6b7280"),  # Gray
        }
        party_labels = {"D": "Democrat", "R": "Republican", "I": "Independent", "O": "Other", None: "Unknown"}

        for party, count in report.candidates_by_party.items():
            if count > 0:
                bg, text = party_colors.get(party, ("#f3f4f6", "#6b7280"))
                label = party_labels.get(party, "Unknown")
                html += f"""
                <span style="background: {bg}; color: {text}; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                    {label}: {count}
                </span>
                """

        html += """
            </div>
        </div>
        """

    # Source breakdown
    if report.candidates_by_source:
        html += """
        <div style="margin-bottom: 12px;">
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">By Source</div>
            <div style="font-size: 13px; color: #374151;">
        """
        source_parts = [f"{src}: {count}" for src, count in sorted(report.candidates_by_source.items())]
        html += " | ".join(source_parts)
        html += """
            </div>
        </div>
        """

    # Districts without candidates
    if report.districts_without_candidates and show_districts_without > 0:
        html += f"""
        <div>
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">
                Districts Without Candidates ({len(report.districts_without_candidates)})
            </div>
            <div style="font-size: 12px; color: #9ca3af;">
        """
        display_districts = report.districts_without_candidates[:show_districts_without]
        html += ", ".join(display_districts)
        if len(report.districts_without_candidates) > show_districts_without:
            remaining = len(report.districts_without_candidates) - show_districts_without
            html += f" ... +{remaining} more"
        html += """
            </div>
        </div>
        """

    html += """
    </div>
    """

    return html


def format_summary_line(report: CoverageReport) -> str:
    """
    Format a single-line summary of the report.

    Args:
        report: CoverageReport to summarize

    Returns:
        Single line summary string
    """
    return (
        f"Coverage: {report.coverage_percentage():.1f}% "
        f"({report.districts_with_candidates}/{report.total_districts} districts) | "
        f"Candidates: {report.total_candidates} | "
        f"New: {report.new_candidates_this_run} | "
        f"Conflicts: {report.conflicts_found}"
    )
