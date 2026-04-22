import { scenarios, identity } from './scenarios.js';
import { state, activeScenario, setScenario, setQueueFilter, setShowDone, isDone, markDone, getNote, setNote, getNoteSavedAt, setLastSyncOutcome, clearLastSyncOutcome, setRxEditMode, setRxEdits, clearRxEdits, getRxRows } from './state.js';
import { mount } from './dom.js';
import { showRedFlagToast, sparkline, playTranscript, stopTranscript } from './interactions.js';

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
  nameEl.textContent = `👤 ${who.name}`;
  idEl.textContent   = `ID ${who.id}`;
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
  const mount = document.getElementById('sum-toast-mount');
  if (!mount || !outcome) return;
  const tone = outcome.result;
  const titles = { ok: 'Synced', partial: 'Partial Sync', fail: 'Sync Failed' };
  const icons  = { ok: '✅',    partial: '⚠️',           fail: '❌' };
  const systems = outcome.details
    .filter(d => d.outcome && d.outcome !== 'fail')
    .map(d => d.key.toUpperCase()).join(' · ');
  const at = absTime(outcome.at);

  const toast = document.createElement('div');
  toast.className = `toast toast-${tone}`;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');

  const row = document.createElement('div'); row.className = 'toast-row';
  const iconEl = document.createElement('span'); iconEl.className = 'toast-icon'; iconEl.textContent = icons[tone] || '';
  const titleEl = document.createElement('strong'); titleEl.textContent = titles[tone] || 'Sync';
  const close = document.createElement('button'); close.className = 'toast-close'; close.setAttribute('aria-label', 'Dismiss'); close.textContent = '×';
  row.append(iconEl, titleEl, close);

  const body = document.createElement('div'); body.className = 'toast-body';
  body.textContent = [systems, at].filter(Boolean).join(' · ');

  toast.append(row, body);
  mount.replaceChildren(toast);

  const dismiss = () => toast.remove();
  close.addEventListener('click', dismiss);
  setTimeout(() => { if (mount.contains(toast)) dismiss(); }, 5000);
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
  if (s.allergy.length) chips.push(`<span class="chip flag">🚫 Allergy: ${s.allergy[0].drug}</span>`);
  const abn = s.labs.filter(l => l.abnormal);
  if (abn.length) {
    const label = abn.length === 1
      ? `${abn[0].name}${abn[0].arrow}`
      : `${abn[0].name}${abn[0].arrow} ×${abn.length}`;
    chips.push(`<span class="chip flag">⚠️ Abnormal: ${label}</span>`);
  }
  s.redFlags.forEach(f => chips.push(`<span class="chip flag">🔴 ${f.label}</span>`));
  if (s.labPending) chips.push(`<span class="chip warn">🧪 Lab pending</span>`);
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
      ? `<span class="chip">⏳ Waiting ${s.waitingMin}m</span>` : '';
    return `
      <div class="queue-row ${red ? 'red' : ''} ${status}" data-scenario="${s.id}">
        <div class="row space">
          <div>
            <strong>${p.name}</strong>
            <span style="color:var(--text-2)">  HN ${p.hn}  ${p.age}${p.sex}</span>
            ${isRec ? '<span class="recommended-next">Recommended next</span>' : ''}
          </div>
          <div>
            <span class="chip">⏱ Appt ${s.scheduledAt}</span>
            ${waitingChip}
            <span class="status-pill ${status}">${STATUS_LABEL[status]}</span>
          </div>
        </div>
        <div style="color:var(--text-2);margin:4px 0">${s.reasonShort}</div>
        <div class="crit-chips">${critChips(s)}</div>
      </div>
    `;
  }).join('');

  mount(list, rows || '<p style="color:var(--text-2);padding:16px">No patients match this filter.</p>');

  list.querySelectorAll('.queue-row:not(.done)').forEach(el => {
    el.addEventListener('click', () => {
      setScenario(el.dataset.scenario);
      document.querySelector('[data-screen="summary"]').click();
    });
  });

  const activeRow = list.querySelector(`[data-scenario="${state.scenarioId}"]`);
  if (activeRow) activeRow.style.outline = '2px solid var(--text)';
}

function renderSummary() {
  const s = activeScenario();
  if (!document.getElementById('sum-identity')) return;
  const p = s.patient;
  document.getElementById('sum-identity').textContent = `${p.name} · HN ${p.hn} · ${p.age}${p.sex}`;
  document.getElementById('sum-cc').textContent = `"${s.chiefComplaint}"`;

  const allergyHost = document.getElementById('sum-allergy');
  mount(allergyHost, s.allergy.length
    ? s.allergy.map(a => `<div>🚫 ${a.drug} (${a.reaction})</div>`).join('')
    : '<span style="color:var(--text-2)">No known allergies</span>');

  const v = s.vitals;
  const vitalHtml = [
    ['BP', v.bp, false],
    ['HR', v.hr, v.hr > 120 || v.hr < 50],
    ['RR', v.rr, false],
    ['SpO2', v.spo2 + '%', v.spo2 < 92],
    ['Temp', v.temp, v.temp > 38.5 || v.temp < 35.5]
  ].map(([k, val, bad]) => `<span class="chip ${bad ? 'flag' : ''}">${k} ${val}${bad ? ' 🔴' : ''}</span>`).join(' ');
  // vitals header timestamp (absolute + relative)
  const vitalsTsEl = document.getElementById('sum-vitals-ts');
  if (vitalsTsEl) vitalsTsEl.textContent = tsPair(buildIso(v.takenAt));
  mount(document.getElementById('sum-vitals'), vitalHtml);

  // labs: shared header when all receivedAt equal, per-row otherwise
  const abnormal = s.labs.filter(l => l.abnormal);
  const labsTsEl = document.getElementById('sum-labs-ts');
  const allSame = abnormal.length > 0 && abnormal.every(l => l.receivedAt === abnormal[0].receivedAt);
  if (labsTsEl) labsTsEl.textContent = allSame ? tsPair(abnormal[0].receivedAt) : '';
  mount(document.getElementById('sum-labs'), abnormal.length
    ? abnormal.map(l => {
        const perRow = allSame ? '' : ` <span class="ts-pair">${tsPair(l.receivedAt)}</span>`;
        return `<div>${l.name}: ${l.values.join(' → ')} ${l.unit} ${l.arrow} <span class="sparkline">${sparkline(l.values)}</span>${perRow}</div>`;
      }).join('')
    : '<span style="color:var(--text-2)">No abnormal trends.</span>');

  mount(document.getElementById('sum-meds'), s.meds.map(m => `<li>${m.name} ${m.dose} ${m.freq}</li>`).join(''));

  // consume one-shot sync outcome toast
  if (state.lastSyncOutcome && state.lastSyncOutcome.scenarioId === state.scenarioId) {
    showSyncToast(state.lastSyncOutcome);
    clearLastSyncOutcome();
  }

  if (s.redFlags.length) showRedFlagToast(s.redFlags);

  const videoBtn = document.getElementById('btn-start-video');
  if (state.role === 'nurse') {
    videoBtn.disabled = true;
    videoBtn.textContent = 'Consult pending — doctor review';
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
  document.getElementById('vid-identity').textContent = `Video Consult · ${p.name} · HN ${p.hn} · ${p.age}${p.sex}`;

  if (s.redFlags.length) {
    document.getElementById('vid-redband').style.display = 'block';
    mount(document.getElementById('vid-flags'),
      s.redFlags.map(f => `<span class="chip flag">${f.label}</span>`).join(' '));
  }

  const v = s.vitals;
  mount(document.getElementById('vid-vitals'), `
    <span class="chip">BP ${v.bp}</span>
    <span class="chip ${v.hr>120?'flag':''}">HR ${v.hr}</span>
    <span class="chip">RR ${v.rr}</span>
    <span class="chip ${v.spo2<92?'flag':''}">SpO2 ${v.spo2}%</span>
    <span class="chip">Temp ${v.temp}</span>
  `);

  const abnormal = s.labs.filter(l => l.abnormal);
  mount(document.getElementById('vid-labs'), abnormal.length
    ? abnormal.map(l => `<span class="chip flag">${l.name} ${l.values.at(-1)} ${l.arrow}</span>`).join(' ')
    : '<span style="color:var(--text-2)">None</span>');

  mount(document.getElementById('vid-meds'), `
    <div>${s.meds.map(m => `${m.name} ${m.dose}`).join(' · ')}</div>
    <div style="margin-top:4px">Allergy: ${s.allergy.length ? s.allergy.map(a => `🚫 ${a.drug}`).join(' · ') : 'none'}</div>
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
  document.getElementById('as-name').textContent = s.patient.name;

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
    <div><strong>S:</strong> ${d.s}</div>
    <div><strong>O:</strong> ${d.o}</div>
    <div style="margin-top:4px"><strong>A:</strong> <textarea style="width:100%">${soapA}</textarea></div>
    <div><strong>P:</strong> <textarea style="width:100%">${d.p}</textarea></div>
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
        <button class="rx-del" aria-label="Remove">✕</button>
      </div>
    `).join(''));
  } else {
    mount(rxHost, rxRows.length ? rxRows.map(r => {
      const tags = [];
      if (r.interaction === 'caution') tags.push('<span class="chip flag">⚠️ interaction</span>');
      else if (r.interaction) tags.push('<span class="chip">✓ safe</span>');
      if (r.allergyCheck === 'safe') tags.push('<span class="chip">✓ allergy-clear</span>');
      return `<div>${r.drug} ${r.dose || ''} · ${r.freq || ''} · ${r.duration || ''} ${tags.join(' ')}</div>`;
    }).join('') : '<span style="color:var(--text-2)">No prescriptions.</span>');
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
  document.getElementById('as-er-banner').style.display = s.referral.er ? 'block' : 'none';
  erBox.addEventListener('change', () => {
    document.getElementById('as-er-banner').style.display = erBox.checked ? 'block' : 'none';
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
  document.getElementById('sync-name').textContent = s.patient.name;
  document.getElementById('sync-ts').textContent = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' GMT+7';

  const dests = [
    { key: 'his', label: 'HIS / EMR' },
    { key: 'pharmacy', label: 'Pharmacy System' },
    { key: 'lab', label: 'Lab Order System' },
    { key: 'nhso', label: 'NHSO (30-baht)' }
  ];
  if (normalize(s.syncOutcome.er).result) dests.push({ key: 'er', label: 'ER System' });

  const list = document.getElementById('sync-list');
  mount(list, dests.map(d => `
    <div class="sync-row" id="sync-${d.key}">
      <span>⏳ ${d.label}</span>
      <span class="ts">syncing…</span>
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
    row.classList.remove('ok', 'fail');
    if (n.result === 'ok') {
      row.classList.add('ok');
      mount(row, `<span>✅ ${d.label}</span><span>synced ${new Date().toTimeString().slice(0,8)}</span>`);
    } else if (n.result === 'fail') {
      row.classList.add('fail');
      const meta = [n.code, n.reason].filter(Boolean).join(' · ') || 'FAILED';
      mount(row, `<span>❌ ${d.label}</span><span>${meta} <button class="retry">Retry</button></span>`);
      row.querySelector('.retry').addEventListener('click', () => retry(d));
    }
  }

  function retry(d) {
    const row = document.getElementById(`sync-${d.key}`);
    if (!row) return;
    mount(row, `<span>⏳ ${d.label}</span><span>retrying…</span>`);
    setTimeout(() => {
      if (!document.body.contains(row)) return;
      row.classList.remove('fail'); row.classList.add('ok');
      mount(row, `<span>✅ ${d.label}</span><span>synced ${new Date().toTimeString().slice(0,8)}</span>`);
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
      bar.classList.add('ok'); bar.textContent = '✅ Sync Complete';
      retryAll.style.display = 'none';
    } else if (fails < dests.length) {
      bar.classList.add('partial'); bar.textContent = `⚠️ Partial Sync Failure · ${fails} of ${dests.length} failed`;
      retryAll.style.display = '';
    } else {
      bar.classList.add('fail'); bar.textContent = '❌ All Systems Failed';
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
