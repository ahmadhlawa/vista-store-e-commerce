from __future__ import annotations

from app.schemas.common import APIModel, UTCDateTime


class MediaAssetOut(APIModel):
    id: int
    original_filename: str
    stored_key: str
    content_type: str
    size_bytes: int
    url: str
    storage_provider: str
    uploaded_by_id: int | None = None
    created_at: UTCDateTime


class AuditLogOut(APIModel):
    id: int
    admin_user_id: int | None = None
    admin_email: str | None = None
    action: str
    entity_type: str
    entity_id: int | None = None
    meta: dict = {}
    created_at: UTCDateTime
