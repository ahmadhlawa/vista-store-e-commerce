# Known limitations

An honest list of what this template does not do, does only partly, or has not proven.
Read it before promising anything to a client.

## Deliberately out of scope

These are decisions, not gaps. Adding any of them is a change of product, not a bug fix.

- **No customer accounts.** Guest checkout only. There is no registration, no login, no
  order history for shoppers, no saved addresses.
- **No online card payment.** `cash_on_delivery` and `manual` only. There are no card
  fields anywhere in the schema, the API or the UI, and no payment gateway integration.
- **No multi-tenancy.** One instance per client. No `tenant_id`, no shared database, no
  SaaS control plane.
- **No product reviews or ratings.** There is no review entity, so no star ratings are
  displayed. The rating row is gated behind a flag that is currently always false, and the
  product page has no reviews tab. Nothing invents this data.
- **No email sending.** `order_notifications_email` is stored but nothing sends to it. No
  order confirmation email, no password reset email.
- **No shipping-carrier integration**, no live rates, no tracking numbers. Delivery is a
  flat per-area fee.

## Partly implemented

- **`maintenance_mode`** is stored, editable in `/admin/settings` and exposed on the public
  settings payload, but **the storefront does not gate itself on it**. Turning it on
  currently changes nothing a visitor sees.
- **Recently-viewed products** are fetched one slug at a time (`Promise.allSettled` over up
  to six requests). Correct, but a batch endpoint would be better.
- **Home showcase blocks** use fixed gradient backgrounds. Which sections appear is
  admin-controlled; the background is not yet editable.
- **Search** is a normalised `LIKE` over `Product.search_text`. It tolerates spelling and
  diacritic variation and is correct, but it is not a full-text index and will not scale.
- **Cloudflare R2 storage** is an interface boundary only. `save()` and `delete()` raise;
  local disk is the only working provider. See
  [future-r2-integration.md](future-r2-integration.md).

## Not verified

Be precise about these when reporting status.

- **No browser verification has been performed.** Every route renders under jsdom in the
  Vitest suite and the production build succeeds, but no page has been opened in a real
  browser during this work, and no visual or responsive check has been made. Visual
  regressions in the preserved design are the largest untested risk.
- **MySQL is designed for, not tested.** Types and dependencies were chosen to be
  portable, but no MySQL connection has ever been made. Expect the first
  `alembic upgrade head` against MySQL to need attention — index key length on long slug
  columns under `utf8mb4` is the likely first failure. See
  [future-mysql-migration.md](future-mysql-migration.md).
- **The deployment templates have never been installed or run** on any server. They are
  reviewed examples, not proven configuration.
- **Python 3.13 is what the development environment runs**, while the code targets 3.12+.
  Nothing has failed, but the deployment target should pin a version explicitly.

## Operational gaps

- **No rate limiting on `/api/v1/auth/login`.** The application does not implement it and
  the Nginx template does not configure it. Add `limit_req` before a public launch.
- **No password reset flow.** A locked-out administrator needs another super admin, or a
  command-line reset. There is no email-based recovery.
- **No refresh tokens.** An access token simply expires after
  `ACCESS_TOKEN_EXPIRE_MINUTES` and the administrator signs in again.
- **No structured logging or error tracking.** Output goes to the journal. There is no
  request id, no log aggregation, no Sentry-style reporting.
- **No health check beyond `/health`.** It confirms the process is up; it does not check
  the database or storage.
- **No automated backups.** The procedure is documented in
  [backup-and-restore.md](backup-and-restore.md); scheduling it is a deployment task.
- **`vite preview` is not a production server.** Deep links depend on the SPA fallback that
  Nginx provides.

## Behaviours that surprise people

- **`/track-order` only works in the browser that placed the order.** The `public_token`
  lives in `sessionStorage`; the order number alone never reveals an order. This is
  intentional, but customers will ask.
- **The seed resets seeded product stock on every run**, undoing stock movements from demo
  orders. Fine locally; never run it against a live store.
- **Deleting a media asset does not update products referencing its URL.** Those fall back
  to the design's gradient placeholder rather than erroring.
- **Deactivating an administrator invalidates their token immediately**, mid-session,
  because the account is re-read on every request.
- **Rotating `SECRET_KEY` signs every administrator out.** That is the intended mechanism,
  not a fault.
- **Arabic product names produce Arabic slugs.** Browsers percent-encode them
  automatically; command-line clients may need the URL encoded by hand.
- **The contact form opens a real WhatsApp message** rather than showing a fake "sent"
  confirmation, because there is no mail sending. The newsletter block is a call to action,
  not a subscription form.

## Quality tooling not configured

- No ESLint config in `frontend/`, and no Ruff or mypy config in `backend/`.
- No typecheck step — the frontend is JavaScript by design; no `tsconfig` exists and none
  should be added.
- No CI pipeline. Tests are run manually.
