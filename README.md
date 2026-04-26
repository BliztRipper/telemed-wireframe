# Telemed Wireframe

Interactive grayscale wireframe for a 5-screen telemedicine clinical flow (queue → summary → video → assessment → sync).

**Live demo:** https://bliztripper.github.io/telemed-wireframe/

---

## Run locally

No build step. Any static server works.

```bash
python3 -m http.server 8765
# → http://localhost:8765/
```

Or open `index.html` directly (some browsers block `file://` fetch — use a server if fragments fail to load).

---

## Demo deliverables

Final-prototype submission docs live in [`docs/`](./docs/):

| Doc | Purpose |
|-----|---------|
| [`PROJECT_CHARTER.md`](./docs/PROJECT_CHARTER.md) | Problem, target user, design goals, core flow, rubric mapping |
| [`DESIGN_SYSTEM.md`](./docs/DESIGN_SYSTEM.md) | Mini design system: tokens, typography, components catalog (**Deliverable A**) |
| [`ACCESSIBILITY_CHECKLIST.md`](./docs/ACCESSIBILITY_CHECKLIST.md) | AA-oriented self-audit, 10 categories with evidence (**Deliverable B**) |
| [`DESIGN_DEBT_LOG.md`](./docs/DESIGN_DEBT_LOG.md) | Before/after iteration log, 8 resolved + 8 next-iteration (**Deliverable C**) |
| [`PRESENTATION_NARRATIVE.md`](./docs/PRESENTATION_NARRATIVE.md) | 8-min pitch script with timing budget |
| [`PRESENTATION.html`](./docs/PRESENTATION.html) | Single-file slide deck for demo day |

Architecture / API surface: [`TECHNICAL.md`](./TECHNICAL.md).

---

## Demo scenarios

Switch via header dropdown:

| Scenario | Demonstrates |
|----------|--------------|
| **A · Stable (Somchai K., T2DM)** | Happy path — all 4 sync slots green |
| **B · Red-flag (Malee P., suspected ACS)** | 3 red flags → modal toast → ER referral pre-checked |
| **C · Sync-fail (Anan R., HTN)** | Pharmacy ERR-503 → Retry / Retry-All → cross-screen toast on Summary |

---

## Roles

Switch via header role select:

- **Doctor** — full 5-screen access.
- **Nurse** — Queue + Summary only; doctor-only screens disabled in nav with auto-bounce on switch.
