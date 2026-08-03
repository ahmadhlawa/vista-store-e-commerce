from __future__ import annotations

import struct
import zlib
from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import Article, AuditLog, MediaAsset, StaticPage, StoreSettings
from app.services.placeholder_image import gradient_png, vista_preview_png
from tests.conftest import auth


# ── store settings ───────────────────────────────────────────────────────────
def test_public_settings_hide_operational_fields(
    client: TestClient, db: Session, admin_token: str
) -> None:
    row = StoreSettings(
        store_name="متجر الاختبار",
        order_notifications_email="ops@example.com",
        primary_color="#123456",
    )
    db.add(row)
    db.commit()

    public = client.get("/api/v1/store/settings").json()
    assert public["store_name"] == "متجر الاختبار"
    assert public["primary_color"] == "#123456"
    assert "order_notifications_email" not in public
    assert "id" not in public

    private = client.get("/api/v1/admin/settings", headers=auth(admin_token)).json()
    assert private["order_notifications_email"] == "ops@example.com"


def test_settings_are_created_on_first_admin_read_and_can_be_updated(
    client: TestClient, admin_token: str
) -> None:
    assert client.get("/api/v1/store/settings").json()["store_name"] == "Store"

    created = client.get("/api/v1/admin/settings", headers=auth(admin_token))
    assert created.status_code == 200

    updated = client.patch(
        "/api/v1/admin/settings",
        headers=auth(admin_token),
        json={"store_name": "متجري", "primary_color": "#0A0B0C", "whatsapp": "0590000000"},
    )
    assert updated.status_code == 200
    assert client.get("/api/v1/store/settings").json()["store_name"] == "متجري"

    bad_colour = client.patch(
        "/api/v1/admin/settings", headers=auth(admin_token), json={"primary_color": "red"}
    )
    assert bad_colour.status_code == 422


# ── articles and pages ───────────────────────────────────────────────────────
def test_only_published_articles_are_public(
    client: TestClient, db: Session, admin_token: str
) -> None:
    db.add(Article(title="منشور", slug="published", content="نص", is_published=True))
    db.add(Article(title="مسودة", slug="draft", content="نص", is_published=False))
    db.commit()

    listed = client.get("/api/v1/articles").json()
    assert listed["total"] == 1
    assert listed["items"][0]["slug"] == "published"
    assert client.get("/api/v1/articles/draft").status_code == 404

    admin_list = client.get("/api/v1/admin/articles", headers=auth(admin_token)).json()
    assert admin_list["total"] == 2


def test_publishing_an_article_stamps_published_at(
    client: TestClient, admin_token: str
) -> None:
    created = client.post(
        "/api/v1/admin/articles",
        headers=auth(admin_token),
        json={"title": "مقال جديد", "content": "نص المقال", "is_published": False},
    )
    assert created.status_code == 201
    assert created.json()["published_at"] is None

    published = client.patch(
        f"/api/v1/admin/articles/{created.json()['id']}",
        headers=auth(admin_token),
        json={"is_published": True},
    )
    assert published.json()["published_at"] is not None


def test_only_published_static_pages_are_public(client: TestClient, db: Session) -> None:
    db.add(StaticPage(title="من نحن", slug="about", content="نص", is_published=True))
    db.add(StaticPage(title="مسودة", slug="hidden", content="نص", is_published=False))
    db.commit()

    assert client.get("/api/v1/pages/about").status_code == 200
    assert client.get("/api/v1/pages/hidden").status_code == 404


# ── homepage composition ─────────────────────────────────────────────────────
def test_home_sections_are_ordered_and_hidden_when_invisible(
    client: TestClient, admin_token: str
) -> None:
    client.post(
        "/api/v1/admin/home-sections",
        headers=auth(admin_token),
        json={
            "section_key": "second",
            "section_type": "featured_products",
            "title": "ثانٍ",
            "sort_order": 2,
        },
    )
    first = client.post(
        "/api/v1/admin/home-sections",
        headers=auth(admin_token),
        json={
            "section_key": "first",
            "section_type": "categories",
            "title": "أول",
            "sort_order": 1,
        },
    )
    assert first.status_code == 201

    public = client.get("/api/v1/home-sections").json()
    assert [section["section_key"] for section in public] == ["first", "second"]

    client.patch(
        f"/api/v1/admin/home-sections/{first.json()['id']}",
        headers=auth(admin_token),
        json={"is_visible": False},
    )
    assert [s["section_key"] for s in client.get("/api/v1/home-sections").json()] == ["second"]

    duplicate = client.post(
        "/api/v1/admin/home-sections",
        headers=auth(admin_token),
        json={"section_key": "first", "section_type": "categories"},
    )
    assert duplicate.status_code == 409


def test_home_section_config_rejects_markup(client: TestClient, admin_token: str) -> None:
    response = client.post(
        "/api/v1/admin/home-sections",
        headers=auth(admin_token),
        json={
            "section_key": "evil",
            "section_type": "custom_text",
            "config": {"body": "<script>alert(1)</script>"},
        },
    )
    assert response.status_code == 422


def test_hero_slides_and_banners_respect_their_schedule(
    client: TestClient, admin_token: str
) -> None:
    live = client.post(
        "/api/v1/admin/hero-slides",
        headers=auth(admin_token),
        json={"title": "شريحة فعّالة", "sort_order": 0},
    )
    assert live.status_code == 201
    expired = client.post(
        "/api/v1/admin/hero-slides",
        headers=auth(admin_token),
        json={
            "title": "شريحة منتهية",
            "starts_at": "2020-01-01T00:00:00",
            "ends_at": "2020-02-01T00:00:00",
        },
    )
    assert expired.status_code == 201

    public = client.get("/api/v1/hero-slides").json()
    assert [slide["title"] for slide in public] == ["شريحة فعّالة"]

    bad_window = client.post(
        "/api/v1/admin/banners",
        headers=auth(admin_token),
        json={
            "title": "بانر",
            "starts_at": "2026-02-01T00:00:00",
            "ends_at": "2026-01-01T00:00:00",
        },
    )
    assert bad_window.status_code == 422


# ── media ────────────────────────────────────────────────────────────────────
def _png_bytes() -> bytes:
    return gradient_png(8, 8, (255, 0, 0), (0, 0, 255))


def test_local_upload_returns_a_usable_url_and_writes_the_file(
    client: TestClient, db: Session, admin_token: str, media_root: Path
) -> None:
    response = client.post(
        "/api/v1/admin/media",
        headers=auth(admin_token),
        files={"file": ("photo.png", _png_bytes(), "image/png")},
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["content_type"] == "image/png"
    assert body["storage_provider"] == "local"
    assert body["url"].startswith("/media/")
    assert body["stored_key"] != "photo.png"  # collision-resistant name
    assert (media_root / body["stored_key"]).exists()

    listed = client.get("/api/v1/admin/media", headers=auth(admin_token)).json()
    assert listed["total"] == 1

    deleted = client.delete(
        f"/api/v1/admin/media/{body['id']}", headers=auth(admin_token)
    )
    assert deleted.status_code == 200
    assert not (media_root / body["stored_key"]).exists()
    assert db.query(MediaAsset).count() == 0


def test_upload_rejects_disallowed_content_regardless_of_the_declared_type(
    client: TestClient, admin_token: str, media_root: Path
) -> None:
    response = client.post(
        "/api/v1/admin/media",
        headers=auth(admin_token),
        files={"file": ("payload.png", b"#!/bin/sh\necho hi\n", "image/png")},
    )
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "unsupported_media_type"
    assert list(media_root.iterdir()) == []


def test_upload_rejects_an_svg(client: TestClient, admin_token: str) -> None:
    svg = b"<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>"
    response = client.post(
        "/api/v1/admin/media",
        headers=auth(admin_token),
        files={"file": ("x.svg", svg, "image/svg+xml")},
    )
    assert response.status_code == 400


def test_upload_rejects_oversized_files(client: TestClient, admin_token: str, monkeypatch) -> None:
    from app.core import config as config_module

    monkeypatch.setattr(config_module.settings, "MAX_UPLOAD_SIZE_BYTES", 100)
    response = client.post(
        "/api/v1/admin/media",
        headers=auth(admin_token),
        files={"file": ("big.png", _png_bytes() + b"\x00" * 500, "image/png")},
    )
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "file_too_large"


def test_upload_requires_authentication(client: TestClient) -> None:
    response = client.post(
        "/api/v1/admin/media", files={"file": ("photo.png", _png_bytes(), "image/png")}
    )
    assert response.status_code == 401


def test_generated_placeholder_is_a_valid_png() -> None:
    data = gradient_png(4, 3, (0, 0, 0), (255, 255, 255))
    assert data.startswith(b"\x89PNG\r\n\x1a\n")
    width, height = struct.unpack(">II", data[16:24])
    assert (width, height) == (4, 3)
    # IDAT payload decompresses to filter byte + RGB triples per row.
    start = data.index(b"IDAT") + 4
    length = struct.unpack(">I", data[start - 8 : start - 4])[0]
    raw = zlib.decompress(data[start : start + length])
    assert len(raw) == height * (1 + width * 3)


def test_vista_preview_placeholder_is_a_valid_distinct_png() -> None:
    data = vista_preview_png(80, 48, (91, 62, 133), (228, 179, 60), "gifts")
    assert data.startswith(b"\x89PNG\r\n\x1a\n")
    assert data != gradient_png(80, 48, (91, 62, 133), (228, 179, 60))


# ── audit log ────────────────────────────────────────────────────────────────
def test_important_admin_actions_are_audited(
    client: TestClient, db: Session, super_token: str
) -> None:
    created = client.post(
        "/api/v1/admin/products",
        headers=auth(super_token),
        json={"name": "منتج مدقّق", "price": 50},
    )
    assert created.status_code == 201
    client.patch(
        f"/api/v1/admin/products/{created.json()['id']}",
        headers=auth(super_token),
        json={"price": 60},
    )

    logs = client.get(
        "/api/v1/admin/audit-logs", headers=auth(super_token), params={"entity_type": "product"}
    ).json()
    actions = [entry["action"] for entry in logs["items"]]
    assert "product.created" in actions
    assert "product.updated" in actions
    assert all(entry["admin_email"] for entry in logs["items"])


def test_audit_metadata_never_stores_credentials(
    client: TestClient, db: Session, super_token: str
) -> None:
    client.post(
        "/api/v1/admin/admins",
        headers=auth(super_token),
        json={
            "email": "audited@example.com",
            "full_name": "Audited",
            "password": "SuperSecret!99",
        },
    )
    entries = db.query(AuditLog).all()
    serialised = str([entry.meta for entry in entries])
    assert "SuperSecret!99" not in serialised
    assert "password" not in serialised


def test_login_is_audited(client: TestClient, db: Session, admin_token: str) -> None:
    assert db.query(AuditLog).filter(AuditLog.action == "auth.login").count() == 1
