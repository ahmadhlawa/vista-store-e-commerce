from __future__ import annotations

import re
from typing import Literal

from pydantic import EmailStr, Field, field_validator

from app.core.enums import OrderSource, OrderStatus, PaymentMethod, PaymentStatus
from app.schemas.common import APIModel, Money, UTCDateTime
from app.schemas.invoices import InvoiceSummary

PHONE_PATTERN = re.compile(r"^\+?\d{7,15}$")


class OrderItemIn(APIModel):
    product_id: int
    variant_id: int | None = None
    quantity: int = Field(gt=0, le=999)


class OrderCreate(APIModel):
    """The client sends what it wants to buy. It never sends prices or totals."""

    client_reference: str = Field(min_length=8, max_length=64)
    customer_name: str = Field(min_length=3, max_length=150)
    customer_phone: str = Field(min_length=7, max_length=40)
    customer_email: EmailStr | None = None
    address: str = Field(min_length=6, max_length=1000)
    delivery_area_id: int | None = None
    coupon_code: str | None = Field(default=None, max_length=64)
    payment_method: PaymentMethod = PaymentMethod.CASH_ON_DELIVERY
    customer_notes: str | None = Field(default=None, max_length=1000)
    items: list[OrderItemIn] = Field(min_length=1, max_length=100)

    @field_validator("customer_phone")
    @classmethod
    def _normalize_phone(cls, value: str) -> str:
        cleaned = re.sub(r"[\s\-()]", "", value)
        if not PHONE_PATTERN.match(cleaned):
            raise ValueError("phone number must contain 7 to 15 digits")
        return cleaned


class CartPricingRequest(APIModel):
    """Re-price a cart before checkout without creating anything."""

    items: list[OrderItemIn] = Field(min_length=1, max_length=100)
    coupon_code: str | None = Field(default=None, max_length=64)
    delivery_area_id: int | None = None


class CartPricingLine(APIModel):
    product_id: int
    variant_id: int | None = None
    product_name: str
    slug: str
    variant_description: str | None = None
    unit_price: Money
    quantity: int
    line_total: Money
    primary_image_url: str | None = None


class CartPricingResponse(APIModel):
    lines: list[CartPricingLine]
    subtotal: Money
    discount: Money
    delivery_fee: Money
    total: Money
    coupon_code: str | None = None
    delivery_area_name: str | None = None


class OrderItemOut(APIModel):
    id: int
    product_id: int | None = None
    variant_id: int | None = None
    product_name: str
    sku: str | None = None
    variant_description: str | None = None
    unit_price: Money
    quantity: int
    line_total: Money


class OrderAdminItemOut(OrderItemOut):
    item_kind: str = "catalog"
    manual_description: str | None = None
    original_product_name: str | None = None
    original_sku: str | None = None
    original_variant_description: str | None = None
    original_unit_price: Money | None = None


class OrderStatusHistoryOut(APIModel):
    id: int
    old_status: OrderStatus | None = None
    new_status: OrderStatus
    admin_user_id: int | None = None
    note: str | None = None
    created_at: UTCDateTime


class OrderPublicOut(APIModel):
    """Confirmation view. Contains no admin notes and no internal identifiers."""

    order_number: str
    status: OrderStatus
    customer_name: str
    delivery_area_name: str | None = None
    delivery_fee: Money
    subtotal: Money
    discount: Money
    total: Money
    coupon_code: str | None = None
    payment_method: PaymentMethod
    created_at: UTCDateTime
    items: list[OrderItemOut] = Field(default_factory=list)


class OrderCreatedOut(OrderPublicOut):
    """Returned once, at creation, so the browser can look the order up again."""

    id: int
    source: OrderSource
    customer_phone: str
    address: str
    customer_notes: str | None = None
    public_token: str


class OrderAdminListOut(APIModel):
    id: int
    order_number: str
    status: OrderStatus
    source: OrderSource
    customer_name: str
    customer_phone: str
    delivery_area_name: str | None = None
    total: Money
    payment_method: PaymentMethod
    payment_status: PaymentStatus
    items_count: int = 0
    created_at: UTCDateTime


class OrderAdminOut(APIModel):
    id: int
    order_number: str
    status: OrderStatus
    source: OrderSource
    source_note: str | None = None
    customer_name: str
    customer_phone: str
    customer_email: EmailStr | None = None
    address: str
    delivery_area_id: int | None = None
    delivery_area_name: str | None = None
    delivery_fee: Money
    subtotal: Money
    discount: Money
    total: Money
    coupon_code: str | None = None
    payment_method: PaymentMethod
    payment_status: PaymentStatus
    customer_notes: str | None = None
    admin_notes: str | None = None
    created_at: UTCDateTime
    updated_at: UTCDateTime
    items: list[OrderAdminItemOut] = Field(default_factory=list)
    status_history: list[OrderStatusHistoryOut] = Field(default_factory=list)
    activities: list["OrderActivityOut"] = Field(default_factory=list)
    active_invoice: InvoiceSummary | None = None
    invoices: list[InvoiceSummary] = Field(default_factory=list)
    # None until the order is first confirmed. Present and `cancelled` afterwards, even
    # once the order itself is cancelled — the invoice is never removed.
    invoice: InvoiceSummary | None = None


class OrderActivityOut(APIModel):
    id: int
    invoice_id: int | None = None
    actor_admin_id: int | None = None
    event_type: str
    before_data: dict | None = None
    after_data: dict | None = None
    reason: str | None = None
    created_at: UTCDateTime


class AdminOrderItemInput(APIModel):
    kind: Literal["catalog"] = "catalog"
    product_id: int
    variant_id: int | None = None
    quantity: int = Field(gt=0, le=999)
    unit_price: Money | None = Field(default=None, ge=0)


class OrderAdminUpdate(APIModel):
    customer_name: str = Field(min_length=3, max_length=150)
    customer_phone: str = Field(min_length=7, max_length=40)
    customer_email: EmailStr | None = None
    address: str = Field(min_length=6, max_length=1000)
    payment_method: PaymentMethod
    customer_notes: str | None = Field(default=None, max_length=1000)
    admin_notes: str | None = Field(default=None, max_length=2000)
    discount: Money = Field(ge=0)
    delivery_fee: Money = Field(ge=0)
    status: OrderStatus
    reason: str | None = Field(default=None, max_length=500)
    items: list[AdminOrderItemInput] = Field(min_length=1, max_length=100)

    @field_validator("customer_phone")
    @classmethod
    def _normalize_phone(cls, value: str) -> str:
        cleaned = re.sub(r"[\s\-()]", "", value)
        if not PHONE_PATTERN.match(cleaned):
            raise ValueError("phone number must contain 7 to 15 digits")
        return cleaned


class OrderStatusUpdate(APIModel):
    status: OrderStatus
    note: str | None = Field(default=None, max_length=500)


class OrderNotesUpdate(APIModel):
    admin_notes: str | None = Field(default=None, max_length=2000)


class DashboardSummary(APIModel):
    products_total: int
    products_active: int
    categories_total: int
    articles_published: int
    coupons_active: int
    orders_total: int
    orders_pending: int
    orders_by_status: dict[str, int]
    revenue_total: Money
    low_stock_products: int
    recent_orders: list[OrderAdminListOut] = Field(default_factory=list)
