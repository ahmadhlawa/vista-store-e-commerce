# Local acceptance — Vista Store

**Date:** 2026-08-02
**Branch:** `feat/vista-store-initial-release`
**Instance:** fresh SQLite database `backend/data/vista_store_dev.db`, fresh media root
`backend/data/vista-uploads/`, both Git-ignored. The template's development database was
not reused and the template repository was not touched.

Nothing was deployed. No production system, SSH session, cPanel, MySQL server, R2 bucket
or external service was contacted.

## Automated suites

| Suite | Command | Result |
| --- | --- | --- |
| Backend | `.venv\Scripts\python.exe -m pytest --cov=app` | **193 passed**, 91% coverage |
| Frontend | `npx vitest run` | **47 passed** (4 files) |
| Production build | `npm run build` | **Clean** — 87 modules, 405 kB JS (111 kB gzip) |

Baseline before this work: backend 134, frontend 24. No existing test was weakened,
skipped or relaxed; the counts rose by 59 and 23 new tests.

## Live instance run — 26/26 passed

Executed against a real `uvicorn` process on `127.0.0.1:8000` with the real database,
real uploads and a real admin login — not the pytest client.

| # | Check | Result |
| --- | --- | --- |
| 1 | Store identity loads | **Pass** — `Vista Store` / `متجر فيستا` |
| 1b | No invented contact data | **Pass** — phone, WhatsApp, address, hours all blank |
| 2 | Admin login works | **Pass** |
| 3 | Category creation works | **Pass** |
| 4a | Product creation works | **Pass** |
| 4b | Image upload works | **Pass** — stored under the Vista media root |
| 4c | Image attaches to a product | **Pass** |
| 4d | Uploaded file is served back | **Pass** — 124 bytes, valid PNG returned from `/media/…` |
| 5 | Product appears in the storefront | **Pass** |
| 6 | Guest checkout with cash on delivery | **Pass** — `ORD-260801-5178`, total 220 |
| 7 | Order begins pending | **Pass** |
| 8 | Pending order has no invoice | **Pass** — and the invoice lookup 404s |
| 9 | Admin confirms the order | **Pass** |
| 10 | Exactly one invoice is generated | **Pass** — `INV-000001` |
| 11 | Repeating confirmation creates no duplicate | **Pass** — re-confirmed twice, and round-tripped through `processing`; still one invoice |
| 12 | Invoice values match the order snapshot | **Pass** — subtotal, discount, delivery, grand total, order number, phone, quantity |
| 12b | Tax disabled ⇒ totals identical | **Pass** |
| 13 | Editing the product price does not change the invoice | **Pass** — price changed to 777, invoice line still 100 |
| 14 | Invoice carries everything the A4 layout needs | **Pass — data only.** See the caveat below. |
| 15 | Cancelling the order cancels the invoice | **Pass** — status `cancelled`, number and snapshot kept |
| 16 | Inventory restoration is idempotent | **Pass** — stock returned to 10 and stayed there on a repeat cancel |
| 17 | Unsupported online payment is rejected | **Pass** — `credit_card`, `card`, `stripe`, `paypal`, `online` all 422 |
| 17b | A rejected payment creates no order | **Pass** |
| 18 | Public order view leaks nothing about the invoice | **Pass** |
| 19 | Invoice endpoints reject an anonymous caller | **Pass** — 401 |

## Visual QA — not performed

**No browser tooling was available in this session.** There is no headless browser, no
screenshot capability and no way to load the app at a given viewport. Therefore:

- The storefront and admin screens were **not** visually inspected at 390px, 768px or 1440px.
- The printed A4 invoice was **not** visually verified. Check 14 proves only that the
  invoice record contains every field the layout renders — not that the rendered page
  looks right.
- The cancelled watermark's **appearance** was not verified. Its presence and its text
  are asserted in `frontend/src/test/invoices.test.jsx`, but that is a DOM assertion in
  jsdom, which does no layout and no painting.

What *is* evidenced by the jsdom suite, and is worth more than nothing: every screen
below renders without error, the Arabic strings are present, the print CSS is emitted
with `@page size: A4`, and no card/CVV/expiry field exists anywhere on the checkout.

**Do not treat the visual layer as accepted.** Someone must walk the checklist below in
a real browser before this reaches the client.

### Manual checklist — still to be done

Run `npm run dev` and `uvicorn app.main:app --reload --port 8000`, then at each of
**390px**, **768px** and **1440px**:

| Screen | Route | Look for |
| --- | --- | --- |
| Home | `/` | RTL direction, Vista name in the header, no horizontal scroll |
| Product listing | `/shop` | Card grid reflows, no text overlap |
| Product detail | `/product/<slug>` | Image, price, specification table |
| Cart | `/cart` | Line totals, quantity controls reachable by thumb at 390px |
| Checkout | `/checkout` | **No card-number, expiry or CVV field.** Exactly two payment options |
| Order success | `/order-success/<number>` | Order number readable, no payment-captured wording |
| Admin login | `/admin/login` | No storefront chrome |
| Admin dashboard | `/admin` | Sidebar collapses to the ☰ menu at 390px |
| Orders | `/admin/orders` | Table scrolls horizontally rather than overflowing the page |
| Order detail | `/admin/orders/:id` | Invoice panel, payment method, print button |
| Invoice list | `/admin/invoices` | All eight columns legible; date filters usable |
| Invoice detail | `/admin/invoices/:number` | Totals align, item table readable |
| **Printable invoice** | same, then Ctrl+P | **One A4 page. No sidebar, no header, no buttons.** Table header repeats across a page break with many lines |
| Cancelled invoice | a cancelled one | Diagonal "ملغاة" watermark visible but not obscuring the numbers |

Print specifically needs a real check with **more than 15 line items**, which is where a
page break first occurs and where `display: table-header-group` earns its place.

## Known gaps at this point

1. **Visual QA outstanding**, as above.
2. **The store cannot take a real customer order.** No delivery area, no catalog, no
   contact number. All of it is blocked on the owner — see `data-needed-from-owner.md`.
3. **The catalog is empty by design.** The Facebook page was unreadable, so no product
   name or price could be verified, and none was invented. The category and product
   created during this run were test fixtures against a database that was then reset.
4. **Currency is unverified.** `ILS`/`₪` is carried over from the template, not
   confirmed for Vista Store. It must be settled before the first invoice is issued.
5. **MySQL was not exercised.** Local acceptance is SQLite only. The offline portability
   check (`python -m scripts.mysql_compat`) connects to nothing and is the only MySQL
   evidence available without a server.

## Reproducing this run

```powershell
cd backend
Remove-Item data\vista_store_dev.db -Force -ErrorAction SilentlyContinue
.venv\Scripts\alembic.exe upgrade head
.venv\Scripts\python.exe -m scripts.instance_cli apply --profile ../instance/vista-store.yaml
.venv\Scripts\python.exe -m app.initial_data --email <you@example.com> --password '<choose one>'
.venv\Scripts\python.exe -m uvicorn app.main:app --port 8000
```

The admin address must use a resolvable domain. `.test`, `.local` and `.localhost` are
reserved TLDs that the login endpoint's email validation rejects — the account is created
but can never sign in. This was hit during this run and corrected.
