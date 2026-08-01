"""Preview batch lifecycle: seed, idempotency, ownership, and safe purge.

The purge tests are the important ones. Every assertion about what survives a purge is
an assertion that a client's real work cannot be destroyed by a demonstration dataset.
"""

from __future__ import annotations

from decimal import Decimal
from pathlib import Path

import pytest
from sqlalchemy.orm import Session

from app.models import (
    Category,
    Coupon,
    DeliveryArea,
    HeroSlide,
    ImportBatch,
    ImportBatchRecord,
    MediaAsset,
    Order,
    OrderItem,
    Product,
)
from app.preview.dataset import parse_dataset
from app.preview.importer import PreviewImporter
from app.storage.local import LocalStorageProvider

DOCUMENT = {
    "preview_schema_version": 1,
    "batch_key": "test-preview",
    "source_label": "test dataset",
    "media_prefix": "test-store/preview/",
    "media": [
        {"key": "tile", "alt_text": "tile", "start_color": "#112233", "end_color": "#445566"}
    ],
    "categories": [
        {"slug": "cat", "name": "قسم المعاينة", "image": "tile", "origin": "inferred"}
    ],
    "products": [
        {
            "slug": "prod-a",
            "name": "منتج ألف",
            "category": "cat",
            "price": "10.50",
            "stock_quantity": 5,
            "image": "tile",
            "origin": "inferred",
        },
        {
            "slug": "prod-b",
            "name": "منتج باء",
            "category": "cat",
            "price": "20.00",
            "compare_at_price": "25.00",
            "stock_quantity": 7,
            "origin": "inferred",
        },
    ],
    "delivery_areas": [
        {
            "key": "preview-area",
            "name": "منطقة تجريبية للمعاينة",
            "delivery_fee": "0.00",
            "origin": "placeholder",
        }
    ],
    "hero_slides": [
        {"key": "hero", "title": "عنوان تجريبي", "image": "tile", "origin": "inferred"}
    ],
    "coupons": [{"code": "TESTPREVIEW", "discount_value": "10.00", "origin": "placeholder"}],
}


@pytest.fixture()
def storage(tmp_path: Path) -> LocalStorageProvider:
    return LocalStorageProvider(tmp_path / "media", "/media")


@pytest.fixture()
def importer(db: Session, storage: LocalStorageProvider) -> PreviewImporter:
    return PreviewImporter(db, parse_dataset(DOCUMENT), storage=storage)


def counts(plan) -> dict[str, int]:
    return plan.counts()


# ── seed ─────────────────────────────────────────────────────────────────────
def test_seed_creates_every_declared_row(importer: PreviewImporter, db: Session) -> None:
    importer.seed()

    assert db.query(Category).count() == 1
    assert db.query(Product).count() == 2
    assert db.query(DeliveryArea).count() == 1
    assert db.query(HeroSlide).count() == 1
    assert db.query(Coupon).count() == 1
    assert db.query(MediaAsset).count() == 1

    product = db.query(Product).filter_by(slug="prod-a").one()
    assert product.price == Decimal("10.50")
    assert product.primary_image_url is not None


def test_plan_writes_nothing(importer: PreviewImporter, db: Session) -> None:
    plan = importer.plan()
    db.rollback()

    assert counts(plan)["create"] > 0
    assert db.query(Product).count() == 0
    assert db.query(ImportBatch).count() == 0


def test_seed_is_idempotent(importer: PreviewImporter, db: Session) -> None:
    importer.seed()
    before = {
        "products": db.query(Product).count(),
        "media": db.query(MediaAsset).count(),
        "records": db.query(ImportBatchRecord).count(),
    }

    second = importer.seed()

    after = {
        "products": db.query(Product).count(),
        "media": db.query(MediaAsset).count(),
        "records": db.query(ImportBatchRecord).count(),
    }
    assert before == after
    # Only the batch row itself changes, to record that the seed ran again.
    assert counts(second).get("create") is None
    assert counts(second)["update"] == 1


def test_seed_does_not_re_upload_media(importer: PreviewImporter, db: Session) -> None:
    importer.seed()
    key = db.query(MediaAsset).one().stored_key
    importer.seed()
    assert db.query(MediaAsset).one().stored_key == key


def test_uploaded_media_lands_under_the_declared_prefix(
    importer: PreviewImporter, db: Session
) -> None:
    importer.seed()
    assert db.query(MediaAsset).one().stored_key.startswith("test-store/preview/")


# ── ownership ────────────────────────────────────────────────────────────────
def test_seed_never_adopts_an_existing_row_it_did_not_create(
    importer: PreviewImporter, db: Session
) -> None:
    owner_category = Category(slug="cat", name="اسم المالك", is_active=True)
    db.add(owner_category)
    db.commit()

    plan = importer.seed()

    assert any(
        action.outcome == "skip" and "not owned by this batch" in action.detail
        for action in plan.actions
    )
    db.refresh(owner_category)
    assert owner_category.name == "اسم المالك"
    assert (
        db.query(ImportBatchRecord).filter_by(entity_type="category").count() == 0
    )


def test_batch_records_point_at_exactly_the_rows_created(
    importer: PreviewImporter, db: Session
) -> None:
    importer.seed()
    records = db.query(ImportBatchRecord).filter_by(entity_type="product").all()
    assert {record.natural_key for record in records} == {"prod-a", "prod-b"}
    assert {record.entity_id for record in records} == {
        product.id for product in db.query(Product).all()
    }


def test_owner_edited_row_is_not_overwritten_by_a_re_seed(
    importer: PreviewImporter, db: Session
) -> None:
    importer.seed()
    product = db.query(Product).filter_by(slug="prod-a").one()
    product.name = "اسم عدّله المالك"
    db.commit()

    importer.seed()

    db.refresh(product)
    assert product.name == "اسم عدّله المالك"


def test_a_sale_is_not_mistaken_for_an_owner_edit(
    importer: PreviewImporter, db: Session
) -> None:
    """Stock moves whenever somebody buys something. That is not curation."""
    importer.seed()
    product = db.query(Product).filter_by(slug="prod-a").one()
    product.stock_quantity -= 2
    db.commit()

    assert importer.status()["owner_edited"] == []
    plan = importer.seed()
    assert counts(plan).get("create") is None
    db.refresh(product)
    assert product.stock_quantity == 3  # not reset to the dataset's 5


def test_force_overwrites_an_owner_edited_row(importer: PreviewImporter, db: Session) -> None:
    importer.seed()
    product = db.query(Product).filter_by(slug="prod-a").one()
    product.name = "اسم عدّله المالك"
    db.commit()

    importer.seed(force=True)

    db.refresh(product)
    assert product.name == "منتج ألف"


# ── status ───────────────────────────────────────────────────────────────────
def test_status_reports_the_batch(importer: PreviewImporter) -> None:
    importer.seed()
    report = importer.status()

    assert report["exists"] is True
    assert report["batch_key"] == "test-preview"
    assert report["media_prefix"] == "test-store/preview/"
    assert report["records"]["product"] == 2
    assert report["seed_count"] == 1
    assert report["dataset_hash_matches_file"] is True
    assert report["owner_edited"] == []


def test_status_lists_owner_edited_rows(importer: PreviewImporter, db: Session) -> None:
    importer.seed()
    product = db.query(Product).filter_by(slug="prod-b").one()
    product.price = Decimal("99.00")
    db.commit()

    assert importer.status()["owner_edited"] == ["product:prod-b"]


def test_status_on_an_unseeded_database(importer: PreviewImporter) -> None:
    assert importer.status()["exists"] is False


# ── purge ────────────────────────────────────────────────────────────────────
def test_purge_is_a_dry_run_by_default(importer: PreviewImporter, db: Session) -> None:
    importer.seed()
    plan = importer.purge()

    assert counts(plan)["delete"] > 0
    assert db.query(Product).count() == 2
    assert db.query(ImportBatch).count() == 1


def test_purge_with_confirm_removes_everything_it_owns(
    importer: PreviewImporter, db: Session
) -> None:
    importer.seed()
    importer.purge(apply=True)

    assert db.query(Product).count() == 0
    assert db.query(Category).count() == 0
    assert db.query(MediaAsset).count() == 0
    assert db.query(Coupon).count() == 0
    assert db.query(ImportBatch).count() == 0
    assert db.query(ImportBatchRecord).count() == 0


def test_purge_deletes_the_stored_objects_it_uploaded(
    importer: PreviewImporter, db: Session, storage: LocalStorageProvider
) -> None:
    importer.seed()
    key = db.query(MediaAsset).one().stored_key
    assert (storage.root / key).exists()

    importer.purge(apply=True)

    assert not (storage.root / key).exists()


def test_purge_leaves_owner_content_untouched(importer: PreviewImporter, db: Session) -> None:
    owner_product = Product(
        name="منتج المالك", slug="owner-product", price=Decimal("77.00"), stock_quantity=1
    )
    owner_category = Category(slug="owner-category", name="قسم المالك")
    db.add_all([owner_product, owner_category])
    db.commit()

    importer.seed()
    importer.purge(apply=True)

    assert db.query(Product).filter_by(slug="owner-product").count() == 1
    assert db.query(Category).filter_by(slug="owner-category").count() == 1


def test_purge_skips_a_row_the_owner_edited(importer: PreviewImporter, db: Session) -> None:
    importer.seed()
    product = db.query(Product).filter_by(slug="prod-a").one()
    product.name = "اسم عدّله المالك"
    db.commit()

    plan = importer.purge(apply=True)

    assert any(
        action.outcome == "skip" and "owner-edited" in action.detail for action in plan.actions
    )
    assert db.query(Product).filter_by(slug="prod-a").count() == 1
    # The batch survives while it still owns something.
    assert db.query(ImportBatch).count() == 1


def test_purge_force_removes_an_owner_edited_row(importer: PreviewImporter, db: Session) -> None:
    importer.seed()
    product = db.query(Product).filter_by(slug="prod-a").one()
    product.name = "اسم عدّله المالك"
    db.commit()

    importer.purge(apply=True, force=True)

    assert db.query(Product).filter_by(slug="prod-a").count() == 0


def test_purge_refuses_to_delete_a_product_an_order_references(
    importer: PreviewImporter, db: Session
) -> None:
    importer.seed()
    product = db.query(Product).filter_by(slug="prod-a").one()
    order = Order(
        order_number="ORD-260802-0001",
        public_token="token-1",
        customer_name="عميل",
        customer_phone="0000",
        address="عنوان",
        subtotal=Decimal("10.50"),
        total=Decimal("10.50"),
    )
    db.add(order)
    db.flush()
    db.add(
        OrderItem(
            order_id=order.id,
            product_id=product.id,
            product_name=product.name,
            unit_price=product.price,
            quantity=1,
            line_total=product.price,
        )
    )
    db.commit()

    plan = importer.purge(apply=True, force=True)

    assert any(
        action.outcome == "blocked" and "order line" in action.detail for action in plan.actions
    )
    assert db.query(Product).filter_by(slug="prod-a").count() == 1


def test_purge_refuses_to_delete_a_delivery_area_an_order_used(
    importer: PreviewImporter, db: Session
) -> None:
    importer.seed()
    area = db.query(DeliveryArea).one()
    db.add(
        Order(
            order_number="ORD-260802-0002",
            public_token="token-2",
            customer_name="عميل",
            customer_phone="0000",
            address="عنوان",
            delivery_area_id=area.id,
            delivery_area_name=area.name,
            subtotal=Decimal("10.50"),
            total=Decimal("10.50"),
        )
    )
    db.commit()

    plan = importer.purge(apply=True, force=True)

    assert any(action.outcome == "blocked" and "order" in action.detail for action in plan.actions)
    assert db.query(DeliveryArea).count() == 1


def test_purge_refuses_to_delete_a_category_holding_owner_products(
    importer: PreviewImporter, db: Session
) -> None:
    importer.seed()
    category = db.query(Category).filter_by(slug="cat").one()
    db.add(
        Product(
            name="منتج المالك",
            slug="owner-product",
            price=Decimal("5.00"),
            category_id=category.id,
        )
    )
    db.commit()

    plan = importer.purge(apply=True)

    assert any(
        action.outcome == "blocked" and "outside this batch" in action.detail
        for action in plan.actions
    )
    assert db.query(Category).filter_by(slug="cat").count() == 1


def test_purge_on_a_database_that_was_never_seeded(importer: PreviewImporter) -> None:
    plan = importer.purge(apply=True)
    assert counts(plan) == {"skip": 1}


def test_seed_after_a_full_purge_starts_clean(importer: PreviewImporter, db: Session) -> None:
    importer.seed()
    importer.purge(apply=True)
    plan = importer.seed()

    assert db.query(Product).count() == 2
    assert counts(plan)["create"] > 0
    assert importer.status()["seed_count"] == 1
