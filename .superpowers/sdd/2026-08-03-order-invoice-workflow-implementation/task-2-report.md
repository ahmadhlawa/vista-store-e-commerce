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

## Round 1 fixes

- Added `reviewing`, `preparing`, and `out_for_delivery` lifecycle values. The migration now maps legacy `confirmed`/`processing`, `ready`, and `shipped` values respectively.
- The migration now establishes actual SQLite database defaults for order status (`new`) and invoice status (`active`); focused upgrade tests insert rows without those values to prove the upgraded schema, not just metadata.
- Order activity is no longer delete-orphan/cascade data. Its database foreign key is `RESTRICT`, so an order deletion cannot erase immutable activity history.
- The compatibility `Order.invoice` relationship deterministically selects the active invoice. The legacy issuance enum is an `active` alias and the existing invoice reader selects only active rows.
- Downgrade refuses before any schema mutation when replacement history would violate 0004's one-invoice unique constraint. Upgrade tolerates a prior schema missing that constraint, preventing a false 0004 stamp from breaking re-upgrade.

### Round 1 tests

- Red: focused additions failed for missing lifecycle values, cascading activity deletion, and incorrect legacy mappings.
- Green: `pytest -q tests/test_order_invoice_persistence.py` -> 9 passed.
- The broad `tests/test_invoices.py` regression command exceeded 120 seconds without emitting a failure and was stopped; this is a verification limitation, not a passing result.

## Round 2 fixes

- Added revision `0006_active_invoice_marker`. A nullable `active_invoice_marker` is `active` only for the current invoice, and the portable unique pair `(order_id, active_invoice_marker)` permits retained archived/replaced rows while rejecting a second active invoice.
- Added a database check requiring active rows to carry the marker and all non-active rows to carry `NULL`.
- Invoice issuance sets the marker; cancellation clears it. The compatibility lookup filters by the active marker, orders deterministically, and limits to one row to remain safe against pre-constraint malformed data.
- The migration refuses to apply if existing duplicate active invoices require an operator decision rather than silently choosing or deleting history.

### Round 2 tests

- Red: active-marker model/migration assertions failed before implementation.
- Green: `pytest -q tests/test_order_invoice_persistence.py tests/test_invoices.py::test_a_replaced_invoice_and_its_active_replacement_can_share_an_order` -> 11 passed.

## Round 3 fixes

- Made the active-marker check NULL-safe: an active invoice now requires both a non-null marker and the literal `active`; non-active rows require `NULL`.
- Added revision `0007_active_invoice_marker_null_safe` so already-upgraded 0006 databases receive the corrected check and active marker server default. Fresh 0006 upgrades use the same corrected expression.
- The marker column uses a server default for ordinary active inserts and SQLAlchemy `evaluates_none()` so an explicitly supplied `NULL` reaches the database and is rejected instead of silently taking the default.
- Revision 0007 normalizes a single legacy active/null marker before adding the stricter check, but rejects duplicate active rows rather than discarding or guessing historical data.

### Round 3 tests

- Red: an active invoice with an explicit null marker committed before the NULL-safe check.
- Green: `pytest -q tests/test_order_invoice_persistence.py tests/test_invoices.py::test_a_replaced_invoice_and_its_active_replacement_can_share_an_order` -> 12 passed.
