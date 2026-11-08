/* ===========================================================================
   Shared UI: toasts, bottom sheets with velocity dismissal, and the odometer.
   =========================================================================== */

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------- toasts --- */
let toaster;
export function toast(message, { type = 'ok', icon = '', timeout = 3200, key = null } = {}) {
  if (!toaster) {
    toaster = document.createElement('div');
    toaster.className = 'toaster';
    toaster.setAttribute('role', 'status');
    toaster.setAttribute('aria-live', 'polite');
    document.body.appendChild(toaster);
  }
  if (key) toaster.querySelectorAll(`[data-key="${key}"]`).forEach((n) => n.remove());
  const el = document.createElement('div');
  if (key) el.dataset.key = key;
  el.className = 'toast' + (type === 'err' ? ' toast--err' : '');
  el.setAttribute('data-enter', '');
  el.innerHTML = `${icon}<span>${esc(message)}</span>`;
  toaster.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.removeAttribute('data-enter')));
  const kill = () => {
    el.setAttribute('data-leave', '');
    setTimeout(() => el.remove(), 260);
  };
  const t = setTimeout(kill, timeout);
  el.addEventListener('click', () => { clearTimeout(t); kill(); });
  return kill;
}

/* -------------------------------------------------------------- sheet --- */
const stack = [];

export function sheet({ title = '', body = '', foot = '', onMount, onClose, labelledBy } = {}) {
  const scrim = document.createElement('div');
  scrim.className = 'scrim';

  const el = document.createElement('div');
  el.className = 'sheet';
  el.setAttribute('role', 'dialog');
  el.setAttribute('tabindex', '-1');
  el.setAttribute('aria-modal', 'true');
  const tid = 'sh' + Math.random().toString(36).slice(2, 8);
  if (title) el.setAttribute('aria-labelledby', tid);
  else if (labelledBy) el.setAttribute('aria-label', labelledBy);

  el.innerHTML = `
    <div class="sheet-grab" data-grab><span></span></div>
    ${title ? `<div class="sheet-head"><h2 id="${tid}">${title}</h2>
      <button class="x" data-close aria-label="Fechar">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"
          stroke-linecap="round"><path d="M6.3 6.3l11.4 11.4M17.7 6.3L6.3 17.7"/></svg>
      </button></div>` : ''}
    <div class="sheet-body" data-body>${body}</div>
    ${foot ? `<div class="sheet-foot" data-foot>${foot}</div>` : ''}`;

  document.body.appendChild(scrim);
  document.body.appendChild(el);
  document.documentElement.style.overflow = 'hidden';

  const api = { el, scrim, close };
  stack.push(api);

  requestAnimationFrame(() => {
    scrim.setAttribute('data-visible', '');
    el.setAttribute('data-visible', '');
  });

  function close() {
    const i = stack.indexOf(api);
    if (i === -1) return;
    stack.splice(i, 1);
    el.setAttribute('data-closing', '');
    el.removeAttribute('data-visible');
    scrim.removeAttribute('data-visible');
    el.style.transform = '';
    setTimeout(() => {
      el.remove(); scrim.remove();
      if (!stack.length) document.documentElement.style.overflow = '';
      onClose?.();
    }, reduced() ? 0 : 230);
    document.removeEventListener('keydown', onKey);
  }

  function onKey(e) {
    if (e.key === 'Escape' && stack[stack.length - 1] === api) { e.preventDefault(); close(); }
    if (e.key === 'Tab') trap(e);
  }
  function trap(e) {
    const f = el.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])');
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  document.addEventListener('keydown', onKey);

  scrim.addEventListener('click', close);
  /* delegado: a folha costuma ter mais de um [data-close] (o X no topo e o
     botão no rodapé) e alguns nascem depois, quando o conteúdo é redesenhado.
     querySelector pegava só o primeiro, então o botão de baixo não fechava. */
  el.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });

  /* drag to dismiss: velocity OR travel, with damping above the top edge */
  const grab = el.querySelector('[data-grab]');
  let startY = 0, startT = 0, dy = 0, dragging = false, pid = null;
  grab.addEventListener('pointerdown', (e) => {
    if (dragging) return;                  // ignore a second finger mid-drag
    dragging = true; pid = e.pointerId;
    startY = e.clientY; startT = performance.now(); dy = 0;
    grab.setPointerCapture(pid);
    el.style.transition = 'none';
  });
  grab.addEventListener('pointermove', (e) => {
    if (!dragging || e.pointerId !== pid) return;
    dy = e.clientY - startY;
    const d = dy < 0 ? dy / 4 : dy;        // friction, not a wall
    el.style.transform = `translateY(${d}px)`;
  });
  const end = (e) => {
    if (!dragging || (e && e.pointerId !== pid)) return;
    dragging = false;
    el.style.transition = '';
    const v = Math.abs(dy) / Math.max(1, performance.now() - startT);
    if (dy > el.offsetHeight * 0.35 || (dy > 40 && v > 0.11)) { el.style.transform = ''; close(); }
    else el.style.transform = '';
  };
  grab.addEventListener('pointerup', end);
  grab.addEventListener('pointercancel', end);

  onMount?.(el, api);
  setTimeout(() => {
    (el.querySelector('[data-autofocus]') || el).focus?.({ preventScroll: true });
  }, 60);

  return api;
}

export const topSheet = () => stack[stack.length - 1] || null;
export const closeAllSheets = () => { while (stack.length) stack[stack.length - 1].close(); };

/* ----------------------------------------------------------- odometer --- */
/* The one authored moment: the running total rolls like a kilometer counter. */
export function odometer(el, text) {
  const chars = String(text).split('');
  const same = el.dataset.odo === chars.length + ':' + chars.map(c => /\d/.test(c) ? 'd' : c).join('');
  if (!same) {
    el.dataset.odo = chars.length + ':' + chars.map(c => /\d/.test(c) ? 'd' : c).join('');
    el.innerHTML = chars.map((c) => /\d/.test(c)
      ? `<span class="odo-col"><span class="odo-reel">${'0123456789'.split('').map(d => `<span>${d}</span>`).join('')}</span></span>`
      : `<span class="odo-fix">${c === ' ' ? '&nbsp;' : esc(c)}</span>`).join('');
  }
  const cols = el.querySelectorAll('.odo-reel');
  let ci = 0;
  const digits = chars.filter((c) => /\d/.test(c));
  const n = digits.length;
  digits.forEach((d, i) => {
    const reel = cols[ci++];
    if (!reel) return;
    reel.style.transitionDelay = reduced() ? '0ms' : `${(n - 1 - i) * 26}ms`;
    reel.style.transform = `translateY(${-Number(d) * 10}%)`;
  });
}

/* ------------------------------------------------------------- helpers -- */
export function debounce(fn, ms = 180) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

export function onlyDigits(v) { return String(v).replace(/\D/g, ''); }

export function maskPhone(v) {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
