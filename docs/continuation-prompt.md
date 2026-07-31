# Continuation prompt for the next session

Paste everything between the markers into a fresh Claude Opus 5 / Claude Code session
opened on `D:\Project\commerce-template`.

---8<--- COPY FROM HERE ---8<---

You are continuing an in-progress project. **Do not restart it and do not redo completed
work.**

## First, read the handoff

Read `docs/implementation-status.md` in full before doing anything else. It is the
authoritative record of what exists, what was verified, what fails, and what is left. It
was written after inspecting the repository and running every verification command, so
trust it over any assumption — but still verify the repository yourself before editing.

Then inspect the real state before you change anything:

```powershell
cd D:\Project\commerce-template
git status --short --branch
git log --oneline -5
git diff --check
```

Read the actual files you are about to touch. Do not rely on the handoff alone for file
contents.

## Where you are

- Repository: `D:\Project\commerce-template`
- Branch: `feat/fullstack-commerce-mvp` — **stay on it**
- The backend is complete and verified: 70 pytest tests pass, 88 % coverage, Alembic
  revision `0001_initial` builds the whole schema, the seed is idempotent, `/health`
  returns 200, OpenAPI generates 62 paths.
- The frontend rewrite is complete and builds (`✓ 85 modules transformed`), and 22 of its
  24 Vitest tests pass.
- Everything is preserved in a WIP commit. Nothing is pushed; the branch has no upstream.

## Your objective

Finish the remaining MVP scope, in this order. Section numbers refer to
`docs/implementation-status.md`.

1. **Fix the two failing frontend tests** (§12.1). Both are ambiguous Testing Library
   queries in the *test files* — `src/test/storefront.test.jsx:127` and
   `src/test/admin.test.jsx:168`. Two one-line changes. Do not modify application code to
   satisfy them. `npx vitest run` must then report 24 passed.
2. **Run the local end-to-end smoke flow** and record what you actually observe: admin
   login → create a product → see it in the storefront → add to cart → guest checkout →
   the order appears in `/admin/orders` → change its status → upload an image in
   `/admin/media` and attach it to a product. If browser tooling is unavailable, say so
   plainly rather than claiming visual success.
3. **Write the deployment templates** in `deployment/` (§17 step 3) — generic, clearly
   marked as unactivated examples, using only the placeholders `CLIENT_SLUG`,
   `CLIENT_DOMAIN`, `BACKEND_PORT`, `PROJECT_PATH`. Do not deploy or activate anything.
4. **Write the documentation** (§11 item 2): rewrite the root `README.md` and add the
   `docs/` pages for local setup, backend architecture, frontend architecture, the
   database model, the API modules, the admin capability list, the SQLite workflow, the
   future MySQL migration, the future R2 integration, deployment template usage, the
   new-client cloning checklist, backup/restore, and known limitations.
5. **Commit** in clear checkpoints and **run the full verification gate** (§17 step 6)
   before claiming anything is done.
6. **Push**: `git push -u origin feat/fullstack-commerce-mvp`. **Do not merge.**

## Constraints you must respect

- **Preserve the approved architecture.** §14 of the handoff lists the decisions that must
  not change without a stated reason — in particular: the frontend stays JavaScript/JSX,
  the original design and its flat `v` view-model stay intact, the server owns every
  price and total, Alembic is the schema of record, and nothing fabricates data the
  system does not actually have.
- **Do not restart or rewrite completed work.** The backend, the storefront rewrite and
  the admin workspace are done. Change them only to fix a defect you have actually
  reproduced.
- **Do not reset, revert, discard, clean, stash, force-push or amend published commits.**
- **Do not touch `main`.** Do not merge into it.
- **Do not touch, read from, or continue `feat/frontend-foundation`.** Its incomplete
  TypeScript migration must not be reused.
- **Do not read, write, copy from, or run anything inside `D:\Project\MALIK`.** Anchor
  every command with an explicit `D:\Project\commerce-template` path.
- **Do not access any production system**: no SSH, no production servers, no real MySQL,
  no Nginx, no systemd, no Redis, no Cloudflare, no `/opt/projects`, no T.A.S, no
  Hani Yaseen, no Portfolio. Local SQLite only.
- **Never commit a real `.env`, a SQLite database, uploaded media, `node_modules`, `dist`,
  or any secret.** Do not re-add a generic `uploads/` rule to `.gitignore` — it would make
  `backend/data/uploads/.gitkeep` impossible to track (see §14 item 13).
- **No multi-tenancy**, no `tenant_id`, no shared SaaS database. One instance per client.

## Verification before you claim completion

Run these and report the real output. Do not describe unfinished work as complete, and do
not claim a visual result you have not inspected.

```powershell
cd D:\Project\commerce-template\backend
.venv\Scripts\python.exe -m pytest --cov=app
$env:DATABASE_URL="sqlite+pysqlite:///./data/scratch.db"
.venv\Scripts\alembic.exe upgrade head
.venv\Scripts\python.exe -m scripts.seed
Remove-Item .\data\scratch.db -Force; Remove-Item Env:\DATABASE_URL

cd D:\Project\commerce-template\frontend
npm ci
npx vitest run
npm run build

cd D:\Project\commerce-template
git status --short --branch
git diff --check
```

Start with task 1.

---8<--- COPY TO HERE ---8<---
