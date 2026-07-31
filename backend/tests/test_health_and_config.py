from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient

from app.core.config import Settings


def test_health_returns_ok(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_openapi_schema_generates(client: TestClient) -> None:
    response = client.get("/api/v1/openapi.json")
    assert response.status_code == 200
    schema = response.json()
    assert "/api/v1/products" in schema["paths"]
    assert "/api/v1/auth/login" in schema["paths"]


def test_settings_parse_cors_origins_from_a_comma_string() -> None:
    config = Settings(CORS_ORIGINS="http://a.test, http://b.test")
    assert config.CORS_ORIGINS == ["http://a.test", "http://b.test"]


def test_relative_sqlite_url_is_anchored_to_the_backend_root() -> None:
    config = Settings(DATABASE_URL="sqlite+pysqlite:///./data/example.db")
    url = config.sqlalchemy_url()
    assert url.startswith("sqlite+pysqlite:///")
    assert Path(url.removeprefix("sqlite+pysqlite:///")).is_absolute()


def test_mysql_url_is_passed_through_untouched() -> None:
    mysql_url = "mysql+pymysql://user:pass@127.0.0.1:3306/db"
    assert Settings(DATABASE_URL=mysql_url).sqlalchemy_url() == mysql_url


def test_no_admin_credentials_are_shipped_as_defaults() -> None:
    config = Settings(_env_file=None)
    assert config.INITIAL_ADMIN_EMAIL == ""
    assert config.INITIAL_ADMIN_PASSWORD == ""
