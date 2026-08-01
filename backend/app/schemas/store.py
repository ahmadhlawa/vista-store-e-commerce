from __future__ import annotations

from pydantic import EmailStr, Field

from app.schemas.common import APIModel, UTCDateTime


class StoreSettingsPublic(APIModel):
    """What the storefront is allowed to know about the store."""

    store_name: str
    store_tagline: str | None = None
    logo_url: str | None = None
    favicon_url: str | None = None
    phone: str | None = None
    whatsapp: str | None = None
    email: EmailStr | None = None
    address: str | None = None
    location_url: str | None = None
    working_hours: str | None = None
    announcement: str | None = None
    instagram_url: str | None = None
    facebook_url: str | None = None
    tiktok_url: str | None = None
    youtube_url: str | None = None
    currency_code: str
    currency_symbol: str
    primary_color: str
    secondary_color: str
    accent_color: str
    seo_title: str | None = None
    seo_description: str | None = None
    maintenance_mode: bool


class StoreSettingsAdmin(StoreSettingsPublic):
    """Adds the operational fields that must not reach the storefront."""

    id: int
    order_notifications_email: EmailStr | None = None
    updated_at: UTCDateTime


class StoreSettingsUpdate(APIModel):
    store_name: str | None = Field(default=None, min_length=1, max_length=150)
    store_tagline: str | None = Field(default=None, max_length=200)
    logo_url: str | None = Field(default=None, max_length=500)
    favicon_url: str | None = Field(default=None, max_length=500)
    phone: str | None = Field(default=None, max_length=40)
    whatsapp: str | None = Field(default=None, max_length=40)
    email: EmailStr | None = None
    address: str | None = Field(default=None, max_length=300)
    location_url: str | None = Field(default=None, max_length=500)
    working_hours: str | None = Field(default=None, max_length=200)
    announcement: str | None = Field(default=None, max_length=300)
    instagram_url: str | None = Field(default=None, max_length=500)
    facebook_url: str | None = Field(default=None, max_length=500)
    tiktok_url: str | None = Field(default=None, max_length=500)
    youtube_url: str | None = Field(default=None, max_length=500)
    currency_code: str | None = Field(default=None, min_length=1, max_length=8)
    currency_symbol: str | None = Field(default=None, min_length=1, max_length=8)
    primary_color: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
    secondary_color: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
    accent_color: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
    seo_title: str | None = Field(default=None, max_length=200)
    seo_description: str | None = None
    maintenance_mode: bool | None = None
    order_notifications_email: EmailStr | None = None
