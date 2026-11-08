/* ===========================================================================
   Tenant seed — BRASA Burger House.
   Nothing in the rest of the codebase names a restaurant: every identity,
   catalog and rule fact lives here. A second establishment is a copy of this
   file (or a row in a `tenants` table once a backend exists).
   All money is an integer number of centavos. Never floats.

   Images: `img` is a local cut-out shot (we ship 320w and 640w WebP),
   `photo` is a full URL an operator pastes in the admin, `art` is the vector
   fallback used only when a product has neither.
   =========================================================================== */

export const SCHEMA_VERSION = 5;
export const DEMO_WHATSAPP = '5511999999999'; // placeholder — the admin nags until it changes

const PONTO = {
  id: 'ponto', name: 'Ponto da carne', required: true, max: 1, options: [
    { id: 'ponto-menos', name: 'Ao ponto para menos', priceDelta: 0, available: true },
    { id: 'ponto', name: 'Ao ponto', priceDelta: 0, available: true },
    { id: 'bem', name: 'Bem passada', priceDelta: 0, available: true },
  ],
};

export const SEED = {
  brand: {
    slug: 'brasa',
    name: 'BRASA',
    legal: 'BRASA Burger House',
    kicker: 'Burger House',
    tagline: 'Smashed with attitude.',
    logoDark: 'assets/img/logo-brasa.png',
    logoLight: 'assets/img/logo-brasa-light.png',
    mark: 'assets/img/mark-brasa.png',
    intro: 'Smash de 160 g prensado na chapa quente, pão brioche tostado na manteiga e queijo escorrendo pela borda. Hambúrguer de verdade, sem firula.',
    about:
      'A BRASA começou com uma chapa de ferro, um saco de carvão e a teimosia de prensar o hambúrguer no ponto certo. O blend é moído todo dia, o pão vai para a chapa com manteiga e a batata sai do óleo direto para o papel. Nada congelado, nada montado antes da hora.',
  },

  /* role tokens written to :root at boot — this is the whole re-skin surface */
  theme: {
    '--surface-0': '#171717', '--surface-1': '#211F1D', '--surface-2': '#2C2824',
    '--surface-3': '#3A342E', '--ink': '#171717',
    '--text-1': '#F4E8D4', '--text-2': '#C3B6A3', '--text-3': '#9C9080',
    '--accent': '#C87943', '--accent-2': '#E0945C',
    '--alert': '#7B2925', '--alert-text': '#E78477', '--alert-deep': '#5C1C19',
  },

  contact: {
    whatsapp: DEMO_WHATSAPP,
    phone: '(11) 99999-9999',
    instagram: 'brasaburgerhouse',
    address: {
      street: 'Rua da Chapa, 220',
      district: 'Vila Operária',
      city: 'São Paulo',
      state: 'SP',
      zip: '03120-000',
      reference: 'Esquina com a praça, fachada preta e letreiro aceso',
    },
    maps: 'https://www.google.com/maps/search/?api=1&query=Rua+da+Chapa+220+Sao+Paulo',
  },

  /* 0 = domingo */
  hours: [
    { day: 0, open: '18:00', close: '23:00', closed: false },
    { day: 1, open: '18:00', close: '23:30', closed: true },
    { day: 2, open: '18:00', close: '23:30', closed: false },
    { day: 3, open: '18:00', close: '23:30', closed: false },
    { day: 4, open: '18:00', close: '23:30', closed: false },
    { day: 5, open: '18:00', close: '01:00', closed: false },
    { day: 6, open: '18:00', close: '01:00', closed: false },
  ],
  manualStatus: 'auto',

  service: {
    delivery: true, pickup: true,
    etaDelivery: [40, 60], etaPickup: [20, 30],
    minOrder: 2500, freeDeliveryAbove: 9000, defaultFee: 900,
    districts: [
      { name: 'Vila Operária', fee: 500 },
      { name: 'Jardim da Chapa', fee: 700 },
      { name: 'Parque Industrial', fee: 900 },
      { name: 'Alto da Serra', fee: 1200 },
      { name: 'Outro bairro', fee: 1400 },
    ],
  },

  payments: [
    { id: 'pix', label: 'Pix', icon: 'transfer', active: true },
    { id: 'dinheiro', label: 'Dinheiro', icon: 'cash', active: true },
    { id: 'credito', label: 'Crédito na entrega', icon: 'card', active: true },
    { id: 'debito', label: 'Débito na entrega', icon: 'card', active: true },
  ],
  pixKey: 'pedidos@brasaburger.com.br',

  /* Prepared, not pretended. The UI labels this as not integrated. */
  onlinePayment: { enabled: false, provider: null },

  categories: [
    { id: 'combos', name: 'Combos', icon: 'box', order: 1, active: true },
    { id: 'burgers', name: 'Hambúrgueres', icon: 'flame', order: 2, active: true },
    { id: 'porcoes', name: 'Porções', icon: 'kitchen', order: 3, active: true },
    { id: 'bebidas', name: 'Bebidas', icon: 'cup', order: 4, active: true },
    { id: 'sobremesas', name: 'Sobremesas', icon: 'spark', order: 5, active: true },
  ],

  addonGroups: [
    {
      id: 'extras', name: 'Turbine o seu', min: 0, max: 5, options: [
        { id: 'bacon', name: 'Bacon extra', price: 800, available: true },
        { id: 'cheddar', name: 'Cheddar extra', price: 600, available: true },
        { id: 'carne', name: 'Smash extra 160 g', price: 1400, available: true },
        { id: 'coalho', name: 'Queijo coalho grelhado', price: 700, available: true },
        { id: 'ovo', name: 'Ovo frito', price: 500, available: true },
        { id: 'cebola', name: 'Cebola caramelizada', price: 500, available: true },
        { id: 'picles', name: 'Picles da casa', price: 300, available: true },
        { id: 'onion', name: 'Anéis de cebola no lanche', price: 600, available: false },
      ],
    },
    {
      id: 'molhos', name: 'Molhos à parte', min: 0, max: 4, options: [
        { id: 'barbecue', name: 'Barbecue defumado', price: 400, available: true },
        { id: 'casa', name: 'Maionese da casa', price: 400, available: true },
        { id: 'chipotle', name: 'Maionese de chipotle', price: 500, available: true },
        { id: 'cheddarq', name: 'Cheddar quente', price: 600, available: true },
        { id: 'alho', name: 'Maionese de alho', price: 400, available: true },
      ],
    },
    {
      id: 'retirar', name: 'Prefere sem', min: 0, max: 5, options: [
        { id: 'sem-cebola', name: 'Sem cebola', price: 0, available: true },
        { id: 'sem-picles', name: 'Sem picles', price: 0, available: true },
        { id: 'sem-tomate', name: 'Sem tomate', price: 0, available: true },
        { id: 'sem-alface', name: 'Sem alface', price: 0, available: true },
        { id: 'sem-maionese', name: 'Sem maionese', price: 0, available: true },
      ],
    },
  ],

  products: [
    /* ---------------------------------------------------------- combos --- */
    {
      id: 'c-brasa', categoryId: 'combos', img: 'classico', art: 'combo', order: 1, available: true,
      name: 'Combo BRASA',
      desc: 'O Clássico, uma batata frita pequena e um refrigerante lata. O pedido que mais sai do balcão.',
      price: 4800, promoPrice: 4290, badges: ['promo', 'top'],
      variations: [{
        id: 'bebida', name: 'Escolha a bebida', required: true, max: 1, options: [
          { id: 'cola', name: 'Refrigerante de cola', priceDelta: 0, available: true },
          { id: 'guarana', name: 'Guaraná', priceDelta: 0, available: true },
          { id: 'zero', name: 'Cola zero', priceDelta: 0, available: true },
          { id: 'frutas', name: 'Refresco de frutas vermelhas', priceDelta: 400, available: true },
        ],
      }, PONTO],
      addonGroups: ['extras', 'molhos'], suggestions: ['s-brownie-sorvete', 'p-aneis'],
    },
    {
      id: 'c-duplo', categoryId: 'combos', img: 'duplo', art: 'combo', order: 2, available: true,
      name: 'Combo Duplo',
      desc: 'Duplo Smash, batata com cheddar e bacon e um refrigerante lata. Para quem chegou com fome de verdade.',
      price: 6900, promoPrice: 6290, badges: ['promo'],
      variations: [{
        id: 'bebida', name: 'Escolha a bebida', required: true, max: 1, options: [
          { id: 'cola', name: 'Refrigerante de cola', priceDelta: 0, available: true },
          { id: 'guarana', name: 'Guaraná', priceDelta: 0, available: true },
          { id: 'zero', name: 'Cola zero', priceDelta: 0, available: true },
        ],
      }, PONTO],
      addonGroups: ['extras', 'molhos'], suggestions: ['s-brownie-sorvete'],
    },
    {
      id: 'c-casa', categoryId: 'combos', img: 'bacon', art: 'combo', order: 3, available: true,
      name: 'Combo da Casa',
      desc: 'Duplo Smash, Bacon na Brasa, uma batata cheddar e bacon grande e dois refrigerantes. Serve bem duas pessoas.',
      price: 12990, promoPrice: null, badges: [],
      variations: [], addonGroups: ['extras', 'molhos'], suggestions: ['s-brownie-sorvete', 'p-empanado'],
    },

    /* -------------------------------------------------------- burgers --- */
    {
      id: 'b-classico', categoryId: 'burgers', img: 'classico', art: 'burger-classico', order: 1, available: true,
      name: 'BRASA Clássico',
      desc: 'Smash de 160 g prensado na chapa, cheddar derretido, alface americana, tomate e maionese da casa no pão brioche.',
      price: 3200, promoPrice: null, badges: ['top'],
      variations: [PONTO], addonGroups: ['extras', 'molhos', 'retirar'],
      suggestions: ['p-batata', 'bb-refri', 's-brownie-sorvete'],
    },
    {
      id: 'b-duplo', categoryId: 'burgers', img: 'duplo', art: 'burger-duplo', order: 2, available: true,
      name: 'Duplo Smash',
      desc: 'Dois smashes de 160 g, duas fatias de cheddar entre as carnes, alface e tomate. O carro-chefe da casa.',
      price: 4600, promoPrice: null, badges: ['top'],
      variations: [PONTO], addonGroups: ['extras', 'molhos', 'retirar'],
      suggestions: ['p-batata-cheddar', 'bb-refri'],
    },
    {
      id: 'b-bacon', categoryId: 'burgers', img: 'bacon', art: 'burger-bacon', order: 3, available: true,
      name: 'Bacon na Brasa',
      desc: 'Smash de 160 g, fatias largas de bacon defumado na hora, cheddar, alface e tomate.',
      price: 4100, promoPrice: null, badges: [],
      variations: [PONTO], addonGroups: ['extras', 'molhos', 'retirar'],
      suggestions: ['p-batata', 'bb-refri'],
    },
    {
      id: 'b-barbecue', categoryId: 'burgers', img: 'barbecue', art: 'burger-bacon', order: 4, available: true,
      name: 'Barbecue Crunch',
      desc: 'Smash de 160 g, cheddar, anéis de cebola crocantes e barbecue defumado escorrendo por cima.',
      price: 4400, promoPrice: null, badges: ['novo'],
      variations: [PONTO], addonGroups: ['extras', 'molhos', 'retirar'],
      suggestions: ['p-batata-cheddar', 'bb-refri'],
    },
    {
      id: 'b-frango', categoryId: 'burgers', img: 'frango', art: 'burger-frango', order: 5, available: true,
      name: 'Frango Crocante',
      desc: 'Sobrecoxa desossada empanada em panko, cheddar, alface e maionese da casa. Crocante de verdade.',
      price: 3400, promoPrice: null, badges: [],
      variations: [], addonGroups: ['extras', 'molhos', 'retirar'],
      suggestions: ['p-batata', 'bb-frutas'],
    },

    /* -------------------------------------------------------- porções --- */
    {
      id: 'p-batata', categoryId: 'porcoes', img: 'batata', art: 'fritas', order: 1, available: true,
      name: 'Batata Frita',
      desc: 'Batata cortada fina, frita na hora e salgada ainda quente. Vai com maionese da casa.',
      price: 2400, promoPrice: null, badges: ['top'],
      variations: [{
        id: 'tam', name: 'Tamanho', required: true, max: 1, options: [
          { id: 'p', name: 'Pequena — serve 1', priceDelta: 0, available: true },
          { id: 'm', name: 'Média — serve 2', priceDelta: 800, available: true },
          { id: 'g', name: 'Grande — serve 3 a 4', priceDelta: 1500, available: true },
        ],
      }],
      addonGroups: ['molhos'], suggestions: ['b-classico'],
    },
    {
      id: 'p-batata-cheddar', categoryId: 'porcoes', img: 'batata-cheddar', art: 'fritas', order: 2, available: true,
      name: 'Batata Cheddar & Bacon',
      desc: 'Batata frita coberta de cheddar quente e bacon picado crocante. Some da mesa em dois minutos.',
      price: 3600, promoPrice: 2990, badges: ['promo', 'top'],
      variations: [{
        id: 'tam', name: 'Tamanho', required: true, max: 1, options: [
          { id: 'm', name: 'Média — serve 2', priceDelta: 0, available: true },
          { id: 'g', name: 'Grande — serve 3 a 4', priceDelta: 1400, available: true },
        ],
      }],
      addonGroups: [], suggestions: ['bb-refri'],
    },
    {
      id: 'p-aneis', categoryId: 'porcoes', img: 'aneis', art: 'aneis', order: 3, available: true,
      name: 'Anéis de Cebola',
      desc: 'Dez anéis empanados em massa de cerveja, servidos com barbecue defumado.',
      price: 2600, promoPrice: null, badges: [],
      variations: [], addonGroups: ['molhos'], suggestions: ['b-barbecue'],
    },
    {
      id: 'p-empanado', categoryId: 'porcoes', img: 'empanado', art: 'bolinho', order: 4, available: true,
      name: 'Frango Empanado',
      desc: 'Iscas de peito de frango empanadas em panko, douradas por fora e suculentas por dentro.',
      price: 3200, promoPrice: null, badges: [],
      variations: [{
        id: 'qtd', name: 'Tamanho da porção', required: true, max: 1, options: [
          { id: 's8', name: '8 unidades', priceDelta: 0, available: true },
          { id: 's16', name: '16 unidades', priceDelta: 2600, available: true },
        ],
      }],
      addonGroups: ['molhos'], suggestions: ['bb-refri'],
    },
    {
      id: 'p-molhos', categoryId: 'porcoes', img: 'molhos', art: 'salada', order: 5, available: true,
      name: 'Kit 5 Molhos',
      desc: 'Maionese da casa, barbecue defumado, cheddar quente, chipotle e maionese de alho. Todos feitos aqui.',
      price: 1800, promoPrice: null, badges: [],
      variations: [], addonGroups: [], suggestions: ['p-batata'],
    },

    /* --------------------------------------------------------- bebidas --- */
    {
      id: 'bb-refri', categoryId: 'bebidas', img: 'refri-cola', art: 'refri-cola', order: 1, available: true,
      name: 'Refrigerante',
      desc: 'Copo de 500 ml com bastante gelo.',
      price: 800, promoPrice: null, badges: [],
      variations: [{
        id: 'sabor', name: 'Sabor', required: true, max: 1, options: [
          { id: 'cola', name: 'Cola', priceDelta: 0, available: true },
          { id: 'colazero', name: 'Cola zero', priceDelta: 0, available: true },
          { id: 'guarana', name: 'Guaraná', priceDelta: 0, available: true },
          { id: 'laranja', name: 'Laranja', priceDelta: 0, available: false },
        ],
      }],
      addonGroups: [], suggestions: [],
    },
    {
      id: 'bb-frutas', categoryId: 'bebidas', img: 'refri-frutas', art: 'suco', order: 2, available: true,
      name: 'Refresco de Frutas Vermelhas',
      desc: 'Morango, amora e framboesa batidos na hora, servidos bem gelados.',
      price: 1200, promoPrice: null, badges: [],
      variations: [], addonGroups: [], suggestions: [],
    },
    {
      id: 'bb-shake-choc', categoryId: 'bebidas', img: 'shake-chocolate', art: 'milkshake', order: 3, available: true,
      name: 'Milkshake de Chocolate',
      desc: 'Sorvete batido bem encorpado, calda de chocolate e chantili por cima. 400 ml.',
      price: 1900, promoPrice: null, badges: ['top'],
      variations: [], addonGroups: [], suggestions: [],
    },
    {
      id: 'bb-shake-mor', categoryId: 'bebidas', img: 'shake-morango', art: 'milkshake', order: 4, available: true,
      name: 'Milkshake de Morango',
      desc: 'Morango de verdade batido com sorvete de creme, chantili e calda. 400 ml.',
      price: 1900, promoPrice: null, badges: ['novo'],
      variations: [], addonGroups: [], suggestions: [],
    },

    /* ------------------------------------------------------ sobremesas --- */
    {
      id: 's-brownie-sorvete', categoryId: 'sobremesas', img: 'brownie-sorvete', art: 'brownie', order: 1, available: true,
      name: 'Brownie com Sorvete',
      desc: 'Brownie quente de chocolate meio amargo com uma bola de sorvete de creme e calda por cima.',
      price: 2400, promoPrice: null, badges: ['top'],
      variations: [], addonGroups: [], suggestions: [],
    },
    {
      id: 's-brownie', categoryId: 'sobremesas', img: 'brownie', art: 'brownie', order: 2, available: false,
      name: 'Brownie da Casa',
      desc: 'Brownie denso de chocolate meio amargo com pedaços de chocolate, feito aqui todo dia.',
      price: 1600, promoPrice: null, badges: [],
      variations: [], addonGroups: [], suggestions: [],
    },
  ],
};
