import { state, save } from './state.js';
import { mount, clear } from './dom.js';

export function showRedFlagToast(flags, onAck) {
  const host = document.getElementById('toast-mount');
  if (!host || state.redFlagAcknowledged) return;
  mount(host, `
    <div class="toast" role="alertdialog" aria-labelledby="rf-title">
      <div class="toast-row">
        <span class="toast-icon"><svg class="icon" aria-hidden="true"><use href="#i-alert-octagon"/></svg></span>
        <strong id="rf-title" class="title">RED FLAG</strong>
      </div>
      <div class="toast-body">${flags.map(f => f.label).join(' · ')}</div>
      <div style="display:flex;justify-content:flex-end;margin-top:4px">
        <button id="ack-btn" class="danger">Acknowledge</button>
      </div>
    </div>
  `);
  document.getElementById('ack-btn').addEventListener('click', () => {
    state.redFlagAcknowledged = true;
    save();
    clear(host);
    if (onAck) onAck();
  });
}

export function sparkline(values) {
  const blocks = '▁▂▃▄▅▆▇█';
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  return values.map(v => blocks[Math.floor(((v - min) / span) * (blocks.length - 1))]).join('');
}

let transcriptTimers = [];
export function playTranscript(lines) {
  const host = document.getElementById('vid-transcript');
  if (!host) return;
  clear(host);
  stopTranscript();
  transcriptTimers = lines.map(line => setTimeout(() => {
    const p = document.createElement('p');
    const spk = document.createElement('span');
    spk.className = 'spk'; spk.textContent = `${line.spk}: `;
    p.appendChild(spk);
    p.appendChild(document.createTextNode(line.text));
    host.appendChild(p);
    host.scrollTop = host.scrollHeight;
  }, line.at));
}
export function stopTranscript() {
  transcriptTimers.forEach(t => clearTimeout(t));
  transcriptTimers = [];
}

const FEEDBACK_ICONS = { ok: 'check', partial: 'alert-triangle', fail: 'x' };
export function showFeedbackToast(host, kind, title, body, ttl = 4000) {
  if (!host) return;
  const tone = FEEDBACK_ICONS[kind] ? kind : 'ok';
  const iconId = FEEDBACK_ICONS[tone];
  const wrap = document.createElement('div');
  wrap.className = `toast toast-${tone}`;
  wrap.setAttribute('role', 'status');
  wrap.setAttribute('aria-live', 'polite');

  const row = document.createElement('div');
  row.className = 'toast-row';
  const icon = document.createElement('span');
  icon.className = 'toast-icon';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'icon');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#i-${iconId}`);
  svg.appendChild(use);
  icon.appendChild(svg);
  const strong = document.createElement('strong');
  strong.textContent = title;
  const close = document.createElement('button');
  close.className = 'toast-close';
  close.setAttribute('aria-label', 'Dismiss');
  close.textContent = '×';
  row.append(icon, strong, close);
  wrap.appendChild(row);

  if (body) {
    const bodyEl = document.createElement('div');
    bodyEl.className = 'toast-body';
    bodyEl.textContent = body;
    wrap.appendChild(bodyEl);
  }
  host.appendChild(wrap);
  const dismiss = () => { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); };
  close.addEventListener('click', dismiss);
  if (ttl > 0) setTimeout(() => { if (host.contains(wrap)) dismiss(); }, ttl);
}
