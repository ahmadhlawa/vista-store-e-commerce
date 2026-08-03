# Vista reference alignment

Correction pass on the storefront rebuild. Clean-room: no reference markup, CSS,
asset, image or product datum is copied — only layout and interaction behaviour
described by the owner is reproduced, using Vista's own assets and API data.

## Current mismatch

Measured in Chrome at 1440 px against `fe96854`:

| Area | Now | Wanted |
| --- | --- | --- |
| Hero row | `878 px` hero + a `466 px` column of two promo tiles | one full-width advertising image |
| Category rail | none on desktop; a horizontal chip strip on mobile | narrow fixed rail at the far right, drawer from it |
| Category card | `325×406` with a `112 px` text block pinned bottom-start | image only, title centred over the artwork |
| Product card | `325×518`, a permanent `193 px` white body under every image | image-led, details revealed from the bottom |
| Package card | `325×550`, a permanent `225 px` white body | image-led, second image + action panel on reveal |
| Theme | teal `#1F4E4A` / gold `#C9A24B` template defaults | Vista blue-purple / yellow, sampled from the logo |

The earlier `docs/design/masterpiece-reference-audit.md` deliberately declined a
fixed right rail. The owner has now asked for one, so that decision is reversed —
but Vista's is labelled and keyboard-operable rather than decorative.

## Components to change

`CategoryRail.jsx` (rewritten), new `CategoryDrawer.jsx`, `Header.jsx`,
`PublicShell.jsx`, `Hero.jsx`, `HomePage.jsx`, `CategoryCard.jsx`,
`ProductCard.jsx`, `PackageCard.jsx`, new `useCardReveal.js`; `tokens.css`,
`shell.css`, `home.css`, `catalog.css`; `catalog.js` and `productView.js` for the
secondary image; `storefront.js` fallback colours. `CategoryMega.jsx` is retired —
the rail drawer becomes the single category panel, so header trigger and rail
trigger drive one overlay state (`OVERLAY.CATEGORIES`) over one data source
(`useCategoryNav`).

Backend: `secondary_image_url` added to `Product`, `ProductPublicOut` and
`product_payload` — the smallest projection change that lets a card swap images
without a per-hover detail fetch.

## Final sidebar behaviour

Fixed at the far right below the header, `--vs-rail-w: 68px`, independently
scrollable, never overlapping: the public content area reserves the same width as
a right gutter. A rounded trigger sits at the top, then one thumbnail per active
root category from the categories API — no hard-coded list. Each item is a link
with an accessible name and a tooltip; the active category takes a Vista-tinted
state. Collapsed state shows no permanent text.

The trigger opens a `340 px` drawer from the right: heading «تصنيفات المنتجات»,
close action, every active category with its image, nested children behind
expand/collapse buttons, active state. Scrim, body scroll lock, Escape, overlay
click, focus trap and focus restoration come from the existing `Drawer`. A route
change closes it through `PublicShell`'s existing `closeAll`.

Below 900 px the rail is hidden, its trigger moves into the mobile header, and the
drawer becomes near full width (`min(92vw, 400px)`). Nothing depends on hover.

## Final hero behaviour

One slide, one image, full content width. The promo column and both hero-side
cards are gone. Ratio is reserved (`--vs-ar-hero`, 21/8 desktop → 16/9 tablet →
4/5 mobile) so nothing shifts; `object-fit: cover`. The text block and its veil
render only when the Admin supplied a title, description or CTA. Crossfade every
6 s, paused on hover, focus, manual move and `visibilitychange`; arrows, dots and
touch swipe; no autoplay and no movement under `prefers-reduced-motion`. No new
dependency.

## Category-card behaviour

Image fills the card; the title is centred over it and readable at rest above a
base overlay. Hover/focus scales the image ~1.05, deepens the overlay, and fades
in a translucent backdrop behind the title plus a small arrow. No layout shift.
4 / 3 / 2 columns. Image comes from the category record, falling back to the
existing project-owned tone gradient — no image is generated.

## Package-card behaviour

Cover image only at rest, plus badges. On hover/focus/tap-reveal the cover
cross-fades to the second product image when one exists, and a panel rises from
the bottom with title, price, compare-at price, item count, «أضف إلى السلة»
(existing `AddToCartButton`) and «التفاصيل». The panel is absolutely positioned,
so row height never changes. With no second image the cover stays and only the
panel appears.

## Product-card behaviour

Same model: image, badges and sold-out veil at rest; the panel carries title,
price, compare-at, stock line and the product's own action — add, «اختر الخيارات»
for option products, nothing for sold out — plus Quick View. Server prices,
inventory rules, the add animation and the cart pulse are untouched.

## Vista colour tokens

Sampled from `Logo.jpeg`: primary `#484397`, accent `#FFC50A`, surface `#FFFFFF`.
`tokens.css` binds `--vs-primary`/`--vs-accent` to the `--vs-brand-*` custom
properties `StoreProvider` writes from StoreSettings, with the Vista values as the
fallback; every tone (`-dark`, `-mid`, `-soft`) is derived with `color-mix`, so a
colour is stated once. Defaults also go into `instance/vista-store.yaml` and the
storefront fallback settings. Yellow is never used for small text on white.
Tokens stay scoped to `.vs-public`; Admin is untouched.

## Responsive behaviour

360 / 390 / 768 / 1024 / 1440 / 1920. Rail and its gutter appear ≥900 px only.
Category grid 2 / 3 / 4; packages 1 / 2 / 3; products 2 / 3 / 4. Reveal panels are
scroll-safe and clamped; below 600 px package cards go single-column so the panel
stays readable. No horizontal overflow at any width.

## Test and QA plan

Vitest: rail renders API categories; drawer open/close, nesting, a11y; hero shows
one slide and no promo tiles; hero controls; category title and link; package
secondary-image swap and its no-secondary fallback; package and product panels;
option-required cannot direct-add; add-to-cart fires once; touch reveal;
public/admin style isolation; existing suites stay green. Backend: one test for
the `secondary_image_url` projection. Browser QA at 390/768/1440/1920 recorded in
`docs/qa/vista-reference-alignment.md` with before/after screenshots.
