# Local MySQL development runtime

**Status of live verification: BLOCKED, not passed.** Docker is not installed on the
machine this work was done on — `docker --version` and `docker compose version` both
report the command as unavailable, and there is no Docker Desktop installation under
`%ProgramFiles%\Docker` or `%LOCALAPPDATA%\Docker`. The configuration below is complete
and the offline portability gate passes, but **no application code has been run against a
MySQL server from this machine.**

Nothing was installed to work around this, and no existing MySQL server on this machine or
anywhere else was contacted. The only MySQL this project has ever really touched is the
ephemeral service container in CI.

SQLite remains the default development runtime. Docker is not required for it.

---

## What was verified without Docker

| Check | Command | Result |
| --- | --- | --- |
| Schema compiles for MySQL, money/JSON/index/FK/unique portability | `python -m scripts.mysql_compat --verbose` | **8 checks, 0 failures, 0 warnings** — including the new `import_batches` / `import_batch_records` tables and head revision `0004_import_batches` |
| Alembic reaches head on a clean database | `python -m alembic upgrade head` (SQLite) | `0001 → 0002 → 0003 → 0004`, clean |
| Preview seed / idempotency / purge / re-seed | `scripts.preview_cli` on disposable SQLite databases | passed — see `docs/implementation-status.md` |

## What is still unverified, and only Docker can settle

Every numbered step in "The acceptance sequence" below. In particular: real `DECIMAL(12,2)`
scale, real `utf8mb4` Arabic storage, real foreign-key and unique-constraint enforcement,
and invoice sequence numbering under a real transactional engine.

---

## The isolated container

`compose.mysql.dev.yml` at the repository root. MySQL **8.0**, pinned to match
`.github/workflows/mysql-compatibility.yml` — local and CI must exercise the same major
version or a green CI run proves nothing about a local test.

Properties, all deliberate:

* **Bound to `127.0.0.1` only** (`127.0.0.1:3307:3306`). Nothing outside this machine can
  reach it. Do not change this to a bare port mapping.
* **Port 3307 by default**, so it cannot collide with — or be mistaken for — a MySQL
  already installed on the machine. This project must never connect to that one.
* **Credentials from an untracked env file**, `.env.mysql.dev`, which `.gitignore` already
  covers via `.env.*`.
* **Named volume `vista-mysql-dev-data`**, living in Docker's own storage. It is never
  inside the repository, so it cannot reach Git or a release package.
* **Health check** — `mysqladmin ping`, 5s interval, 20 retries, 30s start period.
* **`restart: "no"`** — a development database should not come back after a reboot unasked.
* `utf8mb4` / `utf8mb4_unicode_ci` server-side, matching what CI creates.

**This is not, and must never become, the cPanel production database.** It is disposable.

---

## Bringing it up

```
copy deployment\env\mysql.dev.env.example .env.mysql.dev
```

Edit `.env.mysql.dev` and set values you invent for this machine only. Then:

```
docker compose --env-file .env.mysql.dev -f compose.mysql.dev.yml up -d
docker compose --env-file .env.mysql.dev -f compose.mysql.dev.yml ps
```

Wait for `healthy`. Tear down with `down` (keeps data) or `down -v` (deletes the volume).

### Pointing the backend at it

In `backend/.env`, or as shell environment variables for a single run:

```
DATABASE_URL=mysql+pymysql://vista_dev:<your password>@127.0.0.1:3307/vista_dev?charset=utf8mb4
```

`?charset=utf8mb4` is not optional — without it Arabic text is stored as `latin1`
mojibake, and the damage is silent.

Install the MySQL extra once:

```
cd backend
.venv\Scripts\python.exe -m pip install -e ".[dev,mysql]"
```

The `rsa` extra it pulls in is required because MySQL 8 defaults to
`caching_sha2_password`, which PyMySQL cannot complete without it.

---

## The acceptance sequence

Run in order, from `backend/`, with `DATABASE_URL` pointing at the container. Create the
two extra disposable databases first:

```
docker compose --env-file .env.mysql.dev -f compose.mysql.dev.yml exec mysql \
  mysql -uroot -p -e "
    CREATE DATABASE IF NOT EXISTS vista_dev_lifecycle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    CREATE DATABASE IF NOT EXISTS vista_dev_scratch   CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    GRANT ALL PRIVILEGES ON vista_dev_lifecycle.* TO 'vista_dev'@'%';
    GRANT ALL PRIVILEGES ON vista_dev_scratch.*   TO 'vista_dev'@'%';
    FLUSH PRIVILEGES;"
```

| # | Step | Command | Expected |
| --- | --- | --- | --- |
| 1 | Alembic to head | `python -m alembic upgrade head` then `python -m alembic current` | `0004_import_batches (head)`; 29 application tables |
| 2 | Client bootstrap | `python -m scripts.instance_cli apply --profile ../instance/vista-store.yaml` | 12 creates, no conflict |
| 3 | Preview seed | `python -m scripts.preview_cli seed` | `create=54` |
| 4 | Initial admin | `python -m app.initial_data --email ... --password ...` | one admin created |
| 5 | Database-behaviour test subset | `pytest tests_mysql -v` | all pass, including `test_mysql_preview.py` |
| 6 | Invoice creation and sequential numbering | covered by `tests_mysql/test_mysql_lifecycle.py` | numbers strictly increase, no gaps, no duplicates |
| 7 | Product / category / media metadata persistence | `tests_mysql/test_mysql_data.py` | values survive a round trip |
| 8 | Cash-on-delivery checkout | `tests_mysql/test_mysql_lifecycle.py` | order created, stock decremented |
| 9 | Order confirmation issues an invoice | same | exactly one invoice per order |
| 10 | Preview seed idempotency | `python -m scripts.preview_cli seed` again | `skip=53, update=1` — the single update is the batch's own seed counter |
| 11 | Preview purge, dry run | `python -m scripts.preview_cli purge` | `delete=53`, nothing written |
| 12 | Full purge on a disposable database | `DATABASE_URL=...vista_dev_scratch` then seed and `purge --confirm` | `delete=66` (53 rows + 12 objects + the batch), status reports the batch is gone |
| 13 | Re-seed after purge | `python -m scripts.preview_cli seed` | `create=54`, `seed_count` back to 1 |

### What to check explicitly

| Property | How |
| --- | --- |
| Decimal money precision | `SELECT price FROM products LIMIT 5` — two decimal places, no float drift. `tests_mysql/test_mysql_preview.py` asserts `exponent == -2` |
| JSON / configuration fields | `home_sections.config`, `instance_metadata.enabled_features`, `audit_logs.meta` — round-trip as objects, and none is indexed |
| Unicode Arabic content | `SHOW VARIABLES LIKE 'character_set_%'` is `utf8mb4`; the preview test asserts `لآلئ` and `ﷺ` survive |
| Unique constraints | duplicate `products.slug`, `import_batches.batch_key`, and `(batch_id, entity_type, entity_id)` all raise `IntegrityError` |
| Foreign keys | InnoDB enforces them, unlike SQLite's default. `order_items.product_id` is `SET NULL`; `invoices.order_id` is `RESTRICT` |
| Invoice sequencing | step 6 |
| Alembic revision | `python -m alembic current` reports `0004_import_batches (head)` |
| Preview batch ownership | `vista-preview status` — 53 records, 0 owner-edited, and every `entity_id` resolves |

Record the outcome in `docs/implementation-status.md` with the date and the actual output.
Until then this page's status line stays **BLOCKED**.

---

## Scope guarantees

* Only a container this file creates is ever contacted. No existing MySQL installation, no
  remote server, no production database.
* Nothing is installed automatically. If Docker is absent, the correct action is to stop
  and record it — which is what happened here.
* The named volume never enters the repository, Git, or a release package
  (`scripts/make_release_package.py` copies an explicit file list; this compose file and
  its env template are not in it).
