"""
SC Ethics Monitor - Google Sheets Source of Truth

A bidirectional sync system for tracking South Carolina legislative candidates
from the SC Ethics Commission filings to a Google Sheets dashboard.

Key Features:
- Reads AND writes to Google Sheets (not just write-only logging)
- Respects manual_party_override entries
- Honors party_locked flag to skip re-detection
- Uses final_party (computed) for all analysis
- Populates research queue for unknown parties
- Sends email notifications with party badges

Usage:
    from src.sheets_sync import SheetsSync
    from src.monitor import EthicsMonitor

    # Quick sync
    sync = SheetsSync()
    sync.connect()
    state = sync.read_sheet_state()

    # Daily monitor
    monitor = EthicsMonitor()
    monitor.run_daily_monitor()
"""

from .config import (
    SPREADSHEET_ID,
    TAB_CANDIDATES,
    TAB_DISTRICTS,
    TAB_RACE_ANALYSIS,
    TAB_RESEARCH_QUEUE,
    TAB_SYNC_LOG,
)
from .sheets_sync import SheetsSync, quick_sync
from .monitor import EthicsMonitor

__version__ = "1.0.0"
__all__ = [
    "SheetsSync",
    "quick_sync",
    "EthicsMonitor",
    "SPREADSHEET_ID",
    "TAB_CANDIDATES",
    "TAB_DISTRICTS",
    "TAB_RACE_ANALYSIS",
    "TAB_RESEARCH_QUEUE",
    "TAB_SYNC_LOG",
]
