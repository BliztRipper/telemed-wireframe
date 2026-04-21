import { state, save } from './state.js';
import { mount, clear } from './dom.js';

export function showRedFlagToast(flags, onAck) {
  const host = document.getElementById('toast-mount');
  if (!host || state.redFlagAcknowledged) return;
  mount(host, `
    <div class="toast" role="alertdialog">
      <div class="title">⚠️ RED FLAG</div>
      <div>${flags.map(f => f.label).join(' · ')}</div>
      <div style="text-align:right;margin-top:8px">
        <button id="ack-btn" class="primary">Acknowledge</button>
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
