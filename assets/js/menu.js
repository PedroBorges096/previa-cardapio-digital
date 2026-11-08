/* ===========================================================================
   KM 7 — cardápio público.
   =========================================================================== */

import * as store from './store.js';
import { sel, openState, nextOpening } from './store.js';
import { DEMO_WHATSAPP } from './config.js';
import { artSvg } from './art.js';
import { icon } from './icons.js';
import { brl, parseBrl, makeItem, addTo, totals, unitPrice, changeFor } from './cart.js';
import { buildMessage, waLink } from './whatsapp.js';
import { esc, toast, sheet, odometer, debounce, maskPhone, onlyDigits, closeAllSheets, topSheet } from './ui.js';

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
let S = null;
let cart = [];
let query = '';
let activeCat = null;
let currentRoute = '';

/* ------------------------------------------------------------------ boot */
(async function boot() {
  S = await store.init();
  applyTheme(S.theme);
  document.documentElement.classList.add('js-reveal');
  cart = store.loadCart().filter((i) => sel.product(i.productId)); // drop items deleted since
  activeCat = sel.categories(S)[0]?.id || null;
  render();
  wireGlobal();
  syncRoute();
  store.subscribe((s) => { S = s; render(); });
})();

function applyTheme(theme) {
  const r = document.documentElement;
  for (const [k, v] of Object.entries(theme || {})) r.style.setProperty(k, v);
}

/* ---------------------------------------------------------------- render */
function render() {
  document.getElementById('signboard').outerHTML = signboard();
  document.getElementById('main-slot').innerHTML = mainSlot();
  renderCartBar();
  paintActiveChip();
  armReveal();
  armBuild();
}

function signboard() {
  const st = openState(S);
  const a = S.contact.address;
  const [dmin, dmax] = S.service.etaDelivery;
  const minFee = Math.min(...S.service.districts.map((d) => d.fee));
  return `
  <header class="signboard riveted" id="signboard">
    <span class="rivets-b"></span>
    ${buildStage()}
    <div class="sign-top">
      <h1 class="lockup">
        <img src="${esc(S.brand.logoDark)}" alt="${esc(S.brand.name)}" width="620" height="290"
          fetchpriority="high" decoding="sync">
      </h1>
      <div class="sign-id">
        ${S.brand.kicker ? `<span class="kicker">${esc(S.brand.kicker)}</span>` : ''}
        <span class="tag">${esc(S.brand.tagline)}</span>
        <span class="status ${st.open ? 'status--open' : 'status--closed'}">
          <span class="dot"></span>
          ${st.open
            ? `Aberto${st.closesAt ? ` até ${st.closesAt}` : ''}`
            : `Fechado${st.next ? ` · abre ${st.next.label} ${st.next.time}` : ''}`}
        </span>
      </div>
    </div>
    <p class="sign-sub">${esc(S.brand.intro)}</p>
    <div class="sign-facts">
      <span class="fact">${icon('moto', 'icon')} Entrega <b>${dmin}–${dmax} min</b></span>
      <span class="fact">${icon('tag', 'icon')} Taxa desde <b>${brl(minFee)}</b></span>
      <span class="fact">${icon('store', 'icon')} Retirada <b>${S.service.etaPickup[0]}–${S.service.etaPickup[1]} min</b></span>
      <span class="fact">${icon('pin', 'icon')} ${esc(a.street)} — ${esc(a.district)}</span>
    </div>
    <div class="sign-acts">
      <a class="btn btn--ghost" href="${esc(S.contact.maps)}" target="_blank" rel="noopener">
        ${icon('pin', 'icon icon--sm')} Ver no mapa</a>
      <button class="btn btn--ghost" type="button" data-go="#/info">
        ${icon('info', 'icon icon--sm')} Informações</button>
    </div>
  </header>`;
}

/* A montagem do lanche é decorativa: o nome da casa já está no h1 logo
   abaixo, então o palco inteiro fica fora da árvore de acessibilidade. */
function buildStage() {
  const layers = S.brand.build || [];
  if (!layers.length) return '';
  return `
  <div class="build" id="build" aria-hidden="true">
    <span class="build-floor"></span>
    ${layers.map((l, i) => `<img class="bl" src="${esc(l.src)}" alt=""
      style="--w:${l.w}%;--b:${l.b}%;--y:-${l.y ?? 60}%;--i:${i}"
      decoding="async" fetchpriority="${i < 2 ? 'high' : 'low'}">`).join('')}
  </div>`;
}

/* Só começa quando todas as camadas decodificaram — meia montagem é pior que
   nenhuma. Se alguma falhar ou demorar, solta assim mesmo em 1,2 s. */
function armBuild() {
  const stage = document.getElementById('build');
  if (!stage) return;
  const imgs = [...stage.querySelectorAll('.bl')];
  let done = false;
  const start = () => { if (!done) { done = true; stage.classList.add('is-on'); } };
  Promise.all(imgs.map((i) => (i.decode ? i.decode().catch(() => {}) : Promise.resolve())))
    .then(start);
  setTimeout(start, 1200);
  // tocar na pilha remonta o lanche
  stage.addEventListener('click', () => {
    if (!done) return;
    stage.classList.remove('is-on');
    void stage.offsetWidth;
    stage.classList.add('is-on');
  });
}

function mainSlot() {
  const st = openState(S);
  const cats = sel.categories(S);
  const results = query ? searchProducts(query) : null;

  return `
  ${!st.open ? `
    <div class="notice notice--warn">
      ${icon('closedSign', 'icon')}
      <div><b>A cozinha está fechada agora.</b>
      <p style="margin-top:.25rem">Você pode montar o pedido à vontade — o envio libera ${st.next ? `${st.next.label} às ${st.next.time}` : 'no próximo horário de funcionamento'}.</p></div>
    </div>` : ''}

  ${!query ? heroRail() : ''}

  <div class="sticky">
    <div class="searchbox">
      ${icon('search', 'icon')}
      <input class="input" id="q" type="search" inputmode="search" enterkeyhint="search"
        placeholder="Buscar no cardápio" aria-label="Buscar no cardápio" value="${esc(query)}"
        autocomplete="off" autocorrect="off" spellcheck="false">
      ${query ? `<button class="x" type="button" id="qclear" aria-label="Limpar busca">${icon('x', 'icon')}</button>` : ''}
    </div>
    ${!query ? `
    <div class="catrail rail" id="catrail">
      <div class="catrail-track">
        <div class="chips chips--base">${cats.map(chip).join('')}</div>
        <div class="chips chips--on" aria-hidden="true" id="chipson">${cats.map(chip).join('')}</div>
      </div>
    </div>` : ''}
  </div>

  <div id="cardapio">
    ${results ? resultsBlock(results) : (cats.some((c) => sel.productsOf(c.id, S).length) ? cats.map(section).join('') : emptyMenu())}
  </div>

  ${footer()}`;
}

const chip = (c) => `<button class="chip" type="button" data-cat="${c.id}">${icon(c.icon, 'icon')}${esc(c.name)}</button>`;

function heroRail() {
  const picks = [...sel.promos(S), ...sel.top(S).filter((p) => !p.promoPrice),
    ...S.products.filter((p) => p.badges.includes('novo') && p.available)]
    .filter((p, i, a) => a.findIndex((x) => x.id === p.id) === i)
    .slice(0, 4);
  if (!picks.length) return '';
  return `
  <section aria-labelledby="dest-h">
    <div class="rail-h">
      <h2 id="dest-h" style="font-size:var(--step-2);text-transform:uppercase">Destaques da casa</h2>
      <span class="legend">arraste →</span>
    </div>
    <div class="hero-rail rail">${picks.map((p, i) => heroCard(p, i === 0)).join('')}</div>
  </section>`;
}

function heroCard(p, eager = false) {
  const eff = sel.effectivePrice(p);
  return `
  <article class="hero">
    <div class="hero-art">
      ${media(p, 'hero', eager)}
      <div class="hero-tags">${tags(p)}</div>
    </div>
    <div class="hero-body">
      <h3>${esc(p.name)}</h3>
      <p>${esc(p.desc)}</p>
      <div class="hero-price">
        ${p.promoPrice != null ? `<span class="was">${brl(p.price)}</span>` : ''}
        <span class="now fig">${brl(eff)}</span>
      </div>
      <button class="btn btn--primary btn--block" type="button" data-open="${p.id}">
        ${icon('plus', 'icon icon--sm')} Adicionar</button>
    </div>
  </article>`;
}

function section(c) {
  const list = sel.productsOf(c.id, S);
  if (!list.length) return '';
  return `
  <section class="section" id="cat-${c.id}" aria-labelledby="h-${c.id}">
    <div class="section-head">
      <h2 id="h-${c.id}">${esc(c.name)}</h2>
      <span class="count">${list.length} ${list.length === 1 ? 'item' : 'itens'}</span>
    </div>
    <div class="rows">${list.map((p, i) => row(p, i)).join('')}</div>
  </section>`;
}

/* An operator can empty the catalog from the panel. Say so, instead of
   showing a gap between the search box and the footer. */
function emptyMenu() {
  return `
  <div class="empty">
    ${icon('kitchen', 'icon')}
    <h3>O cardápio está sendo montado</h3>
    <p>Nenhum item publicado ainda. Fale com a gente pelo WhatsApp que a gente passa o que tem saindo hoje.</p>
    <a class="btn btn--primary" href="${waLink(S.contact.whatsapp, 'Olá! O cardápio está vazio no site — o que tem hoje?')}"
      target="_blank" rel="noopener">${icon('whatsapp', 'icon icon--sm')} Chamar no WhatsApp</a>
  </div>`;
}

function resultsBlock(list) {
  if (!list.length) {
    return `
    <div class="empty">
      ${icon('search', 'icon')}
      <h3>Nada encontrado para “${esc(query)}”</h3>
      <p>Tente outro termo, ou veja o cardápio inteiro.</p>
      <button class="btn btn--ghost" type="button" id="qclear2">Limpar busca</button>
    </div>`;
  }
  return `
  <section class="section">
    <div class="section-head">
      <h2>Resultados</h2>
      <span class="count">${list.length} ${list.length === 1 ? 'item' : 'itens'}</span>
    </div>
    <div class="rows">${list.map((p, i) => row(p, i)).join('')}</div>
  </section>`;
}

function media(p, where, eager = false) {
  const alt = esc(p.name);
  const load = eager
    ? 'loading="eager" fetchpriority="high" decoding="sync"'
    : 'loading="lazy" decoding="async"';
  if (p.photo) return `<img src="${esc(p.photo)}" alt="${alt}" ${load}>`;
  if (p.img) {
    const b = `assets/img/p/${encodeURIComponent(p.img)}`;
    const sizes = where === 'hero'
      ? '(max-width: 560px) 62vw, 300px'
      : '(max-width: 560px) 26vw, 170px';
    return `<img src="${b}-sm.webp" srcset="${b}-sm.webp 320w, ${b}.webp 760w" sizes="${sizes}"
      alt="${alt}" width="760" height="760" ${load}>`;
  }
  return artSvg(p.art, p.name);
}

function tags(p) {
  const out = [];
  if (p.promoPrice != null) out.push('<span class="badge badge--promo">Promoção</span>');
  if (p.badges.includes('top')) out.push(`<span class="badge badge--top">${icon('flame', 'icon icon--sm')}Mais pedido</span>`);
  if (p.badges.includes('novo')) out.push('<span class="badge badge--new">Novidade</span>');
  if (!p.available) out.push('<span class="badge badge--out">Esgotado</span>');
  return out.join('');
}

function row(p, i = 0) {
  const eff = sel.effectivePrice(p);
  const out = !p.available;
  return `
  <button class="row${out ? ' row--out' : ''}" type="button" data-open="${p.id}"
    data-reveal style="--i:${i % 8}" ${out ? 'aria-disabled="true"' : ''}>
    <span class="row-art">
      ${media(p)}
      ${p.badges.length || p.promoPrice != null ? `<span class="row-tags">${tags(p)}</span>` : ''}
      ${out ? '<span class="stencil"><span>Esgotado</span></span>' : ''}
    </span>
    <span class="row-main">
      <span class="row-name">${esc(p.name)}</span>
      <span class="row-desc">${esc(p.desc)}</span>
      <span class="row-price">
        <span class="now">${brl(eff)}</span>
        ${p.promoPrice != null ? `<span class="was">${brl(p.price)}</span>` : ''}
      </span>
      ${out
        ? '<span class="row-add row-add--out">Esgotado</span>'
        : `<span class="row-add">${icon('plus', 'icon icon--sm')} Adicionar</span>`}
    </span>
  </button>`;
}

function footer() {
  const a = S.contact.address;
  const today = new Date().getDay();
  return `
  <hr class="centerline">
  <footer class="foot">
    <div class="foot-grid">
      <div>
        <h3>A casa</h3>
        <p>${esc(S.brand.about)}</p>
        <div class="social" style="margin-top:1rem">
          <a href="${waLink(S.contact.whatsapp, 'Olá! Vim pelo cardápio da KM 7.')}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('whatsapp', 'icon')}</a>
          <a href="https://instagram.com/${esc(S.contact.instagram)}" target="_blank" rel="noopener" aria-label="Instagram">${icon('instagram', 'icon')}</a>
          <a href="tel:${esc(onlyDigits(S.contact.phone))}" aria-label="Telefone">${icon('phone', 'icon')}</a>
        </div>
      </div>
      <div>
        <h3>Onde fica</h3>
        <ul>
          <li>${esc(a.street)}</li>
          <li>${esc(a.district)} — ${esc(a.city)}/${esc(a.state)}</li>
          <li>CEP ${esc(a.zip)}</li>
          <li style="color:var(--text-3)">${esc(a.reference)}</li>
        </ul>
        <a class="btn btn--ghost" style="margin-top:.75rem" href="${esc(S.contact.maps)}" target="_blank" rel="noopener">
          ${icon('pin', 'icon icon--sm')} Abrir no mapa</a>
      </div>
      <div>
        <h3>Horários</h3>
        <ul>${S.hours.map((h) => `
          <li class="hours-row"${h.day === today ? ' data-today' : ''}>
            <span class="d">${DAYS[h.day]}</span>
            <span class="t">${h.closed ? 'Fechado' : `${h.open} – ${h.close}`}</span>
          </li>`).join('')}</ul>
      </div>
    </div>
    <div class="colofon">
      <p>${esc(S.brand.legal)} · Cardápio digital próprio, sem comissão de marketplace.</p>
      <p style="margin-top:.35rem">Imagens ilustrativas. Bebida alcoólica: venda proibida para menores de 18 anos.
</p>
    </div>
  </footer>`;
}

/* ---------------------------------------------------------------- search */
function norm(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}
function searchProducts(q) {
  const t = norm(q).split(/\s+/).filter(Boolean);
  if (!t.length) return [];
  return S.products.filter((p) => {
    const hay = norm(`${p.name} ${p.desc} ${S.categories.find((c) => c.id === p.categoryId)?.name || ''}`);
    return t.every((w) => hay.includes(w));
  });
}

/* ------------------------------------------------------------- cart bar */
/* Cards arrive in a short cascade as they come into view. Re-armed after each
   render because render() replaces the DOM wholesale. */
let revealObserver = null;
function armReveal() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-in'));
    return;
  }
  revealObserver?.disconnect();
  revealObserver = new IntersectionObserver((entries, obs) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      obs.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  document.querySelectorAll('[data-reveal]:not(.is-in)').forEach((el) => revealObserver.observe(el));

  /* Failsafe: content that is hidden until JS says otherwise must never stay
     hidden. If anything already on screen is still waiting after 1.5s, the
     observer is not doing its job — reveal everything and move on. */
  clearTimeout(armReveal._t);
  armReveal._t = setTimeout(() => {
    const stuck = [...document.querySelectorAll('[data-reveal]:not(.is-in)')]
      .some((el) => { const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; });
    if (stuck) document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-in'));
  }, 1500);
}

function renderCartBar() {
  const bar = document.getElementById('cartbar');
  const t = totals(cart, { mode: 'pickup' });
  if (!cart.length) {
    bar.removeAttribute('data-show');
    document.getElementById('cart-count').textContent = 'Sacola vazia';
    document.getElementById('cart-total').textContent = brl(0);
    document.body.removeAttribute('data-cart');
    setTimeout(() => { if (!cart.length) bar.hidden = true; }, 340);
    return;
  }
  bar.hidden = false;
  requestAnimationFrame(() => bar.setAttribute('data-show', ''));
  document.body.setAttribute('data-cart', '');
  document.getElementById('cart-count').textContent =
    `${t.count} ${t.count === 1 ? 'item' : 'itens'} na sacola`;
  odometer(document.getElementById('cart-total'), brl(t.subtotal));
}

function bumpCart() {
  const bar = document.getElementById('cartbar');
  if (!bar) return;
  bar.classList.remove('bump');
  void bar.offsetWidth;          // restart the animation even on rapid adds
  bar.classList.add('bump');
}

function persist() {
  if (!store.saveCart(cart)) {
    toast('Não consegui salvar a sacola neste navegador.', { type: 'err', icon: icon('alert', 'icon') });
  }
  renderCartBar();
}

/* --------------------------------------------------------- product sheet */
function openProduct(id, route) {
  const p = sel.product(id, S);
  if (!p) { toast('Esse item não está mais no cardápio.', { type: 'err', icon: icon('alert', 'icon') }); return; }

  if (!p.available) {
    sheet({
      title: esc(p.name),
      body: `
        <div class="ps-art ps-art--out">${media(p, 'sheet')}<span class="stencil"><span>Esgotado</span></span></div>
        <div class="empty" style="padding-top:0">
          ${icon('closedSign', 'icon')}
          <h3>Esgotado por hoje</h3>
          <p>${esc(p.name)} acabou. Dá uma olhada no que ainda tem saindo da chapa.</p>
        </div>`,
      foot: `<button class="btn btn--ghost btn--block" type="button" data-close>Voltar ao cardápio</button>`,
      onClose: () => leaveRoute(route),
    });
    return;
  }

  const state = { qty: 1, variations: {}, addons: new Map(), note: '' };
  const groups = (p.addonGroups || []).map((g) => sel.addonGroup(g, S)).filter(Boolean);

  const body = `
    <div class="ps-art">
      ${media(p, 'sheet')}
      ${p.badges.length || p.promoPrice != null ? `<div class="ps-tags">${tags(p)}</div>` : ''}
    </div>
    <p class="ps-desc">${esc(p.desc)}</p>
    <div class="ps-price">
      <span class="now">${brl(sel.effectivePrice(p))}</span>
      ${p.promoPrice != null ? `<span class="was">${brl(p.price)}</span>` : ''}
    </div>

    ${(p.variations || []).map((g) => `
      <fieldset class="group" data-group="${g.id}" data-required="${g.required ? 1 : 0}">
        <div class="group-h">
          <h3>${esc(g.name)}</h3>
          ${g.required ? '<span class="req">Obrigatório</span>' : '<span class="opt">Opcional</span>'}
        </div>
        <div class="group-list">
          ${g.options.map((o) => `
            <label class="choice tap">
              <input type="radio" name="v-${g.id}" value="${o.id}" ${o.available ? '' : 'disabled'}>
              <span class="ch-name">${esc(o.name)}${o.available ? '' : ' — esgotado'}</span>
              ${o.priceDelta ? `<span class="ch-price fig">+ ${brl(o.priceDelta)}</span>` : ''}
            </label>`).join('')}
        </div>
        <p class="err" data-err></p>
      </fieldset>`).join('')}

    ${groups.map((g) => `
      <fieldset class="group" data-addons="${g.id}" data-max="${g.max}">
        <div class="group-h">
          <h3>${esc(g.name)}</h3>
          <span class="opt">até ${g.max}</span>
        </div>
        <div class="group-list">
          ${g.options.map((o) => `
            <label class="choice tap">
              <input type="checkbox" name="a-${g.id}" value="${o.id}" ${o.available ? '' : 'disabled'}>
              <span class="ch-name">${esc(o.name)}${o.available ? '' : ' — esgotado'}</span>
              ${o.price ? `<span class="ch-price fig">+ ${brl(o.price)}</span>` : ''}
            </label>`).join('')}
        </div>
      </fieldset>`).join('')}

    <div class="group">
      <div class="group-h"><h3>Alguma observação?</h3><span class="opt">opcional</span></div>
      <textarea class="textarea" id="pnote" maxlength="240" rows="2"
        placeholder="Ex.: ponto da carne bem passado, sem cebola, entregar na portaria"></textarea>
    </div>

    ${suggestionsBlock(p)}
  `;

  const foot = `
    <div class="addbar">
      <div class="qty">
        <button type="button" data-q="-1" aria-label="Diminuir quantidade" disabled>${icon('minus', 'icon icon--sm')}</button>
        <span class="qty-val" id="pq" aria-live="polite">1</span>
        <button type="button" data-q="1" aria-label="Aumentar quantidade">${icon('plus', 'icon icon--sm')}</button>
      </div>
      <button class="btn btn--primary btn--lg" type="button" id="padd">
        Adicionar <span class="fig" id="pprice">${brl(sel.effectivePrice(p))}</span>
      </button>
    </div>`;

  const sh = sheet({
    title: esc(p.name), body, foot, onClose: () => leaveRoute(route),
    onMount(el) {
      const price = el.querySelector('#pprice');
      const qv = el.querySelector('#pq');
      const minus = el.querySelector('[data-q="-1"]');
      const plus = el.querySelector('[data-q="1"]');

      const recalc = () => {
        const addons = [...state.addons.values()];
        const unit = unitPrice(p, state.variations, addons);
        price.textContent = brl(unit * state.qty);
      };

      el.addEventListener('change', (e) => {
        const inp = e.target;
        if (inp.type === 'radio') {
          const gid = inp.closest('[data-group]').dataset.group;
          state.variations[gid] = inp.value;
          const fs = inp.closest('[data-group]');
          fs.querySelector('[data-err]').textContent = '';
          fs.removeAttribute('data-invalid');
        }
        if (inp.type === 'checkbox') {
          const fs = inp.closest('[data-addons]');
          const gid = fs.dataset.addons;
          const max = Number(fs.dataset.max);
          const g = sel.addonGroup(gid, S);
          const o = g.options.find((x) => x.id === inp.value);
          const key = `${gid}:${inp.value}`;
          if (inp.checked) state.addons.set(key, { ...o, groupId: gid });
          else state.addons.delete(key);
          const checked = fs.querySelectorAll('input:checked').length;
          fs.querySelectorAll('input:not(:checked)').forEach((x) => {
            const opt = g.options.find((y) => y.id === x.value);
            x.disabled = checked >= max || !opt?.available;
          });
        }
        recalc();
      });

      el.querySelector('#pnote').addEventListener('input', (e) => { state.note = e.target.value; });

      const setQty = (n) => {
        state.qty = Math.max(1, Math.min(99, n));
        qv.textContent = state.qty;
        minus.disabled = state.qty <= 1;
        plus.disabled = state.qty >= 99;
        recalc();
      };
      minus.addEventListener('click', () => setQty(state.qty - 1));
      plus.addEventListener('click', () => setQty(state.qty + 1));

      el.querySelector('#padd').addEventListener('click', () => {
        const bad = [...el.querySelectorAll('[data-group][data-required="1"]')]
          .find((fs) => !state.variations[fs.dataset.group]);
        if (bad) {
          bad.setAttribute('data-invalid', '');
          bad.querySelector('[data-err]').innerHTML =
            `${icon('alert', 'icon icon--sm')} Escolha uma opção para continuar.`;
          bad.scrollIntoView({ behavior: 'smooth', block: 'center' });
          bad.querySelector('input:not([disabled])')?.focus();
          return;
        }
        const item = makeItem(p, {
          variations: state.variations,
          addons: [...state.addons.values()],
          note: state.note,
          qty: state.qty,
        });
        cart = addTo(cart, item);
        persist();
        bumpCart();
        sh.close();
        toast(`${state.qty}× ${p.name} na sacola`, { icon: icon('checkCircle', 'icon') });
      });
    },
  });
}

function suggestionsBlock(p) {
  const list = (p.suggestions || []).map((id) => sel.product(id, S)).filter((x) => x && x.available);
  if (!list.length) return '';
  return `
  <div class="group">
    <div class="group-h"><h3>Vai bem com</h3></div>
    <div class="hero-rail rail" style="grid-auto-columns:150px;margin:0;padding:0 0 .5rem">
      ${list.map((s) => `
        <button class="row" type="button" data-open="${s.id}" style="flex-direction:column;gap:.5rem;padding:.6rem">
          <span class="row-art" style="width:100%;height:84px">${media(s, 'row')}</span>
          <span class="row-main" style="width:100%">
            <span class="row-name" style="font-size:var(--step-0)">${esc(s.name)}</span>
            <span class="now fig" style="font-size:var(--step--1);color:var(--text-2)">${brl(sel.effectivePrice(s))}</span>
          </span>
        </button>`).join('')}
    </div>
  </div>`;
}

/* ------------------------------------------------------------ cart sheet */
function openCart(route) {
  if (!cart.length) {
    sheet({
      title: 'Sua sacola',
      body: `
        <div class="empty">
          ${icon('bag', 'icon')}
          <h3>A sacola está vazia</h3>
          <p>Escolha um hambúrguer, um combo ou uma porção e ele aparece aqui.</p>
          <button class="btn btn--primary" type="button" data-close>Ver o cardápio</button>
        </div>`,
      onClose: () => leaveRoute(route),
    });
    return;
  }

  const sh = sheet({
    title: 'Sua sacola',
    body: `<div id="cart-list">${cartList()}</div>`,
    foot: `
      <button class="btn btn--primary btn--lg btn--block" type="button" id="to-checkout">
        Continuar <span class="fig" id="cart-sub">${brl(totals(cart, { mode: 'pickup' }).subtotal)}</span>
      </button>
      <button class="btn btn--quiet btn--block" type="button" data-close>Adicionar mais itens</button>`,
    onClose: () => leaveRoute(route),
    onMount(el) {
      const refresh = () => {
        // persiste SEMPRE, inclusive ao esvaziar: antes o retorno antecipado
        // deixava a barra e o localStorage com o item já removido.
        persist();
        if (!cart.length) {
          el.querySelector('#cart-list').innerHTML = `
            <div class="empty">
              ${icon('bag', 'icon')}
              <h3>A sacola está vazia</h3>
              <p>Escolha um hambúrguer, um combo ou uma porção e ele aparece aqui.</p>
              <button class="btn btn--primary" type="button" data-close>Ver o cardápio</button>
            </div>`;
          el.querySelector('[data-foot]')?.setAttribute('hidden', '');
          return;
        }
        el.querySelector('[data-foot]')?.removeAttribute('hidden');
        el.querySelector('#cart-list').innerHTML = cartList();
        el.querySelector('#cart-sub').textContent = brl(totals(cart, { mode: 'pickup' }).subtotal);
      };
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-ci]');
        if (!b) return;
        const { ci, act } = b.dataset;
        const item = cart.find((i) => i.uid === ci);
        if (!item) return;
        if (act === 'inc') item.qty = Math.min(99, item.qty + 1);
        if (act === 'dec' && item.qty > 1) item.qty--;
        if (act === 'del') {
          const removed = { ...item };
          const at = cart.findIndex((i) => i.uid === ci);
          cart = cart.filter((i) => i.uid !== ci);
          toast(`${removed.name} removido`, {
            icon: icon('trash', 'icon'),
          });
          // undo: tapping the toast restores the line in place
          const tEl = document.querySelector('.toaster .toast:last-child');
          if (tEl) {
            tEl.insertAdjacentHTML('beforeend',
              '<button class="btn btn--quiet" style="margin-left:auto;min-height:32px;padding:0 .6rem" data-undo>Desfazer</button>');
            tEl.querySelector('[data-undo]').addEventListener('click', (ev) => {
              ev.stopPropagation();
              cart.splice(Math.min(at, cart.length), 0, removed);
              tEl.remove(); refresh();
            });
          }
        }
        refresh();
      });
      el.querySelector('#to-checkout').addEventListener('click', () => go('#/checkout'));
    },
  });
}

function cartList() {
  const t = totals(cart, { mode: 'pickup' });
  return cart.map((i) => `
    <div class="ci">
      <div class="ci-art">${i.photo
        ? `<img src="${esc(i.photo)}" alt="" loading="lazy" decoding="async">`
        : i.img
          ? `<img src="assets/img/p/${encodeURIComponent(i.img)}-sm.webp" alt="" loading="lazy" decoding="async">`
          : artSvg(i.art, '')}</div>
      <div class="ci-main">
        <div class="ci-name">${esc(i.name)}</div>
        ${i.variationLabels.length || i.addons.length ? `
          <ul class="ci-mods">
            ${i.variationLabels.map((v) => `<li>• ${esc(v.label)}</li>`).join('')}
            ${i.addons.map((a) => `<li>+ ${esc(a.name)}${a.price ? ` (${brl(a.price)})` : ''}</li>`).join('')}
          </ul>` : ''}
        ${i.note ? `<div class="ci-note">“${esc(i.note)}”</div>` : ''}
        <div class="ci-foot">
          <span class="qty">
            <button type="button" data-ci="${i.uid}" data-act="dec" ${i.qty <= 1 ? 'disabled' : ''}
              aria-label="Diminuir ${esc(i.name)}">${icon('minus', 'icon icon--sm')}</button>
            <span class="qty-val">${i.qty}</span>
            <button type="button" data-ci="${i.uid}" data-act="inc" aria-label="Aumentar ${esc(i.name)}">
              ${icon('plus', 'icon icon--sm')}</button>
          </span>
          <button class="btn btn--quiet" style="min-height:34px;padding:0 .5rem"
            data-ci="${i.uid}" data-act="del" type="button">${icon('trash', 'icon icon--sm')}<span class="sr">Remover ${esc(i.name)}</span></button>
          <span class="price">${brl(i.unit * i.qty)}</span>
        </div>
      </div>
    </div>`).join('') + `
    <div class="summary">
      <div class="sumrow"><span>Subtotal</span><span class="v">${brl(t.subtotal)}</span></div>
      ${t.savings ? `<div class="sumrow sumrow--save"><span>Economia nas promoções</span><span class="v">− ${brl(t.savings)}</span></div>` : ''}
      <div class="sumrow" style="color:var(--text-3)"><span>Entrega</span><span class="v v--text" style="color:var(--text-3)">no próximo passo</span></div>
    </div>`;
}

/* -------------------------------------------------------------- checkout */
function openCheckout(route) {
  if (!cart.length) { go('#/sacola'); return; }
  const st = openState(S);
  const svc = S.service;
  const form = {
    mode: svc.delivery ? 'delivery' : 'pickup',
    name: '', phone: '', street: S.contact.address.street, number: '', complement: '',
    district: svc.districts[0].name, reference: '', payment: '', changeFor: null, notes: '',
  };

  const sh = sheet({
    title: 'Finalizar pedido',
    body: `
      ${S.contact.whatsapp === DEMO_WHATSAPP ? `
        <div class="notice" style="margin-bottom:1rem">
          ${icon('info', 'icon')}
          <div><b>Cardápio em modo demonstração.</b>
          <p style="margin-top:.25rem">O número de WhatsApp ainda é o de exemplo. O pedido é montado de verdade — só troque o número no painel antes de usar com clientes.</p></div>
        </div>` : ''}
      ${!st.open ? `
        <div class="notice notice--warn" style="margin-bottom:1rem">
          ${icon('closedSign', 'icon')}
          <div><b>Fechado agora.</b>
          <p style="margin-top:.25rem">O envio do pedido libera ${st.next ? `${st.next.label} às ${st.next.time}` : 'no próximo horário'}.</p></div>
        </div>` : ''}

      <div class="seg" role="radiogroup" aria-label="Como você quer receber">
        <label class="tap">
          <input type="radio" name="mode" value="delivery" ${form.mode === 'delivery' ? 'checked' : ''} ${svc.delivery ? '' : 'disabled'}>
          ${icon('moto', 'icon icon--sm')} Entrega</label>
        <label class="tap">
          <input type="radio" name="mode" value="pickup" ${form.mode === 'pickup' ? 'checked' : ''} ${svc.pickup ? '' : 'disabled'}>
          ${icon('store', 'icon icon--sm')} Retirada</label>
      </div>

      <fieldset class="fieldset">
        <legend>Seus dados</legend>
        <div class="fields">
          <label class="field"><span class="lbl">Nome</span>
            <input class="input" name="name" autocomplete="name" enterkeyhint="next"
              placeholder="Como te chamamos" required>
            <p class="err" data-err="name"></p></label>
          <label class="field"><span class="lbl">WhatsApp / telefone</span>
            <input class="input" name="phone" type="tel" inputmode="numeric" autocomplete="tel"
              enterkeyhint="next" placeholder="(11) 90000-0000" maxlength="16" required>
            <p class="err" data-err="phone"></p></label>
        </div>
      </fieldset>

      <fieldset class="fieldset" data-only="delivery">
        <legend>Endereço de entrega</legend>
        <div class="fields">
          <label class="field"><span class="lbl">Rua</span>
            <input class="input" name="street" autocomplete="address-line1" enterkeyhint="next" placeholder="Nome da rua">
            <p class="err" data-err="street"></p></label>
          <div class="two">
            <label class="field"><span class="lbl">Número</span>
              <input class="input" name="number" inputmode="numeric" enterkeyhint="next" placeholder="123">
              <p class="err" data-err="number"></p></label>
            <label class="field"><span class="lbl">Complemento</span>
              <input class="input" name="complement" enterkeyhint="next" placeholder="Ap, bloco"></label>
          </div>
          <label class="field"><span class="lbl">Bairro</span>
            <select class="select" name="district">
              ${svc.districts.map((d) => `<option value="${esc(d.name)}">${esc(d.name)} — ${d.fee ? brl(d.fee) : 'grátis'}</option>`).join('')}
            </select></label>
          <label class="field"><span class="lbl">Ponto de referência</span>
            <input class="input" name="reference" enterkeyhint="next" placeholder="Portão azul, ao lado da padaria"></label>
        </div>
      </fieldset>

      <fieldset class="fieldset" data-only="pickup" hidden>
        <legend>Retirada no balcão</legend>
        <div class="notice" style="margin:0">
          ${icon('store', 'icon')}
          <div><b>${esc(S.contact.address.street)}</b>
          <p style="margin-top:.2rem">${esc(S.contact.address.district)} — ${esc(S.contact.address.city)}/${esc(S.contact.address.state)}.
          Fica pronto em ${svc.etaPickup[0]} a ${svc.etaPickup[1]} minutos.</p></div>
        </div>
      </fieldset>

      <fieldset class="fieldset">
        <legend>Pagamento</legend>
        <div class="group-list">
          ${S.payments.filter((p) => p.active).map((p) => `
            <label class="choice tap">
              <input type="radio" name="payment" value="${p.id}">
              <span class="ch-name">${esc(p.label)}</span>
              ${icon(p.icon, 'icon')}
            </label>`).join('')}
        </div>
        <p class="err" data-err="payment"></p>
        <div id="troco" hidden style="margin-top:.75rem">
          <label class="field"><span class="lbl">Precisa de troco para quanto?</span>
            <input class="input" name="changeFor" inputmode="decimal" placeholder="Ex.: 100,00">
            <p class="err" data-err="changeFor"></p>
            <p style="margin-top:.4rem;font-size:var(--step--1);color:var(--text-3)">Deixe em branco se levar o valor certo.</p>
          </label>
        </div>
        ${S.onlinePayment.enabled ? '' : `
          <p style="margin-top:.75rem;font-size:var(--step--1);color:var(--text-3)">
            Pagamento on-line pelo site ainda não está integrado. O pagamento é combinado na entrega ou na retirada.</p>`}
      </fieldset>

      <fieldset class="fieldset">
        <legend>Observações do pedido</legend>
        <textarea class="textarea" name="notes" rows="2" maxlength="300"
          placeholder="Ex.: interfone quebrado, ligar ao chegar"></textarea>
      </fieldset>

      <div class="summary" id="co-sum"></div>
    `,
    foot: `
      <button class="btn btn--primary btn--lg btn--block" type="button" id="send"
        ${st.open ? '' : 'aria-disabled="true"'}>
        ${icon('whatsapp', 'icon')} ${st.open ? 'Enviar pedido pelo WhatsApp' : 'Fechado — não dá para enviar agora'}
      </button>
      <p style="text-align:center;font-size:var(--step--1);color:var(--text-3)">
        O pedido abre no WhatsApp já escrito. Nada é cobrado por aqui.</p>`,
    onClose: () => leaveRoute(route),
    onMount(el) {
      const $ = (s) => el.querySelector(s);
      const sum = $('#co-sum');

      const feeOf = () => svc.districts.find((d) => d.name === form.district)?.fee ?? svc.defaultFee;
      const calc = () => totals(cart, { feeCents: feeOf(), freeAbove: svc.freeDeliveryAbove, mode: form.mode });

      const paint = () => {
        const t = calc();
        const eta = form.mode === 'delivery' ? svc.etaDelivery : svc.etaPickup;
        sum.innerHTML = `
          <div class="sumrow"><span>Subtotal (${t.count} ${t.count === 1 ? 'item' : 'itens'})</span><span class="v">${brl(t.subtotal)}</span></div>
          ${t.savings ? `<div class="sumrow sumrow--save"><span>Economia nas promoções</span><span class="v">− ${brl(t.savings)}</span></div>` : ''}
          ${form.mode === 'delivery'
            ? (t.freeDelivery
              ? `<div class="sumrow sumrow--free"><span>Entrega (${esc(form.district)})</span><span class="v">grátis</span></div>`
              : `<div class="sumrow"><span>Entrega (${esc(form.district)})</span><span class="v">${brl(t.fee)}</span></div>`)
            : '<div class="sumrow"><span>Retirada no balcão</span><span class="v">sem taxa</span></div>'}
          <div class="sumrow sumrow--total"><span>Total</span><span class="v">${brl(t.total)}</span></div>
          <p style="font-size:var(--step--1);color:var(--text-3)">Previsão: ${eta[0]} a ${eta[1]} minutos após a confirmação.</p>
          ${form.mode === 'delivery' && !t.freeDelivery && svc.freeDeliveryAbove
            ? `<p style="font-size:var(--step--1);color:var(--accent-2)">Faltam ${brl(svc.freeDeliveryAbove - t.subtotal)} para a entrega sair de graça.</p>` : ''}`;
      };

      const showMode = () => {
        el.querySelectorAll('[data-only]').forEach((f) => { f.hidden = f.dataset.only !== form.mode; });
        paint();
      };

      el.addEventListener('input', (e) => {
        const n = e.target.name;
        if (!n) return;
        if (n === 'phone') e.target.value = maskPhone(e.target.value);
        form[n] = e.target.value;
        el.querySelector(`[data-err="${n}"]`)?.replaceChildren();
        e.target.removeAttribute('aria-invalid');
      });
      el.addEventListener('change', (e) => {
        const n = e.target.name;
        if (n === 'mode') { form.mode = e.target.value; showMode(); }
        if (n === 'district') { form.district = e.target.value; paint(); }
        if (n === 'payment') {
          form.payment = e.target.value;
          $('#troco').hidden = e.target.value !== 'dinheiro';
          el.querySelector('[data-err="payment"]').replaceChildren();
        }
      });

      showMode();

      $('#send').addEventListener('click', (ev) => {
        const live = openState(S);
        if (!live.open) {
          toast('A cozinha está fechada — o pedido não pode ser enviado agora.', { type: 'err', icon: icon('alert', 'icon') });
          return;
        }
        const t = calc();
        const errs = validate(form, t, el);
        if (errs) return;

        const payLabel = S.payments.find((p) => p.id === form.payment)?.label || form.payment;
        const code = 'KM' + String(S.seq).padStart(4, '0');
        const text = buildMessage({
          items: cart, totals: t,
          form: { ...form, paymentLabel: payLabel },
          state: S, code,
        });
        const link = waLink(S.contact.whatsapp, text);

        // open inside the gesture, or the browser blocks it
        const a = document.createElement('a');
        a.href = link; a.target = '_blank'; a.rel = 'noopener';
        document.body.appendChild(a); a.click(); a.remove();

        store.recordOrder({
          type: form.mode, customer: { ...form }, items: cart,
          totals: t, payment: form.payment, paymentLabel: payLabel, message: text,
        }).then(() => {
          cart = []; store.clearCart(); persist();
          sh.close();
          home();
          setTimeout(() => successSheet(code, link), 240);
        });
      });

      function validate(f, t, root) {
        const fail = (name, msg) => {
          const p = root.querySelector(`[data-err="${name}"]`);
          if (p) p.innerHTML = `${icon('alert', 'icon icon--sm')} ${esc(msg)}`;
          const input = root.querySelector(`[name="${name}"]`);
          input?.setAttribute('aria-invalid', 'true');
          input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          input?.focus({ preventScroll: true });
          return true;
        };
        if (f.name.trim().length < 2) return fail('name', 'Diga seu nome para a gente chamar na entrega.');
        if (onlyDigits(f.phone).length < 10) return fail('phone', 'Telefone incompleto — com DDD, 10 ou 11 dígitos.');
        if (f.mode === 'delivery') {
          if (!f.street.trim()) return fail('street', 'Falta o nome da rua.');
          if (!f.number.trim()) return fail('number', 'Falta o número. Se não tem, escreva “s/n”.');
        }
        if (!f.payment) {
          root.querySelector('[data-err="payment"]').innerHTML =
            `${icon('alert', 'icon icon--sm')} Escolha como vai pagar.`;
          root.querySelector('[name="payment"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return true;
        }
        if (f.payment === 'dinheiro' && String(f.changeFor || '').trim()) {
          const cents = parseBrl(f.changeFor);
          if (cents <= t.total) {
            return fail('changeFor', `Precisa ser maior que o total (${brl(t.total)}). Deixe em branco se levar o valor certo.`);
          }
          f.changeFor = cents;
        } else { f.changeFor = null; }
        if (t.subtotal < S.service.minOrder && f.mode === 'delivery') {
          toast(`Pedido mínimo para entrega: ${brl(S.service.minOrder)}.`, { type: 'err', icon: icon('alert', 'icon') });
          return true;
        }
        return false;
      }
    },
  });
}

function successSheet(code, link) {
  sheet({
    title: 'Pedido enviado',
    body: `
      <div class="empty" style="padding-top:.5rem">
        ${icon('checkCircle', 'icon', 'style="color:var(--ok);width:40px;height:40px"')}
        <h3>Pedido ${esc(code)} a caminho do balcão</h3>
        <p>Abrimos o WhatsApp com o pedido já escrito. <b>Toque em enviar lá dentro</b> — é o envio que confirma.</p>
      </div>
      <div class="notice" style="margin-top:.5rem">
        ${icon('info', 'icon')}
        <div>Não abriu o WhatsApp? <a href="${esc(link)}" target="_blank" rel="noopener">Abrir manualmente</a>.</div>
      </div>`,
    foot: `<button class="btn btn--primary btn--block" type="button" data-close>Voltar ao cardápio</button>`,
  });
}

/* ----------------------------------------------------------- info sheet */
function openInfo(route) {
  const a = S.contact.address;
  const st = openState(S);
  const today = new Date().getDay();
  sheet({
    title: 'Informações',
    body: `
      <div class="infodoc">
      <span class="status ${st.open ? 'status--open' : 'status--closed'}" style="margin-top:0">
        <span class="dot"></span>${st.open ? `Aberto${st.closesAt ? ` até ${st.closesAt}` : ''}` : 'Fechado agora'}</span>
      <p class="ps-desc" style="margin-top:1rem">${esc(S.brand.about)}</p>

      <div class="group"><div class="group-h"><h3>Endereço</h3></div>
        <p class="muted">${esc(a.street)}<br>${esc(a.district)} — ${esc(a.city)}/${esc(a.state)}<br>CEP ${esc(a.zip)}</p>
        <p style="margin-top:.4rem;color:var(--text-3);font-size:var(--step--1)">${esc(a.reference)}</p>
        <a class="btn btn--ghost btn--block" style="margin-top:.75rem" href="${esc(S.contact.maps)}" target="_blank" rel="noopener">
          ${icon('pin', 'icon icon--sm')} Abrir no mapa</a>
      </div>

      <div class="group"><div class="group-h"><h3>Horários</h3></div>
        <ul style="list-style:none;padding:0;margin:0;display:grid;gap:6px">
          ${S.hours.map((h) => `<li class="hours-row"${h.day === today ? ' data-today' : ''}>
            <span class="d">${DAYS[h.day]}</span>
            <span class="t">${h.closed ? 'Fechado' : `${h.open} – ${h.close}`}</span></li>`).join('')}
        </ul>
      </div>

      <div class="group"><div class="group-h"><h3>Entrega</h3></div>
        <ul style="list-style:none;padding:0;margin:0;display:grid;gap:6px">
          ${S.service.districts.map((d) => `<li class="hours-row">
            <span class="d">${esc(d.name)}</span>
            <span class="t">${d.fee ? brl(d.fee) : 'grátis'}</span></li>`).join('')}
        </ul>
        <p style="margin-top:.6rem;font-size:var(--step--1);color:var(--text-3)">
          Pedido mínimo ${brl(S.service.minOrder)} para entrega.
          ${S.service.freeDeliveryAbove ? `Entrega grátis acima de ${brl(S.service.freeDeliveryAbove)}.` : ''}
          Previsão de ${S.service.etaDelivery[0]} a ${S.service.etaDelivery[1]} minutos.</p>
      </div>

      <div class="group"><div class="group-h"><h3>Formas de pagamento</h3></div>
        <p class="muted">${S.payments.filter((p) => p.active).map((p) => esc(p.label)).join(' · ')}</p>
        ${S.pixKey ? `<p style="margin-top:.4rem;font-size:var(--step--1);color:var(--text-3)">Chave Pix: ${esc(S.pixKey)}</p>` : ''}
        <p style="margin-top:.4rem;font-size:var(--step--1);color:var(--text-3)">
          O pagamento acontece na entrega ou na retirada. Não cobramos nada pelo site.</p>
      </div>

      <div class="group"><div class="group-h"><h3>Falar com a gente</h3></div>
        <div class="social">
          <a href="${waLink(S.contact.whatsapp, 'Olá! Vim pelo cardápio.')}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('whatsapp', 'icon')}</a>
          <a href="https://instagram.com/${esc(S.contact.instagram)}" target="_blank" rel="noopener" aria-label="Instagram">${icon('instagram', 'icon')}</a>
          <a href="tel:${esc(onlyDigits(S.contact.phone))}" aria-label="Telefone">${icon('phone', 'icon')}</a>
        </div>
      </div>
      </div>`,
    foot: `<button class="btn btn--ghost btn--block" type="button" data-close>Fechar</button>`,
    onClose: () => leaveRoute(route),
  });
}

/* --------------------------------------------------------------- routing
   One history entry for "a sheet is open", whatever the sheet. Swapping
   sheets replaces it, so the phone's back button (and the X) always land
   back on the menu instead of walking a trail of reopened sheets. */
function go(hash) {
  if (topSheet()) history.replaceState(null, '', hash);
  else history.pushState(null, '', hash);
  syncRoute();
}
function home() {
  history.replaceState(null, '', location.pathname + location.search);
  currentRoute = '';
}
/* A sheet only navigates on close when it still owns the current route —
   its onClose fires after the exit transition, by which time the route may
   already belong to the sheet that replaced it. */
function leaveRoute(route) {
  if (location.hash === route) history.back();
}
function syncRoute() {
  const h = location.hash || '';
  if (h === currentRoute) return;
  currentRoute = h;
  closeAllSheets();
  if (h.startsWith('#/item/')) openProduct(decodeURIComponent(h.slice(7)), h);
  else if (h === '#/sacola') openCart(h);
  else if (h === '#/checkout') openCheckout(h);
  else if (h === '#/info') openInfo(h);
}

/* ---------------------------------------------------------------- events */
function wireGlobal() {
  addEventListener('hashchange', syncRoute);
  addEventListener('popstate', syncRoute);

  document.addEventListener('click', (e) => {
    const open = e.target.closest('[data-open]');
    if (open) { go('#/item/' + encodeURIComponent(open.dataset.open)); return; }

    const goEl = e.target.closest('[data-go]');
    if (goEl) { go(goEl.dataset.go); return; }

    const cat = e.target.closest('[data-cat]');
    if (cat) {
      const t = document.getElementById('cat-' + cat.dataset.cat);
      activeCat = cat.dataset.cat;
      paintActiveChip();
      t?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (e.target.closest('#qclear, #qclear2')) {
      query = ''; render();
      document.getElementById('q')?.focus();
      return;
    }
  });

  document.getElementById('open-cart').addEventListener('click', () => go('#/sacola'));

  document.addEventListener('input', debounce((e) => {
    if (e.target.id !== 'q') return;
    const v = e.target.value;
    const atEnd = e.target.selectionStart === v.length;
    query = v;
    render();
    const n = document.getElementById('q');
    if (n) { n.focus(); if (atEnd) n.setSelectionRange(v.length, v.length); }
  }, 220));

  const top = document.getElementById('totop');
  top.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      top.toggleAttribute('data-show', scrollY > 700);
      spyCategory();
      ticking = false;
    });
  }, { passive: true });
}

/* which section am I in? drives the chip indicator */
function spyCategory() {
  if (query) return;
  const secs = [...document.querySelectorAll('.section[id^="cat-"]')];
  if (!secs.length) return;
  const y = scrollY + 150;
  let found = secs[0].id.slice(4);
  for (const s of secs) if (s.offsetTop <= y) found = s.id.slice(4);
  if (found !== activeCat) { activeCat = found; paintActiveChip(); }
}

/* the active chip is a clip-path window onto an inverted copy of the row —
   the colour flips cleanly instead of crossfading through mud */
function paintActiveChip() {
  const on = document.getElementById('chipson');
  const track = on?.parentElement;
  if (!on || !track) return;
  const chips = [...on.querySelectorAll('.chip')];
  const i = chips.findIndex((c) => c.dataset.cat === activeCat);
  if (i < 0) { on.style.clipPath = 'inset(0 100% 0 0)'; return; }
  const c = chips[i];
  const w = track.offsetWidth;
  const left = c.offsetLeft;
  const right = w - (c.offsetLeft + c.offsetWidth);
  on.style.clipPath = `inset(-4px ${right}px -4px ${left}px round 999px)`;
}
addEventListener('resize', paintActiveChip);
