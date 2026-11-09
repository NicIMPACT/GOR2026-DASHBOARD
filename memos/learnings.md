# Learnings: GOR 2026 Dashboard

## Data quirks
- **`NA` is a region, not a missing value.** `NA` is North America (confirmed by Nicola, 2026-10-20); Namibia appears separately as `Namibia`. Pandas and R read it as missing by default, which silently drops 1,224 rows in `Production_Demand_REF.csv` alone.
- **Aggregates sit alongside individual entries.** `region` mixes countries with world, income-group and CGIAR-region aggregates. `commodity` mixes single commodities with `All*` and diet-group aggregates. Sums that don't filter these out double-count.
- **Area and yield cover crops only.** They have 47 commodity codes (no livestock; 44 once fodder and grass are dropped) and no Greenland. Their commodity and region sets therefore differ from demand and production, which matters when joining the files.
- **Fodder and grass (`FORx`) are not in the totals.** In the commodity classification they have no `All` or sub-total mapping, so `All`/`AllC` figures exclude them. Keep this in mind when showing totals or comparing them with sums of individual crops. Since 2026-10-22 the dashboard leaves them out entirely (R38).
- **The files carry no units.** The units were inferred from value magnitudes and confirmed by Nicola on 2026-10-21 (table in `CLAUDE.md`). Only the base year of the constant-USD world prices is still open.
- **Negative risk-of-hunger values are a model artefact.** 264 rows per measure, in 44 regions, mostly high-income countries. Many show exactly −0.47% in every year, which looks like a fixed term of the hunger equation rather than a projection. IMPACT's aggregates are sums that include the negatives: in 2050, World is 491.5 million, 5.8 million (1.2%) below the sum of the countries set to 0, and High income is 0.3 million vs. 5.6 million.
- **A negative value doesn't always mean "no hunger".** Burundi and Eritrea are negative in every year although they have the lowest calorie availability in the data (~1,950 kcal per person per day in 2025), while neighbours with more calories show 22–29% at risk. This likely means the hunger equation is being used outside its valid range. Treat model outputs at the edge of their range with caution, and check them against a related indicator (here, calories) before applying a blanket rule.
- **Clipping countries makes aggregates disagree with their parts.** Once negative countries are shown as 0 but IMPACT's totals are kept (R34), a user who adds up the countries gets more than the total shown (World +1.2% in 2050). This is the price of matching the published report; a recompute would also need population data that the extracts don't include.
- **Implausible series can come from a model issue, not just artefacts.** China's maize net trade swings from a +31.5 million t net export in 2025 to −7.0 million t in 2040 and back to +6.4 million t in 2045. The team traced this to a model issue that is being fixed (R35). Large sign swings in a big trader's net trade are worth a check before publishing.
- **IMPACT's group yields and prices are proper aggregates.** The Cereals price, for example, is IMPACT's computed average across cereals, and can be shown. Never recompute group yields or prices from the individual crops: they can't simply be added or averaged.
- **Crops a country doesn't grow have no rows, not zeros.** In `Yield_Area_REF.csv` a country without the crop is simply absent (e.g. rice: 112 of 158 countries; wheat 114; maize 143; no zero yields or areas, checked 2026-11-05). Country distributions and counts therefore describe the growing countries only, and "no data" on a map often means "not grown".
- **Crop area spans six orders of magnitude across countries.** For rice, country areas in 2025 run from about 0.02 to 49,000 thousand ha (wheat and maize are similar). On a normal scale a few large producers flatten everyone else, so spread charts need a log scale (the violin plot, R44). Yields span about one order of magnitude and read fine on a normal scale.
- **The metadata workbooks can change shape.** On 2026-10-21 the 8th column of the regional classification changed from continent to the CG6 full region names. The build script reads columns by position (the headers repeat by design), so check it whenever a workbook is updated.

## Observations on IMPACT results

- **China has no risk-of-hunger results (checked 2026-10-22).** The China "no data" on the share-at-risk map and charts comes from IMPACT's output, not from the dashboard. `Food_security_REF.csv` has no `Share Pop at risk of hunger` (or `Pop at risk of hunger`) rows for China, South Korea, Palestine, Swaziland or Other Southeast Asia, although all five have `Kcal pc` rows. The cleaned file matched the raw extract exactly (2026-10-20), so the gap is in the IMPACT extract itself. This is different from Burundi and Eritrea (M2) and China's maize net trade (M3), which the dashboard drops; it is therefore not in the "Data modifications" table.
  - **Still unknown:** why IMPACT leaves these countries out (e.g. the hunger module isn't run for them, or the extract skips them), and whether IMPACT's SEA aggregate ("Southeast and East Asia", shown as reported per R34) includes China. Both are questions for the IMPACT team. Left as is for now (Nicola, 2026-10-22).

## Dashboard and tool quirks
- **Charts placed side by side don't match by default.** Plotly sizes each chart's margins from its own tick labels and legend, so paired plots differed (e.g. area 529 px vs. yield 563 px wide), and a long legend squashed its plot. Equal sizes need explicit handling (`equalizePairs()` in `app.js`).
- **Browsers keep serving old files.** After a data rebuild the browser showed the old region names until a hard refresh. Data files are now always re-checked with the server; after code changes, use Ctrl+F5.
- **Headless Edge is good for layout checks but not for dark mode.** Its screenshots and `--dump-dom` reliably show sizes, notes and errors, but dark mode needs checking by eye.
- **Interactions can be tested headless, with care.** Driving Edge through its DevTools protocol (Python `websockets`) tests clicks, hover and keyboard. Four traps: `--window-size` is ignored (set the viewport with `Emulation.setDeviceMetricsOverride`); a reused profile restores old scroll positions; navigating to a URL that differs only after `#` doesn't reload the page (go to `about:blank` first); and Edge leaves child processes running unless the whole process tree is killed.
- **Redrawing the page loses the scroll position.** The dashboard rebuilds the whole tab on every change, so a control far down the page (e.g. the ranking carousel) threw the user back to the top. A test from a control at the top of the page won't catch it. `render()` now holds the panel's height and restores the scroll position (R41). Test new controls from where they sit on the page.

## Git and GitHub

**Committing and pushing are done by Nicola.** Claude's `git push` failed with `Permission denied (publickey)`: the repository is connected over SSH, and the SSH key (`~/.ssh/id_ed25519`) wasn't usable from Claude's background shell, probably because it needs a passphrase or an agent that only Nicola's own session has. Since 2026-10-22 Nicola also prefers to commit manually, so Claude leaves its changes uncommitted and lists what changed. This also means nothing goes public without Nicola seeing it first.

**Nicola's question (2026-10-22):** once Claude has finished its changes, what sequence of commands sends the folder's content to GitHub? Claude's answer follows.

Run the commands in a terminal opened in `C:\GOR Dashboard`. The VS Code terminal opens there already; in Git Bash, first type `cd "/c/GOR Dashboard"`.

*The standard sequence*

```
git status
git add -A
git commit -m "Short description of what changed"
git push origin main
```

1. **`git status`** lists the files that have changed since the last commit. It changes nothing, so it's always safe. Check that the list contains only files you expect.
2. **`git add -A`** marks all the changes for the next commit: new, modified and deleted files. Git calls this "staging".
3. **`git commit -m "..."`** saves a snapshot of the staged changes on your computer, with a message. Nothing goes to GitHub yet. Write a message that tells a colleague what changed, e.g. `"Remove fodder and grass (R38)"`.
4. **`git push origin main`** sends your commits to GitHub. `origin` is the name of the GitHub repository and `main` is the branch. A minute or two later, GitHub Pages updates the live site. Press Ctrl+F5 on the site to see the new version.

*When Claude has already committed*

If Claude has committed the changes (only when asked) but couldn't push, run only:

```
git status
git push origin main
```

After a commit, `git status` says *"Your branch is ahead of 'origin/main' by 2 commits"*. That means there are 2 commits waiting to be pushed. After the push it says *"up to date"*.

*Useful checks*

- **`git log --oneline -5`** shows the last 5 commits, one line each.
- **`git log --oneline origin/main..main`** lists the commits you have locally that aren't on GitHub yet. If nothing is printed, everything has been pushed.

*Two things to watch*

- **If the push is rejected** with a message about the remote containing work you don't have, someone has changed the repository on GitHub, for example by editing a file on the website. Run `git pull origin main` first, then push again.
- **After a data change,** the browser data has to be rebuilt before committing: `python scripts/build_data.py`. Claude does this as part of its changes. If you edit a `*_REF.csv` or metadata file yourself, run it before the commit.

If unsure, run `git status` first. It tells you where you are, and it often suggests the next command too.

**Nicola's question (2026-11-09):** after `git push`, what wording in the terminal shows that the push worked? Claude's answer follows.

A successful push ends with a line like this:

```
To github.com:NicIMPACT/GOR2026-DASHBOARD.git
   c13be91..fa478ed  main -> main
```

That last line is the one to look for. It means GitHub's `main` moved from the old commit (`c13be91`) to the new one (`fa478ed`). The lines before it ("Enumerating objects", "Writing objects: 100%", "Total …") are only progress messages.

| Wording | Meaning |
|---|---|
| `old..new  main -> main` | Pushed. |
| `Everything up-to-date` | Nothing was sent. Usually nothing was committed, or the commit was already pushed. |
| `! [rejected] main -> main (fetch first)` or `(non-fast-forward)` | Not pushed. GitHub has commits that aren't on this computer (e.g. a file edited on the website). Run `git pull origin main`, then push again. |
| `Permission denied (publickey)` or `Authentication failed` | Not pushed. Login or SSH key problem. |
| `fatal: …` or `error: …` | Not pushed. The message says why. |

Rule of thumb: `rejected`, `error` or `fatal` means the push did not go through; the `old..new  main -> main` line with no errors means it did.

*Other ways to check*

- `git status` afterwards says *"Your branch is up to date with 'origin/main'"*. Run `git fetch` first to be fully sure.
- In VS Code's Source Control panel, the sync arrows clear (no "1↑" left).
- On GitHub, the latest commit above the file list is the new one, and the **Actions** tab shows a green tick for the "pages build and deployment" run. The live site updates a few minutes later (hard refresh with Ctrl+F5).

**Nicola's question (2026-11-03):** the repository is in Nicola's own GitHub account (`NicIMPACT`), which belongs to the IFPRI organization. Once the dashboard is finished, how is it moved to IFPRI's institutional GitHub account? Claude's answer follows.

GitHub can **transfer** a repository from a personal account to an organization. History, issues, settings and the GitHub Pages configuration move with it.

*Steps*

1. **Check permissions first.** Transferring into an organization needs the right to create repositories there, which many organizations limit to owners. If Nicola doesn't have it, either an org owner grants it temporarily, or Nicola adds an org owner as admin on the repo and they do the transfer. Ask IFPRI's GitHub admins beforehand: they may also have rules on naming, visibility or which team owns the repo.
2. **Transfer.** In `NicIMPACT/GOR2026-DASHBOARD`: Settings → General → Danger Zone → Transfer ownership. Pick the IFPRI organization and confirm with the repo name. The name can be kept or changed here.
3. **Check Pages.** In the transferred repo, Settings → Pages: confirm it still deploys from `main`, `/docs`. A private repo needs a paid plan for Pages; if Pages shows as disabled, that's why.
4. **Update the local copy** (optional, as GitHub redirects the old address). The repo is connected over SSH, so:
   ```
   git remote set-url origin git@github.com:<IFPRI-org-name>/GOR2026-DASHBOARD.git
   ```

*Things to know*

- **The dashboard's public address changes, with no redirect.** Links to the repo itself redirect automatically, but the Pages site moves from `nicimpact.github.io/GOR2026-DASHBOARD/` to `<org-name>.github.io/GOR2026-DASHBOARD/`, and the old address stops working. Transfer **before** the link is shared anywhere (report, slides, emails).
- **A custom domain avoids this.** An address like `gor2026.ifpri.org`, set in Pages settings, stays the same through any later move. IFPRI's IT/web team would need to add a DNS record.
- **Don't create a new `GOR2026-DASHBOARD` repo in the personal account afterwards**, or the repo redirects break.
- **The dashboard code needs no change.** Nothing in `docs/` hardcodes the site address; all paths are relative (checked 2026-11-03). Only the repository line in `CLAUDE.md` needs updating after the transfer; the dated mentions in `memos/progress.md` stay as a record. `README.md` already uses a `<user-or-org>` placeholder.

*Alternative, not recommended:* an org owner creates an empty repo and Nicola pushes the local copy there (`git push --mirror`). History is kept, but Pages and other settings must be set up again, the old repo lingers, and nothing redirects.

---
*Produced by Claude (Anthropic), an AI model, at the request of Nicola Cenacchi (IFPRI), 2026-11-09.*
