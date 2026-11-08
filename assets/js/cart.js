/* ===========================================================================
   Money and cart. Every amount is an integer number of centavos; no float
   ever touches a price. brl() is the only place a number becomes a string.
   =========================================================================== */

import { sel } from './store.js';

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const brl = (cents) => fmt.format((cents || 0) / 100);
export const brlPlain = (cents) => fmt.format((cents || 0) / 100).replace(/ /g, ' ');

/** "32,00" / "32" / "R$ 32,00" / "3250" -> centavos. Used by the admin. */
export function parseBrl(input) {
  if (typeof input === 'number') return Math.round(input * 100);
  const s = String(input).trim().replace(/[^\d,.-]/g, '');
  if (!s) return 0;
  const norm = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s;
  const n = Number(norm);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export function unitPrice(product, variations = {}, addons = []) {
  let cents = sel.effectivePrice(product);
  for (const group of product.variations || []) {
    const chosen = variations[group.id];
    const opt = group.options.find((o) => o.id === chosen);
    if (opt) cents += opt.priceDelta || 0;
  }
  for (const a of addons) cents += a.price || 0;
  return cents;
}

export function lineTotal(item) { return item.unit * item.qty; }

export function makeItem(product, { variations = {}, addons = [], note = '', qty = 1 }) {
  return {
    uid: `${product.id}:${Math.random().toString(36).slice(2, 9)}`,
    productId: product.id,
    name: product.name,
    art: product.art,
    img: product.img || null,
    photo: product.photo || null,
    qty: Math.max(1, Math.min(99, qty | 0)),
    variations,
    variationLabels: (product.variations || [])
      .map((g) => {
        const o = g.options.find((x) => x.id === variations[g.id]);
        return o ? { group: g.name, label: o.name, delta: o.priceDelta || 0 } : null;
      })
      .filter(Boolean),
    addons: addons.map((a) => ({ id: a.id, name: a.name, price: a.price, groupId: a.groupId })),
    note: String(note || '').slice(0, 240),
    unit: unitPrice(product, variations, addons),
    base: sel.effectivePrice(product),
  };
}

/** Two lines merge only when product, every variation, every add-on and the note match. */
export function sameConfig(a, b) {
  if (a.productId !== b.productId || a.note !== b.note) return false;
  if (JSON.stringify(a.variations) !== JSON.stringify(b.variations)) return false;
  const k = (x) => x.addons.map((o) => o.id).sort().join('|');
  return k(a) === k(b);
}

export function addTo(items, item) {
  const hit = items.find((i) => sameConfig(i, item));
  if (hit) { hit.qty = Math.min(99, hit.qty + item.qty); return items; }
  return [...items, item];
}

export function totals(items, { feeCents = 0, freeAbove = null, mode = 'delivery' } = {}) {
  const subtotal = items.reduce((a, i) => a + lineTotal(i), 0);
  const savings = items.reduce((a, i) => {
    const p = sel.product(i.productId);
    if (!p || p.promoPrice == null) return a;
    return a + (p.price - p.promoPrice) * i.qty;
  }, 0);
  const freeHit = mode === 'delivery' && freeAbove != null && subtotal >= freeAbove;
  const fee = mode === 'delivery' ? (freeHit ? 0 : feeCents) : 0;
  return { subtotal, fee, savings, freeDelivery: freeHit, total: subtotal + fee, count: items.reduce((a, i) => a + i.qty, 0) };
}

/** Change due. Returns null when the note isn't needed or the amount is short. */
export function changeFor(total, paidCents) {
  if (!paidCents || paidCents <= total) return null;
  return paidCents - total;
}
