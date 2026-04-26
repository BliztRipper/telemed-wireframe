# Final Story — Presentation Narrative

> 6–8 minute pitch script for the final demo.
> Order: **Problem → User → Insight → Solution → Flow → Demo → Why it works → Key learnings.**
> Companion docs: [`PROJECT_CHARTER.md`](./PROJECT_CHARTER.md), [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md), [`ACCESSIBILITY_CHECKLIST.md`](./ACCESSIBILITY_CHECKLIST.md), [`DESIGN_DEBT_LOG.md`](./DESIGN_DEBT_LOG.md).

---

## Slide / beat 1 — Problem (45s)

> "Thai public-hospital telemed consults run on five disconnected tools. In a 7-minute consult a doctor jumps between video, EMR, lab viewer, e-prescribing, and the NHSO claim system. That tool-switching is where mistakes are born — red flags get missed, prescriptions go out before the allergy check, and sync failures to the pharmacy or NHSO surface minutes after the patient has already left."

**Show:** static slide listing the 5 disconnected systems on the left, "1 patient, 7 minutes" on the right.

---

## Slide 2 — User (30s)

> "Two people use this. **Dr. Somchai** is the consulting physician — 30 patients a shift, telemed-first. **Nurse Malee** triages and pre-records vitals but does not prescribe. Same software, very different jobs. Today they share the same UI and that's where role-confusion errors happen."

**Show:** the two identity chips side-by-side from the prototype header.

---

## Slide 3 — Insight (30s)

> "We don't need to build a new EMR. We need to give the doctor **one screen per phase of the consult**, and we need to make every cross-system handoff — every red flag, every Rx change, every NHSO push — **visible at the moment it happens**, and **still visible on the next screen** if the doctor moves on."

**Anchor line:** *Every error has an inline action. No dead-ends.*

---

## Slide 4 — Solution (45s)

> "Five screens, one consult. Queue → Summary → Video → Assessment → Sync. State persists across reload. Roles are enforced in the chrome. The visual system is a calm clinical palette — cyan-600 primary, emerald-600 accent, slate neutrals — with Figtree + Noto Sans typography and a 28-icon Lucide-stroked SVG sprite. Every state pairs color with an icon and a text label, so meaning never lives in color alone."

**Show:** the sidebar nav `1 · Queue` … `5 · Sync`, then a vital-card with an alert state (HR 128 in danger soft) next to a calm card (BP 128/80 default) — demonstrating how hierarchy is carried by typography, color, AND iconography simultaneously.

---

## Slide 5 — Flow (30s)

> "Start point — Queue, sorted red-flag-first. Main action — pick patient, run the consult. Decision points — red-flag acknowledgement, ER referral, Rx safety review. Completion point — Sync, with explicit per-system outcomes. The flow is fully clickable across three patient scenarios."

**Show:** the flow diagram from `PROJECT_CHARTER.md` §4.

---

## Slide 6 — Demo (3 minutes)

Run scenarios in this order. Each takes ~60s.

### Scenario A — Stable patient (happy path)
1. Queue → click "Somchai K. · Stable T2DM".
2. Summary → vitals chips, lab trends, "Start Video".
3. Video → click "Save & Continue →" (skip transcript playback for time).
4. Assessment → Save & Sync →.
5. Sync → all four rows go green, count pill 4/4, big bar "✅ Sync Complete".
6. Click "Back to Queue →" — Summary toast briefly visible if you nav through.

> **Talking point:** "This is the boring case, and it should look boring."

### Scenario B — Red-flag (suspected ACS)
1. Switch scenario to **B · Red-flag (Malee)**.
2. Queue — note the red row sorted to the top, "Recommended next ★" pill.
3. Summary — **modal red-flag toast** appears immediately. Three flags listed.
4. Click **Acknowledge** — toast clears, ER banner stays in Assessment.
5. Walk through Assessment — ER checkbox already on, follow-up dept = Cardiology.
6. Sync proceeds normally; ER System row is included this time (conditional).

> **Talking point:** "Red flags are unmissable, but they're also acknowledgeable — we're not the boy who cried wolf."

### Scenario C — Sync failure (the demo's centerpiece)
1. Switch scenario to **C · Sync fail (Anan)**.
2. Skip to Sync screen via sidebar.
3. Watch rows step in: HIS ✅, **Pharmacy ❌ ERR-503 · pharmacy offline**, Lab ✅, NHSO ✅.
4. Big bar flips to "⚠️ Partial Sync Failure · 1 of 4 failed". Count pill 3/4.
5. Click **🔁 Retry All Failed**. Pharmacy row goes "retrying…" → green. Bar flips to "✅ Sync Complete".
6. Sidebar → Summary. **Sync-success toast** appears (one-shot, scenario-scoped) listing all four systems with the timestamp.

> **Talking point:** "The reason this works: the failure had a code, the recovery had a button, and the next screen confirmed it landed. That whole loop is the deliverable."

---

## Slide 7 — Why it works (45s)

Three points, no more.

1. **One screen per phase.** Information density tuned per surface — Summary scans, Video listens, Assessment composes, Sync audits.
2. **No dead-ends.** Every error state has an inline action: Acknowledge / Retry / Retry-All / Cancel-edit. The user is never stranded.
3. **Honest about what isn't there yet.** Eight known a11y / motion gaps are tracked in [`DESIGN_DEBT_LOG.md`](./DESIGN_DEBT_LOG.md), not hidden. The prototype is AA-oriented; full certification is a production milestone.

---

## Slide 8 — Key learnings (45s)

1. **Hierarchy first, then production palette.** We started in grayscale to force flow + density review, then swapped to the production cyan + emerald system once the hierarchy held up. Tokens stayed put; only the values changed. Same component contracts, launch-ready visual.
2. **State persistence is a UX feature, not a backend feature.** Once we put the entire session in `localStorage`, mid-consult reload stopped breaking the demo, and the prototype suddenly felt real.
3. **A field that doesn't earn its pixel cost should be deleted, not faked.** The AI Risk score got cut from the render the moment we couldn't say what action it drove. Data model kept it for the future; UI stopped lying.
4. **Sync visibility is the most important micro-feature in this entire app.** Count pill + big bar + cross-screen toast is the single thing operators ask about. We got that loop right last and it changed the whole pitch.

---

## Slide 9 — Deliverables index (10s)

| Deliverable | Where |
|-------------|-------|
| A · Design system snapshot | [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) |
| B · Accessibility checklist | [`ACCESSIBILITY_CHECKLIST.md`](./ACCESSIBILITY_CHECKLIST.md) |
| C · Design debt log (before → after) | [`DESIGN_DEBT_LOG.md`](./DESIGN_DEBT_LOG.md) |
| Project charter | [`PROJECT_CHARTER.md`](./PROJECT_CHARTER.md) |
| Technical spec | [`../TECHNICAL.md`](../TECHNICAL.md) |
| Live prototype | https://bliztripper.github.io/telemed-wireframe/ |

---

## Q&A prep — anticipated questions

**"Why did the early version look grayscale?"**
First-pass review used a `body { filter: grayscale(100%) }` lock so every conversation was about hierarchy and information density, not "I don't like that blue". Once the layout held up under that constraint, we removed the lock and applied the production cyan + emerald palette. The token system was already in place — only the values lit up.

**"How does this become real?"**
The state machine, scenario data shape, and component contracts in [`../TECHNICAL.md`](../TECHNICAL.md) are the production spec. Swap `localStorage` for a real API client; swap mock scenarios for real EMR queries; rebuild the same components in the production framework. The flow is the deliverable, not the JS.

**"Why no tests?"**
Prototype scope. Behavior is verified by walking the three scenarios end-to-end. Production milestone adds Playwright + axe.

**"Is the AI real?"**
No — the SOAP draft and transcript are pre-canned per scenario. The data shape is honest about which fields a real LLM would populate.

**"What about offline?"**
Out of scope. State is durable across reload, but no service worker, no PWA, no offline queue. Listed as a future milestone.

---

## Timing budget (8 min)

| Beat | Time |
|------|------|
| Problem | 0:45 |
| User | 0:30 |
| Insight | 0:30 |
| Solution | 0:45 |
| Flow | 0:30 |
| Demo (3 scenarios) | 3:00 |
| Why it works | 0:45 |
| Key learnings | 0:45 |
| Deliverables index | 0:10 |
| Buffer / Q&A handoff | 0:20 |
| **Total** | **8:00** |

---

*End of PRESENTATION_NARRATIVE.md*
