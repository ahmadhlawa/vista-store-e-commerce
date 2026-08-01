# Preview visual QA — Vista Store

**Date:** 2026-08-02
**Branch:** `feat/vista-preview-data-storage`
**Runtime:** SQLite preview database + preview batch `vista-social-preview`, FastAPI on
`127.0.0.1:8000`, Vite dev server on `127.0.0.1:5173` with
`VITE_PREVIEW_NOTICE` set.

---

## Status: visual verification NOT performed

**No browser tooling was available in this environment.** There is no Playwright, no
Puppeteer, no Chrome or Edge on `PATH`, and no browser-driving tool in the harness. No
browser was installed to get around it.

Therefore:

* **Nothing below is a claim about how anything looks.** Not one pixel was observed.
* The 390 / 768 / 1440 px inspection **has not been done**, on any route.
* Arabic RTL rendering, image cropping, product-card consistency, mobile overflow, text
  overlap and the printed invoice layout are all **unverified** for the preview catalog.

What *was* done is protocol-level verification: every route was requested over real HTTP
and every value the screens render was confirmed to come from the API. That establishes
that the screens have correct data to draw. It establishes nothing about the drawing.

The previous release-candidate pass did open every route in real Chrome 151 at all three
widths — see [../acceptance/visual-qa.md](../acceptance/visual-qa.md). That pass ran
against an **empty** catalog. Its findings about chrome, header, footer and layout still
apply; its findings say nothing about a 25-product grid, a package detail page, or an
invoice with real line items, because none existed then.

---

## What was verified, and how

### Live storefront over HTTP — 39/39 checks

Against the running backend with the preview batch seeded.

| Area | Result |
| --- | --- |
| Store identity is `Vista Store` from the API | PASS |
| Public settings expose no private field | PASS |
| 7 preview categories public | PASS |
| 25 preview products public | PASS |
| Every product carries an image URL | PASS |
| A preview image is served over HTTP (`200 image/png`, 13 349 B) | PASS |
| Preview media sits under `/media/vista-store/preview/` | PASS |
| Featured 9 · New 6 · Bestsellers 8 · Packages 2 · On offer 5 | PASS |
| 3 hero slides · 2 banners · 6 visible home sections | PASS |
| Package detail resolves its 4 contents | PASS |
| The confirmed 200 × 85 cm size renders as a product specification | PASS |
| Exactly one delivery area, named «منطقة تجريبية للمعاينة» | PASS |
| Preview delivery fee is 0.00 — not an invented rate | PASS |
| Arabic search (`q=هودي`) returns the 2 hoodies | PASS |
| Category filter (`category=scarves`) returns 3 | PASS |
| Server prices the cart from its own data (2 × 95 = 190) | PASS |
| **A client-supplied `unit_price` of 1 is ignored; the order total is 190** | PASS |
| Coupon `PREVIEW10` discounts server-side (19 off, total 171) | PASS |
| Cash on delivery is accepted | PASS |
| **`payment_method: card` is refused with 422** | PASS |
| Admin login, dashboard, order confirmation | PASS |
| Confirming the order issued exactly one invoice, `INV-000001` | PASS |
| Invoice total matches the order and snapshots the line | PASS |
| Admin media lists the 12 preview objects | PASS |
| Admin refuses an unauthenticated caller (401) | PASS |

### Route reachability through the real Vite dev server — 28/28

Every route below returned `200` with the SPA entry document, through the shipped proxy
configuration. This proves routing and deep links, **not** rendering.

```
/  /shop  /category/wedding-invitations  /product/preview-hoodie-custom
/offers  /packages  /cart  /checkout  /track-order
/order-success/:orderNumber  /blog  /about  /contact
/admin/login  /admin  /admin/products  /admin/orders  /admin/invoices  /admin/media
```

Proxied API and media: `/health`, `/api/v1/store/settings`, `/products`, `/categories`,
`/hero-slides`, `/banners`, `/home-sections`, `/delivery-areas`, and a preview image —
all `200`.

### The preview notice

Verified at build level, not visually.

| Check | Result |
| --- | --- |
| With `VITE_PREVIEW_NOTICE` set, the Arabic string is present in the production bundle | PASS |
| With the variable unset — the shipped default — the string is **absent from the bundle entirely** | PASS |
| Component renders nothing for an unset or blank value | PASS (unit test) |
| Exposed as `role="status"` | PASS (unit test) |
| Storefront renders no notice when the build does not configure it | PASS (unit test) |

The notice is therefore genuinely opt-in and genuinely removable: turning it off removes
the markup from the build rather than hiding it.

### No electronic-payment UI

| Evidence | Result |
| --- | --- |
| Backend rejects `payment_method: card` with 422 | PASS (live) |
| `PaymentMethod` has exactly two members: `cash_on_delivery`, `manual` | PASS (source) |
| No card, Stripe, PayPal, CVV or gateway string anywhere in `frontend/src` | PASS (searched) |

---

## Per-route inspection — not done

Recorded as outstanding, not as passed. Each needs a real browser at 390 / 768 / 1440 px.

| Route | 390 | 768 | 1440 | Notes |
| --- | --- | --- | --- | --- |
| Home | ✗ | ✗ | ✗ | 3 hero slides, 2 banners, 6 sections, 25 products across them |
| Shop | ✗ | ✗ | ✗ | 25 cards, mixed name lengths |
| Category | ✗ | ✗ | ✗ | `wedding-invitations` has 5 items, `signage-stands` 2 |
| Product detail | ✗ | ✗ | ✗ | check the Arabic-numeral size specification |
| Offers | ✗ | ✗ | ✗ | 5 items with a struck-through compare-at price |
| Packages | ✗ | ✗ | ✗ | 2 packages; contents list with quantity 50 |
| Cart | ✗ | ✗ | ✗ | |
| Checkout | ✗ | ✗ | ✗ | one delivery area only; confirm the preview label is legible |
| Order success | ✗ | ✗ | ✗ | |
| Admin login | ✗ | ✗ | ✗ | |
| Dashboard | ✗ | ✗ | ✗ | |
| Admin products | ✗ | ✗ | ✗ | 25 rows |
| Admin orders | ✗ | ✗ | ✗ | |
| Invoice list | ✗ | ✗ | ✗ | |
| Invoice detail | ✗ | ✗ | ✗ | |
| Printable invoice | ✗ | ✗ | ✗ | **highest risk** — the first page break lands past ~15 line items, and the graduation package order is a good case |
| Media management | ✗ | ✗ | ✗ | 12 gradient objects |

Also unverified: Arabic RTL direction at every breakpoint, Vista identity presentation,
image quality and cropping of the gradient placeholders, product-card height consistency
with mixed Arabic name lengths, mobile horizontal overflow, and text overlap.

## Defects found and fixed in this pass

None visual — none could be. Two **functional** defects were found while exercising the
preview lifecycle against live data, and both are fixed:

1. **A sale was being mistaken for an owner edit.** `stock_quantity` was part of the row
   fingerprint, so buying a preview product made it look edited: `purge` then skipped it
   with a misleading reason and left it behind. Stock is now excluded from the
   fingerprint — a purchase is not curation. Regression test:
   `test_a_sale_is_not_mistaken_for_an_owner_edit`.
2. **`--force` skipped the never-delete guard.** The check that refuses to delete a
   product an order references ran only on the not-edited branch, so a forced purge of an
   edited row bypassed it. The guard now runs first, for every row, and no flag overrides
   it. Covered by `test_purge_refuses_to_delete_a_product_an_order_references`, which
   passes `force=True`.

No unrelated area was redesigned.

## To complete this document

On a machine with a browser:

```
# terminal 1
cd backend
set DATABASE_URL=sqlite+pysqlite:///./data/vista_preview.db
set LOCAL_MEDIA_ROOT=./data/vista-uploads
.venv\Scripts\python.exe -m uvicorn app.main:app --port 8000

# terminal 2
cd frontend
set VITE_PREVIEW_NOTICE=نسخة تجريبية — البيانات والأسعار للمعاينة
npm run dev
```

Then walk the table above at 390 / 768 / 1440 px, replace each ✗ with a real result, and
print one invoice. Until that is done, this project has **no visual verification of the
preview catalog** and must not be described as if it does.
