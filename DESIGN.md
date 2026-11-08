# Design

<!-- impeccable:design-schema 1 -->

## World

**The client's identity board, executed.** BRASA supplied the mark, the words and four colours: `#171717` charcoal, `#F4E8D4` cream, `#C87943` copper, `#7B2925` deep red. Everything here is derived from those, not invented alongside them.

The world they describe is a night counter: a dark room, a hot plate, warm light on food. So the page is a charcoal ground with a single pool of copper light at the top, cream type, and the food lit against the dark. Photographs are cut out of their white studio background and sit directly on the surface with their own drop shadow — a white photo tile on a near-black page is the one thing that would break this room.

A previous iteration of this project invented a different brand (a roadside-sign world). The client's brand replaced it outright; no part of that world survives, because splitting the difference between two identities is how a page ends up looking like neither.

## Light or dark

Dark, and not as a style choice: the brand's own ground colour is `#171717`, and orders are placed between 18:00 and 01:00 on a phone. The surfaces lift in warm steps (`#211F1D`, `#2C2824`, `#3A342E`) rather than neutral greys, so nothing reads as blue-black next to the copper.

## Palette

Role tokens, not colour names, so a re-skin is one block. `tokens.css` is the only file allowed to hold a literal colour; a hex anywhere else is a defect.

| Token | HEX | Role | Contrast |
| --- | --- | --- | --- |
| `--surface-0` | `#171717` | Page ground — **brand** | — |
| `--surface-1` | `#211F1D` | Plate: cards, header, sheets | — |
| `--surface-2` | `#2C2824` | Raised plate, inputs, chips | — |
| `--surface-3` | `#3A342E` | Pressed / hovered | — |
| `--ink` | `#171717` | Type on the accent — **brand** | 5.35:1 on accent |
| `--text-1` | `#F4E8D4` | Primary type — **brand cream** | 14.8:1 |
| `--text-2` | `#C3B6A3` | Secondary | 9.0:1 |
| `--text-3` | `#9C9080` | Tertiary — good to surface-2, never on surface-3 | 5.7:1 |
| `--accent` | `#C87943` | **Brand copper.** Fills, the one primary action | 5.35:1 as type on surface-0 |
| `--accent-2` | `#E0945C` | The copper you may set type in | 7.3:1 |
| `--alert` | `#7B2925` | **Brand red.** Fills only | cream on it: 7.9:1 |
| `--alert-text` | `#E78477` | The red you may set type in | 6.8:1 |
| `--alert-deep` | `#5C1C19` | Destructive fill, cream legend | 10.6:1 |
| `--ok` | `#9DBE7A` | Open / confirmed — kept olive so the one cool note sits with the warm palette | 8.6:1 |

State never rides on colour alone: sold out also carries the word ESGOTADO, promos also carry the struck-through old price, open/closed also carries the word and the next opening time.

The fallback drawing tokens (`--art-*`) are retuned to this palette. They only ever appear on a product an operator added without a photograph.

## Type

- **Display and text: `Archivo`**, 400–900, self-hosted as one variable file (34 KB). A clean grotesque that carries the interface without competing with the wordmark's sharp, condensed letterforms — the logo stays the only piece of lettering with personality, which is what keeps it the loudest thing on the page. Display runs at `-0.03em` tracking; the all-caps legends at `+0.26em`.
- **Figures: `Overpass Mono` 500/600**, `font-variant-numeric: tabular-nums`, `word-spacing: -0.14em` (the non-breaking space after `R$` is very wide in mono). Monospace here is measurement, not costume — prices, quantities, totals and the odometer need column alignment.
- Nothing is loaded from a third party: no Google Fonts connection on a weak mobile link.
- Scale: `--step--1 .8125rem` → `--step-5 3.25rem`. Body measure capped at 68ch.

## Materials and signatures

1. **The plate.** Cards, sheets and bars are `--surface-1` with a 1px `--line` edge, a 1px inner top highlight, and a real drop shadow with offset *and* blur — never a zero-offset halo.
2. **The copper pool.** One radial wash of `--accent` at 10–16% behind the masthead and behind the product photo in the sheet. It appears twice on the page, not everywhere.
3. **The white tile.** Every product photograph was shot on studio white, so it keeps that white and gets a white tile (`--photo-bg`): the photo's own background *becomes* the tile and the seam disappears. Each shot is re-cropped square around the subject (detected, not guessed) with 11% breathing room, so the food lands in the same place in every card. `object-fit: cover` is safe precisely because the crop is already centred on the food. One token swaps every tile to the brand cream `#F4E8D4` if a warmer catalogue is wanted.
4. **The dashed rule.** Copper dashes as the section divider. The only decorative element.
5. **Stencil overprint.** `Esgotado` set on a rotated outlined tag across a sold-out item's photo.

Icons are authored SVG on a single 1.75px stroke at 24px, round caps and joins. No emoji standing in for an icon.

## Motion

One authored moment, everything else is feedback.

- **Cards arrive in a cascade.** Product cards enter on `opacity` + `translateY(14px)`, 420ms `--ease-out`, staggered 45ms within a row of the grid, triggered by an IntersectionObserver as the section comes into view, once per card. Hidden-until-JS content is a liability, so a 1.5s failsafe reveals everything if anything on screen is still waiting.
- **The authored moment:** the running total in the cart bar rolls like a counter — each digit column translates vertically on change, 420ms `--ease-out`, staggered 26ms per column from the right. Tied to the single number the diner cares about, seen a handful of times per session.
- Press feedback: `scale(.97)` on buttons, `scale(.975)` on cards, 120ms `--ease-out`. The card's photograph scales to 1.05 under the same press, clipped by the tile, so the card feels like one object being pushed.
- The bag reacts: adding an item bumps the cart bar to `scale(1.035)` and back over 420ms, and the total rolls at the same time.
- Product sheet: `translateY(100%) → 0`, 340ms `--ease-drawer`; drag-to-dismiss on velocity > 0.11 or 35% travel; exit 220ms. Friction, not a wall, when dragged upward.
- Toast: enters from the edge it can be swiped off.
- Category chips: the active indicator is a `clip-path: inset()` window onto a duplicated, inverted copy of the row — the colour flips cleanly instead of crossfading through mud, 220ms `--ease-in-out`.
- Curves: `--ease-out cubic-bezier(.23,1,.32,1)`, `--ease-in-out cubic-bezier(.77,0,.175,1)`, `--ease-drawer cubic-bezier(.32,.72,0,1)`. No `ease-in`. No `transition: all`.
- `prefers-reduced-motion: reduce` keeps opacity and colour, drops every translate and scale, and freezes the odometer to an instant swap.

## Browser surfaces

Themed, not inherited: selection (`--accent` at 34% on cream), caret `--accent-2`, focus ring 2px `--accent-2` at 2px offset, custom thin scrollbar on the rails, `text-underline-offset: .22em`, `accent-color` on radios and checkboxes, `::placeholder` at 4.5:1, `theme-color` `#171717`.

## Mobile platform layer

`-webkit-tap-highlight-color: transparent`, `overscroll-behavior: none` on the root and `contain` on inner scrollers, `100dvh` for the app shell, 16px minimum on every input (so iOS never zooms), `touch-action: manipulation` on controls, `user-select: none` on controls only, `viewport-fit=cover` with `env(safe-area-inset-*)` on the header, cart bar, sheets and toasts, and every `:hover` gated behind `@media (hover: hover) and (pointer: fine)`.

## Resilience

Verified against a worst-case fixture (`/dev/fixtures.js`, loaded only via `?data=`): a 108-character product name, an empty description, R$ 1.899,90 and a R$ 246.485,50 cart, a 64-character address typed without spaces, 24 cart lines, quantity 99, an empty catalog, a single-item catalog and 300 products. Zero horizontal page scroll at 320px, 390px and 200% zoom. Every grid track is `minmax(0, 1fr)` and every flex text column has `min-width: 0`, because `min-width: auto` plus one unbroken string is what widens a page.

## White-label contract

Nothing in the code names a restaurant — storage keys included (`menu.state`, `menu.cart`). Identity lives in `assets/js/config.js`: `brand` (name, kicker, tagline, logo paths) and `theme` (a flat map of the role tokens, written to `:root` at boot). The admin's *Visual* tab edits those tokens live and ships a second working preset as proof the re-skin is configuration, not development. The house preset reads `SEED.theme` rather than restating the hexes, so there is one source of truth for the brand colours.

## Mode per surface

- `index.html` — **Persuade.** The diner decides and acts. Two product cards per row on a phone, centred text, a pill buy affordance, and the masthead held to roughly a third of the first viewport so the first real offer is on screen without scrolling. Card bodies use `flex: 1` with `margin-top: auto` on the price so the price and button of neighbouring cards land on the same line whatever the name length — verified at 0px drift.
- `admin.html` — **Operate.** Density, scanability, two-tap reach, reversibility, a bottom tab bar within thumb reach. Brand lives in precise details, not performance.
