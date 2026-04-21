// js/dom.js — DOMParser-based HTML builder. Avoids direct innerHTML writes.
// Data in this wireframe is hardcoded in scenarios.js, but using DOMParser keeps us safe.

export function h(htmlString) {
  const doc = new DOMParser().parseFromString(`<body>${htmlString}</body>`, 'text/html');
  const frag = document.createDocumentFragment();
  Array.from(doc.body.childNodes).forEach(n => frag.appendChild(n));
  return frag;
}

export function mount(el, htmlString) {
  el.replaceChildren(h(htmlString));
}

export function clear(el) {
  el.replaceChildren();
}

export function text(el, value) {
  el.textContent = value;
}
