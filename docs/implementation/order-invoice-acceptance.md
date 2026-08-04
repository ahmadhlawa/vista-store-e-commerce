# Order/Invoice Acceptance Evidence

Date: 2026-08-04

## Workflow

- Public `POST /api/v1/orders` requires `client_reference`; retry behavior returns the same persisted order.
- `POST /api/v1/admin/orders/{id}/complete` is the only invoice-issuing path. It completes and locks the order and returns one active invoice; a repeat call keeps that invoice.
- Status changes do not issue invoices. Completed orders cannot be cancelled through the legacy status or invoice-cancel routes; correction uses the super-admin reopen/replacement workflow.
- Invoice payment changes and order activity are retained. Invoice issuer fields are immutable snapshots.

## Migration safety

`tests/test_order_invoice_persistence.py` creates only disposable SQLite databases. It upgrades representative orders and invoices from both `0003_invoices` and `0004_import_batches` to `head`, verifies retained IDs/data and lifecycle backfills, then downgrades only the new chain to `0004_import_batches` and verifies the legacy rows remain. A separate case confirms downgrade refuses replacement-history data instead of deleting invoices.

Original databases were rechecked read-only and were not upgraded:

- `backend/data/vista_preview.db`: `0004_import_batches`
- `backend/data/vista_store_dev.db`: `0003_invoices`

Timestamped, non-zero backups were created before any potential original upgrade:

- `D:\Project\vista-store-e-commerce\backend\data\vista_preview.db.20260804-051436.bak` (413,696 bytes)
- `D:\Project\vista-store-e-commerce\backend\data\vista_store_dev.db.20260804-051436.bak` (331,776 bytes)

## Verification evidence

```text
pytest tests/test_invoices.py tests/test_migrations.py tests/test_order_invoice_persistence.py
60 passed, 1 Starlette/httpx deprecation warning

pytest tests/test_order_invoice_persistence.py
13 passed, 1 Starlette/httpx deprecation warning

pytest
341 passed, 1 Starlette/httpx deprecation warning (276.97s)

npm.cmd test
14 files, 134 tests passed

npm.cmd run build
vite production build passed (122 modules)
```

The frontend test command emits existing React Router future-flag warnings and jsdom canvas-not-implemented stderr, but exits successfully.
