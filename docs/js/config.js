/*
 * Dashboard configuration: units, labels, tab layout and colours.
 * Edit this file (not app.js) to change wording, units or defaults.
 *
 * UNITS: inferred on 2026-10-20 from value magnitudes and IMPACT conventions
 * (e.g. USA wheat 2025: production 55,150 -> thousand t; area 15,552 -> thousand ha;
 * yield 3.5 -> t/ha; world share at risk 8.3 -> %). Confirmed by Nicola on 2026-10-21,
 * except the base year of the constant-price USD for world prices (still to confirm).
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
    "World Price":   { label: "World price", unit: "USD per t (constant prices)" },
    "Kcal pc":       { label: "Calorie availability", unit: "kcal per person per day" },
    "Kcal pc by Commodity": { label: "Calorie availability by food group", unit: "kcal per person per day" },
    "Pop at risk of hunger": { label: "Population at risk of hunger", unit: "million people" },
    "Share Pop at risk of hunger": { label: "Share of population at risk of hunger", unit: "% of population" },
  },

  // Reference line on the share-at-risk chart (Nicola, request R7; renamed and drawn
  // black with short dashes, R20). `color` is for light mode; dark mode uses the text colour.
  hungerGoal: { value: 5, label: "5% Threshold", mapLabel: "Below 5% (threshold)", color: "#000000" },

  // Negative risk-of-hunger values (a model artefact) are written as 0 by build_data.py (R26).
  // Burundi and Eritrea are shown as no data instead (R31; HUNGER_NO_DATA in build_data.py).
  hungerClipNote: "Negative values in the model output are shown as 0, except for Burundi and Eritrea, shown as no data because the model value is not reliable.",

  // Fixed map classes for share at risk, so the 5% goal is always a class edge.
  shareBins: [5, 10, 15, 25],

  // Regions without net trade: exports and imports cancel out worldwide, so IMPACT has no
  // World value (Nicola, R33). They stay selected but are skipped on the Prices & trade tab.
  tradeExcluded: ["WLD"],
  tradeExcludedNote: "World is not shown: net trade is zero worldwide, as exports and imports cancel out.",

  // Food groups for the calorie-composition chart. Each sums the IMPACT diet groups in
  // `codes`. Animal-source and aquatic foods are combined into one group (Nicola, R17);
  // "Foods" is capitalised to set it apart from the IMPACT ASF label. List order = stack
  // order from the bottom and legend order (R21); `color` is a fixed slot in `series`.
  kcalGroups: [
    { codes: ["ASF", "AQF"], label: "Animal-source Foods", color: 5 },
    { codes: ["CER"], color: 0 }, { codes: ["F&V"], color: 3 }, { codes: ["O&S"], color: 4 },
    { codes: ["PUL"], color: 2 }, { codes: ["RTB"], color: 1 }, { codes: ["OTH"], color: 6 },
  ],

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

  defaults: {
    regions: ["CWANA", "ESA", "LAC", "SEA", "SA", "WCA"], // the six CG regions (R32)
    year: 2050,
    commodity: { yield: ["Maize"], production: ["CER"], trade: ["Maize"] }, // lists: several allowed (R14)
  },
  maxRegions: 8, // one categorical colour per region; never a 9th generated hue
  maxCommodities: 6, // one small-multiple panel per commodity (R14)

  // Categorical palette (dataviz skill reference palette, validated; fixed order).
  // Marker symbols give a second, non-colour cue for each series.
  series: {
    light: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"],
    dark:  ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300", "#9085e9", "#e66767"],
  },
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
