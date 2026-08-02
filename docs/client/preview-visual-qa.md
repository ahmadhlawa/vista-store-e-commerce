# Preview visual QA — Vista Store

**Date:** 2026-08-02
**Branch:** `feat/vista-preview-data-storage`
**Runtime:** SQLite preview database `backend/data/vista_preview.db` + preview batch
`vista-social-preview`, FastAPI on `127.0.0.1:8000`, Vite dev server on `localhost:5173`
with `VITE_PREVIEW_NOTICE` set.
**Browser:** locally installed Google Chrome, driven over the DevTools Protocol from the
backend virtualenv (`websockets` + `httpx`, both already present). No Playwright, no
Puppeteer and no downloaded browser were installed for this pass.

---

## Status: visual verification performed

This supersedes the previous revision of this document, which recorded that no browser
was available. Every route below was opened in real Chrome at 390 / 768 / 1440 px, and the
full purchase-to-invoice flow was driven through the UI rather than the API.

Commands used, exactly as documented in the previous revision's "To complete this
document" section:

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

---

## 1. Routes and viewports inspected

Every cell was opened in Chrome, measured and captured as a full-page screenshot.
`ovf` is `max(scrollWidth) − clientWidth` on the document element: **0 means no horizontal
page overflow.**

### Public

| Route | Path | 390 | 768 | 1440 |
| --- | --- | --- | --- | --- |
| Home | `/` | ✅ ovf 0 | ✅ ovf 0 | ✅ ovf 0 |
| Shop | `/shop` | ✅ ovf 0 | ✅ ovf 0 | ✅ ovf 0 |
| Category | `/category/wedding-invitations` | ✅ ovf 0 | ✅ ovf 0 | ✅ ovf 0 |
| Product detail | `/product/preview-hoodie-custom` | ✅ ovf 0 | ✅ ovf 0 | ✅ ovf 0 |
| Offers | `/offers` | ✅ ovf 0 | ✅ ovf 0 | ✅ ovf 0 |
| Packages | `/packages` | ✅ ovf 0 | ✅ ovf 0 | ✅ ovf 0 |
| Cart | `/cart` | ✅ ovf 0 | ✅ ovf 0 | ✅ ovf 0 |
| Checkout | `/checkout` | ✅ ovf 0 | ✅ ovf 0 | ✅ ovf 0 |
| Order success | `/order-success/ORD-260802-7868` | ✅ ovf 0 | ✅ ovf 0 | ✅ ovf 0 |

### Admin

| Route | Path | 390 | 768 | 1440 |
| --- | --- | --- | --- | --- |
| Login | `/admin/login` | ✅ ovf 0 | ✅ ovf 0 | ✅ ovf 0 |
| Dashboard | `/admin` | ✅ ovf 0 | ✅ ovf 0 | ✅ ovf 0 |
| Products | `/admin/products` | ✅ ovf 0 | ✅ ovf 0 | ✅ ovf 0 |
| Orders | `/admin/orders` | ✅ ovf 0 | ✅ ovf 0 | ✅ ovf 0 |
| Invoice list | `/admin/invoices` | ✅ ovf 0 | ✅ ovf 0 | ✅ ovf 0 |
| Invoice detail | `/admin/invoices/INV-000003` | ✅ ovf 0 | ✅ ovf 0 | ✅ ovf 0 |
| Printable invoice | same route under `media="print"` | — | — | ✅ A4 |
| Media | `/admin/media` | ✅ ovf 0 | ✅ ovf 0 | ✅ ovf 0 |

---

## 2. Checks

| Check | Result |
| --- | --- |
| Arabic RTL | **Pass** — `dir="rtl"` on every one of the 48 route × viewport combinations, public and admin |
| Product image cropping | **Pass** — cards use a `1 / 1` `aspect-ratio` box with `background-size: cover`; measured card height is identical across a grid (555 px for every card at 768 px), so mixed Arabic name lengths do not stagger the rows |
| Hero and banner quality | **Pass** — 3 hero slides and 2 banners render their gradient placeholders at full bleed, no stretching, no broken objects |
| Card consistency | **Pass** — see above; no ragged grid found at any width |
| Text overlap | **Pass** — automated leaf-box intersection test found no genuine overlap. The only hits were the three hero-carousel slides sharing one stacking box, which is how the carousel works |
| Horizontal overflow | **Pass** — 0 px on every route at every width |
| Mobile navigation | **Pass** — storefront drawer opens (74 → 89 reachable links), navigates and closes; admin sidebar collapses to ☰ at 390 px and opens all 16 admin sections |
| Cart and checkout usability | **Pass** — full COD order placed through the UI at 1440 px; totals, quantity stepper and delivery-area select all usable |
| Preview notice | **Pass** — `role="status"` carrying «نسخة تجريبية — البيانات والأسعار للمعاينة» on all 9 public routes, and **absent from every admin route** |
| No card-payment UI | **Pass** — checkout offers exactly two radios, «الدفع عند الاستلام» and «تحويل بنكي / يدوي». No `stripe`, `paypal`, `cvv`, `رقم البطاقة`, `فيزا` or `ماستركارد` string in any rendered route |
| Invoice A4 print layout | **Pass** — see §4, and §4a for the pagination fix that followed |
| Cancelled invoice watermark | **Pass** — see §4; §4a extends it to every page of a multi-page invoice |
| Public/Admin layout separation | **Pass** — no storefront footer, cart link or "add to cart" control appears on any admin route; the preview notice does not leak into admin |

The `role="status"` node on `/admin/media` is the upload-types hint
(«الأنواع المسموحة: JPEG و PNG…»), not the preview notice.

---

## 3. Interactions completed

All driven through the rendered UI in Chrome.

| # | Interaction | Result |
| --- | --- | --- |
| 1 | Open a product | `/product/preview-hoodie-custom` — «هودي بطباعة مخصصة» |
| 2 | Add it to cart | cart line 95 ₪, badge increments |
| 3 | Complete COD checkout | **`ORD-260802-7868`**, 190 ₪, landed on `/order-success/ORD-260802-7868` |
| 4 | Log in to Admin | `preview-admin@example.com` → `/admin` |
| 5 | Confirm the order | `pending → confirmed` via «تحديث الحالة»; `POST /api/v1/admin/orders/2/status` → 200 |
| 6 | Open and print-preview the invoice | `INV-000002`, rendered under `media="print"` and exported to A4 PDF |
| 7 | Confirm only one invoice exists | **Pass** — one invoice per order; a round trip `confirmed → processing → confirmed` minted **no** second invoice |
| 8 | Mobile navigation and Admin tables | **Pass** — see §2 |

Three further orders were placed to exercise cases the single-line order cannot:
`ORD-260802-7845` (12 lines, `INV-000003`) and `ORD-260802-4688` (24 lines, `INV-000004`).
`INV-000002` was then cancelled through the real confirmation dialog to check the
watermark.

---

## 4. Printable invoice — A4

Measured against the true A4 content box (182 × 269 mm = 688 × 1016 px at 96 dpi) with
`Emulation.setEmulatedMedia media=print`, then exported with `Page.printToPDF`
(`preferCSSPageSize`, so the sheet's own `@page { size: A4; margin: 14mm }` governs).

| Invoice | Lines | Sheet height | A4 pages | Horizontal overflow |
| --- | --- | --- | --- | --- |
| `INV-000001` | 1 | 593 px | **1** | 0 |
| `INV-000002` | 1 | 632 px | **1** | 0 |
| `INV-000003` | 12 | 1066 px | 2 | 0 |
| `INV-000004` | 24 | 1582 px | 2 | 0 |

* **No admin chrome prints.** Under print media the sidebar, header, nav, every button and
  every link measured as not visible. Only `#invoice-sheet` paints.
* **The table header repeats across the page break.** `thead` computes to
  `display: table-header-group`, and this was confirmed on the real output, not inferred:
  `pdftotext -layout` on the 24-line PDF shows page 2 opening with the column header row
  («الإجمالي / الكمية / سعر القطعة / SKU»).
* **Rows never split** — `page-break-inside: avoid` holds; on the 24-line invoice the row
  that would straddle the boundary (index 13) is pushed whole onto page 2.
* **Cancelled watermark** — cancelling `ORD-260802-7868` through the dialog put
  `INV-000002` into `cancelled`. The diagonal «ملغاة» watermark
  (76 px, `rotate(-24deg)`, `rgba(192,57,43,.16)`) prints over the sheet while every
  figure underneath stays legible, and the cancellation line renders beneath the totals.

A 12-line invoice needing a second page is correct behaviour, not a defect: 1066 px of
content simply exceeds the 1016 px A4 content box. Only the totals block spills.

### 4a. Print pagination follow-up — 2026-08-02, commit `9c09d8e` onwards

The spill above was accepted as "correct for the content height". On review it is not
acceptable output: a subtotal on page 1 and an amount due on page 2 is an invoice a
reader cannot check at a glance. This pass changed **only the print layout** — no
redesign, no smaller type, no data change.

**What changed**

| Change | Why |
| --- | --- |
| Totals + customer notes + cancellation notice wrapped in one `.invoice-summary` with `break-inside: avoid` | They are one closing statement. When the remaining space is too small the whole block moves to the next page instead of splitting |
| `.no-print` promoted from sheet-scoped to a global print rule, and applied to the page header and the cancel-invoice card | `visibility: hidden` blanked the admin chrome but left its boxes in flow. A tall box *below* the sheet pushed the document past A4 and printed an empty second page on **every** non-cancelled invoice |
| `#invoice-sheet { overflow: visible }` under print | The sheet is `overflow: hidden` on screen to clip the rotated watermark; left in place it truncates anything past page 1 |
| Watermark switched to `position: fixed` under print | It was painted once, inside the sheet. Pinned to the page box it marks **every** sheet of a multi-page cancelled invoice |
| `tfoot: table-footer-group`, `tbody tr:first-child { break-before: avoid }` | Keeps the header row from being stranded and the first data row from being orphaned from it |

Item rows still break freely across pages — that is a list, and it is what makes a
one-page totals block possible.

**Focused verification.** The real `InvoiceDetailPage` was rendered for four fixtures,
the resulting document (markup + the component's own `PRINT_CSS`) written to disk, and
each one paginated by locally installed Chrome
(`--headless=new --print-to-pdf --print-to-pdf-no-header`, so the sheet's
`@page { size: A4; margin: 14mm }` governs). Page assignment was read back out of the
PDFs rather than eyeballed.

| Fixture | Lines | A4 pages | Grand total on | Whole summary on | Verdict |
| --- | --- | --- | --- | --- | --- |
| Short | 2 | **1** | page 1 | page 1 | ✅ one clean page — the empty second page is gone |
| Twelve-line | 12 | **1** | page 1 | page 1 | ✅ the reported spill is fixed |
| Twenty-four-line | 24 | 2 | page 2 | page 2 | ✅ rows continue, the block travels whole |
| Cancelled (12 lines) | 12 | **1** | page 1 | page 1 | ✅ |
| Cancelled (24 lines) | 24 | 2 | page 2 | page 2 | ✅ watermark on **both** pages |

* **Table header repeats:** the `SKU` column header is present in the extracted text of
  page 1 **and** page 2 of the 24-line PDF.
* **Watermark:** the 76 px watermark type is present in the content stream of every page
  of both cancelled PDFs, and of no page of any issued invoice.
* **Type sizes unchanged:** the sheet still prints at 12 px body / 13 px table cells.
  Nothing was shrunk to make content fit.

Locked in by two frontend regression tests in `frontend/src/test/invoices.test.jsx`
("keeps the closing totals block whole across a page break", "keeps the cancelled
watermark on every printed page").

---

## 5. Defects found and fixed

### D1 — Product detail rendered empty tab panels *(fixed)*

**Found at:** `/product/preview-hoodie-custom`, all three viewports.
**Symptom:** the «الوصف» and «المواصفات» tabs painted a bordered, 26 px-padded white
panel with nothing inside it, which reads as a broken page.

**Cause:** `descriptionParagraphs` was built from `product.description` alone, and the
specs list was rendered with no empty state. In the preview catalog **23 of 25 products
have no `description`** (they carry only `short_description`) and **22 of 25 have no
specifications**, so the empty panel was the normal case, not an edge case.

**Fix**, minimal and inside the existing design:

* `frontend/src/pages/ProductDetailPage.jsx` — the description falls back to
  `product.short` when `product.description` is empty, and the view-model carries an
  `emptyTabText`.
* `frontend/src/components/Product.jsx` — each of the two panels renders that muted line
  when it has nothing to show.

**Verified after the fix:** الوصف → «هودي قطني بطباعة الاسم أو التصميم الذي تختاره.»,
المواصفات → «لا تتوفر تفاصيل إضافية لهذا المنتج.», الشحن والإرجاع → unchanged.

Computed in the view-model and consumed as flat `v`/`pd` values, per the architectural
rule that presentational components receive one flat view-model.

### D2 — Preview media objects were missing from disk *(repaired; not a code change)*

**Symptom:** every product card, hero slide, banner and category tile painted blank. All
12 preview images returned **HTTP 404** — `/media/vista-store/preview/*.png` resolved to
`{"error":{"code":"http_error","message":"Not Found"}}`.

**Cause:** `backend/data/vista-uploads/` is correctly git-ignored runtime state and held
only `.gitkeep`, while `vista_preview.db` still carried all 12 `media_asset` rows. The
database and the object store had drifted apart in this working copy.

**Repair:** the placeholder bytes are deterministic — `gradient_png` over the dataset's own
colours — so each object was rewritten under its recorded `stored_key` by an operator-only
scratch script. Byte sizes match the values this document recorded on the original seed
(`tile-wedding` = 13 349 B). **No application code and no database row was changed.**

**Related finding, deliberately not fixed — see §7.1.** `preview_cli seed` cannot repair
this. `_seed_media` decides from the database row alone:

```python
if row is not None:
    urls[item.key] = row.url
    ...
    plan.add("skip", target, "already uploaded")
    continue
```

It never asks storage whether the object still exists, so re-seeding reports
`skip=53, update=1` and "already uploaded" for 12 objects that are not there. Fixing it
needs an `exists()` on the `StorageProvider` boundary, which is outside the scope of a
visual-QA pass.

---

## 6. Non-defects investigated and dismissed

* **Card heights looked ragged (196–357 px) in a first pass.** That was my own grouping
  heuristic walking up to the wrong ancestor. Measured directly on `.hv-card`, every card
  in a grid is exactly 555 px. No defect.
* **Order rows appeared unclickable.** The detail page opens from the «عرض» link in the
  last column, not from the order-number cell. Working as designed.
* **A status update appeared to do nothing.** The first script clicked «حفظ الملاحظات»
  (save notes) because it matched on «حفظ». The status control is «تحديث الحالة» and works
  correctly. Test-harness error, not a product defect.
* **The cancelled watermark appeared to be missing.** Cancelling opens a confirmation
  dialog that had not been accepted, so nothing had been cancelled. Once accepted, the
  watermark renders.
* **Home reported six text overlaps.** All three hero-carousel slides share one stacking
  box by design.

---

## 7. Remaining visual issues

1. ~~**`preview_cli seed` cannot repair missing media objects**~~ — **fixed 2026-08-02.**
   `StorageProvider` now exposes `exists()` and `restore()`; the seed verifies the storage
   object as well as the ownership row and re-uploads a missing one **to its recorded
   key**, so no second `MediaAsset` row appears and no already-published URL changes.
   Verified against MySQL: one owned object deleted through the storage boundary, the next
   seed reported `repair=1, skip=52, update=1`, the object came back byte-identical at the
   same key, media rows stayed at 12, and a further seed was a plain no-op. Owner-edited
   rows, rows uploaded to a different provider and keys outside the batch prefix are never
   inspected or rewritten.
2. ~~**A 12-line invoice spills its totals block onto a second A4 page**~~ — **fixed
   2026-08-02, see §4a.** A short invoice is now one clean page, a 12-line invoice is one
   clean page, and a 24-line invoice keeps the whole totals block together on page 2.
3. **Emulated viewports, not physical devices.** Touch gestures, on-screen keyboards and
   browser chrome insets were not exercised.
4. **Chrome only.** Firefox, WebKit and a visual-regression baseline are still missing —
   unchanged from `../acceptance/visual-qa.md`.
5. **Carried over from the release-candidate pass:** Admin → Media renders a sub-kilobyte
   asset as «0 كيلوبايت». Cosmetic, still not changed.

---

## 8. Screenshots

Session artefacts in the operator's scratch directory, **deliberately not committed**,
matching the convention in [../acceptance/visual-qa.md](../acceptance/visual-qa.md):

```
%TEMP%\claude\D--Project-vista-store-e-commerce\
  b42bbe76-e955-4433-ae38-ac6f695fd6c5\scratchpad\
    shots-final\<route>-<390|768|1440>.png     48 full-page captures + final-report.json
    shots\pdp-desc-fixed.png                   product tabs after the D1 fix
    shots\nav-390-open.png                     storefront drawer at 390
    shots\nav-admin-390-open.png               admin sidebar at 390
    shots\inv-print-cancelled.png              cancelled invoice under print media
    shots\INV-000003-multiline-print.png       12-line invoice, print media
    shots\INV-000004-big-a4.pdf                24-line invoice, real A4, 2 pages
    shots\INV-00000{1,2,3}-a4.pdf              A4 exports measured in §4
```

---

## 9. Protocol-level verification (unchanged, still valid)

The HTTP-level results recorded in the previous revision were re-confirmed by this pass
wherever the UI exercised them, and are retained:

* Store identity, 7 categories, 25 products, preview media prefix, featured/new/
  bestseller/package/offer counts, package contents, the 200 × 85 cm specification, the
  single preview delivery area at 0.00, Arabic search, category filtering.
* Server-authoritative pricing: a client-supplied `unit_price` of 1 is ignored.
* `PREVIEW10` discounts server-side; `payment_method: card` is refused with 422;
  `PaymentMethod` has exactly two members.
* The preview notice is compiled out of the bundle entirely when the variable is unset.

---

## 10. Content-enrichment follow-up — 2026-08-02

The effective database was confirmed as `backend/data/vista_preview.db` before seeding;
`vista_store_dev.db` was not used. The preview status now reports 80 owned records:
8 categories, 35 products (5 packages), 25 media objects, 4 hero slides, 3 banners and
3 preview-owned home sections. Re-seeding reports all 80 content/media records as skips
(only the import batch seed counter updates).

The existing local Chrome process was available but this execution environment could not
attach a DevTools session or launch a controlled Chrome instance. Therefore no new 390 /
768 / 1440 screenshots were captured for this follow-up and no visual-pass claim is made.
The prior route matrix above remains the last browser evidence. Required owner gap remains:
original Vista product/hero photography; the 25 current images are generated, owned preview
artwork rather than social images.
