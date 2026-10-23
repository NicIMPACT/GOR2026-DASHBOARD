/*
 * GOR 2026 dashboard: state, filters and charts.
 * Wording, units, colours and defaults live in config.js; data in data/*.json
 * (built by scripts/build_data.py). Values are shown exactly as in the source CSVs;
 * the only derived values are the optional index (2025 = 1) and % price changes.
 * Request numbers (R1, R12, ...) refer to the requests log in memos/progress.md.
 */
(() => {
  "use strict";
  const C = window.GOR_CONFIG;
  const $ = (sel) => document.querySelector(sel);

  // ---------------------------------------------------------------- tabs ----
  // indicators: options of the "Indicator" filter; it drives the map and ranking
  // (and the main line chart on the production tab).
  const TABS = [
    { id: "yield", label: "Yield & area", dataset: "yield_area", commodityKey: "yield",
      commodityParams: ["Total Area", "Total Yield"], indicators: ["Total Yield", "Total Area"], render: renderYield },
    { id: "production", label: "Production & demand", dataset: "production_demand", commodityKey: "production",
      commodityParams: ["Production", "Total Demand", "Food Demand"], indicators: ["Production", "Total Demand", "Food Demand"], render: renderProduction },
    { id: "trade", label: "Prices & trade", dataset: "prices_trade", commodityKey: "trade",
      commodityParams: ["Net Trade", "World Price"], indicators: null, render: renderTrade },
    { id: "food", label: "Food security", dataset: "food_security", commodityKey: null,
      commodityParams: [], indicators: ["Share Pop at risk of hunger", "Pop at risk of hunger", "Kcal pc"], render: renderFood },
  ];

  const state = {
    tab: "yield",
    regions: [...C.defaults.regions],
    year: C.defaults.year,
    // Selected commodities per tab (R14) and the one shown on the map and rankings, set by
    // "Map and rankings show" or either carousel (R41).
    commodity: Object.fromEntries(Object.entries(C.defaults.commodity).map(([k, v]) => [k, [...v]])),
    focus: {},
    index: false,        // line charts as an index, 2025 = 1 (R15)
    tradeShared: true,   // net-trade panels share one y scale per commodity (R13)
    indicator: { yield: "Total Yield", production: "Production", food: "Share Pop at risk of hunger" },
  };
  const slots = new Map();          // region id -> fixed colour slot (colour follows the entity)
  const openTables = new Set();     // card ids whose data table is expanded
  let META, YEARS;
  const REG = new Map(), COM = new Map(), ISO2REG = new Map();
  const DATA = {};
  let renderToken = 0, comPickerTab = null, lastWidth = 0;
  let refocus = null;               // id of a control to focus again after a redraw (carousels)

  // ------------------------------------------------------------- helpers ----
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const regLabel = (id) => (REG.get(id) ? REG.get(id).label : id);
  // Short name for bar-chart category axes (R16-R18): config override, else the IMPACT/ISO3 code.
  const regAbbr = (id) => C.regionAbbrev[id] || (REG.get(id) && REG.get(id).code) || id;
  const comLabel = (id) => (COM.get(id) ? COM.get(id).label : id);
  const pLabel = (p) => C.parameters[p].label;
  const pUnit = (p) => C.parameters[p].unit;
  const get = (ds, p, r, c) => (ds.data[p] && ds.data[p][r] && ds.data[p][r][c]) || null;
  const yearIdx = () => YEARS.indexOf(state.year);
  const countries = () => META.regions.filter((r) => r.type === "country");
  const isItem = (id) => COM.get(id) && COM.get(id).kind === "item";
  const curTab = () => TABS.find((t) => t.id === state.tab);
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  // Plot-area height (px, without margins) for a one-panel chart: about 0.58 x the card width (R12).
  const plotHeight = (c) => clamp((c.chart.clientWidth || 500) * 0.58, 260, 420);
  // ": Maize" for one commodity; nothing when several (each panel is titled instead).
  const comSuffix = (coms) => (coms.length === 1 ? `: ${comLabel(coms[0])}` : "");
  // Unit line under a line-chart title, switching to the index wording when it is on.
  const lineSub = (unit, indexable = true) =>
    (state.index && indexable ? `${C.indexNote} 2025–2050.` : `${unit}, 2025–2050.`);

  function isDark() {
    const t = document.documentElement.dataset.theme;
    return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function theme() {
    const s = getComputedStyle($(".viz-root"));
    const v = (n) => s.getPropertyValue(n).trim();
    return { surface: v("--surface-1"), text: v("--text-primary"), text2: v("--text-secondary"),
      muted: v("--text-muted"), grid: v("--grid"), axis: v("--axis"), nodata: v("--nodata"), dark: isDark() };
  }
  const colorOf = (id) => C.series[isDark() ? "dark" : "light"][slots.get(id)];
  const symbolOf = (id) => C.symbols[slots.get(id)];
  function rgba(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  function assignSlots() {
    for (const id of [...slots.keys()]) if (!state.regions.includes(id)) slots.delete(id);
    for (const id of state.regions) {
      if (slots.has(id)) continue;
      const used = new Set(slots.values());
      let s = 0;
      while (used.has(s)) s++;
      slots.set(id, s);
    }
  }

  // Decimal places from the largest magnitude shown, so one chart uses one format.
  function decimals(values) {
    const m = Math.max(0, ...values.filter(Number.isFinite).map(Math.abs));
    return m >= 100 ? 0 : m >= 10 ? 1 : 2;
  }
  const fmt = (v, d) => (v == null || !Number.isFinite(v) ? "–"
    : v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }));
  const d3fmt = (d) => `,.${d}f`;

  function niceRound(x) {
    if (x === 0) return 0;
    const p = Math.pow(10, Math.floor(Math.log10(Math.abs(x))) - 1);
    return Math.round(x / p) * p;
  }
  function quantiles(sorted, qs) {
    return qs.map((q) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))]);
  }
  const uniqAsc = (a) => [...new Set(a)].sort((x, y) => x - y);

  // Long region names break onto two lines in narrow panel titles.
  function wrapLabel(s, max = 18) {
    if (s.length <= max) return esc(s);
    const mid = s.length / 2, spaces = [...s.matchAll(/ /g)].map((m) => m.index);
    if (!spaces.length) return esc(s);
    const at = spaces.reduce((a, b) => (Math.abs(b - mid) < Math.abs(a - mid) ? b : a));
    return `${esc(s.slice(0, at))}<br>${esc(s.slice(at + 1))}`;
  }

  // ----------------------------------------------------------- data load ----
  function loadDataset(key) {
    if (!DATA[key]) {
      // cache: "no-cache" revalidates with the server, so rebuilt data shows without a hard refresh.
      DATA[key] = fetch(`data/${key}.json`, { cache: "no-cache" }).then((r) => {
        if (!r.ok) throw new Error(`${key}.json: HTTP ${r.status}`);
        return r.json();
      });
    }
    return DATA[key];
  }

  // ------------------------------------------------------------ URL hash ----
  function readHash() {
    const h = new URLSearchParams(location.hash.slice(1));
    if (TABS.some((t) => t.id === h.get("tab"))) state.tab = h.get("tab");
    if (h.get("r")) {
      const rs = h.get("r").split("|").filter((id) => REG.has(id)).slice(0, C.maxRegions);
      if (rs.length) state.regions = rs;
    }
    const y = Number(h.get("y"));
    if (YEARS.includes(y)) state.year = y;
    const tab = curTab();
    if (h.get("c") && tab.commodityKey) {
      const cs = h.get("c").split("|").filter((id) => COM.has(id)).slice(0, C.maxCommodities);
      if (cs.length) state.commodity[tab.commodityKey] = cs;
    }
    if (h.get("f") && tab.commodityKey) state.focus[tab.commodityKey] = h.get("f");
    if (h.get("i") && tab.indicators && tab.indicators.includes(h.get("i"))) state.indicator[tab.id] = h.get("i");
    state.index = h.get("ix") === "1";
    state.tradeShared = h.get("ts") !== "0";
  }
  function writeHash() {
    const tab = curTab();
    const h = new URLSearchParams({ tab: state.tab, r: state.regions.join("|"), y: state.year });
    if (tab.commodityKey) {
      const cs = state.commodity[tab.commodityKey];
      h.set("c", cs.join("|"));
      if (cs.length > 1) h.set("f", state.focus[tab.commodityKey]);
    }
    if (tab.indicators) h.set("i", state.indicator[tab.id]);
    if (state.index) h.set("ix", "1");
    if (!state.tradeShared) h.set("ts", "0");
    history.replaceState(null, "", "#" + h.toString());
  }

  // ------------------------------------------------------------- filters ----
  function buildTabs() {
    const list = $("#tablist");
    TABS.forEach((t, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "tab"; b.id = `tab-${t.id}`;
      b.setAttribute("role", "tab"); b.setAttribute("aria-controls", "panel");
      b.textContent = t.label;
      b.addEventListener("click", () => selectTab(t.id));
      b.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        const next = TABS[(i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length];
        selectTab(next.id);
        $(`#tab-${next.id}`).focus();
      });
      list.appendChild(b);
    });
  }
  function selectTab(id) { state.tab = id; render(); }
  function syncTabs() {
    for (const t of TABS) {
      const b = $(`#tab-${t.id}`), on = t.id === state.tab;
      b.setAttribute("aria-selected", String(on));
      b.tabIndex = on ? 0 : -1;
    }
    $("#panel").setAttribute("aria-labelledby", `tab-${state.tab}`);
  }

  function buildYearSelect() {
    const sel = $("#year-select");
    for (const y of YEARS) sel.add(new Option(String(y), String(y)));
    sel.addEventListener("change", () => { state.year = Number(sel.value); render(); });
  }

  function buildScaleSelect() {
    $("#scale-select").addEventListener("change", (e) => { state.index = e.target.value === "index"; render(); });
    buildInfo($("#scale-info-btn"), $("#scale-info"), C.indexInfo);
  }

  // (i) button with a short explanation (R37): shown while hovering, or kept open by a
  // click / Enter until a second click, Escape or a click elsewhere.
  function buildInfo(btn, pop, paras) {
    pop.replaceChildren(...paras.map((t) => { const p = document.createElement("p"); p.textContent = t; return p; }));
    let pinned = false;
    const show = (on) => {
      pop.hidden = !on; btn.setAttribute("aria-expanded", String(on));
      if (!on) return;
      // Keep the box inside the window when the filter sits near the right edge.
      pop.style.left = "0px";
      const over = pop.getBoundingClientRect().right - (document.documentElement.clientWidth - 8);
      if (over > 0) pop.style.left = `${-over}px`;
    };
    btn.addEventListener("click", () => { pinned = !pinned; show(pinned); });
    btn.addEventListener("mouseenter", () => show(true));
    btn.addEventListener("mouseleave", () => { if (!pinned) show(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !pop.hidden) { pinned = false; show(false); } });
    document.addEventListener("click", (e) => {
      if (pinned && !btn.contains(e.target) && !pop.contains(e.target)) { pinned = false; show(false); }
    });
  }

  // Shared behaviour of the two checkbox pickers (regions, commodities):
  // open/close, Escape, click outside, and search.
  function setupPicker(root) {
    const toggle = root.querySelector(".picker-toggle"), panel = root.querySelector(".picker-panel");
    const search = root.querySelector('input[type="search"]'), list = root.querySelector(".picker-list");
    const open = (on) => {
      panel.hidden = !on; toggle.setAttribute("aria-expanded", String(on));
      if (on) search.focus();
    };
    toggle.addEventListener("click", () => open(panel.hidden));
    panel.addEventListener("keydown", (e) => { if (e.key === "Escape") { open(false); toggle.focus(); } });
    document.addEventListener("click", (e) => { if (!panel.hidden && !root.contains(e.target)) open(false); });
    search.addEventListener("input", () => {
      const q = search.value.trim().toLowerCase();
      for (const fs of list.querySelectorAll("fieldset")) {
        let any = false;
        for (const lab of fs.querySelectorAll("label")) {
          const hit = !q || lab.dataset.search.includes(q);
          lab.hidden = !hit; any = any || hit;
        }
        fs.hidden = !any;
      }
    });
  }

  // groups: [{ label, items: [{ id, text, search }] }]
  function fillPicker(list, groups, onToggle) {
    list.replaceChildren();
    for (const g of groups) {
      if (!g.items.length) continue;
      const fs = document.createElement("fieldset");
      const lg = document.createElement("legend"); lg.textContent = g.label; fs.appendChild(lg);
      for (const it of g.items) {
        const lab = document.createElement("label");
        const cb = document.createElement("input");
        cb.type = "checkbox"; cb.value = it.id;
        cb.addEventListener("change", () => onToggle(it.id, cb.checked));
        const sp = document.createElement("span"); sp.textContent = it.text;
        lab.append(cb, sp); lab.dataset.search = it.search.toLowerCase();
        fs.appendChild(lab);
      }
      list.appendChild(fs);
    }
  }

  function syncChecks(list, selected, cap) {
    const full = selected.length >= cap;
    for (const cb of list.querySelectorAll("input")) {
      cb.checked = selected.includes(cb.value);
      cb.disabled = full && !cb.checked;
    }
    return full;
  }

  // Removable chips; colorFn is null for commodities (colour always means region).
  function renderChips(ul, ids, labelFn, colorFn, onRemove, removable) {
    ul.replaceChildren();
    for (const id of ids) {
      const li = document.createElement("li"); li.className = "chip";
      if (colorFn) { const key = document.createElement("span"); key.className = "key"; key.style.background = colorFn(id); li.appendChild(key); }
      const t = document.createElement("span"); t.textContent = labelFn(id); li.appendChild(t);
      if (removable) {
        const x = document.createElement("button"); x.type = "button"; x.textContent = "×";
        x.setAttribute("aria-label", `Remove ${labelFn(id)}`);
        x.addEventListener("click", () => onRemove(id));
        li.appendChild(x);
      } else li.style.paddingRight = "10px";
      ul.appendChild(li);
    }
  }

  function buildPicker() {
    const groups = C.regionGroups.map((g) => {
      const regs = META.regions.filter((r) => r.type === g.type);
      if (g.type === "country") regs.sort((a, b) => a.label.localeCompare(b.label));
      return { label: g.label, items: regs.map((r) => ({ id: r.id,
        text: r.type === "country" || r.label === r.id ? r.label : `${r.label} (${r.id})`, search: `${r.label} ${r.id}` })) };
    });
    fillPicker($("#picker-list"), groups, toggleRegion);
    setupPicker($("#region-picker"));
    setupPicker($("#commodity-picker"));
  }

  function toggleRegion(id, on) {
    if (on && !state.regions.includes(id)) {
      if (state.regions.length >= C.maxRegions) { syncPicker(); return; }
      state.regions.push(id);
    } else if (!on) {
      state.regions = state.regions.filter((r) => r !== id);
    }
    render();
  }

  function syncPicker() {
    const full = syncChecks($("#picker-list"), state.regions, C.maxRegions);
    $("#picker-toggle").textContent = `${state.regions.length} selected (up to ${C.maxRegions})`;
    $("#picker-note").textContent = full
      ? `You have selected the maximum of ${C.maxRegions}. Remove one to add another.` : "";
    renderChips($("#chips"), state.regions, regLabel, colorOf, (id) => toggleRegion(id, false), true);
    // On the trade tab, World can't be added and its chip is faded (R33).
    if (state.tab === "trade") {
      for (const cb of $("#picker-list").querySelectorAll("input")) {
        if (C.tradeExcluded.includes(cb.value) && !cb.checked) { cb.disabled = true; cb.parentElement.title = C.tradeExcludedNote; }
      }
      state.regions.forEach((id, i) => {
        if (!C.tradeExcluded.includes(id)) return;
        const chip = $("#chips").children[i];
        chip.classList.add("chip-off"); chip.title = C.tradeExcludedNote;
      });
    } else {
      for (const cb of $("#picker-list").querySelectorAll("input")) if (C.tradeExcluded.includes(cb.value)) cb.parentElement.title = "";
    }
  }

  // At least one commodity stays selected; at most C.maxCommodities.
  function toggleCommodity(id, on) {
    const key = curTab().commodityKey, sel = state.commodity[key];
    if (on && !sel.includes(id)) {
      if (sel.length < C.maxCommodities) sel.push(id);
    } else if (!on && sel.length > 1) {
      state.commodity[key] = sel.filter((c) => c !== id);
    }
    render();
  }

  // Commodity options present in this tab's dataset, grouped by the metadata.
  function syncCommodity(tab, ds) {
    $("#commodity-filter").hidden = !tab.commodityKey;
    $("#com-chips").hidden = !tab.commodityKey;
    $("#focus-filter").hidden = true;
    if (!tab.commodityKey) return;
    const key = tab.commodityKey;
    const present = new Set();
    for (const p of tab.commodityParams)
      for (const reg of Object.values(ds.data[p] || {})) for (const c of Object.keys(reg)) present.add(c);
    present.delete("-");
    const order = { total: ["All", "AllC", "AllA", "AllF"], group: Object.keys(META.groups) };
    const pick = (kind) => order[kind].filter((id) => present.has(id) && COM.get(id) && COM.get(id).kind === kind);
    const groups = [{ label: "Totals", ids: pick("total") }, { label: "Food groups", ids: pick("group") }];
    for (const g of Object.keys(META.groups)) {
      groups.push({ label: META.groups[g], ids: [...present]
        .filter((id) => COM.get(id) && COM.get(id).kind === "item" && COM.get(id).group === g)
        .sort((a, b) => comLabel(a).localeCompare(comLabel(b))) });
    }
    if (comPickerTab !== tab.id) {
      fillPicker($("#com-list"), groups.map((g) => ({ label: g.label,
        items: g.ids.map((id) => ({ id, text: comLabel(id), search: `${comLabel(id)} ${id}` })) })), toggleCommodity);
      $("#com-search").value = "";
      comPickerTab = tab.id;
    }
    let sel = state.commodity[key].filter((id) => present.has(id)).slice(0, C.maxCommodities);
    if (!sel.length) sel = [groups.find((g) => g.ids.length).ids[0]];
    state.commodity[key] = sel;
    if (!sel.includes(state.focus[key])) state.focus[key] = sel[0];

    const full = syncChecks($("#com-list"), sel, C.maxCommodities);
    $("#com-toggle").textContent = sel.length === 1 ? comLabel(sel[0]) : `${sel.length} selected (up to ${C.maxCommodities})`;
    $("#com-note").textContent = full
      ? `You have selected the maximum of ${C.maxCommodities}. Remove one to add another.`
      : "Tick several to compare them side by side.";
    renderChips($("#com-chips"), sel.length > 1 ? sel : [], comLabel, null, (id) => toggleCommodity(id, false), true);

    if (sel.length > 1) {
      const fsel = $("#focus-select");
      $("#focus-filter").hidden = false;
      fsel.replaceChildren(...sel.map((id) => new Option(comLabel(id), id)));
      fsel.value = state.focus[key];
      fsel.onchange = () => { state.focus[key] = fsel.value; render(); };
    }
  }

  function syncIndicator(tab) {
    const wrap = $("#indicator-filter"), sel = $("#indicator-select");
    wrap.hidden = !tab.indicators;
    if (!tab.indicators) return;
    sel.replaceChildren(...tab.indicators.map((p) => new Option(pLabel(p), p)));
    sel.value = state.indicator[tab.id];
    sel.onchange = () => { state.indicator[tab.id] = sel.value; render(); };
  }

  // --------------------------------------------------------------- cards ----
  function card(id, title, sub, opts = {}) {
    const fig = document.createElement("figure");
    fig.className = "card" + (opts.wide ? " wide" : "");
    const h = document.createElement("h2"); h.textContent = title; h.id = `h-${id}`;
    const p = document.createElement("p"); p.className = "card-sub"; p.textContent = sub;
    const chart = document.createElement("div");
    chart.className = "chart" + (opts.map ? " map" : "");
    chart.setAttribute("role", "img");
    chart.setAttribute("aria-label", `${title}. ${sub} The same values are in the data table below the chart.`);
    const msg = document.createElement("p"); msg.className = "chart-msg";
    const tools = document.createElement("div"); tools.className = "card-tools";
    const det = document.createElement("details");
    det.open = openTables.has(id);
    det.addEventListener("toggle", () => (det.open ? openTables.add(id) : openTables.delete(id)));
    const sum = document.createElement("summary"); sum.textContent = "Show data table";
    const tw = document.createElement("div"); tw.className = "table-wrap";
    det.append(sum, tw);
    const dl = document.createElement("button"); dl.type = "button"; dl.className = "link-btn"; dl.textContent = "Download CSV";
    tools.append(dl, det);
    fig.append(h, p);
    if (opts.controls) fig.appendChild(opts.controls);
    fig.append(chart, msg, tools);
    $("#panel").appendChild(fig);
    return { id, title, sub, fig, chart, msg, tw, dl };
  }

  function empty(c, text) {
    c.chart.className = "chart-empty"; c.chart.removeAttribute("role"); c.chart.removeAttribute("aria-label");
    c.chart.style.height = "";
    c.chart.textContent = text;
    c.fig.querySelector(".card-tools").hidden = true;
  }

  // Table view + CSV download: the accessible twin of every chart.
  function table(c, header, rows, note) {
    const t = document.createElement("table");
    const cap = document.createElement("caption"); cap.className = "sr-only"; cap.textContent = c.title; t.appendChild(cap);
    const thead = t.createTHead().insertRow();
    for (const h of header) { const th = document.createElement("th"); th.scope = "col"; th.textContent = h; thead.appendChild(th); }
    const tb = t.createTBody();
    const d = decimals(rows.flatMap((r) => r.filter((v) => typeof v === "number")));
    for (const r of rows) {
      const tr = tb.insertRow();
      for (const v of r) tr.insertCell().textContent = typeof v === "number" || v == null ? fmt(v, d) : v;
    }
    c.tw.replaceChildren(t);
    c.dl.onclick = () => {
      const q = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
      const lines = [`# ${c.title}. ${c.sub}`, `# Source: ${C.dataSource}`];
      if (note) lines.push(`# ${note}`);
      lines.push(header.map(q).join(","));
      for (const r of rows) lines.push(r.map((v) => (v == null ? "" : q(v))).join(","));
      const blob = new Blob([lines.join("\n")], { type: "text/csv" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${c.id}_${state.year}.csv`.replace(/[^\w.-]+/g, "_");
      a.click(); URL.revokeObjectURL(a.href);
    };
  }

  // -------------------------------------------------------------- Plotly ----
  const PLOT_CONFIG = {
    responsive: true, displaylogo: false,
    modeBarButtonsToRemove: ["lasso2d", "select2d", "autoScale2d", "toggleSpikelines", "hoverCompareCartesian", "hoverClosestCartesian"],
  };

  // A fresh object per axis: a shared nested `title` would leak the y title onto the x axis.
  const axisStyle = (th) => ({ gridcolor: th.grid, linecolor: th.axis, zerolinecolor: th.axis, tickfont: { color: th.muted, size: 12 },
    title: { text: "", font: { color: th.text2, size: 13 } }, automargin: true });

  function baseLayout(th, extra = {}) {
    return Object.assign({
      paper_bgcolor: th.surface, plot_bgcolor: th.surface,
      font: { family: 'system-ui, -apple-system, "Segoe UI", sans-serif', color: th.text2, size: 13 },
      margin: { l: 8, r: 16, t: 8, b: 8 },
      xaxis: axisStyle(th), yaxis: axisStyle(th),
      legend: { orientation: "h", x: 0, y: -0.18, yanchor: "top", font: { color: th.text2 } },
      hoverlabel: { bgcolor: th.surface, bordercolor: th.axis, font: { color: th.text, size: 13 } },
      barcornerradius: 4,
    }, extra);
  }

  function plot(c, traces, layout, config = PLOT_CONFIG) {
    Plotly.newPlot(c.chart, traces, layout,
      Object.assign({}, config, { toImageButtonOptions: { filename: `${c.id}_${state.year}`, scale: 2 } }));
  }

  // Missing-region note, e.g. World has no net-trade value.
  function missingNote(c, missing, extra = []) {
    const parts = [];
    if (missing.length) parts.push(`No data for: ${missing.join(", ")}.`);
    c.msg.textContent = [...parts, ...extra].join(" ");
  }

  // Key to the region abbreviations used on a bar chart's category axis (R16-R18).
  function abbrevNote(c, ids) {
    const p = document.createElement("p"); p.className = "chart-msg";
    p.textContent = "Regions: " + ids.map((id) => `${regAbbr(id)} = ${regLabel(id)}`).join("; ") + ".";
    c.msg.after(p);
  }

  // Note inside an empty panel, word-wrapped to ~30 characters a line so it fits narrow panels.
  const panelText = (th, text, xref, yref) => ({
    text: String(text).split(" ").reduce((lines, w) => {
      const last = lines[lines.length - 1];
      if (last && (last + " " + w).length <= 30) lines[lines.length - 1] = `${last} ${w}`; else lines.push(w);
      return lines;
    }, []).map(esc).join("<br>"),
    x: 0.5, y: 0.5, xref, yref, showarrow: false, font: { color: th.muted, size: 13 } });
  // Plotly does not draw axes that carry no trace, so an empty panel gets an invisible one
  // (otherwise its "no data" note and the shared x axis below it disappear).
  const placeholder = (xaxis, yaxis) => ({ type: "scatter", mode: "lines", x: YEARS, y: YEARS.map(() => null), xaxis, yaxis,
    showlegend: false, hoverinfo: "skip" });

  // Panels stacked vertically on one shared x axis (small multiples, R14).
  // Heights follow the card width, so lines keep a readable aspect ratio (R12):
  // a single chart is about 0.58 x its width, each stacked panel about 0.4 x.
  // Returns the layout (with yaxis, yaxis2, ...), the trace axis names and the height in px.
  function stackLayout(c, th, titles, legend) {
    const n = titles.length, w = c.chart.clientWidth || 500;
    const panelH = n === 1 ? plotHeight(c) : clamp(w * 0.4, 170, 250);
    const titleH = titles.some(Boolean) ? 26 : 0, gapH = n > 1 ? 18 : 0;
    const plotH = n * (panelH + titleH) + (n - 1) * gapH;
    const bottom = 36 + (legend ? 56 : 0);
    const layout = baseLayout(th, { margin: { l: 8, r: 16, t: 8, b: bottom }, annotations: [],
      legend: { orientation: "h", x: 0, y: -34 / plotH, yanchor: "top", font: { color: th.text2 } } });
    const yNames = [];
    for (let i = 0; i < n; i++) {
      const top = 1 - (i * (panelH + titleH + gapH) + titleH) / plotH, bot = top - panelH / plotH;
      const ax = i === 0 ? "yaxis" : `yaxis${i + 1}`;
      layout[ax] = Object.assign(axisStyle(th), { domain: [Math.max(0, bot), Math.min(1, top)], anchor: "x", tickformat: ",~r" });
      yNames.push(i === 0 ? "y" : `y${i + 1}`);
      if (titles[i]) layout.annotations.push({ text: `<b>${esc(titles[i])}</b>`, x: 0, y: top, xref: "paper", yref: "paper",
        xanchor: "left", yanchor: "bottom", showarrow: false, font: { color: th.text, size: 13 } });
    }
    layout.xaxis.anchor = yNames[n - 1];
    return { layout, yNames, height: plotH + 8 + bottom };
  }

  // Line chart(s) over 2025-2050, one panel per commodity.
  // panels: [{ title, series: [{ key, name, y, color, symbol }], note }]
  // opts: indexable (R15), zero (y from 0), ref (dashed reference line), missing, seriesHead.
  function multiLine(c, panels, unit, opts = {}) {
    const th = theme(), idx = state.index && !!opts.indexable, multi = panels.length > 1;
    const shownUnit = idx ? C.indexLabel : unit, noBase = [];
    if (idx) {
      for (const p of panels) {
        p.series = p.series.filter((s) => {
          const ok = Number.isFinite(s.y[0]) && s.y[0] > 0;
          if (!ok) noBase.push(multi ? `${s.name} (${p.title})` : s.name);
          return ok;
        }).map((s) => Object.assign({}, s, { y: s.y.map((v) => (Number.isFinite(v) ? v / s.y[0] : null)) }));
      }
    }
    missingNote(c, opts.missing || [], noBase.length ? [`No index for: ${noBase.join(", ")} (2025 value is zero or negative).`] : []);
    if (!panels.some((p) => p.series.length)) {
      return empty(c, panels.length === 1 && panels[0].note ? panels[0].note : "No data for the selected regions. Add another region or country.");
    }
    const keys = [...new Set(panels.flatMap((p) => p.series.map((s) => s.key)))];
    const legend = keys.length > 1 || !!opts.ref;
    const { layout, yNames, height } = stackLayout(c, th, panels.map((p) => (multi ? p.title : null)), legend);
    const d = decimals(panels.flatMap((p) => p.series.flatMap((s) => s.y)));
    const data = [], seen = new Set();
    panels.forEach((p, i) => {
      const ya = yNames[i], ax = layout[i === 0 ? "yaxis" : `yaxis${i + 1}`];
      for (const s of p.series) {
        data.push({
          type: "scatter", mode: "lines+markers", name: s.name, legendgroup: s.key, xaxis: "x", yaxis: ya,
          showlegend: keys.length > 1 && !seen.has(s.key), x: YEARS, y: s.y,
          line: { color: s.color, width: 2, shape: "linear" },
          marker: { color: s.color, size: 8, symbol: s.symbol, line: { color: th.surface, width: 2 } },
          hovertemplate: `<b>%{y:${d3fmt(d)}}</b> ${esc(shownUnit)}  ${esc(s.name)}<extra></extra>`,
        });
        seen.add(s.key);
      }
      if (!p.series.length) {
        data.push(placeholder("x", ya));
        layout.annotations.push(panelText(th, p.note || "No data", "x domain", `${ya} domain`));
        ax.showticklabels = false;
      }
      if (!multi) ax.title.text = shownUnit;
      if (opts.zero && !idx) ax.rangemode = "tozero";
      // Index panels share one scale, so growth is comparable across commodities.
      if (idx && i > 0) ax.matches = "y";
    });
    layout.hovermode = "x unified"; layout.showlegend = legend;
    layout.xaxis.tickvals = YEARS; layout.xaxis.showgrid = false;
    if (opts.ref && !multi) {
      const all = panels[0].series.flatMap((s) => s.y).filter(Number.isFinite);
      const lo = Math.min(0, ...all), hi = Math.max(opts.ref.value, ...all);
      layout.yaxis.range = [lo * 1.1, hi * 1.08];
      layout.yaxis.autorange = false;
      // Reference line as a legend entry (an on-chart label collides with lines near 5%).
      // Fixed x range so the line can run from the y axis to the right edge; short dashes (R20).
      const x0 = YEARS[0] - 1.5, x1 = YEARS[YEARS.length - 1] + 1.5;
      layout.xaxis.range = [x0, x1];
      data.push({ type: "scatter", mode: "lines", name: opts.ref.label, x: [x0, x1], y: [opts.ref.value, opts.ref.value],
        line: { color: th.dark ? th.text : opts.ref.color, width: 1.5, dash: "4px,3px" }, hoverinfo: "skip" });
    }
    c.chart.style.height = `${height}px`;
    plot(c, data, layout);
    const head = opts.seriesHead || "Region", comCol = multi && head !== "Commodity";
    const rows = panels.flatMap((p) => p.series.map((s) => [...(comCol ? [p.title] : []), s.name, ...s.y]));
    table(c, [...(comCol ? ["Commodity"] : []), head, ...YEARS.map(String)], rows, `Unit: ${shownUnit}`);
  }

  // One line per selected region, one panel per commodity.
  function regionLines(c, ds, param, coms, opts = {}) {
    const missing = [];
    const panels = coms.map((com) => {
      const series = [];
      for (const id of state.regions) {
        const y = get(ds, param, id, com);
        if (!y) { missing.push(coms.length > 1 ? `${regLabel(id)} (${comLabel(com)})` : regLabel(id)); continue; }
        series.push({ key: id, name: regLabel(id), y, color: colorOf(id), symbol: symbolOf(id) });
      }
      return { title: comLabel(com), series, note: "No data for the selected regions" };
    });
    multiLine(c, panels, pUnit(param), Object.assign({}, opts, { missing }));
  }

  // Horizontal bar range with room for the value labels outside both bar ends,
  // so labels on negative bars don't run into the category labels.
  function padRange(values) {
    const lo = Math.min(0, ...values), hi = Math.max(0, ...values), span = hi - lo || 1;
    return [lo < 0 ? lo - 0.18 * span : 0, hi > 0 ? hi + 0.12 * span : 0];
  }

  // Bars with an explicit width so no bar is thicker than 24px, with a 2px gap.
  function barGeometry(el, nCats, nTraces) {
    const slotPx = Math.max(40, (el.clientWidth || 500) - 90) / nCats;
    const groupUnits = Math.min(0.8, (24 * nTraces) / slotPx);
    const w = groupUnits / nTraces, gap = 2 / slotPx;
    return (i) => ({ width: Math.max(w - gap, 0.01), offset: -groupUnits / 2 + i * w + gap / 2 });
  }

  // Columns grouped by region, 2025-2050 within each group, so each region's change over
  // time reads directly (R16). Two-level category axis: years above, region codes below.
  // Each region keeps its colour; no legend, as the axis already names the groups.
  function regionYearBars(c, ds, param, commodity, years = YEARS) {
    const th = theme(), unit = pUnit(param), rows = [], missing = [], series = [];
    const yi = years.map((yr) => YEARS.indexOf(yr));
    for (const id of state.regions) {
      const all = get(ds, param, id, commodity);
      if (!all) { missing.push(regLabel(id)); continue; }
      const y = yi.map((i) => all[i]);
      rows.push([regLabel(id), ...y]); series.push({ id, y });
    }
    missingNote(c, missing);
    if (!series.length) return empty(c, "No data for the selected regions. Add another region or country.");
    const d = decimals(series.flatMap((s) => s.y));
    const data = series.map((s) => ({
      type: "bar", name: regLabel(s.id), x: [years.map(() => regAbbr(s.id)), years.map(String)], y: s.y,
      marker: { color: colorOf(s.id) },
      hovertemplate: `<b>%{y:${d3fmt(d)}}</b> ${esc(unit)}<br>${esc(regLabel(s.id))}, %{x[1]}<extra></extra>`,
    }));
    const layout = baseLayout(th, { barmode: "overlay", bargap: 0.25, hovermode: "closest", showlegend: false,
      height: plotHeight(c) + 16 });
    layout.xaxis.type = "multicategory"; layout.xaxis.showgrid = false; layout.xaxis.tickangle = -90;
    layout.xaxis.dividercolor = th.grid;
    layout.yaxis.title.text = unit; layout.yaxis.tickformat = ",~r";
    c.chart.style.height = `${layout.height}px`;
    plot(c, data, layout);
    abbrevNote(c, series.map((s) => s.id));
    table(c, ["Region", ...years.map(String)], rows, `Unit: ${unit}`);
  }

  // Horizontal ranking of countries for the selected year.
  function ranking(c, ds, param, commodity, opts = {}) {
    const th = theme(), unit = pUnit(param), yi = yearIdx(), all = [];
    for (const r of countries()) {
      const s = get(ds, param, r.id, commodity);
      if (s && Number.isFinite(s[yi])) all.push({ label: r.label, v: s[yi] });
    }
    if (!all.length) return empty(c, "No country data for this selection.");
    all.sort((a, b) => (opts.asc ? a.v - b.v : b.v - a.v));
    let shown;
    if (opts.diverging) {
      const half = Math.floor((opts.n || 20) / 2);
      shown = [...all.filter((a) => a.v > 0).slice(0, half), ...all.filter((a) => a.v < 0).slice(-half)];
    } else shown = all.slice(0, opts.n || 15);
    const d = decimals(shown.map((s) => s.v));
    const colors = shown.map((s) => (opts.diverging ? (s.v >= 0 ? C.divergingPos[2] : C.divergingNeg[2]) : C.sequential[4]));
    const data = [{
      type: "bar", orientation: "h", y: shown.map((s) => s.label), x: shown.map((s) => s.v),
      marker: { color: colors }, text: shown.map((s) => fmt(s.v, d)), textposition: "outside", cliponaxis: false,
      textfont: { color: th.text2, size: 12 },
      hovertemplate: `<b>%{x:${d3fmt(d)}}</b> ${esc(unit)}<br>%{y}<extra></extra>`,
    }];
    const layout = baseLayout(th, { hovermode: "closest", showlegend: false, bargap: 0.3, height: 30 * shown.length + 70 });
    layout.yaxis.autorange = "reversed"; layout.yaxis.tickfont = { color: th.text2, size: 12 };
    layout.xaxis.title.text = unit; layout.xaxis.tickformat = ",~r";
    layout.margin.r = 56; layout.xaxis.range = padRange(shown.map((s) => s.v));
    c.chart.style.height = `${layout.height}px`;
    plot(c, data, layout);
    table(c, ["Rank", "Country", unit], all.map((a, i) => [String(i + 1), a.label, a.v]), `All countries, ${state.year}`);
  }

  // Choropleth with classed colours (quantile, fixed share bins, or diverging around 0).
  function mapChart(c, ds, param, commodity, mode) {
    const th = theme(), unit = pUnit(param), yi = yearIdx(), vals = [];
    for (const r of countries()) {
      const s = get(ds, param, r.id, commodity);
      if (s && Number.isFinite(s[yi])) vals.push({ r, v: s[yi] });
    }
    if (!vals.length) return empty(c, "No country data for this selection.");
    const sorted = vals.map((x) => x.v).sort((a, b) => a - b);
    let breaks, colors;
    if (mode === "share") {
      breaks = C.shareBins.slice();
      colors = [0, 2, 3, 5, 6].map((i) => C.sequential[i]);
    } else if (mode === "diverging") {
      const neg = sorted.filter((v) => v < 0).map(Math.abs).sort((a, b) => a - b);
      const pos = sorted.filter((v) => v > 0);
      const bn = neg.length ? uniqAsc(quantiles(neg, [1 / 3, 2 / 3]).map(niceRound)).filter((v) => v > 0).map((v) => -v).reverse() : [];
      const bp = pos.length ? uniqAsc(quantiles(pos, [1 / 3, 2 / 3]).map(niceRound)).filter((v) => v > 0) : [];
      breaks = [...bn, 0, ...bp];
      colors = [...C.divergingNeg.slice(0, bn.length + 1).reverse(), ...C.divergingPos.slice(0, bp.length + 1)];
    } else {
      breaks = uniqAsc(quantiles(sorted, [0.2, 0.4, 0.6, 0.8]).map(niceRound));
      const k = breaks.length + 1;
      colors = Array.from({ length: k }, (_, i) => C.sequential[Math.round((i * 6) / Math.max(1, k - 1))]);
    }
    const k = breaks.length + 1;
    const bin = (v) => { let i = 0; while (i < breaks.length && v >= breaks[i]) i++; return i; };
    const bd = decimals(breaks), pct = mode === "share" ? "%" : "";
    const lab = (i) => (i === 0 ? `Below ${fmt(breaks[0], bd)}${pct}`
      : i === k - 1 ? `${fmt(breaks[k - 2], bd)}${pct} or more`
      : `${fmt(breaks[i - 1], bd)}–${fmt(breaks[i], bd)}${pct}`);
    let labels = Array.from({ length: k }, (_, i) => lab(i));
    if (mode === "diverging") {
      // Words instead of signed ranges ("−1,900–−200" is hard to read).
      const zeroAt = breaks.indexOf(0); // classes 0..zeroAt lie below zero
      labels = labels.map((_, i) => {
        if (i <= zeroAt) {
          const hiAbs = i === 0 ? null : Math.abs(breaks[i - 1]), loAbs = Math.abs(breaks[i]);
          return hiAbs == null ? `Net imports ${fmt(loAbs, bd)} or more` : loAbs === 0 ? `Net imports up to ${fmt(hiAbs, bd)}`
            : `Net imports ${fmt(loAbs, bd)}–${fmt(hiAbs, bd)}`;
        }
        const lo = breaks[i - 1], hi = i < breaks.length ? breaks[i] : null;
        return hi == null ? `Net exports ${fmt(lo, bd)} or more` : lo === 0 ? `Net exports up to ${fmt(hi, bd)}`
          : `Net exports ${fmt(lo, bd)}–${fmt(hi, bd)}`;
      });
    }
    if (mode === "share") labels[0] = C.hungerGoal.mapLabel;
    const d = decimals(vals.map((x) => x.v));
    const loc = [], z = [], text = [], cd = [];
    for (const { r, v } of vals) for (const iso of r.map) { loc.push(iso); z.push(bin(v)); text.push(r.label); cd.push(fmt(v, d)); }
    const colorscale = colors.flatMap((col, i) => [[i / k, col], [(i + 1) / k, col]]);
    // On phones the colour bar would take half the map's width: use a legend below the map.
    const narrow = window.matchMedia("(max-width: 700px)").matches;
    const data = [{ showscale: !narrow,
      type: "choropleth", locationmode: "ISO-3", locations: loc, z, text, customdata: cd,
      zmin: -0.5, zmax: k - 0.5, colorscale, marker: { line: { color: th.surface, width: 0.5 } },
      colorbar: { tickvals: labels.map((_, i) => i), ticktext: labels, thickness: 14, len: 0.8, outlinewidth: 0,
        title: { text: esc(unit), side: "top", font: { color: th.text2, size: 12 } }, tickfont: { color: th.text2, size: 12 } },
      hovertemplate: `<b>%{customdata}</b> ${esc(unit)}<br>%{text}<extra></extra>`,
    }];
    const layout = baseLayout(th, { hovermode: "closest", margin: { l: 0, r: 0, t: 0, b: 0 },
      geo: { projection: { type: "natural earth" }, showframe: false, showcoastlines: false, showland: true,
        landcolor: th.nodata, showcountries: true, countrycolor: th.surface, showocean: false, showlakes: false,
        bgcolor: th.surface, lataxis: { range: [-56, 84] } } });
    plot(c, data, layout, Object.assign({}, PLOT_CONFIG, { scrollZoom: false }));
    if (narrow) {
      const ul = document.createElement("ul"); ul.className = "map-legend";
      ul.setAttribute("aria-label", `Map legend, ${unit}`);
      const title = document.createElement("li"); title.className = "map-legend-title"; title.textContent = unit; ul.appendChild(title);
      labels.forEach((t, i) => {
        const li = document.createElement("li"), sw = document.createElement("span");
        sw.className = "swatch"; sw.style.background = colors[i]; li.append(sw, t); ul.appendChild(li);
      });
      c.chart.after(ul);
    }
    c.chart.on("plotly_click", (ev) => {
      const id = ev.points && ev.points[0] && ISO2REG.get(ev.points[0].location);
      if (id) toggleRegion(id, !state.regions.includes(id));
    });
    table(c, ["Country", unit], vals.sort((a, b) => b.v - a.v).map((x) => [x.r.label, x.v]), `${state.year}`);
  }

  // Commodity carousel (R39, R41): with several commodities, the map and the ranking show one
  // at a time and the arrows, dots or Left/Right keys step through them (wrapping round).
  // Both carousels set the same choice as "Map and rankings show", so the map and the
  // ranking always show the same commodity. `pre` keeps the button ids unique per carousel.
  function carousel(key, pre, label) {
    const sel = state.commodity[key], n = sel.length, i = sel.indexOf(state.focus[key]);
    if (n < 2) return undefined;
    const go = (j, id) => { state.focus[key] = sel[(j + n) % n]; refocus = id; render(); };
    const btn = (id, cls, text, aria, onClick) => {
      const b = document.createElement("button");
      b.type = "button"; b.id = id; b.className = cls; b.textContent = text;
      b.setAttribute("aria-label", aria); b.title = aria; b.addEventListener("click", onClick);
      return b;
    };
    const nav = document.createElement("div");
    nav.className = "carousel"; nav.setAttribute("role", "group"); nav.setAttribute("aria-label", label);
    const pos = document.createElement("span"); pos.className = "carousel-pos";
    pos.textContent = `${comLabel(sel[i])} (${i + 1} of ${n})`;
    const dots = document.createElement("span"); dots.className = "carousel-dots";
    sel.forEach((id, j) => {
      const d = btn(`${pre}-dot-${j}`, "dot", "", `Show ${comLabel(id)}`, () => go(j, `${pre}-dot-${j}`));
      if (j === i) d.setAttribute("aria-current", "true");
      dots.appendChild(d);
    });
    nav.append(
      btn(`${pre}-prev`, "btn carousel-arrow", "‹", `${C.carousel.prev}: ${comLabel(sel[(i - 1 + n) % n])}`, () => go(i - 1, `${pre}-prev`)),
      pos,
      btn(`${pre}-next`, "btn carousel-arrow", "›", `${C.carousel.next}: ${comLabel(sel[(i + 1) % n])}`, () => go(i + 1, `${pre}-next`)),
      dots);
    nav.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); go(i - 1, `${pre}-prev`); }
      if (e.key === "ArrowRight") { e.preventDefault(); go(i + 1, `${pre}-next`); }
    });
    return nav;
  }

  // ---------------------------------------------------------- tab views -----
  const mapSub = (unit) => `${unit}. Grey: no data. Click a country to add it to the charts.`;

  function renderYield(ds) {
    const coms = state.commodity.yield, com = state.focus.yield, ind = state.indicator.yield, cl = comLabel(com);
    const m = card("yield-map", `${pLabel(ind)}: ${cl}, ${state.year}`, mapSub(pUnit(ind)),
      { wide: true, map: true, controls: carousel("yield", "map", C.carousel.map) });
    // Group yields (e.g. Cereals) are IMPACT's own aggregates and are shown like crops (R29).
    mapChart(m, ds, ind, com);
    // Yield and area side by side (R12), one panel per commodity in each (R14).
    regionLines(card("yield-line", `Yield${comSuffix(coms)}`, lineSub(pUnit("Total Yield"))), ds, "Total Yield", coms,
      { indexable: true });
    regionLines(card("area-line", `Area${comSuffix(coms)}`, lineSub(pUnit("Total Area"))), ds, "Total Area", coms,
      { indexable: true });
    const r = card("yield-rank", `Top 15 countries by ${pLabel(ind).toLowerCase()}: ${cl}, ${state.year}`, pUnit(ind),
      { wide: true, controls: carousel("yield", "rank", C.carousel.rank) });
    ranking(r, ds, ind, com);
  }

  function renderProduction(ds) {
    const coms = state.commodity.production, com = state.focus.production, ind = state.indicator.production, cl = comLabel(com);
    mapChart(card("prod-map", `${pLabel(ind)}: ${cl}, ${state.year}`, mapSub(pUnit(ind)),
      { wide: true, map: true, controls: carousel("production", "map", C.carousel.map) }), ds, ind, com);
    // Line chart and production-vs-demand bars side by side (R12).
    regionLines(card("prod-line", `${pLabel(ind)}${comSuffix(coms)}`, lineSub(pUnit(ind))), ds, ind, coms,
      { zero: true, indexable: true });
    prodVsDemand(card("prod-vs-demand", `Production and total demand${comSuffix(coms)}, ${state.year}`,
      pUnit("Production")), ds, coms);
    ranking(card("prod-rank", `Top 15 countries by ${pLabel(ind).toLowerCase()}: ${cl}, ${state.year}`, pUnit(ind),
      { wide: true, controls: carousel("production", "rank", C.carousel.rank) }),
      ds, ind, com);
  }

  // Two measures with the same unit side by side per region, one panel per commodity;
  // neutral inks so the region colours used elsewhere keep their meaning.
  function prodVsDemand(c, ds, coms) {
    const th = theme(), yi = yearIdx(), unit = pUnit("Production"), multi = coms.length > 1;
    // Region codes on the axis, explained below the chart (R18).
    const cats = state.regions.map(regAbbr), rows = [], missing = [], vals = [];
    const per = coms.map((com) => {
      const p = [], t = [];
      for (const id of state.regions) {
        const ps = get(ds, "Production", id, com), ts = get(ds, "Total Demand", id, com);
        if (!ps && !ts) missing.push(multi ? `${regLabel(id)} (${comLabel(com)})` : regLabel(id));
        p.push(ps ? ps[yi] : null); t.push(ts ? ts[yi] : null);
        rows.push([...(multi ? [comLabel(com)] : []), regLabel(id), ps ? ps[yi] : null, ts ? ts[yi] : null]);
      }
      vals.push(...p, ...t);
      return { com, p, t };
    });
    missingNote(c, missing);
    if (!vals.some(Number.isFinite)) return empty(c, "No data for the selected regions.");
    const { layout, yNames, height } = stackLayout(c, th, coms.map((id) => (multi ? comLabel(id) : null)), true);
    const d = decimals(vals);
    const geo = barGeometry(c.chart, cats.length, 2);
    const demandInk = th.dark ? "#6b6a65" : "#a3a29b";
    const data = [];
    per.forEach((s, i) => {
      const mk = (j, name, color, y) => Object.assign({
        type: "bar", name, x: cats, y, marker: { color }, xaxis: "x", yaxis: yNames[i], legendgroup: name, showlegend: i === 0,
        hovertemplate: `<b>%{y:${d3fmt(d)}}</b> ${esc(unit)}  ${esc(name)}<extra></extra>`,
      }, geo(j));
      data.push(mk(0, "Production", th.text2, s.p), mk(1, "Total demand", demandInk, s.t));
      if (!multi) layout.yaxis.title.text = unit;
    });
    layout.barmode = "overlay"; layout.hovermode = "x unified";
    layout.xaxis.type = "category"; layout.xaxis.showgrid = false;
    c.chart.style.height = `${height}px`;
    plot(c, data, layout);
    abbrevNote(c, state.regions);
    table(c, [...(multi ? ["Commodity"] : []), "Region", "Production", "Total demand"], rows, `Unit: ${unit}; ${state.year}`);
  }

  function renderTrade(ds) {
    const coms = state.commodity.trade, com = state.focus.trade, cl = comLabel(com);
    mapChart(card("trade-map", `Net trade: ${cl}, ${state.year}`,
      `${pUnit("Net Trade")}. Blue: net exporter; red: net importer. Grey: no data. Click a country to add it to the charts.`,
      { wide: true, map: true, controls: carousel("trade", "map", C.carousel.map) }), ds, "Net Trade", com, "diverging");
    worldPrices(card("price-line", `World price${comSuffix(coms)}`, lineSub(pUnit("World Price"))), ds, coms);
    priceChange(card("price-change", `Change in world prices, 2025 to ${state.year}`,
      `% change. ${isItem(com) ? META.groups[COM.get(com).group] : "Food groups"}; ${cl} highlighted.`), ds, com);
    // Net trade as areas, one small panel per region (R13).
    const ctl = document.createElement("div"); ctl.className = "card-controls";
    const lab = document.createElement("label"), cb = document.createElement("input");
    cb.type = "checkbox"; cb.checked = state.tradeShared;
    cb.addEventListener("change", () => { state.tradeShared = cb.checked; render(); });
    lab.append(cb, document.createTextNode("Same scale for all regions (untick to see small regions in detail)"));
    ctl.appendChild(lab);
    tradeAreas(card("trade-areas", `Net trade${comSuffix(coms)}`,
      `${pUnit("Net Trade")}, 2025–2050. Blue area above zero: net exports; red area below zero: net imports.`,
      { wide: true, controls: ctl }), ds, coms);
    ranking(card("trade-rank", `Largest net exporters and importers: ${cl}, ${state.year}`,
      `${pUnit("Net Trade")}. Blue: net exporter; red: net importer.`,
      { wide: true, controls: carousel("trade", "rank", C.carousel.rank) }),
      ds, "Net Trade", com, { diverging: true, n: 20 });
  }

  // World price per commodity: a single global series, drawn in ink, not a region colour.
  function worldPrices(c, ds, coms) {
    const th = theme();
    const panels = coms.map((com) => {
      // Group prices (e.g. Cereals) are IMPACT's own averages across the group (R29).
      const y = get(ds, "World Price", "-", com);
      return { title: comLabel(com), note: "No world price for this commodity",
        series: y ? [{ key: "price", name: comLabel(com), y, color: th.text, symbol: "circle" }] : [] };
    });
    multiLine(c, panels, pUnit("World Price"), { indexable: true, seriesHead: "Commodity" });
  }

  // Split a series at its zero crossings into an above-zero and a below-zero part,
  // so the export and import areas meet exactly on the zero line.
  function splitAtZero(xs, ys) {
    const x = [], pos = [], neg = [];
    const push = (xv, v) => { x.push(xv); pos.push(v >= 0 ? v : null); neg.push(v <= 0 ? v : null); };
    ys.forEach((v, i) => {
      if (!Number.isFinite(v)) return;
      const prev = ys[i - 1];
      if (i > 0 && Number.isFinite(prev) && prev * v < 0) push(xs[i - 1] + ((xs[i] - xs[i - 1]) * prev) / (prev - v), 0);
      push(xs[i], v);
    });
    return { x, pos, neg };
  }

  // Small multiples: one area panel per region (columns), one block of rows per commodity.
  // Colour encodes the sign (exports/imports), as on the map, not the region (R13).
  function tradeAreas(c, ds, coms) {
    // World has no net trade (R33): skipped here but kept in the selection for other tabs.
    const th = theme(), unit = pUnit("Net Trade"), nC = coms.length;
    const regs = state.regions.filter((id) => !C.tradeExcluded.includes(id));
    const skipped = state.regions.some((id) => C.tradeExcluded.includes(id)) ? [C.tradeExcludedNote] : [];
    if (!regs.length) return empty(c, `${C.tradeExcludedNote} Add a region or country.`);
    const w = c.chart.clientWidth || 900;
    const cols = Math.min(regs.length, Math.max(2, Math.floor(w / 150)));
    const rowsPer = Math.ceil(regs.length / cols);
    const headH = nC > 1 ? 28 : 0, titleH = 36, gapH = 16, rowH = clamp((w / cols) * 0.75, 130, 180);
    const shared = state.tradeShared, colGap = shared ? 0.03 : 0.05;
    const colW = (1 - (cols - 1) * colGap) / cols;
    // Vertical positions in px from the top, converted to paper fractions below.
    let yPx = 0;
    const blocks = coms.map(() => {
      const b = { top: yPx, rows: [] };
      yPx += headH;
      for (let r = 0; r < rowsPer; r++) { b.rows.push(yPx + titleH); yPx += titleH + rowH + gapH; }
      return b;
    });
    const plotH = yPx - gapH, f = (px) => 1 - px / plotH;
    const pos = C.divergingPos, neg = C.divergingNeg;
    const posLine = th.dark ? pos[1] : pos[2], negLine = th.dark ? neg[1] : neg[2];
    const layout = baseLayout(th, { margin: { l: 8, r: 16, t: 8, b: 30 }, hovermode: "closest", showlegend: false, annotations: [] });
    delete layout.xaxis; delete layout.yaxis;
    const data = [], rows = [], missing = [];
    let k = 0;
    const allVals = [];
    coms.forEach((com, ci) => {
      const series = regs.map((id) => get(ds, "Net Trade", id, com));
      const vals = series.flatMap((s) => s || []).filter(Number.isFinite);
      allVals.push(...vals);
      const range = (v) => {
        const lo = Math.min(0, ...v), hi = Math.max(0, ...v), pad = (hi - lo) * 0.08 || 1;
        return [lo - (lo < 0 ? pad : 0), hi + (hi > 0 ? pad : 0)];
      };
      if (nC > 1) layout.annotations.push({ text: `<b>${esc(comLabel(com))}</b>`, x: 0, y: f(blocks[ci].top), xref: "paper", yref: "paper",
        xanchor: "left", yanchor: "top", showarrow: false, font: { color: th.text, size: 13 } });
      regs.forEach((id, ri) => {
        k++;
        const xn = k === 1 ? "x" : `x${k}`, yn = k === 1 ? "y" : `y${k}`;
        const col = ri % cols, rowTop = blocks[ci].rows[Math.floor(ri / cols)];
        const x0 = col * (colW + colGap), s = series[ri];
        layout[k === 1 ? "xaxis" : `xaxis${k}`] = Object.assign(axisStyle(th), {
          domain: [x0, x0 + colW], anchor: yn, tickvals: [2025, 2050], range: [2021.5, 2053.5], showgrid: false, zeroline: false,
          tickfont: { color: th.muted, size: 11 } });
        const pv = s ? s.filter(Number.isFinite) : [];
        layout[k === 1 ? "yaxis" : `yaxis${k}`] = Object.assign(axisStyle(th), {
          domain: [f(rowTop + rowH), f(rowTop)], anchor: xn, tickformat: ",~r", zeroline: true, zerolinecolor: th.text2,
          range: pv.length ? range(shared ? vals : pv) : [-1, 1], autorange: false,
          showticklabels: pv.length > 0 && (!shared || col === 0), tickfont: { color: th.muted, size: 11 } });
        layout.annotations.push({ text: wrapLabel(regLabel(id)), x: x0, y: f(rowTop), xref: "paper", yref: "paper",
          xanchor: "left", yanchor: "bottom", align: "left", showarrow: false, font: { color: th.text2, size: 12 } });
        if (!pv.length) {
          missing.push(nC > 1 ? `${regLabel(id)} (${comLabel(com)})` : regLabel(id));
          Object.assign(layout[k === 1 ? "yaxis" : `yaxis${k}`], { zeroline: false, showgrid: false });
          data.push(placeholder(xn, yn));
          layout.annotations.push(panelText(th, "No data", `${xn} domain`, `${yn} domain`));
          return;
        }
        rows.push([...(nC > 1 ? [comLabel(com)] : []), regLabel(id), ...s]);
        const z = splitAtZero(YEARS, s);
        const area = (y, line, fill) => ({ type: "scatter", mode: "lines", x: z.x, y, xaxis: xn, yaxis: yn, fill: "tozeroy",
          fillcolor: rgba(fill, 0.45), line: { color: line, width: 1.5 }, connectgaps: false, hoverinfo: "skip" });
        data.push(area(z.pos, posLine, pos[1]), area(z.neg, negLine, neg[1]));
        data.push({ type: "scatter", mode: "markers", x: YEARS, y: s, xaxis: xn, yaxis: yn,
          marker: { size: 6, color: s.map((v) => (v >= 0 ? posLine : negLine)), line: { color: th.surface, width: 1 } },
          hovertemplate: `<b>%{y:,.0f}</b> ${esc(unit)}<br>${esc(regLabel(id))}, %{x}<extra></extra>` });
      });
    });
    missingNote(c, missing, skipped);
    if (!allVals.length) return empty(c, "No data for the selected regions. Add another region or country.");
    c.chart.style.height = `${plotH + 38}px`;
    plot(c, data, layout);
    table(c, [...(nC > 1 ? ["Commodity"] : []), "Region", ...YEARS.map(String)], rows, `Unit: ${unit}`);
  }

  // % change in world price from 2025: items in the selected commodity's group
  // (selected one emphasised), or the food groups when a total/group is selected.
  function priceChange(c, ds, com) {
    const th = theme(), yi = yearIdx();
    if (yi === 0) return empty(c, "Choose a year after 2025 to see the change in prices.");
    const prices = ds.data["World Price"]["-"];
    const ids = isItem(com)
      ? Object.keys(prices).filter((id) => isItem(id) && COM.get(id).group === COM.get(com).group)
      : [...Object.keys(META.groups), ...(Object.keys(META.groups).includes(com) ? [] : [com])].filter((g) => prices[g]);
    const rows = ids.map((id) => [comLabel(id), (prices[id][yi] / prices[id][0] - 1) * 100])
      .filter((r) => Number.isFinite(r[1])).sort((a, b) => b[1] - a[1]);
    const d = 1, hl = comLabel(com);
    const data = [{ type: "bar", orientation: "h", y: rows.map((r) => r[0]), x: rows.map((r) => r[1]),
      marker: { color: rows.map((r) => (r[0] === hl ? th.text : th.dark ? "#6b6a65" : "#a3a29b")) },
      text: rows.map((r) => `${r[1] > 0 ? "+" : ""}${fmt(r[1], d)}%`), textposition: "outside", cliponaxis: false,
      textfont: { color: th.text2, size: 12 },
      hovertemplate: `<b>%{x:+.1f}%</b><br>%{y}<extra></extra>` }];
    const layout = baseLayout(th, { hovermode: "closest", showlegend: false, bargap: 0.3, height: Math.max(plotHeight(c), 30 * rows.length) + 80 });
    layout.yaxis.autorange = "reversed"; layout.yaxis.tickfont = { color: th.text2, size: 12 };
    layout.xaxis.title.text = `% change, 2025–${state.year}`; layout.xaxis.zeroline = true; layout.margin.r = 56; layout.margin.l = 8;
    layout.xaxis.range = padRange(rows.map((r) => r[1]));
    c.chart.style.height = `${layout.height}px`;
    plot(c, data, layout);
    table(c, ["Commodity", `% change 2025–${state.year}`], rows);
  }

  function renderFood(ds) {
    const ind = state.indicator.food;
    const share = ind === "Share Pop at risk of hunger", clip = ind === "Kcal pc" ? "" : ` ${C.hungerClipNote}`;
    mapChart(card("food-map", `${pLabel(ind)}, ${state.year}`, mapSub(pUnit(ind)) + clip, { wide: true, map: true }),
      ds, ind, "-", share ? "share" : undefined);
    // Shares are not indexed: values near or below zero make an index meaningless.
    regionLines(card("share-line", "Share of population at risk of hunger",
      `${lineSub(pUnit("Share Pop at risk of hunger"), false)} Dashed line: ${C.hungerGoal.label}. ${C.hungerClipNote}` +
      (state.index ? " Shown as values: an index is not meaningful for shares." : "")),
      ds, "Share Pop at risk of hunger", ["-"], { ref: C.hungerGoal });
    regionYearBars(card("pop-bars", "Population at risk of hunger", `${pUnit("Pop at risk of hunger")}, ${C.popBarYears.join(", ")}, by region. ${C.hungerClipNote}`),
      ds, "Pop at risk of hunger", "-", C.popBarYears);
    regionLines(card("kcal-line", "Calorie availability", lineSub(pUnit("Kcal pc"))), ds, "Kcal pc", ["-"], { indexable: true });
    kcalByGroup(card("kcal-groups",
      `Calorie availability by food group, ${state.year === YEARS[0] ? YEARS[0] : `${YEARS[0]} and ${state.year}`}`,
      `${pUnit("Kcal pc by Commodity")}. Choose the second year with "Year" at the top.`), ds);
    const asc = ind === "Kcal pc";
    ranking(card("food-rank", `${asc ? "Lowest" : "Highest"} 15 countries: ${pLabel(ind).toLowerCase()}, ${state.year}`, pUnit(ind) + (asc ? "" : `.${clip}`), { wide: true }),
      ds, ind, "-", { asc });
  }

  // Part-to-whole: stacked columns (vertical, R17), food groups in fixed colour order. A group's
  // value is the sum of its IMPACT diet groups (ASF + AQF combined, R17). Two columns per region,
  // 2025 and the year chosen at the top (R25), on a two-level axis: years above, region codes below.
  function kcalByGroup(c, ds) {
    const th = theme(), unit = pUnit("Kcal pc by Commodity"), P = "Kcal pc by Commodity";
    const regs = state.regions.filter((id) => ds.data[P][id]);
    missingNote(c, state.regions.filter((id) => !ds.data[P][id]).map(regLabel));
    if (!regs.length) return empty(c, "No data for the selected regions.");
    const pal = C.series[th.dark ? "dark" : "light"];
    const groups = C.kcalGroups.map((g) => ({ label: g.label || META.groups[g.codes[0]], codes: g.codes, color: pal[g.color] }));
    const years = [...new Set([YEARS[0], state.year])];
    const val = (id, g, yr) => {
      const yi = YEARS.indexOf(yr), parts = g.codes.map((code) => get(ds, P, id, code)).filter(Boolean);
      return parts.length ? parts.reduce((a, s) => a + s[yi], 0) : null;
    };
    const pairs = regs.flatMap((id) => years.map((yr) => ({ id, yr })));
    const data = groups.map((g) => ({
      type: "bar", name: g.label, x: [pairs.map((p) => regAbbr(p.id)), pairs.map((p) => String(p.yr))],
      y: pairs.map((p) => val(p.id, g, p.yr)), customdata: pairs.map((p) => regLabel(p.id)),
      marker: { color: g.color, line: { color: th.surface, width: 1 } },
      hovertemplate: `<b>%{y:,.0f}</b> ${esc(unit)}<br>${esc(g.label)}, %{customdata}, %{x[1]}<extra></extra>`,
    }));
    // Legend below the plot and the two-level axis labels, in the same order as the stack
    // from the bottom up (R21).
    const plotH = plotHeight(c), bottom = 170;
    const layout = baseLayout(th, { barmode: "stack", hovermode: "closest", bargap: 0.2,
      height: plotH + bottom + 8, legend: { orientation: "h", x: 0, y: -75 / plotH, yanchor: "top", traceorder: "normal" } });
    layout.margin.b = bottom;
    layout.xaxis.type = "multicategory"; layout.xaxis.showgrid = false; layout.xaxis.dividercolor = th.grid;
    layout.xaxis.tickfont = { color: th.text2, size: 12 };
    if (pairs.length > 10) layout.xaxis.tickangle = -90;
    layout.yaxis.title.text = unit; layout.yaxis.tickformat = ",~r"; layout.margin.t = 8;
    c.chart.style.height = `${layout.height}px`;
    plot(c, data, layout);
    abbrevNote(c, regs);
    table(c, ["Region", "Year", ...groups.map((g) => g.label)],
      pairs.map((p) => [regLabel(p.id), String(p.yr), ...groups.map((g) => val(p.id, g, p.yr))]),
      `Unit: ${unit}. Animal-source Foods = IMPACT animal-source foods (ASF) + aquatic foods (AQF).`);
  }

  // Side-by-side charts get identical plot areas, at any window width: the same left/right
  // margins (the larger of the two, as tick labels differ, e.g. "15,000" vs "3.5") and the
  // same plot height (the larger intended one). Legends and axis labels get extra room
  // below instead of squeezing the plot. Applied to consecutive pairs of half-width cards.
  function equalizePairs() {
    const cards = [...$("#panel").children];
    let row = [];
    const flush = () => {
      const els = row.map((f) => f.querySelector(".js-plotly-plot")).filter((el) => el && el._fullLayout);
      row = [];
      if (els.length !== 2) return;
      const fl = els.map((el) => el._fullLayout);
      const L = Math.max(...fl.map((f) => f._size.l)), R = Math.max(...fl.map((f) => f._size.r));
      const H = Math.max(...fl.map((f) => f.height - f.margin.t - f.margin.b));
      els.forEach((el, i) => {
        const f = fl[i], t = f._size.t, b = f._size.b, height = Math.round(H + t + b);
        // autoexpand off: these margins already include what labels and legend needed, and
        // letting Plotly push them again would make the two plot areas differ by a few px.
        const upd = { height, "margin.l": L, "margin.r": R, "margin.t": t, "margin.b": b, "margin.autoexpand": false };
        // A legend placed below the plot is positioned in plot-height units: keep its px offset.
        if (f.showlegend && f.legend.y < 0) upd["legend.y"] = (f.legend.y * f._size.h) / H;
        el.style.height = `${height}px`;
        Plotly.relayout(el, upd);
      });
    };
    for (const f of cards) {
      if (f.classList.contains("wide")) { flush(); continue; }
      row.push(f);
      if (row.length === 2) flush();
    }
    flush();
  }

  // -------------------------------------------------------------- render ----
  function setStatus(t) { $("#status").textContent = t; }

  async function render() {
    const token = ++renderToken;
    const tab = curTab();
    assignSlots(); syncTabs(); syncPicker(); syncIndicator(tab);
    $("#year-select").value = String(state.year);
    $("#scale-select").value = state.index ? "index" : "values";
    setStatus("Loading data…");
    let ds;
    try { ds = await loadDataset(tab.dataset); }
    catch (e) {
      setStatus(`Could not load the data (${e.message}). If you opened index.html directly from disk, ` +
        "start a local web server instead, e.g. python -m http.server -d docs");
      return;
    }
    if (token !== renderToken) return;
    syncCommodity(tab, ds);
    setStatus("");
    const panel = $("#panel");
    // Hold the panel's height while it is rebuilt, so the page doesn't shrink and jump back to
    // the top when a control far down the page (e.g. the ranking carousel, R41) redraws it;
    // then put the scroll position back, which the browser's scroll anchoring can shift.
    const scrollY0 = window.scrollY;
    panel.style.minHeight = `${panel.offsetHeight}px`;
    for (const el of panel.querySelectorAll(".js-plotly-plot")) Plotly.purge(el);
    panel.replaceChildren();
    lastWidth = panel.clientWidth;
    try { tab.render(ds); equalizePairs(); }
    catch (e) { setStatus(`Something went wrong while drawing the charts: ${e.message}`); console.error(e); }
    panel.style.minHeight = "";
    if (window.scrollY !== scrollY0) window.scrollTo(0, scrollY0);
    if (refocus) { const el = document.getElementById(refocus); if (el) el.focus({ preventScroll: true }); refocus = null; }
    writeHash();
  }

  // Chart heights, legend wrapping and panel columns depend on the width, so redraw after
  // any width change; a partial (Plotly-only) resize would leave paired charts unequal (R23).
  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (META && Math.abs($("#panel").clientWidth - lastWidth) > 2) render(); }, 250);
  });

  async function init() {
    const saved = localStorage.getItem("gor-theme");
    if (saved) document.documentElement.dataset.theme = saved;
    const tbtn = $("#theme-toggle");
    const syncThemeBtn = () => { tbtn.setAttribute("aria-pressed", String(isDark())); tbtn.textContent = isDark() ? "Light mode" : "Dark mode"; };
    syncThemeBtn();
    tbtn.addEventListener("click", () => {
      const t = isDark() ? "light" : "dark";
      document.documentElement.dataset.theme = t; localStorage.setItem("gor-theme", t);
      syncThemeBtn(); render();
    });
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { syncThemeBtn(); render(); });

    try {
      const r = await fetch("data/meta.json", { cache: "no-cache" });
      if (!r.ok) throw new Error(`meta.json: HTTP ${r.status}`);
      META = await r.json();
    } catch (e) {
      setStatus(`Could not load the data (${e.message}). If you opened index.html directly from disk, ` +
        "start a local web server instead, e.g. python -m http.server -d docs");
      return;
    }
    YEARS = META.years;
    for (const reg of META.regions) {
      REG.set(reg.id, reg);
      if (reg.map) for (const iso of reg.map) ISO2REG.set(iso, reg.id);
    }
    for (const c of META.commodities) COM.set(c.id, c);
    readHash();
    buildTabs(); buildYearSelect(); buildScaleSelect(); buildPicker();
    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
