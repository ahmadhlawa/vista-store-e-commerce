# Task 2: Order and invoice persistence

## Migration

- Revision: `0005_order_invoice_workflow`
- Parent: `0004_import_batches`
- SQLite/MySQL portable types: `String`, `Numeric`, `Boolean`, `DateTime`, and SQLAlchemy `JSON`.
- Existing IDs and rows are retained. Legacy orders receive `source=website`; legacy issued invoices become active, lock their orders, and backfill payment remaining amounts and item snapshots.

## Changed files

- `.superpowers/sdd/2026-08-03-order-invoice-workflow-implementation/task-2-report.md`
- `backend/app/core/enums.py`
- `backend/app/models/__init__.py`
- `backend/app/models/orders.py`
- `backend/app/models/invoices.py`
- `backend/alembic/versions/0005_order_invoice_workflow.py`
- `backend/tests/test_order_invoice_persistence.py`
- `backend/tests/test_invoices.py`

## Tests

- Red: `pytest -q tests/test_order_invoice_persistence.py` -> 4 failures for missing persistence fields/tables.
- Green: `pytest -q tests/test_order_invoice_persistence.py` -> 5 passed.
- Final focused: `pytest -q tests/test_order_invoice_persistence.py tests/test_invoices.py::test_a_replaced_invoice_and_its_active_replacement_can_share_an_order` -> 6 passed.
- Existing regression before updating the obsolete one-invoice database constraint expectation: `pytest -q tests/test_invoices.py tests/test_checkout.py` -> 67 passed, 1 failed. The failing test expected the removed `uq_invoices_order_id`; it now verifies a retained replaced invoice and active replacement.
- `git diff --check` passed.

## Concerns

- No MySQL instance was available; the migration uses only portable constructs and the SQLite prior-revision upgrade test passed.
- Services/routes were intentionally untouched. They still use legacy `pending`/`issued` behavior and must be updated in later tasks to choose one active invoice from history.
- `Order.invoice` remains a compatibility view for existing readers; new workflow code must use `Order.invoices` and explicitly select the active row.
- Downgrade preserves replacement rows. If an order has multiple historical invoices, it intentionally does not recreate the old unique `order_id` constraint, because recreating it would require deleting records.
- The requested corrected map at `docs/superpowers/plans/2026-08-03-order-invoice-workflow-implementation.md` was absent from the assigned worktree; the approved design and implementation-plan documents were used.
