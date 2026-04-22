import { state, setScenario, setScreen, setRole, activeScenario } from './state.js';
import { renderScreen, renderIdentityChip } from './render.js';
import { mount } from './dom.js';

const SCREENS = ['queue', 'summary', 'video', 'assessment', 'sync'];
const NURSE_DISABLED = new Set(['video', 'assessment', 'sync']);

async function loadFragment(name) {
  const res = await fetch(`screens/${name}.html`);
  const html = await res.text();
  mount(document.getElementById('main'), html);
  setScreen(name);
  refreshNav();
  renderScreen(name);
}

function refreshNav() {
  document.querySelectorAll('.nav-item').forEach(el => {
    const scr = el.dataset.screen;
    el.classList.toggle('active', scr === state.screen);
    el.classList.toggle('disabled', state.role === 'nurse' && NURSE_DISABLED.has(scr));
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
  renderIdentityChip(state.role);
  loadFragment(state.screen || 'queue');
}

document.addEventListener('DOMContentLoaded', wireUp);
