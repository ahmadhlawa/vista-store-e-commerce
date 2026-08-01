# Commerce template

A reusable full-stack commerce application: an Arabic, right-to-left React storefront and
an admin workspace, backed by a FastAPI service with SQLAlchemy, Alembic and — for local
development — SQLite.

It is a **template**, deployed as one independent instance per client. There is no
multi-tenancy, no `tenant_id`, and no shared database. The repository carries no client
name or branding; the store's identity is data, editable in the admin area.

## What it does

**Storefront** — home page with admin-controlled sections, category and product browsing,
filters and search, product detail with variants, specifications and package contents, a
cart, guest checkout with coupons and per-area delivery fees, order confirmation and
order tracking, a blog, and static content pages.

**Admin workspace** — products (including images, specifications, options, variants and
package contents), categories, orders with status workflow and internal notes, coupons,
delivery areas, hero slides, banners, home sections, articles, static pages, a media
library, store settings, and — for super admins only — admin accounts and an audit log.

**Deliberately not included:** customer accounts, online card payments, multi-tenancy,
product reviews. See [docs/known-limitations.md](docs/known-limitations.md).

## Stack

| Layer | Choice |
| --- | --- |
| Frontend | React 18, Vite 6, React Router — **JavaScript/JSX, no TypeScript** |
| Backend | FastAPI, Pydantic v2, SQLAlchemy 2.x, Alembic |
| Database | SQLite for local development and tests; MySQL 8 is the intended server target |
| Auth | Admin-only JWT (HS256), Argon2 password hashing |
| Media | Pluggable storage provider; local disk is active, Cloudflare R2 is a stub |
| Tests | pytest + coverage (backend), Vitest + Testing Library (frontend) |

## Quick start

Requires Python 3.12+ and Node 18+.

```powershell
# Backend
cd backend
python -m venv .venv
.venv\Scripts\python.exe -m pip install -e ".[dev]"
copy .env.example .env          # then set SECRET_KEY; never commit this file
.venv\Scripts\alembic.exe upgrade head
.venv\Scripts\python.exe -m scripts.seed
.venv\Scripts\python.exe -m app.initial_data --email you@example.com --password '<choose one>'
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000

# Frontend, in a second terminal
cd frontend
npm install
npm run dev                     # proxies /api, /media and /health to 127.0.0.1:8000
```

The storefront is then on <http://localhost:5173> and the admin area on
<http://localhost:5173/admin/login>.

Full walkthrough, including troubleshooting: [docs/local-setup.md](docs/local-setup.md).

## Layout

```
backend/      FastAPI application, Alembic migrations, seed script, tests
  app/        api/ core/ db/ models/ schemas/ services/ storage/
  alembic/    schema of record — one revision, 0001_initial
  scripts/    seed.py (idempotent demo data)
  tests/      pytest suite
frontend/     React storefront and admin workspace
  src/        api/ app/ components/ hooks/ layouts/ pages/ admin/
              services/ storage/ utils/ test/
deployment/   inactive systemd / Nginx / env templates, one instance per client
docs/         the documentation set below
```

## Tests

```powershell
cd backend  ; .venv\Scripts\python.exe -m pytest --cov=app
cd frontend ; npx vitest run
```

Current state: backend **74 passed, 88 % coverage**; frontend **24 passed**.

## Documentation

| Document | Contents |
| --- | --- |
| [local-setup.md](docs/local-setup.md) | Prerequisites, first run, daily workflow, troubleshooting |
| [backend-architecture.md](docs/backend-architecture.md) | Layers, request flow, error shape, auth, pricing rules |
| [frontend-architecture.md](docs/frontend-architecture.md) | Routing, the `v` view-model, state, API access, admin shell |
| [database-model.md](docs/database-model.md) | All 23 tables, relationships, conventions, constraints |
| [api-modules.md](docs/api-modules.md) | Every one of the 62 endpoints, grouped by module |
| [admin-capabilities.md](docs/admin-capabilities.md) | What an administrator can actually do, screen by screen |
| [sqlite-workflow.md](docs/sqlite-workflow.md) | Migrations, seeding, resetting, inspecting the local database |
| [future-mysql-migration.md](docs/future-mysql-migration.md) | What is already portable and what to check when moving |
| [future-r2-integration.md](docs/future-r2-integration.md) | The storage boundary and what implementing R2 requires |
| [deployment-templates.md](docs/deployment-templates.md) | How to use the files in `deployment/` |
| [new-client-checklist.md](docs/new-client-checklist.md) | Cloning the template for a new client |
| [backup-and-restore.md](docs/backup-and-restore.md) | What to back up, how, and how to verify a restore |
| [known-limitations.md](docs/known-limitations.md) | Honest list of what is missing, partial or untested |

Design and planning notes for the build itself live in `docs/architecture/`, and the
current build state in [implementation-status.md](docs/implementation-status.md).

## Conventions worth knowing before changing anything

- **The server owns every number.** Prices, discounts and delivery fees are recomputed
  server-side from the database; client-supplied totals are ignored. `compare_at_price` is
  a display-only reference and is never charged.
- **Alembic is the schema of record.** `create_all` is used only to build throwaway test
  databases.
- **The frontend stays JavaScript/JSX.** An earlier TypeScript migration was abandoned;
  do not reintroduce it.
- **Presentational components receive one flat `v` view-model.** That indirection is what
  let the data source change without touching the design — keep it.
- **Nothing fabricates data.** There is no review entity, so no star ratings are shown;
  the contact form opens a real WhatsApp message rather than faking a success toast.
- **Never commit** a real `.env`, a database file, uploaded media, `node_modules`, `dist`,
  or any secret.
