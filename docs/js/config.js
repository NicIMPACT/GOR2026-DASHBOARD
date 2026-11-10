/*
 * Dashboard configuration: units, labels, tab layout and colours.
 * Edit this file (not app.js) to change wording, units or defaults.
 *
 * UNITS: inferred on 2026-10-20 from value magnitudes and IMPACT conventions
 * (e.g. USA wheat 2025: production 55,150 -> thousand t; area 15,552 -> thousand ha;
 * yield 3.5 -> t/ha; world share at risk 8.3 -> %). Confirmed by Nicola on 2026-10-21,
 * World prices: constant 2021 USD (base year confirmed by Nicola on 2026-11-10).
 */
window.GOR_CONFIG = {
  scenarioLabel: "Reference scenario (REF)",
  dataSource: "IFPRI IMPACT model projections, Global Outlook Report 2026 (scenario REF)",

  // impactparameter -> display label and unit
  parameters: {
    "Total Yield":   { label: "Yield", unit: "t/ha" },
    "Total Area":    { label: "Area", unit: "thousand ha" },
    "Production":    { label: "Production", unit: "thousand t" },
    "Total Demand":  { label: "Total demand", unit: "thousand t" },
    "Food Demand":   { label: "Food demand", unit: "thousand t" },
    "Net Trade":     { label: "Net trade", unit: "thousand t" },
    "World Price":   { label: "World price", unit: "USD per t (2021 constant prices)" },
    "Kcal pc":       { label: "Calorie availability", unit: "kcal per person per day" },
    "Kcal pc by Commodity": { label: "Calorie availability by food group", unit: "kcal per person per day" },
    "Pop at risk of hunger": { label: "Population at risk of hunger", unit: "million people" },
    "Share Pop at risk of hunger": { label: "Share of population at risk of hunger", unit: "% of population" },
  },

  // Reference line on the share-at-risk chart (Nicola, request R7; renamed and drawn
  // black with short dashes, R20). `color` is for light mode; dark mode uses the text colour.
  hungerGoal: { value: 5, label: "5% Threshold", mapLabel: "Below 5% (threshold)", color: "#000000" },

  // Negative risk-of-hunger values (a model artefact) are written as 0 by build_data.py (R26).
  // Burundi and Eritrea are shown as no data instead (R31; HUNGER_NO_DATA in build_data.py),
  // but the note no longer names them (Nicola, 2026-11-10, R53).
  hungerClipNote: "Negative values in the model output are shown as 0.",

  // Fixed map classes for share at risk, so the 5% goal is always a class edge.
  shareBins: [5, 10, 15, 25],

  // Regions without net trade: exports and imports cancel out worldwide, so IMPACT has no
  // World value (Nicola, R33). They stay selected but are skipped on the Prices & trade tab.
  tradeExcluded: ["WLD"],
  tradeExcludedNote: "World is not shown: net trade is zero worldwide, as exports and imports cancel out.",

  // The commodity selection is shared by all tabs (R55), but not every commodity exists in
  // every dataset (e.g. livestock and fish have no yield or area; sugarcane has no trade).
  // Those stay selected, faded, and are skipped on that tab, as World is on trade (R33).
  // {list} and {fallback} are replaced by commodity names.
  comMissingNote: "Not available on this tab: {list}.",
  comFallbackNote: "Showing {fallback} instead.",
  // After "Clear all" in the commodity drop-down (R61), until a commodity is ticked.
  comNone: "None selected",
  noRegions: "No region or country selected. Choose one or more with \"Regions and countries\" at the top.",
  comNoneNote: "No commodity selected: showing {fallback}. Tick one or more in the Commodities list.",

  // CSV downloads repeat the card's subtitle as a description. These parts only make sense
  // next to the chart (colours, shapes, clicks), so they are left out of the file (R60).
  // An entry is a pattern to delete, or [pattern, replacement].
  csvDrop: [
    [/Blue area above zero: net exports; red area below zero: net imports\./, "Positive values: net exports; negative values: net imports."],
    [/; [^;.]+ highlighted\./, "."],
    /,? ?log scale/,
    /(^|\s)Grey: no data\./, /(^|\s)Click a country[^.]*\./, /(^|\s)Choose [^.]*\./,
    /(^|\s)Blue: net exporter; red: net importer\./, /(^|\s)Dashed line: [^.]*\./,
    /(^|\s)Each dot is a country;[^.]*\./, /(^|\s)Lighter shape: [^.]*\./, /(^|\s)Grey line: [^.]*\./,
  ],

  // Food groups for the calorie-composition chart. Each sums the IMPACT diet groups in
  // `codes`. Animal-source and aquatic foods are combined into one group (Nicola, R17);
  // "Foods" is capitalised to set it apart from the IMPACT ASF label. List order = stack
  // order from the bottom and legend order (R21); `color` is a key of `foodGroupColors`.
  kcalGroups: [
    { codes: ["ASF", "AQF"], label: "Animal-source Foods", color: "ASF" },
    { codes: ["CER"], color: "CER" }, { codes: ["F&V"], color: "F&V" }, { codes: ["O&S"], color: "O&S" },
    { codes: ["PUL"], color: "PUL" }, { codes: ["RTB"], color: "RTB" }, { codes: ["OTH"], color: "OTH" },
  ],
  // Food-group colours (R47, Nicola 2026-11-06): ColorBrewer Set1, n = 7, assigned in the
  // order ASF, CER, F&V, O&S, PUL, RTB, OTH. Same colours in light and dark mode.
  // https://colorbrewer2.org/#type=qualitative&scheme=Set1&n=7
  foodGroupColors: {
    ASF: "#e41a1c", CER: "#377eb8", "F&V": "#4daf4a", "O&S": "#984ea3",
    // RTB: Set1's yellow #ffff33 was hard to see on white; darker gold instead (Nicola, 2026-11-06).
    PUL: "#ff7f00", RTB: "#e6c700", OTH: "#a65628",
  },

  // Years shown in the population-at-risk bar chart (R19).
  popBarYears: [2025, 2035, 2050],

  // Short region names on the category axis of bar charts, explained in a note below the
  // chart (R16-R18). Regions not listed here use their IMPACT code (CG regions, WLD, ...)
  // or the country's ISO3 / IMPACT code. Income-group codes follow the World Bank.
  regionAbbrev: {
    "Low income": "LIC", "Lower middle income": "LMC", "Upper middle income": "UMC", "High income": "HIC",
  },

  // Index view of line charts (request R15): each value divided by its 2025 value.
  indexLabel: "Index (2025 = 1)",
  indexNote: "Index (2025 = 1): each value divided by its 2025 value.",
  // Shown by the (i) button next to "Line charts show" (R37), one paragraph per entry.
  indexInfo: [
    "Values: the projections in their own units, for example t/ha or thousand t.",
    "Index (2025 = 1): each line is divided by its own 2025 value, so every line starts at 1. " +
      "1.25 means 25% above 2025; 0.90 means 10% below. Use it to compare growth between regions " +
      "or commodities of very different size.",
    "The index changes line charts only. It is not used for the share of population at risk of hunger " +
      "or for net trade, where values near or below zero make an index meaningless.",
  ],

  // Violin plot of country values within each selected region (R44), next to the ranking on
  // the Yield & area tab. Regions with fewer countries than `violinMinCountries` show the
  // countries as dots only: a density curve from 2-4 values would suggest a shape the data
  // can't support. Area is drawn on a log scale (values span 0.01 to ~50,000 thousand ha).
  violinMinCountries: 5,
  violinNeedsRegion: "This chart is drawn only when at least one region is selected: it shows how the values " +
    "of the countries within each region are spread. Add a region (for example a CGIAR region or an income group) " +
    "with \"Regions and countries\" at the top.",
  // Median of the country values, drawn as a short dark-grey line on each violin (R49) and named
  // in the legend. Unweighted: every country counts once, whatever its size.
  violinMedianLabel: "Median",
  // Note under the violins (R51): their median is unweighted, the regional yield line is not.
  violinMedianNote: "The median is the middle country value, with every country counted once. It can differ from " +
    "the regional yield in the line chart, which is weighted by area.",
  // Added to the yield line chart's subtitle only when a region is selected (R51, option B).
  // Kept to one short sentence (Nicola, 2026-11-09), so the subtitle stays on one line and the
  // yield chart lines up with the area chart beside it.
  regionYieldNote: "Regional yields are area-weighted.",

  // Caption under every map (R50, wording supplied by Nicola's colleague, 2026-11-09).
  mapDisclaimer: "Illustrative map only. Boundaries only denote geographical coverage as it exists in IMPACT. " +
    "The boundaries, names, and designations used in this publication do not imply official endorsement or " +
    "acceptance by the authors, the International Food Policy Research Institute (IFPRI), or its partners and donors.",

  // Carousels above the map and the ranking when several commodities are selected (R39, R41).
  carousel: { map: "Commodity shown on the map", rank: "Commodity shown in the ranking",
    prev: "Previous commodity", next: "Next commodity" },

  defaults: {
    regions: ["CWANA", "ESA", "LAC", "SEA", "SA", "WCA"], // the six CG regions (R32)
    year: 2050,
    // Several allowed (R14). Rice replaces Maize as the starting commodity (R45, R48).
    // One list shared by all tabs, like the regions (R55). Also the fallback on a tab where
    // none of the selected commodities has data.
    commodities: ["Rice"],
  },
  maxRegions: 8, // one categorical colour per region; never a 9th generated hue
  maxCommodities: 6, // one small-multiple panel per commodity (R14)

  // Region colours (R47, Nicola 2026-11-06): ColorBrewer Dark2, n = 7, fixed to the CG
  // regions in the order CWANA, ESA, LAC, SA, SEA, WCA, ROW, so a CG region always has the
  // same colour. Slot 7 is a neutral grey (Dark2's 8th colour; lighter in dark mode).
  // Other regions (World, countries, income groups, ...) take the grey first, then any slot
  // whose CG region is not selected; see assignSlots() in app.js. Same order as `symbols`.
  // https://colorbrewer2.org/?type=qualitative&scheme=Dark2&n=7
  series: {
    light: ["#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e", "#e6ab02", "#a6761d", "#666666"],
    dark:  ["#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e", "#e6ab02", "#a6761d", "#9a9a9a"],
  },
  regionSlots: { CWANA: 0, ESA: 1, LAC: 2, SA: 3, SEA: 4, WCA: 5, ROW: 6 },
  otherSlotOrder: [7, 6, 5, 4, 3, 2, 1, 0], // grey first, then slots of unselected CG regions
  symbols: ["circle", "square", "diamond", "triangle-up", "x", "cross", "triangle-down", "star"],

  // Sequential (one hue, light -> dark) and diverging (blue <-> red) map ramps.
  sequential: ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95", "#0d366b"],
  divergingPos: ["#b7d3f6", "#5598e7", "#1c5cab"], // net exporters (blue)
  divergingNeg: ["#f6c4c0", "#e8706b", "#b8302f"], // net importers (red)

  // Region-picker sections, in display order.
  regionGroups: [
    { type: "world", label: "World" },
    { type: "development", label: "Development groups" },
    { type: "cgsix", label: "CGIAR regions: totals" },
    { type: "cgregion", label: "CGIAR regions" },
    { type: "otherregion", label: "Other regions" },
    { type: "income", label: "Income groups (World Bank)" },
    { type: "country", label: "Countries" },
  ],
};
