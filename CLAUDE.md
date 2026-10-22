# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Data for a dashboard for the IFPRI **Global Outlook Report (GOR) 2026** (Global Futures 2026). The inputs are IMPACT model projections, 2025–2050 in 5-year steps. Nicola Cenacchi (IFPRI) prepared them and extracted them for Nilam.

The plan is to build a static web dashboard from the four `*_REF.csv` datasets. The data and code will go in a GitHub repository and be published with GitHub Pages, so the dashboard must run entirely in the browser, with no server backend. Nicola confirmed on 2026-10-20 that all the data is cleared for public release.

There is no git repository yet. Nicola will create it and upload the files.

## Dashboard: commands and architecture

- Rebuild the browser data after any change to `*_REF.csv` or `metadata files/`: `python scripts/build_data.py` (needs pandas and openpyxl). This writes `docs/data/{food_security,prices_trade,production_demand,yield_area,meta}.json`. The script stops with an error if a region or commodity is missing from the metadata.
- Preview: `python -m http.server 8000 -d docs`, then open http://localhost:8000. Opening the file directly from disk (`file://`) fails, because the browser blocks `fetch`.
- No test suite. To check rendering, run headless Edge (`msedge --headless=new --virtual-time-budget=15000 --screenshot=... --window-size=1400,2200 "http://localhost:8000/#tab=food"`) and look at the screenshot. Use `--dump-dom` to check the `#status` text and the count of `js-plotly-plot` elements.
- GitHub Pages serves `docs/` ("Deploy from a branch", `/docs` folder). `docs/.nojekyll` disables Jekyll.
- Front end: plain JavaScript with no build step. Plotly.js 2.35.2 is loaded from the jsDelivr CDN and covers line, bar and choropleth charts. The world map's topojson also loads from Plotly's CDN.
  - `docs/js/config.js` holds all wording, **units**, colours, defaults and the 5% hunger goal. Edit wording and units there, not in `app.js`.
  - `docs/js/app.js` is organised as follows:
    - `TABS` defines the four tabs (dataset, commodity parameters, indicator options, render function). Each tab's render function builds "cards" with generic helpers: `lineChart`, `groupedBars`, `ranking`, `mapChart`, plus some tab-specific charts.
    - The state (tab, regions, year, commodities and map commodity per tab, indicator per tab, index view, trade scale) is mirrored in the URL hash, so views can be shared as links.
    - Each card has a data table and a CSV download, which is the accessible equivalent of the chart.
  - JSON layout: `data[parameter][region][commodity] = [value per year]` for 2025–2050. World Price uses region `-`.
- Design rules, from the dataviz skill and agreed in R1–R15 (see `memos/progress.md`):
  - Each selected region keeps a fixed colour slot and marker symbol for as long as it stays selected. The cap is 8 regions, so a 9th colour is never generated.
  - Series that are not regions (world price, production vs. demand) use neutral inks, so the region colours keep their meaning.
  - There is one y-axis per chart, never a dual axis.
  - Map classes: quantiles in general, fixed classes for share at risk (5% is always a class edge), and blue/red around zero for net trade.
  - Yields and world prices for commodity groups and totals (e.g. `CER`, `AllC`) are shown like individual commodities. They are IMPACT's own, properly computed aggregates (Nicola, 2026-10-21, R29). Never compute group yields or prices in the dashboard; use only the values IMPACT provides.
  - Several commodities (up to 6) are shown as small multiples, one panel per commodity, so colour always means region (R14). The map, rankings and price-change chart show one commodity, chosen with "Map and rankings show".
  - Net trade is drawn as area panels, one per region, coloured by sign (blue exports, red imports), not by region (R13).
  - The optional index view (2025 = 1) is the only derived value besides % price changes. It is not applied to share at risk or net trade, where values near or below zero make an index meaningless (R15).
  - Bar charts with regions on the category axis (population at risk, calories by food group, production vs. demand) label regions by code (`regAbbr`: `regionAbbrev` in `config.js`, else the IMPACT/ISO3 code) and add a key below the chart (R16–R18). Population at risk groups years within each region (R16).
  - Calories by food group combine `ASF` + `AQF` as "Animal-source Foods" (`kcalGroups` in `config.js`, R17). It shows 2025 next to the year chosen at the top (R25). The list order in `kcalGroups` sets the stack (bottom-up) and legend order, and each group has a fixed colour slot (R21). Population-at-risk bars show only `popBarYears` (2025, 2035, 2050; R19).
  - The share-at-risk reference line is the "5% Threshold" (`hungerGoal` in `config.js`, R20).
  - Side-by-side charts always have identical plot areas (`equalizePairs()` in `app.js`, run after each render, R23). Single-panel plot height comes from `plotHeight()`; keep new paired charts on that helper.
  - Chart heights follow the card width and the page is capped at 1,440 px, so lines keep a readable aspect ratio (R12).
- Requests log: `memos/progress.md` keeps every dashboard request (R1, R2, …) with its status. Never delete a request; mark changed ones *superseded by Rn*. Code comments cite these numbers.
- `MAP_MEMBERS` in `build_data.py` assigns non-ISO IMPACT regions (`BLT`, `BLX`, `CHM`, `SDN`, `OBN`, `RAP`, …) to the map polygons they are drawn on. This is an assumption still to be confirmed; Nicola asked to revisit it around 2026-10-23. The small-island groups (`CRB`, `OAO`, `OIO`, `OPO`) are not drawn.
- CG region labels (`CWANA`, `ESA`, …, `EUR`, `NA`, `EAPhi`) come from the metadata's "CG6-full names" column (R28). The other aggregate labels (`AGG_REGION_LABELS`: World, DVG/DVD, CGSIX/ROW, income groups; CGSIX and DVG/DVD confirmed by Nicola) and the commodity-group labels (`COMMODITY_*_LABELS`) are the dashboard's own wording.

## Files

- `original files/`: raw IMPACT extracts (`Food security.csv`, `Prices_Trade.csv`, `Total_Production.csv`), kept unchanged. They contain two scenarios, `REF` and `REF_NoCC` (reference without climate change). Source: `IFPRI Dropbox\...\Global Futures 2026\GlobalOutlookReport_nc26\IMPACT_analysis_26\Extracted_update26\Data extracts for Nilam` (see `original files/read me.txt`).
  - It also holds `Production_REF.csv`, which is not raw. It is the earlier cleaned file that combined all five production parameters, and it was superseded on 2026-10-20 by the two files below. It is kept for reference only.
- Top-level `*_REF.csv`: cleaned in Stata (the Stata script is not in this folder). They keep only `REF` and drop the `productiontype` column. These are the files the dashboard uses. They were checked on 2026-10-20 and match the raw `REF` rows exactly.
  - `Food_security_REF.csv`: `Kcal pc`, `Kcal pc by Commodity`, `Pop at risk of hunger`, `Share Pop at risk of hunger`
  - `Prices_Trade_REF.csv`: `Net Trade`, `World Price`
  - `Production_Demand_REF.csv`: `Total Demand`, `Food Demand`, `Production`
  - `Yield_Area_REF.csv`: `Total Area`, `Total Yield`. Crops only (47 commodities, no livestock), and 176 regions (Greenland has no crop data).

- `metadata files/`: reference nomenclature for regions and commodities. Nicola confirmed on 2026-10-20 that these are **the current IMPACT model standard**. Use them as the authoritative source for codes, labels, groupings and hierarchies, and don't rebuild these from the data. Each workbook has a single sheet. The headers are intentional, so leave them as they are. `CG6` marks the nomenclature for the 6 CGIAR regions and `GOR` marks the Global Outlook Report nomenclature. The header repeats across columns (pandas reads them as `CG6`, `CG6.1`, … and `GOR`, `GOR.1`, …), so refer to columns by position.
  - `regional classification.xlsx` has 158 countries. The columns are: ISO3 code (`Cty`), country name as used in the data, `WLD`, `DVG`/`DVD`, `CGSIX`/`ROW`, CG region (`CWANA`, `EAPhi`, `ESA`, `EUR`, `FSU`, `LAC`, `NA`, `SA`, `SEA`, `WCA`), World Bank income group, the CG region's full name (column `CG6-full names`, added 2026-10-21 in place of the former continent column), and a combined `REGION-Country` label.
  - `commodity classification.xlsx` has 167 IMPACT codes mapping to 77 GOR names. The columns are: IMPACT code, long group name, GOR name as used in the data, diet group (`ASF`, `CER`, `RTB`, `PUL`, `F&V`, `O&S`, `OTH`, `AQF`, plus `MLS` oilmeals and `FORx` fodder/grass), combined `GROUP-Name` label, `All`, and the sub-total (`AllA` animal, `AllC` crops, `AllF` aquatic). Most GOR names have two IMPACT codes, a `j`-prefixed and a `c`-prefixed one. This is likely IMPACT's production-activity vs. commodity split; check before relying on it. Fodder/grass (`FORx`) has no `All`/sub-total, so it is excluded from the totals.

- `scripts/build_data.py`: converts the CSVs and metadata into JSON for the browser.
- `docs/`: the website that GitHub Pages publishes (HTML/CSS/JS plus `data/*.json`).
- `README.md`: the public description of the repository, with instructions for publishing and updating.

## Data structure

These are long-format tables. The columns are `impactparameter, scenario, commodity, commodity_agg, region, regional_agg, year, value`. The older/original files also have `productiontype`, and their last column is named `Value` (capital V).

- `region` mixes countries (full names, e.g. `Angola`) with aggregates: `WLD`, `DVG`/`DVD`, `EUR`, `FSU`, `NA`, `EAPhi`, and income groups (`Low income`, `Lower middle income`, …). The CGIAR regions (`CGSIX`, `CWANA`, `WCA`, `ESA`, `SA`, `SEA`, `LAC`, `ROW`) are flagged by `regional_agg == "CG_regions"`. Filter out aggregates before summing countries, or totals will be double-counted.
- `commodity` also mixes individual commodities with aggregates: `All`, `AllA`, `AllC`, … and the diet groups (`ASF`, `CER`, `RTB`, `PUL`, `F&V`, `O&S`, `OTH`, `AQF`, flagged by `commodity_agg == "diet"`). In Food security, `-` means "not commodity-specific".
- `World Price` rows have `region == "-"` rather than `WLD`, because the price is global by definition.
- All country names and commodity names in the data match the metadata (checked 2026-10-20). The only values without a match are the placeholder `-` and the aggregate codes. Thirteen aquatic species and `Palm Kernel` appear in the metadata but not in the data.

## Gotchas

- **`NA` is a region code for North America** (confirmed by Nicola, 2026-10-20). Namibia appears separately as `Namibia`. Default CSV readers turn it into missing: use `keep_default_na=False` in pandas, or `na = character()` / `na = ""` in R `readr`.
- The files do not record units. The units below were inferred from value magnitudes on 2026-10-20 and **confirmed by Nicola on 2026-10-21**. They are set in `docs/js/config.js`:

  | `impactparameter` | Unit |
  |---|---|
  | `Production`, `Total Demand`, `Food Demand`, `Net Trade` | thousand t |
  | `Total Area` | thousand ha |
  | `Total Yield` | t/ha |
  | `World Price` | USD per t, constant prices (**base year still to confirm**; Nicola to answer on 2026-10-22) |
  | `Kcal pc`, `Kcal pc by Commodity` | kcal per person per day |
  | `Pop at risk of hunger` | million people |
  | `Share Pop at risk of hunger` | % of population |
- Share and population at risk of hunger have **negative values**. They are set to 0; see the section "Decision: negative values for population at risk of hunger" below. Some regions (China, South Korea, Palestine, Swaziland, Other Southeast Asia) have no hunger data.
- In the original `Total_Production.csv`, `productiontype` is `total` for Area/Yield and `-` for the other parameters, so dropping the column creates no duplicate keys.
- `Total Yield` and `World Price` also have rows for aggregate commodities (`All`, `AllC`, `CER`, …). These are IMPACT's own aggregates and are correct to show (R29). Don't recompute them from the individual crops: yields and prices of different crops can't simply be added or averaged.

## Decision: negative values for population at risk of hunger

**The issue.** IMPACT reports negative values for `Pop at risk of hunger` and `Share Pop at risk of hunger`: 264 rows per parameter, in 44 regions.
- Countries: 41, mostly high-income (USA, Western Europe, Russia, Australia, …), plus Burundi, Eritrea, Moldova, Albania and some small-island groups.
- Aggregates that are themselves negative: `EUR`, `NA` and `ROW`.
- Examples: USA −0.47%, Greenland −15.8%, EUR −2.4 million.
- Many countries share exactly −0.47% in every year, which suggests a fixed term of the hunger equation rather than a projection.

A negative number of people is impossible, so this is a model artefact.

**The decision.** Show negative values as 0. Nicola decided this on 2026-10-21; it is request R26 in `memos/progress.md`.
- **Implementation:** `CLIP_AT_ZERO` in `scripts/build_data.py` sets the 528 negative rows to 0 when the JSON is built. The raw and cleaned CSVs are unchanged. Doing it at build time keeps every view consistent: maps, charts, rankings and CSV downloads.
- **Exception, Burundi and Eritrea (R31, 2026-10-21, temporary):** their risk-of-hunger rows are dropped (`HUNGER_NO_DATA` in `build_data.py`), so they show as "no data" instead of 0. See the reflections below for why. Nicola will decide on a lasting treatment after checking (reminder set for 2026-10-22).
- **What users see:** the hunger map, the share and population charts and the ranking say "Negative values in the model output are shown as 0, except for Burundi and Eritrea, shown as no data because the model value is not reliable." (`hungerClipNote` in `docs/js/config.js`).
- **Aggregates are clipped but not recomputed.** IMPACT's aggregates are sums of their countries *including* the negatives. So, in 2050:
  - World is 491.5 million, while the zeroed countries add up to 497.4 million (+5.8 million, +1.2%);
  - High income is 0.3 million, against 5.6 million summing its countries;
  - developing countries (`DVG`) and the CGIAR six are off by about 1 million or less.

  We keep IMPACT's own totals so the dashboard matches the report and the model. Recomputing would also need population data, which these files don't have, to rebuild the shares.

**Reflections (Claude, 2026-10-21).** Discussed with Nicola the same day, who chose option 2 below for now (R31).
- **For high-income countries, 0 is a fair reading.** These are countries where hunger is negligible, and the model's equation simply dips below zero.
- **For Burundi and Eritrea, 0 is probably wrong.** They have the lowest calorie availability in the data: Burundi 1,943 and Eritrea 1,977 kcal per person per day in 2025. Their neighbours with more calories (Rwanda 2,032 kcal, Tanzania 2,137 kcal) show 22–29% at risk. A negative share there more likely means the hunger equation is being used outside its valid range than that hunger is absent. Shown as 0, these countries read as "no one at risk" on the map, which could mislead.
- **Options for those two countries** (and any similar low-income case):
  1. keep 0 (the choice until R31);
  2. show them as "no data", with a note that the model value is not reliable (**current, R31**);
  3. ask the IMPACT team how the hunger module behaves at very low calorie levels.

  Option 2 is the safest for a public dashboard. Option 3 is needed to know the right answer.
- **Aggregates:** if the gap between IMPACT's totals and the sum of zeroed countries matters (it is largest for High income and the developed countries), compare with how the GOR report itself handles these values.

## Project memos

The `memos/` folder holds two running notes files:

- `memos/progress.md`: a dated diary of the process, with the newest entry first. It records steps, decisions and their reasons, and problems and how they were solved, with open to-dos at the end of each entry.
- `memos/learnings.md`: a short summary of key results, methodological observations, and data or tool quirks. Standing conventions belong in this file (CLAUDE.md), not there.

Edit these files only when Nicola explicitly asks. When something worth recording comes up, offer to add it and wait for a yes.
