# Design Debt Log — Iteration Evidence

> Before / After improvements made during V2 review cycle (Apr 19 → Apr 23, 2026).
> Each entry: discovered issue → what changed → why it changed → where in the codebase.
> Minimum required: 3. Delivered: 8.

Commit references in parentheses are real commits on `master`.

---

## #1 — Sync screen showed binary OK/FAIL only, no count, no failure code

**Before**
- Sync rows were either green or red, no machine-readable error code.
- No "N of M synced" pill at the top — reviewer had to count rows.
- No big banner summarising the result.

**After**
- Added `#sync-count-pill` ("3 / 4 synced") with `pill-ok` / `pill-partial` variants.
- Added `#sync-bigbar` (`.status-bar.syncing/ok/partial/fail`) — yellow while running, green/amber/red on settle.
- Failed rows now render `❌ Pharmacy System · ERR-503 · pharmacy offline` + inline **Retry**.

**Why**
Reviewer needs at-a-glance answer ("did it sync?") without scanning the list. Error codes turn the prototype into a real conversation about ops/runbooks, not just happy-path eye candy. (Commit `fd58d31`.)

---

## #2 — No way to retry failed sync rows in bulk

**Before**
- Each failed row had a per-row Retry button.
- A scenario with 3 failures meant 3 separate clicks during the demo.

**After**
- Added **🔁 Retry All Failed** button, visible only on partial/fail states.
- Iterates pending fails with a 1100ms gap (so each row "lights up" individually rather than flipping all at once).
- Disables itself while running to prevent double-clicks.

**Why**
A demo of "what does the user do when all four downstream systems fail?" needs a one-click recovery. Per-row retry is still the fine-grained control; bulk retry is the operator escape hatch. (Commit `fd58d31`.)

---

## #3 — Sync result was invisible after leaving the Sync screen

**Before**
- After clicking "Back to Queue →", the sync outcome vanished. Reviewer had to remember whether it succeeded.
- No record on the patient summary that anything had been pushed.

**After**
- `state.lastSyncOutcome` is written by `finalize()` with `{ scenarioId, result, at, details }`.
- Summary screen reads it via `showSyncToast()` → renders `.toast-ok` / `.toast-partial` / `.toast-fail` with system list and timestamp.
- Toast is one-shot (cleared after first render) and scenario-scoped (won't appear for a different patient).
- Auto-dismiss after 5s; manual × close any time.

**Why**
The sync action's outcome is the most important "did it actually work" cue in the whole flow. It should follow the user back to the next screen, not get lost. (Commit `bf3bea0` + `fd58d31`.)

---

## #4 — Prescription was display-only

**Before**
- The Rx card on the Assessment screen rendered drug rows with safety chips (`✓ safe`, `⚠️ interaction`) but had no edit affordance.
- Demo couldn't show "doctor adjusts dose / removes a drug / adds a new one".

**After**
- Added view ↔ edit mode toggle per patient (`state.rxEditMode[hn]`).
- Edit mode reveals `<input>`s for drug/dose/freq/duration + `✕` remove + **+ Add Drug**.
- **Save** filters empty rows and persists; **Cancel** drops the buffer.
- Edit buffer is a deep clone — original `rxPrefilled` is never mutated.

**Why**
A clinical telemed prototype that can't change the prescription is missing the central doctor verb. Non-destructive buffer means a mid-edit reload + cancel safely returns to the AI-generated baseline. (Commit `c9b7a76`.)

---

## #5 — Summary cards had no timestamps, made data feel timeless

**Before**
- Vitals card showed values, no time-of-measurement.
- Lab card showed values, no time-of-result.
- Reviewer asked "is this stale?" and we had no answer.

**After**
- Added `tsPair(iso)` helper → renders `"10:42 · 2m ago"` (absolute + relative).
- Vitals card head shows "taken at" timestamp.
- Lab card hoists shared `receivedAt` to card head when all rows share it; otherwise per-row timestamps.
- Note card on Video screen shows "Draft saved Ns ago" / "Nm ago" / "No note yet".

**Why**
Clinical data without freshness context is ambiguous. The hoist-when-shared rule keeps the card head clean for the common case, while still allowing row-level granularity when results came in at different times. (Commit `5ddc2a3`.)

---

## #6 — AI Risk score rendered without owning the screen

**Before**
- Each scenario carried `aiRisk: { score, label, recommendation }`.
- It was rendered as a small card on Summary, but it didn't influence anything (no banner, no nav change).
- Reviewer feedback: "this looks like marketing, it's not earning its space".

**After**
- Removed the `aiRisk` render entirely.
- Kept the field on the data model so a future "AI assistance" panel can be wired up without touching scenarios.

**Why**
Better to delete a feature that doesn't earn its pixel cost than to fake-render it. The data is preserved; the UI is honest. (Commit `5ddc2a3`.)

---

## #7 — Header identity chip showed the same name regardless of role

**Before**
- Header always read "Dr. Somchai N. · D-00123" even after switching role to nurse.
- Made the role toggle feel like a no-op visual.

**After**
- `renderIdentityChip(role)` swaps to `Nurse Malee K. · N-00456` on role change.
- Sidebar nav also greys out doctor-only screens (`video`, `assessment`, `sync`).
- If the user is on a doctor-only screen and switches to nurse, app auto-bounces to queue.

**Why**
Role separation has to be visible at the chrome, not hidden in business logic. The chip + greyed nav + bounce together make the role boundary obvious. (Apr 22 worker commits, see TECHNICAL.md §9.)

---

## #8 — Universal "blocker" CSS broke layout on narrow screens

**Before**
- A leftover utility blocked sidebar transitions at the 1024px breakpoint, leaving the app stuck mid-collapse.
- Hamburger toggled the class but the sidebar didn't actually slide.

**After**
- Removed the blocker from `css/base.css`.
- Hamburger now toggles `.open` cleanly; sidebar drawer transitions in/out.
- Verified at 1024px and below in DevTools.

**Why**
A wireframe that breaks on a tablet-sized window doesn't get a fair review. The fix is a one-line removal once you find it; the value is in the discovery. (V2 task T3.)

---

---

# v3 — Production Redesign (Apr 27, 2026)

> Re-skin from grayscale wireframe to launch-ready clinical console. No state-schema changes; visuals + a11y + responsive only.

## #9 — Wireframe grayscale + system-ui font lacked clinical credibility

**Before**
- Body had `filter: grayscale(100%)`. Whole product reads as "demo" rather than "real product".
- Single `system-ui` stack — no display rhythm, no brand voice.
- No design system identity beyond hairline borders + grey text.

**After**
- New token set: cyan-600 primary (`#0891B2`), emerald-600 accent (`#059669`), slate neutral scale, full semantic danger/warn/ok scales (50/500/600/700 each).
- Typography pair: **Figtree** display + body, **Noto Sans** body fallback (Thai reach), **JetBrains Mono** for lab values & IDs.
- Tabular nums on by default, mono for clinical numerics, h1/h2/h3 type scale with letter-spacing tuned.

**Why**
A telehealth console has to look like enterprise medical software, not a Figma export. The cyan-green palette signals "calm clinical" without veering into childish neon or AI-purple-gradient territory.

---

## #10 — Emoji as structural icons broke cross-platform consistency

**Before**
- 30+ emoji used as UI icons: 📋 💓 🎥 📝 ✅ 🔴 ⚠️ 👤 🔁 📞❌ etc.
- Renders inconsistently across macOS / Windows / Android / iOS.
- Cannot tint, cannot resize precisely, cannot be tokenized.
- Failed UI/UX guideline #4 "no emoji as icons".

**After**
- Single inline **SVG sprite** in `index.html` — 28 Lucide-stroked glyphs declared once via `<symbol id="i-...">`.
- Every icon ref is `<svg class="icon"><use href="#i-name"/></svg>`.
- `currentColor` inheritance lets icons recolor with parent text.
- Sizes are tokens: `.icon` 16, `.icon-sm` 14, `.icon-lg` 20, `.icon-xl` 24.

**Why**
Vector icons scale, theme, and stay visually identical across every platform. Zero asset weight (sprite is inline). Stroke consistency = perceived quality.

---

## #11 — Header was a flat list of controls with no brand identity

**Before**
- Plain "TELEMED" text, no logo mark.
- Identity chip used a `👤` emoji and free-text name.
- No quick search affordance.
- No clear role separation visual cue.

**After**
- **Brand mark**: 32px gradient tile (cyan-500→700) with stethoscope SVG + "Telemed / CLINICAL CONSOLE" stacked label.
- **Identity chip**: 28px gradient avatar with auto-derived initials ("DR" / "NS"), name + ID stacked.
- **Search trigger**: 220px muted-bg button with magnifier SVG + `⌘K` `<kbd>` shortcut hint.
- **Role switch**: paired user icon + native select.
- **Flag-count chip**: red soft pill ("⚠ 1 red-flag") only when active scenario has flags.

**Why**
Header is the always-on brand surface. A clinical product needs to assert identity (logo + mark), surface power-user shortcuts (⌘K), and make the active operator + role unambiguous at a glance.

---

## #12 — Sidebar nav was undifferentiated text links

**Before**
- Five `<a>` items as plain text "📋 1 · Queue" etc., emoji + text.
- No active state styling beyond default browser anchor.
- Scenario picker was a bare `<select>` at the bottom.

**After**
- Numbered `.nav-step` chips (20px) + Lucide SVG + label, in 40px-min flex rows.
- `.active` flips to primary-soft background, primary-600 step chip fill, primary-hover label.
- `.disabled` (nurse-locked screens) goes 0.4 opacity + `pointer-events: none`.
- Scenario picker now in a boxed `.scenario-picker` panel pinned to the sidebar bottom with section label, helper hint, and inset background.

**Why**
A workflow-driven product (1→5 sequence) deserves explicit numeric anchors. Active-state contrast removes any "where am I?" doubt.

---

## #13 — Queue rows + summary cards were data-dense but visually flat

**Before**
- Queue rows: line of bold text + chips on a flat white card with shared border.
- Vitals chips were tiny inline elements; out-of-range vitals only had a "🔴" suffix.
- Lab data was a single line of text with sparkline blocks; no clear hierarchy.
- Allergy was rendered as a list of "🚫 Penicillin (rash)" lines.

**After**
- **Queue row**: full card with hover/active state, 4px left bar for red-flag rows, "Recommended next" cyan badge, status pill with leading dot, keyboard activatable (`tabindex="0"` + Enter/Space).
- **Vital cells**: dedicated `.vital` tile per measurement — uppercase label, large numeric (display font), unit subscript. `.vital.alert` swaps to danger soft bg + danger-700 numeric for out-of-range readings.
- **Lab row**: name (semi-bold) · mono values · unit · colored arrow (up=danger, down=ok, flat=subtle) · sparkline · timestamp pushed right · dashed bottom divider.
- **Allergy item**: pill with ban icon, drug bold, reaction muted parenthetical.

**Why**
Clinical data demands hierarchy. A 128 bpm vital should look obviously alarming, not "buried in a row of grey chips". The vital-card pattern is the same one used by Apple Health, Epic, and Athena.

---

## #14 — Sync screen rows were minimal text lines

**Before**
- Each sync destination was a row of `⏳ HIS / EMR  syncing…` then `✅ HIS / EMR  synced 10:42:01` — bare text, no icon weight, no visual state on the row container.
- The big status bar was a plain text line.

**After**
- **Sync row**: card-like container with circular `.sync-icon` avatar (28px) that flips bg+icon by state class. `.syncing` rotates the refresh SVG. Whole row tints on `.ok` (green soft) / `.fail` (red soft).
- **Big status bar**: bordered+filled banner with state-matched SVG (refresh spinning / check-circle / alert-triangle / x-circle).
- **Retry** is a `.sm` button (32px) with refresh icon, sized as a chip-like control.

**Why**
The sync screen is the most operational surface in the product. Every state transition (waiting → syncing → ok / fail → retrying → ok) must be visually unambiguous from across the room.

---

## #15 — No mobile responsive behavior beyond a single breakpoint

**Before**
- One breakpoint at 1024px hid the sidebar.
- Header layout still tried to render full search + identity + role on small screens, causing horizontal overflow.
- Page actions (Save & Sync, Start Video) didn't stretch on phone widths.
- Vital chip row didn't reflow.

**After**
- Two breakpoints (`≤1024`, `≤480`) with progressive hiding:
  - Tablet hides search-trigger + identity name/id (avatar still visible) + scenario subtitle.
  - Phone hides identity chip entirely, switches vitals grid to 2-col, wraps "Show done" toggle.
- `.page-header` stacks vertically on small screens; `.page-header .actions` buttons go `flex: 1` to fill width.
- Rx editor collapses to 2-col grid with delete on its own row.
- Hamburger toggles drawer (280px), header gets compact padding/gap.

**Why**
Doctors and nurses use phones at the bedside. A console that overflows or hides controls on a Pixel 8 isn't ready to ship.

---

## #16 — Focus rings + keyboard ergonomics were browser-default

**Before**
- Default browser focus outlines (often invisible on dark links).
- Queue rows were `<div>`s with click handlers, not keyboard-activatable.
- No `aria-live` on the floating sync toast.

**After**
- Single `:focus-visible` rule applies a 3px primary-tinted halo (`box-shadow: 0 0 0 3px var(--ring)`) to **every** interactive element.
- Queue rows are now `<article role="button" tabindex="0">` with Enter/Space handlers and an explicit `aria-label` summary.
- Sync toast uses `role="status" aria-live="polite"`; red-flag toast uses `role="alertdialog"` with labelled title.
- `prefers-reduced-motion` collapses every transition + animation to 0.01ms.

**Why**
A clinical product running 8h/day must be operable from the keyboard, support screen readers, and never strand a focused user with an invisible cursor.

---

## #17 — Generic silhouette placeholder undermined Video Consult realism

**Before**
- Single shared `assets/video-placeholder.svg` rendered the patient feed as a flat dark-grey silhouette ("circle head + rectangle body") regardless of which patient was on the call.
- All three demo scenarios looked identical on the Video screen — broke the illusion that this is a real telehealth product.
- Nothing in the visual feed reinforced the patient identity that the rest of the UI worked so hard to make explicit.

**After**
- Three per-scenario stylized SVG illustrations under `assets/`:
  - `patient-A.svg` — Somchai K. (58M), navy collared shirt, light living room with window + picture frame, calm expression.
  - `patient-B.svg` — Malee P. (67F), mauve blouse, soft bedroom with headboard and lamp, drawn/concerned expression matching the chest-pain context.
  - `patient-C.svg` — Anan R. (45M), green polo, home office with bookshelf and plant, glasses, relaxed.
- `js/render.js` `renderVideo()` swaps `vid-patient-img.src` by `s.id`. Falls back to the original silhouette for unknown ids (D/E).
- `.video-stage img` switched to `object-fit: contain` over a slate-900 letterbox so the full illustration is always visible without cropping.

**Why**
Patient identity should be unmistakable on every clinical surface, including the video stage. Per-scenario portraits also make demo recordings instantly readable — reviewers see a different patient even with the volume off.

---

## #18 — Self-view PIP was text-only, not a real video preview

**Before**
- Bottom-right of the video stage was a flat dark rectangle with "Dr · self-view" text and nothing else.
- Demo recordings looked nothing like a real telehealth call where the operator sees their own webcam preview.
- Role identity (Doctor vs Nurse) wasn't reinforced on the call surface — only in the header chip.

**After**
- Two role-specific portraits:
  - `assets/doctor.svg` — clinician in white coat, cyan stethoscope, ID badge, dark slate office backdrop with a hint of cyan rim light.
  - `assets/nurse.svg` — clinician in cyan scrubs (V-neck), pen in chest pocket, embroidered name strip, hair in a bun.
- Self-view PIP enlarged to 160×100, image fills with `object-fit: cover`, role label overlays the bottom-left with text-shadow for legibility on any frame content.
- `renderVideo()` swaps the self-view src + label by `state.role` — switching role updates the PIP immediately without a navigation reload.

**Why**
Telehealth UI legibility depends on the operator recognizing themselves at a glance and reading the patient context simultaneously. A real PIP closes that gap. Doctor/nurse swap also makes the role-permission story concrete: the same camera control flips identity end-to-end.

## Roll-up

| # | Area | Status |
|---|------|--------|
| 1 | Sync clarity (count, big bar, error codes) | ✅ |
| 2 | Bulk error recovery | ✅ |
| 3 | Cross-screen sync feedback | ✅ |
| 4 | Rx editing | ✅ |
| 5 | Summary timestamps | ✅ |
| 6 | Honest data model (drop fake AI Risk) | ✅ |
| 7 | Role-aware identity + nav | ✅ |
| 8 | Layout blocker fix | ✅ |
| 9 | Production typography + color system | ✅ v3 |
| 10 | SVG icon sprite (kill emoji icons) | ✅ v3 |
| 11 | Branded header (logo, search, role) | ✅ v3 |
| 12 | Workflow-numbered nav with active states | ✅ v3 |
| 13 | Vital cells, lab rows, allergy items | ✅ v3 |
| 14 | Sync row state visuals | ✅ v3 |
| 15 | Mobile responsive (≤1024 + ≤480) | ✅ v3 |
| 16 | Universal focus rings + keyboard a11y | ✅ v3 |
| 17 | Per-scenario patient portraits on Video Consult | ✅ v3 |
| 18 | Role-aware self-view PIP (Doctor / Nurse) | ✅ v3 |

## Still on the debt list (next iteration)

These are tracked but **not** done in this prototype — surfaced honestly so reviewers know what we'd do next.

| # | Item | Source |
|---|------|--------|
| D1 | Focus trap inside red-flag toast | a11y §6.4 |
| D2 | ESC-to-dismiss for modal toast | a11y §6.5 |
| D3 | Skip-to-content link | a11y §6.7 |
| D4 | `prefers-reduced-motion` gate on transcript + stepper | a11y §8.2 |
| D5 | Per-screen `<title>` updates | a11y §3.5 |
| D6 | `--space-*` token scale (currently raw px) | DESIGN_SYSTEM §1.3 |
| D7 | Confirm dialog on "End Call" | a11y §4.6 |
| D8 | Rx remove button to 32×32 (currently 28) | a11y §2.5 |

---

*End of DESIGN_DEBT_LOG.md*
