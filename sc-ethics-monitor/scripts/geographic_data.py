"""
SC Legislative District Geographic Classification

Urban/Suburban/Rural classification and population estimates for
all SC legislative districts.

Classifications:
- Urban: City-center districts in major metros
- Suburban: Surrounding metro areas, high growth
- Rural: Agricultural, low-density areas
- Mixed: Spanning significant urban and rural areas
"""

from typing import Optional
from district_county_mapping import COUNTY_REGIONS

# County-level default classification
# This serves as fallback when district-specific data isn't available
COUNTY_TYPES = {
    # Metro cores - typically Urban
    "Charleston": "Urban",
    "Richland": "Urban",
    "Greenville": "Urban",

    # Major suburban counties
    "Lexington": "Suburban",
    "Berkeley": "Suburban",
    "Dorchester": "Suburban",
    "York": "Suburban",
    "Spartanburg": "Suburban",
    "Horry": "Suburban",  # Myrtle Beach area

    # Mix of urban and suburban
    "Anderson": "Mixed",
    "Beaufort": "Mixed",

    # Rural counties
    "Abbeville": "Rural",
    "Aiken": "Suburban",  # Has urban core
    "Allendale": "Rural",
    "Bamberg": "Rural",
    "Barnwell": "Rural",
    "Calhoun": "Rural",
    "Cherokee": "Rural",
    "Chester": "Rural",
    "Chesterfield": "Rural",
    "Clarendon": "Rural",
    "Colleton": "Rural",
    "Darlington": "Rural",
    "Dillon": "Rural",
    "Edgefield": "Rural",
    "Fairfield": "Rural",
    "Florence": "Mixed",  # Florence city
    "Georgetown": "Mixed",  # Has beach areas
    "Greenwood": "Mixed",  # Has urban core
    "Hampton": "Rural",
    "Jasper": "Rural",
    "Kershaw": "Mixed",
    "Lancaster": "Suburban",  # Charlotte commuter
    "Laurens": "Rural",
    "Lee": "Rural",
    "Marion": "Rural",
    "Marlboro": "Rural",
    "McCormick": "Rural",
    "Newberry": "Rural",
    "Oconee": "Rural",
    "Orangeburg": "Mixed",  # Orangeburg city
    "Pickens": "Suburban",  # Clemson area
    "Saluda": "Rural",
    "Sumter": "Mixed",  # Sumter city
    "Union": "Rural",
    "Williamsburg": "Rural",
}

# House district-specific classifications
# These override county defaults based on actual district boundaries
HOUSE_DISTRICT_TYPES = {
    # Upstate - Greenville area
    1: "Rural",      # Oconee - mountain areas
    2: "Rural",      # Oconee/Pickens border
    3: "Suburban",   # Pickens - Clemson area
    4: "Suburban",   # Pickens
    5: "Mixed",      # Pickens/Anderson
    6: "Suburban",   # Anderson
    7: "Mixed",      # Anderson
    8: "Rural",      # Anderson rural
    9: "Rural",      # Anderson rural
    10: "Rural",     # Anderson/Abbeville
    11: "Suburban",  # Anderson/Greenville
    12: "Suburban",  # Greenville suburban
    13: "Mixed",     # Greenwood/Laurens
    14: "Rural",     # Greenwood/Abbeville/McCormick
    15: "Urban",     # Greenville city
    16: "Rural",     # Laurens
    17: "Mixed",     # Laurens/Spartanburg
    18: "Suburban",  # Spartanburg
    19: "Suburban",  # Spartanburg
    20: "Urban",     # Greenville city
    21: "Suburban",  # Greenville
    22: "Suburban",  # Greenville
    23: "Urban",     # Greenville city
    24: "Suburban",  # Greenville
    25: "Urban",     # Greenville city
    26: "Suburban",  # Greenville
    27: "Suburban",  # Greenville
    28: "Suburban",  # Spartanburg
    29: "Suburban",  # Spartanburg/York
    30: "Suburban",  # Spartanburg
    31: "Urban",     # Spartanburg city
    32: "Suburban",  # Spartanburg
    33: "Suburban",  # Spartanburg
    34: "Mixed",     # Spartanburg
    35: "Rural",     # Spartanburg rural
    36: "Rural",     # Union/Cherokee
    37: "Rural",     # Cherokee
    38: "Rural",     # Chester/Union
    39: "Suburban",  # York - Rock Hill
    40: "Suburban",  # York
    41: "Mixed",     # York/Chester
    42: "Rural",     # Lancaster/Chesterfield
    43: "Suburban",  # Lancaster
    44: "Mixed",     # Lancaster/Kershaw
    45: "Suburban",  # York - Fort Mill
    46: "Suburban",  # York
    47: "Suburban",  # York
    48: "Suburban",  # York

    # Pee Dee region
    49: "Mixed",     # Kershaw/Richland
    50: "Rural",     # Chesterfield/Marlboro
    51: "Mixed",     # Sumter
    52: "Rural",     # Sumter/Lee
    53: "Rural",     # Darlington/Chesterfield
    54: "Rural",     # Lee/Clarendon/Sumter
    55: "Rural",     # Dillon/Marion
    56: "Rural",     # Marlboro/Dillon
    57: "Mixed",     # Darlington/Florence
    58: "Mixed",     # Florence
    59: "Mixed",     # Florence/Darlington
    60: "Mixed",     # Florence
    61: "Rural",     # Florence/Marion
    62: "Rural",     # Williamsburg/Georgetown
    63: "Suburban",  # Horry - Conway
    64: "Suburban",  # Horry - Myrtle Beach
    65: "Suburban",  # Horry
    66: "Suburban",  # Horry - Myrtle Beach
    67: "Mixed",     # Sumter/Clarendon
    68: "Suburban",  # Horry
    69: "Suburban",  # Horry

    # Midlands
    70: "Rural",     # Newberry/Fairfield
    71: "Suburban",  # Richland
    72: "Urban",     # Richland - Columbia
    73: "Urban",     # Richland - Columbia
    74: "Urban",     # Richland - Columbia
    75: "Suburban",  # Richland/Lexington
    76: "Urban",     # Richland - Columbia
    77: "Urban",     # Richland - Columbia
    78: "Urban",     # Richland - Columbia
    79: "Urban",     # Richland - Columbia
    80: "Suburban",  # Lexington/Richland
    81: "Suburban",  # Lexington
    82: "Urban",     # Richland
    83: "Mixed",     # Aiken
    84: "Suburban",  # Lexington
    85: "Suburban",  # Lexington
    86: "Suburban",  # Aiken
    87: "Suburban",  # Lexington
    88: "Rural",     # Lexington/Saluda
    89: "Suburban",  # Lexington
    90: "Rural",     # Bamberg/Barnwell
    91: "Rural",     # Allendale/Hampton/Barnwell
    92: "Suburban",  # Aiken
    93: "Mixed",     # Orangeburg
    94: "Rural",     # Orangeburg/Calhoun
    95: "Mixed",     # Orangeburg
    96: "Suburban",  # Aiken
    97: "Rural",     # Edgefield/Saluda/Aiken
    98: "Rural",     # Orangeburg/Dorchester

    # Lowcountry
    99: "Rural",     # Dorchester/Colleton
    100: "Rural",    # Clarendon/Williamsburg
    101: "Rural",    # Florence/Williamsburg
    102: "Suburban", # Horry/Georgetown
    103: "Mixed",    # Georgetown
    104: "Suburban", # Horry
    105: "Suburban", # Horry
    106: "Suburban", # Georgetown/Horry
    107: "Suburban", # Horry
    108: "Mixed",    # Georgetown
    109: "Urban",    # Charleston
    110: "Suburban", # Charleston/Dorchester
    111: "Urban",    # Charleston
    112: "Suburban", # Charleston
    113: "Urban",    # Charleston
    114: "Suburban", # Berkeley
    115: "Urban",    # Charleston
    116: "Suburban", # Berkeley
    117: "Suburban", # Beaufort
    118: "Suburban", # Beaufort
    119: "Urban",    # Charleston
    120: "Suburban", # Beaufort - Hilton Head
    121: "Mixed",    # Beaufort/Jasper
    122: "Rural",    # Colleton/Beaufort/Hampton
    123: "Suburban", # Dorchester
    124: "Suburban", # Beaufort
}

# Senate district-specific classifications
# Senate districts are larger, so more are "Mixed"
SENATE_DISTRICT_TYPES = {
    1: "Rural",      # Oconee/Pickens
    2: "Mixed",      # Pickens/Anderson
    3: "Mixed",      # Anderson
    4: "Rural",      # Anderson/Abbeville
    5: "Urban",      # Greenville city
    6: "Suburban",   # Greenville
    7: "Suburban",   # Greenville
    8: "Suburban",   # Greenville
    9: "Rural",      # Laurens/Greenwood
    10: "Suburban",  # Spartanburg
    11: "Mixed",     # Spartanburg
    12: "Mixed",     # Spartanburg/Cherokee
    13: "Rural",     # Spartanburg/Union
    14: "Rural",     # Cherokee/York/Chester
    15: "Suburban",  # York/Lancaster
    16: "Suburban",  # York
    17: "Rural",     # Fairfield/Newberry/Richland
    18: "Mixed",     # Newberry/Lexington/Saluda
    19: "Urban",     # Richland - Columbia
    20: "Urban",     # Richland
    21: "Urban",     # Richland
    22: "Suburban",  # Richland/Lexington
    23: "Suburban",  # Lexington
    24: "Mixed",     # Lexington/Aiken
    25: "Mixed",     # Aiken/Edgefield
    26: "Rural",     # Calhoun/Orangeburg
    27: "Mixed",     # Sumter/Clarendon
    28: "Suburban",  # Horry
    29: "Mixed",     # Florence/Darlington
    30: "Rural",     # Williamsburg/Florence/Georgetown
    31: "Suburban",  # Horry
    32: "Rural",     # Marion/Dillon/Marlboro/Darlington
    33: "Suburban",  # Horry/Georgetown
    34: "Mixed",     # Georgetown/Charleston
    35: "Rural",     # Chesterfield/Kershaw/Lancaster
    36: "Rural",     # Lee/Sumter/Kershaw
    37: "Suburban",  # Berkeley/Dorchester
    38: "Suburban",  # Dorchester/Charleston
    39: "Suburban",  # Berkeley
    40: "Rural",     # Orangeburg/Bamberg/Barnwell
    41: "Urban",     # Charleston
    42: "Urban",     # Charleston
    43: "Suburban",  # Charleston
    44: "Suburban",  # Charleston/Dorchester
    45: "Rural",     # Colleton/Hampton/Jasper/Beaufort
    46: "Suburban",  # Beaufort
}

# Population estimates based on 2020 census
HOUSE_POPULATION = 40000   # ~40k per House district
SENATE_POPULATION = 105000  # ~105k per Senate district


def get_district_type(chamber: str, district_num: int, primary_county: Optional[str] = None) -> str:
    """
    Get district type classification.

    Uses district-specific data if available, otherwise falls back to
    county-level classification.
    """
    if chamber.lower() == "house":
        if district_num in HOUSE_DISTRICT_TYPES:
            return HOUSE_DISTRICT_TYPES[district_num]
    else:  # Senate
        if district_num in SENATE_DISTRICT_TYPES:
            return SENATE_DISTRICT_TYPES[district_num]

    # Fallback to county type
    if primary_county and primary_county in COUNTY_TYPES:
        return COUNTY_TYPES[primary_county]

    return "Mixed"  # Default for unknown


def get_estimated_population(chamber: str) -> int:
    """Get estimated population for district type."""
    return HOUSE_POPULATION if chamber.lower() == "house" else SENATE_POPULATION


if __name__ == "__main__":
    # Verification
    print("House district type count:", len(HOUSE_DISTRICT_TYPES))
    print("Senate district type count:", len(SENATE_DISTRICT_TYPES))
    print("County type count:", len(COUNTY_TYPES))

    # Verify all districts have classifications
    missing_house = [i for i in range(1, 125) if i not in HOUSE_DISTRICT_TYPES]
    missing_senate = [i for i in range(1, 47) if i not in SENATE_DISTRICT_TYPES]

    if missing_house:
        print(f"Missing House district types: {missing_house}")
    else:
        print("All 124 House districts have type classifications")

    if missing_senate:
        print(f"Missing Senate district types: {missing_senate}")
    else:
        print("All 46 Senate districts have type classifications")

    # Count by type
    type_counts = {"Urban": 0, "Suburban": 0, "Rural": 0, "Mixed": 0}
    for d in range(1, 125):
        dt = HOUSE_DISTRICT_TYPES.get(d, "Unknown")
        type_counts[dt] = type_counts.get(dt, 0) + 1
    for d in range(1, 47):
        dt = SENATE_DISTRICT_TYPES.get(d, "Unknown")
        type_counts[dt] = type_counts.get(dt, 0) + 1

    print("\nDistricts by type:")
    for dtype, count in type_counts.items():
        print(f"  {dtype}: {count}")
