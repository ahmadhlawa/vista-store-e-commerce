# Order and Invoice Current State

The order/invoice workflow is implemented in the backend and frontend.

- Public checkout requires a unique `client_reference`; repeated submissions return the existing order.
- New orders begin as `new`. Admin status updates handle operational states, while `POST /api/v1/admin/orders/{id}/complete` is the only invoice-issuing transition.
- Completion locks the order, stores completion metadata, snapshots the issuer, and creates one active internal invoice. Repeating completion is idempotent.
- Super administrators can reopen a completed order with a reason. The active invoice is retained as `replaced`; a later completion creates its replacement.
- Invoice payment state (`unpaid`, `partial`, `paid`, refund states) and order activities are retained. Activity rows are append-only in application code and SQLite/MySQL migration triggers.
- Database migrations extend the legacy `0003_invoices`/`0004_import_batches` schema through `0009_invoice_issuer_snapshot`. No project database is migrated by tests; tests create SQLite files under pytest temporary directories.

Current verification evidence is recorded in `order-invoice-acceptance.md`.
