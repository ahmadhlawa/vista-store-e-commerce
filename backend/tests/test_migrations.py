"""The Alembic revision, not create_all, is the schema of record."""

from __future__ import annotations

from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import inspect

from app.db.base import metadata_with_models
from app.db.session import build_engine

BACKEND_ROOT = Path(__file__).resolve().parents[1]

EXPECTED_TABLES = {
    "admin_users",
    "articles",
    "audit_logs",
    "banners",
    "categories",
    "coupons",
    "delivery_areas",
    "hero_slides",
    "home_sections",
    "import_batch_records",
    "import_batches",
    "instance_metadata",
    "invoice_items",
    "invoice_sequences",
    "invoices",
    "media_assets",
    "order_items",
    "order_status_history",
    "orders",
    "package_items",
    "product_images",
    "product_option_values",
    "product_options",
    "product_specifications",
    "product_variant_option_values",
    "product_variants",
    "products",
    "static_pages",
    "store_settings",
}


def _alembic_config(db_url: str) -> Config:
    config = Config(str(BACKEND_ROOT / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_ROOT / "alembic"))
    config.set_main_option("sqlalchemy.url", db_url)
    return config


def test_alembic_upgrade_builds_the_whole_schema(tmp_path, monkeypatch) -> None:
    db_path = tmp_path / "migrated.db"
    url = f"sqlite+pysqlite:///{db_path.as_posix()}"
    monkeypatch.setenv("DATABASE_URL", url)

    # alembic/env.py reads the URL from the application settings.
    from app.core import config as config_module

    monkeypatch.setattr(config_module.settings, "DATABASE_URL", url)

    command.upgrade(_alembic_config(url), "head")

    engine = build_engine(url)
    try:
        tables = set(inspect(engine).get_table_names())
    finally:
        engine.dispose()

    assert EXPECTED_TABLES.issubset(tables)
    assert "alembic_version" in tables


def test_models_and_expected_tables_agree() -> None:
    assert set(metadata_with_models().tables) == EXPECTED_TABLES
