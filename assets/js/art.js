/* ===========================================================================
   Enamel-sign pictograms.
   Highway signage speaks in pictograms, so authored vector food art is this
   world's native idiom rather than a stand-in for a missing photograph.
   Every piece: viewBox 0 0 160 160, flat fills, two tones per shape for form,
   optical width ~116px, baseline shadow at y=138.
   A product with a real `photo` URL renders the photo instead (see card()).
   =========================================================================== */

const shade = '<ellipse cx="80" cy="139" rx="50" ry="6.5" fill="#000" opacity=".26"/>';

/* 15 scallops of -8 each = -120, closing the lettuce band back to x=20 */
const scallops = 'q-4 7-8 0'.repeat(1) && Array(15).fill('q-4 7 -8 0').join(' ');

function bun(top = true) {
  return top
    ? `<path d="M22 73a58 33 0 0 1 116 0Z" fill="var(--art-bun)"/>
       <path d="M34 59a46 20 0 0 1 44-14 54 30 0 0 0-44 14Z" fill="var(--art-cream)" opacity=".3"/>`
    : `<path d="M26 110H134v8a14 14 0 0 1-14 14H40a14 14 0 0 1-14-14Z" fill="var(--art-bun)"/>
       <path d="M27 123h106a14 14 0 0 1-13 9H40a14 14 0 0 1-13-9Z" fill="var(--art-bun-2)" opacity=".75"/>`;
}

const bunTop = (lift = 0) => `<g transform="translate(0,${-lift})">
    <path d="M22 73a58 33 0 0 1 116 0Z" fill="var(--art-bun)"/>
    <path d="M34 59a46 20 0 0 1 44-14 54 30 0 0 0-44 14Z" fill="var(--art-cream)" opacity=".3"/>
  </g>`;

const sesame = `
  <g fill="var(--art-cream)" opacity=".92">
    <ellipse cx="62" cy="54" rx="4.6" ry="2.9" transform="rotate(-18 62 54)"/>
    <ellipse cx="84" cy="48" rx="4.6" ry="2.9" transform="rotate(8 84 48)"/>
    <ellipse cx="106" cy="56" rx="4.6" ry="2.9" transform="rotate(24 106 56)"/>
    <ellipse cx="46" cy="64" rx="4.2" ry="2.6" transform="rotate(-32 46 64)"/>
    <ellipse cx="120" cy="66" rx="4.2" ry="2.6" transform="rotate(34 120 66)"/>
  </g>`;

function patty(y, fill = 'var(--art-grill)', dark = 'var(--art-grill-2)') {
  return `<rect x="29" y="${y}" width="102" height="18" rx="9" fill="${fill}"/>
    <rect x="29" y="${y + 11}" width="102" height="7" rx="3.5" fill="#000" opacity=".16"/>
    <g fill="${dark}" opacity=".55">
      <rect x="44" y="${y + 5}" width="22" height="3" rx="1.5"/>
      <rect x="94" y="${y + 5}" width="22" height="3" rx="1.5"/>
    </g>`;
}

const cheese = `
  <g fill="var(--art-cheese)">
    <path d="M26 83h108v10H26Z"/>
    <path d="M118 93h8l-4 12Z"/><path d="M76 93h10l-5 11Z"/><path d="M40 93h10l-5 10Z"/>
  </g>
  <path d="M26 90h108v3H26Z" fill="#000" opacity=".12"/>`;

const lettuce = `
  <path d="M20 74H140v6 ${scallops}Z" fill="var(--art-leaf)"/>
  <path d="M20 76H140v3H20Z" fill="#000" opacity=".1"/>`;

const tomato = `
  <g><circle cx="40" cy="78" r="12" fill="var(--art-tomato)"/>
  <circle cx="40" cy="78" r="6.5" fill="#fff" opacity=".22"/>
  <circle cx="120" cy="78" r="12" fill="var(--art-tomato)"/>
  <circle cx="120" cy="78" r="6.5" fill="#fff" opacity=".22"/></g>`;

const bacon = `
  <g fill="#A8402A">
    <path d="M28 76c12-7 22 5 34-2s22 5 34-2 22 5 34-2v9c-12 7-22-5-34 2s-22-5-34 2-22-5-34 2Z"/>
  </g>
  <path d="M28 79c12-7 22 5 34-2s22 5 34-2 22 5 34-2v3c-12 7-22-5-34 2s-22-5-34 2-22-5-34 2Z" fill="var(--art-cream)" opacity=".35"/>`;

/* --------------------------------------------------------------- burgers */
function burgerArt({ patties = 1, withCheese = true, withLettuce = true, withTomato = true,
                     withBacon = false, pattyFill, pattyDark } = {}) {
  let s = shade + bun(false);

  if (patties === 2) {
    s += patty(94, pattyFill, pattyDark);
    s += `<g transform="translate(0,-20)">${cheese}</g>`;
    s += patty(72, pattyFill, pattyDark);
    if (withLettuce) s += `<g transform="translate(0,-22)">${lettuce}</g>`;
    s += bunTop(22) + `<g transform="translate(0,-22)">${sesame}</g>`;
    return s;
  }

  let lift = 0;                                   // how far the crown rides up
  s += patty(94, pattyFill, pattyDark);
  if (withCheese) s += cheese;
  if (withTomato) s += tomato;
  if (withBacon) { s += `<g transform="translate(0,-10)">${bacon}</g>`; lift = 12; }
  if (withLettuce) s += `<g transform="translate(0,${-lift})">${lettuce}</g>`;
  s += bunTop(lift) + `<g transform="translate(0,${-lift})">${sesame}</g>`;
  return s;
}

/* ------------------------------------------------------------------ sides */
const fries = () => {
  const sticks = [
    [-16, 56, 56], [-7, 70, 48], [2, 84, 44], [10, 98, 52], [-22, 48, 64], [18, 108, 60],
  ].map(([rot, x, h]) =>
    `<rect x="${x}" y="${100 - h}" width="10" height="${h}" rx="4.5"
       transform="rotate(${rot} ${x + 5} ${100 - h / 2})"
       fill="var(--art-bun)"/>
     <rect x="${x}" y="${100 - h}" width="4" height="${h}" rx="2"
       transform="rotate(${rot} ${x + 5} ${100 - h / 2})"
       fill="var(--art-cream)" opacity=".28"/>`
  ).join('');
  return shade + sticks + `
    <path d="M48 92h64l-6 44a6 6 0 0 1-6 5H60a6 6 0 0 1-6-5Z" fill="var(--alert)"/>
    <path d="M49.6 103h60.8l-1.4 10H51Z" fill="var(--art-cream)" opacity=".92"/>
    <path d="M54 136h52l-.4 5a6 6 0 0 1-5.6 5H60a6 6 0 0 1-6-5Z" fill="#000" opacity=".16"/>`;
};

const rings = () => shade + [[56, 98, 25], [105, 92, 21], [82, 120, 20]]
  .map(([cx, cy, r]) => `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--art-bun)" stroke-width="12"/>
    <circle cx="${cx}" cy="${cy - 2}" r="${r}" fill="none" stroke="var(--art-cream)" stroke-width="3" opacity=".3"/>`).join('');

const croquettes = () => shade + [[54, 104, -18], [98, 96, 14], [78, 126, 4]]
  .map(([cx, cy, rot]) => `
    <g transform="rotate(${rot} ${cx} ${cy})">
      <rect x="${cx - 27}" y="${cy - 14}" width="54" height="28" rx="14" fill="var(--art-bun-2)"/>
      <rect x="${cx - 24}" y="${cy - 12}" width="48" height="12" rx="6" fill="var(--art-bun)"/>
    </g>`).join('');

const salad = () => shade + `
  <path d="M28 94h104a52 38 0 0 1-104 0Z" fill="var(--art-cream)"/>
  <path d="M28 94h104a52 14 0 0 1-104 0Z" fill="#000" opacity=".09"/>
  <rect x="24" y="88" width="112" height="9" rx="4.5" fill="var(--art-cream)"/>
  <rect x="24" y="93" width="112" height="4" rx="2" fill="#000" opacity=".12"/>
  <path d="M66 131h28l-2 7a4 4 0 0 1-4 3.4h-16a4 4 0 0 1-4-3.4Z" fill="#C9C2AE"/>
  <g fill="var(--art-leaf)">
    <ellipse cx="56" cy="82" rx="22" ry="14" transform="rotate(-16 56 82)"/>
    <ellipse cx="100" cy="78" rx="24" ry="15" transform="rotate(12 100 78)"/>
    <ellipse cx="78" cy="70" rx="18" ry="12"/>
  </g>
  <circle cx="64" cy="70" r="8" fill="var(--art-tomato)"/>
  <circle cx="110" cy="92" r="7" fill="var(--art-tomato)"/>`;

/* ----------------------------------------------------------------- combos */
const comboArt = () => shade + `
  <!-- fries, left -->
  <g>
    <rect x="25" y="52" width="8" height="42" rx="4" fill="var(--art-bun)" transform="rotate(-13 29 73)"/>
    <rect x="34" y="46" width="8" height="48" rx="4" fill="var(--art-bun)" transform="rotate(-4 38 70)"/>
    <rect x="43" y="50" width="8" height="44" rx="4" fill="var(--art-bun)" transform="rotate(9 47 72)"/>
    <path d="M20 90h36l-3.6 38a5 5 0 0 1-5 4.4H28.6a5 5 0 0 1-5-4.4Z" fill="var(--alert)"/>
    <path d="M20.8 99h34.4l-.9 8H21.7Z" fill="var(--art-cream)" opacity=".92"/>
  </g>
  <!-- burger, centre -->
  <g>
    <path d="M56 106h48v4a9 9 0 0 1-9 9H65a9 9 0 0 1-9-9Z" fill="var(--art-bun)"/>
    <rect x="57" y="94" width="46" height="11" rx="5.5" fill="var(--art-grill)"/>
    <path d="M55 86h50v7H55Z" fill="var(--art-cheese)"/>
    <path d="M94 93h6l-3 7Z" fill="var(--art-cheese)"/><path d="M63 93h6l-3 6Z" fill="var(--art-cheese)"/>
    <path d="M54 86a26 16 0 0 1 52 0Z" fill="var(--art-bun)"/>
    <g fill="var(--art-cream)" opacity=".9">
      <ellipse cx="70" cy="77" rx="3" ry="1.9"/><ellipse cx="82" cy="74" rx="3" ry="1.9"/>
      <ellipse cx="93" cy="78" rx="3" ry="1.9"/>
    </g>
  </g>
  <!-- cup, right -->
  <g>
    <path d="M111 62h31l-3.6 58a7 7 0 0 1-7 6.4h-9.8a7 7 0 0 1-7-6.4Z" fill="var(--art-cream)"/>
    <path d="M111 62h31l-1.2 19h-28.6Z" fill="var(--alert)"/>
    <rect x="107" y="54" width="39" height="9" rx="3" fill="#D9D3C4"/>
    <rect x="130" y="32" width="7" height="26" rx="3.5" fill="var(--alert)" transform="rotate(13 133 45)"/>
  </g>
  <!-- tray -->
  <path d="M12 130h136l-3.4 9a6 6 0 0 1-5.7 4H21.1a6 6 0 0 1-5.7-4Z" fill="var(--art-bun-2)"/>
  <path d="M12 130h136l-1 2.6H13Z" fill="var(--art-cream)" opacity=".25"/>`;

/* --------------------------------------------------------------- drinks */
const can = (band = 'var(--alert)') => shade + `
  <rect x="55" y="34" width="50" height="98" rx="12" fill="#C9CEC8"/>
  <rect x="55" y="34" width="16" height="98" rx="8" fill="#fff" opacity=".35"/>
  <rect x="55" y="62" width="50" height="42" fill="${band}"/>
  <rect x="55" y="62" width="16" height="42" fill="#fff" opacity=".2"/>
  <ellipse cx="80" cy="34" rx="25" ry="6" fill="#9FA69D"/>
  <ellipse cx="80" cy="33" rx="18" ry="3.6" fill="#8A9188"/>
  <rect x="72" y="28" width="16" height="4" rx="2" fill="#B6BCB4"/>`;

const bottle = () => shade + `
  <path d="M70 26h20v20l12 16v62a8 8 0 0 1-8 8H66a8 8 0 0 1-8-8V62l12-16Z" fill="var(--art-grill-2)"/>
  <path d="M70 26h7v20l-7 10Z" fill="var(--art-cream)" opacity=".22"/>
  <rect x="58" y="76" width="44" height="30" fill="var(--art-cream)"/>
  <rect x="58" y="76" width="44" height="7" fill="var(--accent)"/>
  <rect x="66" y="88" width="28" height="4" rx="2" fill="var(--art-grill)" opacity=".5"/>
  <rect x="70" y="22" width="20" height="7" rx="2.5" fill="var(--accent)"/>`;

const glass = (liquid = 'var(--accent-2)', withSlice = true) => shade + `
  <path d="M50 44h60l-8 84a9 9 0 0 1-9 8H67a9 9 0 0 1-9-8Z" fill="var(--art-cream)" opacity=".2"/>
  <path d="M54 62h52l-6 66a9 9 0 0 1-9 8H69a9 9 0 0 1-9-8Z" fill="${liquid}"/>
  <path d="M50 44h60l-8 84a9 9 0 0 1-9 8H67a9 9 0 0 1-9-8Z" fill="none" stroke="var(--art-cream)" stroke-width="3" opacity=".65"/>
  <rect x="92" y="22" width="9" height="46" rx="4.5" fill="var(--alert)" transform="rotate(14 96 45)"/>
  ${withSlice ? `<circle cx="104" cy="52" r="13" fill="var(--art-leaf)"/>
  <circle cx="104" cy="52" r="8" fill="var(--art-cheese)"/>` : ''}`;

const shake = () => shade + `
  <path d="M54 56h52l-6 72a9 9 0 0 1-9 8H69a9 9 0 0 1-9-8Z" fill="var(--art-cream)" opacity=".22"/>
  <path d="M57 72h46l-5 56a9 9 0 0 1-9 8H71a9 9 0 0 1-9-8Z" fill="#C98A5E"/>
  <path d="M46 56h68a34 18 0 0 0-68 0Z" fill="var(--art-cream)"/>
  <path d="M60 40a20 16 0 0 1 40 0 34 18 0 0 0-40 0Z" fill="var(--art-cream)"/>
  <circle cx="80" cy="30" r="7" fill="var(--alert)"/>
  <rect x="96" y="14" width="9" height="52" rx="4.5" fill="var(--alert)" transform="rotate(12 100 40)"/>
  <path d="M54 56h52l-6 72a9 9 0 0 1-9 8H69a9 9 0 0 1-9-8Z" fill="none" stroke="var(--art-cream)" stroke-width="3" opacity=".6"/>`;

const water = () => shade + `
  <path d="M68 24h24v14l10 14v72a8 8 0 0 1-8 8H66a8 8 0 0 1-8-8V52l10-14Z" fill="#9EC6DE" opacity=".5"/>
  <path d="M68 24h8v14l-8 12Z" fill="#fff" opacity=".4"/>
  <rect x="58" y="74" width="44" height="26" fill="var(--info)"/>
  <rect x="66" y="84" width="28" height="4" rx="2" fill="#fff" opacity=".7"/>
  <rect x="68" y="20" width="24" height="8" rx="3" fill="var(--info)"/>`;

/* ------------------------------------------------------------- desserts */
const brownie = () => shade + `
  <path d="M34 96h92l-8 36a6 6 0 0 1-6 5H48a6 6 0 0 1-6-5Z" fill="#3A2016"/>
  <path d="M34 96h92l-4 10H38Z" fill="#5A3324"/>
  <path d="M46 84h68l12 12H34Z" fill="#4A2A1C"/>
  <g fill="var(--art-cream)" opacity=".5">
    <circle cx="62" cy="92" r="3"/><circle cx="92" cy="89" r="2.4"/><circle cx="106" cy="94" r="2.8"/>
  </g>
  <ellipse cx="103" cy="76" rx="18" ry="14" fill="var(--art-cream)"/>
  <ellipse cx="97" cy="70" rx="7" ry="5" fill="#fff" opacity=".45"/>
  <g fill="#3A2016" opacity=".8"><circle cx="40" cy="134" r="3.4"/><circle cx="124" cy="136" r="2.8"/></g>`;

const pudim = () => shade + `
  <ellipse cx="80" cy="130" rx="54" ry="10" fill="var(--art-cream)"/>
  <path d="M44 84h72l6 40a6 6 0 0 1-6 7H44a6 6 0 0 1-6-7Z" fill="var(--art-cheese)"/>
  <path d="M44 84h72l1.4 9H42.6Z" fill="#C4832F"/>
  <ellipse cx="80" cy="84" rx="36" ry="11" fill="#E8B847"/>
  <ellipse cx="80" cy="84" rx="12" ry="4" fill="var(--art-grill-2)" opacity=".5"/>
  <path d="M42 100c8 10 18 4 26 12s18 2 26 10 16 2 24-6l1.4 10a6 6 0 0 1-6 5H44a6 6 0 0 1-6-5Z" fill="var(--art-grill-2)" opacity=".55"/>`;

/* ------------------------------------------------------------------- map */
export const ART = {
  'burger-classico': () => burgerArt({}),
  'burger-cheddar': () => burgerArt({ withTomato: false, withLettuce: false }),
  'burger-duplo': () => burgerArt({ patties: 2, withTomato: false }),
  'burger-bacon': () => burgerArt({ withBacon: true, withTomato: false }),
  'burger-frango': () => burgerArt({ pattyFill: '#D08A2E', pattyDark: '#A96A1C', withCheese: false }),
  'burger-veg': () => burgerArt({ pattyFill: '#8E7A3C', pattyDark: '#6E5C28', withTomato: true }),
  fritas: fries,
  aneis: rings,
  bolinho: croquettes,
  salada: salad,
  combo: comboArt,
  'refri-cola': () => can('var(--alert)'),
  'refri-guarana': () => can('var(--accent)'),
  cerveja: bottle,
  limonada: () => glass('var(--accent-2)', true),
  suco: () => glass('var(--art-tomato)', false),
  milkshake: shake,
  agua: water,
  brownie,
  pudim,
};

export function artSvg(key, label = '') {
  const fn = ART[key] || ART['burger-classico'];
  return `<svg class="art" viewBox="0 0 160 160" role="img" aria-label="${esc(label)}"
    preserveAspectRatio="xMidYMid meet">${fn()}</svg>`;
}

export const artKeys = Object.keys(ART);

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
