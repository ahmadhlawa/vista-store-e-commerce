# Vista Store — deployment package

Built 2026-08-01 23:02 UTC from branch
`feat/vista-store-initial-release`.

## Read this before uploading anything

**This package is not certified deployable.** It contains the right files, correctly
built and free of secrets. Whether they *run* on the client's cPanel account is still
unknown — see `docs/cpanel-capability-checklist.md`. If Setup Python App is missing, or
capped below Python 3.12, or the host forbids a long-lived process, this application does
not run there and no amount of uploading will change that.

## What is inside

```
backend/app/          FastAPI application
backend/alembic/      migrations — the schema of record
backend/scripts/      instance CLI, MySQL portability check
backend/requirements.txt
frontend/dist/        built storefront and admin, ready to serve as static files
instance/             the Vista Store profile (non-secret)
deployment/cpanel/    the example environment file
docs/                 handoff, capability checklist, template origin
```

## What is NOT inside, by design

No `.env`, no secret of any kind, no database, no uploaded media, no `node_modules`, no
virtual environment, no Git history, no tests and no caches.

## Order of operations

1. Answer the capability checklist. **Stop if Python 3.12+ with ASGI is unavailable.**
2. Create the MySQL database and user.
3. Extract this package into the application root — outside the document root if the host
   allows it, so the source and the `.env` are never reachable over HTTP.
4. `pip install -r backend/requirements.txt`
5. Copy `deployment/cpanel/backend.env.example` to the app root as `.env` and fill it in
   **on the server**. Generate a fresh `SECRET_KEY` there.
6. `alembic upgrade head` — **take a backup first; this is the first irreversible step.**
7. `python -m scripts.instance_cli apply --profile instance/vista-store.yaml`
8. `python -m app.initial_data --email <owner> --password <strong>`
9. Publish `frontend/dist/` to the document root.
10. Route `/api`, `/media` and `/health` to the backend process.
11. Enable AutoSSL and force HTTPS.

The store still needs its business data before it can take a real order — no delivery
area, no catalog, no phone number. See the handoff document.
