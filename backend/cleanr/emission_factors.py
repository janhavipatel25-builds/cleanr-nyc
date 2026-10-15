"""CO2 emission factors for fossil generation in New York.

Source: U.S. EPA, Emissions & Generation Resource Integrated Database (eGRID2023, rev 2, June 2025),
state-level sheet ST23, row NY:
  - STGCO2RT  "State annual CO2 gas output emission rate (lb/MWh)"  = 932.164
  - STOCO2RT  "State annual CO2 oil output emission rate (lb/MWh)"  = 1121.16
https://www.epa.gov/egrid/download-data

Direct (smokestack) emissions only. Nuclear, hydro, wind and other renewables count as 0.
"""

SOURCE = "EPA eGRID2023 (rev 2), New York state output emission rates, sheet ST23"

LB_PER_MWH = {
    "gas": 932.164,
    "oil": 1121.16,
}

LB_TO_G = 453.59237  # grams per pound; lb/MWh × 0.45359237 = g/kWh

G_PER_KWH = {fuel: rate * LB_TO_G / 1000 for fuel, rate in LB_PER_MWH.items()}

# Which factor each NYISO fossil category uses.
CATEGORY_FUEL = {
    "Natural Gas": "gas",
    "Dual Fuel": "gas",  # dual-fuel units mostly burn gas
    "Other Fossil Fuels": "oil",
}
