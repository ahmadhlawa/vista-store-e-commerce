from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

import pytest
from sqlalchemy.orm import Session

from app.core.enums import AdminRole, PaymentStatus
from app.models import Order
from app.services.errors import DomainError, PermissionDeniedError
from app.services.invoices import validate_payment_update
from app.services.orders import calculate_order_totals, record_order_activity


@dataclass
class _Line:
    quantity: int
    unit_price: Decimal


def test_calculate_order_totals_quantizes_lines_and_never_returns_negative_total() -> None:
    totals = calculate_order_totals(
        [_Line(3, Decimal("1.005")), _Line(1, Decimal("2.004"))],
        discount_amount=Decimal("99.00"),
        delivery_fee=Decimal("0.005"),
    )

    assert totals.line_totals == (Decimal("3.03"), Decimal("2.00"))
    assert totals.subtotal == Decimal("5.03")
    assert totals.discount_amount == Decimal("99.00")
    assert totals.delivery_fee == Decimal("0.01")
    assert totals.total_amount == Decimal("0.00")


@pytest.mark.parametrize(
    ("items", "discount_amount", "delivery_fee"),
    [
        ([_Line(0, Decimal("1.00"))], Decimal("0.00"), Decimal("0.00")),
        ([_Line(1, Decimal("-1.00"))], Decimal("0.00"), Decimal("0.00")),
        ([_Line(1, Decimal("1.00"))], Decimal("-0.01"), Decimal("0.00")),
        ([_Line(1, Decimal("1.00"))], Decimal("0.00"), Decimal("-0.01")),
    ],
)
def test_calculate_order_totals_rejects_negative_money_and_nonpositive_quantities(
    items: list[_Line], discount_amount: Decimal, delivery_fee: Decimal
) -> None:
    with pytest.raises(DomainError):
        calculate_order_totals(items, discount_amount=discount_amount, delivery_fee=delivery_fee)


@pytest.mark.parametrize(
    ("total", "paid", "refunded", "status", "remaining"),
    [
        ("10.00", "0.00", "0.00", PaymentStatus.UNPAID, "10.00"),
        ("10.00", "4.00", "0.00", PaymentStatus.PARTIAL, "6.00"),
        ("10.00", "10.00", "0.00", PaymentStatus.PAID, "0.00"),
        ("10.00", "10.00", "3.00", PaymentStatus.PARTIALLY_REFUNDED, "3.00"),
        ("10.00", "10.00", "10.00", PaymentStatus.REFUNDED, "10.00"),
    ],
)
def test_payment_validation_derives_status_and_nonnegative_remaining_amount(
    total: str, paid: str, refunded: str, status: PaymentStatus, remaining: str
) -> None:
    update = validate_payment_update(
        total_amount=Decimal(total),
        current_paid_amount=Decimal("0.00"),
        paid_amount=Decimal(paid),
        refunded_amount=Decimal(refunded),
        actor_role=AdminRole.SUPER_ADMIN.value,
        reason="Documented correction" if refunded != "0.00" else None,
    )

    assert update.status == status
    assert update.remaining_amount == Decimal(remaining)


@pytest.mark.parametrize(
    ("total", "paid", "refunded"),
    [
        ("-1.00", "0.00", "0.00"),
        ("10.00", "-0.01", "0.00"),
        ("10.00", "0.00", "-0.01"),
        ("10.00", "10.01", "0.00"),
        ("10.00", "5.00", "5.01"),
    ],
)
def test_payment_validation_rejects_negative_and_out_of_bounds_amounts(
    total: str, paid: str, refunded: str
) -> None:
    with pytest.raises(DomainError):
        validate_payment_update(
            total_amount=Decimal(total),
            current_paid_amount=Decimal("0.00"),
            paid_amount=Decimal(paid),
            refunded_amount=Decimal(refunded),
            actor_role=AdminRole.SUPER_ADMIN.value,
            reason="Documented correction",
        )


def test_routine_admin_cannot_lower_paid_amount_or_record_a_refund() -> None:
    with pytest.raises(PermissionDeniedError):
        validate_payment_update(
            total_amount=Decimal("10.00"),
            current_paid_amount=Decimal("8.00"),
            paid_amount=Decimal("7.00"),
            refunded_amount=Decimal("0.00"),
            actor_role=AdminRole.ADMIN.value,
            reason=None,
        )

    with pytest.raises(PermissionDeniedError):
        validate_payment_update(
            total_amount=Decimal("10.00"),
            current_paid_amount=Decimal("10.00"),
            paid_amount=Decimal("10.00"),
            refunded_amount=Decimal("1.00"),
            actor_role=AdminRole.ADMIN.value,
            reason=None,
        )


@pytest.mark.parametrize("paid,refunded", [("7.00", "0.00"), ("10.00", "1.00")])
def test_super_admin_correction_or_refund_requires_a_nonempty_reason(
    paid: str, refunded: str
) -> None:
    with pytest.raises(DomainError, match="reason"):
        validate_payment_update(
            total_amount=Decimal("10.00"),
            current_paid_amount=Decimal("10.00"),
            paid_amount=Decimal(paid),
            refunded_amount=Decimal(refunded),
            actor_role=AdminRole.SUPER_ADMIN.value,
            reason="  ",
        )


def test_record_order_activity_stores_stable_snapshots_and_reason(db: Session) -> None:
    order = Order(
        order_number="ORD-ACTIVITY",
        public_token="activity-token",
        customer_name="Customer",
        customer_phone="0590000000",
        address="Address",
        subtotal=Decimal("10.00"),
        total=Decimal("10.00"),
    )
    db.add(order)
    db.flush()
    before = {"unit_price": Decimal("10.00"), "line": {"quantity": 1}}
    after = {"unit_price": Decimal("12.50"), "line": {"quantity": 2}}

    event = record_order_activity(
        db,
        order_id=order.id,
        invoice_id=None,
        actor_admin_id=None,
        event_type="order_item_price_changed",
        before_data=before,
        after_data=after,
        reason="Customer agreed to the change",
    )
    before["line"]["quantity"] = 99
    after["unit_price"] = Decimal("0.00")
    db.commit()
    db.expire_all()

    saved = db.get(type(event), event.id)
    assert saved.before_data == {"unit_price": "10.00", "line": {"quantity": 1}}
    assert saved.after_data == {"unit_price": "12.50", "line": {"quantity": 2}}
    assert saved.reason == "Customer agreed to the change"

