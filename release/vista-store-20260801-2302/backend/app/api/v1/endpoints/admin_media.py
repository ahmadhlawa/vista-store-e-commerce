"""Media uploads. Files go to the configured storage provider; the DB keeps metadata."""

from __future__ import annotations

from fastapi import APIRouter, File, UploadFile, status
from sqlalchemy import select

from app.api.crud import get_or_404
from app.api.deps import CurrentAdmin, DbSession, PageParams
from app.core.config import settings
from app.models import MediaAsset
from app.schemas.common import MessageResponse, Page
from app.schemas.media import MediaAssetOut
from app.services import audit as audit_service
from app.services import catalog as catalog_service
from app.storage import get_storage, validate_image_upload

router = APIRouter(prefix="/admin", tags=["admin-media"])

MAX_FILENAME_LENGTH = 300


@router.get("/media", response_model=Page[MediaAssetOut])
def list_media(db: DbSession, admin: CurrentAdmin, pagination: PageParams) -> Page[MediaAssetOut]:
    stmt = select(MediaAsset).order_by(MediaAsset.id.desc())
    rows, total = catalog_service.paginate(
        db, stmt, offset=pagination.offset, limit=pagination.page_size
    )
    return Page.build(
        [MediaAssetOut.model_validate(row) for row in rows],
        total,
        pagination.page,
        pagination.page_size,
    )


@router.post("/media", response_model=MediaAssetOut, status_code=status.HTTP_201_CREATED)
async def upload_media(
    db: DbSession,
    admin: CurrentAdmin,
    file: UploadFile = File(...),
) -> MediaAsset:
    data = await file.read()
    # The declared content type and the file name are both attacker-controlled;
    # the real type comes from the bytes.
    content_type, extension = validate_image_upload(data, settings.MAX_UPLOAD_SIZE_BYTES)

    stored = get_storage().save(data, content_type=content_type, extension=extension)
    asset = MediaAsset(
        original_filename=(file.filename or "upload")[:MAX_FILENAME_LENGTH],
        stored_key=stored.key,
        content_type=stored.content_type,
        size_bytes=stored.size_bytes,
        url=stored.url,
        storage_provider=get_storage().name,
        uploaded_by_id=admin.id,
    )
    db.add(asset)
    db.flush()
    audit_service.record(
        db,
        admin=admin,
        action="media.uploaded",
        entity_type="media_asset",
        entity_id=asset.id,
        meta={"content_type": content_type, "size_bytes": asset.size_bytes},
    )
    db.commit()
    db.refresh(asset)
    return asset


@router.delete("/media/{asset_id}", response_model=MessageResponse)
def delete_media(asset_id: int, db: DbSession, admin: CurrentAdmin):
    asset = get_or_404(db, MediaAsset, asset_id, "الملف غير موجود.")
    get_storage().delete(asset.stored_key)
    audit_service.record(
        db,
        admin=admin,
        action="media.deleted",
        entity_type="media_asset",
        entity_id=asset.id,
        meta={"stored_key": asset.stored_key},
    )
    db.delete(asset)
    db.commit()
    return MessageResponse(message="تم حذف الملف.")
