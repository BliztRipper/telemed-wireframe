# Telemed Clinical Console — Project Charter

> **Live demo:** https://bliztripper.github.io/telemed-wireframe/
> **Tech ref:** [`../TECHNICAL.md`](../TECHNICAL.md)
> **Status:** v3 production release (Apr 27, 2026) — launch-ready clinical UI built on the original wireframe shell.

---

## 1. Problem Statement

Thai public-hospital OPD doctors run telemedicine consults inside fragmented tooling: video, EMR, lab viewer, e-prescribing, NHSO claim, and ER referral all live in separate screens. During a 7–10 minute consult the doctor has to:

1. Read patient summary while greeting the patient.
2. Watch vitals/labs for red flags.
3. Type a SOAP note while still listening.
4. Write a prescription with allergy + interaction checks.
5. Decide on referral / follow-up.
6. Push the result into 4–5 downstream systems.

Switching tools breaks attention. A 30-second sync failure (e.g., pharmacy offline) is invisible until the patient has already left. Errors caught downstream become rework that lands on the next nurse on duty.

### Pain Points

| Pain | Where it shows up | Cost |
|------|-------------------|------|
| Context loss between video + EMR | Doctor scrolls/copies during call | Longer consult, missed cues |
| Red flags discovered late | After SOAP is half-written | Re-triage, re-route |
| Hidden sync failures | Pharmacy/NHSO error returns minutes later | Patient already discharged |
| Role-blindness | Same UI for nurse triage + doctor consult | Nurses click into doctor-only flows, get confused |
| No audit trail of "what got synced when" | After-the-fact debugging | Manual phone follow-up |

---

## 2. Target User

**Primary — Dr. Somchai (consulting physician).** OPD doctor running 30+ telemed consults per shift. Needs everything for a single patient on one surface, and obvious confirmation that the chart, Rx, and claim actually landed.

**Secondary — Nurse Malee (triage / pre-consult).** Reviews queue, captures vitals, flags red cases. Does **not** prescribe or sign off. Needs a read-only-ish view that prevents her from accidentally entering doctor flows.

**Out of scope:** patient-facing app, billing clerks, pharmacist UI.

---

## 3. Design Goals

| # | Goal | Measured by |
|---|------|-------------|
| G1 | One screen per phase of the consult | 5 screens, no modals stacking |
| G2 | Red flags are unmissable | 100% of red-flag cases trigger an `alertdialog` toast on summary |
| G3 | Sync outcomes are visible at the moment they happen and on next-screen | Count pill + big bar + cross-screen toast |
| G4 | Role separation is obvious and enforced | Nurse-disabled nav greyed + click-blocked + auto-bounce |
| G5 | State survives reload | Full session in `localStorage` key `telemed.state.v3` |
| G6 | Production visual system: calm clinical palette + accessible typography | Cyan-600 primary, emerald-600 accent, Figtree/Noto Sans, 28-glyph SVG icon sprite |

---

## 4. Core User Flow

```
   ┌─────────┐    ┌─────────┐    ┌────────┐    ┌────────────┐    ┌──────┐
   │ 1.Queue ├───▶│2.Summary├───▶│3.Video ├───▶│4.Assessment├───▶│5.Sync│
   └─────────┘    └─────────┘    └────────┘    └────────────┘    └──────┘
        ▲              │              │               │              │
        │              ▼              │               │              │
        │        Red-flag toast       │               │              │
        │        (alertdialog)        │               │              │
        │                             ▼               ▼              ▼
        │                       Auto-saved       Rx edit /      Retry / Retry-all
        │                       transcript       cancel /       on failed rows
        │                       + draft note     save                │
        │                                                            ▼
        └──────────────────── Sync-outcome toast on Summary ◀────────┘
                              (one-shot, scenario-scoped)
```

| Step | Start point | Main action | Decision point | Completion point |
|------|-------------|-------------|----------------|------------------|
| 1 | Queue list (sorted red-flag first) | Pick patient row | Row red? Lab pending? | Row outline = active scenario |
| 2 | Summary cards | Read vitals/labs/meds | Red flag → must acknowledge before continuing | "Start Video" enabled (doctor only) |
| 3 | Video stage + data rail | Run consult, type note (autosave 500ms) | Red band visible? | "Save & Continue →" or "End Call" |
| 4 | SOAP + Rx + Referral | Edit Rx, set referral | ER yes/no, interaction warnings | "Save & Sync →" |
| 5 | Sync progress (per system) | Watch each row complete | Any row failed? Retry one or Retry-All | All-OK → toast on Summary; Partial → fix path |

**Flow integrity:**
- Complete: 5 screens, every screen reachable from any other via sidebar.
- No dead-ends: every error state has a Retry button or Acknowledge action.
- No broken logic: scenarios A/B/C exercise happy-path / red-flag / sync-fail respectively, all proven clickable end-to-end.

### Scenario coverage

| Scenario | Demonstrates |
|----------|--------------|
| **A · Stable (Somchai K., T2DM)** | Happy path — all 4 sync slots green |
| **B · Red-flag (Malee P., suspected ACS)** | 3 red flags → toast → ER referral pre-checked |
| **C · Sync-fail (Anan R., HTN)** | Pharmacy ERR-503 → Retry / Retry-All → cross-screen toast |
| **D, E** | Pre-seeded "done" rows for queue realism |

---

## 5. Why This Solution Works

1. **One artifact per consult phase.** No tab-switching, no modal-stacking. Each screen owns its decision.
2. **Information density tuned per surface.** Summary = scan; Video = listen + side-rail; Assessment = compose; Sync = audit.
3. **State is durable.** Reload mid-consult does not lose the note, the Rx edits, or the queue position.
4. **Errors are recoverable.** Every failure has an inline action (Acknowledge, Retry, Retry-All), never a dead-end.
5. **Role boundaries are visible at the chrome level.** Nurses literally cannot reach doctor-only screens — disabled in nav, auto-bounce on role switch.
6. **Visual system carries clinical credibility.** Calm cyan + health green palette with Figtree/Noto Sans + JetBrains Mono signals "enterprise medical software", not demoware. SVG icon sprite renders identically across every platform; color is never the sole carrier of meaning (every state pairs with icon + text).

---

## 6. Success Criteria (for this prototype)

- ✅ All five screens hi-fi, consistent type/spacing/component reuse.
- ✅ Loading state (sync row "⏳ … syncing"), empty state ("No note yet"), error states (ERR-503 row, red-flag toast).
- ✅ AA-oriented accessibility self-audit (see [`ACCESSIBILITY_CHECKLIST.md`](./ACCESSIBILITY_CHECKLIST.md)).
- ✅ Clickable main flow on all three interactive scenarios.
- ✅ Mini design system documented (see [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md)).
- ✅ Iteration evidence — at least 6 design-debt items resolved (see [`DESIGN_DEBT_LOG.md`](./DESIGN_DEBT_LOG.md)).
- ✅ Presentation narrative ready (see [`PRESENTATION_NARRATIVE.md`](./PRESENTATION_NARRATIVE.md)).

---

## 7. Out of Scope

Real backend, real video stream, real EHR/NHSO integration, real auth, i18n, PWA, mobile native, billing UI, patient-side app. All "AI" outputs are pre-canned per scenario.

---

## 8. Stack & Constraints

Vanilla HTML + CSS custom properties + ES modules. **No build step.** Single-file `localStorage` persistence (`telemed.state.v3`). Static-hosted on GitHub Pages. Total source ~40 KB uncompressed. Full architecture in [`../TECHNICAL.md`](../TECHNICAL.md).

---

## 9. Team & Roles

| Role | Responsibility |
|------|----------------|
| Design lead | Flow + screens + design tokens |
| Frontend | DOM helpers, render pipeline, state machine |
| QA / review | Click-through verification per scenario, a11y self-audit |

---

## 10. Acceptance Checklist (rubric mapping)

| Rubric § | Requirement | Where it lives |
|----------|-------------|----------------|
| 1 | Problem-Solution alignment | §1–§5 of this charter |
| 2 | Core user flow | §4 of this charter |
| 3 | Hi-fi UI | All 5 screen partials, [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) |
| 4 | UI states (loading, empty, error) | Sync rows, "No note yet", ERR-503, red-flag toast |
| 5 | Accessibility (AA-oriented) | [`ACCESSIBILITY_CHECKLIST.md`](./ACCESSIBILITY_CHECKLIST.md) |
| 6 | Clickable interactive | `js/nav.js` + `js/render.js`, all scenarios |
| 7 | Visual consistency | Single token file, single component file |
| 8 | Mini design system | [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) |
| 9 | Design debt resolution | [`DESIGN_DEBT_LOG.md`](./DESIGN_DEBT_LOG.md) |
| 10 | Final story | [`PRESENTATION_NARRATIVE.md`](./PRESENTATION_NARRATIVE.md) |

---

*End of PROJECT_CHARTER.md*
