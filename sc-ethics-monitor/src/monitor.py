"""
SC Ethics Monitor - Daily monitoring and notification system.

Integrates:
- Ethics Commission website scraping
- Google Sheets bidirectional sync
- Party detection (with respect for locked candidates)
- Email notifications with party badges
- Multi-source candidate discovery (Ballotpedia, SCDP, SCGOP)

Usage:
    python -m src.monitor                    # Full daily run
    python -m src.monitor --dry-run          # Test without sending emails
    python -m src.monitor --skip-scrape      # Use cached scrape data
    python -m src.monitor --force-discovery  # Run candidate discovery now
"""

import argparse
import asyncio
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from .config import (
    DATA_DIR,
    CACHE_DIR,
    DISCOVERY_ENABLED,
    DISCOVERY_FREQUENCY,
    DISCOVERY_SOURCES,
    EMAIL_FROM,
    EMAIL_TO,
    FIRECRAWL_API_KEY,
    RESEND_API_KEY,
    SC_HOUSE_DISTRICTS,
    SC_SENATE_DISTRICTS,
)
from .sheets_sync import SheetsSync


def log(message: str) -> None:
    """Print timestamped log message."""
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    print(f"[{timestamp}] {message}")


class EthicsMonitor:
    """
    Daily ethics monitoring and notification system.

    Workflow:
    1. Read current sheet state (manual overrides, party_locked)
    2. Scrape ethics website for new filings
    3. Run party detection (skip locked candidates)
    4. Sync to Google Sheets (preserve manual data)
    5. Update race analysis (using final_party)
    6. Populate research queue
    7. Run candidate discovery (if scheduled or forced)
    8. Send notification email (with party badges)
    """

    # File to track last discovery run
    DISCOVERY_STATE_FILE = CACHE_DIR / "discovery_state.json"

    def __init__(
        self,
        credentials_path: str = None,
        dry_run: bool = False,
        force_discovery: bool = False,
    ):
        """
        Initialize EthicsMonitor.

        Args:
            credentials_path: Path to Google service account credentials.
            dry_run: If True, don't send emails or modify sheets.
            force_discovery: If True, run discovery regardless of schedule.
        """
        self.sheets = SheetsSync(credentials_path)
        self.dry_run = dry_run
        self.force_discovery = force_discovery or os.environ.get("FORCE_DISCOVERY") == "1"
        self.sheet_state = {}
        self.new_candidates = []
        self.updated_candidates = []
        self.party_detections = []
        self.discovery_results = None
        self.coverage_report = None

    def connect(self) -> bool:
        """Connect to Google Sheets."""
        if self.dry_run:
            log("DRY RUN: Skipping Google Sheets connection")
            return True
        return self.sheets.connect()

    def run_daily_monitor(
        self,
        skip_scrape: bool = False,
        scrape_data_path: str = None,
        incumbents_path: str = None,
    ) -> dict:
        """
        Run the full daily monitoring workflow.

        Args:
            skip_scrape: If True, use cached scrape data instead of scraping.
            scrape_data_path: Path to cached scrape data JSON.
            incumbents_path: Path to incumbents JSON for enrichment.

        Returns:
            Summary dict with results.
        """
        log("=" * 60)
        log("SC Ethics Monitor - Daily Run")
        log(f"Dry run: {self.dry_run}")
        log("=" * 60)

        results = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "dry_run": self.dry_run,
            "candidates_found": 0,
            "new_candidates": 0,
            "updated_candidates": 0,
            "skipped_locked": 0,
            "party_detections": 0,
            "email_sent": False,
            "errors": [],
        }

        try:
            # Step 1: Connect to Google Sheets
            log("Step 1: Connecting to Google Sheets...")
            if not self.connect():
                results["errors"].append("Failed to connect to Google Sheets")
                return results

            # Step 2: Read current sheet state
            log("Step 2: Reading current sheet state...")
            if not self.dry_run:
                self.sheet_state = self.sheets.read_sheet_state()
                log(f"  Found {len(self.sheet_state)} existing candidates in sheet")
            else:
                self.sheet_state = {}

            # Step 3: Get ethics data (scrape or cached)
            log("Step 3: Getting ethics filing data...")
            if skip_scrape and scrape_data_path:
                ethics_data = self._load_cached_scrape(scrape_data_path)
            else:
                ethics_data = self._scrape_ethics()

            if not ethics_data:
                results["errors"].append("No ethics data available")
                return results

            results["candidates_found"] = len(ethics_data)
            log(f"  Found {len(ethics_data)} candidate filings")

            # Step 4: Load incumbents data for enrichment
            log("Step 4: Loading incumbents data...")
            incumbents = self._load_incumbents(incumbents_path)
            log(f"  Loaded {self._count_incumbents(incumbents)} incumbents")

            # Step 5: Process candidates with party detection
            log("Step 5: Processing candidates...")
            processed = self._process_candidates(ethics_data, incumbents)
            results["new_candidates"] = processed["new"]
            results["updated_candidates"] = processed["updated"]
            results["skipped_locked"] = processed["skipped"]
            results["party_detections"] = processed["party_detections"]

            # Step 6: Sync to Google Sheets
            log("Step 6: Syncing to Google Sheets...")
            if not self.dry_run:
                sync_results = self.sheets.sync_candidates(
                    self.new_candidates + self.updated_candidates,
                    sheet_state=self.sheet_state,
                    skip_locked=True,
                )
                log(f"  Added: {sync_results['added']}, Updated: {sync_results['updated']}, Skipped: {sync_results['skipped']}")

                # Log the sync
                self.sheets.log_sync(
                    event_type="DAILY_SYNC",
                    details=f"Daily monitor run",
                    candidates_added=sync_results["added"],
                    candidates_updated=sync_results["updated"],
                    party_detections=results["party_detections"],
                    errors=len(results["errors"]),
                )
            else:
                log("  DRY RUN: Skipping sheet sync")

            # Step 7: Update race analysis
            log("Step 7: Updating race analysis...")
            if not self.dry_run:
                analysis_results = self.sheets.update_race_analysis(incumbents)
                log(f"  Analyzed {analysis_results['districts_analyzed']} districts")
                log(f"  Priority counts: {analysis_results['priority_counts']}")
            else:
                log("  DRY RUN: Skipping race analysis update")

            # Step 8: Populate research queue
            log("Step 8: Updating research queue...")
            if not self.dry_run:
                queue_results = self.sheets.populate_research_queue()
                log(f"  Added {queue_results['candidates_added']} to research queue")
            else:
                log("  DRY RUN: Skipping research queue update")

            # Step 9: Run candidate discovery (if scheduled or forced)
            log("Step 9: Checking candidate discovery...")
            if self._should_run_discovery():
                log("  Running candidate discovery from external sources...")
                discovery_stats = asyncio.run(self._run_candidate_discovery())
                results["discovery_stats"] = discovery_stats
                log(f"  Discovery: {discovery_stats.get('total_added', 0)} added, "
                    f"{discovery_stats.get('total_updated', 0)} updated, "
                    f"{discovery_stats.get('conflicts_found', 0)} conflicts")
            else:
                log("  Discovery not scheduled (use --force-discovery to run)")

            # Step 10: Send notification email
            log("Step 10: Sending notification email...")
            if self.new_candidates and not self.dry_run:
                email_sent = self._send_notification_email()
                results["email_sent"] = email_sent
            else:
                if self.dry_run:
                    log("  DRY RUN: Would send email for new candidates")
                    self._preview_email()
                else:
                    log("  No new candidates, skipping email")

        except Exception as e:
            log(f"ERROR: {e}")
            results["errors"].append(str(e))

        log("=" * 60)
        log("Daily monitor complete")
        log(f"Results: {json.dumps(results, indent=2)}")
        log("=" * 60)

        return results

    def _should_run_discovery(self) -> bool:
        """
        Determine if candidate discovery should run.

        Discovery runs when:
        - FORCE_DISCOVERY=1 env is set
        - --force-discovery flag was passed
        - Discovery is enabled AND scheduled (weekly by default)

        Returns:
            True if discovery should run
        """
        # Forced discovery
        if self.force_discovery:
            log("  Discovery forced via flag or environment")
            return True

        # Check if discovery is enabled
        if not DISCOVERY_ENABLED:
            return False

        # Check schedule
        if DISCOVERY_FREQUENCY == "manual":
            return False

        # Check last run time
        try:
            if self.DISCOVERY_STATE_FILE.exists():
                with open(self.DISCOVERY_STATE_FILE) as f:
                    state = json.load(f)
                last_run = datetime.fromisoformat(state.get("last_run", "2000-01-01"))

                now = datetime.now(timezone.utc)
                days_since = (now - last_run.replace(tzinfo=timezone.utc)).days

                if DISCOVERY_FREQUENCY == "weekly":
                    return days_since >= 7
                elif DISCOVERY_FREQUENCY == "daily":
                    return days_since >= 1
                else:
                    return days_since >= 7  # Default to weekly
            else:
                # No state file - run discovery
                return True
        except Exception as e:
            log(f"  Error checking discovery schedule: {e}")
            return False

    async def _run_candidate_discovery(self) -> dict:
        """
        Run multi-source candidate discovery.

        Discovers candidates from:
        - Ballotpedia (priority 2)
        - SCDP (priority 3)
        - SCGOP (priority 3)

        Returns:
            Stats dict with discovery results
        """
        from .candidate_discovery.aggregator import CandidateAggregator
        from .candidate_discovery.sheets_integration import DiscoverySheetIntegration
        from .candidate_discovery.sources.ballotpedia import BallotpediaSource
        from .candidate_discovery.sources.scdp import SCDPSource
        from .candidate_discovery.sources.scgop import SCGOPSource
        from .candidate_discovery.reporter import (
            CoverageReporter,
            format_text_report,
            format_summary_line,
        )

        stats = {
            "sources_attempted": 0,
            "sources_succeeded": 0,
            "total_raw": 0,
            "total_deduplicated": 0,
            "total_added": 0,
            "total_updated": 0,
            "conflicts_found": 0,
            "errors": [],
        }

        try:
            # Initialize sources based on configuration
            sources = []
            for source_name in DISCOVERY_SOURCES:
                source_name = source_name.strip().lower()
                if source_name == "ballotpedia":
                    sources.append(BallotpediaSource())
                elif source_name == "scdp":
                    sources.append(SCDPSource())
                elif source_name == "scgop":
                    sources.append(SCGOPSource())
                else:
                    log(f"  Unknown discovery source: {source_name}")

            if not sources:
                log("  No discovery sources configured")
                return stats

            stats["sources_attempted"] = len(sources)

            # Create aggregator and run discovery
            aggregator = CandidateAggregator(sources)
            result = await aggregator.aggregate_all(chambers=["house", "senate"])

            stats["sources_succeeded"] = len(result.successful_sources)
            stats["total_raw"] = result.total_raw
            stats["total_deduplicated"] = result.total_deduplicated
            stats["conflicts_found"] = result.conflict_count

            # Log source stats
            for source_name, source_result in result.source_stats.items():
                if source_result.success:
                    log(f"    {source_name}: {source_result.candidate_count} candidates")
                else:
                    log(f"    {source_name}: FAILED - {source_result.error}")
                    stats["errors"].append(f"{source_name}: {source_result.error}")

            # Sync to sheets if not dry run
            if not self.dry_run and result.candidates:
                integration = DiscoverySheetIntegration(self.sheets)
                sync_result = integration.sync_discovered_candidates(result.candidates)

                stats["total_added"] = len(sync_result.added)
                stats["total_updated"] = len(sync_result.updated)

                if sync_result.errors:
                    stats["errors"].extend(sync_result.errors)

            # Log conflicts for review
            if result.conflicts:
                log(f"  CONFLICTS requiring review:")
                for conflict in result.conflicts[:5]:  # Show first 5
                    log(f"    - {conflict.candidate_name} ({conflict.district_id}): "
                        f"{conflict.conflict_type} - {conflict.notes[:50]}...")

            # Generate coverage report
            reporter = CoverageReporter()
            coverage_report = reporter.generate_report(
                result,
                chambers=["house", "senate"],
                new_count=stats["total_added"],
                updated_count=stats["total_updated"],
            )

            # Log coverage summary
            log(f"  Coverage Report:")
            log(f"    {format_summary_line(coverage_report)}")

            # Store coverage report in stats for email
            stats["coverage_report"] = {
                "coverage_percentage": coverage_report.coverage_percentage(),
                "districts_with_candidates": coverage_report.districts_with_candidates,
                "total_districts": coverage_report.total_districts,
                "candidates_by_party": coverage_report.candidates_by_party,
                "candidates_by_source": coverage_report.candidates_by_source,
                "districts_without_candidates_count": len(coverage_report.districts_without_candidates),
            }

            # Update discovery state
            self._save_discovery_state()
            self.discovery_results = result
            self.coverage_report = coverage_report

        except Exception as e:
            log(f"  Discovery error: {e}")
            stats["errors"].append(str(e))

        return stats

    def _save_discovery_state(self) -> None:
        """Save discovery state to track last run time."""
        try:
            CACHE_DIR.mkdir(parents=True, exist_ok=True)
            state = {
                "last_run": datetime.now(timezone.utc).isoformat(),
                "version": "1.0",
            }
            with open(self.DISCOVERY_STATE_FILE, "w") as f:
                json.dump(state, f, indent=2)
        except Exception as e:
            log(f"  Warning: Could not save discovery state: {e}")

    def _load_cached_scrape(self, path: str) -> list[dict]:
        """Load cached scrape data from JSON file."""
        try:
            with open(path) as f:
                data = json.load(f)

            # Handle different data formats
            if "reports_with_metadata" in data:
                reports = data["reports_with_metadata"]
                return [
                    {"report_id": rid, **rdata}
                    for rid, rdata in reports.items()
                ]
            elif isinstance(data, list):
                return data
            else:
                log(f"  Unknown data format in {path}")
                return []

        except FileNotFoundError:
            log(f"  Cached scrape file not found: {path}")
            return []
        except Exception as e:
            log(f"  Error loading cached scrape: {e}")
            return []

    def _scrape_ethics(self) -> list[dict]:
        """
        Scrape ethics website for new filings.

        This would call the scraper from scripts/scrape-ethics.py.
        For now, returns empty list - implement actual scraping integration.
        """
        log("  NOTE: Direct scraping not implemented - use --skip-scrape with cached data")
        return []

    def _load_incumbents(self, path: str = None) -> dict:
        """Load incumbents data from JSON file."""
        if path:
            incumbent_path = Path(path)
        else:
            # Try common locations
            possible_paths = [
                DATA_DIR / "incumbents.json",
                Path("src/data/incumbents.json"),
                Path("public/data/incumbents.json"),
            ]
            incumbent_path = None
            for p in possible_paths:
                if p.exists():
                    incumbent_path = p
                    break

        if not incumbent_path or not incumbent_path.exists():
            log("  No incumbents file found")
            return {}

        try:
            with open(incumbent_path) as f:
                return json.load(f)
        except Exception as e:
            log(f"  Error loading incumbents: {e}")
            return {}

    def _count_incumbents(self, incumbents: dict) -> int:
        """Count total incumbents."""
        count = 0
        for chamber in ["house", "senate"]:
            count += len(incumbents.get(chamber, {}))
        return count

    def _process_candidates(
        self,
        ethics_data: list[dict],
        incumbents: dict,
    ) -> dict:
        """
        Process candidates: enrich with party detection, check incumbency.

        Args:
            ethics_data: List of ethics filing records.
            incumbents: Dict of incumbent data by chamber/district.

        Returns:
            Summary dict with processing counts.
        """
        results = {
            "new": 0,
            "updated": 0,
            "skipped": 0,
            "party_detections": 0,
        }

        for filing in ethics_data:
            report_id = filing.get("report_id", "")
            candidate_name = filing.get("candidate_name", "")
            office = filing.get("office", "")

            # Extract district info
            chamber, district_num = self._extract_district(office)
            if not chamber or not district_num:
                continue

            district_id = f"SC-{chamber.capitalize()}-{district_num:03d}"

            # Check if candidate exists and is locked
            existing = self.sheet_state.get(report_id, {})
            if existing.get("party_locked"):
                results["skipped"] += 1
                continue

            # Check if candidate is incumbent
            is_incumbent = self._check_incumbent(
                candidate_name,
                incumbents,
                chamber,
                district_num,
            )

            # Get party - from incumbent data or detection
            detected_party = None
            detection_confidence = "UNKNOWN"
            detection_source = None
            detection_evidence_url = None

            # First, check if incumbent and use that party
            if is_incumbent:
                incumbent_info = incumbents.get(chamber, {}).get(str(district_num), {})
                if incumbent_info.get("party"):
                    party_code = incumbent_info["party"]
                    detected_party = "D" if "dem" in party_code.lower() else "R" if "rep" in party_code.lower() else party_code[0].upper()
                    detection_confidence = "HIGH"
                    detection_source = "incumbent_match"
                    results["party_detections"] += 1

            # If not incumbent and no existing detection, try party detection
            if not detected_party and not existing.get("detected_party"):
                if FIRECRAWL_API_KEY:
                    from .party_detector import PartyDetector
                    detector = PartyDetector(firecrawl_api_key=FIRECRAWL_API_KEY)
                    result = detector.detect_party(candidate_name, district_id)
                    if result.detected_party:
                        detected_party = result.detected_party
                        detection_confidence = result.confidence
                        detection_source = result.source
                        detection_evidence_url = result.evidence_url
                        results["party_detections"] += 1
                        log(f"    Party detected for {candidate_name}: {detected_party} ({detection_confidence})")

            # Build candidate record
            candidate = {
                "report_id": report_id,
                "candidate_name": candidate_name,
                "district_id": district_id,
                "filed_date": filing.get("filed_date", ""),
                "ethics_report_url": filing.get("url", ""),
                "is_incumbent": is_incumbent,
                "detected_party": detected_party or existing.get("detected_party"),
                "detection_confidence": detection_confidence if detected_party else existing.get("detection_confidence", "UNKNOWN"),
                "detection_source": detection_source or existing.get("detection_source"),
                "detection_evidence_url": detection_evidence_url or existing.get("detection_evidence_url"),
            }

            if report_id in self.sheet_state:
                self.updated_candidates.append(candidate)
                results["updated"] += 1
            else:
                self.new_candidates.append(candidate)
                results["new"] += 1

        return results

    def _extract_district(self, office: str) -> tuple[Optional[str], Optional[int]]:
        """Extract chamber and district number from office string."""
        office_lower = office.lower()

        if "house" in office_lower:
            chamber = "house"
        elif "senate" in office_lower:
            chamber = "senate"
        else:
            return None, None

        match = re.search(r'district\s*(\d+)', office_lower)
        if match:
            return chamber, int(match.group(1))

        return chamber, None

    def _check_incumbent(
        self,
        candidate_name: str,
        incumbents: dict,
        chamber: str,
        district_num: int,
    ) -> bool:
        """Check if candidate is the incumbent for their district."""
        incumbent_info = incumbents.get(chamber, {}).get(str(district_num), {})
        if not incumbent_info:
            return False

        incumbent_name = incumbent_info.get("name", "").lower()
        candidate_lower = candidate_name.lower()

        # Exact match
        if candidate_lower == incumbent_name:
            return True

        # Last name match
        candidate_parts = candidate_lower.split()
        incumbent_parts = incumbent_name.split()
        if candidate_parts and incumbent_parts:
            if candidate_parts[-1] == incumbent_parts[-1]:
                return True

        return False

    def _send_notification_email(self) -> bool:
        """
        Send notification email for new candidates.

        Includes party badges when final_party is known.
        """
        if not EMAIL_TO or not RESEND_API_KEY:
            log("  Email not configured (missing EMAIL_TO or RESEND_API_KEY)")
            return False

        try:
            import resend
            resend.api_key = RESEND_API_KEY

            # Build email content
            subject = f"SC Ethics Monitor: {len(self.new_candidates)} New Filings"
            html_content = self._build_email_html()

            # Send email
            resend.Emails.send({
                "from": EMAIL_FROM,
                "to": EMAIL_TO.split(","),
                "subject": subject,
                "html": html_content,
            })

            log(f"  Email sent to {EMAIL_TO}")
            return True

        except ImportError:
            log("  Resend package not installed")
            return False
        except Exception as e:
            log(f"  Error sending email: {e}")
            return False

    def _build_email_html(self) -> str:
        """Build HTML content for notification email."""
        html = """
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; }
                .candidate { margin: 10px 0; padding: 10px; border-left: 4px solid #ccc; }
                .dem { border-color: #2563eb; }
                .rep { border-color: #dc2626; }
                .party-badge {
                    display: inline-block;
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: bold;
                    margin-left: 8px;
                }
                .badge-d { background: #dbeafe; color: #1d4ed8; }
                .badge-r { background: #fee2e2; color: #b91c1c; }
                .badge-unknown { background: #f3f4f6; color: #6b7280; }
            </style>
        </head>
        <body>
            <h2>New SC Ethics Commission Filings</h2>
            <p>The following candidates filed Initial Reports:</p>
        """

        for candidate in self.new_candidates:
            name = candidate.get("candidate_name", "Unknown")
            district = candidate.get("district_id", "Unknown")
            filed_date = candidate.get("filed_date", "")
            ethics_url = candidate.get("ethics_report_url", "")

            # Get final party (prefer manual override if in sheet state)
            report_id = candidate.get("report_id", "")
            existing = self.sheet_state.get(report_id, {})
            final_party = existing.get("manual_party_override") or candidate.get("detected_party", "")

            # Build party badge
            if final_party == "D":
                badge_class = "badge-d"
                badge_text = "(D)"
                card_class = "dem"
            elif final_party == "R":
                badge_class = "badge-r"
                badge_text = "(R)"
                card_class = "rep"
            else:
                badge_class = "badge-unknown"
                badge_text = ""
                card_class = ""

            html += f"""
            <div class="candidate {card_class}">
                <strong>{name}</strong>
                {f'<span class="party-badge {badge_class}">{badge_text}</span>' if badge_text else ''}
                <br>
                <small>District: {district}</small><br>
                <small>Filed: {filed_date}</small><br>
                {f'<a href="{ethics_url}">View Filing</a>' if ethics_url else ''}
            </div>
            """

        # Add discovery section if we have coverage data
        if self.coverage_report:
            from .candidate_discovery.reporter import format_email_section
            html += """
            <hr>
            <h2>Candidate Discovery</h2>
            """
            html += format_email_section(self.coverage_report, show_districts_without=5)

        html += """
            <hr>
            <p><small>
                <a href="https://docs.google.com/spreadsheets/d/17j_KFZFUw-ESBQlKlIccUMpGCFq_XdeL6WYph7zkxQo/edit">
                    View Full Dashboard
                </a>
            </small></p>
        </body>
        </html>
        """

        return html

    def _preview_email(self) -> None:
        """Preview email content for dry run."""
        if not self.new_candidates:
            log("  No new candidates for email preview")
            return

        log("  EMAIL PREVIEW:")
        log(f"  Subject: SC Ethics Monitor: {len(self.new_candidates)} New Filings")
        log("  Candidates:")
        for candidate in self.new_candidates[:5]:  # Show first 5
            name = candidate.get("candidate_name", "Unknown")
            district = candidate.get("district_id", "Unknown")
            party = candidate.get("detected_party", "?")
            log(f"    - {name} ({party}) - {district}")
        if len(self.new_candidates) > 5:
            log(f"    ... and {len(self.new_candidates) - 5} more")


def main():
    """Main entry point for monitor CLI."""
    parser = argparse.ArgumentParser(
        description="SC Ethics Monitor - Daily monitoring and notifications",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python -m src.monitor                         # Full daily run
    python -m src.monitor --dry-run               # Test without changes
    python -m src.monitor --skip-scrape --scrape-data data/ethics.json
    python -m src.monitor --force-discovery       # Force candidate discovery now
        """
    )

    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Test run without modifying sheets or sending emails",
    )
    parser.add_argument(
        "--skip-scrape",
        action="store_true",
        help="Skip scraping, use cached data",
    )
    parser.add_argument(
        "--scrape-data",
        help="Path to cached scrape data JSON",
    )
    parser.add_argument(
        "--incumbents",
        help="Path to incumbents JSON",
    )
    parser.add_argument(
        "--credentials",
        help="Path to Google service account credentials JSON",
    )
    parser.add_argument(
        "--force-discovery",
        action="store_true",
        help="Force candidate discovery regardless of schedule",
    )

    args = parser.parse_args()

    monitor = EthicsMonitor(
        credentials_path=args.credentials,
        dry_run=args.dry_run,
        force_discovery=args.force_discovery,
    )

    results = monitor.run_daily_monitor(
        skip_scrape=args.skip_scrape,
        scrape_data_path=args.scrape_data,
        incumbents_path=args.incumbents,
    )

    # Exit with error code if there were errors
    if results.get("errors"):
        sys.exit(1)


if __name__ == "__main__":
    main()
