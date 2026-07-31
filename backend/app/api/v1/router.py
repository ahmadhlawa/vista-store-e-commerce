from fastapi import APIRouter

from app.api.v1.endpoints import (
    admin_catalog,
    admin_commerce,
    admin_content,
    admin_media,
    admin_users,
    auth,
    public_catalog,
    public_checkout,
    public_content,
)

api_router = APIRouter()

# Public storefront surface
api_router.include_router(public_content.router)
api_router.include_router(public_catalog.router)
api_router.include_router(public_checkout.router)

# Authenticated admin surface
api_router.include_router(auth.router)
api_router.include_router(admin_catalog.router)
api_router.include_router(admin_content.router)
api_router.include_router(admin_commerce.router)
api_router.include_router(admin_media.router)
api_router.include_router(admin_users.router)
