# Implementation status — full-stack commerce MVP

**Authoritative handoff document.** Rewritten 2026-08-01 at the end of the continuation
session. Every figure below was produced by a command run in that session against this
repository; none of it is from memory or carried over unverified from the previous
handoff.

> **Superseded in part by the 0.3.0-rc.1 acceptance pass** (branch
> `feat/template-acceptance-rc`, 2026-08-01). That pass created a clean client instance
> from scratch, completed maintenance mode, performed browser acceptance in real Chrome
> and added an ephemeral MySQL 8 CI gate. Current gate-by-gate status is in
> [acceptance/release-candidate-report.md](acceptance/release-candidate-report.md), and
> the route-by-route visual record is in [acceptance/visual-qa.md](acceptance/visual-qa.md).
> §10, §11 and §15 below have been corrected accordingly; the rest describes the MVP
> session that produced the code and is left as written.

---

## 1. Objective

Turn the reusable commerce template into a complete, locally functional full-stack MVP:
the existing React/JSX Arabic-RTL storefront connected to a real FastAPI + SQLAlchemy +
Alembic backend on local SQLite, with admin authentication and roles, a functional admin
workspace, guest checkout, order management, local media uploads, seeded demo data,
automated tests, accurate documentation and inactive deployment templates.

**Product model:** one independent instance per client. No multi-tenancy, no `tenant_id`,
no shared SaaS database, no client branding in the template.

**Current state: the MVP scope is complete and verified.** The remaining items in §10 and
§11 are documented limitations and deliberate exclusions, not unfinished tasks.

---

## 2. Git state (verified at the end of the session)

| Item | Value |
| --- | --- |
| Working branch | `feat/fullstack-commerce-mvp` |
| HEAD | the commit carrying this document — `docs: record verified completion of the commerce MVP`. A commit cannot contain its own hash; resolve it with `git rev-parse --short HEAD` |
| Upstream | `origin/feat/fullstack-commerce-mvp`, pushed |
| Working tree | clean |
| `git diff --check` | clean |
| Tracked files | 163 |

### Commits added by the continuation session

```
1651ce0  test: scope ambiguous storefront and admin queries
46bb057  fix(config): make the documented .env format actually loadable
b0a0049  docs(deployment): add inactive per-client deployment templates
37680ac  docs: document the commerce template
<this>   docs: record verified completion of the commerce MVP
```

They sit on top of `bbaa7f7` (`wip: preserve fullstack commerce implementation state`),
which was **not** amended or rewritten.

### Sibling branches — untouched

```
  feat/backend-foundation      2c418a4
  feat/frontend-foundation     f2ddd6e  [origin/feat/frontend-foundation]
  main                         0c6ff5d  [origin/main]
```

**Important correction to the previous handoff.** The earlier document recorded `main` at
`2c418a4` and this branch as never pushed. Both statements were out of date before the
continuation session began. At session start the actual state was already:

- `main` = `origin/main` = `0c6ff5decdfa0d84b5db5bce95e6cf7c1a60a276` (`..`)
- `origin/feat/fullstack-commerce-mvp` = `bbaa7f7`, already pushed

The continuation session **did not create, modify, merge into or push `main`**. It read
`main`'s hash and nothing more. The newer `main` commit was deliberately **not** merged
into this branch.

---

## 3. Architecture

```
frontend (React 18 + Vite 6, JavaScript/JSX, Arabic RTL)
    │  fetch  /api/v1/...   (Bearer JWT on /api/v1/admin/* and /auth/me)
    ▼
backend (FastAPI — focused modular monolith)
    ├── api/deps.py           session, current admin, super-admin guard, pagination
    ├── api/v1/endpoints/     routing + Pydantic request/response schemas
    ├── services/             pricing, orders, catalog, audit, slugs, store settings
    ├── models/               SQLAlchemy 2.x ORM
    ├── storage/              provider interface; local active, R2 adapter inert
    └── db/                   engine/session; Alembic owns the schema
    ▼
SQLite (local dev + tests)  →  MySQL 8 later via DATABASE_URL, same models
```

Full detail is now in the documentation set, not in this file:
[backend-architecture.md](backend-architecture.md),
[frontend-architecture.md](frontend-architecture.md),
[database-model.md](database-model.md), [api-modules.md](api-modules.md).

---

## 4. Work completed in the continuation session

### 4.1 The two failing frontend tests — fixed (`1651ce0`)

Both were ambiguous Testing Library queries in the **test files**. No application code was
changed.

- `storefront.test.jsx` — `getByText("200 ₪")` was ambiguous because a 2 × 100 ₪ cart
  legitimately renders that string **three** times: the cart line total, the summary
  subtotal, and the summary total (delivery is only priced at checkout). Now scoped: the
  line via its remove control, and the subtotal and total via their labelled rows inside
  the `complementary` landmark.
- `admin.test.jsx` — `getByText("بانتظار المراجعة")` matched both the row status badge and
  an `<option>` in the status filter. Now scoped with
  `within(screen.getByRole("table"))`.

The assertions were **narrowed, not weakened**: each now pins which element carries the
value. Result: **24 passed, 0 failed**.

### 4.2 A real configuration defect — found and fixed (`46bb057`)

Following the documented setup (`copy .env.example .env`) crashed **every** entry point —
Alembic, the seed and the application:

```
SettingsError: error parsing value for field "CORS_ORIGINS" from source "DotEnvSettingsSource"
```

pydantic-settings JSON-decodes complex (list) fields inside the env/dotenv source, before
field validators run, so the existing `mode="before"` splitter never saw the
comma-separated value that `.env.example` documents. The documented setup path was
therefore broken for anyone starting from scratch.

Fixed by annotating the field with `NoDecode` (available in the already-declared
`pydantic-settings>=2.6`) so the raw string reaches the validator, which now also accepts a
JSON list.

The pre-existing test passed `CORS_ORIGINS` as a keyword argument, which bypasses the
dotenv source entirely and so could never have caught this. Four regression tests were
added that load from a real `.env` file, from an environment variable, from a JSON list,
and one asserting the shipped `.env.example` parses unedited.

This was found only because the end-to-end run actually followed the documented setup.

### 4.3 Local end-to-end smoke run — performed, 27/27 checks passed

Run over **real HTTP** against a live Uvicorn instance with a seeded SQLite database, not
through the test client. The full documented flow:

```
[PASS]  1. GET /health returns 200
[PASS]  2. admin login issues a bearer token
[PASS]  3. GET /auth/me returns the signed-in admin
[PASS]  4. admin route rejects an unauthenticated caller (401)
[PASS]  5. public categories are listed
[PASS]  6. admin creates a product (HTTP 201)
[PASS]  7. the new product is visible on the storefront
[PASS]  8. the new product is findable by search
[PASS]  9. public delivery areas are listed
[PASS] 10. server prices the cart from its own data (subtotal 300, delivery 20, total 320)
[PASS] 11. compare_at_price is not charged (unit 150, compare_at 200)
[PASS] 12. guest checkout creates an order (ORD-260801-5398)
[PASS] 13. order total matches the server-priced total
[PASS] 14. order lookup without a token is refused
[PASS] 15. order lookup with the token succeeds
[PASS] 16. stock decremented by the ordered quantity (10 -> 8)
[PASS] 17. the order appears in /admin/orders
[PASS] 18. admin changes the order status (pending -> confirmed)
[PASS] 19. the status change is recorded in history with the acting admin
[PASS] 20. admin uploads an image to local media storage
[PASS] 21. the uploaded image is served over HTTP
[PASS] 22. the image is attached to the product
[PASS] 23. the storefront serves the product with its image
[PASS] 24. a real coupon validates server-side
[PASS] 25. an invalid coupon is rejected (HTTP 400)
[PASS] 26. admin actions are written to the audit log
[PASS] 27. public store settings exclude private fields
```

The script was a throwaway operator script in a scratch directory; it is **not** committed
and is not part of the test suite.

**Frontend ↔ backend wiring** was verified separately through the real Vite dev server and
its shipped proxy configuration:

| Path | Result |
| --- | --- |
| `/` and deep links `/product/:slug`, `/cart`, `/admin/orders`, `/track-order` | 200, SPA entry served |
| `/health` | 200 |
| `/api/v1/store/settings`, `/products`, `/categories` | 200 |
| `/media/seed-hero-teal.png` | 200, `image/png`, 20003 bytes |
| `/api/v1/admin/dashboard` without / with a token | 401 / 200 |

**No browser verification was performed** — no browser tooling was available in the
session. Nothing has been visually inspected. See §11.

### 4.4 Deployment templates — written (`b0a0049`)

`deployment/` previously held only a `.gitkeep`.

```
deployment/README.md                                     placeholders, naming, checklist
deployment/systemd/commerce-CLIENT_SLUG.service.example
deployment/nginx/commerce-CLIENT_SLUG.conf.example
deployment/env/backend.env.example
```

Only the four approved placeholders appear — `CLIENT_SLUG`, `CLIENT_DOMAIN`,
`BACKEND_PORT`, `PROJECT_PATH` — verified by grep. No real domain, path, client name or
secret. Every file states that it is an example that has never been installed or run on a
server. Nothing was deployed or activated.

### 4.5 Documentation — written (`37680ac`)

The root `README.md` was rewritten and thirteen `docs/` pages added, listed in §9. Facts
were taken from the running system — the live OpenAPI schema, `Base.metadata`, the route
tables — rather than from the previous handoff. That is how the table count was corrected
from 21 to **23**.

---

## 5. Verification results (all fresh, end of session)

| Check | Command | Result |
| --- | --- | --- |
| Dependency install | `pip install -e ".[dev]"` | succeeded |
| Backend tests | `python -m pytest` | **74 passed**, 1 warning, 63.35 s |
| Backend coverage | `python -m pytest --cov=app --cov-report=xml` | **TOTAL 88 %** (2867 statements, 351 missed); `coverage.xml` written |
| Alembic, clean database | `alembic upgrade head` on a new `verify_clean.db` | `-> 0001_initial`, then `0001_initial (head)`; 23 app tables + `alembic_version` |
| Seed idempotency | `scripts.seed` run repeatedly on the clean database | **identical row counts across all 24 tables**, compared programmatically, not by eye |
| App import + health | `TestClient(app).get("/health")` | `200 {'status': 'ok', 'app': 'Commerce Template', 'environment': 'development'}` |
| OpenAPI generation | `app.openapi()` | **62 paths**, 98 component schemas |
| Frontend install | `npm ci` | succeeded |
| Frontend tests | `npx vitest run` | **24 passed, 0 failed** (2 files) |
| Frontend build | `npm run build` | `✓ 85 modules transformed`, `index-mBIjAind.js 384.59 kB` (gzip 105.77 kB), `index-DK8Trf84.css 4.53 kB`, built in 4.65 s |
| Frontend dependencies | `npm ls --depth=0` | clean, 10 direct dependencies |
| Whitespace | `git diff --check` | clean |
| Tracked-file hygiene | `git ls-files` filtered | no `node_modules`, `dist`, `*.db`, real `.env`, venv, coverage or egg-info; the only `uploads` path is the intentional `.gitkeep` |
| Typecheck | — | **not configured** (JavaScript by design; no `tsconfig`, and none should be added) |
| Lint | — | **not configured** (no ESLint in `frontend/`, no Ruff/mypy in `backend/`) |

Seed output on a clean database:

```
artwork: 13 placeholder images   categories: 15        products: 31
variants: 9                      package contents: 8   hero slides: 3
banners: 3                       home sections: 8      coupons: 2
delivery areas: 5                articles: 4           static pages: 6
demo order: ORD-260801-3354      admin: skipped (no credentials supplied)
```

---

## 6. Backend surface

**62 paths**, `/health` outside the `/api/v1` prefix: 23 public, 2 auth, 37 admin. The full
list is in [api-modules.md](api-modules.md).

Uniform error shape `{"error": {"code": "...", "message": "...", ...}}`, produced by three
exception handlers in `app/main.py`.

---

## 7. Database

**23 application tables**, all created by the single revision `0001_initial`. The previous
handoff said 21; the correct count was confirmed from `Base.metadata` and from a freshly
migrated database.

```
admin_users        articles          audit_logs        banners
categories         coupons           delivery_areas    hero_slides
home_sections      media_assets      order_items       order_status_history
orders             package_items     product_images    product_option_values
product_options    product_specifications              product_variant_option_values
product_variants   products          static_pages      store_settings
```

`tests/test_migrations.py` asserts the migrated schema and `Base.metadata` match, so a
drifting model is a test failure. Details in [database-model.md](database-model.md).

---

## 8. Feature status

| Area | Status |
| --- | --- |
| Authentication | complete — Argon2 + PyJWT HS256; deactivating an admin invalidates its token on the next request |
| Roles | complete — `super_admin` / `admin`, with self-protection rules enforced in the service layer |
| Media storage | complete (local) — magic-byte validation, size limit, random stored names; R2 is an inert boundary |
| Orders | complete — guest checkout, `ORD-YYMMDD-NNNN`, immutable item snapshots, status history, token-scoped lookup |
| Inventory | complete — decremented once at creation, restored once on cancellation |
| Coupons | complete — percentage/fixed, min order, cap, usage limit, date window |
| Delivery | complete — per-area fee, minimum, free-delivery threshold |
| Content | complete — hero slides, banners, home sections, articles, static pages |
| Settings | complete — single row, private fields excluded from the public projection |
| Pricing | complete — server-authoritative; no endpoint accepts a client-supplied price |
| Audit log | complete — credentials and tokens stripped |
| Storefront | complete — every commercial value comes from the API |
| Admin workspace | complete — all screens listed in [admin-capabilities.md](admin-capabilities.md) |
| Deployment templates | complete as **inactive examples**, never installed |
| Documentation | complete |

---

## 9. Documentation set

```
README.md                        rewritten
docs/local-setup.md              docs/backend-architecture.md
docs/frontend-architecture.md    docs/database-model.md
docs/api-modules.md              docs/admin-capabilities.md
docs/sqlite-workflow.md          docs/future-mysql-migration.md
docs/future-r2-integration.md    docs/deployment-templates.md
docs/new-client-checklist.md     docs/backup-and-restore.md
docs/known-limitations.md
```

---

## 10. Partially implemented (documented, not defects)

1. **Recently-viewed products** — fetched one slug at a time; a batch endpoint would be
   better.
2. **Home showcase backgrounds** — fixed gradients, not admin-editable.
3. **Search** — normalised `LIKE` over `Product.search_text`; correct, but not a full-text
   index.
4. **R2 storage** — interface boundary only; `save()` and `delete()` raise.

`maintenance_mode` was the fifth entry here. It is complete as of 0.3.0-rc.1 — backend
gate, Arabic RTL storefront screen, and tests at both layers.

---

## 11. Not done, and deliberately so

1. **Browser verification beyond Chrome** — the 0.3.0-rc.1 pass opened every public and
   admin route in real Chrome 151 at 390 / 768 / 1440 px and fixed two mobile layout
   defects ([acceptance/visual-qa.md](acceptance/visual-qa.md)). Firefox, WebKit, physical
   devices and a visual-regression baseline are still missing.
2. **MySQL in production** — proven in CI against an ephemeral MySQL 8 service on every
   relevant push, never on a real server. See
   [future-mysql-migration.md](future-mysql-migration.md).
3. **Deployment** — templates written; nothing installed, activated or executed anywhere.
4. **React Router advisory** — `react-router-dom` 6.30.4 carries an open-redirect/XSS
   advisory with **no fix inside v6**; the only remedy is a breaking v7 upgrade. Not taken,
   deliberately. Current exposure assessed as low. Reasoning in
   [known-limitations.md](known-limitations.md).
5. **Product scope exclusions** — no customer accounts, no card payments, no
   multi-tenancy, no reviews, no email sending.

---

## 12. Architectural decisions that must not change without a stated reason

1. **The frontend stays JavaScript/JSX.** No TypeScript. Nothing may be imported from
   `feat/frontend-foundation`.
2. **The design is preserved.** Presentational components receive one flat `v` view-model.
3. **`utils/A.jsx`** renders a router `<Link>` for internal paths and a plain `<a>` for
   external schemes. Not a global click interceptor.
4. **The server owns every number.** Client-supplied totals are ignored.
5. **`compare_at_price` is never charged.**
6. **Alembic is the schema of record.** `create_all` builds only throwaway test databases.
7. **No fabricated data.** No invented ratings or reviews; the contact form opens a real
   WhatsApp message.
8. **No customer accounts.** Guest checkout only.
9. **Order confirmation is token-scoped** via `Order.public_token` in `sessionStorage`.
10. **Images fall back to the design's tone gradients.** Media is never Base64 or BLOB.
11. **One instance per client.** No multi-tenancy.
12. **No card payments.**
13. **The generic `uploads/` ignore rule stays removed** from `.gitignore` — a
    parent-level directory ignore would make `backend/data/uploads/.gitkeep` untrackable.

---

## 13. Runtime files that must remain untracked

Present on disk, correctly ignored, verified not tracked:

```
backend/.venv/                      backend/data/commerce_dev.db
backend/data/uploads/*              (only .gitkeep is tracked)
backend/coverage.xml, .coverage     backend/**/__pycache__/, *.egg-info
frontend/node_modules/              frontend/dist/
.env, .env.*  (except .env.example)
```

`backend/.env` exists locally and is correctly ignored — confirmed with
`git check-ignore -v`.

---

## 14. Protected-scope confirmations

- **`main`**: not modified. It was **already** at `0c6ff5d` when the continuation session
  began — the previous handoff's record of `2c418a4` was stale. The session read its hash
  and nothing else. Nothing was committed, merged or pushed to it, and the newer `main`
  commit was deliberately not merged into this branch.
- **`feat/frontend-foundation`**: not modified. Still at `f2ddd6e`. Never checked out,
  merged, rebased or read from. The abandoned TypeScript migration was not reused.
- **`bbaa7f7`**: not amended, rebased or force-pushed. All new work sits on top of it.
- **`D:\Project\MALIK`**: not accessed. No file in it was read, written, copied from or
  executed. Every command was anchored to `D:\Project\commerce-template`.
- **Production systems**: none accessed. No SSH, no production server, no real MySQL, no
  Nginx, no systemd, no Redis, no Cloudflare. The only database used was local SQLite; the
  only network access was `pip install`, `npm ci`/`npm audit` from the public registries,
  and HTTP to `127.0.0.1` / `localhost`.
- **No client branding** in tracked content. The only `MALIK` occurrences are the
  scope-prohibition sentences in this file and in `continuation-prompt.md` — guardrails,
  not branding.

---

## 15. If work continues

Items 1, 3 and 5 of the previous list — browser verification, gating on
`maintenance_mode`, and exercising MySQL — were done in the 0.3.0-rc.1 acceptance pass.
What remains, in order of value:

1. **Add rate limiting to `/api/v1/auth/login`** before any public deployment. Nothing in
   the application or the Nginx template does this today.
2. **Decide on the React Router v7 upgrade** — see §11 item 4.
3. **Add ESLint and Ruff**, then extend CI to run both suites and both linters, not just
   the MySQL gate.
4. **Widen browser coverage** past Chrome, and keep a visual-regression baseline so a
   future change cannot break the design silently.
5. **Take a first client instance to a real server** and work through the operational half
   of [future-mysql-migration.md](future-mysql-migration.md) — charset, users, privileges,
   backups, pooling.

Reproduction commands for the current state are in
[local-setup.md](local-setup.md) and [sqlite-workflow.md](sqlite-workflow.md).
