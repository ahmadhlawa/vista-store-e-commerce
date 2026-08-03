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
from sqlalchemy.orm import Session, selectinload

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
from app.services.errors import DomainError, NotFoundError, PermissionDeniedError
from app.services.pricing import PricedLine, money, price_cart, price_lines

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


@dataclass(frozen=True, slots=True)
class AdminOrderItemDraft:
    product_id: int
    variant_id: int | None
    quantity: int
    unit_price: Decimal | None


@dataclass(frozen=True, slots=True)
class AdminOrderEditDraft:
    customer_name: str
    customer_phone: str
    customer_email: str | None
    address: str
    payment_method: str
    customer_notes: str | None
    admin_notes: str | None
    discount: Decimal
    delivery_fee: Decimal
    status: str
    reason: str | None
    items: tuple[AdminOrderItemDraft, ...]


def generate_order_number(db: Session) -> str:
    """Human readable and unique: ORD-260731-4821."""
    stamp = utcnow().strftime("%y%m%d")
    for _ in range(25):
        candidate = f"{ORDER_NUMBER_PREFIX}-{stamp}-{secrets.randbelow(9000) + 1000}"
        exists = db.execute(select(Order.id).where(Order.order_number == candidate)).first()
        if exists is None:
            return candidate
    raise DomainError("تعذّر توليد رقم طلب فريد، حاول مرة أخرى.", code="order_number_exhausted")


def _apply_stock_delta(lines: Sequence[PricedLine], sign: int) -> None:
    """sign=-1 reserves stock, sign=+1 gives it back."""
    for line in lines:
        if not line.product.track_inventory:
            continue
        delta = sign * line.quantity
        if line.variant is not None:
            line.variant.stock_quantity = max(0, line.variant.stock_quantity + delta)
        line.product.stock_quantity = max(0, line.product.stock_quantity + delta)


def create_order(db: Session, draft: OrderDraft) -> Order:
    if draft.client_reference:
        existing = get_by_client_reference(db, draft.client_reference)
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

    _apply_stock_delta(priced.lines, sign=-1)
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


def get_by_client_reference(db: Session, client_reference: str) -> Order | None:
    return db.execute(
        select(Order).where(Order.client_reference == client_reference)
    ).scalar_one_or_none()


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
    if old_status == OrderStatus.COMPLETED.value:
        raise DomainError("Completed orders are locked.", code="order_locked")
    if new_status == OrderStatus.COMPLETED.value:
        raise DomainError(
            "Order completion requires explicit confirmation.",
            code="completion_requires_confirmation",
        )
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
    # Cancellation still retires a live invoice in the same transaction. Issuance is
    # deliberately reserved for the explicit completion workflow below.
    invoice_id: int | None = None
    if new_status == OrderStatus.CANCELLED.value:
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


def complete_order(
    db: Session,
    *,
    order_id: int,
    payment_method: str,
    paid_amount: Decimal,
    payment_details: str | None,
    invoice_notes: str | None,
    admin: AdminUser,
) -> Order:
    """Lock, validate, complete and invoice one order in the caller's transaction."""
    order = db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id)
        .with_for_update()
    ).scalar_one_or_none()
    if order is None:
        raise NotFoundError("Order not found.", code="order_not_found")

    existing_invoice = invoices_service.get_for_order(db, order.id)
    if order.status == OrderStatus.COMPLETED.value:
        if existing_invoice is not None:
            return order
        raise DomainError("Completed orders are locked.", code="order_locked")
    if order.status == OrderStatus.CANCELLED.value:
        raise DomainError("Cancelled orders cannot be completed.", code="order_cancelled")
    if order.is_locked:
        raise DomainError("Completed orders are locked.", code="order_locked")
    if not order.items:
        raise DomainError("An order must contain at least one item.", code="empty_order")
    if existing_invoice is not None:
        raise DomainError("An active invoice already exists for this order.", code="active_invoice_exists")

    totals = calculate_order_totals(order.items, order.discount, order.delivery_fee)
    if (
        totals.subtotal != money(order.subtotal)
        or totals.total_amount != money(order.total)
        or any(
            line_total != money(item.line_total)
            for item, line_total in zip(order.items, totals.line_totals, strict=True)
        )
    ):
        raise DomainError("Order totals must be recalculated before completion.", code="invalid_order_totals")

    # Create and validate the immutable snapshot before changing the operational row.
    # If payment/tax/numbering fails, callers that handle the exception cannot commit a
    # half-completed order.
    invoice = invoices_service.issue_for_order(
        db,
        order,
        admin=admin,
        payment_method=payment_method,
        paid_amount=paid_amount,
        payment_details=payment_details,
        invoice_notes=invoice_notes,
    )
    completed_at = utcnow()
    previous_status = order.status
    order.payment_method = payment_method
    order.status = OrderStatus.COMPLETED.value
    order.is_locked = True
    order.locked_at = completed_at
    order.completed_at = completed_at
    order.completed_by_admin_id = admin.id
    order.updated_at = completed_at
    db.add(
        OrderStatusHistory(
            order_id=order.id,
            old_status=previous_status,
            new_status=OrderStatus.COMPLETED.value,
            admin_user_id=admin.id,
            note=None,
        )
    )
    record_order_activity(
        db,
        order_id=order.id,
        invoice_id=invoice.id,
        actor_admin_id=admin.id,
        event_type="order_completed",
        before_data={"status": previous_status, "is_locked": False},
        after_data={
            "status": order.status,
            "is_locked": order.is_locked,
            "invoice_number": invoice.invoice_number,
            "payment_status": invoice.payment_status,
            "paid_amount": invoice.paid_amount,
            "remaining_amount": invoice.remaining_amount,
        },
        reason=None,
    )
    audit_service.record(
        db,
        admin=admin,
        action="order.completed",
        entity_type="order",
        entity_id=order.id,
        meta={"order_number": order.order_number, "invoice_number": invoice.invoice_number},
    )
    db.flush()
    return order


def update_order_notes(
    db: Session,
    order: Order,
    *,
    admin_notes: str | None,
    reason: str | None,
    admin: AdminUser,
) -> Order:
    """Update internal notes only when their material change is explained."""
    if order.status == OrderStatus.CANCELLED.value:
        raise DomainError("Cancelled orders are locked.", code="order_cancelled")
    if order.is_locked or order.status == OrderStatus.COMPLETED.value:
        raise DomainError("Completed orders are locked.", code="order_locked")

    before = order.admin_notes
    after = (admin_notes or "").strip() or None
    if before == after:
        return order
    normalized_reason = (reason or "").strip() or None
    if normalized_reason is None:
        raise DomainError("An edit reason is required.", code="edit_reason_required")

    order.admin_notes = after
    order.updated_at = utcnow()
    record_order_activity(
        db,
        order_id=order.id,
        invoice_id=None,
        actor_admin_id=admin.id,
        event_type="order_notes_updated",
        before_data={"admin_notes": before},
        after_data={"admin_notes": after},
        reason=normalized_reason,
    )
    audit_service.record(
        db,
        admin=admin,
        action="order.notes_updated",
        entity_type="order",
        entity_id=order.id,
        meta={"order_number": order.order_number},
    )
    return order


_PATCHABLE_INCOMPLETE_STATUSES = frozenset(
    {
        OrderStatus.NEW.value,
        OrderStatus.REVIEWING.value,
        OrderStatus.PREPARING.value,
        OrderStatus.OUT_FOR_DELIVERY.value,
        OrderStatus.CANCELLED.value,
    }
)


def _item_key(product_id: int, variant_id: int | None) -> tuple[int, int | None]:
    return product_id, variant_id


def _item_snapshot(item: OrderItem) -> dict[str, Any]:
    return {
        "id": item.id,
        "product_id": item.product_id,
        "variant_id": item.variant_id,
        "product_name": item.product_name,
        "quantity": item.quantity,
        "unit_price": item.unit_price,
        "line_total": item.line_total,
    }


def edit_incomplete_website_order(
    db: Session,
    *,
    order_id: int,
    draft: AdminOrderEditDraft,
    admin: AdminUser,
) -> Order:
    """Replace an editable website-order draft and append its operational audit trail."""
    order = db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id)
        .with_for_update()
    ).scalar_one_or_none()
    if order is None:
        raise NotFoundError("Ø§Ù„Ø·Ù„Ø¨ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯.", code="order_not_found")
    if order.status == OrderStatus.CANCELLED.value:
        raise DomainError("Ù„Ø§ ÙŠÙ…ÙƒÙ† ØªØ¹Ø¯ÙŠÙ„ Ø·Ù„Ø¨ Ù…Ù„ØºÙ‰.", code="order_cancelled")
    if order.is_locked or order.status == OrderStatus.COMPLETED.value:
        raise DomainError("Ù„Ø§ ÙŠÙ…ÙƒÙ† ØªØ¹Ø¯ÙŠÙ„ Ø·Ù„Ø¨ Ù…Ù‚ÙÙ„.", code="order_locked")
    if order.source != OrderSource.WEBSITE.value:
        raise PermissionDeniedError(
            "ÙŠÙ…ÙƒÙ† ØªØ¹Ø¯ÙŠÙ„ Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ù…ÙˆÙ‚Ø¹ ÙÙ‚Ø·.", code="order_source_not_editable"
        )
    if draft.status == OrderStatus.COMPLETED.value:
        raise DomainError(
            "Ø¥ÙƒÙ…Ø§Ù„ Ø§Ù„Ø·Ù„Ø¨ ÙŠØªØ·Ù„Ø¨ ØªØ£ÙƒÙŠØ¯Ø§Ù‹ Ù…Ù†ÙØµÙ„Ø§Ù‹.",
            code="completion_requires_confirmation",
        )
    if draft.status not in _PATCHABLE_INCOMPLETE_STATUSES:
        raise DomainError("Ø§Ù†ØªÙ‚Ø§Ù„ Ø­Ø§Ù„Ø© Ø§Ù„Ø·Ù„Ø¨ ØºÙŠØ± Ù…Ø³Ù…ÙˆØ­.", code="invalid_status_transition")
    if not draft.items:
        raise DomainError("Ø§Ù„Ø·Ù„Ø¨ ÙŠØ¬Ø¨ Ø£Ù† ÙŠØ­ØªÙˆÙŠ Ø¹Ù„Ù‰ Ù…Ù†ØªØ¬ ÙˆØ§Ø­Ø¯ Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„.", code="empty_order")

    requested_keys = [_item_key(item.product_id, item.variant_id) for item in draft.items]
    if len(set(requested_keys)) != len(requested_keys):
        raise DomainError("Ù„Ø§ ÙŠÙ…ÙƒÙ† ØªÙƒØ±Ø§Ø± Ø§Ù„Ù…Ù†ØªØ¬ ÙÙŠ Ø§Ù„Ø·Ù„Ø¨.", code="duplicate_order_item")

    old_items = list(order.items)
    old_discount = money(order.discount)
    old_delivery_fee = money(order.delivery_fee)
    old_by_key = {
        _item_key(item.product_id, item.variant_id): item
        for item in old_items
        if item.product_id is not None
    }
    old_keys = set(old_by_key)
    requested_by_key = {_item_key(item.product_id, item.variant_id): item for item in draft.items}
    quantity_changed = [
        key
        for key in old_keys & set(requested_by_key)
        if old_by_key[key].quantity != requested_by_key[key].quantity
    ]
    price_changed = [
        key
        for key in old_keys & set(requested_by_key)
        if requested_by_key[key].unit_price is not None
        and money(old_by_key[key].unit_price) != money(requested_by_key[key].unit_price)
    ]
    customer_before = {
        "customer_name": order.customer_name,
        "customer_phone": order.customer_phone,
        "customer_email": order.customer_email,
        "address": order.address,
        "customer_notes": order.customer_notes,
        "payment_method": order.payment_method,
    }
    customer_after = {
        "customer_name": draft.customer_name.strip(),
        "customer_phone": draft.customer_phone.strip(),
        "customer_email": (draft.customer_email or "").strip() or None,
        "address": draft.address.strip(),
        "customer_notes": (draft.customer_notes or "").strip() or None,
        "payment_method": draft.payment_method,
    }
    material_change = any(
        (
            old_keys != set(requested_by_key),
            quantity_changed,
            price_changed,
            money(order.discount) != money(draft.discount),
            money(order.delivery_fee) != money(draft.delivery_fee),
            customer_before != customer_after,
            order.status != draft.status,
        )
    )
    reason = (draft.reason or "").strip() or None
    if material_change and reason is None:
        raise DomainError("Ø³Ø¨Ø¨ Ø§Ù„ØªØ¹Ø¯ÙŠÙ„ Ù…Ø·Ù„ÙˆØ¨.", code="edit_reason_required")

    # Return the existing reservation before validating the replacement against stock;
    # the same order's previously reserved units remain available to its new draft.
    _restore_stock(db, order)
    priced_lines = price_lines(
        db, [(item.product_id, item.variant_id, item.quantity) for item in draft.items]
    )
    new_items: list[OrderItem] = []
    for requested, priced in zip(draft.items, priced_lines, strict=True):
        old = old_by_key.get(_item_key(requested.product_id, requested.variant_id))
        unit_price = money(
            requested.unit_price
            if requested.unit_price is not None
            else (old.unit_price if old is not None else priced.unit_price)
        )
        new_items.append(
            OrderItem(
                product_id=priced.product.id,
                variant_id=priced.variant.id if priced.variant else None,
                item_kind="catalog",
                product_name=old.product_name if old is not None else priced.product.name,
                original_product_name=(
                    old.original_product_name if old is not None else priced.product.name
                ),
                sku=old.sku if old is not None else priced.sku,
                original_sku=old.original_sku if old is not None else priced.sku,
                variant_description=(
                    old.variant_description if old is not None else priced.variant_description
                ),
                original_variant_description=(
                    old.original_variant_description
                    if old is not None
                    else priced.variant_description
                ),
                original_unit_price=(
                    old.original_unit_price if old is not None else priced.unit_price
                ),
                unit_price=unit_price,
                quantity=requested.quantity,
                line_total=money(unit_price * requested.quantity),
            )
        )
    totals = calculate_order_totals(new_items, draft.discount, draft.delivery_fee)
    for item, line_total in zip(new_items, totals.line_totals, strict=True):
        item.line_total = line_total

    _apply_stock_delta(priced_lines, sign=-1)
    order.items[:] = new_items
    order.subtotal = totals.subtotal
    order.discount = totals.discount_amount
    order.delivery_fee = totals.delivery_fee
    order.total = totals.total_amount
    for field, value in customer_after.items():
        setattr(order, field, value)
    old_notes = order.admin_notes
    order.admin_notes = (draft.admin_notes or "").strip() or None

    for key in set(requested_by_key) - old_keys:
        record_order_activity(
            db, order_id=order.id, invoice_id=None, actor_admin_id=admin.id,
            event_type="order_item_added", before_data=None,
            after_data={"line": _item_snapshot(next(item for item in new_items if _item_key(item.product_id, item.variant_id) == key))}, reason=reason,
        )
    for key in old_keys - set(requested_by_key):
        record_order_activity(
            db, order_id=order.id, invoice_id=None, actor_admin_id=admin.id,
            event_type="order_item_removed", before_data={"line": _item_snapshot(old_by_key[key])},
            after_data=None, reason=reason,
        )
    new_by_key = {_item_key(item.product_id, item.variant_id): item for item in new_items}
    for key in quantity_changed:
        record_order_activity(
            db, order_id=order.id, invoice_id=None, actor_admin_id=admin.id,
            event_type="order_item_quantity_changed",
            before_data={"line": _item_snapshot(old_by_key[key])},
            after_data={"line": _item_snapshot(new_by_key[key])}, reason=reason,
        )
    for key in price_changed:
        record_order_activity(
            db, order_id=order.id, invoice_id=None, actor_admin_id=admin.id,
            event_type="order_item_price_changed",
            before_data={"line": _item_snapshot(old_by_key[key])},
            after_data={"line": _item_snapshot(new_by_key[key])}, reason=reason,
        )
    for event_type, before, after, field in (
        ("order_discount_changed", old_discount, totals.discount_amount, "discount_amount"),
        ("order_delivery_fee_changed", old_delivery_fee, totals.delivery_fee, "delivery_fee"),
    ):
        if money(before) != money(after):
            record_order_activity(
                db, order_id=order.id, invoice_id=None, actor_admin_id=admin.id,
                event_type=event_type, before_data={field: before}, after_data={field: after}, reason=reason,
            )
    if customer_before != customer_after:
        record_order_activity(
            db, order_id=order.id, invoice_id=None, actor_admin_id=admin.id,
            event_type="order_customer_updated", before_data={"customer": customer_before},
            after_data={"customer": customer_after}, reason=reason,
        )
    if old_notes != order.admin_notes:
        record_order_activity(
            db, order_id=order.id, invoice_id=None, actor_admin_id=admin.id,
            event_type="order_notes_updated", before_data={"admin_notes": old_notes},
            after_data={"admin_notes": order.admin_notes}, reason=reason,
        )
    old_status = order.status
    if old_status != draft.status:
        order.status = draft.status
        if draft.status == OrderStatus.CANCELLED.value:
            _restore_stock(db, order)
            order.is_locked = True
            order.locked_at = utcnow()
        db.add(
            OrderStatusHistory(
                order_id=order.id,
                old_status=old_status,
                new_status=draft.status,
                admin_user_id=admin.id,
                note=reason,
            )
        )
        record_order_activity(
            db, order_id=order.id, invoice_id=None, actor_admin_id=admin.id,
            event_type="order_status_changed", before_data={"status": old_status},
            after_data={"status": draft.status}, reason=reason,
        )
    order.updated_at = utcnow()
    audit_service.record(
        db, admin=admin, action="order.edited", entity_type="order", entity_id=order.id,
        meta={"order_number": order.order_number},
    )
    db.flush()
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
