from __future__ import annotations

from sqlalchemy import Boolean, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin

# Single source of truth for the shipped defaults: used as the column defaults and
# as the response for an instance whose settings row has not been created yet.
STORE_SETTINGS_DEFAULTS: dict[str, object] = {
    "store_name": "Store",
    "currency_code": "ILS",
    "currency_symbol": "₪",
    "primary_color": "#1F4E4A",
    "secondary_color": "#C9A24B",
    "accent_color": "#2E7D5B",
    "maintenance_mode": False,
}


class StoreSettings(TimestampMixin, Base):
    """Single-row store identity. One instance == one store."""

    __tablename__ = "store_settings"

    id: Mapped[int] = mapped_column(primary_key=True)

    store_name: Mapped[str] = mapped_column(String(150), nullable=False, default="Store")
    store_tagline: Mapped[str | None] = mapped_column(String(200), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    favicon_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    phone: Mapped[str | None] = mapped_column(String(40), nullable=True)
    whatsapp: Mapped[str | None] = mapped_column(String(40), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    address: Mapped[str | None] = mapped_column(String(300), nullable=True)
    location_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    working_hours: Mapped[str | None] = mapped_column(String(200), nullable=True)
    announcement: Mapped[str | None] = mapped_column(String(300), nullable=True)

    instagram_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    facebook_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    tiktok_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    youtube_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    currency_code: Mapped[str] = mapped_column(String(8), default="ILS", nullable=False)
    currency_symbol: Mapped[str] = mapped_column(String(8), default="₪", nullable=False)

    primary_color: Mapped[str] = mapped_column(String(16), default="#1F4E4A", nullable=False)
    secondary_color: Mapped[str] = mapped_column(String(16), default="#C9A24B", nullable=False)
    accent_color: Mapped[str] = mapped_column(String(16), default="#2E7D5B", nullable=False)

    seo_title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    seo_description: Mapped[str | None] = mapped_column(Text, nullable=True)

    maintenance_mode: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    order_notifications_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
