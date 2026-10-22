# Global Outlook Report 2026: projections dashboard

An interactive dashboard of IFPRI IMPACT model projections, 2025–2050, for the reference scenario (REF). It covers yields and area, production and demand, prices and trade, and food security. Users choose regions or countries, one or more commodities and a year, and see line charts, bar charts, area charts and maps. Line charts can also be shown as an index (2025 = 1) to compare growth rates. Every chart has a data table and a CSV download.

It is a static website (HTML, CSS and JavaScript), published with GitHub Pages from the `docs/` folder.

## Repository layout

| Path | Contents |
|---|---|
| `*_REF.csv` | Cleaned IMPACT extracts, REF scenario: the dashboard's source data |
| `metadata files/` | IMPACT region and commodity nomenclature (current standard) |
| `original files/` | Raw IMPACT extracts (REF and REF_NoCC) |
| `scripts/build_data.py` | Converts the CSVs and metadata into `docs/data/*.json` |
| `docs/` | The website: `index.html`, `css/`, `js/config.js` (labels, units, colours), `js/app.js`, `data/` |

## Updating the data

After changing any `*_REF.csv` or metadata file, rebuild the browser data and commit the result:

```
python scripts/build_data.py
```

This requires Python 3 with `pandas` and `openpyxl`. The script stops with an error if the data contain a region or commodity that is missing from the metadata.

## Previewing locally

Browsers block data loading from `file://`, so serve the folder instead:

```
python -m http.server 8000 -d docs
```

Then open <http://localhost:8000>.

## Publishing on GitHub Pages

In the repository, go to Settings → Pages. Under "Build and deployment", choose "Deploy from a branch", then select the branch (e.g. `main`) and the `/docs` folder. The site appears at `https://<user-or-org>.github.io/<repository>/`.

## Notes

- Charts use [Plotly.js](https://plotly.com/javascript/) 2.35.2 (MIT licence), loaded from the jsDelivr CDN.
- Values are shown exactly as in the source CSVs.
- Region code `NA` is North America, not a missing value.

---
*Produced by Claude (Anthropic), an AI model, at the request of Nicola Cenacchi (IFPRI), 2026-10-20.*
