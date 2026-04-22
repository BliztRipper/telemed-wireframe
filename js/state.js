import { scenarios } from './scenarios.js';

const KEY = 'telemed.state.v3';
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
  rxEdits: {}
};

function load() {
  try { return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { return { ...defaults }; }
}

export const state = load();
export function save() { localStorage.setItem(KEY, JSON.stringify(state)); }
export function setScenario(id) {
  state.scenarioId = id;
  state.redFlagAcknowledged = false;
  state.rxEditMode = {};
  state.rxEdits = {};
  save();
}
export function setScreen(screen) { state.screen = screen; save(); }
export function setRole(role)     { state.role = role; save(); }
export function activeScenario()  { return scenarios[state.scenarioId]; }
export function setNote(hn, text) {
  state.notes = { ...state.notes, [hn]: text };
  state.noteSavedAt = { ...state.noteSavedAt, [hn]: new Date().toISOString() };
  save();
}
export function getNote(hn) { return state.notes[hn] || ''; }
export function getNoteSavedAt(hn) { return state.noteSavedAt[hn] || null; }
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
