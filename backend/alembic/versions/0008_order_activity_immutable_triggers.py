"""enforce append-only order activity at the database layer

Revision ID: 0008_order_activity_immutable_triggers
Revises: 0007_active_invoice_marker_null_safe
"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import context, op

revision: str = "0008_order_activity_immutable_triggers"
down_revision: Union[str, None] = "0007_active_invoice_marker_null_safe"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_SINGLE_INVOICE_REVISIONS = {None, "0001_initial", "0002_instance_metadata", "0003_invoices", "0004_import_batches"}


def _blocks_legacy_downgrade() -> bool:
    if context.get_revision_argument() not in _SINGLE_INVOICE_REVISIONS:
        return False
    return op.get_bind().execute(
        sa.text("SELECT 1 FROM invoices GROUP BY order_id HAVING COUNT(*) > 1 LIMIT 1")
    ).first() is not None

_UPDATE_TRIGGER = "trg_order_activities_no_update"
_DELETE_TRIGGER = "trg_order_activities_no_delete"


def _create_trigger(name: str, operation: str) -> None:
    dialect = op.get_bind().dialect.name
    if dialect == "sqlite":
        op.execute(
            f"CREATE TRIGGER {name} BEFORE {operation} ON order_activities "
            "FOR EACH ROW BEGIN SELECT RAISE(ABORT, 'order_activity_immutable'); END"
        )
    elif dialect == "mysql":
        op.execute(
            f"CREATE TRIGGER {name} BEFORE {operation} ON order_activities "
            "FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'order_activity_immutable'"
        )
    else:
        raise RuntimeError(f"Order activity triggers are not implemented for {dialect}.")


def _drop_trigger(name: str) -> None:
    op.execute(f"DROP TRIGGER IF EXISTS {name}")


def upgrade() -> None:
    _create_trigger(_UPDATE_TRIGGER, "UPDATE")
    _create_trigger(_DELETE_TRIGGER, "DELETE")


def downgrade() -> None:
    if _blocks_legacy_downgrade():
        raise RuntimeError("Cannot downgrade replacement invoice history without deleting invoices.")
    _drop_trigger(_DELETE_TRIGGER)
    _drop_trigger(_UPDATE_TRIGGER)
