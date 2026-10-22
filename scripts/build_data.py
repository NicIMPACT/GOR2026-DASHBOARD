"""
Build the dashboard's browser-ready data files from the cleaned IMPACT extracts.

Run from the project root whenever the input CSVs or metadata change:

    python scripts/build_data.py

INPUTS (project root)
  Food_security_REF.csv, Prices_Trade_REF.csv,
  Production_Demand_REF.csv, Yield_Area_REF.csv
      IMPACT model projections, scenario REF only, 2025-2050 in 5-year steps.
      Source: Global Futures 2026 / GlobalOutlookReport_nc26 /
      IMPACT_analysis_26 / Extracted_update26 / Data extracts for Nilam
      (IFPRI Dropbox; raw extracts not kept in this repository).
      Cleaned in Stata by N. Cenacchi; the Stata script is not in this folder.
  metadata files/regional classification.xlsx
  metadata files/commodity classification.xlsx
      Current IMPACT nomenclature standard (confirmed by N. Cenacchi, 2026-10-20).

OUTPUTS (docs/data/, served by GitHub Pages)
  <dataset>.json : {"years": [...], "data": {parameter: {region: {commodity: [v per year]}}}}
                   Values are copied unchanged from the CSVs (no rounding), except that
                   negative risk-of-hunger values are set to 0 (see CLIP_AT_ZERO) and
                   HUNGER_NO_DATA countries' risk-of-hunger rows, the
                   SERIES_NO_DATA series and the EXCLUDE_GROUPS commodities
                   (fodder and grass) are dropped;
                   a missing year is written as null.
  meta.json      : region and commodity lists with labels, ISO3 codes and groupings.

KEY ASSUMPTIONS (flagged; see memos/progress.md)
  - Region code "NA" is North America, NOT a missing value -> read with keep_default_na=False.
  - Labels for the CG regions (CWANA, ESA, ..., EUR, NA, EAPhi) come from the "CG6-full names"
    column of the regional classification (added by Nicola, 2026-10-21, R28). Labels for the
    other aggregates (AGG_REGION_LABELS: WLD, DVG/DVD, CGSIX/ROW, income groups) and for
    commodity groups (COMMODITY_GROUP_LABELS) were written for the dashboard.
  - MAP_MEMBERS: which ISO3 map polygons each non-standard IMPACT region code is drawn on.
    This is our assumption about IMPACT region composition and should be checked.
  - CLIP_AT_ZERO: IMPACT reports negative population/share at risk of hunger for 44 regions
    (264 rows per parameter; a model artefact). Shown as 0 (Nicola, 2026-10-21, R26).
    Aggregates are clipped too but NOT recomputed: IMPACT's World total is the sum of
    country values including the negatives, so it stays about 5.8 million (~1%) below the
    sum of the clipped country values. Nicola confirmed on 2026-10-22 (R34) that aggregates
    are never recomputed, so they match the Global Outlook Report and IMPACT's results.
  - All changes to the data are listed in memos/progress.md, section "Data modifications".
"""

import json
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "docs" / "data"

DATASETS = {
    "food_security": "Food_security_REF.csv",
    "prices_trade": "Prices_Trade_REF.csv",
    "production_demand": "Production_Demand_REF.csv",
    "yield_area": "Yield_Area_REF.csv",
}
YEARS = [2025, 2030, 2035, 2040, 2045, 2050]

# Aggregate regions as they appear in the data's `region` column. Keys are codes from
# the regional classification columns CG6.1-CG6.5. For CG regions (type cgregion /
# otherregion) the label here is only a fallback: build_meta uses the metadata's full names.
# The other labels are ours; CGSIX and DVG/DVD confirmed by Nicola, 2026-10-21.
AGG_REGION_LABELS = {
    "WLD": ("World", "world"),
    "DVG": ("Developing countries", "development"),
    "DVD": ("Developed countries", "development"),
    "CGSIX": ("Six CGIAR regions (total)", "cgsix"),
    "ROW": ("Rest of the world (outside the six CGIAR regions)", "cgsix"),
    "CWANA": ("Central and West Asia and North Africa", "cgregion"),
    "ESA": ("East and Southern Africa", "cgregion"),
    "WCA": ("West and Central Africa", "cgregion"),
    "SA": ("South Asia", "cgregion"),
    "SEA": ("Southeast and East Asia", "cgregion"),
    "LAC": ("Latin America and the Caribbean", "cgregion"),
    "EUR": ("Western Europe", "otherregion"),
    "FSU": ("Former Soviet Union", "otherregion"),
    "NA": ("North America", "otherregion"),
    "EAPhi": ("East Asia & Pacific, high income", "otherregion"),
    "Low income": ("Low income", "income"),
    "Lower middle income": ("Lower middle income", "income"),
    "Upper middle income": ("Upper middle income", "income"),
    "High income": ("High income", "income"),
}

# IMPACT region codes that are not a single standard ISO3 country, mapped to the ISO3
# polygons used to draw them on the world map. ASSUMPTION - verify against IMPACT docs.
# Small-island groups (CRB, OAO, OIO, OPO) are left off the map: their polygons are
# mostly too small to see at world scale; their values still appear in charts and tables.
MAP_MEMBERS = {
    "BLT": ["EST", "LVA", "LTU"],
    "BLX": ["BEL", "LUX"],
    "CHM": ["CHN", "HKG", "MAC"],
    "CHP": ["CHE", "LIE"],
    "FNP": ["FIN"],
    "FRP": ["FRA"],
    "ITP": ["ITA"],
    "MOR": ["MAR"],
    "RAP": ["ARE", "BHR", "KWT", "OMN", "QAT"],
    "SPP": ["ESP"],
    "UKP": ["GBR"],
    "GSA": ["GUY", "SUR", "GUF"],
    "SDN": ["SDN", "SSD"],
    "OBN": ["BIH", "MKD", "MNE", "SRB", "XKX"],
    "OSA": ["BRN", "SGP"],
    "CRB": [], "OAO": [], "OIO": [], "OPO": [],
}

# Commodity aggregates: labels are ours, group membership comes from the metadata.
COMMODITY_TOTAL_LABELS = {
    "All": "All commodities",
    "AllC": "All crops",
    "AllA": "All animal-source foods",
    "AllF": "All aquatic foods",
}
COMMODITY_GROUP_LABELS = {
    "ASF": "Animal-source foods",
    "CER": "Cereals",
    "RTB": "Roots, tubers & bananas",
    "PUL": "Pulses",
    "F&V": "Fruits & vegetables",
    "O&S": "Oils & sugars",
    "OTH": "Other crops",
    "AQF": "Aquatic foods",
    "MLS": "Oilmeals",
}
# Diet groups left out of the dashboard entirely: their member commodities and the group
# row itself are dropped from every dataset and from meta.json. Fodder and grass (FORx:
# Fodders, Grass) are not part of the "All" totals in the metadata, so no total is affected
# (Nicola, 2026-10-22, R38).
EXCLUDE_GROUPS = {"FORx"}


# Parameters whose negative values are model artefacts and are written as 0 (R26).
CLIP_AT_ZERO = {"Pop at risk of hunger", "Share Pop at risk of hunger"}
# Countries whose risk-of-hunger values are dropped (shown as "no data"), not set to 0:
# negative in every year despite the lowest calorie availability in the data (~1,950 kcal
# per person per day in 2025), so 0 ("no one at risk") would mislead. Temporary, pending a
# check with the IMPACT team (Nicola, 2026-10-21, R31). Aggregates are not changed.
HUNGER_NO_DATA = {"Burundi", "Eritrea"}
# Single series removed from the dashboard (shown as "no data"), as (parameter, region,
# commodity). Aggregates that include them are not changed (Nicola, 2026-10-22).
#   - China maize net trade (R35): a model issue the team is fixing; temporary. IMPACT shows China as a large net
#     exporter in 2025 (+31.5 million t), swinging to -7.0 in 2040 and +6.4 in 2045.
SERIES_NO_DATA = {("Net Trade", "China", "Maize")}


def read_csv(name):
    # keep_default_na=False: the region code "NA" (North America) must stay a string.
    df = pd.read_csv(ROOT / name, keep_default_na=False)
    df["value"] = pd.to_numeric(df["value"])
    return df


def build_dataset(df):
    nested = {}
    for (param, region, commodity), g in df.groupby(["impactparameter", "region", "commodity"]):
        by_year = dict(zip(g["year"], g["value"]))
        nested.setdefault(param, {}).setdefault(region, {})[commodity] = [
            None if y not in by_year else float(by_year[y]) for y in YEARS
        ]
    return {"years": YEARS, "data": nested}


def build_meta(all_regions, all_commodities):
    reg = pd.read_excel(ROOT / "metadata files" / "regional classification.xlsx", keep_default_na=False)
    # Columns by position (headers repeat by design): code, name, WLD, DVG/DVD,
    # CGSIX/ROW, CG region, income group, CG region full name, combined label.
    # (Until 2026-10-21 the 8th column was the continent; Nicola replaced it with the full names.)
    reg.columns = ["iso", "name", "wld", "dev", "cgsix", "cgregion", "income", "cgname", "combined"]
    cg_names = reg.groupby("cgregion")["cgname"].unique()
    clash = {k: list(v) for k, v in cg_names.items() if len(v) != 1}
    if clash:
        raise SystemExit(f"CG regions with more than one full name in the metadata: {clash}")
    cg_names = {k: v[0] for k, v in cg_names.items()}
    regions = []
    for r in reg.itertuples():
        regions.append({
            "id": r.name, "label": r.name, "type": "country", "code": r.iso,
            "map": MAP_MEMBERS.get(r.iso, [r.iso]),
            "dev": r.dev, "cgsix": r.cgsix, "cgregion": r.cgregion,
            "income": r.income,
        })
    for code, (label, kind) in AGG_REGION_LABELS.items():
        regions.append({"id": code, "label": cg_names.get(code, label), "type": kind, "code": code})
    known = {r["id"] for r in regions}
    missing = sorted(set(all_regions) - known - {"-"})
    if missing:
        raise SystemExit(f"Regions in data but not in metadata/labels: {missing}")

    com = pd.read_excel(ROOT / "metadata files" / "commodity classification.xlsx", keep_default_na=False)
    # Columns by position: IMPACT code, long group name, GOR name, diet group,
    # combined label, All, sub-total.
    com.columns = ["impact", "group_long", "name", "group", "combined", "all", "total"]
    com = com[~com["group"].isin(EXCLUDE_GROUPS)].drop_duplicates("name")
    commodities = []
    for c in com.itertuples():
        commodities.append({"id": c.name, "label": c.name, "kind": "item",
                            "group": c.group, "total": c.total or None})
    for code, label in COMMODITY_TOTAL_LABELS.items():
        commodities.append({"id": code, "label": label, "kind": "total"})
    for code, label in COMMODITY_GROUP_LABELS.items():
        commodities.append({"id": code, "label": label, "kind": "group"})
    known = {c["id"] for c in commodities}
    missing = sorted(set(all_commodities) - known - {"-"})
    if missing:
        raise SystemExit(f"Commodities in data but not in metadata/labels: {missing}")

    return {"regions": regions, "commodities": commodities,
            "groups": COMMODITY_GROUP_LABELS, "years": YEARS}


def excluded_commodities():
    """Commodity names (and group codes) of the EXCLUDE_GROUPS diet groups, per the metadata."""
    com = pd.read_excel(ROOT / "metadata files" / "commodity classification.xlsx", keep_default_na=False)
    group = com.iloc[:, 3]  # diet group column (by position: headers repeat by design)
    return set(com.loc[group.isin(EXCLUDE_GROUPS)].iloc[:, 2]) | EXCLUDE_GROUPS


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    all_regions, all_commodities = set(), set()
    excluded = excluded_commodities()
    for key, fname in DATASETS.items():
        df = read_csv(fname)
        assert set(df["scenario"]) == {"REF"}, f"{fname}: expected scenario REF only"
        assert set(df["year"]) <= set(YEARS), f"{fname}: unexpected years"
        drop = df["commodity"].isin(excluded)
        if drop.any():
            print(f"{fname}: {drop.sum()} rows dropped for excluded groups {sorted(EXCLUDE_GROUPS)}")
            df = df[~drop].copy()
        all_regions |= set(df["region"])
        all_commodities |= set(df["commodity"])
        drop = df["impactparameter"].isin(CLIP_AT_ZERO) & df["region"].isin(HUNGER_NO_DATA)
        if drop.any():
            print(f"{fname}: {drop.sum()} risk-of-hunger rows dropped for {sorted(HUNGER_NO_DATA)}")
            df = df[~drop].copy()
        keys = list(zip(df["impactparameter"], df["region"], df["commodity"]))
        drop = pd.Series([k in SERIES_NO_DATA for k in keys], index=df.index)
        if drop.any():
            print(f"{fname}: {drop.sum()} rows dropped for {sorted(set(k for k in keys if k in SERIES_NO_DATA))}")
            df = df[~drop].copy()
        neg = df["impactparameter"].isin(CLIP_AT_ZERO) & (df["value"] < 0)
        if neg.any():
            print(f"{fname}: {neg.sum()} negative risk-of-hunger values set to 0")
            df.loc[neg, "value"] = 0.0
        out = build_dataset(df)
        out["source"] = fname
        path = OUT / f"{key}.json"
        path.write_text(json.dumps(out, separators=(",", ":")), encoding="utf-8")
        print(f"{path.relative_to(ROOT)}: {len(df):,} rows, {path.stat().st_size / 1e6:.1f} MB")

    meta = build_meta(all_regions, all_commodities)
    (OUT / "meta.json").write_text(json.dumps(meta, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")
    print("docs/data/meta.json written")


if __name__ == "__main__":
    main()
