/* ===========================================================================
   Repository. The whole app talks to `db`; `db` talks to a driver.
   v1 driver is localStorage. The interface is async on purpose: swapping in
   Supabase/Postgres is writing a second driver, not rewriting callers.
   =========================================================================== */

import { SEED, SCHEMA_VERSION } from './config.js';

const KEY = 'menu.state';
const CART_KEY = 'menu.cart';

function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

const localDriver = {
  async load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed.__v !== SCHEMA_VERSION) return null; // seed shape moved on
      return parsed;
    } catch { return null; }
  },
  async save(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...state, __v: SCHEMA_VERSION }));
      return true;
    } catch (e) {
      // QuotaExceeded is the realistic failure: surface it, never swallow it
      return false;
    }
  },
  async clear() { try { localStorage.removeItem(KEY); } catch {} },
};

/* Swap this line for a supabaseDriver with the same four methods. */
let driver = localDriver;
export function setDriver(d) { driver = d; }

let state = null;
const listeners = new Set();

function fresh() {
  return { ...deepClone(SEED), orders: [], seq: 1 };
}

/* Um estado salvo foi gravado com a versão do SEED daquele dia. Quando o
   produto ganha um campo novo (uma animação, um bloco de configuração), quem
   já mexeu no painel ficaria sem ele para sempre — e sem nenhum sinal disso.
   Esta função só preenche o que está faltando: nunca sobrescreve um valor que
   o operador definiu, e não entra em listas (o cardápio é dele, não do SEED). */
function fillGaps(saved, seed) {
  if (!saved || typeof saved !== 'object') return saved;
  for (const k of Object.keys(seed)) {
    const sv = seed[k];
    if (saved[k] === undefined) {
      saved[k] = deepClone(sv);
    } else if (isPlain(sv) && isPlain(saved[k])) {
      fillGaps(saved[k], sv);
    }
  }
  return saved;
}
const isPlain = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

export async function init() {
  /* DEV ONLY: ?data=worst|empty|one|huge loads a stress fixture.
     Dynamic import, so a real visitor never fetches the file. */
  const dev = new URLSearchParams(location.search).get('data');
  if (dev) {
    try {
      const { FIXTURES, fixtureBar } = await import('../../dev/fixtures.js');
      if (FIXTURES[dev]) {
        state = { ...FIXTURES[dev](), orders: [], seq: 1 };
        fixtureBar(dev);
        return state;
      }
    } catch (e) { console.warn('fixture não carregou', e); }
  }
  state = (await driver.load()) || fresh();
  fillGaps(state, SEED);
  if (!Array.isArray(state.orders)) state.orders = [];
  return state;
}

export function get() {
  if (!state) throw new Error('store.init() precisa rodar antes de store.get()');
  return state;
}

export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function emit() { listeners.forEach((f) => f(state)); }

export async function commit(mutator) {
  mutator(state);
  const ok = await driver.save(state);
  emit();
  return ok;
}

export async function resetAll() {
  await driver.clear();
  state = fresh();
  await driver.save(state);
  emit();
}

export function exportJson() {
  return JSON.stringify({ ...state, __v: SCHEMA_VERSION }, null, 2);
}

export async function importJson(text) {
  const parsed = JSON.parse(text);
  if (!parsed || !parsed.brand || !Array.isArray(parsed.products)) {
    throw new Error('Arquivo não parece um backup do cardápio.');
  }
  state = { ...fresh(), ...parsed };
  const ok = await driver.save(state);
  emit();
  if (!ok) throw new Error('Não foi possível gravar o arquivo importado.');
  return state;
}

/* ------------------------------------------------------------ selectors - */
export const sel = {
  categories: (s = state) => s.categories.filter((c) => c.active).sort((a, b) => a.order - b.order),
  productsOf: (catId, s = state) =>
    s.products.filter((p) => p.categoryId === catId).sort((a, b) => a.order - b.order),
  product: (id, s = state) => s.products.find((p) => p.id === id) || null,
  addonGroup: (id, s = state) => s.addonGroups.find((g) => g.id === id) || null,
  top: (s = state) => s.products.filter((p) => p.badges.includes('top') && p.available),
  promos: (s = state) => s.products.filter((p) => p.promoPrice && p.available),
  effectivePrice: (p) => (p.promoPrice != null ? p.promoPrice : p.price),
};

/* ------------------------------------------------------- opening hours -- */
function hhmmToMin(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }

/**
 * Closing times past midnight ("00:30") belong to the previous day's shift,
 * so a Saturday 23:30 order is still Saturday's.
 */
export function openState(s = state, now = new Date()) {
  if (s.manualStatus === 'open') return { open: true, reason: 'manual' };
  if (s.manualStatus === 'closed') return { open: false, reason: 'manual', next: nextOpening(s, now) };

  const mins = now.getHours() * 60 + now.getMinutes();
  const today = s.hours.find((h) => h.day === now.getDay());
  const yday = s.hours.find((h) => h.day === (now.getDay() + 6) % 7);

  if (yday && !yday.closed) {
    const o = hhmmToMin(yday.open), c = hhmmToMin(yday.close);
    if (c < o && mins < c) return { open: true, reason: 'overnight', closesAt: yday.close };
  }
  if (today && !today.closed) {
    const o = hhmmToMin(today.open);
    let c = hhmmToMin(today.close);
    if (c < o) c = 24 * 60; // runs past midnight — open through the end of today
    if (mins >= o && mins < c) return { open: true, reason: 'hours', closesAt: today.close };
  }
  return { open: false, reason: 'hours', next: nextOpening(s, now) };
}

export function nextOpening(s = state, now = new Date()) {
  const names = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const mins = now.getHours() * 60 + now.getMinutes();
  for (let i = 0; i < 8; i++) {
    const d = (now.getDay() + i) % 7;
    const h = s.hours.find((x) => x.day === d);
    if (!h || h.closed) continue;
    if (i === 0 && mins >= hhmmToMin(h.open)) continue;
    return { label: i === 0 ? 'hoje' : i === 1 ? 'amanhã' : names[d], time: h.open };
  }
  return null;
}

/* ------------------------------------------------------------- orders --- */
export async function recordOrder(order) {
  let code = '';
  await commit((s) => {
    code = 'KM' + String(s.seq).padStart(4, '0');
    s.seq += 1;
    s.orders.unshift({ ...order, code, createdAt: Date.now(), status: 'recebido' });
    if (s.orders.length > 200) s.orders.length = 200;
  });
  return code;
}

export const ORDER_STATUS = ['recebido', 'em preparo', 'saiu para entrega', 'concluído', 'cancelado'];

/* -------------------------------------------------------------- cart ---- */
export function loadCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; }
}
export function saveCart(items) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(items)); return true; } catch { return false; }
}
export function clearCart() { try { localStorage.removeItem(CART_KEY); } catch {} }
