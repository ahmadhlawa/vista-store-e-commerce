# Vista reference alignment — browser QA

Locally installed Chrome 151 driven over the DevTools Protocol against the Vista
preview database (`backend/data/vista_preview.db`, batch `vista-social-preview`,
80 owned records). No browser was installed for this pass. Screenshots are in
`screenshots/vista-reference-alignment/`.

**Scope note.** No reference screenshots were attached to the session, so the
written requirements were treated as the specification and every check below is
against those. The public reference site was not scraped and nothing from it was
copied: no markup, CSS, image, logo or product datum.

## Environment defect found first

Chrome was initially driven in a normal window. Every CSS transition read as
stuck at its start value — hover reveals reported `opacity: 0` while the card
genuinely matched `:hover`, and `CSS.getMatchedStylesForNode` confirmed the rule
existed and matched. The window was occluded, so Chrome had paused compositing;
JS timers (hero autoplay) still ran, which is what made it look like a CSS bug.
Re-running headless with `--disable-backgrounding-occluded-windows` reproduced
every reveal correctly. **No product code was changed for this** — worth
recording because the same trap will catch the next person.

## Responsive sweep — `/`

| Viewport | Overflow | Rail | Gutter | Hero ratio | Cat / product / package columns | Panel |
| --- | --- | --- | --- | --- | --- | --- |
| 360 | 0 | hidden | 0 | 0.83 | 2 / 2 / 1 | static, visible |
| 390 | 0 | hidden | 0 | 0.83 | 2 / 2 / 1 | static, visible |
| 768 | 0 | hidden | 0 | 1.78 | 3 / 3 / 2 | static, visible |
| 1024 | 0 | 60px | 60px | 2.00 | 3 / 3 / 3 | absolute, hidden |
| 1440 | 0 | 68px | 68px | 2.63 | 4 / 4 / 3 | absolute, hidden |
| 1920 | 0 | 68px | 68px | 2.63 | 4 / 4 / 3 | absolute, hidden |

No horizontal overflow at any width. Below 900px the rail leaves the layout and
its gutter collapses, so nothing reserves space for something that is not there.

## Checks

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

## Defects found and fixed during the pass

| Defect | Fix |
| --- | --- |
| Falling back to the bundled Vista logo hid the store name and would have branded **any** client instance built from this template as Vista. Caught by three existing tests. | Removed the fallback. The header reads `StoreSettings.logo_url` only, and shows the store name as text when there is none; the Vista instance sets that setting. |
| The rail was an `<aside>`, making a second `complementary` landmark and breaking the cart-page test. | It is navigation — changed to a labelled `<nav>`. |
| At 768px the hero used the phone's portrait crop and stood 878px tall — most of a tablet screen for one advertisement. | Portrait crop moved to ≤599px; tablets get 16/9. Now 412px at 768. |
| The bestsellers rail rendered 210px cards beside 318px grid cards on the same page, and the reveal panel had almost no room. | Rail column floor raised to 280px. A rail always overflows, so the floor is the width that actually applies. |
| The skeleton reserved a card body the card no longer has on desktop. | Skeleton body moved inside the ≤899px media query, matching the real card. |
| The sold-out state was stated three times (veil, stock line, button). | The panel's stock line is omitted when sold out. |

## Remaining differences and limitations

- **No option-required or sold-out product exists in the preview catalogue** (35
  products: 0 with options, 0 out of stock, 9 on sale). The "اختر الخيارات"
  path, the refusal to direct-add, and the sold-out card were therefore verified
  by unit test only, not in the browser. Adding either to the preview dataset
  would mean inventing product data, so it was not done.
- **The logo renders smaller than its box.** The supplied JPEG is 1000×1000 with
  the artwork occupying only x 19.8–80.4% and y 34.6–64.6% — about a third of the
  file is white margin. The header uses `object-fit: contain` so no client's mark
  is ever cropped or stretched, which means that padding is rendered too. A
  trimmed, transparent original fixes it with no code change; requested in
  `backend/data/brand/README.md`.
- **Preview artwork is abstract gradient placeholders**, so a second image reads
  as "a different gradient" rather than "the package contents". The mechanism is
  correct; only the pictures are stand-ins. No image was generated for this pass.
- Only two packages and two standard products carry a second image, deliberately:
  the remaining cards keep exercising the no-second-image fallback.
