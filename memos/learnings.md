# Learnings: GOR 2026 Dashboard

## Data quirks
- **`NA` is a region, not a missing value.** `NA` is North America (confirmed by Nicola, 2026-10-20); Namibia appears separately as `Namibia`. Pandas and R read it as missing by default, which silently drops 1,224 rows in `Production_Demand_REF.csv` alone.
- **Aggregates sit alongside individual entries.** `region` mixes countries with world, income-group and CGIAR-region aggregates. `commodity` mixes single commodities with `All*` and diet-group aggregates. Sums that don't filter these out double-count.
- **Area and yield cover crops only.** They have 47 commodities (no livestock) and no Greenland. Their commodity and region sets therefore differ from demand and production, which matters when joining the files.
- **Fodder and grass (`FORx`) are not in the totals.** In the commodity classification they have no `All` or sub-total mapping, so `All`/`AllC` figures exclude them. Keep this in mind when showing totals or comparing them with sums of individual crops.
- **The files carry no units.** The units were inferred from value magnitudes and confirmed by Nicola on 2026-10-21 (table in `CLAUDE.md`). Only the base year of the constant-USD world prices is still open.
- **Negative risk-of-hunger values are a model artefact.** 264 rows per measure, in 44 regions, mostly high-income countries. Many show exactly −0.47% in every year, which looks like a fixed term of the hunger equation rather than a projection. IMPACT's aggregates are sums that include the negatives: in 2050, World is 491.5 million, 5.8 million (1.2%) below the sum of the countries set to 0, and High income is 0.3 million vs. 5.6 million.
- **A negative value doesn't always mean "no hunger".** Burundi and Eritrea are negative in every year although they have the lowest calorie availability in the data (~1,950 kcal per person per day in 2025), while neighbours with more calories show 22–29% at risk. This likely means the hunger equation is being used outside its valid range. Treat model outputs at the edge of their range with caution, and check them against a related indicator (here, calories) before applying a blanket rule.
- **IMPACT's group yields and prices are proper aggregates.** The Cereals price, for example, is IMPACT's computed average across cereals, and can be shown. Never recompute group yields or prices from the individual crops: they can't simply be added or averaged.
- **The metadata workbooks can change shape.** On 2026-10-21 the 8th column of the regional classification changed from continent to the CG6 full region names. The build script reads columns by position (the headers repeat by design), so check it whenever a workbook is updated.

## Dashboard and tool quirks
- **Charts placed side by side don't match by default.** Plotly sizes each chart's margins from its own tick labels and legend, so paired plots differed (e.g. area 529 px vs. yield 563 px wide), and a long legend squashed its plot. Equal sizes need explicit handling (`equalizePairs()` in `app.js`).
- **Browsers keep serving old files.** After a data rebuild the browser showed the old region names until a hard refresh. Data files are now always re-checked with the server; after code changes, use Ctrl+F5.
- **Headless Edge is good for layout checks but not for dark mode.** Its screenshots and `--dump-dom` reliably show sizes, notes and errors, but dark mode needs checking by eye.

---
*Produced by Claude (Anthropic), an AI model, at the request of Nicola Cenacchi (IFPRI), 2026-10-21.*
