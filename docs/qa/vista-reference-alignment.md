# Vista reference alignment — browser QA

Locally installed Chrome driven over the DevTools Protocol against the Vista
preview database (`backend/data/vista_preview.db`, batch `vista-social-preview`,
80 owned records). Screenshots are in `screenshots/vista-reference-alignment/`.

**Scope note.** No reference image has ever been attached to a session for this
work — not for the first pass, and not for the correction pass below. The
written requirements were treated as the specification and every check is
against those. The public reference site was not scraped and nothing from it was
copied: no markup, CSS, image, logo or product datum.

---

## Pass 2 — density, logo, rail, hero and theme correction (2026-08-03)

One focused visual pass on the owner's complaints. No route, no feature and no
component was added or removed; the storefront was not redesigned.

Captures: `before-density-*.png` is the state this pass started from,
`after-*.png` the state it ended in.

### Header dimensions

Desktop, measured on `.vs-header` and its two bands:

| | Before | After |
| --- | --- | --- |
| Total sticky header | **128px** | **110px** |
| White identity band | 76px | 64px |
| Purple navigation band | 52px | 46px |
| Search field | 46px tall, 620px wide | 42px tall, **820px** wide |
| Cart button | 44px | 38px |
| Header icon buttons | 44px | 38px (44px restored ≤899px) |
| «كل الأقسام» trigger | 38px | 34px |
| Phone block icon | 38px | 34px |
| Mobile header (≤899px) | 60px | 60px, unchanged |

**One horizontal axis.** The mid-lines of the logo viewport, the search field
and the cart button all measure `31.5px` at 1440 and 1920, and `29.5px` at 390
and 768 — the row centres on a single line, which is what lets the band shrink
without anything moving sideways.

The white band read as empty because the search field stopped at 620px and this
store has no phone number configured, so ~490px of the row was blank. The cap is
now one token, `--vs-search-max`, applied to both the field and the slot it sits
in — they were two numbers before and only one of them was 620.

**Sticky behaviour unchanged.** Scrolled to 1400px: `position: sticky`,
`top: 0`, height `110px`, `data-scrolled="true"`, and the category rail still
starts at `110px` — flush with the header's lower edge.

### Logo

The owner's file is a 1000×1000 JPEG whose artwork occupies only x 19.5–80.5%
and y 34.5–64.5% of the canvas; the rest is white margin. Nothing about the file
was changed — not the bytes, not the format, not the aspect ratio.

The header and the footer now clip the logo to a **fixed viewport**
(`.vs-logo__box`, `--vs-logo-w` × `--vs-logo-h`) and scale the image inside it.
`useLogoFit` samples the file on a 200×200 grid, finds the artwork's bounding
box and sizes the image so that box fills the viewport. Width and height are
always set together from one number, so the aspect ratio is exact.

| Viewport | Visible mark before | Visible mark after | Factor |
| --- | --- | --- | --- |
| 1440 / 1920 | 29.3 × 14.4 | **87.9 × 43.2** | **3.0×** |
| 390 / 768 | 20.7 × 10.2 | **65.0 × 32.0** | **3.1×** |

Measured, not asserted: `aspectKept` compares the rendered image's ratio against
the file's natural ratio and is true at every viewport; `clipped` confirms the
image really does overflow the viewport it is cut to.

`StoreSettings.logo_url` is still the only source. With no logo configured the
header shows the store name as text, exactly as before — there is no bundled
default, so no other client instance built from this template is ever branded as
Vista.

**It degrades to the old behaviour, silently, in four cases**: no canvas (server
render, jsdom), a cross-origin file whose host sends no CORS header, a file that
fails to load, and a file whose artwork already fills ≥90% of it on both axes.
All four fall back to plain `object-fit: contain` — a properly trimmed logo is
left alone, and the magnification is capped at 4× so a near-blank file cannot be
blown up.

The footer uses the same viewport at 124 × 42, which also crops the JPEG's white
box back to the mark instead of letting it sit on the dark footer as a pale slab.

### Rail styling

| | Before | After |
| --- | --- | --- |
| Width | 68px (60 at ≤1279) | 64px (58 at ≤1279) |
| Surface | white | white |
| Edge | 1px border + `-6px 0 20px rgba(28,27,33,.05)` | 1px border + `-2px 0 10px rgba(28,27,33,.035)` |
| Trigger | 42px circle, `--vs-primary` | 38px 12px-radius square, **`--vs-primary-dark`** |
| Item | 44px, `--vs-surface-2` fill, 12px radius | 40px, white fill, 8px radius |
| Active state | purple border + 2px yellow ring | `--vs-accent-dark` border, pale `--vs-accent-soft` fill |
| Separator | none | hairline under the trigger |

Content is unchanged and still comes only from the categories API — there is no
category name anywhere in the rail's source. Measured at 1440: **8 items, 8 real
category thumbnails, 0 gradient stand-ins.** A category with no uploaded image
now gets a neutral line icon (`TagIcon`) instead of a tinted square; the same
rule applies inside the category drawer. Tooltips are untouched: every item
keeps `aria-label`, `title` and the hover/focus `.vs-catbar__tip`.

### Hero width and ratio

| Viewport | Before (w × h, ratio) | After | Share of storefront width |
| --- | --- | --- | --- |
| 390 | 358 × 429.6, 0.83 | **390 × 468, 0.83** | 0.92 → **1.00** |
| 768 | 732 × 411.8, 1.78 | **768 × 432, 1.78** | 0.95 → **1.00** |
| 1440 | 1332 × 507.4, 2.63 | **1376 × 520, 2.65** | 0.93 → **1.00** |
| 1920 | 1360 × 518.1, 2.63 | **1856 × 520, 3.57** | 0.73 → **1.00** |

The band left `.vs-container` entirely: no gutter, no max-width, `border-radius`
**22px → 0**, and the 20px of padding above it removed, so it starts at the nav
band's lower edge (`top: 110`). `.vs-public`'s own rail gutter is what stops it
short of the category rail — the hero's right edge and the rail's left edge are
the same pixel at 1440 (1376) and 1920 (1856).

A new `--vs-hero-max-h` (520px desktop) stops the same ratio from turning a
1856px band into a 700px wall on a large monitor. `width: 100%` is explicit
because Chrome otherwise derives the width back from the capped height and the
band stops filling the row.

Autoplay, dots, arrows, swipe, pause-on-hover/focus/hidden-tab and the
reduced-motion opt-out are all unchanged and still covered by test.

### Image-only hero behaviour

A slide is a **complete advertisement** when it has an image and the Admin
supplied no supporting copy — no subtitle, no description, no button. Its title
stays the slide's name in Admin and the image's `alt` text, and nothing is
printed over the artwork. A slide with supporting copy keeps all of it. A slide
with **no** image always shows its copy, because suppressing it would leave a
blank gradient.

No column was added, no migration was needed and no slide id is hard-coded. The
rule is stated in `normalizeHeroSlide` and repeated to the owner in the Admin
hero-slides screen's own description.

Measured at 1440 with the preview dataset: **4 slides, 3 with overlay copy.**
Slide 4 (`hero-apparel`, now image-only in the dataset) reports
`overlay: false, veil: false, cta: false, alt: "طباعة تليق بمناسبتك"` —
see `after-hero-image-only-1440.png`.

### Theme adjustments

| Change | Before | After |
| --- | --- | --- |
| Homepage editorial panel | full-bleed purple gradient slab | white surface, hairline border, one 44×3px Vista-yellow rule |
| That panel's button | yellow fill | purple fill — the only action in the block |
| Package badge | hard-coded `rgba(31,78,74,.92)` teal, left over from the template's original palette | `color-mix(--vs-primary 92%)` |
| Navigation band | 52px | 46px |
| Rail active state | purple border + yellow ring | pale yellow fill |
| Section rhythm | 68 / 40px (48 / 30 mobile) | 56 / 34px (40 / 26 mobile) |

White and warm off-white stay the dominant surfaces. Purple is now spent on the
navigation band, primary buttons and selected states; yellow on the active nav
underline, the cart badge, hero indicators and the rail's active state. Admin is
untouched — it renders outside `.vs-public` and inherits none of this.

### Routes and viewports inspected

| Route | Viewport | Checked | Result |
| --- | --- | --- | --- |
| `/` | 390 | Overflow, header, logo, hero, tab bar | 0 overflow; 60px header; mark 65 × 32; hero 390 × 468 full bleed |
| `/` | 768 | Same | 0 overflow; 60px header; hero 768 × 432 full bleed |
| `/` | 1440 | Same + rail | 0 overflow; 110px header; mark 87.9 × 43.2; hero 1376 × 520; rail 64px, 8 thumbnails |
| `/` | 1920 | Same | 0 overflow; hero 1856 × 520; content still capped at 1400 |
| `/` | 1440 | Header while scrolling (1400px down) | sticky, `top: 0`, 110px, rail still at 110 |
| `/` | 1440 | Hero image-only slide | bare image, no body, no veil, no CTA |
| `/` | 1440 | Rail collapsed | 8 labelled items, tooltips, no permanent text |
| `/` | 1440 | Category drawer open | 380px, 8 rows, 8 thumbnails, body scroll locked |
| `/` | 390 | Category drawer | 351px of a 390px viewport, same 8 categories |
| `/` | 390 | Mobile menu | opens, 351px, 0 overflow |
| `/admin` | 1440 | Isolation | no `.vs-public`, no rail, no hero, no logo viewport, **0 elements carrying any `vs-` class** |

No horizontal overflow at any width.

### Tests and build

* Frontend Vitest: **106 passed / 106**, 9 files. Seven new assertions in
  `vistaAlignment.test.jsx` cover the image-only advertisement, the copy-only
  slide, the full-bleed hero row, the rail's picture-or-icon rule, the same rule
  in the drawer, the clipped logo viewport, and the no-logo text fallback.
* Frontend production build: clean, 118 modules, 66.43 kB CSS / 382.24 kB JS.
* Backend: `tests/test_preview_dataset.py` **18 passed** — the only backend-side
  change was one preview YAML record, and that file is what those tests read. No
  backend Python file was touched.

### Limitations this pass did not remove

* **The preview artwork is still abstract gradient placeholders.** The rail now
  shows each category's own picture, but those pictures are eight variations of
  the same purple-to-gold gradient, so at 40px they read as coloured squares
  rather than as eight distinguishable categories. This is a **data** limitation,
  not a styling one: no image was generated or downloaded for this pass. Real
  category photographs from the owner are what fix it, and until they arrive the
  rail cannot look like the reference no matter how it is styled.
* **The logo is still a JPEG with a white box.** Cropping to the mark makes the
  box small, but it is still white, so it is still visible on the dark footer and
  on any tinted surface, and it is still what prints on invoices. A trimmed
  vector or transparent PNG removes both the white box and the need for
  `useLogoFit` to run at all. Requested in `backend/data/brand/README.md`.
* **Card-interaction captures** (`after-category-hover-1440.png`,
  `after-package-hover-1440.png`, `after-product-hover-1440.png`,
  `after-shop-390.png`, `after-hero-slide2-1440.png`) date from pass 1 and show
  the taller header. The behaviour they document is unchanged and still covered
  by unit test; they were not re-taken, because card interactions were not in
  this pass's scope.

---

## Pass 1 — rail, hero, cards and theme (2026-08-02)

### Environment defect found first

Chrome was initially driven in a normal window. Every CSS transition read as
stuck at its start value — hover reveals reported `opacity: 0` while the card
genuinely matched `:hover`, and `CSS.getMatchedStylesForNode` confirmed the rule
existed and matched. The window was occluded, so Chrome had paused compositing;
JS timers (hero autoplay) still ran, which is what made it look like a CSS bug.
Re-running headless with `--disable-backgrounding-occluded-windows` reproduced
every reveal correctly. **No product code was changed for this** — worth
recording because the same trap will catch the next person.

### Responsive sweep — `/`

| Viewport | Overflow | Rail | Gutter | Hero ratio | Cat / product / package columns | Panel |
| --- | --- | --- | --- | --- | --- | --- |
| 360 | 0 | hidden | 0 | 0.83 | 2 / 2 / 1 | static, visible |
| 390 | 0 | hidden | 0 | 0.83 | 2 / 2 / 1 | static, visible |
| 768 | 0 | hidden | 0 | 1.78 | 3 / 3 / 2 | static, visible |
| 1024 | 0 | 60px | 60px | 2.00 | 3 / 3 / 3 | absolute, hidden |
| 1440 | 0 | 68px | 68px | 2.63 | 4 / 4 / 3 | absolute, hidden |
| 1920 | 0 | 68px | 68px | 2.63 | 4 / 4 / 3 | absolute, hidden |

### Checks

| # | Route | Viewport | Required behaviour | Result |
| --- | --- | --- | --- | --- |
| 1 | `/` | 1440 | Rail fixed at the far right, below the header | `right: 0`, 68px wide, starts at the header's lower edge |
| 2 | `/` | 1440 | One item per active category, from the API | 8 items for 8 API categories; no list in the code |
| 3 | `/` | 1440 | Rail must not cover content | Rail left edge 1372px = widest container's right edge; 0 overlaps |
| 4 | `/` | 1440 | Rail independently scrollable | `overflow-y: auto` on the list, page scroll unaffected |
| 5 | `/category/…` | 1440 | Active category takes a Vista state | `aria-current="page"` + accent ring on the matching item only |
| 6 | `/` | 1440 | Drawer opens from the rail trigger | 380px, «تصنيفات المنتجات», 8 categories, scrim, body locked, focus moved inside |
| 7 | `/` | 1440 | Nested children expand | Toggle flips `aria-expanded`, children links appear |
| 8 | `/` | 1440 | Route navigation closes the drawer | Clicking a category → `/category/wedding-invitations`, drawer gone, scroll released |
| 9 | `/` | 1440 | Escape closes and restores focus | Drawer gone, scroll released, focus back on the rail trigger |
| 10 | `/` | 390 | Rail hidden, trigger in the mobile header | Rail `display: none`; header trigger labelled «تصنيفات المنتجات» |
| 11 | `/` | 390 | Near full-width drawer, same content | 351px of a 390px viewport, fully on screen, same 8 categories |
| 12 | `/` | all | One hero image, nothing beside it | 1 slide active of 4; `.vs-promocol` and `.vs-promo` both absent |
| 13 | `/` | 1440 | Hero swaps automatically | Slide 0 → 1 unattended; arrows and dots move it too |
| 14 | `/` | 1440 | Category title centred over the artwork | Title inside `.vs-cat__center`, opacity 1 at rest, no text panel |
| 15 | `/` | 1440 | Hover darkens and backs the title | Plate `rgba(18,16,26,0)` → `0.42`; card height unchanged |
| 16 | `/` | 1440 | Package swaps to its second image | Cover cross-fades to the second image, panel opacity 0 → 1 |
| 17 | `/` | 1440 | No-second-image fallback | Cover stays, panel still reveals, no substitute image |
| 18 | `/` | 1440 | Package panel fits, no row movement | `scrollHeight` ≤ card height; height 538px before and after |
| 19 | `/` | 1440 | Add package to cart | Cart badge 1, cart drawer opened, success state intact |
| 20 | `/shop` | 1440 | Product panel carries the data and actions | Title, price, compare-at, stock line, add button, quick view; fits; height 247px unchanged |
| 21 | `/shop` | 1440 | Keyboard focus reveals the same panel | Focusing the button gives `:focus-within`, panel opacity 1 |
| 22 | `/shop` | 1440 | Add to cart stays single-fire | One line, qty 1 |
| 23 | `/shop` | 390 | Nothing essential behind hover | Panel `position: static`, opacity 1: title, price and button all readable untouched |
| 24 | `/shop` | 390 | Touch add works with no hover path | Tap the button → one line, badge 1 |
| 25 | `/` | 1440 | Reduced motion: no autoplay | Slide 0 after 8s; transition duration 1e-05s |
| 26 | `/` | 1440 | Reduced motion: controls still work | Next arrow moves 0 → 1 |
| 27 | `/admin` | 1440 | Public styles isolated | No `.vs-public`, no rail, no drawer, 0 storefront cards |

### Defects found and fixed during pass 1

| Defect | Fix |
| --- | --- |
| Falling back to the bundled Vista logo hid the store name and would have branded **any** client instance built from this template as Vista. Caught by three existing tests. | Removed the fallback. The header reads `StoreSettings.logo_url` only, and shows the store name as text when there is none; the Vista instance sets that setting. |
| The rail was an `<aside>`, making a second `complementary` landmark and breaking the cart-page test. | It is navigation — changed to a labelled `<nav>`. |
| At 768px the hero used the phone's portrait crop and stood 878px tall — most of a tablet screen for one advertisement. | Portrait crop moved to ≤599px; tablets get 16/9. Now 412px at 768. |
| The bestsellers rail rendered 210px cards beside 318px grid cards on the same page, and the reveal panel had almost no room. | Rail column floor raised to 280px. A rail always overflows, so the floor is the width that actually applies. |
| The skeleton reserved a card body the card no longer has on desktop. | Skeleton body moved inside the ≤899px media query, matching the real card. |
| The sold-out state was stated three times (veil, stock line, button). | The panel's stock line is omitted when sold out. |

### Still outstanding from pass 1

- **No option-required or sold-out product exists in the preview catalogue** (35
  products: 0 with options, 0 out of stock, 9 on sale). The "اختر الخيارات"
  path, the refusal to direct-add, and the sold-out card were therefore verified
  by unit test only, not in the browser. Adding either to the preview dataset
  would mean inventing product data, so it was not done.
- Only two packages and two standard products carry a second image, deliberately:
  the remaining cards keep exercising the no-second-image fallback.
