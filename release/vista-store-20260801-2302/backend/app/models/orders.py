from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import OrderStatus, PaymentMethod
from app.db.base import Base, TimestampMixin, utcnow


class Order(TimestampMixin, Base):
    """Guest order. Delivery/coupon values are snapshots taken at creation time."""

    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_number: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    public_token: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    status: Mapped[str] = mapped_column(
        String(32), default=OrderStatus.PENDING.value, nullable=False, index=True
    )

    customer_name: Mapped[str] = mapped_column(String(150), nullable=False)
    customer_phone: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    customer_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    address: Mapped[str] = mapped_column(Text, nullable=False)

    delivery_area_id: Mapped[int | None] = mapped_column(
        ForeignKey("delivery_areas.id", ondelete="SET NULL"), nullable=True
    )
    delivery_area_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    delivery_fee: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), default=Decimal("0.00"), nullable=False
    )

    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    discount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), default=Decimal("0.00"), nullable=False
    )
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    coupon_code: Mapped[str | None] = mapped_column(String(64), nullable=True)

    payment_method: Mapped[str] = mapped_column(
        String(32), default=PaymentMethod.CASH_ON_DELIVERY.value, nullable=False
    )
    customer_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    admin_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order", cascade="all, delete-orphan", order_by="OrderItem.id"
    )
    status_history: Mapped[list["OrderStatusHistory"]] = relationship(
        back_populates="order",
        cascade="all, delete-orphan",
        order_by="OrderStatusHistory.id",
    )
    # At most one, ever. Not cascaded: an invoice outlives any attempt to tidy up orders,
    # and the FK is RESTRICT so an invoiced order cannot be deleted out from under it.
    invoice = relationship("Invoice", back_populates="order", uselist=False)

    __table_args__ = (
        CheckConstraint("subtotal >= 0", name="ck_orders_subtotal_non_negative"),
        CheckConstraint("total >= 0", name="ck_orders_total_non_negative"),
    )


class OrderItem(Base):
    """Immutable snapshot of a purchased line."""

    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True
    )
    product_id: Mapped[int | None] = mapped_column(
        ForeignKey("products.id", ondelete="SET NULL"), nullable=True
    )
    variant_id: Mapped[int | None] = mapped_column(
        ForeignKey("product_variants.id", ondelete="SET NULL"), nullable=True
    )

    product_name: Mapped[str] = mapped_column(String(250), nullable=False)
    sku: Mapped[str | None] = mapped_column(String(64), nullable=True)
    variant_description: Mapped[str | None] = mapped_column(String(200), nullable=True)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    line_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    order: Mapped[Order] = relationship(back_populates="items")

    __table_args__ = (CheckConstraint("quantity > 0", name="ck_order_item_quantity_positive"),)


class OrderStatusHistory(Base):
    __tablename__ = "order_status_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True
    )
    old_status: Mapped[str | None] = mapped_column(String(32), nullable=True)
    new_status: Mapped[str] = mapped_column(String(32), nullable=False)
    admin_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("admin_users.id", ondelete="SET NULL"), nullable=True
    )
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)

    order: Mapped[Order] = relationship(back_populates="status_history")
