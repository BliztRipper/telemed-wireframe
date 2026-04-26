import { scenarios, identity } from './scenarios.js';
import { state, activeScenario, setScenario, setQueueFilter, setShowDone, isDone, markDone, getNote, setNote, getNoteSavedAt, setLastSyncOutcome, clearLastSyncOutcome, setRxEditMode, setRxEdits, clearRxEdits, getRxRows } from './state.js';
import { mount } from './dom.js';
import { showRedFlagToast, sparkline, playTranscript, stopTranscript } from './interactions.js';

const ICON = (id, cls = 'icon') =>
  `<svg class="${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`;

let noteSaveTimer = null;
function formatSavedAgo(iso) {
  if (!iso) return 'No note yet';
  const secs = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (secs < 60) return `Draft saved ${secs}s ago`;
  const mins = Math.round(secs / 60);
  return `Draft saved ${mins}m ago`;
}

export function renderScreen(name) {
  const fns = { queue: renderQueue, summary: renderSummary, video: renderVideo, assessment: renderAssessment, sync: renderSync };
  (fns[name] || (() => {}))();
}

export function renderIdentityChip(role) {
  const who = identity[role];
  const chip = document.getElementById('identity-chip');
  if (!chip || !who) return;
  const nameEl = chip.querySelector('.identity-name');
  const idEl   = chip.querySelector('.identity-id');
  const avatar = chip.querySelector('.identity-avatar');
  nameEl.textContent = who.name;
  idEl.textContent   = `ID ${who.id}`;
  if (avatar) {
    const initials = who.name
      .split(/\s+/)
      .map(w => w.replace(/[^A-Za-z]/g, '')[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
    avatar.textContent = initials || (role === 'nurse' ? 'NS' : 'DR');
  }
}

function absTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}
function relTime(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}
function tsPair(iso) { return iso ? `${absTime(iso)} · ${relTime(iso)}` : ''; }
function buildIso(hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(); d.setHours(h, m, 0, 0);
  return d.toISOString();
}

export function showSyncToast(outcome) {
  const mountEl = document.getElementById('sum-toast-mount');
  if (!mountEl || !outcome) return;
  const tone = outcome.result;
  const titles = { ok: 'Synced', partial: 'Partial Sync', fail: 'Sync Failed' };
  const iconIds = { ok: 'check', partial: 'alert-triangle', fail: 'x' };
  const systems = outcome.details
    .filter(d => d.outcome && d.outcome !== 'fail')
    .map(d => d.key.toUpperCase()).join(' · ');
  const at = absTime(outcome.at);

  mount(mountEl, `
    <div class="toast toast-${tone}" role="status" aria-live="polite">
      <div class="toast-row">
        <span class="toast-icon">${ICON(iconIds[tone] || 'check')}</span>
        <strong>${titles[tone] || 'Sync'}</strong>
        <button class="toast-close" aria-label="Dismiss">×</button>
      </div>
      <div class="toast-body">${[systems, at].filter(Boolean).join(' · ')}</div>
    </div>
  `);

  const toast = mountEl.querySelector('.toast');
  const close = mountEl.querySelector('.toast-close');
  const dismiss = () => toast && toast.remove();
  close && close.addEventListener('click', dismiss);
  setTimeout(() => { if (toast && mountEl.contains(toast)) dismiss(); }, 5000);
}

function deriveStatus(s) {
  if ((state.screen === 'video' || state.screen === 'assessment') && state.scenarioId === s.id) return 'in-consult';
  if (isDone(s.id)) return 'done';
  if (s.vitals && s.vitals.takenAt) return 'ready';
  return 'waiting';
}

const STATUS_LABEL = { waiting: 'Waiting', ready: 'Ready', 'in-consult': 'In consult', done: 'Done' };

function todayShort() {
  return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function queueTitle() {
  const prefix = state.role === 'nurse' ? 'Triage Queue' : 'Consult Queue';
  return `${prefix} · Morning OPD · ${todayShort()}`;
}

function filterPasses(s, filter) {
  const status = deriveStatus(s);
  if (filter === 'all') return true;
  if (filter === 'waiting') return status === 'waiting' || status === 'ready';
  if (filter === 'urgent') return s.redFlags.length > 0;
  if (filter === 'labPending') return !!s.labPending;
  return true;
}

function sortedScenarios() {
  const entries = Object.values(scenarios);
  entries.sort((a, b) => {
    const urgA = a.redFlags.length > 0 ? 0 : 1;
    const urgB = b.redFlags.length > 0 ? 0 : 1;
    if (urgA !== urgB) return urgA - urgB;
    return a.scheduledAt.localeCompare(b.scheduledAt);
  });
  return entries;
}

function critChips(s) {
  const chips = [];
  if (s.allergy.length) {
    chips.push(`<span class="chip flag">${ICON('ban', 'icon icon-sm')} Allergy: ${s.allergy[0].drug}</span>`);
  }
  const abn = s.labs.filter(l => l.abnormal);
  if (abn.length) {
    const trendIcon = abn[0].arrow === '↑' ? 'trend-up' : 'trend-down';
    const label = abn.length === 1
      ? abn[0].name
      : `${abn[0].name} ×${abn.length}`;
    chips.push(`<span class="chip flag">${ICON(trendIcon, 'icon icon-sm')} ${label}</span>`);
  }
  s.redFlags.forEach(f => chips.push(
    `<span class="chip flag">${ICON('alert-octagon', 'icon icon-sm')} ${f.label}</span>`));
  if (s.labPending) {
    chips.push(`<span class="chip warn">${ICON('flask', 'icon icon-sm')} Lab pending</span>`);
  }
  return chips.join('');
}

function renderQueue() {
  const titleEl = document.getElementById('q-title');
  if (!titleEl) return;
  titleEl.textContent = queueTitle();

  const list = document.getElementById('queue-list');
  const filter = state.queueFilter;
  const all = sortedScenarios();

  const countBase = state.showDone ? all : all.filter(s => deriveStatus(s) !== 'done');
  const counts = {
    all: countBase.length,
    waiting: countBase.filter(s => filterPasses(s, 'waiting')).length,
    urgent: countBase.filter(s => filterPasses(s, 'urgent')).length,
    labPending: countBase.filter(s => filterPasses(s, 'labPending')).length
  };
  document.querySelectorAll('#q-filters .filter-chip').forEach(chip => {
    const key = chip.dataset.filter;
    chip.classList.toggle('active', key === filter);
    const c = chip.querySelector('.count');
    c.textContent = key === 'all' ? `(${counts.all})` : `(${counts[key]})`;
    chip.onclick = () => { setQueueFilter(key); renderQueue(); };
  });
  const showDoneBox = document.getElementById('q-show-done');
  showDoneBox.checked = state.showDone;
  showDoneBox.onchange = () => { setShowDone(showDoneBox.checked); renderQueue(); };

  let visible = all.filter(s => filterPasses(s, filter));
  if (!state.showDone) visible = visible.filter(s => deriveStatus(s) !== 'done');
  const doneRows = state.showDone ? visible.filter(s => deriveStatus(s) === 'done') : [];
  const liveRows = visible.filter(s => deriveStatus(s) !== 'done');
  const ordered = [...liveRows, ...doneRows];

  const recId = liveRows[0] ? liveRows[0].id : null;

  const rows = ordered.map(s => {
    const p = s.patient;
    const status = deriveStatus(s);
    const red = s.redFlags.length > 0;
    const isRec = s.id === recId;
    const waitingChip = (status === 'waiting' || status === 'ready')
      ? `<span class="chip">${ICON('clock', 'icon icon-sm')} ${s.waitingMin}m</span>` : '';
    return `
      <article class="queue-row ${red ? 'red' : ''} ${status}" data-scenario="${s.id}" tabindex="0" role="button" aria-label="${p.name}, ${s.reasonShort}">
        <div class="row space wrap">
          <div>
            <div class="pt-name">${p.name}${isRec ? '<span class="recommended-next">Recommended next</span>' : ''}</div>
            <div class="pt-meta">
              <span>HN ${p.hn}</span>
              <span>·</span>
              <span>${p.age}${p.sex}</span>
            </div>
          </div>
          <div class="row wrap" style="gap:6px">
            <span class="chip">${ICON('clock', 'icon icon-sm')} Appt ${s.scheduledAt}</span>
            ${waitingChip}
            <span class="status-pill ${status}">${STATUS_LABEL[status]}</span>
          </div>
        </div>
        <div class="pt-reason">${s.reasonShort}</div>
        <div class="crit-chips">${critChips(s)}</div>
      </article>
    `;
  }).join('');

  mount(list, rows || `<div class="card"><p class="muted" style="text-align:center;padding:var(--sp-4) 0">No patients match this filter.</p></div>`);

  list.querySelectorAll('.queue-row:not(.done)').forEach(el => {
    const open = () => {
      setScenario(el.dataset.scenario);
      document.querySelector('[data-screen="summary"]').click();
    };
    el.addEventListener('click', open);
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });

  list.querySelectorAll('.queue-row.active-row').forEach(el => el.classList.remove('active-row'));
  const activeRow = list.querySelector(`[data-scenario="${state.scenarioId}"]`);
  if (activeRow) activeRow.classList.add('active-row');
}

function vitalCell(label, value, unit, alert) {
  return `
    <div class="vital ${alert ? 'alert' : ''}">
      <span class="vital-label">${label}</span>
      <span class="vital-value">${value}${unit ? `<span class="vital-unit">${unit}</span>` : ''}</span>
    </div>
  `;
}

function renderSummary() {
  const s = activeScenario();
  if (!document.getElementById('sum-identity')) return;
  const p = s.patient;
  document.getElementById('sum-identity').textContent = p.name;
  const meta = document.getElementById('sum-meta');
  if (meta) meta.textContent = `HN ${p.hn} · ${p.age}${p.sex} · ${s.reasonShort}`;
  document.getElementById('sum-cc').textContent = `"${s.chiefComplaint}"`;

  const allergyHost = document.getElementById('sum-allergy');
  mount(allergyHost, s.allergy.length
    ? s.allergy.map(a => `<span class="allergy-item">${ICON('ban', 'icon icon-sm')} ${a.drug} <span class="muted" style="font-size:var(--fs-xs)">(${a.reaction})</span></span>`).join('')
    : '<div class="allergy-empty">No known allergies</div>');

  const v = s.vitals;
  const vitalCells = [
    ['BP', v.bp, '', false],
    ['HR', v.hr, 'bpm', v.hr > 120 || v.hr < 50],
    ['RR', v.rr, '/min', false],
    ['SpO₂', v.spo2, '%', v.spo2 < 92],
    ['Temp', v.temp, '°C', v.temp > 38.5 || v.temp < 35.5]
  ].map(([k, val, unit, bad]) => vitalCell(k, val, unit, bad)).join('');
  const vitalsTsEl = document.getElementById('sum-vitals-ts');
  if (vitalsTsEl) vitalsTsEl.textContent = tsPair(buildIso(v.takenAt));
  mount(document.getElementById('sum-vitals'), vitalCells);

  const abnormal = s.labs.filter(l => l.abnormal);
  const labsTsEl = document.getElementById('sum-labs-ts');
  const allSame = abnormal.length > 0 && abnormal.every(l => l.receivedAt === abnormal[0].receivedAt);
  if (labsTsEl) labsTsEl.textContent = allSame ? tsPair(abnormal[0].receivedAt) : '';
  mount(document.getElementById('sum-labs'), abnormal.length
    ? abnormal.map(l => {
        const dirCls = l.arrow === '↑' ? 'up' : (l.arrow === '↓' ? 'down' : 'flat');
        const perRow = allSame ? '' : `<span class="lab-ts">${tsPair(l.receivedAt)}</span>`;
        return `<div class="lab-row ${dirCls}">
          <span class="lab-name">${l.name}</span>
          <span class="lab-values">${l.values.join(' → ')}</span>
          <span class="lab-unit">${l.unit}</span>
          <span class="lab-arrow">${l.arrow}</span>
          <span class="sparkline">${sparkline(l.values)}</span>
          ${perRow}
        </div>`;
      }).join('')
    : '<div class="muted" style="font-size:var(--fs-sm)">No abnormal trends.</div>');

  mount(document.getElementById('sum-meds'), s.meds.map(m =>
    `<li>${ICON('pill')} <span class="med-name">${m.name}</span> <span class="med-dose">${m.dose} · ${m.freq}</span></li>`
  ).join(''));

  if (state.lastSyncOutcome && state.lastSyncOutcome.scenarioId === state.scenarioId) {
    showSyncToast(state.lastSyncOutcome);
    clearLastSyncOutcome();
  }

  if (s.redFlags.length) showRedFlagToast(s.redFlags);

  const videoBtn = document.getElementById('btn-start-video');
  if (state.role === 'nurse') {
    videoBtn.disabled = true;
    mount(videoBtn, `${ICON('clock')} <span>Consult pending — doctor review</span>`);
  } else {
    videoBtn.addEventListener('click', () => {
      document.querySelector('[data-screen="video"]').click();
    });
  }
}

function renderVideo() {
  const s = activeScenario();
  if (!document.getElementById('vid-identity')) return;
  const p = s.patient;
  document.getElementById('vid-identity').textContent = `${p.name} · HN ${p.hn} · ${p.age}${p.sex}`;

  const img = document.getElementById('vid-patient-img');
  if (img) {
    const portrait = ['A', 'B', 'C'].includes(s.id) ? `assets/patient-${s.id}.svg` : 'assets/video-placeholder.svg';
    img.src = portrait;
    img.alt = `Video feed of ${p.name}, ${p.age}${p.sex}`;
  }

  const selfImg = document.getElementById('vid-self-img');
  const selfLabel = document.getElementById('vid-self-label');
  if (selfImg && selfLabel) {
    const isNurse = state.role === 'nurse';
    selfImg.src = isNurse ? 'assets/nurse.svg' : 'assets/doctor.svg';
    selfImg.alt = isNurse ? 'Self view: Nurse' : 'Self view: Doctor';
    selfLabel.textContent = isNurse ? 'Nurse · self-view' : 'Dr · self-view';
  }

  if (s.redFlags.length) {
    document.getElementById('vid-redband').style.display = '';
    mount(document.getElementById('vid-flags'),
      s.redFlags.map(f => `<span class="chip flag">${ICON('alert-octagon', 'icon icon-sm')} ${f.label}</span>`).join(''));
  }

  const v = s.vitals;
  mount(document.getElementById('vid-vitals'), `
    <span class="chip">BP ${v.bp}</span>
    <span class="chip ${v.hr>120?'flag':''}">HR ${v.hr}</span>
    <span class="chip">RR ${v.rr}</span>
    <span class="chip ${v.spo2<92?'flag':''}">SpO₂ ${v.spo2}%</span>
    <span class="chip">Temp ${v.temp}°C</span>
  `);

  const abnormal = s.labs.filter(l => l.abnormal);
  mount(document.getElementById('vid-labs'), abnormal.length
    ? abnormal.map(l => `<span class="chip flag">${ICON(l.arrow === '↑' ? 'trend-up' : 'trend-down', 'icon icon-sm')} ${l.name} ${l.values.at(-1)}</span>`).join('')
    : '<span class="muted" style="font-size:var(--fs-sm)">None</span>');

  mount(document.getElementById('vid-meds'), `
    <div class="row wrap" style="gap:6px;margin-bottom:6px">${s.meds.map(m => `<span class="chip">${ICON('pill','icon icon-sm')} ${m.name} ${m.dose}</span>`).join('')}</div>
    <div class="row wrap" style="gap:6px">
      <span class="muted" style="font-size:var(--fs-sm)">Allergy:</span>
      ${s.allergy.length ? s.allergy.map(a => `<span class="chip flag">${ICON('ban','icon icon-sm')} ${a.drug}</span>`).join('') : '<span class="muted" style="font-size:var(--fs-sm)">none</span>'}
    </div>
  `);

  playTranscript(s.transcript);

  document.getElementById('btn-end-call').addEventListener('click', () => {
    stopTranscript();
    document.querySelector('[data-screen="queue"]').click();
  });
  document.getElementById('btn-save-cont').addEventListener('click', () => {
    stopTranscript();
    document.querySelector('[data-screen="assessment"]').click();
  });

  const noteEl = document.getElementById('note-text');
  const tsEl = document.getElementById('note-ts');
  const saveBtn = document.getElementById('btn-save-note');
  if (noteEl && tsEl && saveBtn) {
    const hn = s.patient.hn;
    noteEl.value = getNote(hn);
    tsEl.textContent = formatSavedAgo(getNoteSavedAt(hn));

    const flush = () => {
      setNote(hn, noteEl.value);
      tsEl.classList.remove('unsaved');
      tsEl.textContent = formatSavedAgo(getNoteSavedAt(hn));
    };

    noteEl.addEventListener('input', () => {
      tsEl.classList.add('unsaved');
      tsEl.textContent = 'Saving…';
      clearTimeout(noteSaveTimer);
      noteSaveTimer = setTimeout(flush, 500);
    });

    saveBtn.addEventListener('click', () => {
      clearTimeout(noteSaveTimer);
      flush();
    });
  }
}

function renderAssessment() {
  const s = activeScenario();
  if (!document.getElementById('as-name')) return;
  document.getElementById('as-name').textContent = `${s.patient.name} · HN ${s.patient.hn}`;

  const d = s.soapDraft;
  const note = getNote(s.patient.hn);
  const refCard = document.getElementById('as-note-ref');
  const refBody = document.getElementById('as-note-body');
  if (note && refCard && refBody) {
    refCard.style.display = '';
    refBody.textContent = note;
  } else if (refCard) {
    refCard.style.display = 'none';
  }

  const MARKER = '--- from consult note ---';
  let soapA = d.a;
  if (note && !soapA.includes(MARKER)) {
    soapA = `${soapA}\n\n${MARKER}\n${note}`;
  }

  mount(document.getElementById('as-soap'), `
    <div class="soap-row"><span class="soap-key">S</span><p>${d.s}</p></div>
    <div class="soap-row"><span class="soap-key">O</span><p>${d.o}</p></div>
    <div class="soap-row"><span class="soap-key">A</span><textarea>${soapA}</textarea></div>
    <div class="soap-row"><span class="soap-key">P</span><textarea>${d.p}</textarea></div>
  `);

  const hn = s.patient.hn;
  const editing = !!state.rxEditMode[hn];
  const rxRows = getRxRows(hn);

  const btnEdit   = document.getElementById('btn-rx-edit');
  const btnSave   = document.getElementById('btn-rx-save');
  const btnCancel = document.getElementById('btn-rx-cancel');
  const btnAdd    = document.getElementById('btn-add-drug');

  btnEdit.style.display   = editing ? 'none' : '';
  btnSave.style.display   = editing ? '' : 'none';
  btnCancel.style.display = editing ? '' : 'none';
  btnAdd.style.display    = editing ? '' : 'none';

  const rxHost = document.getElementById('as-rx');
  if (editing) {
    mount(rxHost, rxRows.map((r, i) => `
      <div class="rx-row" data-idx="${i}">
        <input data-k="drug"     value="${r.drug || ''}"     placeholder="Drug" />
        <input data-k="dose"     value="${r.dose || ''}"     placeholder="Dose" />
        <input data-k="freq"     value="${r.freq || ''}"     placeholder="Freq" />
        <input data-k="duration" value="${r.duration || ''}" placeholder="Duration" />
        <button class="rx-del" aria-label="Remove drug">${ICON('x')}</button>
      </div>
    `).join(''));
  } else {
    mount(rxHost, rxRows.length ? rxRows.map(r => {
      const tags = [];
      if (r.interaction === 'caution') tags.push(`<span class="chip flag">${ICON('alert-triangle','icon icon-sm')} interaction</span>`);
      else if (r.interaction) tags.push(`<span class="chip ok">${ICON('check','icon icon-sm')} safe</span>`);
      if (r.allergyCheck === 'safe') tags.push(`<span class="chip ok">${ICON('shield','icon icon-sm')} allergy-clear</span>`);
      return `<div class="rx-static">
        ${ICON('pill')}
        <span class="rx-name">${r.drug}</span>
        <span class="rx-detail">${[r.dose, r.freq, r.duration].filter(Boolean).join(' · ')}</span>
        <span class="row" style="gap:4px;margin-left:auto">${tags.join('')}</span>
      </div>`;
    }).join('') : '<div class="muted" style="font-size:var(--fs-sm)">No prescriptions.</div>');
  }

  btnEdit.onclick = () => {
    setRxEdits(hn, JSON.parse(JSON.stringify(s.rxPrefilled || [])));
    setRxEditMode(hn, true);
    renderAssessment();
  };
  btnCancel.onclick = () => {
    clearRxEdits(hn);
    setRxEditMode(hn, false);
    renderAssessment();
  };
  btnSave.onclick = () => {
    const rows = [...rxHost.querySelectorAll('.rx-row')].map(row => {
      const out = {};
      row.querySelectorAll('input').forEach(inp => { out[inp.dataset.k] = inp.value.trim(); });
      return out;
    }).filter(r => r.drug);
    setRxEdits(hn, rows);
    setRxEditMode(hn, false);
    renderAssessment();
  };
  btnAdd.onclick = () => {
    const rows = [...(state.rxEdits[hn] || []), { drug: '', dose: '', freq: '', duration: '' }];
    setRxEdits(hn, rows);
    renderAssessment();
  };
  rxHost.querySelectorAll('.rx-del').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.closest('.rx-row').dataset.idx);
      const rows = (state.rxEdits[hn] || []).filter((_, i) => i !== idx);
      setRxEdits(hn, rows);
      renderAssessment();
    });
  });

  const erBox = document.getElementById('as-er');
  erBox.checked = s.referral.er;
  document.getElementById('as-er-banner').style.display = s.referral.er ? '' : 'none';
  erBox.addEventListener('change', () => {
    document.getElementById('as-er-banner').style.display = erBox.checked ? '' : 'none';
  });
  document.getElementById('as-dept').value = s.referral.dept || 'None';

  document.getElementById('btn-regen').addEventListener('click', () => alert('[demo] AI regenerating draft...'));
  document.getElementById('btn-accept').addEventListener('click', () => alert('[demo] SOAP accepted'));
  document.getElementById('btn-draft').addEventListener('click', () => {
    markDone(s.id);
    alert('Draft saved');
    document.querySelector('[data-screen="queue"]').click();
  });
  document.getElementById('btn-save-sync').addEventListener('click', () => {
    markDone(s.id);
    document.querySelector('[data-screen="sync"]').click();
  });
}

function renderSync() {
  const s = activeScenario();
  if (!document.getElementById('sync-list')) return;
  document.getElementById('sync-name').textContent = `${s.patient.name} · HN ${s.patient.hn}`;
  document.getElementById('sync-ts').textContent = `Started ${new Date().toISOString().replace('T', ' ').slice(0, 19)} GMT+7`;

  const dests = [
    { key: 'his',      label: 'HIS / EMR' },
    { key: 'pharmacy', label: 'Pharmacy System' },
    { key: 'lab',      label: 'Lab Order System' },
    { key: 'nhso',     label: 'NHSO (30-baht)' }
  ];
  if (normalize(s.syncOutcome.er).result) dests.push({ key: 'er', label: 'ER System' });

  const list = document.getElementById('sync-list');
  mount(list, dests.map(d => `
    <div class="sync-row syncing" id="sync-${d.key}">
      <span class="sync-icon">${ICON('refresh','icon icon-sm')}</span>
      <span class="sync-label">${d.label}</span>
      <span class="sync-meta">syncing…</span>
    </div>
  `).join(''));

  updatePill(dests);

  let idx = 0;
  function step() {
    if (idx >= dests.length) return finalize();
    const d = dests[idx];
    const row = document.getElementById(`sync-${d.key}`);
    setTimeout(() => {
      if (!row || !document.body.contains(row)) return;
      const n = normalize(s.syncOutcome[d.key]);
      paintRow(row, d, n);
      updatePill(dests);
      idx++; step();
    }, 450);
  }

  function paintRow(row, d, n) {
    row.classList.remove('ok', 'fail', 'syncing');
    if (n.result === 'ok') {
      row.classList.add('ok');
      mount(row, `
        <span class="sync-icon">${ICON('check','icon icon-sm')}</span>
        <span class="sync-label">${d.label}</span>
        <span class="sync-meta">synced ${new Date().toTimeString().slice(0,8)}</span>
      `);
    } else if (n.result === 'fail') {
      row.classList.add('fail');
      const meta = [n.code, n.reason].filter(Boolean).join(' · ') || 'FAILED';
      mount(row, `
        <span class="sync-icon">${ICON('x','icon icon-sm')}</span>
        <span class="sync-label">${d.label}</span>
        <span class="sync-meta">${meta} <button class="retry">${ICON('refresh','icon icon-sm')} Retry</button></span>
      `);
      row.querySelector('.retry').addEventListener('click', () => retry(d));
    }
  }

  function retry(d) {
    const row = document.getElementById(`sync-${d.key}`);
    if (!row) return;
    row.classList.remove('fail', 'ok');
    row.classList.add('syncing');
    mount(row, `
      <span class="sync-icon">${ICON('refresh','icon icon-sm')}</span>
      <span class="sync-label">${d.label}</span>
      <span class="sync-meta">retrying…</span>
    `);
    setTimeout(() => {
      if (!document.body.contains(row)) return;
      row.classList.remove('syncing'); row.classList.add('ok');
      mount(row, `
        <span class="sync-icon">${ICON('check','icon icon-sm')}</span>
        <span class="sync-label">${d.label}</span>
        <span class="sync-meta">synced ${new Date().toTimeString().slice(0,8)}</span>
      `);
      s.syncOutcome[d.key] = 'ok';
      updatePill(dests);
      finalize();
    }, 1000);
  }

  function finalize() {
    const results = dests.map(d => ({ key: d.key, outcome: normalize(s.syncOutcome[d.key]).result }));
    const fails = results.filter(r => r.outcome === 'fail').length;
    const bar = document.getElementById('sync-bigbar');
    const retryAll = document.getElementById('btn-retry-all');
    bar.classList.remove('syncing', 'ok', 'partial', 'fail');
    if (fails === 0) {
      bar.classList.add('ok');
      mount(bar, `${ICON('check-circle')} <span>Sync Complete</span>`);
      retryAll.style.display = 'none';
    } else if (fails < dests.length) {
      bar.classList.add('partial');
      mount(bar, `${ICON('alert-triangle')} <span>Partial Sync Failure · ${fails} of ${dests.length} failed</span>`);
      retryAll.style.display = '';
    } else {
      bar.classList.add('fail');
      mount(bar, `${ICON('x-circle')} <span>All Systems Failed</span>`);
      retryAll.style.display = '';
    }
    const result = fails === 0 ? 'ok' : (fails < dests.length ? 'partial' : 'fail');
    setLastSyncOutcome({ scenarioId: s.id, result, at: new Date().toISOString(), details: results });
  }

  function updatePill(ds) {
    const okCount = ds.filter(d => normalize(s.syncOutcome[d.key]).result === 'ok').length;
    const pill = document.getElementById('sync-count-pill');
    pill.textContent = `${okCount} / ${ds.length} synced`;
    pill.classList.remove('pill-ok', 'pill-partial');
    if (okCount === ds.length) pill.classList.add('pill-ok');
    else if (okCount > 0) pill.classList.add('pill-partial');
  }

  function normalize(v) {
    if (!v) return { result: null };
    if (typeof v === 'string') return { result: v };
    return { result: v.result, code: v.code, reason: v.reason };
  }

  document.getElementById('btn-retry-all').onclick = () => {
    const pending = dests.filter(d => normalize(s.syncOutcome[d.key]).result === 'fail');
    document.getElementById('btn-retry-all').disabled = true;
    let i = 0;
    function next() {
      if (i >= pending.length) {
        document.getElementById('btn-retry-all').disabled = false;
        return finalize();
      }
      retry(pending[i++]);
      setTimeout(next, 1100);
    }
    next();
  };

  step();

  document.getElementById('btn-back').addEventListener('click', () => {
    document.querySelector('[data-screen="queue"]').click();
  });
}
