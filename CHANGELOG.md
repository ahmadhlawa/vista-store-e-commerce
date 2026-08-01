# Changelog

Golden Template releases. The authoritative version lives in the `VERSION` file at the
repository root; nothing else declares it.

Instances record the template version they were initialized from in `instance_metadata`,
and report it through `commerce-instance manifest`.

## 0.2.0 — 2026-08-01

Productization: the template can now create clean, independent store instances from a
validated non-secret profile, instead of relying on hand-editing a copy of the demo store.

### Added

- **`VERSION`** — one authoritative Golden Template version, read at runtime by
  `app.core.template_version`. A test asserts it is not hard-coded anywhere else.
- **Instance profiles** (`instance/`) — validated, non-secret YAML describing one store:
  identity, domain, locale, timezone, currency, contact defaults, theme colours, feature
  flags, home page structure and static page metadata.
  - `instance/client-profile.example.yaml` — annotated template to copy per client
  - `instance/demo-profile.yaml` — the demo store's identity
  - Rejects invalid slugs, unsupported schema versions, malformed colours, unknown feature
    flags, unknown keys and missing required values, with explicit messages.
  - Rejects credential-shaped keys at any depth. Secrets stay in environment variables.
- **`instance_metadata` table** and Alembic revision `0002_instance_metadata` — records
  instance slug, template version at initialization, profile schema version, profile hash,
  enabled features and bootstrap timestamps. Single row; no `tenant_id`, no multi-tenancy.
- **`commerce-instance` CLI** (`python -m scripts.instance_cli`):
  - `validate` — profile structure and semantics; touches no database
  - `plan` — deterministic create / skip / conflict preview; writes nothing
  - `apply` — idempotent client bootstrap; refuses a conflicting instance slug
  - `manifest` — non-secret JSON manifest, to stdout or a file
- **`commerce-mysql-check` CLI** (`python -m scripts.mysql_compat`) — offline MySQL
  portability check that connects to nothing. Covers table and index compilation, money
  columns, JSON columns, index key length under `utf8mb4`, foreign keys, unique
  constraints, enum-like columns and Alembic head availability.
- **Documentation** — `docs/client-lifecycle.md` (create, operate, upgrade, backup and
  restore, plus the future instance-factory design) and
  `docs/architecture/template-productization-design.md`.
- Runtime dependency: `PyYAML`.

### Changed

- **Two clearly separated initialization workflows.** The demo seed (`scripts.seed`) keeps
  its behaviour but is now explicitly labelled development-and-demonstration-only in its
  help text and module docstring. Client bootstrap (`commerce-instance apply`) creates
  store identity and structural defaults only — no products, orders, coupons or admin
  accounts — and never overwrites content edited through Admin.
- Admin creation remains the separate, explicit `python -m app.initial_data`.

### Notes

- No application behaviour, storefront design or Admin UI changed.
- SQLite remains the default local runtime. No MySQL server was contacted.
- The offline MySQL check is a compatibility signal, not proof of production readiness; an
  ephemeral MySQL integration test is still required before a first deployment.

## 0.1.0 — earlier

Full-stack commerce MVP: React/Vite storefront and admin workspace, FastAPI backend with
SQLAlchemy 2 and Alembic, local SQLite, admin authentication and roles, catalog, content,
media, guest checkout, orders, settings and audit logs.
