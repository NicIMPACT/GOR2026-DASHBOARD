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
- **The metadata workbooks can change shape.** On 2026-10-21 the 8th column of the regional classification changed from continent to the CG6 full region names. The build script reads columns by position (the headers repeat by design), so check it whenever a workbook is updated.

## Dashboard and tool quirks
- **Charts placed side by side don't match by default.** Plotly sizes each chart's margins from its own tick labels and legend, so paired plots differed (e.g. area 529 px vs. yield 563 px wide), and a long legend squashed its plot. Equal sizes need explicit handling (`equalizePairs()` in `app.js`).
- **Browsers keep serving old files.** After a data rebuild the browser showed the old region names until a hard refresh. Data files are now always re-checked with the server; after code changes, use Ctrl+F5.
- **Headless Edge is good for layout checks but not for dark mode.** Its screenshots and `--dump-dom` reliably show sizes, notes and errors, but dark mode needs checking by eye.
- **Interactions can be tested headless, with care.** Driving Edge through its DevTools protocol (Python `websockets`) tests clicks, hover and keyboard. Three traps: `--window-size` is ignored (set the viewport with `Emulation.setDeviceMetricsOverride`), a reused profile restores old scroll positions, and Edge leaves child processes running unless the whole process tree is killed.

## Git and GitHub

**Pushing is done by Nicola.** Claude's `git push` failed with `Permission denied (publickey)`: the repository is connected over SSH, and the SSH key (`~/.ssh/id_ed25519`) wasn't usable from Claude's background shell, probably because it needs a passphrase or an agent that only Nicola's own session has. So Claude commits (or leaves changes for Nicola to commit) and Nicola pushes from their own terminal. This also means nothing goes public without Nicola seeing it first.

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

If Claude says it has committed the changes but couldn't push, run only:

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

---
*Produced by Claude (Anthropic), an AI model, at the request of Nicola Cenacchi (IFPRI), 2026-10-22.*
