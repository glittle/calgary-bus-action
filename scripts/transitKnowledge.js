// extracted from CT website
// manually remove parentheses and then duplicates
// manually adjust C-Train names

const routeNames = {
    1: "Bowness - Forest Lawn",
    2: "Mt. Pleasant / Killarney 17 Ave.",
    3: "Sandstone/Elbow Drive",
    4: "Huntington",
    5: "North Haven",
    6: "Killarney 26 Ave.",
    7: "Marda Loop",
    8: "North Pointe / Brentwood",
    9: "Dalhousie- Foothills Medical Centre",
    10: "City Hall - Southcentre",
    11: "Southwest Loop",
    12: "Southwest Loop",
    13: "Mount Royal",
    14: "Bridlewood/Cranston",
    15: "Millrise",
    16: "Palliser",
    17: "Renfrew/Ramsay",
    18: "Lakeview",
    19: "16 Avenue North",
    20: "Heritage/Northmount",
    21: "Castleridge",
    23: "Foothills Industrial",
    24: "Ogden",
    25: "Whitehorn",
    26: "Dover",
    27: "Willowglen",
    28: "Deer Run",
    29: "Queensland",
    30: "Highfield Industrial",
    31: "Dalhousie-University",
    32: "Huntington/Sunridge",
    33: "Vista Heights/Rundle",
    34: "Pineridge",
    35: "Bonavista/Canyon Meadows",
    36: "Riverbend",
    37: "Heritage / Canyon Meadows",
    38: "Temple",
    39: "Acadia",
    40: "Crowfoot/North Hill",
    41: "Lynnwood",
    42: "Marlborough",
    44: "Deer Ridge",
    45: "Abbeydale/Applewood",
    46: "Beddington",
    47: "Lakeview/Chinook Station",
    48: "Rundle",
    49: "Forest Heights",
    50: "Forest Lawn",
    51: "Penbrooke",
    52: "Evergreen/Somerset",
    53: "Brentwood-Greenwood",
    54: "Edgevalley",
    55: "Falconridge",
    56: "Woodbine",
    57: "Erinwoods/McCall Way",
    59: "Saddle Ridge",
    60: "Taradale",
    61: "Martindale",
    62: "Hidden Valley Express",
    63: "Lakeview Express",
    64: "MacEwan Express",
    65: "Market Mall-Downtown West",
    66: "Blackfoot Express",
    69: "Deerfoot Centre",
    70: "Valley Ridge Express",
    71: "Taradale",
    72: "Circle Route",
    73: "Circle Route",
    74: "Tuscany",
    75: "Riverbend",
    76: "Hawkwood",
    77: "Edgemont",
    78: "Sundance/Chaparral",
    79: "Acadia/Oakridge",
    80: "Oakridge/Acadia",
    81: "Macleod Trail",
    82: "Nolan Hill",
    83: "Parkland",
    84: "Palliser",
    85: "Martin Crossing",
    86: "Coventry Hills",
    88: "Harvest Hills",
    89: "Lions Park",
    90: "Bridgeland-Sunalta",
    91: "Lions Park/Brentwood",
    92: "McKenzie Towne",
    93: "Coach Hill / Westbrook",
    94: "Strathcona / Westbrook",
    95: "Westwinds Business Park",
    96: "McKenzie",
    97: "South Ranchlands-Scenic Acres",
    98: "Cougar Ridge",
    100: "Airport/McKnight Stn",
    102: "Douglasdale Express",
    103: "McKenzie Express",
    104: "Sunnyside - Foothills Medical Centre",
    105: "Dalhousie-Lions Park",
    107: "South Calgary",
    109: "Harvest Hills Express",
    110: "Douglas Glen Express",
    112: "Sarcee Road",
    113: "North Ranchlands-Scenic Acres",
    114: "Panorama/Country Hills",
    116: "Coventry Hills Express",
    117: "McKenzie Towne Express",
    118: "Hidden Valley",
    120: "North Silver Springs",
    125: "Erin Woods Express",
    126: "Applewood Express",
    127: "Franklin Industrial",
    129: "Dalhousie - Sage Hill",
    133: "Cranston Express",
    134: "South Silver Springs",
    136: "Riverbend",
    142: "Panorama Express",
    146: "Beddington",
    151: "New Brighton Express",
    152: "New Brighton",
    153: "Copperfield",
    154: "Hamptons",
    157: "Royal Vista",
    158: "Royal Oak",
    159: "Saddlebrook",
    167: "Walden - Legacy CCW",
    168: "Walden - Legacy CW",
    169: "Rocky Ridge",
    174: "Tuscany",
    176: "52 St. Express",
    178: "Sundance/Chaparral",
    181: "MRU North Express",
    182: "MRU South Express",
    199: "Citadel",
    299: "Arbour Lake",
    300: "BRT Airport / City Centre",
    301: "BRT North",
    302: "BRT SE",
    305: "BRT Bowness / 17 Ave SE",
    306: "BRT Westbrook / Heritage Stn",
    402: "Silverado",
    404: "North Hill",
    406: "Auburn Bay",
    408: "Valley Ridge",
    409: "Douglas  Glen",
    410: "Glenmore Business Park",
    411: "East Calgary",
    412: "Bow Trail",
    414: "14 Street Crosstown",
    420: "Evanston",
    421: "Panatella",
    422: "Dalhousie-Montgomery",
    425: "Sage Hill / Kincora",
    430: "Sandstone / Airport",
    439: "Discovery Ridge",
    440: "Chateau Estates / Franklin",
    444: "Chaparral Valley/ Walden",
    445: "Skyview Ranch/ Redstone",
    449: "Eau Claire - Parkhill",
    452: "Wentworth",
    453: "West Springs",
    454: "Springbank Hill",
    456: "Aspen Woods",
    468: "Cranston / Mahogany",
    502: "Heritage Park Shuttle",
    506: "Chinook Centre  Shuttle",
    627: "Columbia College",
    695: "St Francis/ Bowness/ Valley Ridge",
    696: "LOA/ Bowness/ Valley Ridge",
    698: "17th Ave/Western Canada/St. Mary's",
    699: "West Springs/various schools",
    702: "Churchill/Nolan Hill",
    703: "Churchill/Sherwood",
    704: "Churchill/Edgepark Blvd",
    705: "Churchill/Edgebrook Rise",
    706: "Churchill/Edenwold Dr",
    710: "Beaverbrook/Cranston",
    711: "Beaverbrook/Douglasglen",
    712: "Beaverbrook/Parkland",
    713: "Beaverbrook/Deer Run",
    714: "Beaverbrook/Prestwick",
    715: "Beaverbrook/Queensland",
    716: "Beaverbrook/New Brighton",
    717: "Beaverbrook/Copperfield",
    718: "Beaverbrook/Douglasdale",
    719: "Beaverbrook/McKenzie",
    720: "Beaverbrook/ Mt McKenzie",
    721: "Beaverbrook/Mckenzie Towne",
    722: "Bowness/ Tuscany Ravine",
    723: "Bowness/Tuscany Hills",
    724: "Bowness/Tuscany North",
    725: "Bowness/Silver Springs",
    731: "Central Memorial/Riverbend",
    732: "Central Memorial/Glamorgan",
    733: "Central Memorial/Lakeview",
    734: "Central Memorial/Ogden",
    735: "Central Memorial/North Ogden",
    737: "Diefenbaker/ Harvest Hills",
    738: "Diefenbaker/Panorama Hills North",
    739: "Diefenbaker/Panorama Hills",
    743: "Crescent Heights/ Whitehorn Stn",
    744: "Crescent Heights/Coventry- South",
    745: "Crescent Heights/Vista Heights",
    746: "Crescent Heights/ Coventry Hills",
    747: "Crescent Heights/Hidden Valley",
    748: "Crescent Heights/ Hidden Ranch",
    750: "Nelson Mandela/ Coral Springs",
    753: "Fowler/Evanston/Kincora",
    760: "Scarlett / West Bonavista",
    761: "Scarlett/Auburn Bay",
    762: "Scarlett/Bonavista",
    763: "Scarlett/Woodbine",
    764: "Scarlett/James McKevitt Rd",
    765: "Scarlett/Silverado",
    766: "Scarlett/Evergreen",
    767: "Sacrlett/ Anderson",
    770: "Western Canada/Riverbend/Lynnview",
    771: "Western Canada/Chinook Stn.",
    773: "Robert Thirsk / Rocky Ridge",
    774: "Robert Thirsk/ Royal Oak",
    775: "Robert Thirsk / Citadel",
    776: "Wise Wood/Palliser/Oakridge",
    777: "Wise Wood/Evergreen",
    778: "Wise Wood/Woodlands",
    780: "Wise Wood/Oakridge",
    791: "Queen Elizabeth/MacEwan",
    792: "Queen Elizabeth/Sandstone",
    793: "Queen E/ Sunnyside",
    794: "FE Osborne/ Silver Springs",
    795: "Vincent Massey/ Strathcona",
    796: "Tom Baines/Edgemont",
    797: "Tom Baines/Hamptons",
    798: "Annie Gale/Taradale",
    799: "Annie Gale/ Coral Springs",
    801: "Brebeuf/RoyalOak",
    802: "Brebeuf/Hawkwood",
    803: "Brebeuf/Nolan Hill",
    804: "Brebeuf/Edgemont/Sherwood",
    805: "Brebeuf/Hamptons/Edgemont",
    807: "Brebeuf/Rocky Ridge",
    810: "St. Francis/St Margaret/ North Pointe",
    811: "St. Francis/ Tuscany",
    812: "St. Francis/E. Arbour Lake/Citadel",
    813: "St. Francis/Arbour Lk/ Scenic Acres/Silver Springs",
    814: "St. Francis/Royal Oak",
    815: "St. Francis/S. Ranchlands/Arbour Lk",
    816: "St. Francis/E. Hawkwood/Citadel",
    817: "St. Francis/ Rocky Ridge",
    818: "St. Francis/Hamptons/Edgemont",
    819: "St. Francis/Sherwood/ Edgemont",
    820: "St. Francis/Scenic Acres North",
    821: "Bishop O'Byrne/McKenzie/Mountain Park",
    822: "Bishop O'Byrne/Walden",
    825: "Bishop Carroll/ Mckenzie Towne Express",
    830: "Madeleine d'Houet/Sandstone",
    832: "Madeleine d'Houet/Sandstone",
    833: "Madeleine d'Houet/Dalhousie Stn",
    834: "Madeleine d'Houet/Brentwood Stn",
    835: "St Bonaventure / Anderson",
    836: "St. Vincent de Paul/ Scenic Acres",
    839: "Our Lady of Grace/ Evanston",
    841: "Notre Dame/Hidden Valley",
    842: "Notre Dame/MacEwan",
    851: "St Augustine / Lynnwood / Ogden",
    853: "St Augustine / Riverbend",
    857: "St Stephen / Evergreen",
    860: "Bishop Grandin/Cranston-Douglasdale",
    861: "Bishop Grandin/Auburn Bay",
    862: "Bishop Grandin / 52 Street",
    871: "St. Martha School/ Marlborough",
    872: "St. Alphonsus/ Rundle",
    878: "Father James Whelihan/Chaparral",
    880: "St Matthew / Heritage",
    884: "St Helena / Kincora/ Sagehill",
    888: "North Pointe / St Margaret",
    892: "St. Isabella/ Mckenzie",
    894: "St. Gregory/ 69 St SW",
    201: "Red Line C-Train",
    202: "Blue Line C-Train"
}

var ctrainStops = {
    3626: { name: '69 Street', dir: 'W' },
    3627: { name: '69 Street', dir: 'E' },
    3628: { name: 'Sirocco', dir: 'W' },
    3629: { name: 'Sirocco', dir: 'E' },
    3630: { name: '45 Street', dir: 'W' },
    3631: { name: '45 Street', dir: 'E' },
    3632: { name: 'Westbrook', dir: 'W' },
    3633: { name: 'Westbrook', dir: 'E' },
    3634: { name: 'Shaganappi Point', dir: 'W' },
    3635: { name: 'Shaganappi Point', dir: 'E' },
    3636: { name: 'Sunalta', dir: 'W' },
    3637: { name: 'Sunalta', dir: 'E' },
    3638: { name: 'Downtown - West Kerby', dir: 'W' },
    3639: { name: 'Downtown West - Kerby', dir: 'E' },
    3640: { name: 'Tuscany', dir: 'N' },
    3641: { name: 'Tuscany', dir: 'S' },
    3816: { name: 'Crowfoot', dir: 'N' },
    3817: { name: 'Crowfoot', dir: 'S' },
    3960: { name: 'Dalhousie', dir: 'S' },
    4155: { name: 'Dalhousie', dir: 'N' },
    4934: { name: 'Brentwood', dir: 'N' },
    6747: { name: 'Martindale', dir: 'S' },
    6801: { name: 'Anderson', dir: 'N' },
    6802: { name: 'Southland', dir: 'N' },
    6803: { name: 'Heritage', dir: 'N' },
    6804: { name: 'Chinook', dir: 'N' },
    6805: { name: '39 Avenue', dir: 'N' },
    6806: { name: 'Erlton / Stampede', dir: 'N' },
    6807: { name: 'Victoria Park / Stampede', dir: 'N' },
    6808: { name: 'Whitehorn', dir: 'S' },
    6809: { name: 'Rundle', dir: 'N' },
    6810: { name: 'Marlborough', dir: 'N' },
    6811: { name: 'Franklin', dir: 'N' },
    6812: { name: 'Barlow - Max Bell', dir: 'E' },
    6813: { name: 'Zoo', dir: 'E' },
    6814: { name: 'Bridgeland - Memorial', dir: 'E' },
    6815: { name: 'Brentwood', dir: 'S' },
    6816: { name: 'University', dir: 'N' },
    6817: { name: 'Banff Trail', dir: 'N' },
    6818: { name: 'Lions Park', dir: 'N' },
    6819: { name: 'SAIT / ACAD / Jubilee', dir: 'N' },
    6820: { name: 'Sunnyside', dir: 'N' },
    6822: { name: 'City Hall', dir: 'W' },
    6823: { name: '1 Street SW', dir: 'W' },
    6824: { name: '4 Street SW', dir: 'W' },
    6825: { name: '7 Street SW', dir: 'W' },
    6827: { name: '8 Street SW', dir: 'E' },
    6828: { name: '6 Street SW', dir: 'E' },
    6829: { name: '3 Street SW', dir: 'E' },
    6830: { name: 'Centre Street', dir: 'E' },
    6831: { name: 'City Hall', dir: 'E' },
    8556: { name: 'Victoria Park / Stampede', dir: 'S' },
    8557: { name: 'Erlton / Stampede', dir: 'S' },
    8558: { name: '39 Avenue', dir: 'S' },
    8559: { name: 'Chinook', dir: 'S' },
    8560: { name: 'Heritage', dir: 'S' },
    8561: { name: 'Southland', dir: 'S' },
    8562: { name: 'Sunnyside', dir: 'S' },
    8563: { name: 'SAIT / ACAD / Jubilee', dir: 'S' },
    8564: { name: 'Lions Park', dir: 'S' },
    8565: { name: 'Banff Trail', dir: 'S' },
    8566: { name: 'University', dir: 'S' },
    8567: { name: 'Bridgeland - Memorial', dir: 'W' },
    8568: { name: 'Zoo', dir: 'W' },
    8569: { name: 'Barlow - Max Bell', dir: 'W' },
    8570: { name: 'Franklin', dir: 'S' },
    8571: { name: 'Marlborough', dir: 'S' },
    8572: { name: 'Rundle', dir: 'S' },
    9261: { name: 'Fish Creek - Lacombe', dir: 'N' },
    9262: { name: 'Canyon Meadows', dir: 'N' },
    9263: { name: 'Anderson', dir: 'S' },
    9264: { name: 'Canyon Meadows', dir: 'S' },
    9385: { name: 'Whitehorn', dir: 'N' },
    9386: { name: 'Somerset - Bridlewood', dir: 'S' },
    9387: { name: 'Fish Creek - Lacombe', dir: 'S' },
    9390: { name: 'Somerset - Bridlewood', dir: 'N' },
    9391: { name: 'Shawnessy', dir: 'N' },
    9392: { name: 'Shawnessy', dir: 'S' },
    9396: { name: 'Martindale', dir: 'N' },
    9398: { name: 'Saddletowne', dir: 'N' },
    9781: { name: 'Saddletowne', dir: 'S' },
    9896: { name: 'McKnight - Westwinds', dir: 'N' },
    9897: { name: 'McKnight - Westwinds', dir: 'S' }
}

module.exports = {
    routeNames,
    ctrainStops
};