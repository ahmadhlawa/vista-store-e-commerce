# Reusable Commerce Template

A reusable full-stack commerce template designed for one independent deployment per client.

## Structure

- `frontend/` — React storefront and admin interface
- `backend/` — FastAPI application
- `deployment/` — Nginx and systemd templates
- `scripts/` — controlled operational scripts
- `docs/` — architecture and deployment documentation

## Deployment Model

Each client receives an independent instance with:

- Separate application code
- Separate MySQL database and database user
- Separate environment configuration
- Separate FastAPI service
- Separate Nginx configuration
- Separate domain and media storage scope

The template must not contain a fixed client name.
