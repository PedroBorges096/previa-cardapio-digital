# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: static HTML + CSS (custom properties, no framework) + vanilla ES modules, zero build step, deployed as static output on Vercel.
Rationale recorded so later work does not re-litigate it: the brief named "Tailwind via CDN, se adequado" as optional. Tailwind's CDN build ships a JIT compiler that runs in the browser and blocks first paint — in direct conflict with the brief's own priority ("experiência rápida mesmo em conexões móveis mais lentas"). Hand-authored tokens are smaller, faster, and keep per-restaurant theming to one block of CSS variables, which the white-label requirement needs anyway.
Data layer for v1: `localStorage` behind a single repository module (`store.js`) whose interface is async, so swapping in Supabase/Postgres is a driver change, not a rewrite. [inferred from brief §8/§10]

## Users

Three distinct users, all confirmed by the brief:

1. **Diner (primary).** On a phone, often standing, one-handed, sometimes on a weak mobile connection, deciding what to eat in under two minutes. Does not want to install anything or create an account. Arrives from a WhatsApp link, Instagram bio, or a QR code on the table. [inferred from brief §7]
2. **Restaurant operator.** Owner or counter staff, explicitly non-technical. Needs to change a price, mark an item sold out, or close the store, on their own, without calling anyone. Does this during service, under pressure. [brief §6: "O painel deve ser simples para alguém sem conhecimento técnico"]
3. **The seller (the user of this repo).** Shows the product to a restaurant owner and needs the reaction "I want one of these." Builds and ships from a phone, via Claude + Vercel, with no local development machine. [stated by user]

## Product Purpose

A white-label digital menu and ordering surface that turns a phone into a restaurant's storefront, and ends each order as a structured WhatsApp message to the restaurant — no marketplace commission, no app install, no account.

Success: (a) a diner completes a multi-item order with modifiers in under 90 seconds on a mid-range phone; (b) an operator edits the menu unaided on the first attempt; (c) a restaurant owner seeing the demo asks for one.

## Positioning

Order capture that lands in the tool the restaurant already lives in — WhatsApp — with the whole menu owned by the restaurant. Delivery marketplaces take a commission per order and own the customer; PDF and Linktree menus do not take orders at all; the gap is a self-owned storefront that converts without a middleman.

The mechanism a neighbor could not truthfully copy: a single-tenant-per-deploy menu whose entire identity, catalog, and ordering rules live in one portable config, so the same codebase re-skins to another restaurant in minutes with no code change.

## Operating Context

- Entry is almost always a link in WhatsApp/Instagram or a QR code at the table; there is no "homepage visit."
- Orders are read by staff on a phone, in a loud kitchen, between other messages. The WhatsApp message must be scannable top-to-bottom without expanding anything.
- Store hours gate ordering: outside hours the menu must still be browsable but must not accept orders.
- Payment happens off-platform (cash, card on delivery, Pix). The brief forbids simulating a completed transaction.
- Operators work on the same phone they use for everything else; the admin panel is a mobile surface too, not a desktop-only afterthought.

## Capabilities and Constraints

Confirmed required capability (brief §3–§6): category navigation, product detail with required single-choice variations and optional multi-select add-ons, per-item notes, cart with quantity edit and removal, subtotal/delivery fee/total, pickup-vs-delivery switch, address fields, payment method, change-due calculation, WhatsApp hand-off, search, sold-out handling, promotions, combos, complementary-item suggestions, back-to-top, persistent cart, add-to-cart feedback, success/error messaging, skeleton loading, empty-cart state, unavailable-product state, restaurant info page, contact, social links; plus a full admin panel over products, categories, add-ons, hours, open/closed override, delivery fee, restaurant info, WhatsApp number, and received orders with status.

Hard constraints:
- **No fake functionality.** Every control either works or is labeled as not yet integrated. [brief §6, §11]
- **No simulated payment.** Online payment may only exist as a prepared, clearly-labeled integration point. [brief §4]
- **No placeholder copy.** No Lorem Ipsum; menu copy must read as real commercial menu writing in pt-BR. [brief §11]
- Must not require a build step or a local dev machine. [stated by user]
- Architecture must not block evolution to multi-tenant SaaS: per-restaurant identity, catalog, WhatsApp number, fees, hours, and custom domain. [brief §10]

Terminology: pt-BR throughout the interface (Sacola, Adicionais, Retirada, Entrega, Troco, Observações). Prices in BRL, `pt-BR` formatting (R$ 00,00).

## Brand Commitments

**Supplied by the client and binding.** BRASA Burger House: the wordmark-and-burger logo, the kicker "Burger House", the line "Smashed with attitude", and a four-colour board — `#171717` charcoal, `#F4E8D4` cream, `#C87943` copper, `#7B2925` deep red. [stated]

The logo is a drawn wordmark — condensed, sharply cut letterforms with a flame rising from the A — supplied light-on-black. Delivered variants: `logo-brasa.png` (brand cream, for the dark UI), `logo-brasa-light.png` (brand charcoal, for light grounds and print), `mark-brasa.png` (the B alone, the one letterform that still reads at 16px), and app icons at 64/180/192/512 on the brand charcoal. The colour swap is a contrast requirement, not a redesign: the mask comes from the original's own luminance, so every anti-aliased edge is preserved.

An earlier version of the identity used a cartoon burger mark; it was replaced by the client and no part of it survives.

An earlier iteration of this build invented a different brand before the client's was supplied. It was replaced outright, not blended.

## Evidence on Hand

- The brief itself (`/mnt/user-data/uploads/*-attachment.txt`), which is the complete requirement source.
- **Photography: supplied.** 19 studio shots on white (burgers, fries, onion rings, breaded chicken, sauces, drinks, milkshakes, brownies) plus the logo and the identity board. Each is cut out of its white background and shipped at 320w and 760w WebP (1.6 MB total for 38 files). Three combo images are composed from the real items they contain rather than invented. The vector-art module survives only as the fallback for a product an operator adds without a photo.
- **No real restaurant, customers, reviews, press, or metrics.** Nothing of that kind may be invented: no testimonials, no "4.9 stars, 2.000 avaliações", no awards, no partner logos. Rating-shaped social proof is off the table for this build.
- No real WhatsApp number for a restaurant; the demo number must be visibly a placeholder the operator replaces in the admin panel.

## Product Principles

1. **The thumb is the only input.** Every primary action reachable and operable one-handed, in the lower half of a phone screen.
2. **Nothing lies.** No decorative control, no fabricated proof, no fake transaction, no invented review. A missing capability is labeled, not mimicked.
3. **The operator is not technical and is in a hurry.** Any menu change must be reachable in two taps and reversible.
4. **Re-skinning is configuration, not development.** Identity, catalog, and rules live in data; the code never names a restaurant.
5. **Weak connection is the design case, not the edge case.** First paint must not wait on anything optional.

## Accessibility & Inclusion

Target WCAG 2.1 AA: text contrast ≥4.5:1 (≥3:1 for large), touch targets ≥44×44px, visible keyboard focus, labeled form fields with real error text, `prefers-reduced-motion` honored, state never carried by color alone (sold-out and promo also carry text).
