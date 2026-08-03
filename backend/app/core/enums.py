"""Domain enumerations.

Stored as short strings so the schema is identical on SQLite and MySQL 8 and so
adding a value never needs an ALTER TYPE migration.
"""

from __future__ import annotations

from enum import Enum


class StrEnum(str, Enum):
    def __str__(self) -> str:  # pragma: no cover - trivial
        return self.value


class AdminRole(StrEnum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"


class ProductType(StrEnum):
    STANDARD = "standard"
    PACKAGE = "package"
    SILICONE_MOLD = "silicone_mold"


class OrderStatus(StrEnum):
    NEW = "new"
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    READY = "ready"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class OrderSource(StrEnum):
    WEBSITE = "website"
    WHATSAPP = "whatsapp"
    PHONE = "phone"
    WALK_IN = "walk_in"
    SOCIAL = "social"
    OTHER = "other"


class PaymentStatus(StrEnum):
    UNPAID = "unpaid"
    PARTIAL = "partial"
    PAID = "paid"
    PARTIALLY_REFUNDED = "partially_refunded"
    REFUNDED = "refunded"


class PaymentMethod(StrEnum):
    CASH_ON_DELIVERY = "cash_on_delivery"
    MANUAL = "manual"


class InvoiceStatus(StrEnum):
    """Internal invoice lifecycle; rows are never deleted."""

    ACTIVE = "active"
    # Legacy value retained only while the old issuance service is replaced.
    ISSUED = "issued"
    CANCELLED = "cancelled"
    REPLACED = "replaced"


class DiscountType(StrEnum):
    PERCENTAGE = "percentage"
    FIXED = "fixed"


class BannerPlacement(StrEnum):
    HOME_MAIN = "home_main"
    HOME_SIDE = "home_side"
    HOME_STRIP = "home_strip"
    CATEGORY_TOP = "category_top"


class HomeSectionType(StrEnum):
    FEATURED_PRODUCTS = "featured_products"
    NEW_PRODUCTS = "new_products"
    BESTSELLERS = "bestsellers"
    PACKAGES = "packages"
    SILICONE_MOLDS = "silicone_molds"
    CATEGORIES = "categories"
    PROMO_BANNER = "promo_banner"
    CUSTOM_TEXT = "custom_text"


class StorageProviderName(StrEnum):
    LOCAL = "local"
    R2 = "r2"
