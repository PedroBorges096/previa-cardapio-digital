/* ===========================================================================
   The order becomes a kitchen chit. It is read on a phone, in a loud kitchen,
   between other messages — so: fixed order, bold section heads, one item per
   line, modifiers indented under their item, total last and unmissable.
   =========================================================================== */

import { brlPlain } from './cart.js';

const B = (s) => `*${s}*`;

export function buildMessage({ items, totals, form, state, code }) {
  const L = [];
  const now = new Date();
  const when = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) +
    ' às ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  L.push(B(`PEDIDO ${code}`));
  L.push(`${state.brand.name} · ${when}`);
  L.push('');

  L.push(B('ITENS'));
  for (const i of items) {
    L.push(`${i.qty}x ${i.name} — ${brlPlain(i.unit * i.qty)}`);
    for (const v of i.variationLabels) L.push(`    • ${v.group}: ${v.label}`);
    for (const a of i.addons) {
      L.push(`    + ${a.name}${a.price ? ` (${brlPlain(a.price)})` : ''}`);
    }
    if (i.note) L.push(`    obs: ${i.note}`);
  }
  L.push('');

  L.push(B('VALORES'));
  L.push(`Subtotal: ${brlPlain(totals.subtotal)}`);
  if (form.mode === 'delivery') {
    L.push(`Entrega (${form.district}): ${totals.freeDelivery ? 'grátis' : brlPlain(totals.fee)}`);
  } else {
    L.push('Retirada no balcão');
  }
  if (totals.savings > 0) L.push(`Economia nas promoções: ${brlPlain(totals.savings)}`);
  L.push(B(`TOTAL: ${brlPlain(totals.total)}`));
  L.push(`Pagamento: ${form.paymentLabel}`);
  if (form.changeFor) {
    L.push(`Levar troco para ${brlPlain(form.changeFor)} (troco: ${brlPlain(form.changeFor - totals.total)})`);
  }
  if (form.payment === 'pix' && state.pixKey) L.push(`Chave Pix: ${state.pixKey}`);
  L.push('');

  if (form.mode === 'delivery') {
    L.push(B('ENTREGA'));
    L.push(`${form.name} · ${form.phone}`);
    L.push(`${form.street}, ${form.number}${form.complement ? ' — ' + form.complement : ''}`);
    L.push(form.district);
    if (form.reference) L.push(`Referência: ${form.reference}`);
  } else {
    L.push(B('RETIRADA'));
    L.push(`${form.name} · ${form.phone}`);
    L.push(`${state.contact.address.street} — ${state.contact.address.district}`);
  }

  if (form.notes) { L.push(''); L.push(B('OBSERVAÇÕES')); L.push(form.notes); }

  return L.join('\n');
}

/** api.whatsapp.com works on desktop and mobile; wa.me bounces on some Androids. */
export function waLink(number, text) {
  const digits = String(number).replace(/\D/g, '');
  return `https://api.whatsapp.com/send?phone=${digits}&text=${encodeURIComponent(text)}`;
}
