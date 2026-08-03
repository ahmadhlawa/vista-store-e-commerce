from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import MetaData, create_engine, inspect, select
from sqlalchemy.orm import Session

import app.models as models
from app.core.config import settings
from app.db.base import Base
from app.models import Invoice, Order, OrderItem


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
    assert invoice["payment_status"] == "unpaid"
    assert invoice["remaining_amount"] == Decimal("10.00")
    engine.dispose()
