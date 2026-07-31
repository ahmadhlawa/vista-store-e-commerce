# Implementation status — full-stack commerce MVP

**Authoritative handoff document.** Written 2026-08-01 after inspecting the repository,
Git state, source files and live command output. Every result below was produced by a
command run in this session; none of it is from memory.

---

## 1. Date and objective

- **Date:** 2026-08-01
- **Objective:** turn the reusable commerce template into a complete, locally functional
  full-stack MVP — the existing React/JSX Arabic-RTL storefront connected to a real
  FastAPI + SQLAlchemy + Alembic backend on local SQLite, with admin authentication and
  roles, a functional admin workspace, guest checkout, order management, local media
  uploads, seeded demo data, automated tests, accurate documentation and inactive
  deployment templates.
- **Product model:** one independent instance per client. No multi-tenancy, no
  `tenant_id`, no shared SaaS database, no client branding in the template.

---

## 2. Git state (verified)

```
$ git status --short --branch
## feat/fullstack-commerce-mvp
 M frontend/package-lock.json
 M frontend/package.json
 M frontend/src/App.jsx
 M frontend/src/components/CartCheckout.jsx
 M frontend/src/components/Footer.jsx
 M frontend/src/components/Header.jsx
 M frontend/src/components/Home.jsx
 M frontend/src/components/Listing.jsx
 M frontend/src/components/Overlays.jsx
 M frontend/src/components/Pages.jsx
 M frontend/src/components/Product.jsx
 M frontend/src/components/ProductCard.jsx
 M frontend/src/index.css
 M frontend/src/main.jsx
 M frontend/src/store.js
 M frontend/vite.config.js
?? docs/  (implementation-status.md, continuation-prompt.md)
?? frontend/src/{admin,api,app,hooks,layouts,pages,services,storage,test,utils}/
```

| Item | Value |
| --- | --- |
| Current branch | `feat/fullstack-commerce-mvp` |
| HEAD before the handoff commit | `9288d7c` — `feat: add FastAPI commerce backend with local SQLite persistence` |
| Base commit | `2c418a4` — `chore: bootstrap reusable commerce template` |
| Upstream | **none configured** (`fatal: no upstream configured for branch 'feat/fullstack-commerce-mvp'`) — the branch has never been pushed |
| `git diff --check` | clean (no whitespace errors) |
| `git diff --stat` (tracked) | 16 files changed, 4890 insertions(+), 3110 deletions(-) |
| Untracked new source files | 46 frontend files + this docs set |

Sibling branches (untouched by this work):

```
  feat/backend-foundation     2c418a4
  feat/frontend-foundation    f2ddd6e [origin/feat/frontend-foundation]
* feat/fullstack-commerce-mvp 9288d7c
  main                        2c418a4 [origin/main]
```

---

## 3. Architecture implemented

```
frontend (React 18 + Vite 6, JavaScript/JSX, Arabic RTL)
    │  fetch  /api/v1/...   (Bearer JWT on /api/v1/admin/* and /auth/me)
    ▼
backend (FastAPI — focused modular monolith)
    ├── api/deps.py           session, current admin, super-admin guard, pagination
    ├── api/v1/endpoints/     routing + Pydantic request/response schemas
    ├── services/             pricing, orders, catalog, audit, slugs, store settings
    ├── models/               SQLAlchemy 2.x ORM (21 entities)
    ├── storage/              provider interface; local active, R2 adapter inert
    └── db/                   engine/session; Alembic owns the schema
    ▼
SQLite (local dev + tests)  →  MySQL 8 later via DATABASE_URL, same models
```

Frontend composition:

- `App.jsx` declares all routes. `/admin/*` renders `AdminApp`; everything else renders
  `StorefrontLayout` wrapped in `StoreProvider`.
- `StoreProvider` holds shared storefront state (settings, categories, delivery areas,
  cart, overlays, search, filters, coupon, checkout form, recently viewed).
- `useShellView()` builds the shared slice of the flat `v` view-model the original design
  components consume; each page merges its own slice on top and passes `v` down.
- The presentational components keep their original markup and styling; only anchors
  (`<a>` → `<A>`) and data bindings changed.

---

## 4. Files created, modified, moved, deleted

### 4.1 Committed in `9288d7c` (backend)

**Created — configuration and packaging**
```
backend/pyproject.toml
backend/.env.example
backend/alembic.ini
backend/alembic/env.py
backend/alembic/script.py.mako
backend/alembic/versions/0001_initial_initial_commerce_schema.py
backend/data/uploads/.gitkeep
```

**Created — application**
```
backend/app/__init__.py
backend/app/main.py
backend/app/initial_data.py
backend/app/core/{__init__,config,enums,security}.py
backend/app/db/{__init__,base,session}.py
backend/app/models/{__init__,admin,audit,catalog,content,marketing,media,orders,store}.py
backend/app/schemas/{__init__,auth,catalog,common,content,marketing,media,orders,store}.py
backend/app/services/{__init__,audit,catalog,errors,orders,placeholder_image,pricing,
                      slugs,store_settings}.py
backend/app/storage/{__init__,base,local,r2}.py
backend/app/api/{__init__,crud,deps}.py
backend/app/api/v1/{__init__,router}.py
backend/app/api/v1/endpoints/{__init__,auth,public_catalog,public_checkout,public_content,
                              admin_catalog,admin_commerce,admin_content,admin_media,
                              admin_users}.py
backend/scripts/{__init__,seed}.py
backend/tests/{__init__,conftest,test_auth,test_catalog,test_checkout,
               test_content_and_media,test_health_and_config,test_migrations}.py
docs/architecture/fullstack-commerce-mvp-design.md
docs/architecture/fullstack-commerce-mvp-plan.md
```

**Modified**
```
.gitignore     + *.db, .coverage, coverage.xml, htmlcov/, *.egg-info/, venv/,
                 backend/data/uploads/* with !.gitkeep
.env.example   rewritten: every required key, SQLite default, commented MySQL example
```

**Deleted**
```
backend/.gitkeep   (the directory has real content now)
```

### 4.2 Uncommitted — frontend rewrite

**Modified (16 tracked files)**
```
frontend/package.json          + react-router-dom, vitest, @testing-library/*, jsdom,
                                 user-event; + "test" and "test:watch" scripts
frontend/package-lock.json     regenerated by npm install
frontend/vite.config.js        + dev proxy for /api /media /health, + vitest config
frontend/src/index.css         + --adminG / --adminNav responsive variables
frontend/src/main.jsx          wraps <App/> in <BrowserRouter>
frontend/src/App.jsx           was the ~530-line hash-routing class component;
                               now the route table only
frontend/src/store.js          was mock data + fake services;
                               now presentation constants only
frontend/src/components/Header.jsx      router links, store identity from the API
frontend/src/components/Footer.jsx      router links, store identity from the API
frontend/src/components/Home.jsx        section visibility + showcases driven by
                                        home_sections; package contents from the API
frontend/src/components/Listing.jsx     router links, + listError state
frontend/src/components/Product.jsx     variants, package contents, reviews tab removed
frontend/src/components/ProductCard.jsx router links, rating row gated by p.hasRating
frontend/src/components/CartCheckout.jsx server-priced totals, delivery area select,
                                        order-success block moved to its own route
frontend/src/components/Overlays.jsx    router links, store name from the API
frontend/src/components/Pages.jsx       AuthPage/AccountPage removed; OrderSuccessPage,
                                        TrackPage, StaticPageView, NotFoundPage added
```

**Created (46 files)**
```
frontend/src/api/{client,publicApi,adminApi}.js
frontend/src/app/StoreProvider.jsx
frontend/src/hooks/useShellView.js
frontend/src/layouts/StorefrontLayout.jsx
frontend/src/services/{catalog,storefront,checkout}.js
frontend/src/storage/{safeStorage,cartStorage,authStorage}.js
frontend/src/utils/{A.jsx,format.js,placeholder.js}

frontend/src/pages/{HomePage,ProductListPage,ProductDetailPage,CartRoutePage,
                    CheckoutRoutePage,OrderSuccessRoutePage,TrackOrderPage,
                    BlogRoutePages,StaticContentPage,ContactRoutePage,
                    CalculatorRoutePage,NotFoundRoutePage}.jsx

frontend/src/admin/{AdminApp,AdminAuth,AdminLayout,ResourceScreen,ui}.jsx
frontend/src/admin/pages/{LoginPage,DashboardPage,ProductsPage,ProductEditorPage,
                          CatalogScreens,CommerceScreens,ContentScreens,OrdersPages,
                          MediaPage,SettingsPage,AccountScreens}.jsx

frontend/src/test/{setup.js,utils.jsx,storefront.test.jsx,admin.test.jsx}
docs/implementation-status.md
docs/continuation-prompt.md
```

**Moved / deleted:** none. No file was renamed; no source file was deleted apart from
`backend/.gitkeep`.

---

## 5. Backend modules and endpoints (complete)

Prefix `/api/v1`. `/health` sits outside the prefix. OpenAPI reports **62 paths**.

**Public — catalog** (`public_catalog.py`)
```
GET /categories                    GET /categories/{slug}
GET /products                      GET /products/{slug}
GET /products/featured             GET /products/{slug}/related
GET /products/new                  GET /products/bestsellers
GET /products/packages             GET /products/molds
```
`/products` supports `q`, `category`, `product_type`, `is_featured`, `is_new`,
`is_bestseller`, `on_sale`, `in_stock`, `min_price`, `max_price`, `sort`, `page`,
`page_size`.

**Public — content** (`public_content.py`)
```
GET /store/settings   GET /hero-slides   GET /banners   GET /home-sections
GET /delivery-areas   GET /articles      GET /articles/{slug}   GET /pages/{slug}
```

**Public — checkout** (`public_checkout.py`)
```
POST /coupons/validate   POST /cart/price
POST /orders             GET  /orders/{order_number}?token=...
```

**Auth** (`auth.py`) — `POST /auth/login`, `GET /auth/me`

**Admin** (all require a bearer token)
```
admin_catalog.py   /admin/categories (CRUD)
                   /admin/products (CRUD)
                   /admin/products/{id}/images (list, add, delete)
                   /admin/products/{id}/specifications (PUT replace)
                   /admin/products/{id}/options (GET, PUT replace)
                   /admin/products/{id}/variants (list, create, patch, delete)
                   /admin/products/{id}/package-items (list, add, delete)
admin_content.py   /admin/settings (GET, PATCH)
                   /admin/hero-slides, /admin/banners, /admin/home-sections (CRUD)
                   /admin/articles, /admin/pages (CRUD)
admin_commerce.py  /admin/dashboard
                   /admin/coupons, /admin/delivery-areas (CRUD)
                   /admin/orders, /admin/orders/{id}
                   /admin/orders/{id}/status, /admin/orders/{id}/notes
admin_media.py     /admin/media (list, upload, delete)
admin_users.py     /admin/admins (CRUD, super_admin only)
                   /admin/audit-logs (super_admin only)
```

Error shape is uniform: `{"error": {"code": "...", "message": "...", ...}}`, produced by
three exception handlers in `app/main.py` (DomainError, HTTPException, validation).

---

## 6. Frontend routes, integrations and admin workspaces (complete)

**Storefront routes** — all render, all use React Router `<Link>` via `utils/A.jsx`:
```
/                        /shop                  /category/:slug
/offers                  /packages              /molds
/search?q=               /product/:slug         /cart
/checkout                /order-success/:orderNumber
/track-order             /blog                  /blog/:slug
/page/:slug              /about                 /privacy-policy
/return-policy           /terms                 /contact
/tools/calculator        *  → intentional Not Found page
```
`/about`, `/privacy-policy`, `/return-policy` and `/terms` are kept as direct links from
the original storefront and resolve to the same StaticPage records as `/page/:slug`.

**API integration:** every commercial value on the storefront comes from the API —
store identity and colours, categories, products, hero slides, banners, home sections,
articles, static pages, delivery areas, coupon validation, cart re-pricing, order
creation and order lookup. `src/store.js` retains only navigation structure and static
copy.

**Admin workspaces** (`/admin`, own layout, no storefront chrome):
```
/admin/login              standalone, no navigation
/admin                    dashboard: counts, revenue, low stock, recent orders
/admin/products           list with search, type filter, status filter, pagination
/admin/products/:id       editor: core details, category, type, prices, inventory,
                          flags, SEO, images, specifications, options, variants,
                          package contents (package products only)
/admin/categories         CRUD
/admin/orders             list with search + status filter
/admin/orders/:orderId    detail, status change (cancel confirms), internal notes,
                          status history
/admin/coupons            CRUD
/admin/delivery           CRUD
/admin/hero               CRUD
/admin/banners            CRUD
/admin/home               CRUD — ordering, visibility, titles, descriptions
/admin/articles           CRUD
/admin/pages              CRUD
/admin/media              upload, copy URL, delete
/admin/settings           identity, contact, social, colours, currency, SEO
/admin/admins             super_admin only
/admin/audit              super_admin only
```
Super-admin-only entries are hidden from the navigation *and* guarded by a route wrapper,
and the API enforces the same rule independently.

---

## 7. Database models and migrations

21 entities in `backend/app/models/`, all created by a single revision
`0001_initial` (`alembic/versions/0001_initial_initial_commerce_schema.py`).

```
AdminUser        StoreSettings    Category         Product
ProductImage     ProductSpecification              ProductOption
ProductOptionValue                ProductVariant   ProductVariantOptionValue
PackageItem      HeroSlide        Banner           HomeSection
Coupon           DeliveryArea     Order            OrderItem
OrderStatusHistory                Article          StaticPage
MediaAsset       AuditLog
```

`tests/test_migrations.py` asserts that the migrated schema and `Base.metadata` contain
exactly this table set, so a drifting model is a test failure.

Notable schema decisions:
- Money is `Numeric(12,2)` + Python `Decimal`.
- Roles, statuses, product types and placements are `String(32)` validated by Pydantic
  enums — portable, no native-ENUM migration pain on MySQL.
- Timestamps are naive UTC `DateTime`, serialised with a `Z` suffix.
- `JSON` is used only for `HomeSection.config` and `AuditLog.meta`.
- `Product.search_text` holds an Arabic-normalised copy of name + SKU + short description,
  refreshed on every write, so `LIKE` search is spelling-insensitive.
- Database-level guards: `package_product_id <> included_product_id`,
  non-negative price/stock/total, positive quantity/discount.

---

## 8. Feature status by area

| Area | Status | Notes |
| --- | --- | --- |
| Authentication | complete | Argon2 (pwdlib) + PyJWT HS256; `/auth/login`, `/auth/me`; generic invalid-login response; disabled admins cannot log in and an existing token stops working the moment the account is deactivated |
| Roles | complete | `super_admin` / `admin`; admin accounts and audit logs are super-admin only; a super admin cannot disable, demote or delete itself, and the last active super admin cannot be deleted |
| Media storage | complete (local) | `StorageProvider` interface; `LocalStorageProvider` active, served at `LOCAL_MEDIA_BASE_URL`; magic-byte validation (JPEG/PNG/WebP/GIF/ICO), size limit, `uuid4().hex` stored names; DB stores metadata + URL only. `R2StorageProvider` is a deliberate adapter boundary that raises a clear configuration error |
| Orders | complete | guest checkout only; human-readable `ORD-YYMMDD-NNNN`; immutable `OrderItem` snapshots; `OrderStatusHistory` with the acting admin; internal admin notes; confirmation lookup scoped by `public_token` |
| Inventory | complete | decremented once at order creation inside the order transaction; restored once on cancellation; repeated cancellation is a no-op; a cancelled order cannot re-enter a stock-holding status; `track_inventory` disables enforcement; variant stock is authoritative when a variant is chosen |
| Coupons | complete | percentage and fixed; min order, max discount cap, usage limit, date window; discount never exceeds the subtotal; usage counter incremented in the same transaction |
| Delivery | complete | per-area fee, optional minimum order, optional free-delivery threshold; inactive areas rejected |
| Content | complete | hero slides and banners with schedule windows, home sections with ordering/visibility/config, articles and static pages with publication filtering |
| Settings | complete | single row; public projection excludes `order_notifications_email` and `id`; colours applied to the storefront as CSS custom properties |
| Pricing | complete | server-authoritative: DB prices only, `compare_at_price` never charged, client-supplied totals ignored |
| Audit log | complete | records product/category/order/coupon/settings/media/admin changes plus logins; credentials and tokens are stripped from metadata |

---

## 9. Seed data and local development workflow

`backend/scripts/seed.py` is idempotent — every entity is matched on its natural key
(slug, code, name or section key). Verified on a clean database in this session:

```
artwork: 13 placeholder images   categories: 15        products: 31
variants: 9                      package contents: 8   hero slides: 3
banners: 3                       home sections: 8      coupons: 2
delivery areas: 5                articles: 4           static pages: 6
demo order: ORD-260731-9247      admin: skipped (no credentials supplied)
```

The seed writes real gradient PNGs into `LOCAL_MEDIA_ROOT` via
`app/services/placeholder_image.py` (a ~25-line zlib/struct PNG writer) and registers
them as `MediaAsset` rows, so seeded content has working image URLs without committing
binaries. An admin account is created **only** when credentials are supplied explicitly.

Local workflow (all of this works today):

```powershell
cd D:\Project\commerce-template\backend
python -m venv .venv
.venv\Scripts\python.exe -m pip install -e ".[dev]"
copy .env.example .env                      # then edit; never commit .env
.venv\Scripts\alembic.exe upgrade head
.venv\Scripts\python.exe -m scripts.seed
.venv\Scripts\python.exe -m app.initial_data --email you@example.com --password '<choose>'
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000

cd D:\Project\commerce-template\frontend
npm install
npm run dev            # proxies /api /media /health to 127.0.0.1:8000
```

---

## 10. Partially implemented

1. **Frontend test suite** — 24 tests exist; 22 pass, 2 fail on ambiguous selectors in the
   test code itself (see §12). No application defect is implicated.
2. **`maintenance_mode`** — stored, editable in the admin area and exposed on the public
   settings payload, but the storefront does not gate itself on it yet.
3. **Recently-viewed products** — the PDP fetches each remembered slug individually
   (`Promise.allSettled` over up to 6 requests). Correct, but a batch endpoint would be
   better.
4. **Home "showcase" blocks** — driven by the `silicone_molds` and `featured_products`
   home sections with fixed gradient backgrounds; the background is not yet admin-editable.
5. **Search** — normalised `LIKE` over `Product.search_text`. Correct, but not a full-text
   index; MySQL deployments at scale will want one.

---

## 11. Not started

1. **`deployment/`** — still only a `.gitkeep`. No systemd unit template, no Nginx
   template, no environment-file reference, no deployment checklist, no client instance
   naming document.
2. **Documentation** — the root `README.md` is still the original bootstrap text. Not
   written: local development setup, backend architecture, frontend architecture,
   database model overview, API module overview, admin capability list, SQLite workflow,
   future MySQL migration, future R2 integration, deployment template usage, new-client
   cloning checklist, backup/restore considerations, known limitations.
3. **Local end-to-end smoke run** — the backend and frontend have never been run together
   against a browser in this session. API-level integration is verified; the browser flow
   is not.
4. **Browser verification** — no browser tooling was available in this session. Nothing
   has been visually inspected. Do not claim visual success without inspecting it.
5. **Frontend checkpoint commits** — the whole frontend rewrite is in the single WIP
   commit created by this handoff, not in the planned themed commits.
6. **Push** — the branch has no upstream and has never been pushed.

---

## 12. Known failures (exact)

### 12.1 `npx vitest run` — 2 of 24 tests fail

Both are ambiguous queries in the **test files**, not defects in the application.

**Failure 1**
```
FAIL src/test/storefront.test.jsx > public storefront > restores a saved cart on the cart page
TestingLibraryElementError: Found multiple elements with the text: 200 ₪
  at src/test/storefront.test.jsx:127
      expect(screen.getByText("200 ₪")).toBeInTheDocument();
```
Cause: with one line of 2 × 100 ₪ the cart shows `200 ₪` as both the line total and the
order subtotal. Fix: `expect((await screen.findAllByText("200 ₪")).length).toBeGreaterThan(0)`.

**Failure 2**
```
FAIL src/test/admin.test.jsx > admin workspace > renders the order management route with its data
TestingLibraryElementError: Found multiple elements with the text: بانتظار المراجعة
  at src/test/admin.test.jsx:168
      expect(screen.getByText("بانتظار المراجعة")).toBeInTheDocument();
```
Cause: the string appears both in the row's status badge and as an `<option>` in the
status filter. Fix: scope to the table, or assert on the `<option>`-free badge, e.g.
`within(screen.getByRole("table")).getByText("بانتظار المراجعة")`.

### 12.2 Fixed earlier in this session (do not re-diagnose)

- `window.localStorage.clear is not a function` — jsdom in this environment does not
  expose a resettable Storage. `frontend/src/test/setup.js` now installs an in-memory
  Storage polyfill. Resolved; all 24 tests now execute.
- Pydantic `EmailStr` rejects `.local` addresses as reserved — backend tests use
  `@example.com`. Resolved.
- Unsaved `StoreSettings()` returned `None` for every column default — the defaults now
  live in `STORE_SETTINGS_DEFAULTS` in `app/models/store.py` and are applied both as
  column defaults and when returning the unsaved public fallback. Resolved.

### 12.3 Non-failures worth knowing

- `git` prints `LF will be replaced by CRLF` warnings for the frontend files on Windows.
  Cosmetic; `git diff --check` is clean.
- `starlette.testclient` prints a `StarletteDeprecationWarning` about httpx. Harmless.

---

## 13. Latest verified results

All produced in this session, on 2026-08-01, in this order.

| Check | Command | Result |
| --- | --- | --- |
| Backend tests | `backend\.venv\Scripts\python.exe -m pytest` | **70 passed**, 1 warning, 26.42 s |
| Backend coverage | `... -m pytest --cov=app` | **TOTAL 88 %** (2859 statements, 349 missed) |
| Backend import + health | `python -c "TestClient(app).get('/health')"` | `health 200 {'status': 'ok', 'app': 'Commerce Template', 'environment': 'development'}` |
| OpenAPI generation | `app.openapi()` | **62 paths** |
| Alembic upgrade (clean DB) | `alembic upgrade head` then `alembic current` | `Running upgrade -> 0001_initial, initial commerce schema` → `0001_initial (head)` |
| Seed (clean DB) | `python -m scripts.seed` | succeeded, counts in §9; a second run on an existing DB produced identical row counts |
| Frontend tests | `npx vitest run` | **22 passed, 2 failed (24 total)** — see §12.1 |
| Frontend build | `npm run build` | `✓ 85 modules transformed`, `dist/assets/index-mBIjAind.js 384.59 kB` (gzip 105.77 kB), `dist/assets/index-DK8Trf84.css 4.53 kB`, `✓ built in 2.46s` |
| Typecheck | — | **not configured** (the frontend is JavaScript by design; no `tsconfig`, and none should be added) |
| Lint | — | **not configured** (no ESLint config in `frontend/`, no Ruff/mypy config in `backend/`) |

Frontend `package.json` scripts: `dev`, `build`, `preview`, `test` (`vitest run`),
`test:watch`.

---

## 14. Architectural decisions that must not be changed without reason

1. **The frontend stays JavaScript/JSX.** No TypeScript migration. Nothing may be imported
   from `feat/frontend-foundation`.
2. **The design is preserved.** Presentational components receive one flat `v` view-model.
   That indirection is exactly what let the data source be swapped without touching the
   design — keep it.
3. **`utils/A.jsx`** renders a router `<Link>` for internal paths and a plain `<a>` for
   `http(s):` / `tel:` / `mailto:` / `target="_blank"`. Do not replace it with a global
   click interceptor.
4. **The server owns every number.** Prices come from the database, coupons and delivery
   fees are recomputed server-side, and client-supplied totals are ignored. The checkout
   page displays only figures returned by `POST /cart/price`.
5. **`compare_at_price` is never charged.** It is a display-only reference price.
6. **Alembic is the schema of record.** `create_all` is used only to build throwaway test
   databases.
7. **No fabricated data.** The original mock had star ratings and reviews; there is no
   review entity in this MVP, so the rating row is gated behind `p.hasRating` (currently
   always false) and the PDP reviews tab was removed rather than filled with invented
   content. Likewise the contact form opens a real WhatsApp message instead of faking a
   "sent" toast, and the newsletter block became a CTA.
8. **No customer accounts.** Guest checkout only. The former `AuthPage`/`AccountPage` are
   gone and the header "حسابي" button became "تواصل معنا".
9. **Order confirmation is token-scoped.** `Order.public_token` is returned once at
   creation and kept in `sessionStorage`; the order number alone never reveals an order.
   `/track-order` therefore only works on the browser that placed the order.
10. **Images fall back to the design's tone gradients** (`utils/placeholder.js`) so the
    storefront looks finished before any media is uploaded. Media is never stored as
    Base64 or BLOB.
11. **One instance per client.** No multi-tenancy, no `tenant_id`, no shared database.
12. **No card payments.** `cash_on_delivery` and `manual` only; no card fields anywhere.
13. **The generic `uploads/` ignore rule was deliberately removed** from `.gitignore`. A
    parent-level directory ignore makes re-including `backend/data/uploads/.gitkeep`
    impossible. Do not add it back.

---

## 15. Required environment variables (names only)

Backend (`backend/.env`, read by `app/core/config.py`; see `backend/.env.example`):

```
APP_ENV                      APP_NAME                    API_V1_PREFIX
SECRET_KEY                   ACCESS_TOKEN_EXPIRE_MINUTES JWT_ALGORITHM
DATABASE_URL                 CORS_ORIGINS
STORAGE_PROVIDER             LOCAL_MEDIA_ROOT            LOCAL_MEDIA_BASE_URL
MAX_UPLOAD_SIZE_BYTES
R2_ACCOUNT_ID                R2_ACCESS_KEY_ID            R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME               R2_PUBLIC_BASE_URL
INITIAL_ADMIN_EMAIL          INITIAL_ADMIN_PASSWORD      INITIAL_ADMIN_NAME
```

Frontend (`frontend/.env.local`, optional — the dev proxy covers the default case):

```
VITE_API_BASE_URL            VITE_MEDIA_BASE_URL
```

No secret values appear in this document, in `.env.example`, in the seed, or in any
tracked file. `INITIAL_ADMIN_*` default to empty strings, so an unconfigured instance has
no usable admin account at all.

---

## 16. Runtime files that must remain untracked

Present on disk, correctly ignored, and verified not tracked:

```
backend/.venv/                      local virtualenv (Python 3.13; code targets 3.12+)
backend/data/commerce_dev.db        local SQLite development database
backend/data/uploads/*              14 seeded PNG files — only .gitkeep is tracked
backend/coverage.xml, .coverage     coverage output
backend/**/__pycache__/, *.egg-info
frontend/node_modules/
frontend/dist/
.env, .env.* (except .env.example)
```

`git ls-files` matching `node_modules|dist|\.db$|\.env$|venv|coverage|uploads` returns
exactly one path: `backend/data/uploads/.gitkeep` — which is intentional.

---

## 17. Continuation plan (ordered)

1. **Fix the two failing frontend tests** (§12.1). Two one-line selector changes in
   `src/test/storefront.test.jsx:127` and `src/test/admin.test.jsx:168`. Do not change
   application code for these. Then `npx vitest run` must report 24 passed.
2. **Run the local end-to-end smoke flow.** Start uvicorn and `npm run dev`, then walk:
   admin login → create a product → confirm it appears in the storefront → add to cart →
   guest checkout → the order appears in `/admin/orders` → change its status → upload an
   image in `/admin/media` and attach it to a product → confirm the storefront shows it.
   Record what was actually observed. If no browser tooling is available, say so plainly
   instead of claiming visual success.
3. **Write the deployment templates** in `deployment/` — generic, clearly marked as
   inactive examples, using only the placeholders `CLIENT_SLUG`, `CLIENT_DOMAIN`,
   `BACKEND_PORT`, `PROJECT_PATH`:
   - `deployment/systemd/commerce-CLIENT_SLUG.service.example`
   - `deployment/nginx/commerce-CLIENT_SLUG.conf.example` (SPA + `/api` reverse proxy + `/media`)
   - `deployment/env/backend.env.example` (pointer to the root `.env.example`)
   - `deployment/README.md` (deployment checklist + client instance naming)
   No MALIK, no T.A.S, no Hani Yaseen, no real domains, no real paths, no secrets.
4. **Write the documentation** listed in §11 item 2: rewrite the root `README.md` and add
   the `docs/` pages. Do not document unfinished behaviour as complete; carry §10 and the
   limitations list into a "Known limitations" section.
5. **Split the WIP commit into themed checkpoints** if the history matters, or simply add
   commits on top:
   `feat: connect storefront to commerce API`,
   `feat: add commerce admin workspace`,
   `test: cover commerce workflows`,
   `docs: document local full-stack commerce template`.
6. **Run the full verification gate** (see `docs/architecture/fullstack-commerce-mvp-plan.md`):
   clean-database `alembic upgrade head`, seed, `pytest` with coverage, app import,
   `/health`, OpenAPI; `npm ci`, `vitest run`, `vite build`; `git diff --check`, no tracked
   `node_modules`/`dist`/`*.db`/uploads/real `.env`, no `malik` string in tracked content,
   `main` unchanged.
7. **Push**: `git push -u origin feat/fullstack-commerce-mvp`. Do not merge.

---

## 18. Commands to reproduce the current state

```powershell
# 1 — repository state
cd D:\Project\commerce-template
git status --short --branch
git log --oneline -3
git diff --check

# 2 — backend (the venv already exists; recreate only if it is missing)
cd D:\Project\commerce-template\backend
.venv\Scripts\python.exe -m pytest                     # expect: 70 passed
.venv\Scripts\python.exe -m pytest --cov=app           # expect: TOTAL 88 %
.venv\Scripts\python.exe -c "from app.main import app; print(len(app.openapi()['paths']))"

# 3 — migration + seed against a throwaway database (leaves commerce_dev.db alone)
$env:DATABASE_URL="sqlite+pysqlite:///./data/scratch.db"
.venv\Scripts\alembic.exe upgrade head                 # expect: 0001_initial (head)
.venv\Scripts\python.exe -m scripts.seed               # expect: the counts in §9
Remove-Item .\data\scratch.db -Force
Remove-Item Env:\DATABASE_URL

# 4 — frontend
cd D:\Project\commerce-template\frontend
npx vitest run                                         # expect: 22 passed, 2 failed
npm run build                                          # expect: 85 modules, ~384 kB
```

If `backend/.venv` is missing:
```powershell
cd D:\Project\commerce-template\backend
python -m venv .venv
.venv\Scripts\python.exe -m pip install -e ".[dev]"
```

---

## 19. Remaining risks and blockers

- **No browser verification.** Every route renders under jsdom in the Vitest suite and the
  production build succeeds, but nothing has been seen in a real browser. Visual
  regressions in the preserved design are the largest untested risk.
- **The dev environment runs Python 3.13**, while the code targets 3.12+. Nothing has
  failed, but the deployment target should pin a version explicitly.
- **MySQL compatibility is designed for, not tested.** Types were chosen to be portable
  and `PyMySQL` is a declared dependency, but no MySQL connection was made — correctly so,
  it is out of scope for this task.
- **`vite preview` / production serving needs an SPA fallback.** The dev server handles
  deep links; the Nginx template in step 3 must include `try_files ... /index.html`.
- **The seed resets seeded product stock** to its seed values on every run, which will
  undo stock movements from demo orders. Acceptable for development; documented.
- **No rate limiting on `/auth/login`.** Acceptable for a local MVP; worth adding before a
  public deployment.
- **`frontend/package-lock.json` was regenerated**, so the diff is large (6035 lines). It
  is a legitimate lockfile update from adding React Router, Vitest and Testing Library.

---

## 20. Protected-scope confirmations

- **`main`**: untouched. Still at `2c418a4`, still tracking `origin/main`, identical to it.
  Nothing from this work was merged or committed to it.
- **`feat/frontend-foundation`**: untouched. Still at `f2ddd6e`, still tracking
  `origin/feat/frontend-foundation`. It was never checked out, merged, rebased or read
  from during this work. The incomplete TypeScript migration was not reused.
- **`D:\Project\MALIK`**: not accessed. No file in it was read, written, copied from or
  executed. Every command in this session was anchored with an explicit
  `D:\Project\commerce-template` path. (The PowerShell tool prints
  `Shell cwd was reset to D:\Project\MALIK` after some commands — that is the tool
  restoring its default working directory label; no file there was touched.)
- **Production systems**: none accessed. No SSH, no production server, no real MySQL
  server, no Nginx, no systemd, no Redis, no Cloudflare dashboard, no `/opt/projects`,
  no T.A.S, no Hani Yaseen, no Portfolio. The only database used was local SQLite; the
  only network access was `pip install` and `npm install` from the public package
  registries.
- **No client branding** is present in tracked content. The template carries no `MALIK`
  or `malik-store` name.
