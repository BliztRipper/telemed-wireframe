import { state, setScenario, setScreen, setRole, activeScenario, SCREEN_STEP } from './state.js';
import { renderScreen, renderIdentityChip } from './render.js';
import { mount } from './dom.js';

const SCREENS = ['queue', 'summary', 'video', 'assessment', 'sync'];
const NURSE_DISABLED = new Set(['video', 'assessment', 'sync']);

export async function loadFragment(name) {
  const res = await fetch(`screens/${name}.html`);
  const html = await res.text();
  mount(document.getElementById('main'), html);
  setScreen(name);
  refreshNav();
  renderScreen(name);
}
window.__loadFragment = loadFragment;

function refreshNav() {
  const collapsed = document.querySelector('.app').classList.contains('sidebar-collapsed');
  document.querySelectorAll('.nav-item').forEach(el => {
    const scr = el.dataset.screen;
    const step = SCREEN_STEP[scr] || 1;
    const nurseLocked = state.role === 'nurse' && NURSE_DISABLED.has(scr);
    const stepLocked = step > state.maxStep;
    el.classList.toggle('active', scr === state.screen);
    el.classList.toggle('disabled', nurseLocked);
    el.classList.toggle('locked', stepLocked && !nurseLocked);
    el.classList.toggle('done', step < state.maxStep && !nurseLocked);
    if (stepLocked) el.setAttribute('aria-disabled', 'true');
    else el.removeAttribute('aria-disabled');
    if (stepLocked) el.title = `Step ${step} unlocks after step ${state.maxStep} is reached.`;
    else if (collapsed) el.title = el.dataset.label || '';
    else el.title = '';
  });
  const fc = document.getElementById('flag-count');
  const count = activeScenario().redFlags.length > 0 ? 1 : 0;
  fc.textContent = count ? `🔴 ${count} red-flag` : '';
  fc.style.display = count ? 'inline-block' : 'none';
}

function wireUp() {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', () => {
      if (el.classList.contains('disabled')) return;
      if (el.classList.contains('locked')) return;
      loadFragment(el.dataset.screen);
    });
  });
  const scenSel = document.getElementById('scenario-toggle');
  scenSel.value = state.scenarioId;
  scenSel.addEventListener('change', e => {
    setScenario(e.target.value);
    loadFragment('queue');
  });
  const roleSel = document.getElementById('role-toggle');
  roleSel.value = state.role;
  roleSel.addEventListener('change', e => {
    setRole(e.target.value);
    renderIdentityChip(state.role);
    refreshNav();
    if (state.role === 'nurse' && NURSE_DISABLED.has(state.screen)) loadFragment('queue');
    else renderScreen(state.screen);
  });
  const hamb = document.getElementById('hamburger');
  hamb.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));

  const SIDEBAR_KEY = 'telemed.sidebar.collapsed';
  const appEl = document.querySelector('.app');
  const collapseBtn = document.getElementById('sidebar-collapse');
  const applyCollapsed = (collapsed) => {
    appEl.classList.toggle('sidebar-collapsed', collapsed);
    collapseBtn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    collapseBtn.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
    document.querySelectorAll('.nav-item').forEach(el => {
      if (collapsed) el.setAttribute('title', el.dataset.label || '');
      else el.removeAttribute('title');
    });
  };
  applyCollapsed(localStorage.getItem(SIDEBAR_KEY) === '1');
  collapseBtn.addEventListener('click', () => {
    const next = !appEl.classList.contains('sidebar-collapsed');
    applyCollapsed(next);
    localStorage.setItem(SIDEBAR_KEY, next ? '1' : '0');
  });

  const resetBtn = document.getElementById('btn-reset-demo');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      const ok = confirm('Reset demo? This clears local storage and restarts the journey.');
      if (!ok) return;
      try { localStorage.clear(); } catch {}
      location.reload();
    });
  }

  renderIdentityChip(state.role);
  loadFragment(state.screen || 'queue');
}

document.addEventListener('DOMContentLoaded', wireUp);
