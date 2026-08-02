# Vista storefront rebuild — design plan

Companion to `masterpiece-reference-audit.md`. Scope: the public storefront only.
Admin, the API, the database, order/invoice rules and the preview lifecycle are
untouched.

## Problem with the current storefront

Every public screen is a transcription of a one-off prototype: styles are inline
CSS strings parsed by `sx.js`, hover behaviour lives in ~30 global `.hv-*`
classes with `!important`, and layout switches on nine unnamed globals
(`--cols`, `--pad`, `--heroG`, …) that are also read by the admin layout.
There is no product-card state model beyond "sold out", no cart drawer worth the
name, no quick view, no real filters, and the homepage renders showcase blocks
that do not exist in the data.

The rebuild replaces the presentation layer with a named token system and a
component library, and leaves every data path in place.

## Token system

One stylesheet, `src/styles/public.css`, scoped under `.vs-public` so nothing
reaches `/admin`. All tokens are prefixed `--vs-`.

* **Layout** — `--vs-container: 1400px`, `--vs-gutter` (20 → 16 px),
  `--vs-section` / `--vs-section-tight` vertical rhythm, `--vs-grid-gap`.
* **Surfaces** — `--vs-page #FBF9F6`, `--vs-surface #fff`, `--vs-surface-2
  #F4F1EC`, `--vs-surface-3 #EFEAE1`.
* **Borders** — `--vs-border #E9E3DA`, `--vs-border-strong #DCD3C6`.
* **Text** — `--vs-ink`, `--vs-ink-2`, `--vs-ink-3`, `--vs-ink-4` (four steps).
* **Brand** — `--vs-primary`, `--vs-primary-dark`, `--vs-primary-soft`,
  `--vs-accent`, `--vs-success`, `--vs-danger`. Primary/accent are fed from
  `StoreSettings` by `StoreProvider`, so an instance restyles from the admin.
* **Radius** — 8 / 12 / 16 / 22 / 999.
* **Shadow** — `--vs-shadow-1` (hairline), `-2` (card hover), `-3` (popover),
  `-4` (drawer).
* **Motion** — `--vs-t-fast 140ms`, `--vs-t 200ms`, `--vs-t-card 260ms`,
  `--vs-t-drawer 300ms`, `--vs-t-hero 600ms`, `--vs-ease
  cubic-bezier(.22,1,.36,1)`.
* **Z layers** — rail 40, header 60, popover 70, scrim 80, drawer 90, modal 95,
  toast 100.

Responsive column counts become named tokens (`--vs-cols`, `--vs-cols-cat`)
resolved in four breakpoints: ≥1280 (4), 900–1279 (3), 600–899 (2), <600 (2).
The legacy globals in `index.css` stay only for the admin grid.

## Component map

```
components/public/
  shell/      PublicShell, Announcement, Header, HeaderSearch, CartButton,
              MobileTabBar, Footer, SectionHeader, Container
  navigation/ CategoryRail, CategoryMenu (mega), MobileMenuDrawer, Breadcrumb
  overlays/   Overlay (scrim + focus trap + scroll lock), Drawer, Modal,
              CartDrawer, QuickView, FilterDrawer, SearchOverlay, Toast
  catalog/    ProductGrid, ProductCard, PackageCard, CategoryCard,
              CatalogToolbar, FilterPanel, ActiveFilters, EmptyState,
              ErrorState, Skeletons
  home/       Hero, HomeSections (one renderer per section_type)
  product/    Gallery, PriceBlock, OptionPicker, QuantityStepper, StockBadge,
              ProductTabs, StickyBuyBar
  cart/       CartLine, OrderSummary
  feedback/   AddToCartButton (kept), CartCountBadge
hooks/
  useOverlay, useScrollLock, useFocusTrap, useCatalogQuery, useProductActions,
  useMediaQuery, useReducedMotion, useQuickViewProduct
```

`AddToCartButton` and `useAddToCartFeedback` are kept verbatim — the shared
success window and double-click guard are already correct.

## State ownership

* `StoreProvider` keeps cart, settings, categories, toast, coupon, checkout form
  — unchanged data contracts.
* **Overlay state moves to a dedicated reducer** in `StoreProvider`: one
  `overlay` value (`null | 'cart' | 'menu' | 'categories' | 'search' | 'filters'
  | {quick: slug}`) plus the element that opened it. A single value makes drawer
  exclusivity structural rather than accidental, and gives focus restoration a
  home.
* Catalogue query state (page, sort, filters) moves into the URL via
  `useSearchParams` through `useCatalogQuery`, so a filtered listing is
  shareable and the back button behaves.
* Quick View owns its own fetch (`catalogService.bySlug`) and quantity/variant
  selection; it reuses `store.addToCart`.

## Route map

Unchanged set. `/` `/shop` `/category/:slug` `/offers` `/packages` `/molds`
`/search` `/product/:slug` `/cart` `/checkout` `/order-success/:orderNumber`
`/track-order` `/blog` `/blog/:slug` `/page/:slug` `/contact`
`/tools/calculator` `*`. `/shop`, `/category`, `/offers`, `/packages`, `/molds`
and `/search` all render one `CatalogPage` template with a mode descriptor.

## Drawer / modal architecture

`Overlay` renders the scrim; `Drawer` and `Modal` compose it.

* Scroll lock via `document.body` `overflow` + `padding-inline-end`
  compensation, reference-counted so nested opens cannot unlock early.
* Focus trap: first focusable on open, cycle on Tab, restore to the opener on
  close.
* Escape closes the topmost overlay only; scrim click closes; route change
  closes.
* `aria-modal`, `role="dialog"`, labelled by the drawer title.
* Side is direction-aware: menu/categories/filters on the RTL **right**, cart on
  the **left**.

## Product-card states

| State | Card behaviour |
| --- | --- |
| simple, in stock | direct add, button "أضف إلى العربة" |
| has required options / variants | button "اختر الخيارات" → Quick View with the picker, never a silent default variant |
| on sale | red discount badge, sale price + struck compare-at |
| new / featured / bestseller | one small badge each, max two shown |
| out of stock | image scrim, "غير متوفر حالياً", button disabled |
| package | `PackageCard`: cover, item count, contents reveal |
| second image present | cross-fade to image 2 on desktop hover |

Hover (desktop only, `@media (hover:hover)`): image scale 1.04, Quick View pill
fades in over the image, card border darkens. No translate, no layout shift.
Touch: every action is permanently visible.

## Responsive grid

| Width | Product cols | Category cols | Gutter | Gap |
| --- | --- | --- | --- | --- |
| ≥1280 | 4 | 4 | 20 | 20 |
| 900–1279 | 3 | 3 | 20 | 18 |
| 600–899 | 2 | 3 | 18 | 14 |
| <600 | 2 | 2 | 16 | 12 |

Product image 1:1, category image 4:5, hero 16:7 desktop / 4:5 mobile, package
cover 3:2. All declared with `aspect-ratio` so nothing shifts on load.

## Implementation phases

1. **Foundation** — `public.css` tokens, `PublicShell`, overlay primitives
   (`Overlay`/`Drawer`/`Modal`, scroll lock, focus trap), overlay reducer.
2. **Navigation** — header (desktop 3 bands + sticky compression), category
   rail, category mega panel, mobile menu drawer, mobile tab bar, search
   overlay + suggestions.
3. **Home** — hero system, category cards, section renderers driven by
   `home_sections`, promo banners, no empty sections.
4. **Cards** — `ProductCard`, `PackageCard`, badges, option-aware actions,
   skeletons.
5. **Quick View + cart drawer.**
6. **Catalogue** — `CatalogPage` template, toolbar, filters (URL-backed),
   active-filter chips, empty/error/loading, pagination.
7. **Product detail** — gallery, option picker, sticky buy bar, tabs →
   accordions on mobile, related.
8. **Cart / checkout / order success / footer.**
9. **Responsive, a11y, performance pass** (lazy images, reduced motion,
   landmarks, contrast).
10. **Browser QA, tests, docs.**

Each phase ends with a focused test run and a checkpoint commit.

## Files expected to change

*Added*: `src/styles/public.css`, `src/components/public/**` (~35 files),
`src/hooks/useOverlay.js`, `useScrollLock.js`, `useFocusTrap.js`,
`useCatalogQuery.js`, `useProductActions.js`, `useReducedMotion.js`,
`src/pages/CatalogPage.jsx`, tests under `src/test/public/**`,
`docs/design/*`, `docs/qa/storefront-rebuild-visual-qa.md`.

*Rewritten*: `layouts/StorefrontLayout.jsx`, `components/Header.jsx`,
`Footer.jsx`, `Overlays.jsx`, `ProductCard.jsx`, `Home.jsx`, `Listing.jsx`,
`Product.jsx`, `CartCheckout.jsx`, `pages/HomePage.jsx`,
`ProductListPage.jsx`, `ProductDetailPage.jsx`, `CartRoutePage.jsx`,
`CheckoutRoutePage.jsx`, `OrderSuccessRoutePage.jsx`, `hooks/useShellView.js`,
`app/StoreProvider.jsx` (overlay slice only).

*Touched*: `index.css` (public rules removed, admin grid kept), `store.js`
(navigation constants), existing tests where markup assertions moved.

*Untouched*: everything under `src/admin/`, `src/api/`, `src/services/`,
`src/storage/`, and the whole backend.

## Non-goals

No animation library, no state-management library, no CSS framework, no backend
redesign. Bundle growth must stay proportional to the components added.
