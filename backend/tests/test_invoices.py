"""Invoicing: issuance, idempotency, immutability, numbering, cancellation, tax, access."""

from __future__ import annotations

from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.enums import InvoiceStatus, OrderStatus
from app.models import DeliveryArea, Invoice, Order, Product
from app.services import invoices as invoices_service
from app.services import orders as orders_service
from app.services import store_settings as settings_service
from tests.conftest import auth, make_product


def _place_order(
    client: TestClient,
    product: Product,
    *,
    quantity: int = 2,
    **overrides,
) -> dict:
    payload = {
        "customer_name": "سارة أحمد",
        "customer_phone": "0591234567",
        "address": "رام الله، شارع الإرسال، بناية ٥",
        "items": [{"product_id": product.id, "quantity": quantity}],
    }
    payload.update(overrides)
    response = client.post("/api/v1/orders", json=payload)
    assert response.status_code == 201, response.text
    return response.json()


def _order_row(db: Session, order_number: str) -> Order:
    db.expire_all()
    return orders_service.get_by_number(db, order_number)


def _set_status(client: TestClient, token: str, order_id: int, status: str, note=None):
    return client.post(
        f"/api/v1/admin/orders/{order_id}/status",
        json={"status": status, "note": note},
        headers=auth(token),
    )


@pytest.fixture()
def product(db: Session, category) -> Product:
    return make_product(db, price="100.00", stock=50, category_id=category.id)


# ── issuance ─────────────────────────────────────────────────────────────────
def test_a_pending_order_has_no_invoice(
    client: TestClient, db: Session, product: Product, admin_token: str
) -> None:
    created = _place_order(client, product)
    order = _order_row(db, created["order_number"])

    assert order.status == OrderStatus.PENDING.value
    assert invoices_service.get_for_order(db, order.id) is None

    detail = client.get(f"/api/v1/admin/orders/{order.id}", headers=auth(admin_token))
    assert detail.json()["invoice"] is None

    missing = client.get(
        f"/api/v1/admin/orders/{order.id}/invoice", headers=auth(admin_token)
    )
    assert missing.status_code == 404
    assert missing.json()["error"]["code"] == "invoice_not_found"


def test_confirming_an_order_issues_exactly_one_invoice(
    client: TestClient, db: Session, product: Product, admin_token: str
) -> None:
    created = _place_order(client, product)
    order = _order_row(db, created["order_number"])

    response = _set_status(client, admin_token, order.id, OrderStatus.CONFIRMED.value)
    assert response.status_code == 200

    summary = response.json()["invoice"]
    assert summary is not None
    assert summary["status"] == InvoiceStatus.ISSUED.value
    assert summary["invoice_number"].startswith("INV-")

    db.expire_all()
    assert db.query(Invoice).filter(Invoice.order_id == order.id).count() == 1


def test_repeating_the_same_confirmation_creates_no_duplicate(
    client: TestClient, db: Session, product: Product, admin_token: str
) -> None:
    created = _place_order(client, product)
    order = _order_row(db, created["order_number"])

    first = _set_status(client, admin_token, order.id, OrderStatus.CONFIRMED.value)
    number = first.json()["invoice"]["invoice_number"]

    # Same status again — the transition is a no-op.
    again = _set_status(client, admin_token, order.id, OrderStatus.CONFIRMED.value)
    assert again.json()["invoice"]["invoice_number"] == number

    # And a genuine round trip away from confirmed and back.
    _set_status(client, admin_token, order.id, OrderStatus.PROCESSING.value)
    reconfirmed = _set_status(client, admin_token, order.id, OrderStatus.CONFIRMED.value)
    assert reconfirmed.json()["invoice"]["invoice_number"] == number

    db.expire_all()
    assert db.query(Invoice).filter(Invoice.order_id == order.id).count() == 1


def test_a_replaced_invoice_and_its_active_replacement_can_share_an_order(
    db: Session, product: Product
) -> None:
    """Archived invoices remain when a corrected invoice replaces them."""

    order = orders_service.create_order(
        db,
        orders_service.OrderDraft(
            customer_name="سارة أحمد",
            customer_phone="0591234567",
            address="رام الله، شارع الإرسال",
            items=[(product.id, None, 1)],
        ),
    )
    db.commit()

    first = invoices_service.issue_for_order(db, order)
    db.commit()

    first.status = InvoiceStatus.REPLACED.value
    replacement = Invoice(
        invoice_number="INV-999999",
        order_id=order.id,
        status=InvoiceStatus.ACTIVE.value,
        order_number=order.order_number,
        payment_method=order.payment_method,
        store_name="Store",
        customer_name=order.customer_name,
        customer_phone=order.customer_phone,
        delivery_address=order.address,
        currency_code="ILS",
        currency_symbol="₪",
        subtotal=order.subtotal,
        discount=order.discount,
        delivery_fee=order.delivery_fee,
        tax_amount=Decimal("0.00"),
        grand_total=order.total,
        replacement_invoice=first,
    )
    db.add(replacement)
    db.commit()

    assert replacement.replacement_invoice_id == first.id
    assert replacement.invoice_number == "INV-999999"


# ── numbering ────────────────────────────────────────────────────────────────
def test_invoice_numbers_are_sequential_and_unique(
    client: TestClient, db: Session, product: Product, admin_token: str
) -> None:
    numbers = []
    for _ in range(3):
        created = _place_order(client, product, quantity=1)
        order = _order_row(db, created["order_number"])
        response = _set_status(client, admin_token, order.id, OrderStatus.CONFIRMED.value)
        numbers.append(response.json()["invoice"]["invoice_number"])

    assert numbers == ["INV-000001", "INV-000002", "INV-000003"]
    assert len(set(numbers)) == 3


def test_a_cancelled_invoice_number_is_never_reused(
    client: TestClient, db: Session, product: Product, admin_token: str
) -> None:
    first = _place_order(client, product, quantity=1)
    first_order = _order_row(db, first["order_number"])
    _set_status(client, admin_token, first_order.id, OrderStatus.CONFIRMED.value)
    cancelled = _set_status(
        client, admin_token, first_order.id, OrderStatus.CANCELLED.value, note="اختبار"
    )
    burned_number = cancelled.json()["invoice"]["invoice_number"]

    second = _place_order(client, product, quantity=1)
    second_order = _order_row(db, second["order_number"])
    reissued = _set_status(client, admin_token, second_order.id, OrderStatus.CONFIRMED.value)

    assert reissued.json()["invoice"]["invoice_number"] != burned_number
    assert reissued.json()["invoice"]["invoice_number"] == "INV-000002"


def test_the_number_prefix_is_configurable(
    client: TestClient, db: Session, product: Product, admin_token: str
) -> None:
    client.patch(
        "/api/v1/admin/settings",
        json={"invoice_prefix": "VS"},
        headers=auth(admin_token),
    )
    created = _place_order(client, product, quantity=1)
    order = _order_row(db, created["order_number"])
    response = _set_status(client, admin_token, order.id, OrderStatus.CONFIRMED.value)

    assert response.json()["invoice"]["invoice_number"] == "VS-000001"


# ── the snapshot ─────────────────────────────────────────────────────────────
def test_the_invoice_matches_the_order_it_was_issued_for(
    client: TestClient,
    db: Session,
    product: Product,
    admin_token: str,
    delivery_area: DeliveryArea,
) -> None:
    settings_row = settings_service.get_or_create_settings(db)
    settings_row.store_name = "Vista Store"
    settings_row.store_name_ar = "متجر فيستا"
    settings_row.phone = "0000000000"
    db.commit()

    created = _place_order(
        client,
        product,
        quantity=2,
        delivery_area_id=delivery_area.id,
        customer_email="sara@example.com",
        customer_notes="اتصلوا قبل التوصيل",
    )
    order = _order_row(db, created["order_number"])
    _set_status(client, admin_token, order.id, OrderStatus.CONFIRMED.value)

    invoice = client.get(
        f"/api/v1/admin/orders/{order.id}/invoice", headers=auth(admin_token)
    ).json()

    assert invoice["order_number"] == order.order_number
    assert invoice["store_name"] == "متجر فيستا"
    assert invoice["store_phone"] == "0000000000"
    assert invoice["customer_name"] == "سارة أحمد"
    assert invoice["customer_phone"] == "0591234567"
    assert invoice["customer_email"] == "sara@example.com"
    assert invoice["delivery_address"] == order.address
    assert invoice["delivery_area_name"] == delivery_area.name
    assert invoice["customer_notes"] == "اتصلوا قبل التوصيل"
    assert invoice["payment_method"] == "cash_on_delivery"
    assert invoice["currency_code"] == "ILS"
    assert invoice["subtotal"] == float(order.subtotal)
    assert invoice["discount"] == float(order.discount)
    assert invoice["delivery_fee"] == float(order.delivery_fee)
    assert invoice["grand_total"] == float(order.total)
    assert invoice["status"] == InvoiceStatus.ISSUED.value

    assert len(invoice["items"]) == 1
    line = invoice["items"][0]
    assert line["product_name"] == product.name
    assert line["quantity"] == 2
    assert line["unit_price"] == 100.0
    assert line["line_total"] == 200.0


def test_editing_the_product_afterwards_does_not_change_the_invoice(
    client: TestClient, db: Session, product: Product, admin_token: str
) -> None:
    created = _place_order(client, product, quantity=2)
    order = _order_row(db, created["order_number"])
    _set_status(client, admin_token, order.id, OrderStatus.CONFIRMED.value)

    number = invoices_service.get_for_order(db, order.id).invoice_number

    client.patch(
        f"/api/v1/admin/products/{product.id}",
        json={"price": 999, "name": "اسم جديد تماماً"},
        headers=auth(admin_token),
    )

    invoice = client.get(
        f"/api/v1/admin/invoices/{number}", headers=auth(admin_token)
    ).json()
    assert invoice["items"][0]["unit_price"] == 100.0
    assert invoice["items"][0]["line_total"] == 200.0
    assert invoice["items"][0]["product_name"] != "اسم جديد تماماً"
    assert invoice["grand_total"] == 200.0


def test_renaming_the_store_afterwards_does_not_change_the_invoice(
    client: TestClient, db: Session, product: Product, admin_token: str
) -> None:
    created = _place_order(client, product, quantity=1)
    order = _order_row(db, created["order_number"])
    _set_status(client, admin_token, order.id, OrderStatus.CONFIRMED.value)
    number = invoices_service.get_for_order(db, order.id).invoice_number

    client.patch(
        "/api/v1/admin/settings",
        json={"store_name": "متجر آخر", "phone": "0599999999"},
        headers=auth(admin_token),
    )

    invoice = client.get(
        f"/api/v1/admin/invoices/{number}", headers=auth(admin_token)
    ).json()
    assert invoice["store_name"] != "متجر آخر"


def test_an_issued_invoice_cannot_be_edited_or_deleted(
    client: TestClient, db: Session, product: Product, admin_token: str
) -> None:
    created = _place_order(client, product, quantity=1)
    order = _order_row(db, created["order_number"])
    _set_status(client, admin_token, order.id, OrderStatus.CONFIRMED.value)
    number = invoices_service.get_for_order(db, order.id).invoice_number

    for method in ("patch", "put"):
        response = getattr(client, method)(
            f"/api/v1/admin/invoices/{number}",
            json={"grand_total": 1},
            headers=auth(admin_token),
        )
        assert response.status_code == 405

    assert (
        client.delete(f"/api/v1/admin/invoices/{number}", headers=auth(admin_token)).status_code
        == 405
    )


# ── cancellation ─────────────────────────────────────────────────────────────
def test_cancelling_the_order_cancels_its_invoice_but_keeps_it(
    client: TestClient, db: Session, product: Product, admin_token: str, normal_admin
) -> None:
    created = _place_order(client, product, quantity=2)
    order = _order_row(db, created["order_number"])
    _set_status(client, admin_token, order.id, OrderStatus.CONFIRMED.value)
    number = invoices_service.get_for_order(db, order.id).invoice_number

    _set_status(
        client, admin_token, order.id, OrderStatus.CANCELLED.value, note="طلب العميل الإلغاء"
    )

    invoice = client.get(
        f"/api/v1/admin/invoices/{number}", headers=auth(admin_token)
    ).json()
    assert invoice["status"] == InvoiceStatus.CANCELLED.value
    assert invoice["invoice_number"] == number
    assert invoice["cancelled_at"] is not None
    assert invoice["cancellation_reason"] == "طلب العميل الإلغاء"
    assert invoice["cancelled_by_admin_id"] == normal_admin.id
    # The snapshot survives cancellation untouched.
    assert invoice["grand_total"] == 200.0
    assert len(invoice["items"]) == 1


def test_cancelling_from_the_invoice_screen_cancels_the_order_too(
    client: TestClient, db: Session, product: Product, admin_token: str
) -> None:
    created = _place_order(client, product, quantity=2)
    order = _order_row(db, created["order_number"])
    _set_status(client, admin_token, order.id, OrderStatus.CONFIRMED.value)
    number = invoices_service.get_for_order(db, order.id).invoice_number

    response = client.post(
        f"/api/v1/admin/invoices/{number}/cancel",
        json={"reason": "نفدت الكمية"},
        headers=auth(admin_token),
    )
    assert response.status_code == 200
    assert response.json()["status"] == InvoiceStatus.CANCELLED.value

    order_detail = client.get(
        f"/api/v1/admin/orders/{order.id}", headers=auth(admin_token)
    ).json()
    assert order_detail["status"] == OrderStatus.CANCELLED.value

    # Stock came back exactly once.
    db.expire_all()
    assert db.get(Product, product.id).stock_quantity == 50


def test_cancelling_an_already_cancelled_order_is_rejected_not_double_applied(
    client: TestClient, db: Session, product: Product, admin_token: str
) -> None:
    created = _place_order(client, product, quantity=2)
    order = _order_row(db, created["order_number"])
    _set_status(client, admin_token, order.id, OrderStatus.CONFIRMED.value)
    number = invoices_service.get_for_order(db, order.id).invoice_number

    first = client.post(
        f"/api/v1/admin/invoices/{number}/cancel", json={}, headers=auth(admin_token)
    )
    assert first.status_code == 200

    second = client.post(
        f"/api/v1/admin/invoices/{number}/cancel", json={}, headers=auth(admin_token)
    )
    assert second.status_code == 409
    assert second.json()["error"]["code"] == "order_already_cancelled"

    # Inventory restoration stayed idempotent.
    db.expire_all()
    assert db.get(Product, product.id).stock_quantity == 50


def test_a_cancelled_order_never_gets_a_second_invoice(
    client: TestClient, db: Session, product: Product, admin_token: str
) -> None:
    created = _place_order(client, product, quantity=1)
    order = _order_row(db, created["order_number"])
    _set_status(client, admin_token, order.id, OrderStatus.CONFIRMED.value)
    _set_status(client, admin_token, order.id, OrderStatus.CANCELLED.value)

    # A cancelled order refuses any further transition, so it can never re-issue.
    blocked = _set_status(client, admin_token, order.id, OrderStatus.CONFIRMED.value)
    assert blocked.status_code == 400
    assert blocked.json()["error"]["code"] == "order_cancelled"

    db.expire_all()
    assert db.query(Invoice).filter(Invoice.order_id == order.id).count() == 1


def test_cancelling_an_uninvoiced_order_still_works(
    client: TestClient, db: Session, product: Product, admin_token: str
) -> None:
    created = _place_order(client, product, quantity=2)
    order = _order_row(db, created["order_number"])

    response = _set_status(client, admin_token, order.id, OrderStatus.CANCELLED.value)
    assert response.status_code == 200
    assert response.json()["invoice"] is None

    db.expire_all()
    assert db.get(Product, product.id).stock_quantity == 50


# ── tax ──────────────────────────────────────────────────────────────────────
def test_tax_is_disabled_by_default_and_totals_match_the_order(
    client: TestClient, db: Session, product: Product, admin_token: str
) -> None:
    settings_row = settings_service.get_or_create_settings(db)
    db.commit()
    assert settings_row.tax_enabled is False
    assert settings_row.tax_rate == Decimal("0.000")

    created = _place_order(client, product, quantity=3)
    order = _order_row(db, created["order_number"])
    _set_status(client, admin_token, order.id, OrderStatus.CONFIRMED.value)

    invoice = invoices_service.get_for_order(db, order.id)
    assert invoice.tax_enabled is False
    assert invoice.tax_amount == Decimal("0.00")
    assert invoice.grand_total == order.total


def test_enabling_exclusive_tax_adds_it_on_top(
    client: TestClient, db: Session, product: Product, admin_token: str
) -> None:
    client.patch(
        "/api/v1/admin/settings",
        json={"tax_enabled": True, "tax_rate": 16, "prices_include_tax": False},
        headers=auth(admin_token),
    )
    created = _place_order(client, product, quantity=1)  # total 100.00
    order = _order_row(db, created["order_number"])
    _set_status(client, admin_token, order.id, OrderStatus.CONFIRMED.value)

    invoice = invoices_service.get_for_order(db, order.id)
    assert invoice.tax_amount == Decimal("16.00")
    assert invoice.grand_total == Decimal("116.00")


def test_inclusive_tax_is_reported_without_inflating_the_total(
    client: TestClient, db: Session, product: Product, admin_token: str
) -> None:
    client.patch(
        "/api/v1/admin/settings",
        json={"tax_enabled": True, "tax_rate": 16, "prices_include_tax": True},
        headers=auth(admin_token),
    )
    created = _place_order(client, product, quantity=1)  # total 100.00
    order = _order_row(db, created["order_number"])
    _set_status(client, admin_token, order.id, OrderStatus.CONFIRMED.value)

    invoice = invoices_service.get_for_order(db, order.id)
    assert invoice.grand_total == order.total == Decimal("100.00")
    assert invoice.tax_amount == Decimal("13.79")


def test_legal_and_tax_identity_is_blank_unless_the_owner_sets_it(
    client: TestClient, db: Session, product: Product, admin_token: str
) -> None:
    created = _place_order(client, product, quantity=1)
    order = _order_row(db, created["order_number"])
    _set_status(client, admin_token, order.id, OrderStatus.CONFIRMED.value)

    invoice = invoices_service.get_for_order(db, order.id)
    assert invoice.legal_business_name is None
    assert invoice.registration_number is None
    assert invoice.tax_number is None


# ── admin list, search and filters ───────────────────────────────────────────
def _two_invoices(client: TestClient, db: Session, product: Product, token: str) -> list[str]:
    numbers = []
    for name in ("سارة أحمد", "محمود خالد"):
        created = _place_order(client, product, quantity=1, customer_name=name)
        order = _order_row(db, created["order_number"])
        response = _set_status(client, token, order.id, OrderStatus.CONFIRMED.value)
        numbers.append(response.json()["invoice"]["invoice_number"])
    return numbers


def test_the_invoice_list_returns_what_the_screen_needs(
    client: TestClient, db: Session, product: Product, admin_token: str
) -> None:
    _two_invoices(client, db, product, admin_token)

    body = client.get("/api/v1/admin/invoices", headers=auth(admin_token)).json()
    assert body["total"] == 2
    row = body["items"][0]
    for field in (
        "invoice_number",
        "order_number",
        "customer_name",
        "issued_at",
        "grand_total",
        "payment_method",
        "status",
    ):
        assert field in row


def test_invoices_can_be_searched_by_number_order_and_customer(
    client: TestClient, db: Session, product: Product, admin_token: str
) -> None:
    numbers = _two_invoices(client, db, product, admin_token)

    by_number = client.get(
        "/api/v1/admin/invoices", params={"q": numbers[1]}, headers=auth(admin_token)
    ).json()
    assert by_number["total"] == 1
    assert by_number["items"][0]["invoice_number"] == numbers[1]

    order_number = by_number["items"][0]["order_number"]
    by_order = client.get(
        "/api/v1/admin/invoices", params={"q": order_number}, headers=auth(admin_token)
    ).json()
    assert by_order["total"] == 1

    by_customer = client.get(
        "/api/v1/admin/invoices", params={"q": "محمود"}, headers=auth(admin_token)
    ).json()
    assert by_customer["total"] == 1
    assert by_customer["items"][0]["customer_name"] == "محمود خالد"


def test_invoices_can_be_filtered_by_status_and_date(
    client: TestClient, db: Session, product: Product, admin_token: str
) -> None:
    numbers = _two_invoices(client, db, product, admin_token)
    client.post(
        f"/api/v1/admin/invoices/{numbers[0]}/cancel", json={}, headers=auth(admin_token)
    )

    issued = client.get(
        "/api/v1/admin/invoices", params={"status": "issued"}, headers=auth(admin_token)
    ).json()
    assert [row["invoice_number"] for row in issued["items"]] == [numbers[1]]

    cancelled = client.get(
        "/api/v1/admin/invoices", params={"status": "cancelled"}, headers=auth(admin_token)
    ).json()
    assert [row["invoice_number"] for row in cancelled["items"]] == [numbers[0]]

    today = client.get(
        "/api/v1/admin/invoices",
        params={"issued_from": "2000-01-01", "issued_to": "2099-12-31"},
        headers=auth(admin_token),
    ).json()
    assert today["total"] == 2

    long_ago = client.get(
        "/api/v1/admin/invoices",
        params={"issued_to": "2000-01-01"},
        headers=auth(admin_token),
    ).json()
    assert long_ago["total"] == 0


def test_an_unknown_invoice_number_is_a_clean_404(
    client: TestClient, admin_token: str
) -> None:
    response = client.get("/api/v1/admin/invoices/INV-000999", headers=auth(admin_token))
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "invoice_not_found"


# ── authorization and privacy ────────────────────────────────────────────────
@pytest.mark.parametrize(
    "method,path",
    [
        ("get", "/api/v1/admin/invoices"),
        ("get", "/api/v1/admin/invoices/INV-000001"),
        ("get", "/api/v1/admin/orders/1/invoice"),
        ("post", "/api/v1/admin/invoices/INV-000001/cancel"),
    ],
)
def test_every_invoice_endpoint_requires_authentication(
    client: TestClient, method: str, path: str
) -> None:
    response = getattr(client, method)(path, **({"json": {}} if method == "post" else {}))
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "not_authenticated"


def test_an_expired_or_bogus_token_is_refused(client: TestClient) -> None:
    response = client.get("/api/v1/admin/invoices", headers=auth("not-a-real-token"))
    assert response.status_code == 401


def test_a_normal_admin_may_use_the_invoice_screens(
    client: TestClient, db: Session, product: Product, admin_token: str
) -> None:
    """Invoices are day-to-day work, not a super-admin-only area."""
    created = _place_order(client, product, quantity=1)
    order = _order_row(db, created["order_number"])
    _set_status(client, admin_token, order.id, OrderStatus.CONFIRMED.value)

    assert client.get("/api/v1/admin/invoices", headers=auth(admin_token)).status_code == 200


def test_the_public_order_view_leaks_nothing_about_the_invoice(
    client: TestClient, db: Session, product: Product, admin_token: str
) -> None:
    created = _place_order(client, product, quantity=1)
    order = _order_row(db, created["order_number"])
    _set_status(client, admin_token, order.id, OrderStatus.CONFIRMED.value)

    public = client.get(
        f"/api/v1/orders/{order.order_number}",
        params={"token": created["public_token"]},
    )
    assert public.status_code == 200
    body = public.json()
    assert "invoice" not in body
    serialized = public.text
    assert "invoice_number" not in serialized
    assert "INV-" not in serialized
    # And no route exposes an invoice without a token.
    assert client.get("/api/v1/invoices").status_code == 404


def test_the_public_store_settings_never_expose_legal_or_tax_identity(
    client: TestClient, db: Session, admin_token: str
) -> None:
    client.patch(
        "/api/v1/admin/settings",
        json={
            "legal_business_name": "شركة تجريبية",
            "tax_number": "123456789",
            "registration_number": "RC-1",
            "tax_enabled": True,
            "tax_rate": 16,
        },
        headers=auth(admin_token),
    )
    body = client.get("/api/v1/store/settings").json()

    for leaked in (
        "legal_business_name",
        "tax_number",
        "registration_number",
        "tax_enabled",
        "tax_rate",
        "invoice_prefix",
    ):
        assert leaked not in body


# ── payment methods ──────────────────────────────────────────────────────────
def test_cash_on_delivery_is_the_default_and_completes_checkout(
    client: TestClient, db: Session, product: Product
) -> None:
    created = _place_order(client, product, quantity=1)
    assert created["payment_method"] == "cash_on_delivery"

    order = _order_row(db, created["order_number"])
    assert order.payment_method == "cash_on_delivery"
    assert order.status == OrderStatus.PENDING.value


def test_manual_payment_is_accepted(client: TestClient, db: Session, product: Product) -> None:
    created = _place_order(client, product, quantity=1, payment_method="manual")
    assert created["payment_method"] == "manual"


@pytest.mark.parametrize(
    "method",
    ["card", "credit_card", "stripe", "paypal", "online", "visa", ""],
)
def test_online_and_card_payment_methods_are_rejected(
    client: TestClient, product: Product, method: str
) -> None:
    response = client.post(
        "/api/v1/orders",
        json={
            "customer_name": "سارة أحمد",
            "customer_phone": "0591234567",
            "address": "رام الله، شارع الإرسال، بناية ٥",
            "payment_method": method,
            "items": [{"product_id": product.id, "quantity": 1}],
        },
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"


def test_no_order_is_created_when_the_payment_method_is_rejected(
    client: TestClient, db: Session, product: Product
) -> None:
    client.post(
        "/api/v1/orders",
        json={
            "customer_name": "سارة أحمد",
            "customer_phone": "0591234567",
            "address": "رام الله، شارع الإرسال، بناية ٥",
            "payment_method": "credit_card",
            "items": [{"product_id": product.id, "quantity": 1}],
        },
    )
    db.expire_all()
    assert db.query(Order).count() == 0
    assert db.get(Product, product.id).stock_quantity == 50


def test_the_admin_order_view_shows_the_payment_method(
    client: TestClient, db: Session, product: Product, admin_token: str
) -> None:
    created = _place_order(client, product, quantity=1, payment_method="manual")
    order = _order_row(db, created["order_number"])

    detail = client.get(f"/api/v1/admin/orders/{order.id}", headers=auth(admin_token)).json()
    assert detail["payment_method"] == "manual"

    listing = client.get("/api/v1/admin/orders", headers=auth(admin_token)).json()
    assert listing["items"][0]["payment_method"] == "manual"


def test_manual_payment_instructions_are_blank_until_the_owner_supplies_them(
    client: TestClient, admin_token: str
) -> None:
    assert client.get("/api/v1/store/settings").json()["manual_payment_instructions"] is None

    client.patch(
        "/api/v1/admin/settings",
        json={"manual_payment_instructions": "بنك فلسطين — حساب رقم ..."},
        headers=auth(admin_token),
    )
    body = client.get("/api/v1/store/settings").json()
    assert body["manual_payment_instructions"] == "بنك فلسطين — حساب رقم ..."
