"""
Sheet Formatting - Professional formatting for SC Ethics Monitor Google Sheets.

Handles:
- Frozen headers
- Conditional formatting (party colors, confidence levels)
- Data validation dropdowns
- Filter views
"""

try:
    import gspread
    from gspread_formatting import (
        set_frozen,
        format_cell_range,
        CellFormat,
        Color,
        TextFormat,
        DataValidationRule,
        BooleanCondition,
        set_data_validation_for_cell_range,
        get_conditional_format_rules,
        ConditionalFormatRule,
        BooleanRule,
        GridRange,
    )
except ImportError:
    print("Required packages not installed. Run: pip install gspread gspread-formatting")
    raise

from .config import (
    TAB_CANDIDATES,
    TAB_DISTRICTS,
    TAB_RACE_ANALYSIS,
    TAB_RESEARCH_QUEUE,
    TAB_SYNC_LOG,
    CANDIDATES_COLUMNS,
    RACE_ANALYSIS_COLUMNS,
    RESEARCH_QUEUE_COLUMNS,
    PARTY_CODES,
    CONFIDENCE_LEVELS,
    RESEARCH_STATUSES,
)


# Color definitions (RGB values 0-1)
COLORS = {
    # Party colors
    "dem_blue": Color(0.86, 0.91, 0.99),         # #DBEAFE - Light blue
    "rep_red": Color(0.996, 0.886, 0.886),       # #FEE2E2 - Light red
    "ind_gray": Color(0.953, 0.957, 0.965),      # #F3F4F6 - Light gray

    # Confidence colors
    "high_green": Color(0.863, 0.988, 0.906),    # #DCFCE7 - Light green
    "medium_yellow": Color(0.996, 0.953, 0.78),  # #FEF3C7 - Light yellow
    "low_orange": Color(1, 0.929, 0.835),        # #FFEDD5 - Light orange
    "unknown_red": Color(0.996, 0.886, 0.886),   # #FEE2E2 - Light red

    # Header
    "header_gray": Color(0.9, 0.9, 0.9),         # Light gray header

    # Priority colors
    "high_priority": Color(0.996, 0.886, 0.886), # Light red for high priority
    "open_seat": Color(1, 0.929, 0.835),         # Light orange
    "monitor": Color(0.996, 0.953, 0.78),        # Light yellow
    "low_priority": Color(0.863, 0.988, 0.906),  # Light green
}


class SheetFormatter:
    """
    Apply professional formatting to SC Ethics Monitor sheets.
    """

    def __init__(self, spreadsheet: gspread.Spreadsheet):
        """
        Initialize formatter with spreadsheet.

        Args:
            spreadsheet: gspread Spreadsheet object.
        """
        self.spreadsheet = spreadsheet

    def format_all_tabs(self) -> dict:
        """
        Apply formatting to all tabs.

        Returns:
            Summary dict with tabs formatted and any errors.
        """
        results = {"tabs_formatted": 0, "errors": []}

        formatters = [
            (TAB_CANDIDATES, self.format_candidates_tab),
            (TAB_DISTRICTS, self.format_districts_tab),
            (TAB_RACE_ANALYSIS, self.format_race_analysis_tab),
            (TAB_RESEARCH_QUEUE, self.format_research_queue_tab),
            (TAB_SYNC_LOG, self.format_sync_log_tab),
        ]

        for tab_name, formatter in formatters:
            try:
                worksheet = self.spreadsheet.worksheet(tab_name)
                formatter(worksheet)
                results["tabs_formatted"] += 1
            except gspread.WorksheetNotFound:
                results["errors"].append(f"Tab not found: {tab_name}")
            except Exception as e:
                results["errors"].append(f"Error formatting {tab_name}: {e}")

        return results

    def format_candidates_tab(self, worksheet: gspread.Worksheet) -> None:
        """
        Apply formatting to Candidates tab.

        - Freeze header row
        - Party color conditional formatting (final_party column)
        - Confidence color conditional formatting
        - Data validation dropdowns
        """
        # 1. Freeze header row
        set_frozen(worksheet, rows=1)

        # 2. Format header row
        header_format = CellFormat(
            backgroundColor=COLORS["header_gray"],
            textFormat=TextFormat(bold=True),
        )
        format_cell_range(worksheet, "1:1", header_format)

        # 3. Add conditional formatting for party colors
        # final_party is column L (index 11, so column 12 in 1-based)
        final_party_col = CANDIDATES_COLUMNS["final_party"] + 1  # Convert to 1-based

        self._add_party_conditional_formatting(
            worksheet,
            col_index=final_party_col,
            start_row=2,
        )

        # 4. Add conditional formatting for confidence levels
        # detection_confidence is column H (index 7, so column 8 in 1-based)
        confidence_col = CANDIDATES_COLUMNS["detection_confidence"] + 1

        self._add_confidence_conditional_formatting(
            worksheet,
            col_index=confidence_col,
            start_row=2,
        )

        # 5. Add data validation dropdowns
        # manual_party_override (column K) - D, R, I, O
        override_col_letter = self._col_letter(CANDIDATES_COLUMNS["manual_party_override"])
        self._add_dropdown_validation(
            worksheet,
            range_notation=f"{override_col_letter}2:{override_col_letter}1000",
            values=["", "D", "R", "I", "O"],
        )

        # party_locked (column M) - Yes or blank
        locked_col_letter = self._col_letter(CANDIDATES_COLUMNS["party_locked"])
        self._add_dropdown_validation(
            worksheet,
            range_notation=f"{locked_col_letter}2:{locked_col_letter}1000",
            values=["", "Yes"],
        )

    def format_districts_tab(self, worksheet: gspread.Worksheet) -> None:
        """Apply formatting to Districts tab."""
        # Freeze header row
        set_frozen(worksheet, rows=1)

        # Format header
        header_format = CellFormat(
            backgroundColor=COLORS["header_gray"],
            textFormat=TextFormat(bold=True),
        )
        format_cell_range(worksheet, "1:1", header_format)

        # Add party conditional formatting for incumbent_party (column F)
        incumbent_party_col = DISTRICTS_COLUMNS["incumbent_party"] + 1
        self._add_party_conditional_formatting(
            worksheet,
            col_index=incumbent_party_col,
            start_row=2,
        )

    def format_race_analysis_tab(self, worksheet: gspread.Worksheet) -> None:
        """Apply formatting to Race Analysis tab."""
        # Freeze header row
        set_frozen(worksheet, rows=1)

        # Format header
        header_format = CellFormat(
            backgroundColor=COLORS["header_gray"],
            textFormat=TextFormat(bold=True),
        )
        format_cell_range(worksheet, "1:1", header_format)

        # Add party conditional formatting for incumbent_party (column D)
        incumbent_party_col = RACE_ANALYSIS_COLUMNS["incumbent_party"] + 1
        self._add_party_conditional_formatting(
            worksheet,
            col_index=incumbent_party_col,
            start_row=2,
        )

        # Add conditional formatting for recruitment_priority (column I)
        priority_col = RACE_ANALYSIS_COLUMNS["recruitment_priority"] + 1
        self._add_priority_conditional_formatting(
            worksheet,
            col_index=priority_col,
            start_row=2,
        )

    def format_research_queue_tab(self, worksheet: gspread.Worksheet) -> None:
        """Apply formatting to Research Queue tab."""
        # Freeze header row
        set_frozen(worksheet, rows=1)

        # Format header
        header_format = CellFormat(
            backgroundColor=COLORS["header_gray"],
            textFormat=TextFormat(bold=True),
        )
        format_cell_range(worksheet, "1:1", header_format)

        # Add status dropdown validation
        status_col_letter = self._col_letter(RESEARCH_QUEUE_COLUMNS["status"])
        self._add_dropdown_validation(
            worksheet,
            range_notation=f"{status_col_letter}2:{status_col_letter}1000",
            values=RESEARCH_STATUSES,
        )

        # Add confidence conditional formatting
        confidence_col = RESEARCH_QUEUE_COLUMNS["confidence"] + 1
        self._add_confidence_conditional_formatting(
            worksheet,
            col_index=confidence_col,
            start_row=2,
        )

    def format_sync_log_tab(self, worksheet: gspread.Worksheet) -> None:
        """Apply formatting to Sync Log tab."""
        # Freeze header row
        set_frozen(worksheet, rows=1)

        # Format header
        header_format = CellFormat(
            backgroundColor=COLORS["header_gray"],
            textFormat=TextFormat(bold=True),
        )
        format_cell_range(worksheet, "1:1", header_format)

    def _add_party_conditional_formatting(
        self,
        worksheet: gspread.Worksheet,
        col_index: int,
        start_row: int = 2,
    ) -> None:
        """
        Add conditional formatting for party columns.

        D = Blue, R = Red, I/O = Gray
        """
        sheet_id = worksheet.id

        # Build rules
        rules = []

        # Democrat - Blue
        rules.append(
            ConditionalFormatRule(
                ranges=[GridRange.from_a1_range(
                    f"{self._col_letter(col_index - 1)}{start_row}:{self._col_letter(col_index - 1)}1000",
                    worksheet
                )],
                booleanRule=BooleanRule(
                    condition=BooleanCondition("TEXT_EQ", ["D"]),
                    format=CellFormat(backgroundColor=COLORS["dem_blue"]),
                ),
            )
        )

        # Republican - Red
        rules.append(
            ConditionalFormatRule(
                ranges=[GridRange.from_a1_range(
                    f"{self._col_letter(col_index - 1)}{start_row}:{self._col_letter(col_index - 1)}1000",
                    worksheet
                )],
                booleanRule=BooleanRule(
                    condition=BooleanCondition("TEXT_EQ", ["R"]),
                    format=CellFormat(backgroundColor=COLORS["rep_red"]),
                ),
            )
        )

        # Independent - Gray
        rules.append(
            ConditionalFormatRule(
                ranges=[GridRange.from_a1_range(
                    f"{self._col_letter(col_index - 1)}{start_row}:{self._col_letter(col_index - 1)}1000",
                    worksheet
                )],
                booleanRule=BooleanRule(
                    condition=BooleanCondition("TEXT_EQ", ["I"]),
                    format=CellFormat(backgroundColor=COLORS["ind_gray"]),
                ),
            )
        )

        # Other - Gray
        rules.append(
            ConditionalFormatRule(
                ranges=[GridRange.from_a1_range(
                    f"{self._col_letter(col_index - 1)}{start_row}:{self._col_letter(col_index - 1)}1000",
                    worksheet
                )],
                booleanRule=BooleanRule(
                    condition=BooleanCondition("TEXT_EQ", ["O"]),
                    format=CellFormat(backgroundColor=COLORS["ind_gray"]),
                ),
            )
        )

        # Apply rules
        existing_rules = get_conditional_format_rules(worksheet)
        existing_rules.extend(rules)
        existing_rules.save()

    def _add_confidence_conditional_formatting(
        self,
        worksheet: gspread.Worksheet,
        col_index: int,
        start_row: int = 2,
    ) -> None:
        """
        Add conditional formatting for confidence columns.

        HIGH = Green, MEDIUM = Yellow, LOW = Orange, UNKNOWN = Red
        """
        rules = []

        confidence_colors = {
            "HIGH": COLORS["high_green"],
            "MEDIUM": COLORS["medium_yellow"],
            "LOW": COLORS["low_orange"],
            "UNKNOWN": COLORS["unknown_red"],
        }

        for level, color in confidence_colors.items():
            rules.append(
                ConditionalFormatRule(
                    ranges=[GridRange.from_a1_range(
                        f"{self._col_letter(col_index - 1)}{start_row}:{self._col_letter(col_index - 1)}1000",
                        worksheet
                    )],
                    booleanRule=BooleanRule(
                        condition=BooleanCondition("TEXT_EQ", [level]),
                        format=CellFormat(backgroundColor=color),
                    ),
                )
            )

        existing_rules = get_conditional_format_rules(worksheet)
        existing_rules.extend(rules)
        existing_rules.save()

    def _add_priority_conditional_formatting(
        self,
        worksheet: gspread.Worksheet,
        col_index: int,
        start_row: int = 2,
    ) -> None:
        """
        Add conditional formatting for recruitment priority.
        """
        rules = []

        priority_colors = {
            "High-D-Recruit": COLORS["high_priority"],
            "Open-Seat": COLORS["open_seat"],
            "Monitor": COLORS["monitor"],
            "Low": COLORS["low_priority"],
        }

        for priority, color in priority_colors.items():
            rules.append(
                ConditionalFormatRule(
                    ranges=[GridRange.from_a1_range(
                        f"{self._col_letter(col_index - 1)}{start_row}:{self._col_letter(col_index - 1)}1000",
                        worksheet
                    )],
                    booleanRule=BooleanRule(
                        condition=BooleanCondition("TEXT_EQ", [priority]),
                        format=CellFormat(backgroundColor=color),
                    ),
                )
            )

        existing_rules = get_conditional_format_rules(worksheet)
        existing_rules.extend(rules)
        existing_rules.save()

    def _add_dropdown_validation(
        self,
        worksheet: gspread.Worksheet,
        range_notation: str,
        values: list[str],
    ) -> None:
        """
        Add dropdown data validation to a range.

        Args:
            worksheet: Target worksheet.
            range_notation: A1 notation for the range (e.g., "K2:K1000").
            values: List of allowed values.
        """
        validation_rule = DataValidationRule(
            BooleanCondition("ONE_OF_LIST", values),
            showCustomUi=True,
        )
        set_data_validation_for_cell_range(worksheet, range_notation, validation_rule)

    def _col_letter(self, col_index: int) -> str:
        """Convert 0-based column index to letter."""
        return chr(ord('A') + col_index)

    def create_filter_views(self) -> dict:
        """
        Create named filter views for the Candidates tab.

        Filter views:
        - "Needs Research": confidence=LOW/UNKNOWN AND party_locked=blank
        - "Manual Overrides": manual_party_override is not blank
        - "Democrats": final_party=D
        - "Republicans": final_party=R

        Returns:
            Dict with filter views created.
        """
        # Note: Creating named filter views requires Sheets API v4 directly
        # gspread doesn't fully support this, so we'll document the filters
        # to be created manually or via API calls

        filter_views = {
            "Needs Research": {
                "description": "Candidates with LOW/UNKNOWN confidence, not party_locked",
                "criteria": {
                    "detection_confidence": ["LOW", "UNKNOWN"],
                    "party_locked": ["", None],
                }
            },
            "Manual Overrides": {
                "description": "Candidates with manual party override set",
                "criteria": {
                    "manual_party_override": "NOT_BLANK",
                }
            },
            "Democrats": {
                "description": "Candidates with final_party=D",
                "criteria": {
                    "final_party": ["D"],
                }
            },
            "Republicans": {
                "description": "Candidates with final_party=R",
                "criteria": {
                    "final_party": ["R"],
                }
            },
        }

        return {
            "status": "filter_views_defined",
            "views": filter_views,
            "note": "Use Google Sheets UI or Sheets API to create named filter views"
        }

    def add_final_party_formulas(self, worksheet: gspread.Worksheet) -> int:
        """
        Add final_party formula to all data rows.

        Formula: =IF(K{row}<>"",K{row},G{row})
        This makes manual_party_override take precedence over detected_party.

        Returns:
            Number of formulas added.
        """
        all_values = worksheet.get_all_values()

        if len(all_values) <= 1:
            return 0

        # Build formula updates
        final_party_col = self._col_letter(CANDIDATES_COLUMNS["final_party"])
        manual_col = self._col_letter(CANDIDATES_COLUMNS["manual_party_override"])
        detected_col = self._col_letter(CANDIDATES_COLUMNS["detected_party"])

        updates = []
        for row_num in range(2, len(all_values) + 1):
            formula = f'=IF({manual_col}{row_num}<>"",{manual_col}{row_num},{detected_col}{row_num})'
            updates.append({
                "range": f"{final_party_col}{row_num}",
                "values": [[formula]]
            })

        if updates:
            worksheet.batch_update(updates, value_input_option="USER_ENTERED")

        return len(updates)


def format_spreadsheet(spreadsheet: gspread.Spreadsheet) -> dict:
    """
    Convenience function to format entire spreadsheet.

    Args:
        spreadsheet: gspread Spreadsheet object.

    Returns:
        Formatting results.
    """
    formatter = SheetFormatter(spreadsheet)
    return formatter.format_all_tabs()
