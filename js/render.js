import { scenarios } from './scenarios.js';
import { state, activeScenario, setScenario, setQueueFilter, setShowDone, isDone, markDone, getNote, setNote, getNoteSavedAt } from './state.js';
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
  mount(document.getElementById('sum-vitals'), vitalHtml + `<div style="color:var(--text-2);margin-top:4px">Taken ${v.takenAt}</div>`);

  const abnormal = s.labs.filter(l => l.abnormal);
  mount(document.getElementById('sum-labs'), abnormal.length
    ? abnormal.map(l => `<div>${l.name}: ${l.values.join(' → ')} ${l.unit} ${l.arrow} <span class="sparkline">${sparkline(l.values)}</span></div>`).join('')
    : '<span style="color:var(--text-2)">No abnormal trends.</span>');

  mount(document.getElementById('sum-meds'), s.meds.map(m => `<li>${m.name} ${m.dose} ${m.freq}</li>`).join(''));
  mount(document.getElementById('sum-ai'), `🤖 Risk score <strong>${s.aiRisk.score}</strong> (${s.aiRisk.label})<br /><span style="color:var(--text-2)">${s.aiRisk.recommendation}</span>`);

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

  const rxMount = document.getElementById('as-rx');
  mount(rxMount, s.rxPrefilled.map((r, i) => `
    <div class="card" style="margin-bottom:8px">
      <div class="row">
        <span>Drug: <strong>${r.drug}</strong></span>
        <span>Dose: ${r.dose}</span>
        <span>Freq: ${r.freq}</span>
        <span>Dur: ${r.duration}</span>
        <button data-rm="${i}">Remove</button>
      </div>
      <div style="margin-top:4px">
        🤖 Interaction: <span class="chip ${r.interaction==='safe'?'ok':(r.interaction==='caution'?'warn':'flag')}">${r.interaction}${r.interactionNote ? ' — '+r.interactionNote : ''}</span>
        Allergy: <span class="chip ${r.allergyCheck==='safe'?'ok':'flag'}">${r.allergyCheck}</span>
      </div>
    </div>
  `).join(''));

  rxMount.querySelectorAll('[data-rm]').forEach(b =>
    b.addEventListener('click', () => b.closest('.card').remove()));

  const erBox = document.getElementById('as-er');
  erBox.checked = s.referral.er;
  document.getElementById('as-er-banner').style.display = s.referral.er ? 'block' : 'none';
  erBox.addEventListener('change', () => {
    document.getElementById('as-er-banner').style.display = erBox.checked ? 'block' : 'none';
  });
  document.getElementById('as-dept').value = s.referral.dept || 'None';

  document.getElementById('btn-add-drug').addEventListener('click', () => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.marginBottom = '8px';
    mount(card, `
      <div class="row">
        <input placeholder="Drug" />
        <input placeholder="Dose" style="width:80px"/>
        <input placeholder="Freq" style="width:80px"/>
        <input placeholder="Duration" style="width:100px"/>
        <button class="rm-new">Remove</button>
      </div>
      <div style="margin-top:4px;color:var(--text-2)">🤖 checks run on save</div>
    `);
    card.querySelector('.rm-new').addEventListener('click', () => card.remove());
    rxMount.appendChild(card);
  });

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
  if (s.syncOutcome.er) dests.push({ key: 'er', label: 'ER System' });

  const list = document.getElementById('sync-list');
  mount(list, dests.map(d => `
    <div class="sync-row" id="sync-${d.key}">
      <span>⏳ ${d.label}</span>
      <span class="ts">syncing…</span>
    </div>
  `).join(''));

  let idx = 0;
  function step() {
    if (idx >= dests.length) return finalize();
    const d = dests[idx];
    const row = document.getElementById(`sync-${d.key}`);
    setTimeout(() => {
      if (!row || !document.body.contains(row)) return;
      const outcome = s.syncOutcome[d.key];
      if (outcome === 'ok') {
        row.classList.add('ok');
        mount(row, `<span>✅ ${d.label}</span><span>synced ${new Date().toTimeString().slice(0,8)}</span>`);
      } else if (outcome === 'fail') {
        row.classList.add('fail');
        mount(row, `<span>❌ ${d.label}</span><span>FAILED — offline <button class="retry">Retry</button></span>`);
        row.querySelector('.retry').addEventListener('click', () => retry(d));
      }
      idx++; step();
    }, 450);
  }

  function retry(d) {
    const row = document.getElementById(`sync-${d.key}`);
    if (!row) return;
    mount(row, `<span>⏳ ${d.label}</span><span>retrying…</span>`);
    setTimeout(() => {
      if (!document.body.contains(row)) return;
      row.classList.remove('fail');
      row.classList.add('ok');
      mount(row, `<span>✅ ${d.label}</span><span>synced ${new Date().toTimeString().slice(0,8)}</span>`);
      s.syncOutcome[d.key] = 'ok';
      finalize();
    }, 1000);
  }

  function finalize() {
    const anyFail = dests.some(d => s.syncOutcome[d.key] === 'fail');
    const hdr = document.getElementById('sync-status');
    if (!hdr) return;
    if (anyFail) {
      hdr.classList.remove('ok'); hdr.classList.add('warn');
      hdr.textContent = '⚠️ Partial Sync Failure';
    } else {
      hdr.classList.remove('warn'); hdr.classList.add('ok');
      hdr.textContent = '✅ Sync Complete';
    }
  }
  step();

  document.getElementById('btn-back').addEventListener('click', () => {
    document.querySelector('[data-screen="queue"]').click();
  });
}
