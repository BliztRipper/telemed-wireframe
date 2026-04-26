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
