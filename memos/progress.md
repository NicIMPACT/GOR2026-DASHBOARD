# Progress log: GOR 2026 Dashboard

## Dashboard requests log

This is a running list of Nicola's instructions for the dashboard and the status of each, so it is clear at a glance what has been asked for, built and tested. Status values: *requested* → *built* → *tested by Nicola*. Requests are never deleted, even when later ones change them. A changed request stays in the table, marked *superseded by Rn*, so the history of what was asked stays visible (Nicola, 2026-10-21).

| # | Date | Request (Nicola) | Status |
|---|---|---|---|
| R1 | 2026-10-20 | Build an interactive dashboard from the four `*_REF.csv` datasets. Users can select countries, commodities and years. | built 2026-10-20: region/country picker (up to 8), commodity and year selectors; **tested by Nicola 2026-10-21** |
| R2 | 2026-10-20 | Display interactive line charts, bar charts and maps. | built 2026-10-20; **tested by Nicola 2026-10-21** |
| R3 | 2026-10-20 | Must work on GitHub Pages: HTML, CSS and JavaScript only, no Python server. The data and code go in a GitHub repository. | built 2026-10-20: static site in `docs/`, publishing steps in `README.md`; **tested by Nicola 2026-10-21** |
| R4 | 2026-10-20 | Keep it simple: no narrative and no IFPRI branding for now. Audience is the general public, including policymakers and decision makers. It must be easy to grasp and accessible to all. | built 2026-10-20: colour-blind-safe palette plus marker shapes, a data table and CSV download for every chart, keyboard-usable controls, dark mode, works on phones; **tested by Nicola 2026-10-21** |
| R5 | 2026-10-20 | Yields and areas as line charts. | built 2026-10-20; **tested by Nicola 2026-10-21** |
| R6 | 2026-10-20 | Population at risk of hunger as bar charts. | built 2026-10-20; **tested by Nicola 2026-10-21** |
| R7 | 2026-10-20 | Share of population at risk of hunger as line charts, with a reference line at 5% on the Y axis for the FAO goal. | built 2026-10-20; **tested by Nicola 2026-10-21** |
| R8 | 2026-10-20 | Organise in tabs: (1) yield & area, (2) production & demand, (3) prices & trade, (4) food security. | built 2026-10-20; **tested by Nicola 2026-10-21** |
| R9 | 2026-10-20 | Claude may propose additional views, e.g. maps. | built 2026-10-20: a map per tab, top-15 rankings, production vs. total demand, % change in world prices, largest net exporters/importers, calorie availability by food group; **tested by Nicola 2026-10-21** |
| R10 | 2026-10-20 | Record these instructions in the progress file, so it is clear what has been tested or asked for. | done (this table); **tested by Nicola 2026-10-21** |
| R11 | 2026-10-20 | All data are cleared for public release (Nicola confirmed). | noted; **tested by Nicola 2026-10-21** |
| R12 | 2026-10-21 | Line charts are sometimes too stretched, which makes growth rates hard to judge. Put the yield and area charts side by side, and the production line chart and the production-vs-demand bar chart side by side. | built 2026-10-21: paired charts stay side by side down to 700 px window width (was 860 px); chart height now follows card width; page width capped at 1,440 px so charts don't flatten on wide screens; production ranking moved to a full-width row; **tested by Nicola 2026-10-22** |
| R13 | 2026-10-21 | Prices & trade tab: show net trade as areas (surfaces), not lines. Regions can sit side by side along the x axis; region colours are then not needed. | built 2026-10-21: one small area panel per region, coloured by sign (blue = net exports, red = net imports, as on the map); one block of panels per selected commodity; a checkbox switches between one shared scale and a scale per region; **tested by Nicola 2026-10-22** |
| R14 | 2026-10-21 | Let users mix and match regions and commodities, e.g. one country with several crops at once. Agreed design: commodities become multi-select, and charts show small multiples (one panel per commodity), so colour keeps meaning region. Indicators stay single-select for now. | built 2026-10-21: commodity picker with search (up to 6); line charts, production vs. demand and world price show one panel per commodity; a "Map and rankings show" selector picks which commodity the map, rankings and price-change chart use; **tested by Nicola 2026-10-22** |
| R15 | 2026-10-21 | Offer an indexed view of line charts (2025 = 1) next to actual values, to make growth rates comparable across regions and crops of different size. | built 2026-10-21: "Line charts show: Values / Index (2025 = 1)"; index panels share one scale; not applied to share at risk of hunger or net trade (values near or below zero); **tested by Nicola 2026-10-22** |
| R16 | 2026-10-21 | Food security tab: the population-at-risk bar chart should show each region across time (e.g. South Asia 2025–2050), not each year across regions. | built 2026-10-21: bars grouped by region with 2025–2050 inside each group, in the region's colour; region codes on the axis, explained in a note below; **tested by Nicola 2026-10-22** |
| R17 | 2026-10-21 | Food security tab: calorie availability by food group as vertical bars. Combine animal-source and aquatic foods into one group, "Animal-source Foods" (capital F). Use region abbreviations and explain them below the chart (SA, ESA, WCA, LAC, CWANA, SEA). | built 2026-10-21: vertical stacked columns; Animal-source Foods = IMPACT ASF + AQF (7 groups instead of 8); codes on the axis with a key below; **tested by Nicola 2026-10-22** |
| R18 | 2026-10-21 | Production & demand tab: use the region abbreviations on the production-vs-demand bar chart, with a note explaining them. | built 2026-10-21: codes on the axis, key below. Countries use their ISO3/IMPACT code (e.g. KEN; China = CHM), income groups the World Bank codes (LIC, LMC, UMC, HIC); **tested by Nicola 2026-10-22** |
| R19 | 2026-10-21 | Population at risk of hunger: show only 2025, 2035 and 2050. | built 2026-10-21: years set in `popBarYears` (`config.js`); the data table and CSV show the same three years; **tested by Nicola 2026-10-22** |
| R20 | 2026-10-21 | Share at risk: rename "5% FAO goal" to "5% Threshold"; make the line darker (near black), with smaller, denser dashes reaching the y axis. | built 2026-10-21: black line (light text colour in dark mode), 4 px dash / 3 px gap, drawn across the full plot width; map legend now reads "Below 5% (threshold)"; **tested by Nicola 2026-10-22** |
| R21 | 2026-10-21 | Calorie availability by food group: legend below the chart; order (stack and legend): Animal-source Foods, Cereals, Fruits & vegetables, Oils & sugars, Pulses, Roots, tubers & bananas, Other. | built 2026-10-21: stack runs bottom-up in this order; each group keeps its previous colour; **tested by Nicola 2026-10-22** |
| R22 | 2026-10-21 | Keep the dashboard's existing region labels (e.g. "Southeast Asia & Pacific (incl. China)") in the abbreviation notes, not Nicola's alternative wording. | noted; **superseded by R28** |
| R23 | 2026-10-21 | When the window is resized, side-by-side plots must take up the same space (e.g. yield and area always the same size). | built 2026-10-21: after each render, every pair of half-width charts gets the same plot area (shared left/right margins, same plot height; legends get extra room below instead of squeezing the plot). Measured identical at 1,400, 1,100, 900, 760 and 600 px on all tabs. Also: scrollbar space reserved so charts drawn early aren't 15 px wider; long notes in empty panels now wrap. Follow-up (Nicola's screenshot, squashed share chart under a 7-row legend): the page now redraws after any width change, not only changes over 40 px; **tested by Nicola 2026-10-22** |
| R24 | 2026-10-21 | Production & demand tab: remove "Where demand exceeds production, the gap is met by imports." from the production-vs-demand chart. | built 2026-10-21: subtitle now shows the unit only; **tested by Nicola 2026-10-22** |
| R25 | 2026-10-21 | Calorie availability by food group: show two years, 2025 fixed and a second year chosen with the Year selector at the top. | built 2026-10-21: two stacked columns per region (2025 and the chosen year) on a two-level axis, years above region codes; only 2025 when 2025 is chosen; the data table and CSV have a Year column; **tested by Nicola 2026-10-22** |
| R26 | 2026-10-21 | Show negative risk-of-hunger values (population and share) as 0. Closes the open to-do from 2026-10-20. | built 2026-10-21: `build_data.py` sets the 528 negative rows (264 per parameter, 44 regions) to 0, including aggregates (EUR, NA, ROW); a note "Negative values in the model output are shown as 0." on the hunger map, charts and ranking. Aggregates are not recomputed: IMPACT's World is the sum of countries including negatives, about 5.8 million (~1%) below the sum of the clipped countries; **tested by Nicola 2026-10-22** |
| R27 | 2026-10-21 | On phones, move the map's colour legend below the map. | built 2026-10-21: below 700 px the colour bar is replaced by a wrapped legend under the map; map height on phones reduced to 250 px; **tested by Nicola 2026-10-22** |
| R28 | 2026-10-21 | Use the CG6 full region names that Nicola added to `regional classification.xlsx` for all labels where needed. CGSIX and DVG/DVD labels are correct as they are. | built 2026-10-21: `build_data.py` reads the "CG6-full names" column for the CG region labels (e.g. SEA = "Southeast and East Asia", EUR = "Western Europe", LAC = "Latin America and the Caribbean"); used in chips, legends, notes and tables; **tested by Nicola 2026-10-22** |
| R29 | 2026-10-21 | Show yields and world prices for commodity groups and totals: IMPACT's aggregates (e.g. the Cereals price) are properly computed averages and should be available. | built 2026-10-21: the "individual crops only" restriction is removed from the yield map, lines and ranking and from the world-price chart; the price-change chart highlights the chosen group or total; **tested by Nicola 2026-10-22** |
| R30 | 2026-10-21 | Units confirmed: thousand t (production, demand, net trade), thousand ha, t/ha, USD per t at constant prices, kcal per person per day, million people, % of population. Record them in CLAUDE.md. | done 2026-10-21: units table in `CLAUDE.md` (Gotchas), header of `config.js` updated; only the price base year is still open; **tested by Nicola 2026-10-22** |
| R31 | 2026-10-21 | Show Burundi and Eritrea as "no data" for risk of hunger, for the moment (their values are negative despite the lowest calorie availability in the data, so 0 would mislead). Remind Nicola tomorrow. | built 2026-10-21: `HUNGER_NO_DATA` in `build_data.py` drops their 24 hunger rows; note on hunger charts updated; aggregates unchanged. Partly revises R26 for these two countries; **tested by Nicola 2026-10-22** |
| R32 | 2026-10-21 | When the dashboard first opens, show the six CG regions by default: CWANA, ESA, LAC, SEA, SA, WCA. | built 2026-10-21: `defaults.regions` in `config.js` (was World, SA, ESA, WCA, LAC). Shared links that list regions in the URL keep their own selection; **tested by Nicola 2026-10-22** |
| R33 | 2026-10-21 | World (WLD) must not be displayable in net trade: IMPACT has no World net trade, as exports and imports cancel out globally (as for world prices, which use region "-"). | built 2026-10-21: on the Prices & trade tab World is skipped in the net trade panels with a note explaining why, its picker entry is disabled and its chip faded; it stays selected for the other tabs (`tradeExcluded` in `config.js`); **tested by Nicola 2026-10-22** |
| R34 | 2026-10-22 | Keep negative risk-of-hunger values zeroed (R26), but never recompute the aggregates, so they stay as in the Global Outlook Report and IMPACT's original results. Closes the optional to-do from 2026-10-21. | decided 2026-10-22: no code change; recorded in "Data modifications" below, in `CLAUDE.md` and in the header of `build_data.py` |
| R35 | 2026-10-22 | Remove the net trade results for Maize in China from the dashboard. | built 2026-10-22: `SERIES_NO_DATA` in `build_data.py` drops the 6 rows (2025–2050); China shows as no data on the maize net trade map and panels and drops out of the exporters/importers ranking, with "No data for: China (Maize)" below the panels; aggregates unchanged (R34). Checked in headless Edge |
| R36 | 2026-10-22 | Add Nilam Prasai to the attribution line, after Nicola's name. | built 2026-10-22: dashboard footer reads "… at the request of Nicola Cenacchi and Nilam Prasai (IFPRI), 2026-10-22." (Nilam is IFPRI, confirmed by Nicola) |
| R37 | 2026-10-22 | Tell users what to expect when switching between Values and Index: a note under the drop-down's title or an (i) button that opens on hover or click. | built 2026-10-22: (i) button next to "Line charts show"; opens on hover, stays open on click, closes with Escape or a click elsewhere; three short paragraphs (values; index with a worked example; not used for share at risk or net trade); text in `indexInfo` (`config.js`). Checked in headless Edge at 1,400 and 420 px |
| R38 | 2026-10-22 | Remove all data on fodder and grass. | built 2026-10-22: `EXCLUDE_GROUPS` in `build_data.py` drops `Fodders`, `Grass` and the `FORx` group (5,328 rows: Production and Total Demand; Total Area and Total Yield) and removes them from the commodity picker. No total changes: FORx is outside the `All` totals in the metadata |
| R39 | 2026-10-22 | With more than one crop selected, make a map available for each crop, one at a time, in a carousel users can scroll through. | built 2026-10-22: carousel above the map on the yield, production and trade tabs (‹ / ›, a dot per commodity, Left/Right keys, wraps round), only when 2+ commodities are selected. It sets the same choice as "Map and rankings show", so rankings follow the map. Checked in headless Edge: stepping, wrap-around, dots, keys, keyboard focus kept, no scroll jump, phone width |

## Data modifications

Every change the dashboard makes to IMPACT's values, in one place. All are applied in `scripts/build_data.py` when the JSON is built. The `*_REF.csv` files are never changed. **Aggregates (World, CG regions, income groups, …) are never recomputed**: they stay exactly as IMPACT reports them, even when the countries inside them were changed (R34).

| # | What | Rows | Treatment | Where in the code | Request |
|---|---|---|---|---|---|
| M1 | Negative `Pop at risk of hunger` and `Share Pop at risk of hunger`: 39 countries (mostly high-income; 41 before M2) and the aggregates EUR, NA and ROW | 504 (528 before M2) | set to 0 | `CLIP_AT_ZERO` | R26 |
| M2 | Burundi and Eritrea, both risk-of-hunger parameters, all years (negative despite the lowest calorie availability in the data) | 24 | dropped, shown as "no data". **Temporary**, pending a lasting decision | `HUNGER_NO_DATA` | R31 |
| M3 | China, `Net Trade`, Maize, all years (a model issue found by the team, being fixed) | 6 | dropped, shown as "no data". **Temporary**, until the model is fixed | `SERIES_NO_DATA` | R35 |
| M4 | Fodder and grass (`Fodders`, `Grass` and the `FORx` group), all parameters, regions and years | 5,328 | dropped entirely, and removed from the commodity picker | `EXCLUDE_GROUPS` | R38 |

What users see: M1 and M2 are explained in a note on the hunger map, charts and ranking (`hungerClipNote` in `config.js`). M3 shows only the generic "No data for: China (Maize)". M4 has no note: fodder and grass simply aren't offered.

Not a data change, but related: World has no net trade in IMPACT, so it is skipped on the trade tab (R33, `tradeExcluded` in `config.js`).

Diary entries follow, newest first.

---

## 2026-10-22: aggregates not recomputed; China maize net trade and fodder removed; index info and map carousel (R34–R39)

**Steps**
- Nicola tested R12–R33 and confirmed they work; they are marked in the requests log.
- Claude summarised the open question of recomputing the risk-of-hunger aggregates (below). Nicola decided not to recompute (R34).
- Added the "Data modifications" section above (Nicola's request), so every change to IMPACT's values can be found quickly.
- Removed China's maize net trade (R35): `SERIES_NO_DATA` in `build_data.py`, a list of (parameter, region, commodity) series to drop, so other single series can be added the same way. Rebuilt the JSON (6 rows dropped) and checked the trade tab in headless Edge with China, USA and SEA and with Maize and Wheat. China is grey on the maize map, its maize panel says "No data", and China's wheat and the SEA aggregate are unchanged.
- Four more requests (R36–R39):
  - Nilam Prasai (IFPRI) added to the attribution line after Nicola, in the dashboard footer and in `README.md` (R36).
  - An (i) button next to "Line charts show" explains values vs. index (R37).
  - Fodder and grass removed from the dashboard entirely (R38, M4): 5,328 rows dropped at build time, and the group is gone from the commodity picker.
  - A map carousel when two or more commodities are selected (R39).
- Tested R37 and R39 by driving headless Edge through its DevTools protocol (a Python script using `websockets`): carousel arrows, wrap-around, dots, Left/Right keys, the "Map and rankings show" drop-down, keyboard focus after each step, scroll position, and the (i) button's hover, click, Escape and phone-width placement. Screenshots at 1,400 and 420 px; one-commodity views show no carousel.

**The question about the hunger aggregates (summary given to Nicola)**
- Negative risk-of-hunger values are shown as 0 (R26). Aggregates are clipped at 0 too, but not recomputed. IMPACT sums countries *including* their negatives, so its totals are below the sum of the zeroed countries. In 2050:
  - World: 491.5 million (IMPACT) vs. 497.4 million summing the zeroed countries (+5.8 million, +1.2%);
  - High income: 0.3 vs. 5.6 million;
  - DVG and CGSIX: about 1 million or less.
- Why IMPACT's totals had been kept: they match the GOR report and the model; and shares can't be recomputed without population data by country, which these files don't have.
- Options: (1) keep IMPACT's totals; (2) recompute population totals only (breaks consistency with the report and with the shares); (3) recompute population and shares (needs IMPACT population data; furthest from the report); (4) keep IMPACT's totals and add a note that they include negative country values.

**Decisions and why**
- **Aggregates are never recomputed (R34, option 1).** Nicola: negative values stay zeroed, but aggregates must remain as in the Global Outlook Report and IMPACT's original results. The same rule applies to M2 and M3: the aggregates that contain Burundi, Eritrea or China's maize trade are unchanged.
- **China's maize net trade dropped, not edited (R35).** It is removed at build time, like M2, so the source CSVs stay untouched and every view (map, panels, ranking, CSV download) is consistent. IMPACT's series shows China as a large net exporter in 2025 (+31.5 million t), swinging to −7.0 million t in 2040 and +6.4 million t in 2045. Reason (Nicola, 2026-10-22): the team found an issue in the model for this series and is working on it. The generic "No data for: China (Maize)" is enough for users; no extra note on the dashboard.
- **(i) button rather than a note under the title (R37).** Nicola offered either. A permanent note would push the filter row down for every user; the button explains on demand. It opens on hover but also on click, so it works on phones and with the keyboard. The wording is in `indexInfo` (`config.js`) and includes a worked example (1.25 = 25% above 2025), because "2025 = 1" alone is abstract for a general audience.
- **Fodder and grass dropped by group, at build time (R38).** `EXCLUDE_GROUPS = {"FORx"}` takes the member commodities from the metadata, so any future FORx commodity is excluded too. No total changes: in the metadata FORx has no `All` or sub-total.
- **Carousel tied to "Map and rankings show" (R39).** The carousel sets the same choice as the drop-down, so the map and the rankings below always show the same commodity. The alternative, a carousel that moves the map only, would let the map and the ranking show different crops on the same screen. Claude proposed this; Nicola to confirm. The carousel redraws the tab on each step, like the drop-down, and puts keyboard focus back on the button pressed.

**Problems found and solved**
- Simulated mouse events on the (i) button at first did nothing. The test, not the button, was at fault: headless Edge driven over the DevTools protocol ignored `--window-size` and used a small viewport, so the button was off-screen. Setting the viewport with `Emulation.setDeviceMetricsOverride` fixed it.
- A reused browser profile restored the previous run's scroll position, which looked like a scroll jump. With a fresh profile per run the position stays at 0 through every carousel step. Leftover Edge processes had to be killed as a whole process tree.

**Open to-dos**
- Nicola: test R34–R39 and mark them in the requests log; confirm the carousel should also drive the rankings (R39).
- Base year of the constant-price USD for world prices.
- Lasting treatment of Burundi and Eritrea's hunger values (M2, R31).
- When the model issue behind China's maize net trade is fixed: get the new extract, remove the entry from `SERIES_NO_DATA`, rebuild, and update M3.
- Map shapes for combined IMPACT regions (`MAP_MEMBERS`): revisit around 2026-10-23.
- Copy the Stata cleaning script into the project folder.

---

## 2026-10-21: second round of dashboard changes (R12–R33)

**Steps**
- Nicola tested the first version and marked R1–R11 as tested. Two more rounds of requests followed, logged as R12–R33 in the table above. All are built; none is marked tested yet.
- Layout and charts (R12–R15): paired charts side by side, net trade as area panels coloured by sign, several commodities at once as small multiples, and an index view (2025 = 1).
- Food security tab (R16, R17, R19–R21, R25):
  - population at risk is grouped by region, for 2025, 2035 and 2050;
  - the reference line is renamed "5% Threshold", black with short dashes;
  - calorie availability by food group is drawn as vertical stacked columns, with "Animal-source Foods" (ASF + AQF), in Nicola's group order, with the legend below, for 2025 and the year chosen at the top.
- Region codes on bar-chart axes with a key below (R16–R18). The production-vs-demand subtitle about imports was removed (R24).
- Equal plot sizes for paired charts at any window width (R23).
- Data decisions:
  - negative risk-of-hunger values are shown as 0 (R26);
  - CG region labels now come from the metadata (R28);
  - IMPACT's group yields and prices are shown (R29);
  - units confirmed by Nicola and recorded in `CLAUDE.md` (R30);
  - Burundi and Eritrea shown as "no data" for risk of hunger, for now (R31).
- `CLAUDE.md` gained a section "Decision: negative values for population at risk of hunger", and `memos/learnings.md` was updated (Nicola's request).
- The map legend moves below the map on phones (R27).
- The dashboard now opens with the six CG regions (CWANA, ESA, LAC, SEA, SA, WCA) instead of World plus four regions (R32).
- World is excluded from net trade on the Prices & trade tab (R33).
- Every change was checked in headless Edge: all four tabs, several window widths (1,400 to 500 px), and edge cases (8 regions, regions with no data, several commodities, year 2025).

**Decisions and why**
- **Region codes on bar-chart axes, with a key below (R16–R18).** Full names don't fit under 15–30 bars. Countries use their ISO3 or IMPACT code (China = `CHM`, IMPACT's code), and income groups the World Bank codes (LIC, LMC, UMC, HIC). These codes are in `regionAbbrev` in `config.js`.
- **Population at risk grouped by region (R16).** It uses a two-level axis (years above region codes), so each bar keeps its region's colour and no legend is needed.
- **Animal-source Foods = ASF + AQF (R17).** The two IMPACT diet groups are summed for each region and year. Each food group keeps a fixed colour slot when the order changes (R21), so colours don't shift between versions.
- **Equal plot sizes (R23).** Plotly sizes each chart's margins from its own tick labels and legend, so paired plots differed (e.g. area 529 px vs. yield 563 px wide; at 760 px a legend squashed the yield plot to 194 px instead of 260 px). After each render, `equalizePairs()` gives both charts in a pair the larger margins and the same plot height, and then stops Plotly from re-expanding the margins. Bar charts now use the same height rule as the line charts (`plotHeight()`). The page redraws on any width change.
- **Negatives set to 0 in the build script, not in the browser (R26).** One place to change, and every view (maps, charts, rankings, CSV downloads) stays consistent. Aggregates are clipped but not recomputed. IMPACT's World total is the sum of countries including the negatives (2050: 491.5 million, vs. 497.4 million summing the clipped countries). Recomputing would make World differ from IMPACT's figure, and shares would need population data that isn't in these files.
- **Group yields and prices (R29).** Nicola confirmed that IMPACT's aggregates are properly computed, e.g. the Cereals price is IMPACT's average across cereals. The dashboard shows them as provided and never recomputes them.
- **Burundi and Eritrea as "no data" (R31).** Writing the negative-values section, Claude checked which countries the zeroing affects. Most are high-income, where 0 is a fair reading. But Burundi and Eritrea are negative in every year despite the lowest calorie availability in the data (~1,950 kcal per person per day in 2025), while neighbours with more calories show 22–29% at risk. Shown as 0, the map would say "no one at risk". Of the three options (keep 0, show no data, ask the IMPACT team), Nicola chose "no data" for the moment. Their rows are dropped at build time (`HUNGER_NO_DATA`); aggregates are unchanged.
- **World kept in the selection, skipped on the trade tab (R33).** IMPACT has no World net trade, because exports and imports cancel out globally. The region selection is shared by all four tabs, so removing World on the trade tab would lose the user's choice when switching back. Instead, the net trade panels skip World with a note explaining why, the picker's World checkbox is disabled on that tab, and its chip is faded. The rule is in `tradeExcluded` in `config.js`, so other regions can be added if needed.
- **Units (R30).** Nicola confirmed all the inferred units: thousand t, thousand ha, t/ha, USD per t at constant prices, kcal per person per day, million people, % of population. They are recorded as a table in `CLAUDE.md`. The base year of the constant prices is still open.
- **Region labels (R28).** These come from the metadata's new "CG6-full names" column, replacing the dashboard's own wording. This supersedes R22.

**Problems found and solved**
- Paired charts were unequal in size, and a long legend (6+ regions) squashed the line chart above it. Fixed by R23 (see above).
- Charts drawn before the page grew long enough to scroll were 15 px wider than later ones. Fixed by reserving the scrollbar's space (`scrollbar-gutter: stable`).
- The "choose a crop" message ran past the edges of narrow empty panels. It now wraps. (The message itself went away with R29, but the wrapping applies to all empty-panel notes.)
- In R12–R15 testing, the "No data" text sat on top of a zero line, and the trade panels were too short with 8 regions. Both were fixed.
- The regional classification workbook's 8th column changed from continent to "CG6-full names". `build_data.py` was updated; the continent wasn't used by the dashboard.
- Headless Edge can't render dark mode reliably for screenshots. Nicola checked dark mode by eye and confirmed the threshold line is fine.
- After the R28 rebuild, Nicola still saw the old region names: the browser was reusing a cached copy of `meta.json`. Fixed by fetching data files with `cache: "no-cache"`, so the browser always checks with the server (a hard refresh, Ctrl+F5, is still needed after code changes).

**Open to-dos**
- Nicola: test R12–R33 and mark them in the requests log.
- Map shapes for combined IMPACT regions (`MAP_MEMBERS`): Nicola asked to revisit around 2026-10-23.
- Confirm the base year of the constant-price USD for world prices (other units confirmed, R30). Reminder set for 2026-10-22.
- Decide the lasting treatment of Burundi and Eritrea's hunger values (R31), possibly after asking the IMPACT team how the hunger module behaves at very low calorie levels. Reminder set for 2026-10-22.
- AI attribution line in the footer: fine for now (Nicola, 2026-10-21).
- Optional: recompute aggregate risk-of-hunger totals from the zeroed countries (see R26). Not requested.
- Copy the Stata cleaning script into the project folder (from 2026-10-20).
- Create the GitHub repository, upload, and enable Pages from `/docs`.

---

## 2026-10-20 (evening): first version of the dashboard

**How to reopen the dashboard**
1. Open a terminal in the project folder (`C:\GOR Dashboard`).
2. Run `python -m http.server 8000 -d docs`.
3. Open http://localhost:8000 in a browser. Stop the server with Ctrl+C when finished.

Double-clicking `docs/index.html` does not work, because browsers block loading the data files from disk. If the data CSVs or metadata change, first run `python scripts/build_data.py` to rebuild `docs/data/*.json`.

**Steps**
- Recorded Nicola's dashboard instructions as R1–R11 in the requests log above. R1–R9 are now built.
- Wrote `scripts/build_data.py`. It reads the four `*_REF.csv` files and the two metadata workbooks and writes compact JSON to `docs/data/`, about 4.2 MB, or 1.7 MB compressed.
  - Values are copied unchanged.
  - It reads with `keep_default_na=False`, so `NA` (North America) survives.
  - It stops if a region or commodity is missing from the metadata.
- Built the static site in `docs/`: `index.html`, `css/style.css`, `js/config.js` (wording, units, colours, defaults) and `js/app.js` (logic). It has four tabs, in Nicola's order. One filter row at the top applies to every chart: regions/countries (up to 8), commodity, indicator and year. The year drives the maps and rankings; line charts always show 2025–2050.
- Added views beyond the brief (R9):
  - a map on every tab
  - top-15 rankings
  - production vs. total demand
  - % change in world prices within a food group
  - largest net exporters/importers
  - calorie availability per person and by food group
- Accessibility (R4):
  - colour-blind-safe palette (the dataviz skill's reference palette), with a marker shape per region as a second cue
  - a data table and CSV download under every chart
  - keyboard-usable tabs and picker
  - dark mode
  - single-column layout on phones
  - the URL holds the current view, so links can be shared
- Added `README.md` (publishing and update instructions) and `docs/.nojekyll`. Updated `CLAUDE.md`.
- Tested with headless Edge on all four tabs, in light and dark mode, at desktop and 600 px width, plus edge cases: the 8-region cap, regions with no data, commodity groups, and year 2025. Bugs found and fixed:
  - a y-axis title leaking onto the x axis (a shared object)
  - hair-thin population bars (the year axis was numeric)
  - value labels on negative bars overlapping the country names
  - a mislabelled net-trade legend class

**Decisions and why**
- **Plotly.js** (CDN, pinned at 2.35.2). One library covers lines, bars and maps, with hover readouts and PNG export. The trade-off is size (about 1 MB). Chart.js plus a separate map library would be lighter but means more code.
- **Pre-built JSON** rather than reading the CSVs in the browser. It loads faster, joins in ISO3 codes for the map, and adds the metadata labels.
- **Each region keeps a fixed colour for as long as it stays selected**, with a cap of 8, so no 9th colour is ever invented. Non-region series (world price, production vs. demand) are in grey or black, so colours always mean regions.
- **Map classes.** Shares at risk use fixed classes with 5% as an edge (<5% = goal). Net trade uses blue/red around zero. Everything else uses quantile classes.
- **Yield and world price are shown for individual commodities only.** Values for groups (e.g. "Cereals") are ambiguous averages.
- **Negative hunger values are shown as reported for now**, pending Nicola's decision (see to-dos).

**Problems found**
- 264 of the 1,032 risk-of-hunger rows are negative, in 44 regions (e.g. USA −0.47%, Greenland −15.8%, Europe −2.4 million people). This is probably a model artefact.
- China, South Korea, Palestine, Swaziland and Other Southeast Asia have no risk-of-hunger data. World has no net-trade value. The dashboard shows "No data for: …" notes for these.
- 19 IMPACT region codes are not standard ISO3 (e.g. `BLT` Baltic States, `CHM` China, `RAP` Rest of Arabia), so the map needs to know which country shapes to draw for each. Small-island groups (`CRB`, `OAO`, `OIO`, `OPO`) are not drawn on the map.
- Node.js is not installed, so the palette checker could not be run. The skill's pre-validated palette is used unchanged.

**Open to-dos**
- Nicola: test the dashboard and mark items "tested by Nicola" in the requests log.
- Decide how to show negative risk-of-hunger values: as reported, as 0 with a footnote, or hidden.
- Confirm the units in `docs/js/config.js`, especially the base year for world prices.
- Confirm the labels for aggregate regions (e.g. "Southeast Asia & Pacific (incl. China)", "East Asia & Pacific, high income" for EAPhi) and the country shapes used for each combined IMPACT region (`MAP_MEMBERS` in `build_data.py`).
- Confirm that hiding yields and world prices for commodity groups is acceptable.
- Confirm the AI attribution line in the dashboard footer.
- Create the GitHub repository, upload, and enable Pages from `/docs`.

---

## 2026-10-20

**Steps**
- Nicola added `metadata files/` with `regional classification.xlsx` and `commodity classification.xlsx`. These are the current IMPACT nomenclature standard for regions and commodities. Their headers are intentional: `CG6` marks the 6-CGIAR-region nomenclature and `GOR` marks the Global Outlook Report nomenclature. Their columns are documented in `CLAUDE.md`.
- Cross-checked the metadata against the four `*_REF.csv` files:
  - All 158 countries and every commodity name in the data appear in the metadata. The only unmatched data values are the placeholder `-` and the aggregate codes.
  - Thirteen aquatic species and `Palm Kernel` are in the metadata but not in the data.
  - `World Price` rows use region `-`, not `WLD`.
- Set up the project `CLAUDE.md`. It describes the data files, their structure, and the reading issues listed below.
- Nicola split the cleaned production file into two:
  - `Production_Demand_REF.csv`, with Total Demand, Food Demand and Production.
  - `Yield_Area_REF.csv`, with Total Area and Total Yield.

  The old combined `Production_REF.csv` was moved into `original files/` for reference. The redundant `Total Demand_REF.csv` was deleted; it duplicated the Total Demand rows of `Production_REF.csv`.
- Checked the new files in Python (pandas, reading with `keep_default_na=False`):
  - The two new files together reproduce the old `Production_REF.csv` exactly: 245,526 rows, no rows missing or added, and no value differences.
  - All four top-level `*_REF.csv` files match the `REF` rows of the raw extracts in `original files/` exactly.
  - No file has duplicate keys or non-numeric values.

**Decisions**
- The metadata workbooks are the authoritative source for region and commodity codes, groupings and hierarchies. Don't rebuild these from the data.
- The production data is split into two files, demand/production and yield/area. Yield and area cover crops only, which have a different commodity set from demand and production.
- The cleaned files keep only the `REF` scenario. `REF_NoCC` is still available in the raw files if needed.

**Problems found**
- Region code `NA` (North America, confirmed by Nicola the same day) is read as missing by default CSV readers. Always read with `keep_default_na=False` (pandas) or the equivalent in R.

**Open to-dos**
- Copy the Stata cleaning script into this folder, so the cleaned files can be traced back to how they were made.
- Confirm the units for each `impactparameter` from IMPACT documentation.
- ~~Confirm what `NA` stands for.~~ Done: North America (confirmed by Nicola, 2026-10-20).
- Confirm that the `j`/`c` IMPACT code prefixes mean production activity vs. commodity.
- Typo in `commodity classification.xlsx`: "Mmolluscs and other invertebrates". It doesn't affect the current data, since that species isn't in it.
- Confirm how aggregate-commodity yields (`All`, `CER`, …) are computed.
- `original files/read me.txt` still describes only the raw files. Add a note that `Production_REF.csv` there is a superseded cleaned file.

---
*Produced by Claude (Anthropic), an AI model, at the request of Nicola Cenacchi (IFPRI), 2026-10-20.*
