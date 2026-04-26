# Telemed Clinical Console

Production-grade telemedicine console for **Doctors and Nurses** running an OPD telehealth flow. Five-screen workflow: Queue → Summary → Video → Assess & Plan → Record & Sync.

**Live demo:** https://bliztripper.github.io/telemed-wireframe/

---

## Status

Originally shipped as a grayscale wireframe (Apr 2026). Re-skinned to a **launch-ready clinical UI** on `master` — calm cyan + health green palette, Figtree/Noto Sans typography, full SVG icon system, WCAG AA+ focus states, mobile-first responsive layout.

No build step. No runtime dependencies. Vanilla HTML + CSS + ES modules.

---

## Run locally

Any static server works.

```bash
cd telemed-wireframe
python3 -m http.server 8770
# → http://localhost:8770/
```

Opening `index.html` directly via `file://` will fail because of `fetch()` for screen partials — use a server.

---

## Project structure

```
telemed-wireframe/
├─ index.html              SPA shell + inline SVG icon sprite
├─ css/
│  ├─ base.css             Design tokens, typography, app shell, reset
│  └─ components.css       Components, responsive rules, print
├─ js/
│  ├─ nav.js               Routing, screen mount, role-aware nav
│  ├─ render.js            All five renderers
│  ├─ state.js             localStorage state machine (key: telemed.state.v3)
│  ├─ scenarios.js         Hardcoded patient data (A–E)
│  ├─ interactions.js      Toasts, sparkline, transcript player
│  └─ dom.js               Safe DOMParser-based mount/clear helpers
├─ screens/
│  ├─ queue.html           Patient queue + filters
│  ├─ summary.html         Vitals, labs, allergy, meds, sync toast
│  ├─ video.html           Video stage + clinical side rail
│  ├─ assessment.html      SOAP editor, Rx editor, referral
│  └─ sync.html            HIS / Pharmacy / Lab / NHSO sync stepper
└─ assets/
   └─ video-placeholder.svg
```

---

## Demo deliverables

Submission docs live in [`docs/`](./docs/):

| Doc | Purpose |
|-----|---------|
| [`PROJECT_CHARTER.md`](./docs/PROJECT_CHARTER.md) | Problem, target user, design goals, core flow, rubric mapping |
| [`DESIGN_SYSTEM.md`](./docs/DESIGN_SYSTEM.md) | Tokens, typography, components catalog (**Deliverable A**) |
| [`ACCESSIBILITY_CHECKLIST.md`](./docs/ACCESSIBILITY_CHECKLIST.md) | AA-oriented self-audit, 10 categories with evidence (**Deliverable B**) |
| [`DESIGN_DEBT_LOG.md`](./docs/DESIGN_DEBT_LOG.md) | Before/after iteration log, includes v3 production redesign (**Deliverable C**) |
| [`PRESENTATION_NARRATIVE.md`](./docs/PRESENTATION_NARRATIVE.md) | 8-min pitch script with timing budget |
| [`PRESENTATION.html`](./docs/PRESENTATION.html) | Single-file slide deck for demo day |

Architecture / API surface: [`TECHNICAL.md`](./TECHNICAL.md).

---

## Demo scenarios

Switch via sidebar **Demo scenario** dropdown:

| Scenario | Demonstrates |
|----------|--------------|
| **A · Stable (Somchai K., T2DM)** | Happy path — all 4 sync slots green |
| **B · Red-flag (Malee P., suspected ACS)** | 3 red flags → modal alertdialog → ER referral pre-checked, alert vital cards, lab sparklines |
| **C · Sync-fail (Anan R., HTN)** | Pharmacy `ERR-503` → per-row Retry / Retry-All → cross-screen toast on Summary |

---

## Roles

Switch via header role select:

- **Doctor** — full 5-screen access.
- **Nurse** — Queue + Summary only; doctor-only screens disabled in nav with auto-bounce on switch. Identity chip avatar + name update accordingly.

---

## Design system summary

- **Primary** `#0891B2` cyan-600 · **Accent** `#059669` emerald-600 · **Danger** `#DC2626` · **Warn** `#D97706` · **Surface** `#FFFFFF` on `#F8FAFC` slate-50 app bg.
- **Type** Figtree (display + body) · Noto Sans (fallback) · JetBrains Mono (lab values, IDs).
- **Iconography** 28-symbol Lucide-stroked SVG sprite embedded in `index.html` (`<svg><use href="#i-..."/></svg>`). Zero emoji as structural icons.
- **Spacing** 4pt scale (`--sp-1` … `--sp-12`). **Radius** xs/sm/md/lg/xl/pill.
- **Motion** 120/180/240ms tokens, `prefers-reduced-motion` respected globally.
- **A11y** 3px focus rings (`--ring`), semantic landmarks, `aria-live` toasts, keyboard-activated queue rows, 16px base body type.

Full reference: [`docs/DESIGN_SYSTEM.md`](./docs/DESIGN_SYSTEM.md).
