from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import MetaData, create_engine, inspect, select
from sqlalchemy.orm import Session
import sqlalchemy as sa

import app.models as models
import pytest
from app.core.config import settings
from app.core.enums import InvoiceStatus, OrderStatus
from app.db.base import Base
from app.models import Invoice, Order, OrderActivity, OrderItem
from sqlalchemy.exc import IntegrityError


def _order() -> Order:
    return Order(
        order_number="ORD-PERSIST-1",
        public_token="persistence-token",
        customer_name="Customer",
        customer_phone="0590000000",
        address="Address",
        subtotal=Decimal("10.00"),
        total=Decimal("10.00"),
    )


def _invoice(order: Order, **changes: object) -> Invoice:
    values: dict[str, object] = {
        "invoice_number": "INV-PERSIST-1",
        "active_invoice_marker": "active",
        "order": order,
        "order_number": order.order_number,
        "payment_method": "cash_on_delivery",
        "store_name": "Vista",
        "customer_name": order.customer_name,
        "customer_phone": order.customer_phone,
        "delivery_address": order.address,
        "currency_code": "ILS",
        "currency_symbol": "₪",
        "subtotal": Decimal("10.00"),
        "grand_total": Decimal("10.00"),
    }
    values.update(changes)
    return Invoice(**values)


def test_order_items_preserve_original_price_and_allow_manual_lines(db: Session) -> None:
    """Dropping original snapshots or requiring a catalog product loses editable-order history."""
    columns = Base.metadata.tables["order_items"].c
    assert {"item_kind", "original_product_name", "original_unit_price", "manual_description"} <= set(
        columns.keys()
    )
    assert columns.product_id.nullable

    order = _order()
    order.items.append(
        OrderItem(
            item_kind="manual",
            product_id=None,
            product_name="Custom line",
            original_product_name="Custom line",
            manual_description="Made to order",
            original_unit_price=Decimal("10.00"),
            unit_price=Decimal("12.50"),
            quantity=2,
            line_total=Decimal("25.00"),
        )
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    item = order.items[0]
    assert item.product_id is None
    assert item.original_unit_price == Decimal("10.00")
    assert item.unit_price == Decimal("12.50")


def test_replaced_invoices_can_be_retained_with_payment_state(db: Session) -> None:
    """Keeping the legacy one-invoice constraint would make archived replacements impossible."""
    columns = Base.metadata.tables["invoices"].c
    assert {
        "replacement_invoice_id",
        "payment_status",
        "paid_amount",
        "refunded_amount",
        "remaining_amount",
        "payment_details",
        "invoice_notes",
    } <= set(columns.keys())

    order = _order()
    active = _invoice(
        order,
        invoice_number="INV-PERSIST-NEW",
        payment_status="unpaid",
        paid_amount=Decimal("0.00"),
        remaining_amount=Decimal("10.00"),
    )
    archived = _invoice(
        order,
        status="replaced",
        active_invoice_marker=None,
        invoice_number="INV-PERSIST-OLD",
        replacement_invoice=active,
        payment_status="paid",
        paid_amount=Decimal("10.00"),
        remaining_amount=Decimal("0.00"),
    )
    db.add_all((archived, active))
    db.commit()

    assert archived.replacement_invoice_id == active.id
    assert active.replaces_invoice is archived


def test_database_permits_only_one_active_invoice_per_order(db: Session) -> None:
    """A second active marker must fail while a replaced invoice remains retained."""
    assert "active_invoice_marker" in Base.metadata.tables["invoices"].c

    order = _order()
    db.add_all(
        (
            _invoice(order, invoice_number="INV-ACTIVE-ONE", active_invoice_marker="active"),
            _invoice(order, invoice_number="INV-ACTIVE-TWO", active_invoice_marker="active"),
        )
    )
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()


def test_database_rejects_an_active_invoice_without_its_marker(db: Session) -> None:
    """SQL CHECK semantics must not allow NULL to bypass the active-invoice invariant."""
    order = _order()
    db.add(_invoice(order, active_invoice_marker=None))
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()


def test_order_activity_persists_immutable_audit_payloads(db: Session) -> None:
    """Removing audit snapshots or their reason would erase the edit trail."""
    assert "order_activities" in Base.metadata.tables
    OrderActivity = getattr(models, "OrderActivity")

    order = _order()
    db.add(order)
    db.flush()
    event = OrderActivity(
        order_id=order.id,
        event_type="order_item_price_changed",
        before_data={"unit_price": "10.00"},
        after_data={"unit_price": "12.50"},
        reason="Customer agreed to a custom price",
    )
    db.add(event)
    db.commit()

    saved = db.get(OrderActivity, event.id)
    assert saved is not None
    assert saved.before_data == {"unit_price": "10.00"}
    assert saved.after_data == {"unit_price": "12.50"}
    assert saved.reason == "Customer agreed to a custom price"


def test_order_and_invoice_workflow_columns_have_safe_defaults() -> None:
    """New non-null lifecycle columns need database defaults for legacy rows."""
    inspector = inspect(Base.metadata)
    # SQLAlchemy metadata keeps the server-default contract portable before migration runs.
    assert Base.metadata.tables["orders"].c.source.server_default is not None
    assert Base.metadata.tables["orders"].c.is_locked.server_default is not None
    assert Base.metadata.tables["invoices"].c.status.server_default is not None
    assert Base.metadata.tables["invoices"].c.payment_status.server_default is not None


def test_legacy_statuses_map_to_the_review_workflow() -> None:
    """Collapsing review/preparation/delivery statuses loses the staff workflow state."""
    assert OrderStatus.REVIEWING.value == "reviewing"
    assert OrderStatus.PREPARING.value == "preparing"
    assert OrderStatus.OUT_FOR_DELIVERY.value == "out_for_delivery"


def test_order_activity_survives_an_attempt_to_delete_its_order(db: Session) -> None:
    """Deleting an order must not cascade away its immutable activity trail."""
    order = _order()
    order.activities.append(OrderActivity(event_type="created", after_data={"status": "new"}))
    db.add(order)
    db.commit()

    db.delete(order)
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()


def test_migration_blocks_direct_sql_activity_updates_and_deletes(tmp_path: Path, monkeypatch) -> None:
    """Audit immutability must hold even when ORM mapper hooks are bypassed."""
    database_url = f"sqlite+pysqlite:///{(tmp_path / 'activity-triggers.db').as_posix()}"
    monkeypatch.setattr(settings, "DATABASE_URL", database_url)
    config = Config("alembic.ini")
    command.upgrade(config, "head")

    engine = create_engine(database_url)
    with Session(engine) as session:
        order = _order()
        order.order_number = "ORD-TRIGGER"
        order.public_token = "trigger-token"
        session.add(order)
        session.flush()
        activity = OrderActivity(order_id=order.id, event_type="created", after_data={"status": "new"})
        session.add(activity)
        session.commit()
        activity_id = activity.id

    with engine.begin() as connection:
        with pytest.raises(IntegrityError, match="order_activity_immutable"):
            connection.execute(
                sa.text("UPDATE order_activities SET reason = 'tampered' WHERE id = :id"),
                {"id": activity_id},
            )
    with engine.begin() as connection:
        with pytest.raises(IntegrityError, match="order_activity_immutable"):
            connection.execute(
                sa.text("DELETE FROM order_activities WHERE id = :id"), {"id": activity_id}
            )
    with engine.connect() as connection:
        assert connection.execute(
            sa.text("SELECT COUNT(*) FROM order_activities WHERE id = :id"), {"id": activity_id}
        ).scalar_one() == 1
    engine.dispose()


def test_order_invoice_view_selects_the_active_invoice_deterministically(db: Session) -> None:
    """A scalar compatibility accessor must not return an arbitrary historical invoice."""
    order = _order()
    active = _invoice(order, invoice_number="INV-ACTIVE", status=InvoiceStatus.ACTIVE.value)
    archived = _invoice(
        order,
        invoice_number="INV-REPLACED",
        status=InvoiceStatus.REPLACED.value,
        active_invoice_marker=None,
        replacement_invoice=active,
    )
    db.add_all((active, archived))
    db.commit()
    db.expire_all()

    assert db.get(Order, order.id).invoice.id == active.id


def test_upgrade_from_0004_retains_and_backfills_legacy_order_and_invoice(
    tmp_path: Path, monkeypatch
) -> None:
    """An upgrade must retain IDs and translate the legacy issued invoice into its active workflow state."""
    database_url = f"sqlite+pysqlite:///{(tmp_path / 'legacy.db').as_posix()}"
    monkeypatch.setattr(settings, "DATABASE_URL", database_url)
    config = Config("alembic.ini")
    command.upgrade(config, "0004_import_batches")

    engine = create_engine(database_url)
    metadata = MetaData()
    metadata.reflect(engine, only=["orders", "invoices"])
    now = datetime(2026, 8, 3, 12, 0, 0)
    with engine.begin() as connection:
        connection.execute(
            metadata.tables["orders"].insert(),
            {
                "id": 41,
                "order_number": "ORD-LEGACY",
                "public_token": "legacy-token",
                "status": "confirmed",
                "customer_name": "Legacy Customer",
                "customer_phone": "0590000000",
                "address": "Legacy address",
                "delivery_fee": Decimal("0.00"),
                "subtotal": Decimal("10.00"),
                "discount": Decimal("0.00"),
                "total": Decimal("10.00"),
                "payment_method": "cash_on_delivery",
                "created_at": now,
                "updated_at": now,
            },
        )
        for order_id, status in ((42, "confirmed"), (43, "processing"), (44, "ready"), (45, "shipped")):
            connection.execute(
                metadata.tables["orders"].insert(),
                {
                    "id": order_id,
                    "order_number": f"ORD-LEGACY-{order_id}",
                    "public_token": f"legacy-token-{order_id}",
                    "status": status,
                    "customer_name": "Legacy Customer",
                    "customer_phone": "0590000000",
                    "address": "Legacy address",
                    "delivery_fee": Decimal("0.00"),
                    "subtotal": Decimal("10.00"),
                    "discount": Decimal("0.00"),
                    "total": Decimal("10.00"),
                    "payment_method": "cash_on_delivery",
                    "created_at": now,
                    "updated_at": now,
                },
            )
        connection.execute(
            metadata.tables["invoices"].insert(),
            {
                "id": 73,
                "invoice_number": "INV-LEGACY",
                "order_id": 41,
                "status": "issued",
                "issued_at": now,
                "order_number": "ORD-LEGACY",
                "payment_method": "cash_on_delivery",
                "store_name": "Vista",
                "customer_name": "Legacy Customer",
                "customer_phone": "0590000000",
                "delivery_address": "Legacy address",
                "currency_code": "ILS",
                "currency_symbol": "₪",
                "subtotal": Decimal("10.00"),
                "discount": Decimal("0.00"),
                "delivery_fee": Decimal("0.00"),
                "tax_enabled": False,
                "tax_rate": Decimal("0.000"),
                "prices_include_tax": False,
                "tax_amount": Decimal("0.00"),
                "grand_total": Decimal("10.00"),
                "created_at": now,
                "updated_at": now,
            },
        )

    command.upgrade(config, "head")
    metadata = MetaData()
    metadata.reflect(engine, only=["orders", "invoices"])
    assert {"issued_by_admin_id", "issued_by_admin_name", "issued_by_admin_email"} <= set(
        metadata.tables["invoices"].c.keys()
    )
    with engine.connect() as connection:
        order = connection.execute(
            select(metadata.tables["orders"]).where(metadata.tables["orders"].c.id == 41)
        ).mappings().one()
        invoice = connection.execute(
            select(metadata.tables["invoices"]).where(metadata.tables["invoices"].c.id == 73)
        ).mappings().one()

    assert order["order_number"] == "ORD-LEGACY"
    assert order["status"] == "completed"
    assert order["source"] == "website"
    assert order["is_locked"] is True
    assert invoice["invoice_number"] == "INV-LEGACY"
    assert invoice["status"] == "active"
    assert invoice["active_invoice_marker"] == "active"
    assert invoice["payment_status"] == "unpaid"
    assert invoice["remaining_amount"] == Decimal("10.00")
    with engine.connect() as connection:
        mapped_statuses = dict(
            connection.execute(
                select(metadata.tables["orders"].c.id, metadata.tables["orders"].c.status).where(
                    metadata.tables["orders"].c.id.in_((42, 43, 44, 45))
                )
            ).all()
        )
    assert mapped_statuses == {
        42: "reviewing",
        43: "reviewing",
        44: "preparing",
        45: "out_for_delivery",
    }
    with engine.begin() as connection:
        connection.execute(
            metadata.tables["orders"].insert(),
            {
                "id": 99,
                "order_number": "ORD-DEFAULTS",
                "public_token": "defaults-token",
                "customer_name": "Default Customer",
                "customer_phone": "0590000001",
                "address": "Default address",
                "delivery_fee": Decimal("0.00"),
                "subtotal": Decimal("10.00"),
                "discount": Decimal("0.00"),
                "total": Decimal("10.00"),
                "payment_method": "cash_on_delivery",
                "created_at": now,
                "updated_at": now,
            },
        )
        connection.execute(
            metadata.tables["invoices"].insert(),
            {
                "id": 100,
                "invoice_number": "INV-DEFAULTS",
                "order_id": 99,
                "issued_at": now,
                "order_number": "ORD-DEFAULTS",
                "payment_method": "cash_on_delivery",
                "store_name": "Vista",
                "customer_name": "Default Customer",
                "customer_phone": "0590000001",
                "delivery_address": "Default address",
                "currency_code": "ILS",
                "currency_symbol": "₪",
                "subtotal": Decimal("10.00"),
                "discount": Decimal("0.00"),
                "delivery_fee": Decimal("0.00"),
                "tax_enabled": False,
                "tax_rate": Decimal("0.000"),
                "prices_include_tax": False,
                "tax_amount": Decimal("0.00"),
                "grand_total": Decimal("10.00"),
                "created_at": now,
                "updated_at": now,
            },
        )
    with engine.connect() as connection:
        default_order_status = connection.execute(
            select(metadata.tables["orders"].c.status).where(metadata.tables["orders"].c.id == 99)
        ).scalar_one()
        default_invoice_status = connection.execute(
            select(metadata.tables["invoices"].c.status).where(metadata.tables["invoices"].c.id == 100)
        ).scalar_one()
    assert default_order_status == "new"
    assert default_invoice_status == "active"
    engine.dispose()


def test_downgrade_with_replacement_history_refuses_to_stamp_invalid_0004(
    tmp_path: Path, monkeypatch
) -> None:
    """A replacement history cannot be downgraded to 0004 without deleting invoices."""
    database_url = f"sqlite+pysqlite:///{(tmp_path / 'replacement-history.db').as_posix()}"
    monkeypatch.setattr(settings, "DATABASE_URL", database_url)
    config = Config("alembic.ini")
    command.upgrade(config, "head")

    engine = create_engine(database_url)
    metadata = MetaData()
    metadata.reflect(engine, only=["orders", "invoices"])
    now = datetime(2026, 8, 3, 12, 0, 0)
    with engine.begin() as connection:
        connection.execute(
            metadata.tables["orders"].insert(),
            {
                "id": 201,
                "order_number": "ORD-HISTORY",
                "public_token": "history-token",
                "customer_name": "History Customer",
                "customer_phone": "0590000002",
                "address": "History address",
                "delivery_fee": Decimal("0.00"),
                "subtotal": Decimal("10.00"),
                "discount": Decimal("0.00"),
                "total": Decimal("10.00"),
                "payment_method": "cash_on_delivery",
                "created_at": now,
                "updated_at": now,
            },
        )
        base_invoice = {
            "order_id": 201,
            "issued_at": now,
            "order_number": "ORD-HISTORY",
            "payment_method": "cash_on_delivery",
            "store_name": "Vista",
            "customer_name": "History Customer",
            "customer_phone": "0590000002",
            "delivery_address": "History address",
            "currency_code": "ILS",
            "currency_symbol": "₪",
            "subtotal": Decimal("10.00"),
            "discount": Decimal("0.00"),
            "delivery_fee": Decimal("0.00"),
            "tax_enabled": False,
            "tax_rate": Decimal("0.000"),
            "prices_include_tax": False,
            "tax_amount": Decimal("0.00"),
            "grand_total": Decimal("10.00"),
            "created_at": now,
            "updated_at": now,
        }
        connection.execute(
            metadata.tables["invoices"].insert(),
            {
                **base_invoice,
                "id": 301,
                "invoice_number": "INV-HISTORY-OLD",
                "status": "replaced",
                "active_invoice_marker": None,
            },
        )
        connection.execute(
            metadata.tables["invoices"].insert(),
            {
                **base_invoice,
                "id": 302,
                "invoice_number": "INV-HISTORY-ACTIVE",
                "status": "active",
                "replacement_invoice_id": 301,
                "active_invoice_marker": "active",
            },
        )

    with pytest.raises(RuntimeError, match="replacement invoice history"):
        command.downgrade(config, "0004_import_batches")
    command.upgrade(config, "head")
    with engine.connect() as connection:
        assert connection.execute(sa.text("SELECT version_num FROM alembic_version")).scalar_one() == "0009_invoice_issuer_snapshot"
    engine.dispose()
