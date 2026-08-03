"""snapshot immutable invoice issuer identity

Revision ID: 0009_invoice_issuer_snapshot
Revises: 0008_order_activity_immutable_triggers
"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0009_invoice_issuer_snapshot"
down_revision: Union[str, None] = "0008_order_activity_immutable_triggers"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("invoices") as batch:
        # No foreign key: this snapshot must survive account deletion.
        batch.add_column(sa.Column("issued_by_admin_id", sa.Integer(), nullable=True))
        batch.add_column(sa.Column("issued_by_admin_name", sa.String(length=150), nullable=True))
        batch.add_column(sa.Column("issued_by_admin_email", sa.String(length=255), nullable=True))


def downgrade() -> None:
    if op.get_bind().dialect.name == "sqlite":
        op.execute("PRAGMA foreign_keys=OFF")
    with op.batch_alter_table("invoices") as batch:
        batch.drop_column("issued_by_admin_email")
        batch.drop_column("issued_by_admin_name")
        batch.drop_column("issued_by_admin_id")
    if op.get_bind().dialect.name == "sqlite":
        op.execute("PRAGMA foreign_keys=ON")
