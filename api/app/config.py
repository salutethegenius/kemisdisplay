import logging

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_config_logger = logging.getLogger("kemisdisplay.config")


def normalize_postgres_dsn(url: str) -> str:
    """Railway and Heroku sometimes use postgres://; SQLAlchemy/psycopg2 expect postgresql://."""
    if url.startswith("postgresql://"):
        return url
    if url.startswith("postgres://"):
        return "postgresql://" + url[len("postgres://") :]
    return url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://kemis:kemis@localhost:5434/kemisdisplay"
    jwt_secret: str = "dev-secret-change-in-production"
    jwt_expire_minutes: int = 60 * 24 * 7
    cors_origins: str = "http://localhost:3000"
    public_api_base_url: str = "http://localhost:8000"
    upload_dir: str = "./storage/uploads"
    menu_render_tmp: str = "./storage/menu_render_tmp"
    dev_bypass_billing: bool = False
    # Comma-separated emails that receive is_admin=true on API startup (existing users only).
    admin_emails: str = ""
    # Mux Video (optional). When token id+secret are set, new videos use Mux direct upload + webhooks.
    mux_token_id: str = ""
    mux_token_secret: str = ""
    # Webhook signing secret from Mux dashboard (required to verify POST /mux/webhook).
    mux_webhook_signing_secret: str = ""
    # Cloudflare R2 (S3-compatible). Large videos still use Mux when configured.
    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = "kemisdisplay-media"
    r2_public_url: str = ""
    # Videos larger than this (MB) use Mux when Mux is enabled; smaller use R2 when R2 is enabled.
    video_mux_threshold_mb: int = 50
    # Optional error monitoring (https://sentry.io). Same org/project as web when set.
    sentry_dsn: str = ""
    sentry_traces_sample_rate: float = Field(default=0.0, ge=0.0, le=1.0)
    # Stripe Billing (Starter subscription). Leave unset locally to disable checkout/portal.
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_price_id_starter: str = ""
    # Public marketing/app origin for Checkout success/cancel + Portal return URLs.
    web_app_url: str = "https://kemisdisplay.com"

    @field_validator("jwt_secret", mode="after")
    @classmethod
    def _warn_default_jwt_secret(cls, v: str) -> str:
        if v == "dev-secret-change-in-production":
            _config_logger.critical(
                "SECURITY: JWT_SECRET is set to the insecure default value. "
                "Set a strong random secret via the JWT_SECRET environment variable before deploying."
            )
        return v

    @field_validator("database_url", mode="before")
    @classmethod
    def _normalize_database_url(cls, v: object) -> object:
        if isinstance(v, str):
            return normalize_postgres_dsn(v)
        return v

    @field_validator("dev_bypass_billing", mode="before")
    @classmethod
    def _coerce_bool(cls, v: object) -> bool:
        if isinstance(v, str):
            return v.strip().lower() in ("1", "true", "yes", "on")
        return bool(v)

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def admin_email_list(self) -> list[str]:
        return [
            e.strip().lower()
            for e in self.admin_emails.split(",")
            if e.strip()
        ]

    @property
    def mux_enabled(self) -> bool:
        return bool(self.mux_token_id.strip() and self.mux_token_secret.strip())

    @property
    def r2_enabled(self) -> bool:
        return bool(
            self.r2_account_id.strip()
            and self.r2_access_key_id.strip()
            and self.r2_secret_access_key.strip()
            and self.r2_public_url.strip()
        )

    @property
    def stripe_enabled(self) -> bool:
        return bool(
            self.stripe_secret_key.strip()
            and self.stripe_price_id_starter.strip()
        )


settings = Settings()
