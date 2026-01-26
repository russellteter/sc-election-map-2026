"""
SC Ethics Monitor - Daily monitoring system.

Integrates:
- Ethics Commission website scraping
- Google Sheets sync (3-tab structure + Source of Truth)
- Party detection (writes directly to 'party' column)
- Source of Truth tab sync (district-centric view)
- Email notifications
- Web app export

7-step workflow:
1. Connect to Google Sheets
2. Read existing candidates
3. Get ethics filing data
4. Process candidates with party detection
5. Sync to Candidates tab
6. Update race analysis
7. Sync to Source of Truth tab

Usage:
    python -m src.monitor                    # Full daily run
    python -m src.monitor --dry-run          # Test without changes
    python -m src.monitor --skip-scrape      # Use cached scrape data
    python -m src.monitor --export-webapp    # Export to webapp after sync
"""

import argparse
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
    Daily ethics monitoring system.

    Workflow (7 steps):
    1. Connect to Google Sheets
    2. Read existing candidates (to preserve manual party edits)
    3. Get ethics filing data (scrape or cached)
    4. Process candidates with party detection
    5. Sync to Candidates tab
    6. Update Race Analysis tab
    7. Sync to Source of Truth tab (district-centric view)
    """

    def __init__(
        self,
        credentials_path: str = None,
        dry_run: bool = False,
    ):
        """
        Initialize EthicsMonitor.

        Args:
            credentials_path: Path to Google service account credentials.
            dry_run: If True, don't modify sheets or send emails.
        """
        self.sheets = SheetsSync(credentials_path)
        self.dry_run = dry_run
        self.existing_candidates = {}
        self.new_candidates = []
        self.updated_candidates = []

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
        Run the simplified daily monitoring workflow.

        Args:
            skip_scrape: If True, use cached scrape data instead of scraping.
            scrape_data_path: Path to cached scrape data JSON.
            incumbents_path: Path to incumbents JSON for enrichment.

        Returns:
            Summary dict with results.
        """
        log("=" * 60)
        log("SC Ethics Monitor - Daily Run (Simplified)")
        log(f"Dry run: {self.dry_run}")
        log("=" * 60)

        results = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "dry_run": self.dry_run,
            "candidates_found": 0,
            "new_candidates": 0,
            "updated_candidates": 0,
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

            # Step 2: Read existing candidates
            log("Step 2: Reading existing candidates...")
            if not self.dry_run:
                self.existing_candidates = self.sheets.read_candidates()
                log(f"  Found {len(self.existing_candidates)} existing candidates")
            else:
                self.existing_candidates = {}

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

            # Step 4: Load incumbents and process candidates
            log("Step 4: Processing candidates with party detection...")
            incumbents = self._load_incumbents(incumbents_path)
            log(f"  Loaded {self._count_incumbents(incumbents)} incumbents")

            processed = self._process_candidates(ethics_data, incumbents)
            results["new_candidates"] = processed["new"]
            results["updated_candidates"] = processed["updated"]
            results["party_detections"] = processed["party_detections"]

            # Step 5: Sync to Google Sheets
            log("Step 5: Syncing to Google Sheets...")
            if not self.dry_run:
                all_candidates = self.new_candidates + self.updated_candidates
                sync_results = self.sheets.sync_candidates(
                    all_candidates,
                    existing_candidates=self.existing_candidates,
                )
                log(f"  Added: {sync_results['added']}, Updated: {sync_results['updated']}")
            else:
                log("  DRY RUN: Skipping sheet sync")

            # Step 6: Update race analysis
            log("Step 6: Updating race analysis...")
            if not self.dry_run:
                # Get districts data for race analysis
                districts = self.sheets.get_districts()
                analysis_results = self.sheets.update_race_analysis(districts)
                log(f"  Analyzed {analysis_results['districts_analyzed']} districts")
                log(f"  Districts needing D candidate: {analysis_results['needs_dem_candidates']}")
            else:
                log("  DRY RUN: Skipping race analysis update")

            # Step 7: Sync to Source of Truth tab
            log("Step 7: Syncing to Source of Truth...")
            if not self.dry_run:
                # Re-read candidates after sync to get latest data
                updated_candidates = self.sheets.read_candidates()
                sot_results = self.sheets.sync_to_source_of_truth(updated_candidates)
                log(f"  Updated {sot_results['rows_updated']} district rows")
                log(f"  D candidates: {sot_results['dem_candidates']}, R: {sot_results['rep_candidates']}")
                if sot_results['new_candidates_flagged'] > 0:
                    log(f"  New candidates flagged: {sot_results['new_candidates_flagged']}")
                if sot_results['errors']:
                    for err in sot_results['errors']:
                        log(f"  Warning: {err}")
            else:
                log("  DRY RUN: Skipping Source of Truth sync")

            # Optional: Send notification email for new candidates
            if self.new_candidates and not self.dry_run:
                log("Sending notification email...")
                email_sent = self._send_notification_email()
                results["email_sent"] = email_sent
            elif self.new_candidates and self.dry_run:
                log("DRY RUN: Would send email for new candidates")
                self._preview_email()

        except Exception as e:
            log(f"ERROR: {e}")
            import traceback
            traceback.print_exc()
            results["errors"].append(str(e))

        log("=" * 60)
        log("Daily monitor complete")
        log(f"Results: {json.dumps(results, indent=2)}")
        log("=" * 60)

        return results

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

        This calls the scraper from scripts/scrape-ethics.py.
        For now, returns empty list - use --skip-scrape with cached data.
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

        Writes party directly to 'party' column. Preserves existing party
        values if candidate already has one (user may have manually edited).

        Args:
            ethics_data: List of ethics filing records.
            incumbents: Dict of incumbent data by chamber/district.

        Returns:
            Summary dict with processing counts.
        """
        results = {
            "new": 0,
            "updated": 0,
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

            # Check existing candidate data
            existing = self.existing_candidates.get(report_id, {})
            existing_party = existing.get("party")

            # Check if candidate is incumbent
            is_incumbent = self._check_incumbent(
                candidate_name,
                incumbents,
                chamber,
                district_num,
            )

            # Determine party
            party = None

            # First, preserve existing party if set (user may have edited)
            if existing_party:
                party = existing_party
            # Second, check if incumbent and use that party
            elif is_incumbent:
                incumbent_info = incumbents.get(chamber, {}).get(str(district_num), {})
                if incumbent_info.get("party"):
                    party_code = incumbent_info["party"]
                    party = "D" if "dem" in party_code.lower() else "R" if "rep" in party_code.lower() else party_code[0].upper()
                    results["party_detections"] += 1
            # Third, try Firecrawl party detection
            elif FIRECRAWL_API_KEY:
                try:
                    from .party_detector import PartyDetector
                    detector = PartyDetector(firecrawl_api_key=FIRECRAWL_API_KEY)
                    result = detector.detect_party(candidate_name, district_id)
                    if result.detected_party:
                        party = result.detected_party
                        results["party_detections"] += 1
                        log(f"    Party detected for {candidate_name}: {party}")
                except Exception as e:
                    log(f"    Party detection error for {candidate_name}: {e}")

            # Build candidate record (simplified structure)
            candidate = {
                "district_id": district_id,
                "candidate_name": candidate_name,
                "party": party,
                "filed_date": filing.get("filed_date", ""),
                "report_id": report_id,
                "ethics_url": filing.get("url", "") or filing.get("ethics_report_url", ""),
                "is_incumbent": is_incumbent,
            }

            if report_id in self.existing_candidates:
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
        """Send notification email for new candidates."""
        if not EMAIL_TO or not RESEND_API_KEY:
            log("  Email not configured (missing EMAIL_TO or RESEND_API_KEY)")
            return False

        try:
            import resend
            resend.api_key = RESEND_API_KEY

            subject = f"SC Ethics Monitor: {len(self.new_candidates)} New Filings"
            html_content = self._build_email_html()

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
            ethics_url = candidate.get("ethics_url", "")
            party = candidate.get("party", "")

            if party == "D":
                badge_html = '<span class="party-badge badge-d">(D)</span>'
                card_class = "dem"
            elif party == "R":
                badge_html = '<span class="party-badge badge-r">(R)</span>'
                card_class = "rep"
            else:
                badge_html = ""
                card_class = ""

            html += f"""
            <div class="candidate {card_class}">
                <strong>{name}</strong>{badge_html}<br>
                <small>District: {district}</small><br>
                <small>Filed: {filed_date}</small><br>
                {f'<a href="{ethics_url}">View Filing</a>' if ethics_url else ''}
            </div>
            """

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
        for candidate in self.new_candidates[:5]:
            name = candidate.get("candidate_name", "Unknown")
            district = candidate.get("district_id", "Unknown")
            party = candidate.get("party", "?")
            log(f"    - {name} ({party}) - {district}")
        if len(self.new_candidates) > 5:
            log(f"    ... and {len(self.new_candidates) - 5} more")


def run_webapp_export(dry_run: bool = False) -> bool:
    """
    Export candidates to webapp candidates.json.

    Args:
        dry_run: If True, show what would be exported without writing.

    Returns:
        True if successful, False otherwise.
    """
    log("=" * 60)
    log("WEBAPP EXPORT")
    log("=" * 60)

    try:
        scripts_dir = Path(__file__).parent.parent / "scripts"
        sys.path.insert(0, str(scripts_dir))

        from export_to_webapp import export_candidates

        output_path = str(Path(__file__).parent.parent.parent / "public" / "data" / "candidates.json")

        if dry_run:
            log(f"  DRY RUN: Would export to {output_path}")
            return True

        success = export_candidates(output_path=output_path)
        if success:
            log(f"  Exported to {output_path}")
        else:
            log("  Export failed!")
        return success

    except ImportError as e:
        log(f"  Error: Could not import export_to_webapp: {e}")
        return False
    except Exception as e:
        log(f"  Export error: {e}")
        return False


def main():
    """Main entry point for monitor CLI."""
    parser = argparse.ArgumentParser(
        description="SC Ethics Monitor - Simplified daily monitoring",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python -m src.monitor                         # Full daily run
    python -m src.monitor --dry-run               # Test without changes
    python -m src.monitor --skip-scrape --scrape-data data/ethics.json
    python -m src.monitor --export-webapp         # Include webapp export
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
        "--export-webapp",
        action="store_true",
        help="Export candidates.json to public/data/ after sync",
    )

    args = parser.parse_args()

    monitor = EthicsMonitor(
        credentials_path=args.credentials,
        dry_run=args.dry_run,
    )

    results = monitor.run_daily_monitor(
        skip_scrape=args.skip_scrape,
        scrape_data_path=args.scrape_data,
        incumbents_path=args.incumbents,
    )

    # Run webapp export if requested
    if args.export_webapp:
        export_success = run_webapp_export(dry_run=args.dry_run)
        if not export_success:
            log("Warning: Webapp export failed")
            results.setdefault("errors", []).append("Webapp export failed")

    # Exit with error code if there were errors
    if results.get("errors"):
        sys.exit(1)


if __name__ == "__main__":
    main()
