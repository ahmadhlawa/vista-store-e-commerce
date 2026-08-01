"""Order creation, status transitions and inventory movement.

Every write here happens inside the caller's transaction: the endpoint commits once,
so an order, its items, its stock movements and the coupon counter either all land or
none of them do.
"""

from __future__ import annotations

import secrets
from dataclasses import dataclass
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.enums import OrderStatus, PaymentMethod
from app.db.base import utcnow
from app.models import AdminUser, Order, OrderItem, OrderStatusHistory, Product, ProductVariant
from app.services import audit as audit_service
from app.services.errors import DomainError, NotFoundError
from app.services.pricing import PricedCart, money, price_cart

ORDER_NUMBER_PREFIX = "ORD"

# Statuses that mean stock is currently committed to the order.
_STOCK_HELD_STATUSES = {
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
    if not draft.items:
        raise DomainError("العربة فارغة.", code="empty_cart")

    priced = price_cart(
        db,
        draft.items,
        coupon_code=draft.coupon_code,
        delivery_area_id=draft.delivery_area_id,
    )

    order = Order(
        order_number=generate_order_number(db),
        public_token=secrets.token_urlsafe(24),
        status=OrderStatus.PENDING.value,
        customer_name=draft.customer_name.strip(),
        customer_phone=draft.customer_phone.strip(),
        customer_email=(draft.customer_email or "").strip() or None,
        address=draft.address.strip(),
        delivery_area_id=priced.delivery_area.id if priced.delivery_area else None,
        delivery_area_name=priced.delivery_area.name if priced.delivery_area else None,
        delivery_fee=priced.delivery_fee,
        subtotal=priced.subtotal,
        discount=priced.discount,
        total=priced.total,
        coupon_code=priced.coupon.code if priced.coupon else None,
        payment_method=draft.payment_method,
        customer_notes=(draft.customer_notes or "").strip() or None,
    )

    for line in priced.lines:
        order.items.append(
            OrderItem(
                product_id=line.product.id,
                variant_id=line.variant.id if line.variant else None,
                product_name=line.product.name,
                sku=line.sku,
                variant_description=line.variant_description,
                unit_price=line.unit_price,
                quantity=line.quantity,
                line_total=line.line_total,
            )
        )

    order.status_history.append(
        OrderStatusHistory(
            old_status=None,
            new_status=OrderStatus.PENDING.value,
            note="تم إنشاء الطلب من المتجر.",
        )
    )

    _apply_stock_delta(priced, sign=-1)
    if priced.coupon is not None:
        priced.coupon.used_count += 1

    db.add(order)
    db.flush()
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
