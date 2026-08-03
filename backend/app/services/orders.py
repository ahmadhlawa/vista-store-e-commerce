"""Order creation, status transitions and inventory movement.

Every write here happens inside the caller's transaction: the endpoint commits once,
so an order, its items, its stock movements and the coupon counter either all land or
none of them do.
"""

from __future__ import annotations

import secrets
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Any, Protocol

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.enums import OrderSource, OrderStatus, PaymentMethod
from app.db.base import utcnow
from app.models import (
    AdminUser,
    Order,
    OrderActivity,
    OrderItem,
    OrderStatusHistory,
    Product,
    ProductVariant,
)
from app.services import audit as audit_service
from app.services import invoices as invoices_service
from app.services.errors import DomainError, NotFoundError
from app.services.pricing import PricedCart, money, price_cart

ORDER_NUMBER_PREFIX = "ORD"


class OrderItemLike(Protocol):
    quantity: int
    unit_price: Decimal


@dataclass(frozen=True, slots=True)
class OrderTotals:
    line_totals: tuple[Decimal, ...]
    subtotal: Decimal
    discount_amount: Decimal
    delivery_fee: Decimal
    total_amount: Decimal


def _nonnegative_money(value: Decimal | int | float | str, *, field: str) -> Decimal:
    raw = Decimal(str(value))
    if raw < 0:
        raise DomainError(f"{field} cannot be negative.", code=f"negative_{field}")
    return money(raw)


def calculate_order_totals(
    items: Sequence[OrderItemLike],
    discount_amount: Decimal,
    delivery_fee: Decimal,
) -> OrderTotals:
    """Calculate persisted order money values from quantized line totals."""
    line_totals: list[Decimal] = []
    for item in items:
        if item.quantity <= 0:
            raise DomainError("Quantity must be positive.", code="invalid_quantity")
        unit_price = _nonnegative_money(item.unit_price, field="unit_price")
        line_totals.append(money(unit_price * item.quantity))

    subtotal = money(sum(line_totals, Decimal("0.00")))
    discount = _nonnegative_money(discount_amount, field="discount_amount")
    delivery = _nonnegative_money(delivery_fee, field="delivery_fee")
    total = money(max(Decimal("0.00"), subtotal - discount + delivery))
    return OrderTotals(tuple(line_totals), subtotal, discount, delivery, total)


_ACTIVITY_SAFE_FIELDS = frozenset(
    {
        "id",
        "order_id",
        "invoice_id",
        "order_number",
        "invoice_number",
        "product_id",
        "variant_id",
        "item_kind",
        "product_name",
        "sku",
        "variant_description",
        "manual_description",
        "quantity",
        "unit_price",
        "original_unit_price",
        "line_total",
        "subtotal",
        "discount",
        "discount_amount",
        "delivery_fee",
        "total",
        "total_amount",
        "customer_name",
        "customer_phone",
        "customer_email",
        "address",
        "customer_notes",
        "admin_notes",
        "status",
        "source",
        "source_note",
        "payment_method",
        "payment_status",
        "paid_amount",
        "refunded_amount",
        "remaining_amount",
        "is_locked",
        "locked_at",
        "completed_at",
        "replacement_invoice_id",
        "items",
        "line",
        "customer",
        "payment",
        "invoice",
        "order",
        "changes",
        "context",
        "from",
        "to",
    }
)
_ACTIVITY_REDACTED = "[redacted]"


def _stable_activity_value(value: Any) -> Any:
    if isinstance(value, Decimal):
        return str(money(value))
    if isinstance(value, Enum):
        return _stable_activity_value(value.value)
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, Mapping):
        stable: dict[str, Any] = {}
        for key, nested in value.items():
            if not isinstance(key, str):
                raise DomainError("Activity data contains an unsafe field.", code="invalid_activity_data")
            stable[key] = (
                _stable_activity_value(nested)
                if key.lower() in _ACTIVITY_SAFE_FIELDS
                else _ACTIVITY_REDACTED
            )
        return stable
    if isinstance(value, (list, tuple)):
        return [_stable_activity_value(item) for item in value]
    raise DomainError("Activity data must contain stable business values.", code="invalid_activity_data")


def record_order_activity(
    db: Session,
    *,
    order_id: int,
    invoice_id: int | None,
    actor_admin_id: int | None,
    event_type: str,
    before_data: Mapping[str, Any] | None,
    after_data: Mapping[str, Any] | None,
    reason: str | None,
) -> OrderActivity:
    """Append a detached, JSON-safe audit event in the caller's transaction."""
    event = OrderActivity(
        order_id=order_id,
        invoice_id=invoice_id,
        actor_admin_id=actor_admin_id,
        event_type=event_type,
        before_data=_stable_activity_value(before_data) if before_data is not None else None,
        after_data=_stable_activity_value(after_data) if after_data is not None else None,
        reason=(reason or "").strip() or None,
    )
    db.add(event)
    db.flush()
    return event

# Statuses that mean stock is currently committed to the order.
_STOCK_HELD_STATUSES = {
    OrderStatus.NEW.value,
    OrderStatus.PENDING.value,
    OrderStatus.CONFIRMED.value,
    OrderStatus.PROCESSING.value,
    OrderStatus.READY.value,
    OrderStatus.SHIPPED.value,
    OrderStatus.DELIVERED.value,
}


@dataclass(slots=True)
class OrderDraft:
    customer_name: str
    customer_phone: str
    address: str
    items: list[tuple[int, int | None, int]]
    client_reference: str | None = None
    customer_email: str | None = None
    delivery_area_id: int | None = None
    coupon_code: str | None = None
    payment_method: str = PaymentMethod.CASH_ON_DELIVERY.value
    customer_notes: str | None = None


def generate_order_number(db: Session) -> str:
    """Human readable and unique: ORD-260731-4821."""
    stamp = utcnow().strftime("%y%m%d")
    for _ in range(25):
        candidate = f"{ORDER_NUMBER_PREFIX}-{stamp}-{secrets.randbelow(9000) + 1000}"
        exists = db.execute(select(Order.id).where(Order.order_number == candidate)).first()
        if exists is None:
            return candidate
    raise DomainError("تعذّر توليد رقم طلب فريد، حاول مرة أخرى.", code="order_number_exhausted")


def _apply_stock_delta(priced: PricedCart, sign: int) -> None:
    """sign=-1 reserves stock, sign=+1 gives it back."""
    for line in priced.lines:
        if not line.product.track_inventory:
            continue
        delta = sign * line.quantity
        if line.variant is not None:
            line.variant.stock_quantity = max(0, line.variant.stock_quantity + delta)
        line.product.stock_quantity = max(0, line.product.stock_quantity + delta)


def create_order(db: Session, draft: OrderDraft) -> Order:
    if draft.client_reference:
        existing = db.execute(
            select(Order).where(Order.client_reference == draft.client_reference)
        ).scalar_one_or_none()
        if existing is not None:
            return existing

    if not draft.items:
        raise DomainError("العربة فارغة.", code="empty_cart")

    priced = price_cart(
        db,
        draft.items,
        coupon_code=draft.coupon_code,
        delivery_area_id=draft.delivery_area_id,
    )

    totals = calculate_order_totals(
        priced.lines,
        discount_amount=priced.discount,
        delivery_fee=priced.delivery_fee,
    )
    order = Order(
        order_number=generate_order_number(db),
        public_token=secrets.token_urlsafe(24),
        status=OrderStatus.NEW.value,
        source=OrderSource.WEBSITE.value,
        client_reference=draft.client_reference,
        customer_name=draft.customer_name.strip(),
        customer_phone=draft.customer_phone.strip(),
        customer_email=(draft.customer_email or "").strip() or None,
        address=draft.address.strip(),
        delivery_area_id=priced.delivery_area.id if priced.delivery_area else None,
        delivery_area_name=priced.delivery_area.name if priced.delivery_area else None,
        delivery_fee=totals.delivery_fee,
        subtotal=totals.subtotal,
        discount=totals.discount_amount,
        total=totals.total_amount,
        coupon_code=priced.coupon.code if priced.coupon else None,
        payment_method=draft.payment_method,
        customer_notes=(draft.customer_notes or "").strip() or None,
    )

    for line, line_total in zip(priced.lines, totals.line_totals, strict=True):
        order.items.append(
            OrderItem(
                product_id=line.product.id,
                variant_id=line.variant.id if line.variant else None,
                item_kind="catalog",
                product_name=line.product.name,
                original_product_name=line.product.name,
                sku=line.sku,
                original_sku=line.sku,
                variant_description=line.variant_description,
                original_variant_description=line.variant_description,
                original_unit_price=line.unit_price,
                unit_price=line.unit_price,
                quantity=line.quantity,
                line_total=line_total,
            )
        )

    order.status_history.append(
        OrderStatusHistory(
            old_status=None,
            new_status=OrderStatus.NEW.value,
            note="تم إنشاء الطلب من المتجر.",
        )
    )

    _apply_stock_delta(priced, sign=-1)
    if priced.coupon is not None:
        priced.coupon.used_count += 1

    db.add(order)
    db.flush()
    record_order_activity(
        db,
        order_id=order.id,
        invoice_id=None,
        actor_admin_id=None,
        event_type="order_created",
        before_data=None,
        after_data={"status": order.status, "total_amount": order.total},
        reason=None,
    )
    return order


def _restore_stock(db: Session, order: Order) -> None:
    for item in order.items:
        if item.product_id is None:
            continue
        product = db.get(Product, item.product_id)
        if product is None or not product.track_inventory:
            continue
        if item.variant_id is not None:
            variant = db.get(ProductVariant, item.variant_id)
            if variant is not None:
                variant.stock_quantity += item.quantity
        product.stock_quantity += item.quantity


def change_status(
    db: Session,
    order: Order,
    new_status: str,
    *,
    admin: AdminUser | None = None,
    note: str | None = None,
) -> Order:
    if new_status not in {s.value for s in OrderStatus}:
        raise DomainError("حالة الطلب غير معروفة.", code="invalid_status")

    old_status = order.status
    if old_status == new_status:
        # Idempotent: no history row, no stock movement.
        return order

    if old_status == OrderStatus.CANCELLED.value:
        raise DomainError(
            "لا يمكن تغيير حالة طلب ملغى.", code="order_cancelled"
        )

    if new_status == OrderStatus.CANCELLED.value and old_status in _STOCK_HELD_STATUSES:
        _restore_stock(db, order)

    order.status = new_status
    # Invoicing rides on the same transaction as the status change, so an order can
    # never be left confirmed-but-uninvoiced or cancelled-with-a-live-invoice.
    invoice_id: int | None = None
    if new_status == OrderStatus.CONFIRMED.value:
        # Idempotent: an order that was confirmed before keeps its original invoice.
        invoice_id = invoices_service.issue_for_order(db, order, admin=admin).id
    elif new_status == OrderStatus.CANCELLED.value:
        invoice = invoices_service.cancel_for_order(db, order, admin=admin, reason=note)
        invoice_id = invoice.id if invoice else None

    order.updated_at = utcnow()
    db.add(
        OrderStatusHistory(
            order_id=order.id,
            old_status=old_status,
            new_status=new_status,
            admin_user_id=admin.id if admin else None,
            note=note,
        )
    )
    record_order_activity(
        db,
        order_id=order.id,
        invoice_id=invoice_id,
        actor_admin_id=admin.id if admin else None,
        event_type="order_status_changed",
        before_data={"status": old_status},
        after_data={"status": new_status},
        reason=note,
    )
    if admin is not None:
        audit_service.record(
            db,
            admin=admin,
            action="order.status_changed",
            entity_type="order",
            entity_id=order.id,
            meta={"from": old_status, "to": new_status, "order_number": order.order_number},
        )
    return order


def get_by_number(db: Session, order_number: str) -> Order:
    order = db.execute(
        select(Order).where(Order.order_number == order_number.strip().upper())
    ).scalar_one_or_none()
    if order is None:
        raise NotFoundError("الطلب غير موجود.", code="order_not_found")
    return order


def dashboard_summary(db: Session) -> dict[str, object]:
    from app.models import Article, Category, Coupon, Product

    def _count(model, *conditions):
        stmt = select(func.count()).select_from(model)
        for condition in conditions:
            stmt = stmt.where(condition)
        return int(db.execute(stmt).scalar_one())

    revenue = db.execute(
        select(func.coalesce(func.sum(Order.total), 0)).where(
            Order.status != OrderStatus.CANCELLED.value
        )
    ).scalar_one()

    by_status = {
        status: _count(Order, Order.status == status)
        for status in (s.value for s in OrderStatus)
    }

    low_stock = _count(
        Product,
        Product.track_inventory.is_(True),
        Product.is_active.is_(True),
        Product.stock_quantity <= Product.low_stock_threshold,
    )

    recent = (
        db.execute(select(Order).order_by(Order.id.desc()).limit(5)).scalars().all()
    )

    return {
        "products_total": _count(Product),
        "products_active": _count(Product, Product.is_active.is_(True)),
        "categories_total": _count(Category),
        "articles_published": _count(Article, Article.is_published.is_(True)),
        "coupons_active": _count(Coupon, Coupon.is_active.is_(True)),
        "orders_total": _count(Order),
        "orders_by_status": by_status,
        "orders_pending": by_status[OrderStatus.PENDING.value],
        "revenue_total": money(Decimal(str(revenue))),
        "low_stock_products": low_stock,
        "recent_orders": recent,
    }
