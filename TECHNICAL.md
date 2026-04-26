# Telemed Wireframe — Technical Specification

> Interactive grayscale wireframe demo for a 5-screen telemedicine clinical flow.
> Live: https://bliztripper.github.io/telemed-wireframe/

This document is the canonical technical reference for the `telemed-wireframe` project. It covers the full architecture, data model, state machine, rendering pipeline, interactions, screens, design tokens, accessibility behavior, and file-by-file API surface.

---

## 1. Purpose & Scope

The wireframe simulates a doctor/nurse OPD (out-patient department) consult flow on a telemedicine platform. It is a **pure-frontend, zero-build static site** intended as:

- A **design artifact** for UX review — grayscale-only to force reviewers to focus on hierarchy/flow instead of color.
- A **click-through prototype** exercising realistic patient scenarios (stable, red-flag, sync failure).
- A **baseline reference implementation** from which the production Vue/React/Flutter UI can be specced.

**Not in scope:** real backend, real telehealth streaming, real EHR integration, real authentication, internationalization, PWA/offline. Data is mocked inline; all "AI" outputs are pre-canned.

---

## 2. Tech Stack

| Layer | Choice | Notes |
|------|--------|------|
| Markup | HTML5 | `index.html` shell + per-screen fragments in `screens/*.html` |
| Styling | Vanilla CSS custom properties | Two files: `css/base.css` (tokens/layout) + `css/components.css` (widgets) |
| Behavior | Vanilla ES Modules | No build step. Loaded via `<script type="module" src="js/nav.js">` |
| Persistence | `localStorage` (key `telemed.state.v3`) | Single JSON blob, sync write on every mutation |
| Rendering | `DOMParser`-based fragment builder | `js/dom.js` wraps `replaceChildren` for safer innerHTML substitution |
| Assets | 1 inline SVG placeholder | `assets/video-placeholder.svg` |
| Hosting | GitHub Pages (static) | Open `index.html` locally or visit live URL |
| Color mode | `filter: grayscale(100%)` on `body` | Hard-locks visual output to grayscale regardless of token values |

No frameworks, no bundlers, no package manager. Every behavior is traceable to a file you can open in a text editor.

---

## 3. Project Structure

```
telemed-wireframe/
├── index.html              # App shell: header, sidebar nav, <main> mount point
├── README.md               # Short user-facing readme
├── TECHNICAL.md            # This file
├── .gitignore / .gitkeep
├── assets/
│   └── video-placeholder.svg   # Grey SVG stand-in for patient video feed
├── css/
│   ├── base.css            # Design tokens, grid layout, base resets
│   └── components.css      # Cards, chips, toasts, sync rows, Rx editor, etc.
├── js/
│   ├── nav.js              # Entry point. Wires nav, role toggle, scenario toggle
│   ├── state.js            # Persistent app state + mutation helpers
│   ├── scenarios.js        # Five hardcoded patient scenarios (A–E) + identities
│   ├── dom.js              # DOMParser helpers: h(), mount(), clear(), text()
│   ├── interactions.js     # Red-flag toast, sparkline, transcript player
│   └── render.js           # Per-screen render functions (queue, summary, video, assess, sync)
└── screens/
    ├── queue.html          # Fragment: queue list + filter row
    ├── summary.html        # Fragment: patient summary cards
    ├── video.html          # Fragment: split-50 video stage + data rail + note
    ├── assessment.html     # Fragment: SOAP editor + Rx editor + referral
    └── sync.html           # Fragment: multi-destination sync progress
```

Total production source ≈ 40 KB (HTML + CSS + JS combined, uncompressed).

---

## 4. High-Level Architecture

```
┌────────────────────────────────────────────────────────┐
│  index.html (shell)                                    │
│  ┌───────────────────────────────────────────────────┐ │
│  │ <header>  TELEMED · identity chip · role select   │ │
│  └───────────────────────────────────────────────────┘ │
│  ┌────────────┐ ┌────────────────────────────────────┐ │
│  │ <aside>    │ │ <main id="main">                   │ │
│  │ nav-items  │ │   ← screen fragment injected here  │ │
│  │ scenario   │ │                                    │ │
│  └────────────┘ └────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
           ↑                        ↑
      nav.js click              render.js
           │                        │
           ▼                        ▼
   loadFragment(name) ── fetch('screens/<name>.html') ──► mount() into <main>
           │                        │
           ▼                        ▼
      setScreen(name)         renderScreen(name) ── reads state + scenario,
      refreshNav()                                   writes DOM, wires events
```

### Flow on any nav click

1. `nav.js::wireUp` attaches click handler on `.nav-item`.
2. Handler calls `loadFragment(screen)`:
   - `fetch('screens/<screen>.html')` → text → `mount(#main, html)`.
   - `setScreen(screen)` persists current screen to `localStorage`.
   - `refreshNav()` toggles `.active` / `.disabled` classes and the red-flag count chip.
   - `renderScreen(screen)` calls the matching `render*()` function.
3. The render function reads `activeScenario()` + `state` and fills in the DOM, then wires screen-specific event listeners.

### Flow on scenario change

`#scenario-toggle` change → `setScenario(id)` (clears red-flag ack + Rx edits) → `loadFragment('queue')` — always re-enters from the queue.

### Flow on role change

`#role-toggle` change → `setRole(role)` → `renderIdentityChip(role)` → `refreshNav()` → if nurse on a doctor-only screen, bounce to queue; else re-render current screen.

---

## 5. State Machine

All app state lives in a single plain object exported from `js/state.js` and serialized to `localStorage` under `telemed.state.v3`.

### Shape

```js
{
  scenarioId:          'A' | 'B' | 'C' | 'D' | 'E',  // active patient
  screen:              'queue'|'summary'|'video'|'assessment'|'sync',
  role:                'doctor' | 'nurse',
  redFlagAcknowledged: boolean,                      // suppresses re-showing the toast
  queueFilter:         'all' | 'waiting' | 'urgent' | 'labPending',
  showDone:            boolean,                      // include completed rows in queue
  notes:               { [hn: string]: string },     // consult note text per patient HN
  noteSavedAt:         { [hn: string]: string },     // ISO timestamp per HN
  doneIds:             string[],                     // scenario IDs marked completed
  lastSyncOutcome:     null | {
                         scenarioId, result: 'ok'|'partial'|'fail',
                         at: ISO, details: [{key, outcome}]
                       },                            // one-shot toast payload
  rxEditMode:          { [hn: string]: boolean },    // per-patient Rx edit flag
  rxEdits:             { [hn: string]: RxRow[] }     // per-patient edited Rx buffer
}
```

### Defaults on first load

```js
{ scenarioId: 'A', screen: 'queue', role: 'doctor',
  redFlagAcknowledged: false, queueFilter: 'all', showDone: false,
  notes: {}, noteSavedAt: {}, doneIds: ['D','E'],
  lastSyncOutcome: null, rxEditMode: {}, rxEdits: {} }
```

`doneIds` is seeded with `D` and `E` so those two scenarios appear pre-completed when you toggle "Show done" — this makes the queue look realistic without forcing the reviewer to walk through them first.

### Mutation API (all `save()` synchronously)

| Function | Purpose |
|----------|---------|
| `setScenario(id)` | Switch patient, reset `redFlagAcknowledged`, clear `rxEditMode` + `rxEdits` |
| `setScreen(name)` | Persist current screen |
| `setRole(role)` | Persist role |
| `setNote(hn, text)` | Save consult note + stamp `noteSavedAt[hn]` to now |
| `getNote(hn)` | Read saved note or '' |
| `getNoteSavedAt(hn)` | Read last-saved ISO or null |
| `markDone(id)` | Append scenario id to `doneIds` (idempotent) |
| `isDone(id)` | Membership check |
| `setQueueFilter(f)` / `setShowDone(v)` | Queue view prefs |
| `setLastSyncOutcome(o)` / `clearLastSyncOutcome()` | One-shot cross-screen toast payload |
| `setRxEditMode(hn, on)` | Toggle Rx editor for a patient |
| `setRxEdits(hn, rows)` | Overwrite edited Rx buffer |
| `clearRxEdits(hn)` | Drop edited buffer |
| `getRxRows(hn)` | Edited rows if present else the scenario's `rxPrefilled` |
| `activeScenario()` | Current scenario object |

---

## 6. Data Model — Scenarios

Five scenarios live in `js/scenarios.js`. Three are **interactive** (A, B, C — the Scenario dropdown options) and two (D, E) seed the "done" state.

### `identity`

```js
doctor: { name: 'Dr. Somchai N.', id: 'D-00123' }
nurse:  { name: 'Nurse Malee K.', id: 'N-00456' }
```

### Scenario object shape

```ts
{
  id:            'A'|'B'|'C'|'D'|'E',
  patient:       { name, hn, age, sex },
  queueSeq:      number,       // presentational only
  waitingMin:    number,       // "Waiting Nm" chip
  scheduledAt:   'HH:MM',      // used for sort + chip
  chiefComplaint:string,
  reasonShort:   string,       // one-line queue subtitle
  allergy:       Array<{ drug, reaction }>,
  vitals:        { bp, hr, rr, spo2, temp, takenAt: 'HH:MM' },
  labs:          Array<{ name, unit, values: number[], abnormal, arrow: '↑'|'↓'|'→', receivedAt: ISO }>,
  meds:          Array<{ name, dose, freq }>,
  redFlags:      Array<{ source: 'auto', label, threshold }>,
  aiRisk:        { score, label: 'low'|'high', recommendation },  // rendered? see §12
  transcript:    Array<{ spk: 'Dr'|'Pt', text, at: ms }>,
  soapDraft:     { s, o, a, p },
  rxPrefilled:   Array<{ drug, dose, freq, duration,
                         interaction: 'safe'|'caution', interactionNote?,
                         allergyCheck: 'safe' }>,
  referral:      { er: boolean, dept: string },
  labPending:    boolean,
  syncOutcome:   { his, pharmacy, lab, nhso, er }
                 // each slot: 'ok' | null | { result: 'fail', code, reason }
}
```

### Scenario matrix

| ID | Patient | Condition | Hook |
|----|---------|-----------|------|
| **A** | Somchai K., 58M, HN 00123 | Stable T2DM follow-up | Happy-path baseline. All sync → ok. |
| **B** | Malee P., 67F, HN 00456 | CHF + new chest pain → suspected ACS | Triggers 3 red flags (HR 128, SpO2 89, troponin ↑), forces ER referral, abnormal labs drive the red toast. |
| **C** | Anan R., 45M, HN 00789 | HTN check | `syncOutcome.pharmacy = { result:'fail', code:'ERR-503', reason:'pharmacy offline' }` — exercises the retry UI. `labPending: true`. |
| **D** | Prasit L., 52M | HTN follow-up (closed) | Pre-seeded in `doneIds`. Shown when "Show done" is toggled. |
| **E** | Nadia M., 34F | Migraine follow-up (closed) | Pre-seeded in `doneIds`. |

---

## 7. Screens

All five screens share the same shell (header + sidebar + `<main>`). The sidebar labels them `1 · Queue` … `5 · Sync` to imply the happy-path order, but any screen can be entered directly via nav.

### 7.1 Queue (`screens/queue.html`, `renderQueue`)

Elements:

- Title `#q-title` — `"Consult Queue · Morning OPD · DD MMM"` for doctor, `"Triage Queue · …"` for nurse. Date from `toLocaleDateString('en-GB', { day, month })`.
- Filter row `#q-filters` with chips `all | waiting | urgent | labPending` and a **Show done** checkbox (`#q-show-done`).
- List `#queue-list`.

Behavior:

1. Pulls all scenarios via `sortedScenarios()`:
   - Primary sort: red-flag first.
   - Secondary sort: ascending `scheduledAt` lexicographic (works because `HH:MM`).
2. Computes counts per filter, writes `(n)` into each chip.
3. Applies current filter and (optionally) hides `done` rows.
4. Splits into `liveRows` + `doneRows` so done rows always sit at the bottom when shown.
5. Marks the first live row with the "Recommended next ★" pill.
6. For each row emits: name + HN/age/sex, appointment chip, waiting chip (if waiting/ready), status pill, one-liner `reasonShort`, crit chips (allergy, abnormal labs, red flags, lab pending).
7. Non-done rows are clickable: `setScenario(id)` → simulates clicking the `Summary` nav item.
8. The row matching `state.scenarioId` gets a `2px solid var(--text)` outline to indicate selection.

Status derivation (`deriveStatus`):

| Condition | Status |
|-----------|--------|
| `state.screen ∈ {video, assessment}` AND this scenario is active | `in-consult` |
| `isDone(id)` | `done` |
| `vitals.takenAt` present | `ready` |
| else | `waiting` |

Status pill styles: default grey; `ready` green-outlined; `in-consult` solid dark with red dot prefix; `done` faded.

### 7.2 Summary (`screens/summary.html`, `renderSummary`)

Two-column grid of cards: Chief Complaint, Allergy. Below: Latest Vitals (with timestamp header), Abnormal Lab Trends (with shared-or-per-row timestamp), Current Meds, plus two collapsible mock sections (5-year history, admin metrics).

Vitals card renders chips for BP, HR, RR, SpO2, Temp. A chip is flagged if: `hr > 120 || hr < 50`, `spo2 < 92`, `temp > 38.5 || temp < 35.5`.

Labs card filters to `abnormal === true`. If all abnormal labs share a `receivedAt`, the timestamp is hoisted to the card head (via `tsPair`); otherwise each row gets its own timestamp pair.

Timestamp helpers (in `render.js`):
- `absTime(iso)` → `"HH:MM"` in local.
- `relTime(iso)` → `"just now" | "<m>m ago" | "<h>h ago" | "<d>d ago"`.
- `tsPair(iso)` → `"HH:MM · Nm ago"`.
- `buildIso('HH:MM')` → today's date at that time in local TZ.

Red-flag toast: if `scenario.redFlags.length`, `showRedFlagToast()` renders an acknowledgement dialog into `#toast-mount`. Clicking **Acknowledge** sets `state.redFlagAcknowledged = true` and removes the toast. The flag is per-scenario (reset on scenario change).

Sync outcome toast: if `state.lastSyncOutcome.scenarioId === state.scenarioId`, `showSyncToast(outcome)` renders a sticky `ok`/`partial`/`fail` toast in `#sum-toast-mount`, then clears the outcome (one-shot). Auto-dismiss after 5s; × button dismisses manually.

**Start Video** button is disabled for nurses (label: `"Consult pending — doctor review"`). For doctors, clicking it simulates nav click to `video`.

### 7.3 Video (`screens/video.html`, `renderVideo`)

Split-50 layout: left = video stage (SVG placeholder + self-view + LIVE indicator), right = scroll rail of data cards.

Right rail:
- **Red band** (`#vid-redband`) shown only if scenario has red flags; lists them as flag chips.
- **Vitals** — chips, same flagging rules as Summary.
- **Abnormal Labs** — chip per abnormal lab with latest value + arrow.
- **Meds · Allergy** — inline list.
- **Voice Transcript** — AI-simulated. `playTranscript()` schedules each line with `setTimeout` (based on `at` ms offset) and appends `<p><span class="spk">Dr:</span> text</p>` to `#vid-transcript`. `stopTranscript()` clears all pending timers.
- **Consult Note** card:
  - `<textarea id="note-text">` binds to `state.notes[hn]`.
  - On input: show `"Saving…"`, debounce 500ms, then persist via `setNote` and redraw the timestamp as `"Draft saved Ns ago"` / `"Draft saved Nm ago"`.
  - **Save draft** button flushes the debounce immediately.

Bottom actions:
- **End Call 📞❌** — stops transcript + nav back to queue.
- **Save & Continue →** — stops transcript + nav to assessment.

### 7.4 Assessment (`screens/assessment.html`, `renderAssessment`)

Top actions: **Save Draft** (marks scenario done + returns to queue) and **Save & Sync →** (marks done + goes to sync).

Cards:

1. **Consult note (from video call)** — shown only if `getNote(hn)` is non-empty. Read-only preview card with left accent stripe.
2. **AI-Generated SOAP (editable)** — four lines S/O/A/P. The `A` section is auto-augmented with a `--- from consult note ---` marker + the note body when a note exists (idempotent; only inserts if marker absent). A and P are textareas; S and O are read-only text.
   - `Regenerate` / `Accept` buttons are demo-only (`alert(...)`).
3. **Prescription** — view mode vs edit mode.
   - **View**: one line per row with safety chips `✓ safe` / `⚠️ interaction` / `✓ allergy-clear`.
   - **Edit**: rows become `<input>`s for drug/dose/freq/duration + `✕` remove button; `+ Add Drug` appends a blank row.
   - State: `rxEditMode[hn]` toggles mode; `rxEdits[hn]` holds the working buffer. Entering edit mode deep-clones `scenario.rxPrefilled` into the buffer so edits are non-destructive. Cancel drops the buffer. Save filters rows with a non-empty `drug` and persists.
4. **Referral**:
   - ER checkbox pre-bound to `scenario.referral.er`. Toggling shows/hides the red info banner (`#as-er-banner`).
   - Follow-up dept `<select>` pre-bound to `scenario.referral.dept`. Options: None, Cardiology, Endocrinology, Psychiatry, Internal Med, Surgery, OB-GYN, Pediatrics, Other.
5. Collapsible stubs: Long-form Note, ICD-10 Coding, Retrospective Trend Views.

### 7.5 Sync (`screens/sync.html`, `renderSync`)

Header: patient name, timestamp string (`YYYY-MM-DD HH:MM:SS GMT+7`), and `#sync-count-pill` showing `"N / M synced"` with color variant (`pill-ok` when all green, `pill-partial` when some).

Big status bar `#sync-bigbar`: starts as `"⏳ Syncing…"` (yellow). On completion:
- `ok` → `"✅ Sync Complete"` (green).
- `partial` → `"⚠️ Partial Sync Failure · N of M failed"` (yellow).
- `fail` → `"❌ All Systems Failed"` (red).

Destination list (built from scenario's `syncOutcome`):
1. HIS / EMR
2. Pharmacy System
3. Lab Order System
4. NHSO (30-baht)
5. ER System — *conditional*: only included when `syncOutcome.er` is non-null.

Each row starts as `"⏳ <label> … syncing…"`. A stepper (`setTimeout(450ms)` per row) paints each outcome:
- `ok` → green border, `"✅ <label> · synced HH:MM:SS"`.
- `fail` → red border, `"❌ <label> · <code> · <reason>"` + inline **Retry** button.

**Retry** on a failed row: sets row to `"retrying…"`, waits 1000ms, flips outcome to `ok` on the scenario object (mutation is local to the runtime; not persisted), updates pill, calls `finalize()`.

**🔁 Retry All Failed**: visible only on partial/fail. Disables itself, iterates pending fails, calls `retry(d)` every 1100ms, re-runs `finalize()` at the end.

`finalize()` also writes a one-shot `state.lastSyncOutcome` payload so the Summary screen can surface the result-toast on next visit.

**Back to Queue →**: nav click on queue.

---

## 8. Design System

### 8.1 Tokens (`css/base.css`)

```css
--bg:       #FFFFFF   /* surface 0 */
--surface:  #F5F5F5   /* surface 1 (main bg) */
--border:   #E0E0E0
--text:     #333333
--text-2:   #666666
--flag:     #D32F2F   /* red */
--ok:       #2E7D32   /* green */
--warn:     #F9A825   /* yellow */
--radius:   4px
--font:     system-ui, -apple-system, "Segoe UI", Roboto, sans-serif
--sidebar-w:220px
--header-h: 56px
```

`body { filter: grayscale(100%); }` forces grayscale regardless of token values — that way designers can keep semantic colors in the tokens but reviewers see a true wireframe.

### 8.2 Grid

```css
.app {
  display: grid;
  grid-template-columns: var(--sidebar-w) 1fr;
  grid-template-rows:    var(--header-h) 1fr;
  height: 100vh;
}
```

Header spans full width; sidebar and main share the second row.

### 8.3 Responsive

One breakpoint at `max-width: 1024px`:
- Grid collapses to a single column.
- Sidebar hidden by default, toggled open via `#hamburger` (top-left, shown only under breakpoint).
- Open sidebar becomes a fixed 260px-wide drawer below the header.

### 8.4 Components

| Class | Purpose |
|-------|---------|
| `.card` | Bordered panel with small uppercase heading |
| `.card-head` | Flex header with title + right-aligned timestamp |
| `.chip` / `.chip.flag` / `.chip.warn` / `.chip.ok` | Pill labels |
| `.queue-row` / `.queue-row.red` / `.queue-row.done` | List items, red = red-flag, done = faded |
| `.status-pill.*` | Waiting / Ready / In-consult / Done indicators |
| `.recommended-next` | Star-prefixed pill on the top live row |
| `.filter-chip` / `.filter-chip.active` / `.filter-chip .count` | Queue filter chips |
| `.crit-chips` | Wrapping chip row under each queue item |
| `.show-done-toggle` | Right-aligned checkbox control |
| `.toast` | Sticky toast container (red-flag variant) |
| `.toast-ok` / `.toast-partial` / `.toast-fail` | Sync outcome toast variants (left border color) |
| `.toast-row` / `.toast-body` / `.toast-close` | Toast internal layout |
| `.status-bar.syncing/ok/partial/fail` | Big status banner (sync screen) |
| `.count-pill` / `.pill-ok` / `.pill-partial` | Small N/M counter pill |
| `.split-50` | Two-column 50/50 layout, video-stage height-locked |
| `.video-stage` / `.video-stage .self` / `.video-stage .live` | Video placeholder composition |
| `.transcript` / `.transcript .spk` | Live transcript container + speaker label |
| `.sync-row` / `.sync-row.ok` / `.sync-row.fail` | Sync list rows |
| `.big-status.ok` / `.big-status.warn` | Pre-v2 variant retained for parity |
| `.note-card` / `.note-header` / `.note-timestamp` / `.note-timestamp.unsaved` / `.note-actions` | Consult-note card |
| `.note-ref-card` | Assessment screen's read-only note reference (left accent bar) |
| `.sparkline` | Monospace tiny-bar chart inline |
| `.identity-chip` | Non-interactive identity display in header |
| `.ts-pair` | Tabular-num timestamp label |
| `.rx-row` / `.rx-row .rx-del` / `.rx-actions` | Prescription editor row |

---

## 9. Role System

Two roles: `doctor` (default) and `nurse`, switched via `#role-toggle` in the header.

Behavior differences:

| Concern | Doctor | Nurse |
|---------|--------|-------|
| Identity chip | `👤 Dr. Somchai N. · ID D-00123` | `👤 Nurse Malee K. · ID N-00456` |
| Sidebar nav | All 5 screens enabled | `video`, `assessment`, `sync` disabled (`.disabled` class, click blocked) |
| Queue title prefix | `Consult Queue` | `Triage Queue` |
| Summary `Start Video` button | Enabled | Disabled, re-labelled `Consult pending — doctor review` |
| Auto-redirect | — | If role changes while on a doctor-only screen, bounces to queue |

Disabled nav items are visually (`opacity: 0.4`) and functionally (`pointer-events: none` at CSS level; guard check at JS level) inert.

---

## 10. Scenario System

The `#scenario-toggle` select holds three active scenarios: `A · Stable (Somchai)`, `B · Red-flag (Malee)`, `C · Sync fail (Anan)`. On change:

1. `setScenario(id)` — updates `state.scenarioId`, resets `redFlagAcknowledged`, clears Rx edit state.
2. `loadFragment('queue')` — always lands back on queue so the reviewer sees the new patient's card.

`activeScenario()` is the canonical accessor; every `render*` function starts with `const s = activeScenario();`.

The red-flag badge in the header (`#flag-count`) is refreshed via `refreshNav()` on every screen change. It's binary (`"🔴 1 red-flag"` or hidden) — it doesn't track multiple simultaneous red flags at this prototype level.

---

## 11. Interactions Module (`js/interactions.js`)

### `showRedFlagToast(flags, onAck?)`

Renders a `role="alertdialog"` toast into `#toast-mount` listing each red-flag label separated by `·`. No-ops if `redFlagAcknowledged` is already true. Clicking **Acknowledge** flips the flag, persists state, removes the toast, and calls `onAck` if provided.

### `sparkline(values)`

Unicode micro-chart using the 8-step block gradient `▁▂▃▄▅▆▇█`. Normalizes each value across `[min, max]` into a block index. Returns a plain string rendered inside a `.sparkline` span (monospace, tight letter-spacing).

### `playTranscript(lines)` / `stopTranscript()`

Simulates streaming captions. `lines` is `[{ spk, text, at }]`. Each entry is scheduled with `setTimeout(…, at)` to append a paragraph `<span class="spk">Dr: </span>text` into `#vid-transcript` and auto-scroll. The function keeps timer IDs in a module-level array so `stopTranscript()` can cancel cleanly when leaving the screen.

---

## 12. Render Module Details (`js/render.js`)

The module is ~580 lines, split into small helpers.

### Public exports

| Export | Purpose |
|--------|---------|
| `renderScreen(name)` | Dispatch table: `queue | summary | video | assessment | sync`. No-ops for unknown names. |
| `renderIdentityChip(role)` | Updates header identity chip from `identity[role]`. |
| `showSyncToast(outcome)` | Renders sync result toast into `#sum-toast-mount`. Auto-dismiss 5s, × dismissable. |

### Internal helpers

| Helper | Purpose |
|--------|---------|
| `deriveStatus(scenario)` | → `waiting | ready | in-consult | done` |
| `filterPasses(s, filter)` | Maps filter chip to predicate |
| `sortedScenarios()` | Stable sort: red-flag first, then `scheduledAt` asc |
| `critChips(s)` | Allergy + abnormal-lab + red-flag + lab-pending chip group |
| `queueTitle()` | Role-aware title with today's short date |
| `todayShort()` | `DD MMM` via `toLocaleDateString('en-GB')` |
| `absTime(iso)` | HH:MM in local TZ |
| `relTime(iso)` | Coarse ago-string |
| `tsPair(iso)` | `HH:MM · Nm ago` |
| `buildIso('HH:MM')` | Today's date at HH:MM (local) → ISO |
| `formatSavedAgo(iso)` | `Draft saved Ns ago` / `Nm ago` / `No note yet` |

### AI Risk note

`scenario.aiRisk` is present on every scenario but **intentionally not rendered** in the current DOM. The field is retained in the data layer so a future "AI assistance" panel can be wired up without touching scenarios. Remove from `scenarios.js` if you decide this is dead data.

---

## 13. DOM Module (`js/dom.js`)

Four helpers, all built on `DOMParser` to avoid `innerHTML` churn:

```js
h(htmlString)        // → DocumentFragment. Parses via DOMParser, harvests <body>'s children.
mount(el, html)      // → el.replaceChildren(h(html))
clear(el)            // → el.replaceChildren()
text(el, value)      // → el.textContent = value
```

`mount()` is used for every screen-fragment injection. Because data is hardcoded in scenarios and the parser still permits scripts within the injected HTML, you should keep all dynamic user input *away* from these helpers in production. For this wireframe it's safe.

---

## 14. Navigation Module (`js/nav.js`)

Ordered screen list: `['queue','summary','video','assessment','sync']`.
Nurse-disabled set: `{'video','assessment','sync'}`.

### `loadFragment(name)`

1. `fetch('screens/<name>.html')` → text.
2. `mount(#main, html)`.
3. `setScreen(name)` (persist).
4. `refreshNav()`.
5. `renderScreen(name)` — populates the freshly-mounted fragment.

### `refreshNav()`

For each `.nav-item`:
- `.active` = matches current screen.
- `.disabled` = nurse role + nurse-disabled set.

Updates `#flag-count` chip from `activeScenario().redFlags.length`.

### `wireUp()` (fires on `DOMContentLoaded`)

- Attaches click handlers for every nav item.
- Binds scenario dropdown → `setScenario` + return-to-queue.
- Binds role dropdown → `setRole` + refresh + re-render (with nurse bounce).
- Binds hamburger → sidebar `.open` toggle (mobile breakpoint only).
- Initial render: `renderIdentityChip(state.role)` → `loadFragment(state.screen || 'queue')`.

---

## 15. Persistence & Reload Behavior

- State blob is JSON-serialized on every mutation (synchronous write).
- Key: `telemed.state.v3`. Prior versions (`v1`, `v2`) would have to be cleared manually — schema changes bump the key.
- A reload rehydrates the last screen, scenario, role, notes, Rx edits, sync toast payload, etc. — the entire session is durable.
- Clearing `localStorage` or opening an incognito window returns to defaults (scenario A, queue, doctor).

---

## 16. Accessibility Notes

- Landmark tags: `<header>`, `<aside>`, `<main>`.
- Buttons are real `<button>` elements; nav items are `<a>` with no `href` (pointer-style).
- Red-flag toast: `role="alertdialog"`.
- Sync outcome toast: `role="status" aria-live="polite"`.
- Header hamburger carries `aria-label="Menu"`.
- Identity chip is marked `aria-readonly="true"`.
- Every form input has a visible label or `aria-label` (search button, toast close, Rx remove).
- Color-dependent state (red borders, red chips) is always paired with an icon/label so the grayscale filter doesn't strip meaning.
- Focus order follows DOM order; no custom tabindex manipulation.

Gaps to close before production: focus trap inside modal toast, explicit ESC-to-dismiss, reduced-motion handling for the transcript simulation, keyboard activation for `.queue-row` (currently pointer-only).

---

## 17. Known Limitations / TODO

- No build pipeline → no minification, no source maps.
- Sync "retries" mutate the scenario object in memory but are not persisted to `localStorage`; a reload replays the original failure.
- `aiRisk` field is dead data (not rendered).
- Transcript is fire-and-forget — re-entering video replays the whole schedule from t=0.
- No tests. Behavior is verified by clicking through.
- No routing — deep links into a specific screen rely on the persisted `state.screen`, not the URL.
- No i18n; all strings are inline English + emoji.
- The `queueSeq` field on scenarios is unused by the current renderer.

---

## 18. Local Development

No toolchain required.

```bash
# Serve locally (any static server works):
python3 -m http.server 8000
# → http://localhost:8000/

# Or simply double-click index.html (browser must allow file:// fetch for screen fragments;
# some browsers block this — use a local server if fragments fail to load).
```

Hot-reload: none. Refresh the page.

Deployment: push `master` (or `main`) to GitHub; GitHub Pages serves the repo root as a static site.

---

## 19. File-by-File API Surface

### `index.html`
Shell only. Mounts `js/nav.js` as a module. Declares header, aside (nav items + scenario select), and empty `<main>`.

### `js/nav.js`
```
SCREENS                  const string[]
NURSE_DISABLED           Set<string>
loadFragment(name)       async → void (fetches + mounts + re-renders)
refreshNav()             void (updates active/disabled + red-flag chip)
wireUp()                 void (DOMContentLoaded handler)
```

### `js/state.js`
```
state                    object (mutable reference; re-exported)
save()                   persist to localStorage
setScenario(id)          + reset red-flag ack, rxEditMode, rxEdits
setScreen(name) / setRole(role)
activeScenario() → Scenario
setNote(hn, text) / getNote(hn) / getNoteSavedAt(hn)
markDone(id) / isDone(id)
setQueueFilter(f) / setShowDone(v)
setLastSyncOutcome(o) / clearLastSyncOutcome()
setRxEditMode(hn, on) / setRxEdits(hn, rows) / clearRxEdits(hn) / getRxRows(hn)
```

### `js/scenarios.js`
```
identity    { doctor, nurse }
scenarios   { A, B, C, D, E }  // full shape in §6
```

### `js/dom.js`
```
h(html)         → DocumentFragment
mount(el, html) → void
clear(el)       → void
text(el, value) → void
```

### `js/interactions.js`
```
showRedFlagToast(flags, onAck?)
sparkline(values) → string
playTranscript(lines) / stopTranscript()
```

### `js/render.js`
```
renderScreen(name)
renderIdentityChip(role)
showSyncToast(outcome)
-- private --
renderQueue / renderSummary / renderVideo / renderAssessment / renderSync
deriveStatus / filterPasses / sortedScenarios / critChips / queueTitle / todayShort
absTime / relTime / tsPair / buildIso / formatSavedAgo
```

---

## 20. Versioning

| Version key | Schema |
|-------------|--------|
| `telemed.state.v3` *(current)* | Adds `rxEditMode`, `rxEdits`, `lastSyncOutcome`, `noteSavedAt` |
| `telemed.state.v2` *(historical)* | Notes + doneIds + queueFilter |
| `telemed.state.v1` *(historical)* | Scenario + screen + role only |

Bump the key whenever you add/rename/remove a top-level field so prior sessions don't rehydrate incompatibly.

---

## 21. Glossary

| Term | Meaning |
|------|---------|
| HN | Hospital number (patient identifier) |
| OPD | Out-patient department |
| SOAP | Subjective / Objective / Assessment / Plan (clinical note format) |
| HIS / EMR | Hospital information system / electronic medical record |
| NHSO | National Health Security Office (Thailand's "30-baht" universal coverage) |
| ACS | Acute coronary syndrome |
| CHF | Congestive heart failure |
| PRN | *pro re nata* — as needed |
| SL | Sublingual |
| BID / OD | Twice daily / once daily |
| T2DM / HTN | Type-2 diabetes / hypertension |

---

*End of TECHNICAL.md*
