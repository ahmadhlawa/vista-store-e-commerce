from __future__ import annotations

from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import Order, Product
from tests.conftest import auth, make_product


def _create_order(client: TestClient, product: Product, **changes: object) -> dict:
    payload = {
        "client_reference": f"admin-edit-{product.id}-{changes.get('suffix', 'one')}",
        "customer_name": "Search Customer",
        "customer_phone": "0591234567",
        "address": "Ramallah, Main Street 10",
        "items": [{"product_id": product.id, "quantity": 1}],
    }
    payload.update({key: value for key, value in changes.items() if key != "suffix"})
    response = client.post("/api/v1/orders", json=payload)
    assert response.status_code == 201, response.text
    return response.json()


def _edit_payload(first: Product, second: Product | None = None, **changes: object) -> dict:
    payload = {
        "customer_name": "Edited Customer",
        "customer_phone": "0597654321",
        "customer_email": "edited@example.com",
        "address": "Ramallah, Edited Street 20",
        "payment_method": "cash_on_delivery",
        "customer_notes": "Customer note",
        "admin_notes": "Internal note",
        "discount": "5.00",
        "delivery_fee": "7.00",
        "status": "reviewing",
        "reason": "Customer agreed to the correction",
        "items": [
            {
                "product_id": first.id,
                "quantity": 2,
                "unit_price": "12.50",
            }
        ],
    }
    if second is not None:
        payload["items"].append({"product_id": second.id, "quantity": 3})
    payload.update(changes)
    return payload


def test_admin_order_list_filters_search_source_payment_date_and_paginates(
    client: TestClient, db: Session, admin_token: str
) -> None:
    first = make_product(db, slug="admin-list-first", name="First", price="10.00")
    second = make_product(db, slug="admin-list-second", name="Second", price="20.00")
    first_order = _create_order(client, first, suffix="first", customer_name="Mona Search")
    _create_order(client, second, suffix="second", customer_name="Other Customer")

    response = client.get(
        "/api/v1/admin/orders",
        headers=auth(admin_token),
        params={
            "q": "Mona",
            "source": "website",
            "payment_status": "unpaid",
            "date_from": "2026-01-01",
            "date_to": "2026-12-31",
            "page": 1,
            "page_size": 1,
        },
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["total"] == 1
    assert body["page"] == 1
    assert body["page_size"] == 1
    assert body["items"][0]["id"] == first_order["id"]
    assert body["items"][0]["source"] == "website"
    assert body["items"][0]["payment_status"] == "unpaid"


def test_admin_order_detail_exposes_original_current_invoices_and_activity(
    client: TestClient, db: Session, admin_token: str
) -> None:
    product = make_product(db, slug="admin-detail", name="Original product", price="10.00")
    order = _create_order(client, product)

    edited = client.patch(
        f"/api/v1/admin/orders/{order['id']}",
        headers=auth(admin_token),
        json=_edit_payload(product),
    )
    assert edited.status_code == 200, edited.text

    body = client.get(f"/api/v1/admin/orders/{order['id']}", headers=auth(admin_token)).json()
    item = body["items"][0]
    assert item["original_unit_price"] == 10.0
    assert item["unit_price"] == 12.5
    assert body["source"] == "website"
    assert body["subtotal"] == 25.0
    assert body["total"] == 27.0
    assert body["active_invoice"] is None
    assert body["invoices"] == []
    assert [event["event_type"] for event in body["activities"]] == [
        "order_created",
        "order_item_quantity_changed",
        "order_item_price_changed",
        "order_discount_changed",
        "order_delivery_fee_changed",
        "order_customer_updated",
        "order_notes_updated",
        "order_status_changed",
    ]


def test_both_roles_edit_incomplete_website_order_without_changing_catalog_price(
    client: TestClient, db: Session, admin_token: str, super_token: str
) -> None:
    first = make_product(db, slug="admin-edit-first", name="First", price="10.00", stock=20)
    second = make_product(db, slug="admin-edit-second", name="Second", price="4.00", stock=20)
    order = _create_order(client, first)

    response = client.patch(
        f"/api/v1/admin/orders/{order['id']}",
        headers=auth(admin_token),
        json=_edit_payload(first, second),
    )

    assert response.status_code == 200, response.text
    assert response.json()["total"] == 39.0
    db.expire_all()
    assert db.get(Product, first.id).price == Decimal("10.00")
    assert db.get(Product, first.id).stock_quantity == 18
    assert db.get(Product, second.id).stock_quantity == 17

    response = client.patch(
        f"/api/v1/admin/orders/{order['id']}",
        headers=auth(super_token),
        json=_edit_payload(second, reason="Manager correction"),
    )
    assert response.status_code == 200, response.text
    assert response.json()["items"][0]["product_id"] == second.id


def test_edit_requires_reason_for_material_changes_and_rejects_locked_or_nonwebsite_orders(
    client: TestClient, db: Session, admin_token: str
) -> None:
    product = make_product(db, slug="admin-edit-rules", name="Rules", price="10.00")
    order = _create_order(client, product)

    no_reason = _edit_payload(product, reason=None)
    response = client.patch(
        f"/api/v1/admin/orders/{order['id']}", headers=auth(admin_token), json=no_reason
    )
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "edit_reason_required"

    db_order = db.get(Order, order["id"])
    db_order.is_locked = True
    db.commit()
    response = client.patch(
        f"/api/v1/admin/orders/{order['id']}",
        headers=auth(admin_token),
        json=_edit_payload(product),
    )
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "order_locked"

    db_order.is_locked = False
    db_order.source = "phone"
    db.commit()
    response = client.patch(
        f"/api/v1/admin/orders/{order['id']}",
        headers=auth(admin_token),
        json=_edit_payload(product),
    )
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "order_source_not_editable"


def test_edit_rejects_completed_or_cancelled_status_and_manual_items(
    client: TestClient, db: Session, admin_token: str
) -> None:
    product = make_product(db, slug="admin-edit-invalid", name="Invalid", price="10.00")
    order = _create_order(client, product)

    complete = _edit_payload(product, status="completed")
    response = client.patch(
        f"/api/v1/admin/orders/{order['id']}", headers=auth(admin_token), json=complete
    )
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "completion_requires_confirmation"

    manual = _edit_payload(product)
    manual["items"] = [{"kind": "manual", "name": "Manual", "quantity": 1, "unit_price": "1"}]
    response = client.patch(
        f"/api/v1/admin/orders/{order['id']}", headers=auth(admin_token), json=manual
    )
    assert response.status_code == 422

    db_order = db.get(Order, order["id"])
    db_order.status = "cancelled"
    db.commit()
    response = client.patch(
        f"/api/v1/admin/orders/{order['id']}",
        headers=auth(admin_token),
        json=_edit_payload(product),
    )
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "order_cancelled"
