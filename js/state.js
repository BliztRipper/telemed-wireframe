import { scenarios } from './scenarios.js';

const KEY = 'telemed.state.v4';
export const SCREEN_STEP = { queue: 1, summary: 2, video: 3, assessment: 4 };
const NOTE_FIELDS = ['pi', 'ph', 'pe', 'pl'];
const blankNote = () => ({ pi: '', ph: '', pe: '', pl: '' });

const defaults = {
  scenarioId: 'A',
  screen: 'queue',
  role: 'doctor',
  redFlagAcknowledged: false,
  queueFilter: 'all',
  showDone: false,
  notes: {},
  noteSavedAt: {},
  doneIds: ['D', 'E'],
  lastSyncOutcome: null,
  rxEditMode: {},
  rxEdits: {},
  maxStep: 1
};

function migrateNotes(rawNotes) {
  if (!rawNotes || typeof rawNotes !== 'object') return {};
  const out = {};
  for (const [hn, val] of Object.entries(rawNotes)) {
    if (typeof val === 'string') out[hn] = { ...blankNote(), pi: val };
    else if (val && typeof val === 'object') out[hn] = { ...blankNote(), ...val };
  }
  return out;
}

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    const merged = { ...defaults, ...raw };
    merged.notes = migrateNotes(merged.notes);
    return merged;
  }
  catch { return { ...defaults }; }
}

export const state = load();
export function save() { localStorage.setItem(KEY, JSON.stringify(state)); }
export function setScenario(id) {
  state.scenarioId = id;
  state.redFlagAcknowledged = false;
  state.rxEditMode = {};
  state.rxEdits = {};
  state.maxStep = 1;
  save();
}
export function setScreen(screen) {
  state.screen = screen;
  const step = SCREEN_STEP[screen] || 1;
  if (step > state.maxStep) state.maxStep = step;
  save();
}
export function setRole(role)     { state.role = role; save(); }
export function activeScenario()  { return scenarios[state.scenarioId]; }
export function setNote(hn, fields) {
  const cur = state.notes[hn] || blankNote();
  state.notes = { ...state.notes, [hn]: { ...cur, ...fields } };
  state.noteSavedAt = { ...state.noteSavedAt, [hn]: new Date().toISOString() };
  save();
}
export function getNote(hn) { return state.notes[hn] || blankNote(); }
export function getNoteJoined(hn) {
  const n = getNote(hn);
  const labels = { pi: 'Present Illness', ph: 'Past History', pe: 'Physical Exam', pl: 'Plan' };
  return NOTE_FIELDS
    .filter(k => (n[k] || '').trim())
    .map(k => `${labels[k]}: ${n[k].trim()}`)
    .join('\n');
}
export function getNoteSavedAt(hn) { return state.noteSavedAt[hn] || null; }
export function setMaxStep(step) {
  if (step > state.maxStep) { state.maxStep = step; save(); }
}
export function resetWorkflow() {
  state.maxStep = 1;
  state.redFlagAcknowledged = false;
  state.rxEditMode = {};
  state.rxEdits = {};
  state.lastSyncOutcome = null;
  save();
}
export function markDone(id) {
  if (!state.doneIds.includes(id)) state.doneIds = [...state.doneIds, id];
  save();
}
export function isDone(id) { return state.doneIds.includes(id); }
export function setQueueFilter(f) { state.queueFilter = f; save(); }
export function setShowDone(v) { state.showDone = !!v; save(); }

export function setLastSyncOutcome(outcome) { state.lastSyncOutcome = outcome; save(); }
export function clearLastSyncOutcome() { state.lastSyncOutcome = null; save(); }
export function setRxEditMode(hn, on) {
  state.rxEditMode = { ...state.rxEditMode, [hn]: !!on };
  save();
}
export function setRxEdits(hn, rows) {
  state.rxEdits = { ...state.rxEdits, [hn]: rows };
  save();
}
export function clearRxEdits(hn) {
  const next = { ...state.rxEdits }; delete next[hn];
  state.rxEdits = next; save();
}
export function getRxRows(hn) {
  if (state.rxEdits[hn]) return state.rxEdits[hn];
  const s = activeScenario();
  return s.rxPrefilled || [];
}
