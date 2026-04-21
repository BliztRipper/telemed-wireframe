import { scenarios } from './scenarios.js';

const KEY = 'telemed.state.v1';
const defaults = {
  scenarioId: 'A',
  screen: 'queue',
  role: 'doctor',
  redFlagAcknowledged: false
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
  save();
}
export function setScreen(screen) { state.screen = screen; save(); }
export function setRole(role)     { state.role = role; save(); }
export function activeScenario()  { return scenarios[state.scenarioId]; }
