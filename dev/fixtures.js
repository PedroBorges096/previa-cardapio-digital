/* ===========================================================================
   DEV ONLY — worst-case fixtures. Loaded by dynamic import, and only when
   ?data= is present, so this file is never fetched by a real visitor.
   Values are plausible Brazilian menu data, not keyboard mashing.
   =========================================================================== */
import { SEED } from '../assets/js/config.js';

const clone = (o) => JSON.parse(JSON.stringify(o));

const LONG_DESC =
  'Quatro hambúrgueres de blend de acém e peito de 160 g cada, selados na chapa e finalizados com queijo prato derretido, ' +
  'duas porções grandes de batata rústica com casca, sal grosso e alecrim, dois refrigerantes de 1,5 L gelados, ' +
  'quatro potinhos de maionese da casa e, por conta da casa, uma porção pequena de anéis de cebola empanados na cerveja preta. ' +
  'Serve confortavelmente quatro pessoas com fome de verdade, ou cinco se alguém estiver de dieta.';

function worst() {
  const s = clone(SEED);
  s.brand.name = 'BRASA Burger House Hamburgueria Artesanal da Vila Operária';
  s.brand.tagline = 'Smashed with a whole lot of attitude, every single night.';
  s.contact.address.street = 'Avenida Professor Doutor Antônio Carlos de Abreu Sodré Júnior, 14.877';
  s.contact.address.reference = 'entradapelaruadetrásdopostoaoladodoborracheiroportãoverdeescuro';
  s.contact.address.district = 'Conjunto Habitacional Jardim das Oficinas Metalúrgicas II';
  s.categories[2].name = 'Acompanhamentos, porções e petiscos para dividir na mesa';
  s.service.districts[4] = { name: 'Núcleo Residencial Doutor Antônio Dias Adorno (Zona Rural)', fee: 3250 };

  const p = s.products;
  p[0].name = 'Combo Família Parada Obrigatória com Quatro Hambúrgueres, Duas Porções Grandes e Dois Refrigerantes de 1,5 L';
  p[0].desc = LONG_DESC;
  p[0].price = 189990; p[0].promoPrice = 169990;           // R$ 1.899,90 -> R$ 1.699,90
  p[1].name = 'Pão';                                        // the short case
  p[1].desc = '';                                           // the missing optional field
  p[1].price = 50; p[1].promoPrice = null;                  // R$ 0,50
  p[2].badges = ['top', 'novo'];                            // every badge at once
  p[2].promoPrice = p[2].price - 10;
  p[3].name = 'X-Tudo';
  p[3].variations = [{
    id: 'ponto', name: 'Ponto da carne, do jeito que você prefere na chapa', required: true, max: 1,
    options: [
      { id: 'a', name: 'Ao ponto para menos, com o centro ainda rosado e bem suculento', priceDelta: 0, available: true },
      { id: 'b', name: 'Bem passada', priceDelta: 0, available: false },
    ],
  }];
  s.addonGroups[0].options[0].name = 'Bacon extra em fatias largas defumadas na lenha por doze horas';
  s.addonGroups[0].options[0].price = 12990;
  return s;
}

function empty() {
  const s = clone(SEED);
  s.products = []; s.categories = []; s.addonGroups = [];
  return s;
}

function one() {
  const s = clone(SEED);
  s.categories = [s.categories[1]];
  s.products = [s.products.find((x) => x.id === 'b-barbecue')];
  s.products[0].variations = []; s.products[0].addonGroups = []; s.products[0].suggestions = [];
  s.service.districts = [s.service.districts[0]];
  return s;
}

function huge() {
  const s = clone(SEED);
  const base = s.products.filter((x) => x.categoryId === 'burgers');
  const out = [...s.products];
  for (let i = 0; i < 300; i++) {
    const b = clone(base[i % base.length]);
    b.id = 'x' + i; b.order = 100 + i;
    b.name = `${b.name} nº ${i + 1}`;
    out.push(b);
  }
  s.products = out;
  return s;
}

export const FIXTURES = { worst, empty, one, huge };

export function fixtureBar(active) {
  const states = [['', 'Demo'], ['worst', 'Pior caso'], ['empty', 'Vazio'], ['one', 'Um'], ['huge', '300 itens']];
  const el = document.createElement('div');
  el.style.cssText = `position:fixed;left:50%;transform:translateX(-50%);bottom:8px;z-index:999;
    display:flex;gap:2px;padding:3px;border-radius:999px;background:#2b2b2b;border:1px solid #4a4a4a;
    font:600 11px/1 system-ui,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.5)`;
  el.innerHTML = states.map(([v, l]) =>
    `<a href="?${v ? 'data=' + v : ''}" style="padding:6px 10px;border-radius:999px;text-decoration:none;
      ${v === active ? 'background:#fff;color:#111' : 'color:#ccc'}">${l}</a>`).join('');
  document.body.appendChild(el);
}
