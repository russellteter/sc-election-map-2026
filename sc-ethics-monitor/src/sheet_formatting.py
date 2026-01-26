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
    TAB_SOURCE_OF_TRUTH,
    CANDIDATES_COLUMNS,
    CANDIDATES_HEADERS,
    RACE_ANALYSIS_COLUMNS,
    RESEARCH_QUEUE_COLUMNS,
    DISTRICTS_COLUMNS,
    SOURCE_OF_TRUTH_COLUMNS,
    SOT_STATIC_DROPDOWNS,
    PARTY_CODES,
    CONFIDENCE_LEVELS,
    RESEARCH_STATUSES,
    FORMATTING_COLORS,
    PRIORITY_TIERS,
    FILTER_VIEWS,
    COLUMN_WIDTHS,
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
    "header_dark": Color(0.267, 0.267, 0.267),   # #444444 - Dark header

    # Priority colors
    "high_priority": Color(0.996, 0.886, 0.886), # Light red for high priority
    "open_seat": Color(1, 0.929, 0.835),         # Light orange
    "monitor": Color(0.996, 0.953, 0.78),        # Light yellow
    "low_priority": Color(0.863, 0.988, 0.906),  # Light green

    # Priority row colors (full row highlighting)
    "priority_high_red": Color(0.992, 0.851, 0.851),      # #FDD9D9 - Flip targets
    "priority_medium_yellow": Color(1.0, 0.973, 0.812),   # #FFF8CF - Defend
    "priority_covered_green": Color(0.851, 0.969, 0.878), # #D9F7E0 - Covered

    # Zebra striping
    "zebra_stripe": Color(0.965, 0.965, 0.965),           # #F6F6F6 - Very light gray

    # Challenger count gradient
    "challenger_0": Color(0.992, 0.851, 0.851),           # #FDD9D9 - Red (uncontested)
    "challenger_1_2": Color(1.0, 0.949, 0.8),             # #FFF2CC - Yellow (some)
    "challenger_3_plus": Color(0.835, 0.929, 0.827),      # #D5EDD3 - Green (competitive)

    # Filing recency colors
    "recent_7_days": Color(0.835, 0.929, 0.827),          # #D5EDD3 - Fresh filing
    "recent_30_days": Color(1.0, 0.949, 0.8),             # #FFF2CC - Recent filing
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
        Apply formatting to primary tabs (Candidates + Source of Truth).

        Note: Districts and Race Analysis tabs have been deprecated in favor
        of Source of Truth. This method only formats active tabs.

        Returns:
            Summary dict with tabs formatted and any errors.
        """
        results = {"tabs_formatted": 0, "errors": []}

        # Only format active tabs - Districts and Race Analysis are deprecated
        formatters = [
            (TAB_CANDIDATES, self.format_candidates_tab),
            (TAB_SOURCE_OF_TRUTH, self.format_source_of_truth_tab),
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

    def apply_all_improvements(self) -> dict:
        """
        Apply all formatting improvements at once.

        This is the main entry point for the improved formatting plan:
        1. Format all tabs with enhanced styling
        2. Create filter views
        3. Apply protected ranges

        Returns:
            Comprehensive summary of all formatting applied.
        """
        results = {
            "tabs_formatted": 0,
            "filter_views_created": 0,
            "ranges_protected": 0,
            "errors": [],
        }

        # 1. Format all tabs
        print("Applying tab formatting...")
        format_results = self.format_all_tabs()
        results["tabs_formatted"] = format_results["tabs_formatted"]
        results["errors"].extend(format_results.get("errors", []))

        # 2. Create filter views
        print("Creating filter views...")
        try:
            filter_results = self.create_filter_views()
            results["filter_views_created"] = filter_results.get("filter_views_created", 0)
            results["errors"].extend(filter_results.get("errors", []))
        except Exception as e:
            results["errors"].append(f"Filter views: {e}")

        # 3. Apply protected ranges
        print("Applying protected ranges...")
        try:
            protect_results = self.apply_protected_ranges()
            results["ranges_protected"] = protect_results.get("ranges_protected", 0)
            results["errors"].extend(protect_results.get("errors", []))
        except Exception as e:
            results["errors"].append(f"Protected ranges: {e}")

        return results

    def format_candidates_tab(self, worksheet: gspread.Worksheet) -> None:
        """
        Apply formatting to Candidates tab (9-column SIMPLIFIED structure).

        Simplified columns (A-I):
        A: district_id, B: candidate_name, C: party, D: filed_date,
        E: report_id, F: ethics_url, G: is_incumbent, H: notes, I: last_synced

        Includes:
        - Freeze header row
        - Dark header styling
        - Party color conditional formatting (column C)
        - Party dropdown validation (column C)
        - Filing recency colors (column D)
        - Zebra striping for all 9 columns
        - Optimized column widths
        """
        # 1. Clear existing conditional formatting to avoid duplicates
        self.clear_conditional_formatting(worksheet)

        # 2. Freeze header row
        set_frozen(worksheet, rows=1)

        # 3. Format header row with dark background
        header_format = CellFormat(
            backgroundColor=COLORS["header_dark"],
            textFormat=TextFormat(bold=True, foregroundColor=Color(1, 1, 1)),
        )
        format_cell_range(worksheet, "1:1", header_format)

        # 4. Add conditional formatting for party colors (column C, index 2)
        party_col = CANDIDATES_COLUMNS["party"] + 1  # 3 (1-based)

        self._add_party_conditional_formatting(
            worksheet,
            col_index=party_col,
            start_row=2,
        )

        # 5. Add filing recency colors on filed_date column (D, index 3)
        filed_date_col = CANDIDATES_COLUMNS["filed_date"] + 1  # 4 (1-based)

        self._add_filing_recency_formatting(
            worksheet,
            date_col_index=filed_date_col,
            start_row=2,
        )

        # 6. Apply zebra striping for all 9 columns (A-I)
        self.apply_zebra_striping(
            worksheet,
            start_row=2,
            end_col="I",  # 9 columns A-I
        )

        # 7. Add data validation dropdown for party column (C)
        self._add_dropdown_validation(
            worksheet,
            range_notation="C2:C1000",
            values=["", "D", "R", "I", "O", "?"],
        )

        # 8. Set optimized column widths for all 9 columns
        self.set_column_widths(worksheet, {
            0: 120,   # A - district_id
            1: 200,   # B - candidate_name
            2: 60,    # C - party
            3: 100,   # D - filed_date
            4: 100,   # E - report_id
            5: 120,   # F - ethics_url
            6: 80,    # G - is_incumbent
            7: 150,   # H - notes
            8: 120,   # I - last_synced
        })

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
        """
        Apply formatting to Race Analysis tab with priority visibility.

        Includes:
        - Frozen header row
        - Full-row priority coloring (Red=flip target, Yellow=defend, Green=covered)
        - Challenger count gradient
        - Party conditional formatting
        - Zebra striping (applied AFTER priority colors, lower precedence)
        """
        # Freeze header row
        set_frozen(worksheet, rows=1)

        # Format header with dark background
        header_format = CellFormat(
            backgroundColor=COLORS["header_dark"],
            textFormat=TextFormat(bold=True, foregroundColor=Color(1, 1, 1)),
        )
        format_cell_range(worksheet, "1:1", header_format)

        # Get column indices (1-based for formatting)
        incumbent_party_col = RACE_ANALYSIS_COLUMNS["incumbent_party"] + 1  # Column C
        dem_filed_col = RACE_ANALYSIS_COLUMNS["dem_filed"] + 1              # Column E
        challenger_count_col = RACE_ANALYSIS_COLUMNS["challenger_count"] + 1  # Column D

        # 1. Add full-row priority coloring (most important - applied first)
        # Red: R incumbent + no D filed (flip target)
        # Yellow: D incumbent + no D filed (defend)
        # Green: D filed (covered)
        self._add_priority_row_formatting(
            worksheet,
            incumbent_party_col=incumbent_party_col,
            dem_filed_col=dem_filed_col,
            start_row=2,
        )

        # 2. Add party color formatting for incumbent_party column
        self._add_party_conditional_formatting(
            worksheet,
            col_index=incumbent_party_col,
            start_row=2,
        )

        # 3. Add challenger count gradient
        self._add_challenger_count_formatting(
            worksheet,
            col_index=challenger_count_col,
            start_row=2,
        )

        # 4. Add priority tier text formatting (for the computed column)
        priority_tier_col = RACE_ANALYSIS_COLUMNS["priority_tier"] + 1  # Column G
        self._add_priority_tier_text_formatting(
            worksheet,
            col_index=priority_tier_col,
            start_row=2,
        )

        # 5. Set column widths for better readability
        self.set_column_widths(worksheet, {
            0: COLUMN_WIDTHS.get("district_id", 120),           # A - district_id
            1: COLUMN_WIDTHS.get("incumbent_name", 200),        # B - incumbent_name
            2: COLUMN_WIDTHS.get("incumbent_party", 60),        # C - incumbent_party
            3: COLUMN_WIDTHS.get("challenger_count", 80),       # D - challenger_count
            4: COLUMN_WIDTHS.get("dem_filed", 70),              # E - dem_filed
            5: COLUMN_WIDTHS.get("needs_dem_candidate", 100),   # F - needs_dem_candidate
            6: COLUMN_WIDTHS.get("priority_tier", 120),         # G - priority_tier
        })

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

    def _add_priority_row_formatting(
        self,
        worksheet: gspread.Worksheet,
        incumbent_party_col: int,
        dem_filed_col: int,
        start_row: int = 2,
    ) -> None:
        """
        Add full-row conditional formatting based on priority tiers.

        Priority A (Red): R incumbent + no D filed = flip opportunity
        Priority B (Yellow): D incumbent = defend seat
        Priority D (Green): D filed = covered

        Uses custom formulas for complex conditions.
        """
        rules = []
        last_col = "G"  # 7 columns: A-G (including priority_tier)

        # Priority A - Flip Target: R incumbent AND dem_filed = N (RED)
        # This is highest priority - should be most visible
        rules.append(
            ConditionalFormatRule(
                ranges=[GridRange.from_a1_range(
                    f"A{start_row}:{last_col}1000",
                    worksheet
                )],
                booleanRule=BooleanRule(
                    condition=BooleanCondition(
                        "CUSTOM_FORMULA",
                        [f'=AND(${self._col_letter(incumbent_party_col - 1)}{start_row}="R", ${self._col_letter(dem_filed_col - 1)}{start_row}="N")']
                    ),
                    format=CellFormat(backgroundColor=COLORS["priority_high_red"]),
                ),
            )
        )

        # Priority D - Covered: dem_filed = Y (GREEN)
        # Second priority - show that race is covered
        rules.append(
            ConditionalFormatRule(
                ranges=[GridRange.from_a1_range(
                    f"A{start_row}:{last_col}1000",
                    worksheet
                )],
                booleanRule=BooleanRule(
                    condition=BooleanCondition(
                        "CUSTOM_FORMULA",
                        [f'=${self._col_letter(dem_filed_col - 1)}{start_row}="Y"']
                    ),
                    format=CellFormat(backgroundColor=COLORS["priority_covered_green"]),
                ),
            )
        )

        # Priority B - Defend: D incumbent AND dem_filed = N (YELLOW)
        # Needs attention - may need to find replacement candidate
        rules.append(
            ConditionalFormatRule(
                ranges=[GridRange.from_a1_range(
                    f"A{start_row}:{last_col}1000",
                    worksheet
                )],
                booleanRule=BooleanRule(
                    condition=BooleanCondition(
                        "CUSTOM_FORMULA",
                        [f'=AND(${self._col_letter(incumbent_party_col - 1)}{start_row}="D", ${self._col_letter(dem_filed_col - 1)}{start_row}="N")']
                    ),
                    format=CellFormat(backgroundColor=COLORS["priority_medium_yellow"]),
                ),
            )
        )

        existing_rules = get_conditional_format_rules(worksheet)
        existing_rules.extend(rules)
        existing_rules.save()

    def _add_priority_tier_text_formatting(
        self,
        worksheet: gspread.Worksheet,
        col_index: int,
        start_row: int = 2,
    ) -> None:
        """
        Add conditional formatting for priority_tier column text colors.

        A - Flip Target = Bold Red text
        B - Defend = Bold Orange text
        C - Competitive = Normal text
        D - Covered = Bold Green text
        """
        rules = []

        # A - Flip Target: Bold red text
        rules.append(
            ConditionalFormatRule(
                ranges=[GridRange.from_a1_range(
                    f"{self._col_letter(col_index - 1)}{start_row}:{self._col_letter(col_index - 1)}1000",
                    worksheet
                )],
                booleanRule=BooleanRule(
                    condition=BooleanCondition(
                        "CUSTOM_FORMULA",
                        [f'=SEARCH("A -", {self._col_letter(col_index - 1)}{start_row})=1']
                    ),
                    format=CellFormat(
                        textFormat=TextFormat(
                            bold=True,
                            foregroundColor=Color(0.8, 0.2, 0.2),  # Dark red
                        ),
                    ),
                ),
            )
        )

        # B - Defend: Bold orange text
        rules.append(
            ConditionalFormatRule(
                ranges=[GridRange.from_a1_range(
                    f"{self._col_letter(col_index - 1)}{start_row}:{self._col_letter(col_index - 1)}1000",
                    worksheet
                )],
                booleanRule=BooleanRule(
                    condition=BooleanCondition(
                        "CUSTOM_FORMULA",
                        [f'=SEARCH("B -", {self._col_letter(col_index - 1)}{start_row})=1']
                    ),
                    format=CellFormat(
                        textFormat=TextFormat(
                            bold=True,
                            foregroundColor=Color(0.85, 0.55, 0.1),  # Dark orange
                        ),
                    ),
                ),
            )
        )

        # D - Covered: Bold green text
        rules.append(
            ConditionalFormatRule(
                ranges=[GridRange.from_a1_range(
                    f"{self._col_letter(col_index - 1)}{start_row}:{self._col_letter(col_index - 1)}1000",
                    worksheet
                )],
                booleanRule=BooleanRule(
                    condition=BooleanCondition(
                        "CUSTOM_FORMULA",
                        [f'=SEARCH("D -", {self._col_letter(col_index - 1)}{start_row})=1']
                    ),
                    format=CellFormat(
                        textFormat=TextFormat(
                            bold=True,
                            foregroundColor=Color(0.2, 0.6, 0.2),  # Dark green
                        ),
                    ),
                ),
            )
        )

        existing_rules = get_conditional_format_rules(worksheet)
        existing_rules.extend(rules)
        existing_rules.save()

    def _add_challenger_count_formatting(
        self,
        worksheet: gspread.Worksheet,
        col_index: int,
        start_row: int = 2,
    ) -> None:
        """
        Add conditional formatting for challenger_count column.

        0 challengers = Red (uncontested)
        1-2 challengers = Yellow (some competition)
        3+ challengers = Green (competitive)
        """
        rules = []

        # 0 challengers - Red
        rules.append(
            ConditionalFormatRule(
                ranges=[GridRange.from_a1_range(
                    f"{self._col_letter(col_index - 1)}{start_row}:{self._col_letter(col_index - 1)}1000",
                    worksheet
                )],
                booleanRule=BooleanRule(
                    condition=BooleanCondition("NUMBER_EQ", ["0"]),
                    format=CellFormat(backgroundColor=COLORS["challenger_0"]),
                ),
            )
        )

        # 1 challenger - Yellow
        rules.append(
            ConditionalFormatRule(
                ranges=[GridRange.from_a1_range(
                    f"{self._col_letter(col_index - 1)}{start_row}:{self._col_letter(col_index - 1)}1000",
                    worksheet
                )],
                booleanRule=BooleanRule(
                    condition=BooleanCondition("NUMBER_EQ", ["1"]),
                    format=CellFormat(backgroundColor=COLORS["challenger_1_2"]),
                ),
            )
        )

        # 2 challengers - Yellow
        rules.append(
            ConditionalFormatRule(
                ranges=[GridRange.from_a1_range(
                    f"{self._col_letter(col_index - 1)}{start_row}:{self._col_letter(col_index - 1)}1000",
                    worksheet
                )],
                booleanRule=BooleanRule(
                    condition=BooleanCondition("NUMBER_EQ", ["2"]),
                    format=CellFormat(backgroundColor=COLORS["challenger_1_2"]),
                ),
            )
        )

        # 3+ challengers - Green
        rules.append(
            ConditionalFormatRule(
                ranges=[GridRange.from_a1_range(
                    f"{self._col_letter(col_index - 1)}{start_row}:{self._col_letter(col_index - 1)}1000",
                    worksheet
                )],
                booleanRule=BooleanRule(
                    condition=BooleanCondition("NUMBER_GREATER_THAN_EQ", ["3"]),
                    format=CellFormat(backgroundColor=COLORS["challenger_3_plus"]),
                ),
            )
        )

        existing_rules = get_conditional_format_rules(worksheet)
        existing_rules.extend(rules)
        existing_rules.save()

    def apply_zebra_striping(
        self,
        worksheet: gspread.Worksheet,
        start_row: int = 2,
        end_col: str = "I",
    ) -> None:
        """
        Apply alternating row colors (zebra striping) for easier scanning.

        Args:
            worksheet: Target worksheet.
            start_row: First data row (after header).
            end_col: Last column letter.
        """
        # Use conditional formatting with ISEVEN(ROW()) formula
        rules = [
            ConditionalFormatRule(
                ranges=[GridRange.from_a1_range(
                    f"A{start_row}:{end_col}1000",
                    worksheet
                )],
                booleanRule=BooleanRule(
                    condition=BooleanCondition(
                        "CUSTOM_FORMULA",
                        [f"=ISEVEN(ROW())"]
                    ),
                    format=CellFormat(backgroundColor=COLORS["zebra_stripe"]),
                ),
            )
        ]

        existing_rules = get_conditional_format_rules(worksheet)
        existing_rules.extend(rules)
        existing_rules.save()

    def set_column_widths(
        self,
        worksheet: gspread.Worksheet,
        widths: dict,
    ) -> None:
        """
        Set column widths for better readability.

        Args:
            worksheet: Target worksheet.
            widths: Dict mapping column index (0-based) to width in pixels.
        """
        requests = []

        for col_index, width in widths.items():
            requests.append({
                "updateDimensionProperties": {
                    "range": {
                        "sheetId": worksheet.id,
                        "dimension": "COLUMNS",
                        "startIndex": col_index,
                        "endIndex": col_index + 1,
                    },
                    "properties": {
                        "pixelSize": width,
                    },
                    "fields": "pixelSize",
                }
            })

        if requests:
            self.spreadsheet.batch_update({"requests": requests})

    def _add_filing_recency_formatting(
        self,
        worksheet: gspread.Worksheet,
        date_col_index: int,
        start_row: int = 2,
    ) -> None:
        """
        Add conditional formatting for filing recency.

        Last 7 days = Green (fresh filing)
        Last 30 days = Yellow (recent filing)
        Older = No color
        """
        col_letter = self._col_letter(date_col_index - 1)
        rules = []

        # Last 7 days - Green
        rules.append(
            ConditionalFormatRule(
                ranges=[GridRange.from_a1_range(
                    f"{col_letter}{start_row}:{col_letter}1000",
                    worksheet
                )],
                booleanRule=BooleanRule(
                    condition=BooleanCondition(
                        "CUSTOM_FORMULA",
                        [f'=AND({col_letter}{start_row}<>"", {col_letter}{start_row}>=TODAY()-7)']
                    ),
                    format=CellFormat(backgroundColor=COLORS["recent_7_days"]),
                ),
            )
        )

        # Last 30 days (but not last 7) - Yellow
        rules.append(
            ConditionalFormatRule(
                ranges=[GridRange.from_a1_range(
                    f"{col_letter}{start_row}:{col_letter}1000",
                    worksheet
                )],
                booleanRule=BooleanRule(
                    condition=BooleanCondition(
                        "CUSTOM_FORMULA",
                        [f'=AND({col_letter}{start_row}<>"", {col_letter}{start_row}>=TODAY()-30, {col_letter}{start_row}<TODAY()-7)']
                    ),
                    format=CellFormat(backgroundColor=COLORS["recent_30_days"]),
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
        """Convert 0-based column index to letter (handles multi-letter columns)."""
        result = ""
        col_index += 1  # Convert to 1-based
        while col_index > 0:
            col_index, remainder = divmod(col_index - 1, 26)
            result = chr(65 + remainder) + result
        return result

    def clear_conditional_formatting(self, worksheet: gspread.Worksheet) -> None:
        """
        Remove all conditional formatting rules from worksheet.

        This should be called before re-applying formatting to avoid
        duplicate rules accumulating.
        """
        rules = get_conditional_format_rules(worksheet)
        rules.clear()
        rules.save()

    def format_source_of_truth_tab(self, worksheet: gspread.Worksheet) -> None:
        """
        Apply formatting to Source of Truth tab.

        Includes:
        - Frozen header row
        - Dark header styling
        - Party conditional formatting for challenger party columns
        - Static column dropdowns (C, G, J)
        - Protected ranges for system-managed columns
        """
        # Freeze header row
        set_frozen(worksheet, rows=1)

        # Format header with dark background
        header_format = CellFormat(
            backgroundColor=COLORS["header_dark"],
            textFormat=TextFormat(bold=True, foregroundColor=Color(1, 1, 1)),
        )
        format_cell_range(worksheet, "1:1", header_format)

        # Add party conditional formatting for each challenger party column
        # Q (cand1_party), V (cand2_party), AA (cand3_party)
        party_columns = [
            SOURCE_OF_TRUTH_COLUMNS["cand1_party"] + 1,  # Q = 17 (1-based)
            SOURCE_OF_TRUTH_COLUMNS["cand2_party"] + 1,  # V = 22
            SOURCE_OF_TRUTH_COLUMNS["cand3_party"] + 1,  # AA = 27
        ]

        for col_index in party_columns:
            self._add_party_conditional_formatting(
                worksheet,
                col_index=col_index,
                start_row=2,
            )

        # Apply static column dropdowns (C, G, J)
        self.apply_sot_static_dropdowns(worksheet)

    def apply_sot_static_dropdowns(self, worksheet: gspread.Worksheet = None) -> dict:
        """
        Apply dropdowns to Source of Truth static columns (user-managed).

        Restores dropdowns that were lost when the "Lists" tab was deleted.
        These are for columns A-L which are user-managed, not automation-managed.

        Columns restored:
        - C (Incumbent Party): D, R
        - G (Tenure): Open, First-term, Veteran, Long-serving
        - J (Region): Upstate, Midlands, Lowcountry, Pee Dee

        Args:
            worksheet: Optional worksheet. If None, gets Source of Truth tab.

        Returns:
            Dict with results: {"dropdowns_applied": int, "errors": list}
        """
        results = {"dropdowns_applied": 0, "errors": []}

        # Get worksheet if not provided
        if worksheet is None:
            try:
                worksheet = self.spreadsheet.worksheet(TAB_SOURCE_OF_TRUTH)
            except gspread.WorksheetNotFound:
                results["errors"].append(f"Tab not found: {TAB_SOURCE_OF_TRUTH}")
                return results

        # Get row count for range
        all_values = worksheet.get_all_values()
        row_count = len(all_values)

        if row_count <= 1:
            results["errors"].append("Source of Truth tab has no data rows")
            return results

        # Apply dropdown to each static column
        for col_letter, config in SOT_STATIC_DROPDOWNS.items():
            values = config["values"]
            range_notation = f"{col_letter}2:{col_letter}{row_count}"

            try:
                self._add_dropdown_validation(worksheet, range_notation, values)
                results["dropdowns_applied"] += 1
            except Exception as e:
                results["errors"].append(f"Column {col_letter}: {e}")

        return results

    def create_filter_views(self, tab_name: str = None) -> dict:
        """
        Create named filter views for easy data access.

        Filter views for Candidates:
        - "Democrats": party = D
        - "Republicans": party = R

        Note: Race Analysis filter views have been deprecated. Priority
        filtering is now handled through Source of Truth tab.

        Returns:
            Dict with filter views created or instructions.
        """
        results = {
            "filter_views_created": 0,
            "filter_views_requested": [],
            "errors": [],
        }

        # Define filter views for Candidates tab only
        # Race Analysis filters are deprecated - use Source of Truth instead
        # Simplified format: party is column C (index 2)
        filter_configs = {
            TAB_CANDIDATES: [
                {
                    "title": "Democrats",
                    "criteria": {
                        # Column C (party) = D (0-indexed = 2)
                        CANDIDATES_COLUMNS["party"]: {
                            "condition": {"type": "TEXT_EQ", "values": [{"userEnteredValue": "D"}]}
                        },
                    },
                },
                {
                    "title": "Republicans",
                    "criteria": {
                        # Column C (party) = R (0-indexed = 2)
                        CANDIDATES_COLUMNS["party"]: {
                            "condition": {"type": "TEXT_EQ", "values": [{"userEnteredValue": "R"}]}
                        },
                    },
                },
            ],
        }

        tabs_to_process = [tab_name] if tab_name else list(filter_configs.keys())

        for tab in tabs_to_process:
            if tab not in filter_configs:
                continue

            try:
                worksheet = self.spreadsheet.worksheet(tab)
                sheet_id = worksheet.id

                for filter_view in filter_configs[tab]:
                    # Build filter view request
                    request = {
                        "addFilterView": {
                            "filter": {
                                "title": filter_view["title"],
                                "range": {
                                    "sheetId": sheet_id,
                                    "startRowIndex": 0,
                                    "startColumnIndex": 0,
                                },
                                "filterSpecs": [
                                    {
                                        "columnIndex": col_idx,
                                        "filterCriteria": criteria,
                                    }
                                    for col_idx, criteria in filter_view["criteria"].items()
                                ],
                            }
                        }
                    }

                    results["filter_views_requested"].append({
                        "tab": tab,
                        "title": filter_view["title"],
                    })

                    try:
                        self.spreadsheet.batch_update({"requests": [request]})
                        results["filter_views_created"] += 1
                    except Exception as e:
                        # Filter view might already exist
                        if "already exists" not in str(e).lower():
                            results["errors"].append(f"Filter '{filter_view['title']}': {e}")

            except Exception as e:
                results["errors"].append(f"Tab '{tab}': {e}")

        return results

    def apply_protected_ranges(self) -> dict:
        """
        Apply protected ranges to prevent accidental edits to system-managed columns.

        Protected columns:
        - Candidates: district_id, filed_date, report_id, ethics_url, last_synced
        - Source of Truth: Columns N-AF (auto-populated, except AE which is staff-entered)

        Note: Race Analysis tab has been deprecated. Protection is no longer applied.
        This protects from accidental edits but still allows editors to edit.
        Uses warning-only protection.

        Returns:
            Dict with protection status.
        """
        results = {
            "ranges_protected": 0,
            "errors": [],
        }

        # Race Analysis protection removed - tab is deprecated
        # Simplified column format (9 columns A-I)
        protection_configs = [
            {
                "tab": TAB_CANDIDATES,
                "description": "System-managed columns (read-only)",
                "columns": [
                    CANDIDATES_COLUMNS["district_id"],   # A (0)
                    CANDIDATES_COLUMNS["filed_date"],    # D (3)
                    CANDIDATES_COLUMNS["report_id"],     # E (4)
                    CANDIDATES_COLUMNS["ethics_url"],    # F (5)
                    CANDIDATES_COLUMNS["last_synced"],   # I (8)
                ],
                "warning_only": True,  # Show warning but allow edit
            },
            {
                "tab": TAB_SOURCE_OF_TRUTH,
                "description": "Auto-populated candidate columns",
                "columns": list(range(13, 30)) + [31],  # N through AD (13-29) + AF (31), skip AE (30)
                "warning_only": True,
            },
        ]

        for config in protection_configs:
            try:
                worksheet = self.spreadsheet.worksheet(config["tab"])
                sheet_id = worksheet.id

                # Build protection requests for each column
                for col_idx in config["columns"]:
                    request = {
                        "addProtectedRange": {
                            "protectedRange": {
                                "range": {
                                    "sheetId": sheet_id,
                                    "startRowIndex": 1,  # Skip header
                                    "startColumnIndex": col_idx,
                                    "endColumnIndex": col_idx + 1,
                                },
                                "description": config["description"],
                                "warningOnly": config.get("warning_only", True),
                            }
                        }
                    }

                    try:
                        self.spreadsheet.batch_update({"requests": [request]})
                        results["ranges_protected"] += 1
                    except Exception as e:
                        # Range might already be protected
                        if "already protected" not in str(e).lower():
                            results["errors"].append(f"{config['tab']} col {col_idx}: {e}")

            except Exception as e:
                results["errors"].append(f"Tab '{config['tab']}': {e}")

        return results

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
