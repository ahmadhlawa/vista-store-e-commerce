"""Cloudflare R2 adapter boundary.

Deliberately not activated in this template. The class exists so that switching a
deployed instance to object storage is a configuration change plus one dependency,
not a refactor: nothing outside this module knows where bytes are stored.

To enable later: add `boto3`, implement the three methods against the S3-compatible
R2 endpoint, and set STORAGE_PROVIDER=r2 with the R2_* variables filled in.
"""

from __future__ import annotations

from app.core.enums import StorageProviderName
from app.storage.base import StorageProvider, StoredFile


class R2NotConfiguredError(RuntimeError):
    pass


class R2StorageProvider(StorageProvider):
    name = StorageProviderName.R2.value

    def __init__(
        self,
        *,
        account_id: str,
        access_key_id: str,
        secret_access_key: str,
        bucket_name: str,
        public_base_url: str,
    ) -> None:
        missing = [
            field
            for field, value in (
                ("R2_ACCOUNT_ID", account_id),
                ("R2_ACCESS_KEY_ID", access_key_id),
                ("R2_SECRET_ACCESS_KEY", secret_access_key),
                ("R2_BUCKET_NAME", bucket_name),
                ("R2_PUBLIC_BASE_URL", public_base_url),
            )
            if not value
        ]
        if missing:
            raise R2NotConfiguredError(
                "R2 storage is selected but not configured. Missing: " + ", ".join(missing)
            )
        self.account_id = account_id
        self.access_key_id = access_key_id
        self.secret_access_key = secret_access_key
        self.bucket_name = bucket_name
        self.public_base_url = public_base_url.rstrip("/")

    def save(self, data: bytes, *, content_type: str, extension: str) -> StoredFile:
        raise R2NotConfiguredError(
            "R2 upload is not implemented in this template; add boto3 and a put_object call here."
        )

    def delete(self, key: str) -> None:
        raise R2NotConfiguredError(
            "R2 delete is not implemented in this template; add boto3 and a delete_object call here."
        )

    def url_for(self, key: str) -> str:
        return f"{self.public_base_url}/{key}"
