/* ===========================================================================
   KM 7 — painel do restaurante (Operate).
   Every control here writes to the same store the menu reads. Nothing is
   decorative: anything that is not wired up says so in words.
   =========================================================================== */

import * as store from './store.js';
import { sel, openState, ORDER_STATUS } from './store.js';
import { DEMO_WHATSAPP, SEED } from './config.js';
import { artSvg, artKeys } from './art.js';

/* photos shipped with the project; the operator can also paste a URL */
const BUNDLED = [
  'burger-classico', 'burger-duplo', 'burger-bacon', 'burger-onion', 'burger-frango',
  'fritas', 'fritas-cheddar', 'aneis', 'nuggets', 'molhos',
  'refri-cola', 'suco-vermelho', 'shake-chocolate', 'shake-morango',
  'brownie', 'brownie-sorvete', 'combo-classic', 'combo-double', 'combo-dupla',
];
import { icon, iconNames } from './icons.js';
import { brl, parseBrl } from './cart.js';
import { esc, toast, sheet, maskPhone, onlyDigits } from './ui.js';

const DAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const GATE_KEY = 'menu.admin.session';
const TABS = [
  { id: 'pedidos', label: 'Pedidos', icon: 'note' },
  { id: 'cardapio', label: 'Cardápio', icon: 'list' },
  { id: 'loja', label: 'Loja', icon: 'store' },
  { id: 'visual', label: 'Visual', icon: 'tag' },
  { id: 'dados', label: 'Dados', icon: 'sliders' },
];

let S = null;
let tab = location.hash.replace('#', '') || 'pedidos';
if (!TABS.some((t) => t.id === tab)) tab = 'pedidos';
const root = document.getElementById('root');

/* ------------------------------------------------------------------ boot */
(async function boot() {
  S = await store.init();
  applyTheme(S.theme);
  if (!S.admin) await store.commit((s) => { s.admin = { pin: '7777' }; });
  store.subscribe((s) => { S = s; applyTheme(S.theme); paint(); });
  paint();
})();

function applyTheme(theme) {
  const r = document.documentElement;
  for (const [k, v] of Object.entries(theme || {})) r.style.setProperty(k, v);
}

const unlocked = () => sessionStorage.getItem(GATE_KEY) === '1';

function paint() {
  root.innerHTML = unlocked() ? shell() : gate();
  if (unlocked()) wireShell(); else wireGate();
}

/* ------------------------------------------------------------------ gate */
function gate() {
  return `
  <div class="gate">
    <div class="gate-card">
      <img class="gate-mark" src="${esc(S.brand.logoDark)}" alt="${esc(S.brand.legal)}" width="620" height="290">
      <h1 style="font-size:var(--step-2)">Painel ${esc(S.brand.name)}</h1>
      <p class="hint" style="margin-top:.5rem">Digite o código de acesso para gerenciar o cardápio.</p>
      <form class="pinrow" id="pinform" autocomplete="off">
        ${[0, 1, 2, 3].map((i) => `<input class="input" inputmode="numeric" maxlength="1" pattern="[0-9]"
          aria-label="Dígito ${i + 1}" data-pin="${i}">`).join('')}
      </form>
      <p class="err" id="pinerr" style="justify-content:center"></p>
      <div class="flag flag--info" style="margin-top:1.25rem;text-align:left">
        ${icon('info', 'icon')}
        <div><b>Trava local de demonstração.</b> O código é guardado neste navegador — não é autenticação de verdade.
        Com um backend, isto vira login com senha e sessão (há um passo a passo no README).
        Código inicial: <b>7777</b>, trocável na aba Dados.</div>
      </div>
    </div>
  </div>`;
}

function wireGate() {
  const inputs = [...root.querySelectorAll('[data-pin]')];
  inputs[0]?.focus();
  const tryPin = () => {
    const v = inputs.map((i) => i.value).join('');
    if (v.length < 4) return;
    if (v === String(S.admin?.pin || '7777')) {
      sessionStorage.setItem(GATE_KEY, '1');
      paint();
    } else {
      root.querySelector('#pinerr').innerHTML = `${icon('alert', 'icon icon--sm')} Código incorreto.`;
      inputs.forEach((i) => { i.value = ''; });
      inputs[0].focus();
    }
  };
  inputs.forEach((inp, i) => {
    inp.addEventListener('input', () => {
      inp.value = onlyDigits(inp.value).slice(0, 1);
      if (inp.value && inputs[i + 1]) inputs[i + 1].focus();
      tryPin();
    });
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !inp.value && inputs[i - 1]) inputs[i - 1].focus();
    });
  });
  root.querySelector('#pinform').addEventListener('submit', (e) => { e.preventDefault(); tryPin(); });
}

/* ----------------------------------------------------------------- shell */
function shell() {
  const st = openState(S);
  const pending = S.orders.filter((o) => o.status === 'recebido').length;
  return `
  <header class="adm-top">
    <div class="adm-wrap adm-top-in">
      <img class="adm-mark" src="${esc(S.brand.mark)}" alt="" width="220" height="466">
      <div class="grow">
        <h1>Painel</h1>
        <span class="sub">${esc(S.brand.name)} · ${st.open ? 'aberto agora' : 'fechado agora'}</span>
      </div>
      <div class="statetoggle" role="radiogroup" aria-label="Status de funcionamento">
        ${[['auto', 'Auto'], ['open', 'Aberto'], ['closed', 'Fechado']].map(([v, l]) => `
          <label><input type="radio" name="manual" value="${v}" ${S.manualStatus === v ? 'checked' : ''}>${l}</label>`).join('')}
      </div>
    </div>
  </header>

  <main class="adm-wrap">${panel()}</main>

  <nav class="tabbar" aria-label="Seções do painel">
    ${TABS.map((t) => `
      <button type="button" data-tab="${t.id}" ${t.id === tab ? 'aria-current="page"' : ''}>
        ${icon(t.icon, 'icon')}${t.label}${t.id === 'pedidos' && pending ? ` (${pending})` : ''}
      </button>`).join('')}
  </nav>`;
}

function panel() {
  if (tab === 'pedidos') return panelPedidos();
  if (tab === 'cardapio') return panelCardapio();
  if (tab === 'loja') return panelLoja();
  if (tab === 'visual') return panelVisual();
  return panelDados();
}

/* --------------------------------------------------------------- pedidos */
const stClass = (s) => ({ 'recebido': 'recebido', 'em preparo': 'preparo', 'saiu para entrega': 'entrega', 'concluído': 'concluido', 'cancelado': 'cancelado' }[s] || '');

function panelPedidos() {
  const o = S.orders;
  return `
  <section class="panel">
    <div class="flag flag--info">
      ${icon('info', 'icon')}
      <div><b>Pedidos registrados neste aparelho.</b> O pedido chega pelo WhatsApp e fica gravado aqui no
      navegador em que foi feito. Para ver em tempo real os pedidos de todos os clientes, em qualquer
      aparelho, é preciso backend — o README traz o caminho com Supabase.</div>
    </div>

    <div class="panel-h"><h2>Pedidos</h2><span class="grow"></span>
      <span class="hint">${plural(o.length, 'pedido', 'pedidos')} no histórico</span></div>

    ${!o.length ? `
      <div class="empty">
        ${icon('note', 'icon')}
        <h3>Nenhum pedido ainda</h3>
        <p>Quando um cliente finalizar pelo cardápio, o pedido aparece aqui com os itens e os dados de entrega.</p>
        <a class="btn btn--ghost" href="./">Abrir o cardápio</a>
      </div>` : o.map(ordCard).join('')}
  </section>`;
}

function ordCard(o) {
  const when = new Date(o.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  return `
  <div class="ord" data-ord="${esc(o.code)}">
    <button class="ord-h" type="button" data-toggle="${esc(o.code)}">
      <span class="code">${esc(o.code)}</span>
      <span class="who">
        <b>${esc(o.customer?.name || 'Cliente')}</b>
        <span>${when} · ${o.type === 'delivery' ? 'entrega' : 'retirada'} · ${esc(o.paymentLabel || '')}</span>
      </span>
      <span class="tot">${brl(o.totals?.total || 0)}</span>
      <span class="st st--${stClass(o.status)}">${esc(o.status)}</span>
    </button>
    <div class="ord-b" hidden>
      <div class="grid2" style="margin-top:.75rem">
        <label class="field"><span class="lbl">Status</span>
          <select class="select" data-status="${esc(o.code)}">
            ${ORDER_STATUS.map((s) => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}
          </select></label>
        <div style="display:flex;align-items:flex-end;gap:.5rem">
          <button class="btn btn--ghost" type="button" data-copy="${esc(o.code)}">
            ${icon('copy', 'icon icon--sm')} Copiar</button>
          <button class="btn btn--danger" type="button" data-delord="${esc(o.code)}">
            ${icon('trash', 'icon icon--sm')}<span class="sr">Excluir pedido</span></button>
        </div>
      </div>
      <pre>${esc(o.message || '')}</pre>
    </div>
  </div>`;
}

/* -------------------------------------------------------------- cardápio */
function panelCardapio() {
  const cats = [...S.categories].sort((a, b) => a.order - b.order);
  return `
  <section class="panel">
    <div class="panel-h"><h2>Categorias</h2><span class="grow"></span>
      <button class="btn btn--ghost" type="button" data-newcat>${icon('plus', 'icon icon--sm')} Nova</button></div>
    <div class="list">
      ${cats.map((c, i) => `
        <div class="item ${c.active ? '' : 'item--off'}">
          <span class="iconbtn" aria-hidden="true">${icon(c.icon, 'icon')}</span>
          <div class="body">
            <div class="t">${esc(c.name)}</div>
            <div class="s">${plural(sel.productsOf(c.id, S).length, 'item', 'itens')}${c.active ? '' : ' · oculta no cardápio'}</div>
          </div>
          <div class="acts">
            <button class="iconbtn" type="button" data-catmove="${c.id}" data-dir="-1" ${i === 0 ? 'disabled' : ''} aria-label="Subir">${icon('up', 'icon icon--sm')}</button>
            <button class="iconbtn" type="button" data-catmove="${c.id}" data-dir="1" ${i === cats.length - 1 ? 'disabled' : ''} aria-label="Descer">${icon('down', 'icon icon--sm')}</button>
            <button class="iconbtn" type="button" data-editcat="${c.id}" aria-label="Editar">${icon('edit', 'icon icon--sm')}</button>
          </div>
          <label class="sw"><input type="checkbox" data-cattoggle="${c.id}" ${c.active ? 'checked' : ''}
            aria-label="Mostrar ${esc(c.name)} no cardápio"><i></i></label>
        </div>`).join('')}
    </div>

    <div class="panel-h"><h2>Produtos</h2><span class="grow"></span>
      <button class="btn btn--primary" type="button" data-newprod>${icon('plus', 'icon icon--sm')} Novo produto</button></div>

    ${cats.map((c) => {
      const list = sel.productsOf(c.id, S);
      if (!list.length) return '';
      return `
      <div style="margin-bottom:1.25rem">
        <div class="legend" style="margin-bottom:.5rem">${esc(c.name)}</div>
        <div class="list">
          ${list.map((p, i) => `
            <div class="item ${p.available ? '' : 'item--off'}">
              <div class="thumb">${p.photo ? `<img src="${esc(p.photo)}" alt="" loading="lazy">`
                : p.img ? `<img src="assets/img/p/${encodeURIComponent(p.img)}-sm.webp" alt="" loading="lazy">`
                : artSvg(p.art, '')}</div>
              <div class="body">
                <div class="t">${esc(p.name)}</div>
                <div class="s">
                  <span>${p.promoPrice != null ? `<s>${brl(p.price)}</s> ${brl(p.promoPrice)}` : brl(p.price)}</span>
                  ${p.variations.length ? `<span>${p.variations.length} ${p.variations.length === 1 ? 'variação' : 'variações'}</span>` : ''}
                  ${p.available ? '' : '<span style="color:var(--alert-text)">esgotado</span>'}
                </div>
              </div>
              <div class="acts">
                <button class="iconbtn" type="button" data-move="${p.id}" data-dir="-1" ${i === 0 ? 'disabled' : ''} aria-label="Subir">${icon('up', 'icon icon--sm')}</button>
                <button class="iconbtn" type="button" data-move="${p.id}" data-dir="1" ${i === list.length - 1 ? 'disabled' : ''} aria-label="Descer">${icon('down', 'icon icon--sm')}</button>
                <button class="iconbtn" type="button" data-edit="${p.id}" aria-label="Editar ${esc(p.name)}">${icon('edit', 'icon icon--sm')}</button>
              </div>
              <label class="sw"><input type="checkbox" data-avail="${p.id}" ${p.available ? 'checked' : ''}
                aria-label="${esc(p.name)} disponível"><i></i></label>
            </div>`).join('')}
        </div>
      </div>`;
    }).join('')}

    <div class="panel-h"><h2>Adicionais</h2><span class="grow"></span>
      <button class="btn btn--ghost" type="button" data-newgroup>${icon('plus', 'icon icon--sm')} Novo grupo</button></div>
    <div class="list">
      ${S.addonGroups.map((g) => `
        <div class="item">
          <div class="body">
            <div class="t">${esc(g.name)}</div>
            <div class="s">${plural(g.options.length, 'opção', 'opções')} · até ${g.max} por item${
              g.options.filter((o) => !o.available).length
                ? ' · ' + plural(g.options.filter((o) => !o.available).length, 'esgotada', 'esgotadas') : ''}</div>
          </div>
          <div class="acts">
            <button class="iconbtn" type="button" data-editgroup="${g.id}" aria-label="Editar">${icon('edit', 'icon icon--sm')}</button>
          </div>
        </div>`).join('')}
    </div>
  </section>`;
}

/* ------------------------------------------------------------------ loja */
function panelLoja() {
  const c = S.contact, a = c.address, sv = S.service;
  return `
  <section class="panel">
    ${c.whatsapp === DEMO_WHATSAPP ? `
      <div class="flag">${icon('alert', 'icon')}
      <div><b>O WhatsApp ainda é o número de exemplo.</b> Enquanto não trocar, os pedidos não chegam a ninguém.</div></div>` : ''}

    <div class="panel-h"><h2>Identificação</h2></div>
    <div class="card">
      <div class="fields">
        <label class="field"><span class="lbl">Nome do restaurante</span>
          <input class="input" data-f="brand.name" value="${esc(S.brand.name)}"></label>
        <label class="field"><span class="lbl">Slogan</span>
          <input class="input" data-f="brand.tagline" value="${esc(S.brand.tagline)}"></label>
        <label class="field"><span class="lbl">Frase de apresentação (aparece no topo)</span>
          <textarea class="textarea" data-f="brand.intro" rows="2">${esc(S.brand.intro)}</textarea></label>
        <label class="field"><span class="lbl">Sobre a casa (página de informações)</span>
          <textarea class="textarea" data-f="brand.about" rows="4">${esc(S.brand.about)}</textarea></label>
      </div>
    </div>

    <div class="panel-h"><h2>Contato</h2></div>
    <div class="card">
      <div class="fields">
        <label class="field"><span class="lbl">WhatsApp que recebe os pedidos</span>
          <input class="input" data-f="contact.whatsapp" inputmode="numeric" value="${esc(c.whatsapp)}">
          <p class="hint">Só números, com país e DDD. Ex.: 5511987654321</p></label>
        <div class="grid2">
          <label class="field"><span class="lbl">Telefone exibido</span>
            <input class="input" data-f="contact.phone" value="${esc(c.phone)}"></label>
          <label class="field"><span class="lbl">Instagram (sem @)</span>
            <input class="input" data-f="contact.instagram" value="${esc(c.instagram)}"></label>
        </div>
        <label class="field"><span class="lbl">Link do mapa</span>
          <input class="input" data-f="contact.maps" value="${esc(c.maps)}"></label>
      </div>
    </div>

    <div class="panel-h"><h2>Endereço</h2></div>
    <div class="card">
      <div class="fields">
        <label class="field"><span class="lbl">Rua e número</span>
          <input class="input" data-f="contact.address.street" value="${esc(a.street)}"></label>
        <div class="grid2">
          <label class="field"><span class="lbl">Bairro</span>
            <input class="input" data-f="contact.address.district" value="${esc(a.district)}"></label>
          <label class="field"><span class="lbl">CEP</span>
            <input class="input" data-f="contact.address.zip" value="${esc(a.zip)}"></label>
        </div>
        <div class="grid2">
          <label class="field"><span class="lbl">Cidade</span>
            <input class="input" data-f="contact.address.city" value="${esc(a.city)}"></label>
          <label class="field"><span class="lbl">UF</span>
            <input class="input" data-f="contact.address.state" maxlength="2" value="${esc(a.state)}"></label>
        </div>
        <label class="field"><span class="lbl">Ponto de referência</span>
          <input class="input" data-f="contact.address.reference" value="${esc(a.reference)}"></label>
      </div>
    </div>

    <div class="panel-h"><h2>Horários</h2></div>
    <div class="card">
      <div class="list">
        ${S.hours.map((h) => `
          <div class="item">
            <div class="body" style="max-width:120px"><div class="t">${SHORT[h.day]}</div>
              <div class="s">${h.closed ? 'fechado' : 'aberto'}</div></div>
            <input class="input" type="time" data-hour="${h.day}" data-k="open" value="${h.open}" ${h.closed ? 'disabled' : ''} style="min-height:40px">
            <input class="input" type="time" data-hour="${h.day}" data-k="close" value="${h.close}" ${h.closed ? 'disabled' : ''} style="min-height:40px">
            <label class="sw"><input type="checkbox" data-hopen="${h.day}" ${h.closed ? '' : 'checked'}
              aria-label="${DAYS[h.day]} aberto"><i></i></label>
          </div>`).join('')}
      </div>
      <p class="hint">Fechamento depois da meia-noite funciona: ponha 00:30 que o sistema entende que ainda é o turno do dia anterior.</p>
    </div>

    <div class="panel-h"><h2>Entrega e retirada</h2></div>
    <div class="card">
      <div class="list" style="margin-bottom:1rem">
        <div class="item"><div class="body"><div class="t">Aceita entrega</div></div>
          <label class="sw"><input type="checkbox" data-f="service.delivery" ${sv.delivery ? 'checked' : ''} aria-label="Aceita entrega"><i></i></label></div>
        <div class="item"><div class="body"><div class="t">Aceita retirada no balcão</div></div>
          <label class="sw"><input type="checkbox" data-f="service.pickup" ${sv.pickup ? 'checked' : ''} aria-label="Aceita retirada"><i></i></label></div>
      </div>
      <div class="grid2">
        <label class="field"><span class="lbl">Pedido mínimo</span>
          <input class="input" data-money="service.minOrder" value="${brl(sv.minOrder)}"></label>
        <label class="field"><span class="lbl">Entrega grátis acima de</span>
          <input class="input" data-money="service.freeDeliveryAbove" value="${brl(sv.freeDeliveryAbove)}"></label>
      </div>
      <div class="grid2" style="margin-top:.75rem">
        <label class="field"><span class="lbl">Entrega: de / até (min)</span>
          <div class="grid2">
            <input class="input" inputmode="numeric" data-num="service.etaDelivery.0" value="${sv.etaDelivery[0]}">
            <input class="input" inputmode="numeric" data-num="service.etaDelivery.1" value="${sv.etaDelivery[1]}">
          </div></label>
        <label class="field"><span class="lbl">Retirada: de / até (min)</span>
          <div class="grid2">
            <input class="input" inputmode="numeric" data-num="service.etaPickup.0" value="${sv.etaPickup[0]}">
            <input class="input" inputmode="numeric" data-num="service.etaPickup.1" value="${sv.etaPickup[1]}">
          </div></label>
      </div>

      <div class="panel-h" style="margin-top:1.25rem"><h2 style="font-size:var(--step-0)">Bairros e taxas</h2>
        <span class="grow"></span>
        <button class="btn btn--ghost" type="button" data-newdistrict style="min-height:36px">${icon('plus', 'icon icon--sm')} Bairro</button></div>
      <div class="list">
        ${sv.districts.map((d, i) => `
          <div class="item">
            <input class="input" data-district="${i}" data-k="name" value="${esc(d.name)}" style="min-height:40px" aria-label="Nome do bairro">
            <input class="input" data-district="${i}" data-k="fee" value="${brl(d.fee)}" style="min-height:40px;max-width:110px" aria-label="Taxa">
            <button class="iconbtn iconbtn--danger" type="button" data-deldistrict="${i}" aria-label="Remover bairro">${icon('trash', 'icon icon--sm')}</button>
          </div>`).join('')}
      </div>
    </div>

    <div class="panel-h"><h2>Pagamento</h2></div>
    <div class="card">
      <div class="list">
        ${S.payments.map((p) => `
          <div class="item"><div class="body"><div class="t">${esc(p.label)}</div></div>
            <label class="sw"><input type="checkbox" data-pay="${p.id}" ${p.active ? 'checked' : ''}
              aria-label="Aceita ${esc(p.label)}"><i></i></label></div>`).join('')}
      </div>
      <label class="field" style="margin-top:.75rem"><span class="lbl">Chave Pix</span>
        <input class="input" data-f="pixKey" value="${esc(S.pixKey || '')}"></label>
      <div class="flag flag--info" style="margin-top:1rem">
        ${icon('info', 'icon')}
        <div><b>Pagamento on-line: não integrado.</b> O cardápio não cobra nada e não simula cobrança.
        Para aceitar Pix ou cartão dentro do site é preciso contratar um provedor (Mercado Pago, Stripe, Pagar.me)
        e ligar o checkout a ele — o README explica onde o código já está preparado para isso.</div>
      </div>
    </div>
  </section>`;
}

/* ---------------------------------------------------------------- visual */
const THEME_FIELDS = [
  ['--surface-0', 'Fundo da página'], ['--surface-1', 'Placas e cartões'],
  ['--surface-2', 'Campos e chips'], ['--surface-3', 'Estado pressionado'],
  ['--text-1', 'Texto principal'], ['--text-2', 'Texto secundário'], ['--text-3', 'Texto de apoio'],
  ['--accent', 'Cor de ação'], ['--accent-2', 'Destaque'],
  ['--alert', 'Alerta (preenchimento)'], ['--alert-text', 'Alerta (texto)'],
  ['--info', 'Informação'], ['--ink', 'Texto sobre a cor de ação'],
];

const PRESETS = {
  /* the house theme is not restated here — it is the one the catalog ships with,
     so there is exactly one source of truth for the brand colours */
  brasa: {
    name: 'BRASA (atual)', desc: 'Carvão, creme e cobre. A identidade da casa.',
    theme: SEED.theme,
  },
  verde: {
    name: 'Horta e creme', desc: 'Para casas veganas, saladas e naturais.',
    theme: { '--surface-0': '#122018', '--surface-1': '#1A2C21', '--surface-2': '#24392C', '--surface-3': '#2F4738',
      '--ink': '#0C170F', '--text-1': '#EFF3E6', '--text-2': '#BCCBB4', '--text-3': '#93A68C',
      '--accent': '#8CC152', '--accent-2': '#A9D96F', '--alert': '#8C3A2A', '--alert-text': '#F09880',
      '--alert-deep': '#5E241A' },
  },
};

function panelVisual() {
  return `
  <section class="panel">
    <div class="flag flag--info">${icon('info', 'icon')}
      <div><b>É assim que o cardápio vira o de outro restaurante.</b> As cores abaixo são as únicas variáveis
      que o código inteiro usa. Trocar aqui troca o cardápio, o painel e o favicon de uma vez.</div></div>

    <div class="panel-h"><h2>Começar de um preset</h2></div>
    <div class="presets">
      ${Object.entries(PRESETS).map(([k, p]) => `
        <button class="preset card" type="button" data-preset="${k}">
          <span class="bars">
            <span style="background:${p.theme['--surface-1']}"></span>
            <span style="background:${p.theme['--accent']}"></span>
            <span style="background:${p.theme['--text-1']}"></span>
          </span>
          <b>${esc(p.name)}</b><span class="d">${esc(p.desc)}</span>
        </button>`).join('')}
    </div>

    <div class="panel-h"><h2>Marca</h2></div>
    <div class="card">
      <div class="fields">
        <label class="field"><span class="lbl">Linha de apoio (ao lado do nome)</span>
          <input class="input" data-f="brand.kicker" maxlength="24" value="${esc(S.brand.kicker || '')}"></label>
        <div class="grid2 grid2--stack">
          <label class="field"><span class="lbl">Logotipo para fundo escuro</span>
            <input class="input" data-f="brand.logoDark" value="${esc(S.brand.logoDark || '')}" inputmode="url"></label>
          <label class="field"><span class="lbl">Símbolo (sem o nome)</span>
            <input class="input" data-f="brand.mark" value="${esc(S.brand.mark || '')}" inputmode="url"></label>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;margin-top:1rem;flex-wrap:wrap">
        <img src="${esc(S.brand.logoDark)}" alt="" style="height:64px;width:auto">
        <img src="${esc(S.brand.mark)}" alt="" style="height:44px;width:auto">
        <p class="hint" style="margin:0;flex:1;min-width:160px">Prévia do logotipo e do símbolo.
        O símbolo também vira o ícone do atalho na tela inicial do celular.</p>
      </div>
    </div>

    <div class="panel-h"><h2>Cores</h2></div>
    <div class="card">
      <div class="swatches">
        ${THEME_FIELDS.map(([k, label]) => `
          <label class="swatch">
            <input type="color" data-theme="${k}" value="${esc(S.theme[k] || '#000000')}" aria-label="${esc(label)}">
            <span class="n">${esc(label)}<code>${esc(S.theme[k] || '')}</code></span>
          </label>`).join('')}
      </div>
      <p class="hint">A mudança vale na hora, aqui e no cardápio. Contraste abaixo de 4,5:1 entre texto e fundo
      deixa o cardápio ilegível para muita gente — o aviso aparece sozinho se isso acontecer.</p>
      <div id="contrast" style="margin-top:.75rem"></div>
    </div>
  </section>`;
}

/* ----------------------------------------------------------------- dados */
function panelDados() {
  return `
  <section class="panel">
    <div class="panel-h"><h2>Onde ficam seus dados</h2></div>
    <div class="card">
      <div class="flag flag--info">${icon('info', 'icon')}
        <div><b>Tudo o que você edita fica neste navegador</b> (armazenamento local), não em um servidor.
        Isso significa: funciona offline e é instantâneo, mas não aparece em outro aparelho e some se você
        limpar os dados do navegador. Faça backup antes de trocar de celular.</div></div>
      <div class="grid2" style="margin-top:1rem">
        <button class="btn btn--primary" type="button" data-export>${icon('copy', 'icon icon--sm')} Baixar backup</button>
        <button class="btn btn--ghost" type="button" data-import>${icon('up', 'icon icon--sm')} Restaurar backup</button>
      </div>
      <input type="file" id="importfile" accept="application/json,.json" hidden>
    </div>

    <div class="panel-h"><h2>Código de acesso</h2></div>
    <div class="card">
      <label class="field"><span class="lbl">Código de 4 dígitos do painel</span>
        <input class="input" inputmode="numeric" maxlength="4" data-pinset value="${esc(S.admin?.pin || '7777')}">
        <p class="hint">Trava local para evitar toque acidental. Não protege contra quem abra o arquivo —
        isso só um backend resolve.</p></label>
      <button class="btn btn--ghost" type="button" data-logout style="margin-top:.75rem">
        ${icon('lock', 'icon icon--sm')} Sair do painel</button>
    </div>

    <div class="panel-h"><h2>Recomeçar</h2></div>
    <div class="card">
      <p class="hint" style="margin-top:0">Apaga tudo o que você editou e volta ao cardápio de exemplo da KM 7,
      incluindo o histórico de pedidos. Não dá para desfazer.</p>
      <button class="btn btn--danger" type="button" data-reset style="margin-top:.75rem">
        ${icon('refresh', 'icon icon--sm')} Restaurar cardápio de exemplo</button>
    </div>

    <div class="panel-h"><h2>O que ainda não existe</h2></div>
    <div class="card">
      <ul style="list-style:none;padding:0;margin:0;display:grid;gap:.6rem">
        ${[
          ['Pedidos em tempo real entre aparelhos', 'precisa de backend (Supabase) — passo a passo no README'],
          ['Login de verdade com usuário e senha', 'idem; o código de 4 dígitos é só uma trava local'],
          ['Pagamento on-line', 'precisa de um provedor contratado; o ponto de integração já está marcado no código'],
          ['Upload de fotos', 'hoje o campo aceita o endereço de uma imagem já hospedada'],
          ['Impressão automática na cozinha', 'depende de impressora com API ou de um app intermediário'],
        ].map(([t, d]) => `<li style="display:flex;gap:.6rem">
          ${icon('alert', 'icon icon--sm', 'style="margin-top:3px;flex:none;color:var(--text-3)"')}
          <span><b style="font-family:var(--font-display)">${esc(t)}</b><br>
          <span class="hint">${esc(d)}</span></span></li>`).join('')}
      </ul>
    </div>
  </section>`;
}

/* ============================================================== wiring === */
const uid = (p) => p + '-' + Math.random().toString(36).slice(2, 8);
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
function getPath(obj, path) { return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj); }
function setPath(obj, path, val) {
  const ks = path.split('.'); const last = ks.pop();
  const t = ks.reduce((o, k) => o[k], obj); t[last] = val;
}

function wireShell() {
  /* ---- tabs ---- */
  root.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => {
    tab = b.dataset.tab; history.replaceState(null, '', '#' + tab);
    paint(); scrollTo({ top: 0 });
  }));

  /* ---- open / closed ---- */
  root.querySelectorAll('[name="manual"]').forEach((r) => r.addEventListener('change', async () => {
    await store.commit((s) => { s.manualStatus = r.value; });
    toast(r.value === 'auto' ? 'Seguindo os horários cadastrados'
      : r.value === 'open' ? 'Loja marcada como aberta' : 'Loja marcada como fechada',
      { icon: icon('checkCircle', 'icon') });
  }));

  /* ---- plain text / number / money / boolean fields ---- */
  root.querySelectorAll('[data-f]').forEach((el) => {
    const ev = el.type === 'checkbox' ? 'change' : 'change';
    el.addEventListener(ev, async () => {
      const v = el.type === 'checkbox' ? el.checked
        : el.dataset.f === 'contact.whatsapp' ? onlyDigits(el.value) : el.value;
      await store.commit((s) => setPath(s, el.dataset.f, v));
      toast('Salvo', { icon: icon('checkCircle', 'icon'), timeout: 1400, key: 'save' });
    });
  });
  root.querySelectorAll('[data-money]').forEach((el) => el.addEventListener('change', async () => {
    const cents = parseBrl(el.value);
    await store.commit((s) => setPath(s, el.dataset.money, cents));
    toast('Salvo', { icon: icon('checkCircle', 'icon'), timeout: 1400, key: 'save' });
  }));
  root.querySelectorAll('[data-num]').forEach((el) => el.addEventListener('change', async () => {
    const n = Math.max(0, parseInt(onlyDigits(el.value) || '0', 10));
    await store.commit((s) => setPath(s, el.dataset.num, n));
  }));

  /* ---- hours ---- */
  root.querySelectorAll('[data-hour]').forEach((el) => el.addEventListener('change', async () => {
    await store.commit((s) => {
      const h = s.hours.find((x) => x.day === Number(el.dataset.hour));
      h[el.dataset.k] = el.value;
    });
  }));
  root.querySelectorAll('[data-hopen]').forEach((el) => el.addEventListener('change', async () => {
    await store.commit((s) => {
      s.hours.find((x) => x.day === Number(el.dataset.hopen)).closed = !el.checked;
    });
  }));

  /* ---- districts ---- */
  root.querySelectorAll('[data-district]').forEach((el) => el.addEventListener('change', async () => {
    await store.commit((s) => {
      const d = s.service.districts[Number(el.dataset.district)];
      if (el.dataset.k === 'fee') d.fee = parseBrl(el.value); else d.name = el.value;
    });
  }));
  root.querySelector('[data-newdistrict]')?.addEventListener('click', async () => {
    await store.commit((s) => s.service.districts.push({ name: 'Novo bairro', fee: 0 }));
  });
  root.querySelectorAll('[data-deldistrict]').forEach((b) => b.addEventListener('click', async () => {
    if (S.service.districts.length <= 1) { toast('Deixe ao menos um bairro.', { type: 'err', icon: icon('alert', 'icon') }); return; }
    await store.commit((s) => s.service.districts.splice(Number(b.dataset.deldistrict), 1));
  }));

  /* ---- payments ---- */
  root.querySelectorAll('[data-pay]').forEach((el) => el.addEventListener('change', async () => {
    const active = root.querySelectorAll('[data-pay]:checked').length;
    if (!active) { el.checked = true; toast('Mantenha ao menos uma forma de pagamento.', { type: 'err', icon: icon('alert', 'icon') }); return; }
    await store.commit((s) => { s.payments.find((p) => p.id === el.dataset.pay).active = el.checked; });
  }));

  /* ---- products ---- */
  root.querySelectorAll('[data-avail]').forEach((el) => el.addEventListener('change', async () => {
    await store.commit((s) => { sel.product(el.dataset.avail, s).available = el.checked; });
    toast(el.checked ? 'Disponível de novo' : 'Marcado como esgotado', { icon: icon('checkCircle', 'icon'), timeout: 1600 });
  }));
  root.querySelectorAll('[data-move]').forEach((b) => b.addEventListener('click', async () => {
    const p = sel.product(b.dataset.move, S);
    const list = sel.productsOf(p.categoryId, S);
    const i = list.indexOf(p); const j = i + Number(b.dataset.dir);
    if (j < 0 || j >= list.length) return;
    await store.commit((s) => {
      const a = sel.product(list[i].id, s), c = sel.product(list[j].id, s);
      const t = a.order; a.order = c.order; c.order = t;
    });
  }));
  root.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => productSheet(b.dataset.edit)));
  root.querySelector('[data-newprod]')?.addEventListener('click', () => productSheet(null));

  /* ---- categories ---- */
  root.querySelectorAll('[data-cattoggle]').forEach((el) => el.addEventListener('change', async () => {
    await store.commit((s) => { s.categories.find((c) => c.id === el.dataset.cattoggle).active = el.checked; });
  }));
  root.querySelectorAll('[data-catmove]').forEach((b) => b.addEventListener('click', async () => {
    const cats = [...S.categories].sort((x, y) => x.order - y.order);
    const i = cats.findIndex((c) => c.id === b.dataset.catmove); const j = i + Number(b.dataset.dir);
    if (j < 0 || j >= cats.length) return;
    await store.commit((s) => {
      const a = s.categories.find((c) => c.id === cats[i].id), c = s.categories.find((x) => x.id === cats[j].id);
      const t = a.order; a.order = c.order; c.order = t;
    });
  }));
  root.querySelectorAll('[data-editcat]').forEach((b) => b.addEventListener('click', () => categorySheet(b.dataset.editcat)));
  root.querySelector('[data-newcat]')?.addEventListener('click', () => categorySheet(null));

  /* ---- addon groups ---- */
  root.querySelectorAll('[data-editgroup]').forEach((b) => b.addEventListener('click', () => groupSheet(b.dataset.editgroup)));
  root.querySelector('[data-newgroup]')?.addEventListener('click', () => groupSheet(null));

  /* ---- orders ---- */
  root.querySelectorAll('[data-toggle]').forEach((b) => b.addEventListener('click', () => {
    const body = b.parentElement.querySelector('.ord-b');
    body.hidden = !body.hidden;
  }));
  root.querySelectorAll('[data-status]').forEach((selEl) => selEl.addEventListener('change', async () => {
    await store.commit((s) => { s.orders.find((o) => o.code === selEl.dataset.status).status = selEl.value; });
    toast('Status atualizado', { icon: icon('checkCircle', 'icon'), timeout: 1500 });
  }));
  root.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    const o = S.orders.find((x) => x.code === b.dataset.copy);
    try { await navigator.clipboard.writeText(o.message || ''); toast('Pedido copiado', { icon: icon('checkCircle', 'icon') }); }
    catch { toast('O navegador não liberou a cópia. Selecione o texto abaixo.', { type: 'err', icon: icon('alert', 'icon') }); }
  }));
  root.querySelectorAll('[data-delord]').forEach((b) => b.addEventListener('click', async () => {
    if (!confirm('Excluir este pedido do histórico?')) return;
    await store.commit((s) => { s.orders = s.orders.filter((o) => o.code !== b.dataset.delord); });
  }));

  /* ---- theme ---- */
  root.querySelectorAll('[data-theme]').forEach((el) => {
    const live = () => document.documentElement.style.setProperty(el.dataset.theme, el.value);
    el.addEventListener('input', () => { live(); checkContrast(); });
    el.addEventListener('change', async () => {
      await store.commit((s) => { s.theme[el.dataset.theme] = el.value; });
    });
  });
  root.querySelectorAll('[data-preset]').forEach((b) => b.addEventListener('click', async () => {
    await store.commit((s) => { s.theme = { ...s.theme, ...PRESETS[b.dataset.preset].theme }; });
    toast('Tema aplicado', { icon: icon('checkCircle', 'icon') });
  }));
  if (tab === 'visual') checkContrast();

  /* ---- data ---- */
  root.querySelector('[data-export]')?.addEventListener('click', () => {
    const blob = new Blob([store.exportJson()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cardapio-${S.brand.slug || 'backup'}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
  root.querySelector('[data-import]')?.addEventListener('click', () => root.querySelector('#importfile').click());
  root.querySelector('#importfile')?.addEventListener('change', async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    try {
      await store.importJson(await f.text());
      toast('Backup restaurado', { icon: icon('checkCircle', 'icon') });
    } catch (err) {
      toast(err.message || 'Arquivo inválido.', { type: 'err', icon: icon('alert', 'icon') });
    }
    e.target.value = '';
  });
  root.querySelector('[data-pinset]')?.addEventListener('change', async (el) => {
    const v = onlyDigits(el.target.value).slice(0, 4);
    if (v.length !== 4) { toast('O código precisa ter 4 dígitos.', { type: 'err', icon: icon('alert', 'icon') }); return; }
    await store.commit((s) => { s.admin = { ...(s.admin || {}), pin: v }; });
    toast('Código atualizado', { icon: icon('checkCircle', 'icon') });
  });
  root.querySelector('[data-logout]')?.addEventListener('click', () => { sessionStorage.removeItem(GATE_KEY); paint(); });
  root.querySelector('[data-reset]')?.addEventListener('click', async () => {
    if (!confirm('Isso apaga suas edições e os pedidos, voltando ao cardápio de exemplo. Continuar?')) return;
    await store.resetAll();
    toast('Cardápio de exemplo restaurado', { icon: icon('checkCircle', 'icon') });
  });
}

/* ------------------------------------------------------------- contrast */
function lum(hex) {
  const h = hex.replace('#', '');
  const v = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}
function ratio(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}
function checkContrast() {
  const box = root.querySelector('#contrast'); if (!box) return;
  const get = (k) => root.querySelector(`[data-theme="${k}"]`)?.value || S.theme[k];
  const pairs = [
    ['--text-1', '--surface-0', 'Texto principal sobre o fundo'],
    ['--text-2', '--surface-1', 'Texto secundário sobre as placas'],
    ['--text-3', '--surface-1', 'Texto de apoio sobre as placas'],
    ['--ink', '--accent', 'Texto do botão principal'],
  ];
  const bad = pairs.map(([f, b, l]) => [l, ratio(get(f), get(b))]).filter(([, r]) => r < 4.5);
  box.innerHTML = bad.length
    ? `<div class="flag">${icon('alert', 'icon')}<div><b>Contraste baixo.</b> ${bad.map(([l, r]) =>
        `${esc(l)}: ${r.toFixed(1)}:1`).join(' · ')} — o mínimo legível é 4,5:1.</div></div>`
    : `<div class="flag flag--info">${icon('checkCircle', 'icon')}<div>Contraste aprovado em todas as combinações principais.</div></div>`;
}

/* ------------------------------------------------------- category sheet */
function categorySheet(id) {
  const c = id ? S.categories.find((x) => x.id === id) : null;
  const picks = ['flame', 'box', 'kitchen', 'list', 'tag', 'spark', 'cash', 'store', 'moto', 'note'];
  sheet({
    title: c ? 'Editar categoria' : 'Nova categoria',
    body: `
      <div class="fields">
        <label class="field"><span class="lbl">Nome</span>
          <input class="input" id="cname" data-autofocus value="${esc(c?.name || '')}" placeholder="Ex.: Porções">
          <p class="err" id="cerr"></p></label>
        <div class="field"><span class="lbl">Ícone</span>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${picks.map((p) => `<label class="iconbtn" style="border-color:var(--line)">
              <input type="radio" name="cicon" value="${p}" ${(c?.icon || 'list') === p ? 'checked' : ''}
                style="position:absolute;opacity:0" aria-label="${p}">${icon(p, 'icon')}</label>`).join('')}
          </div></div>
        <div class="item"><div class="body"><div class="t">Mostrar no cardápio</div></div>
          <label class="sw"><input type="checkbox" id="cactive" ${c ? (c.active ? 'checked' : '') : 'checked'}
            aria-label="Mostrar no cardápio"><i></i></label></div>
      </div>`,
    foot: `
      <button class="btn btn--primary btn--block" type="button" id="csave">Salvar</button>
      ${c ? `<button class="btn btn--danger btn--block" type="button" id="cdel">Excluir categoria</button>` : ''}`,
    onMount(el, api) {
      el.querySelector('#csave').addEventListener('click', async () => {
        const name = el.querySelector('#cname').value.trim();
        if (!name) { el.querySelector('#cerr').innerHTML = `${icon('alert', 'icon icon--sm')} Dê um nome à categoria.`; return; }
        const ic = el.querySelector('[name="cicon"]:checked')?.value || 'list';
        const active = el.querySelector('#cactive').checked;
        await store.commit((s) => {
          if (c) Object.assign(s.categories.find((x) => x.id === c.id), { name, icon: ic, active });
          else s.categories.push({ id: uid('cat'), name, icon: ic, active, order: Math.max(0, ...s.categories.map((x) => x.order)) + 1 });
        });
        api.close(); toast('Categoria salva', { icon: icon('checkCircle', 'icon') });
      });
      el.querySelector('#cdel')?.addEventListener('click', async () => {
        const n = sel.productsOf(c.id, S).length;
        if (n) { toast(`Mova ou exclua ${plural(n, 'o produto', 'os produtos')} desta categoria antes.`, { type: 'err', icon: icon('alert', 'icon') }); return; }
        if (!confirm(`Excluir a categoria “${c.name}”?`)) return;
        await store.commit((s) => { s.categories = s.categories.filter((x) => x.id !== c.id); });
        api.close(); toast('Categoria excluída', { icon: icon('trash', 'icon') });
      });
    },
  });
}

/* ---------------------------------------------------------- group sheet */
function groupSheet(id) {
  const g = id ? sel.addonGroup(id, S) : null;
  const draft = g ? JSON.parse(JSON.stringify(g)) : { id: uid('grp'), name: '', min: 0, max: 3, options: [] };

  const optRow = (o, i) => `
    <div class="item" data-opt="${i}">
      <input class="input" data-o="${i}" data-k="name" value="${esc(o.name)}" placeholder="Nome" style="min-height:40px" aria-label="Nome da opção">
      <input class="input" data-o="${i}" data-k="price" value="${brl(o.price)}" style="min-height:40px;max-width:104px" aria-label="Preço">
      <label class="sw"><input type="checkbox" data-o="${i}" data-k="available" ${o.available ? 'checked' : ''}
        aria-label="Disponível"><i></i></label>
      <button class="iconbtn iconbtn--danger" type="button" data-delopt="${i}" aria-label="Remover opção">${icon('trash', 'icon icon--sm')}</button>
    </div>`;

  sheet({
    title: g ? 'Editar adicionais' : 'Novo grupo de adicionais',
    body: `
      <div class="fields">
        <label class="field"><span class="lbl">Nome do grupo</span>
          <input class="input" id="gname" data-autofocus value="${esc(draft.name)}" placeholder="Ex.: Turbine seu lanche">
          <p class="err" id="gerr"></p></label>
        <label class="field"><span class="lbl">Máximo de opções por item</span>
          <input class="input" id="gmax" inputmode="numeric" value="${draft.max}"></label>
      </div>
      <div class="panel-h" style="margin-top:1.25rem"><h2 style="font-size:var(--step-0)">Opções</h2>
        <span class="grow"></span>
        <button class="btn btn--ghost" type="button" id="gadd" style="min-height:36px">${icon('plus', 'icon icon--sm')} Opção</button></div>
      <div class="list" id="gopts">${draft.options.map(optRow).join('')}</div>
      <p class="hint">Desligue a chave para marcar a opção como esgotada sem apagá-la.</p>`,
    foot: `
      <button class="btn btn--primary btn--block" type="button" id="gsave">Salvar</button>
      ${g ? `<button class="btn btn--danger btn--block" type="button" id="gdel">Excluir grupo</button>` : ''}`,
    onMount(el, api) {
      const list = el.querySelector('#gopts');
      const redraw = () => { list.innerHTML = draft.options.map(optRow).join(''); bind(); };
      const bind = () => {
        list.querySelectorAll('[data-o]').forEach((inp) => {
          const i = Number(inp.dataset.o), k = inp.dataset.k;
          inp.addEventListener('change', () => {
            if (k === 'price') { draft.options[i].price = parseBrl(inp.value); inp.value = brl(draft.options[i].price); }
            else if (k === 'available') draft.options[i].available = inp.checked;
            else draft.options[i].name = inp.value;
          });
        });
        list.querySelectorAll('[data-delopt]').forEach((b) => b.addEventListener('click', () => {
          draft.options.splice(Number(b.dataset.delopt), 1); redraw();
        }));
      };
      bind();
      el.querySelector('#gadd').addEventListener('click', () => {
        draft.options.push({ id: uid('o'), name: '', price: 0, available: true }); redraw();
        list.querySelector('[data-opt]:last-child .input')?.focus();
      });
      el.querySelector('#gsave').addEventListener('click', async () => {
        draft.name = el.querySelector('#gname').value.trim();
        draft.max = Math.max(1, parseInt(onlyDigits(el.querySelector('#gmax').value) || '1', 10));
        if (!draft.name) { el.querySelector('#gerr').innerHTML = `${icon('alert', 'icon icon--sm')} Dê um nome ao grupo.`; return; }
        draft.options = draft.options.filter((o) => o.name.trim());
        await store.commit((s) => {
          const at = s.addonGroups.findIndex((x) => x.id === draft.id);
          if (at >= 0) s.addonGroups[at] = draft; else s.addonGroups.push(draft);
        });
        api.close(); toast('Adicionais salvos', { icon: icon('checkCircle', 'icon') });
      });
      el.querySelector('#gdel')?.addEventListener('click', async () => {
        const used = S.products.filter((p) => p.addonGroups.includes(g.id));
        if (used.length) { toast(`${plural(used.length, 'produto usa', 'produtos usam')} este grupo. Tire deles primeiro.`, { type: 'err', icon: icon('alert', 'icon') }); return; }
        if (!confirm(`Excluir o grupo “${g.name}”?`)) return;
        await store.commit((s) => { s.addonGroups = s.addonGroups.filter((x) => x.id !== g.id); });
        api.close(); toast('Grupo excluído', { icon: icon('trash', 'icon') });
      });
    },
  });
}

/* -------------------------------------------------------- product sheet */
function productSheet(id) {
  const p = id ? sel.product(id, S) : null;
  const cats = [...S.categories].sort((a, b) => a.order - b.order);
  const d = p ? JSON.parse(JSON.stringify(p)) : {
    id: uid('p'), categoryId: cats[0]?.id, name: '', desc: '', price: 0, promoPrice: null,
    badges: [], art: 'burger-classico', img: null, photo: null, available: true,
    order: 999, variations: [], addonGroups: [], suggestions: [],
  };

  const varBlock = (v, vi) => `
    <div class="card" data-var="${vi}" style="margin-top:.75rem">
      <div style="display:flex;gap:.5rem;align-items:flex-end">
        <label class="field" style="flex:1"><span class="lbl">Nome da variação</span>
          <input class="input" data-v="${vi}" data-k="name" value="${esc(v.name)}" placeholder="Ex.: Tamanho" style="min-height:40px"></label>
        <button class="iconbtn iconbtn--danger" type="button" data-delvar="${vi}" aria-label="Remover variação">${icon('trash', 'icon icon--sm')}</button>
      </div>
      <div class="item" style="margin-top:.5rem"><div class="body"><div class="t">Escolha obrigatória</div>
        <div class="s">o cliente não consegue adicionar sem escolher</div></div>
        <label class="sw"><input type="checkbox" data-v="${vi}" data-k="required" ${v.required ? 'checked' : ''}
          aria-label="Obrigatória"><i></i></label></div>
      <div class="list" style="margin-top:.5rem">
        ${v.options.map((o, oi) => `
          <div class="item">
            <input class="input" data-vo="${vi}.${oi}" data-k="name" value="${esc(o.name)}" placeholder="Opção" style="min-height:38px" aria-label="Nome da opção">
            <input class="input" data-vo="${vi}.${oi}" data-k="priceDelta" value="${brl(o.priceDelta)}" style="min-height:38px;max-width:100px" aria-label="Acréscimo">
            <label class="sw"><input type="checkbox" data-vo="${vi}.${oi}" data-k="available" ${o.available ? 'checked' : ''} aria-label="Disponível"><i></i></label>
            <button class="iconbtn iconbtn--danger" type="button" data-delvopt="${vi}.${oi}" aria-label="Remover">${icon('trash', 'icon icon--sm')}</button>
          </div>`).join('')}
      </div>
      <button class="btn btn--quiet" type="button" data-addvopt="${vi}" style="margin-top:.5rem">
        ${icon('plus', 'icon icon--sm')} Opção</button>
    </div>`;

  sheet({
    title: p ? 'Editar produto' : 'Novo produto',
    body: `
      <div class="fields">
        <label class="field"><span class="lbl">Nome</span>
          <input class="input" id="pname" data-autofocus value="${esc(d.name)}" placeholder="Ex.: Cheddar Duplo">
          <p class="err" id="perr"></p></label>
        <label class="field"><span class="lbl">Descrição</span>
          <textarea class="textarea" id="pdesc" rows="3" placeholder="O que vai no prato, em uma frase que dá vontade.">${esc(d.desc)}</textarea></label>
        <label class="field"><span class="lbl">Categoria</span>
          <select class="select" id="pcat">
            ${cats.map((c) => `<option value="${c.id}" ${c.id === d.categoryId ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}
          </select></label>
        <div class="grid2">
          <label class="field"><span class="lbl">Preço</span>
            <input class="input" id="pprice2" value="${brl(d.price)}"></label>
          <label class="field"><span class="lbl">Preço promocional</span>
            <input class="input" id="ppromo" value="${d.promoPrice != null ? brl(d.promoPrice) : ''}" placeholder="vazio = sem promoção">
            <p class="err" id="promoerr"></p></label>
        </div>
      </div>

      <div class="panel-h" style="margin-top:1.25rem"><h2 style="font-size:var(--step-0)">Imagem</h2></div>
      <div class="card">
        <label class="field"><span class="lbl">Endereço de uma foto (opcional)</span>
          <input class="input" id="pphoto" value="${esc(d.photo || '')}" placeholder="https://..." inputmode="url">
          <p class="hint">Com foto, ela substitui o desenho. Sem foto, o cardápio usa o pictograma abaixo —
          que é parte do estilo da casa, não um quebra-galho.</p></label>
        <div style="display:flex;gap:.75rem;align-items:center;margin-top:.75rem">
          <div class="thumb" style="width:64px;height:64px;border-radius:var(--r-2);overflow:hidden;background:var(--surface-2)" id="imgprev">${
            d.img ? `<img src="assets/img/p/${encodeURIComponent(d.img)}-sm.webp" alt="">` : artSvg(d.art, '')}</div>
          <label class="field" style="flex:1"><span class="lbl">Foto do cardápio</span>
            <select class="select" id="pimg">
              <option value="">— sem foto, usar desenho —</option>
              ${BUNDLED.map((k) => `<option value="${k}" ${k === d.img ? 'selected' : ''}>${k}</option>`).join('')}
            </select></label>
        </div>
        <label class="field" style="margin-top:.75rem"><span class="lbl">Desenho (quando não houver foto)</span>
          <select class="select" id="part">
            ${artKeys.map((k) => `<option value="${k}" ${k === d.art ? 'selected' : ''}>${k}</option>`).join('')}
          </select></label>
      </div>

      <div class="panel-h" style="margin-top:1.25rem"><h2 style="font-size:var(--step-0)">Selos e disponibilidade</h2></div>
      <div class="card">
        <div class="list">
          <div class="item"><div class="body"><div class="t">Disponível</div></div>
            <label class="sw"><input type="checkbox" id="pavail" ${d.available ? 'checked' : ''} aria-label="Disponível"><i></i></label></div>
          <div class="item"><div class="body"><div class="t">Mais pedido</div></div>
            <label class="sw"><input type="checkbox" id="ptop" ${d.badges.includes('top') ? 'checked' : ''} aria-label="Mais pedido"><i></i></label></div>
          <div class="item"><div class="body"><div class="t">Novidade</div></div>
            <label class="sw"><input type="checkbox" id="pnovo" ${d.badges.includes('novo') ? 'checked' : ''} aria-label="Novidade"><i></i></label></div>
        </div>
        <p class="hint">O selo de promoção aparece sozinho quando há preço promocional.</p>
      </div>

      <div class="panel-h" style="margin-top:1.25rem"><h2 style="font-size:var(--step-0)">Variações</h2>
        <span class="grow"></span>
        <button class="btn btn--ghost" type="button" id="addvar" style="min-height:36px">${icon('plus', 'icon icon--sm')} Variação</button></div>
      <div id="vars">${d.variations.map(varBlock).join('')}</div>
      <p class="hint">Variação é uma escolha única: ponto da carne, tamanho, sabor.</p>

      <div class="panel-h" style="margin-top:1.25rem"><h2 style="font-size:var(--step-0)">Grupos de adicionais</h2></div>
      <div class="card"><div class="group-list">
        ${S.addonGroups.map((g) => `
          <label class="choice tap"><input type="checkbox" data-ag="${g.id}" ${d.addonGroups.includes(g.id) ? 'checked' : ''}>
          <span class="ch-name">${esc(g.name)}</span><span class="ch-price">${plural(g.options.length, 'opção', 'opções')}</span></label>`).join('')}
      </div></div>

      <div class="panel-h" style="margin-top:1.25rem"><h2 style="font-size:var(--step-0)">Vai bem com</h2></div>
      <div class="card"><div class="group-list" style="max-height:240px;overflow:auto">
        ${S.products.filter((x) => x.id !== d.id).map((x) => `
          <label class="choice tap"><input type="checkbox" data-sg="${x.id}" ${d.suggestions.includes(x.id) ? 'checked' : ''}>
          <span class="ch-name">${esc(x.name)}</span></label>`).join('')}
      </div><p class="hint">Aparecem como sugestão dentro da ficha deste produto.</p></div>`,
    foot: `
      <button class="btn btn--primary btn--block" type="button" id="psave">Salvar produto</button>
      ${p ? `<div class="grid2">
        <button class="btn btn--ghost" type="button" id="pdup">${icon('copy', 'icon icon--sm')} Duplicar</button>
        <button class="btn btn--danger" type="button" id="pdel">${icon('trash', 'icon icon--sm')} Excluir</button>
      </div>` : ''}`,
    onMount(el, api) {
      const vars = el.querySelector('#vars');
      const redrawVars = () => { vars.innerHTML = d.variations.map(varBlock).join(''); bindVars(); };
      const bindVars = () => {
        vars.querySelectorAll('[data-v]').forEach((inp) => {
          const i = Number(inp.dataset.v), k = inp.dataset.k;
          inp.addEventListener('change', () => {
            if (k === 'required') d.variations[i].required = inp.checked;
            else d.variations[i].name = inp.value;
          });
        });
        vars.querySelectorAll('[data-vo]').forEach((inp) => {
          const [vi, oi] = inp.dataset.vo.split('.').map(Number); const k = inp.dataset.k;
          inp.addEventListener('change', () => {
            const o = d.variations[vi].options[oi];
            if (k === 'priceDelta') { o.priceDelta = parseBrl(inp.value); inp.value = brl(o.priceDelta); }
            else if (k === 'available') o.available = inp.checked;
            else o.name = inp.value;
          });
        });
        vars.querySelectorAll('[data-delvar]').forEach((b) => b.addEventListener('click', () => {
          d.variations.splice(Number(b.dataset.delvar), 1); redrawVars();
        }));
        vars.querySelectorAll('[data-delvopt]').forEach((b) => b.addEventListener('click', () => {
          const [vi, oi] = b.dataset.delvopt.split('.').map(Number);
          d.variations[vi].options.splice(oi, 1); redrawVars();
        }));
        vars.querySelectorAll('[data-addvopt]').forEach((b) => b.addEventListener('click', () => {
          d.variations[Number(b.dataset.addvopt)].options.push({ id: uid('o'), name: '', priceDelta: 0, available: true });
          redrawVars();
        }));
      };
      bindVars();
      el.querySelector('#addvar').addEventListener('click', () => {
        d.variations.push({ id: uid('v'), name: '', required: true, max: 1, options: [{ id: uid('o'), name: '', priceDelta: 0, available: true }] });
        redrawVars();
      });

      const artSelect = el.querySelector('#part');
      const imgSelect = el.querySelector('#pimg');
      const prev = () => {
        el.querySelector('#imgprev').innerHTML = imgSelect.value
          ? `<img src="assets/img/p/${encodeURIComponent(imgSelect.value)}-sm.webp" alt="">`
          : artSvg(artSelect.value, '');
      };
      artSelect.addEventListener('change', prev);
      imgSelect.addEventListener('change', prev);

      el.querySelector('#psave').addEventListener('click', async () => {
        const name = el.querySelector('#pname').value.trim();
        if (!name) { el.querySelector('#perr').innerHTML = `${icon('alert', 'icon icon--sm')} O produto precisa de um nome.`; return; }
        const price = parseBrl(el.querySelector('#pprice2').value);
        const promoRaw = el.querySelector('#ppromo').value.trim();
        const promo = promoRaw ? parseBrl(promoRaw) : null;
        if (promo != null && promo >= price) {
          el.querySelector('#promoerr').innerHTML = `${icon('alert', 'icon icon--sm')} A promoção precisa ser menor que o preço.`;
          return;
        }
        if (price <= 0) { el.querySelector('#perr').innerHTML = `${icon('alert', 'icon icon--sm')} Informe um preço maior que zero.`; return; }

        const badges = [];
        if (el.querySelector('#ptop').checked) badges.push('top');
        if (el.querySelector('#pnovo').checked) badges.push('novo');

        Object.assign(d, {
          name,
          desc: el.querySelector('#pdesc').value.trim(),
          categoryId: el.querySelector('#pcat').value,
          price, promoPrice: promo, badges,
          art: artSelect.value,
          img: imgSelect.value || null,
          photo: el.querySelector('#pphoto').value.trim() || null,
          available: el.querySelector('#pavail').checked,
          addonGroups: [...el.querySelectorAll('[data-ag]:checked')].map((x) => x.dataset.ag),
          suggestions: [...el.querySelectorAll('[data-sg]:checked')].map((x) => x.dataset.sg),
          variations: d.variations
            .map((v) => ({ ...v, options: v.options.filter((o) => o.name.trim()) }))
            .filter((v) => v.name.trim() && v.options.length),
        });

        await store.commit((s) => {
          const at = s.products.findIndex((x) => x.id === d.id);
          if (at >= 0) s.products[at] = d;
          else { d.order = Math.max(0, ...s.products.filter((x) => x.categoryId === d.categoryId).map((x) => x.order)) + 1; s.products.push(d); }
        });
        api.close(); toast('Produto salvo', { icon: icon('checkCircle', 'icon') });
      });

      el.querySelector('#pdup')?.addEventListener('click', async () => {
        await store.commit((s) => {
          const copy = JSON.parse(JSON.stringify(sel.product(p.id, s)));
          copy.id = uid('p'); copy.name = p.name + ' (cópia)';
          copy.order = Math.max(0, ...s.products.filter((x) => x.categoryId === copy.categoryId).map((x) => x.order)) + 1;
          s.products.push(copy);
        });
        api.close(); toast('Produto duplicado', { icon: icon('copy', 'icon') });
      });
      el.querySelector('#pdel')?.addEventListener('click', async () => {
        if (!confirm(`Excluir “${p.name}” do cardápio?`)) return;
        await store.commit((s) => {
          s.products = s.products.filter((x) => x.id !== p.id);
          s.products.forEach((x) => { x.suggestions = x.suggestions.filter((y) => y !== p.id); });
        });
        api.close(); toast('Produto excluído', { icon: icon('trash', 'icon') });
      });
    },
  });
}
