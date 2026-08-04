# Order/Invoice Acceptance Evidence

Date: 2026-08-04

Status: backend/frontend automated acceptance complete; real-browser acceptance is not run in this environment.

## Workflow

- Public `POST /api/v1/orders` requires `client_reference`; retry behavior returns the same persisted order.
- `POST /api/v1/admin/orders/{id}/complete` is the only invoice-issuing path. It completes and locks the order and returns one active invoice; a repeat call keeps that invoice.
- Status changes do not issue invoices. Completed orders cannot be cancelled through the legacy status or invoice-cancel routes; correction uses the super-admin reopen/replacement workflow.
- Invoice payment changes and order activity are retained. Invoice issuer fields are immutable snapshots.

## API and permissions

Endpoints: `POST /api/v1/orders`; `GET/PATCH /api/v1/admin/orders/{id}`; `POST /api/v1/admin/orders/manual`; `POST /api/v1/admin/orders/{id}/complete`; `POST /api/v1/admin/orders/{id}/reopen`; invoice list/detail endpoints; `PATCH /api/v1/admin/invoices/{number}/payment`; `POST /api/v1/admin/invoices/{number}/refund`.

Normal admins may edit incomplete website orders, complete them, and increase payments. Super admins additionally create/edit manual orders, reopen completed orders, and correct/refund payments with a reason. Completed/cancelled orders are locked.

## Migration safety

`tests/test_order_invoice_persistence.py` creates only disposable SQLite databases. It upgrades representative orders and invoices from both `0003_invoices` and `0004_import_batches` to `head`, verifies retained IDs/data and lifecycle backfills, then downgrades only the new chain to `0004_import_batches` and verifies the legacy rows remain. A separate case confirms downgrade refuses replacement-history data instead of deleting invoices.

No original database was upgraded. The worktree has no `backend/data` database or backup files to inspect; the historical paths below are retained as prior evidence only:

- `backend/data/vista_preview.db`: `0004_import_batches`
- `backend/data/vista_store_dev.db`: `0003_invoices`

Timestamped, non-zero backups were created before any potential original upgrade:

- `D:\Project\vista-store-e-commerce\backend\data\vista_preview.db.20260804-051436.bak` (413,696 bytes)
- `D:\Project\vista-store-e-commerce\backend\data\vista_store_dev.db.20260804-051436.bak` (331,776 bytes)

Final head: `0009_invoice_issuer_snapshot`.

Disposable `0003_invoices` and `0004_import_batches` upgrades preserve representative IDs, relationships, line/invoice totals, source/payment snapshots, and invoice rows. Legacy `manual` payment methods normalize to `bank_transfer`. SQLite downgrade to `0004_import_batches` retains records; replacement history refuses downgrade before destructive DDL. MySQL-order unit checks cover the same pre-DDL guard.

## Verification evidence

```text
pytest tests/test_checkout.py tests/test_admin_order_edit.py tests/test_invoices.py tests/test_order_invoice_remediation.py tests/test_order_invoice_domain.py tests/test_order_invoice_persistence.py tests/test_migrations.py
155 passed, 4 xfailed, 1 Starlette/httpx deprecation warning (75.2s)

pytest
367 passed, 0 failed, 4 xfailed, 1 Starlette/httpx deprecation warning (duration was not emitted by this runner)

npm.cmd test
14 files, 134 tests passed

npm.cmd run build
vite production build passed (122 modules)
```

The frontend test command emits existing React Router future-flag warnings and jsdom canvas-not-implemented stderr, but exits successfully.

The four xfails are limited to absent revision-token/ETag stale-write contracts; they do not cover authorization, active-invoice uniqueness, completion idempotency, or rollback. Those rules have non-xfail tests.

Catalog price isolation and manual-item stock/catalog isolation are covered by `test_admin_order_edit.py`; final invoice lines use only persisted order snapshots. Completion/reopen/recompletion tests prove exactly one active invoice per completed order and linked archive history.

## Browser acceptance limitation

No browser automation tool is available in this session, so desktop/mobile routes, keyboard/RTL behavior, and the 22 requested real-browser scenarios were not executed. Component tests are not substituted for browser acceptance. No screenshots were captured.

## Commits and changed files

Commits: `a8dbdfc fix(invoices): preserve payment and issuer snapshots`; `ebf0b75 feat(orders): support typed manager edits for manual orders`; `e6bf762 fix(migrations): harden invoice workflow downgrade safety`.

Changed files are recorded by those commits plus this documentation update; no database, backup, environment, secret, credential, generated-media, or recovery file is staged.
