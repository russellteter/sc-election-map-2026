"""
SC Legislative District to County Mapping

Complete mapping of all 124 House districts and 46 Senate districts
to their constituent counties and regions.

Data sources:
- SC Legislature redistricting maps
- SC State Legislature website (scstatehouse.gov)
"""

# County to Region mapping for all 46 SC counties
COUNTY_REGIONS = {
    # Upstate (15 counties)
    "Greenville": "Upstate",
    "Spartanburg": "Upstate",
    "Anderson": "Upstate",
    "Pickens": "Upstate",
    "Oconee": "Upstate",
    "Cherokee": "Upstate",
    "York": "Upstate",
    "Chester": "Upstate",
    "Lancaster": "Upstate",
    "Union": "Upstate",
    "Laurens": "Upstate",
    "Abbeville": "Upstate",
    "Greenwood": "Upstate",
    "McCormick": "Upstate",
    "Edgefield": "Upstate",

    # Midlands (9 counties)
    "Richland": "Midlands",
    "Lexington": "Midlands",
    "Kershaw": "Midlands",
    "Fairfield": "Midlands",
    "Newberry": "Midlands",
    "Saluda": "Midlands",
    "Aiken": "Midlands",
    "Calhoun": "Midlands",
    "Orangeburg": "Midlands",

    # Lowcountry (10 counties)
    "Charleston": "Lowcountry",
    "Berkeley": "Lowcountry",
    "Dorchester": "Lowcountry",
    "Beaufort": "Lowcountry",
    "Jasper": "Lowcountry",
    "Colleton": "Lowcountry",
    "Hampton": "Lowcountry",
    "Allendale": "Lowcountry",
    "Bamberg": "Lowcountry",
    "Barnwell": "Lowcountry",

    # Pee Dee (12 counties)
    "Florence": "Pee Dee",
    "Horry": "Pee Dee",
    "Georgetown": "Pee Dee",
    "Marion": "Pee Dee",
    "Dillon": "Pee Dee",
    "Marlboro": "Pee Dee",
    "Darlington": "Pee Dee",
    "Chesterfield": "Pee Dee",
    "Lee": "Pee Dee",
    "Clarendon": "Pee Dee",
    "Sumter": "Pee Dee",
    "Williamsburg": "Pee Dee",
}

# House districts (1-124) mapped to their counties
# Format: district_number: [list of counties, primary county first]
HOUSE_DISTRICT_COUNTIES = {
    1: ["Oconee"],
    2: ["Oconee", "Pickens"],
    3: ["Pickens"],
    4: ["Pickens"],
    5: ["Pickens", "Anderson"],
    6: ["Anderson"],
    7: ["Anderson"],
    8: ["Anderson"],
    9: ["Anderson"],
    10: ["Anderson", "Abbeville"],
    11: ["Anderson", "Greenville"],
    12: ["Greenville"],
    13: ["Greenwood", "Laurens"],
    14: ["Greenwood", "Abbeville", "McCormick"],
    15: ["Greenville"],
    16: ["Laurens"],
    17: ["Laurens", "Spartanburg"],
    18: ["Spartanburg"],
    19: ["Spartanburg"],
    20: ["Greenville"],
    21: ["Greenville"],
    22: ["Greenville"],
    23: ["Greenville"],
    24: ["Greenville"],
    25: ["Greenville"],
    26: ["Greenville"],
    27: ["Greenville"],
    28: ["Spartanburg"],
    29: ["Spartanburg", "York"],
    30: ["Spartanburg"],
    31: ["Spartanburg"],
    32: ["Spartanburg"],
    33: ["Spartanburg"],
    34: ["Spartanburg"],
    35: ["Spartanburg"],
    36: ["Union", "Cherokee"],
    37: ["Cherokee"],
    38: ["Chester", "Union"],
    39: ["York"],
    40: ["York"],
    41: ["York", "Chester"],
    42: ["Lancaster", "Chesterfield"],
    43: ["Lancaster"],
    44: ["Lancaster", "Kershaw"],
    45: ["York"],
    46: ["York"],
    47: ["York"],
    48: ["York"],
    49: ["Kershaw", "Richland"],
    50: ["Chesterfield", "Marlboro"],
    51: ["Sumter"],
    52: ["Sumter", "Lee"],
    53: ["Darlington", "Chesterfield"],
    54: ["Lee", "Clarendon", "Sumter"],
    55: ["Dillon", "Marion"],
    56: ["Marlboro", "Dillon"],
    57: ["Darlington", "Florence"],
    58: ["Florence"],
    59: ["Florence", "Darlington"],
    60: ["Florence"],
    61: ["Florence", "Marion"],
    62: ["Williamsburg", "Georgetown"],
    63: ["Horry"],
    64: ["Horry"],
    65: ["Horry"],
    66: ["Horry"],
    67: ["Sumter", "Clarendon"],
    68: ["Horry"],
    69: ["Horry"],
    70: ["Newberry", "Fairfield"],
    71: ["Richland"],
    72: ["Richland"],
    73: ["Richland"],
    74: ["Richland"],
    75: ["Richland", "Lexington"],
    76: ["Richland"],
    77: ["Richland"],
    78: ["Richland"],
    79: ["Richland"],
    80: ["Lexington", "Richland"],
    81: ["Lexington"],
    82: ["Richland"],
    83: ["Aiken"],
    84: ["Lexington"],
    85: ["Lexington"],
    86: ["Aiken"],
    87: ["Lexington"],
    88: ["Lexington", "Saluda"],
    89: ["Lexington"],
    90: ["Bamberg", "Barnwell"],
    91: ["Allendale", "Hampton", "Barnwell"],
    92: ["Aiken"],
    93: ["Orangeburg"],
    94: ["Orangeburg", "Calhoun"],
    95: ["Orangeburg"],
    96: ["Aiken"],
    97: ["Edgefield", "Saluda", "Aiken"],
    98: ["Orangeburg", "Dorchester"],
    99: ["Dorchester", "Colleton"],
    100: ["Clarendon", "Williamsburg"],
    101: ["Florence", "Williamsburg"],
    102: ["Horry", "Georgetown"],
    103: ["Georgetown"],
    104: ["Horry"],
    105: ["Horry"],
    106: ["Georgetown", "Horry"],
    107: ["Horry"],
    108: ["Georgetown"],
    109: ["Charleston"],
    110: ["Charleston", "Dorchester"],
    111: ["Charleston"],
    112: ["Charleston"],
    113: ["Charleston"],
    114: ["Berkeley"],
    115: ["Charleston"],
    116: ["Berkeley"],
    117: ["Beaufort"],
    118: ["Beaufort"],
    119: ["Charleston"],
    120: ["Beaufort"],
    121: ["Beaufort", "Jasper"],
    122: ["Colleton", "Beaufort", "Hampton"],
    123: ["Dorchester"],
    124: ["Beaufort"],
}

# Senate districts (1-46) mapped to their counties
# Format: district_number: [list of counties, primary county first]
SENATE_DISTRICT_COUNTIES = {
    1: ["Oconee", "Pickens"],
    2: ["Pickens", "Anderson"],
    3: ["Anderson"],
    4: ["Anderson", "Abbeville"],
    5: ["Greenville"],
    6: ["Greenville"],
    7: ["Greenville"],
    8: ["Greenville"],
    9: ["Laurens", "Greenwood"],
    10: ["Spartanburg"],
    11: ["Spartanburg"],
    12: ["Spartanburg", "Cherokee"],
    13: ["Spartanburg", "Union"],
    14: ["Cherokee", "York", "Chester"],
    15: ["York", "Lancaster"],
    16: ["York"],
    17: ["Fairfield", "Newberry", "Richland"],
    18: ["Newberry", "Lexington", "Saluda"],
    19: ["Richland"],
    20: ["Richland"],
    21: ["Richland"],
    22: ["Richland", "Lexington"],
    23: ["Lexington"],
    24: ["Lexington", "Aiken"],
    25: ["Aiken", "Edgefield"],
    26: ["Calhoun", "Orangeburg"],
    27: ["Sumter", "Clarendon"],
    28: ["Horry"],
    29: ["Florence", "Darlington"],
    30: ["Williamsburg", "Florence", "Georgetown"],
    31: ["Horry"],
    32: ["Marion", "Dillon", "Marlboro", "Darlington"],
    33: ["Horry", "Georgetown"],
    34: ["Georgetown", "Charleston"],
    35: ["Chesterfield", "Kershaw", "Lancaster"],
    36: ["Lee", "Sumter", "Kershaw"],
    37: ["Berkeley", "Dorchester"],
    38: ["Dorchester", "Charleston"],
    39: ["Berkeley"],
    40: ["Orangeburg", "Bamberg", "Barnwell"],
    41: ["Charleston"],
    42: ["Charleston"],
    43: ["Charleston"],
    44: ["Charleston", "Dorchester"],
    45: ["Colleton", "Hampton", "Jasper", "Beaufort"],
    46: ["Beaufort"],
}


def get_primary_county(district_num: int, chamber: str) -> str:
    """Get the primary (first-listed) county for a district."""
    if chamber.lower() == "house":
        counties = HOUSE_DISTRICT_COUNTIES.get(district_num, [])
    else:
        counties = SENATE_DISTRICT_COUNTIES.get(district_num, [])
    return counties[0] if counties else ""


def get_all_counties(district_num: int, chamber: str) -> str:
    """Get all counties for a district as a comma-separated string."""
    if chamber.lower() == "house":
        counties = HOUSE_DISTRICT_COUNTIES.get(district_num, [])
    else:
        counties = SENATE_DISTRICT_COUNTIES.get(district_num, [])
    return ", ".join(counties)


def get_region(county: str) -> str:
    """Get the region for a county."""
    return COUNTY_REGIONS.get(county, "Unknown")


def get_district_region(district_num: int, chamber: str) -> str:
    """Get the region for a district based on its primary county."""
    primary = get_primary_county(district_num, chamber)
    return get_region(primary)


if __name__ == "__main__":
    # Verification
    print("House district count:", len(HOUSE_DISTRICT_COUNTIES))
    print("Senate district count:", len(SENATE_DISTRICT_COUNTIES))
    print("County count:", len(COUNTY_REGIONS))

    # Verify all districts have mappings
    missing_house = [i for i in range(1, 125) if i not in HOUSE_DISTRICT_COUNTIES]
    missing_senate = [i for i in range(1, 47) if i not in SENATE_DISTRICT_COUNTIES]

    if missing_house:
        print(f"Missing House districts: {missing_house}")
    if missing_senate:
        print(f"Missing Senate districts: {missing_senate}")

    # Count districts per region
    region_counts = {"Upstate": 0, "Midlands": 0, "Lowcountry": 0, "Pee Dee": 0}
    for d in range(1, 125):
        region = get_district_region(d, "House")
        region_counts[region] = region_counts.get(region, 0) + 1
    for d in range(1, 47):
        region = get_district_region(d, "Senate")
        region_counts[region] = region_counts.get(region, 0) + 1

    print("\nDistricts per region:")
    for region, count in region_counts.items():
        print(f"  {region}: {count}")
