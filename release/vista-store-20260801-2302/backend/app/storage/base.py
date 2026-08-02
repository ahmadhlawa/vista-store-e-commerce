"""Storage provider interface plus upload validation shared by every provider."""

from __future__ import annotations

import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass

from app.services.errors import DomainError

# (mime type, canonical extension, magic prefix checker)
ALLOWED_IMAGE_TYPES: dict[str, str] = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/x-icon": ".ico",
    "image/vnd.microsoft.icon": ".ico",
}


def sniff_content_type(data: bytes) -> str | None:
    """Identify the file from its bytes. The client-declared type is not trusted."""
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if data.startswith(b"RIFF") and data[8:12] == b"WEBP":
        return "image/webp"
    if data.startswith((b"GIF87a", b"GIF89a")):
        return "image/gif"
    if data.startswith(b"\x00\x00\x01\x00"):
        return "image/x-icon"
    return None


def validate_image_upload(data: bytes, max_bytes: int) -> tuple[str, str]:
    """Return `(content_type, extension)` or raise a DomainError."""
    if not data:
        raise DomainError("الملف فارغ.", code="empty_file")
    if len(data) > max_bytes:
        limit_mb = round(max_bytes / (1024 * 1024), 1)
        raise DomainError(
            f"حجم الملف يتجاوز الحد المسموح ({limit_mb} ميغابايت).", code="file_too_large"
        )
    content_type = sniff_content_type(data)
    if content_type is None or content_type not in ALLOWED_IMAGE_TYPES:
        raise DomainError(
            "نوع الملف غير مدعوم. الأنواع المسموحة: JPEG, PNG, WebP, GIF, ICO.",
            code="unsupported_media_type",
        )
    return content_type, ALLOWED_IMAGE_TYPES[content_type]


def build_stored_key(extension: str) -> str:
    """Collision-resistant and traversal-proof: the caller's name is never reused."""
    return f"{uuid.uuid4().hex}{extension}"


@dataclass(slots=True)
class StoredFile:
    key: str
    url: str
    content_type: str
    size_bytes: int


class StorageProvider(ABC):
    name: str

    @abstractmethod
    def save(self, data: bytes, *, content_type: str, extension: str) -> StoredFile: ...

    @abstractmethod
    def delete(self, key: str) -> None: ...

    @abstractmethod
    def url_for(self, key: str) -> str: ...
