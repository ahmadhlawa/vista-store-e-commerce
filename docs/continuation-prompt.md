# Continuation prompt for the next session

The MVP scope described in `docs/implementation-status.md` is **complete and verified**.
There is no unfinished task queued. Use this prompt only if new work is being started.

Paste everything between the markers into a fresh Claude Code session opened on
`D:\Project\commerce-template`.

---8<--- COPY FROM HERE ---8<---

You are continuing an existing, completed project. **Do not restart it, do not redesign the
architecture, and do not redo completed work.**

## First, read the handoff

Read `docs/implementation-status.md` in full before doing anything else. It records what
exists, what was verified and with which command, and what was deliberately left out. It
was written after running every verification command — but still verify the repository
yourself, and **trust fresh command output over the document** if they ever disagree.

Then inspect the real state:

```powershell
cd D:\Project\commerce-template
git status --short --branch
git log --oneline --decorate -6
git diff --check
```

Read the actual files you are about to touch. Do not rely on the handoff for file contents.

## Where you are

- Repository: `D:\Project\commerce-template`
- Branch: `feat/fullstack-commerce-mvp` — **stay on it**, it is pushed and up to date
- The backend, the storefront, the admin workspace, the deployment templates and the
  documentation are all complete and verified.
- Verified at the end of the last session: backend **74 pytest tests pass at 88 % coverage**;
  frontend **24 Vitest tests pass**; `npm run build` succeeds; Alembic builds a clean
  database to `0001_initial (head)`; the seed is idempotent (identical row counts across
  all 24 tables); `/health` returns 200; OpenAPI generates **62 paths**; a 27-check
  end-to-end run over real HTTP passed completely.

## There is no queued task

Do not invent one. If the user has not asked for something specific, ask them what they
want before changing anything.

The candidates listed in §15 of the handoff, in order of value:

> Browser verification, `maintenance_mode` and the MySQL path were items 1, 3 and 5 of
> this list. All three were completed in the 0.3.0-rc.1 acceptance pass — see
> `docs/acceptance/release-candidate-report.md`. What is left:

1. **Decide on the React Router v7 upgrade.** `react-router-dom` 6.30.4 carries an
   open-redirect/XSS advisory with **no fix inside v6**. `npm audit fix --force` installs
   the breaking v7. It was deliberately not taken; current exposure is assessed as low in
   `docs/known-limitations.md`. Treat it as its own planned piece of work with real
   regression testing — not as a drive-by audit fix.
2. **Rate limiting on `/api/v1/auth/login`** before any public deployment.
3. **Add ESLint and Ruff**, then extend CI to run both suites and both linters.
4. **Widen browser coverage past Chrome**, and keep a visual-regression baseline.

## Constraints you must respect

- **Preserve the approved architecture.** §12 of the handoff lists the decisions that must
  not change without a stated reason: the frontend stays JavaScript/JSX, the flat `v`
  view-model stays, the server owns every price and total, Alembic is the schema of record,
  and nothing fabricates data the system does not have.
- **Do not reset, revert, discard, clean, stash, force-push or amend published commits.**
- **Do not touch `main`.** It is at `0c6ff5d` and is ahead of this branch on an unrelated
  line; do **not** merge it in, and do not merge this branch into it.
- **Do not touch, read from, or continue `feat/frontend-foundation`.** Its incomplete
  TypeScript migration must not be reused.
- **Do not read, write, copy from, or run anything inside `D:\Project\MALIK`.** Anchor every
  command with an explicit `D:\Project\commerce-template` path.
- **Do not access any production system**: no SSH, no production servers, no real MySQL, no
  Nginx, no systemd, no Redis, no Cloudflare, no deployment environment. Local SQLite only.
- **Never commit** a real `.env`, a SQLite database, uploaded media, `node_modules`, `dist`,
  or any secret. Do not re-add a generic `uploads/` rule to `.gitignore` — it would make
  `backend/data/uploads/.gitkeep` untrackable (handoff §12 item 13).
- **No multi-tenancy**, no `tenant_id`, no shared database. One instance per client.
- **Do not widen the project** into SaaS, online card payments, customer accounts, real
  MySQL connectivity, real R2 connectivity or production deployment.

## Local setup

`backend/.venv` and `backend/.env` already exist on the development machine. If either is
missing, follow `docs/local-setup.md` — do not improvise.

```powershell
cd D:\Project\commerce-template\backend
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000

cd D:\Project\commerce-template\frontend
npm run dev
```

## Verification before you claim anything

Run these and report the real output. Never describe unfinished work as complete, and never
claim a visual result you have not actually looked at.

```powershell
cd D:\Project\commerce-template\backend
.venv\Scripts\python.exe -m pytest --cov=app          # expect 74 passed, 88 %

cd D:\Project\commerce-template\frontend
npx vitest run                                        # expect 24 passed
npm run build

cd D:\Project\commerce-template
git status --short --branch
git diff --check
```

---8<--- COPY TO HERE ---8<---
