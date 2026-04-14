from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator


class UserOut(BaseModel):
    id: UUID
    email: str
    business_name: str
    plan: str
    trial_ends_at: datetime
    effective_tier: str | None = None
    is_admin: bool = False

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class SignupBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    business_name: str = Field(default="", max_length=255)


class LoginBody(BaseModel):
    email: EmailStr
    password: str


class ScreenCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class ScreenUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    regenerate_token: bool = False


class ScreenOut(BaseModel):
    id: UUID
    name: str
    slug: str
    token: str
    display_url_hint: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MediaOut(BaseModel):
    id: UUID
    filename: str
    file_url: str
    type: str
    duration_seconds: int | None
    size_bytes: int
    created_at: datetime
    mux_asset_id: str | None = None
    mux_playback_id: str | None = None
    mux_status: str | None = None
    thumbnail_url: str | None = None

    model_config = {"from_attributes": True}


class PlaylistItemIn(BaseModel):
    media_id: UUID
    duration_seconds: int = Field(ge=1, le=3600)
    sort_order: int = Field(ge=0)


class PlaylistItemOut(BaseModel):
    id: UUID
    media_id: UUID
    sort_order: int
    duration_seconds: int
    file_url: str
    type: str
    filename: str


class PlaylistPutBody(BaseModel):
    items: list[PlaylistItemIn]


class PublicPlaylistItem(BaseModel):
    type: str
    url: str
    duration_seconds: int


class PublicPlaylistResponse(BaseModel):
    playlist_version: str
    items: list[PublicPlaylistItem]


class AdminUserRow(BaseModel):
    id: UUID
    email: str
    business_name: str
    plan: str
    trial_ends_at: datetime
    is_admin: bool
    created_at: datetime
    effective_tier: str | None
    screen_count: int
    media_count: int


class AdminUserUpdate(BaseModel):
    business_name: str | None = Field(default=None, max_length=255)
    plan: str | None = Field(default=None, max_length=32)
    is_admin: bool | None = None
    trial_ends_at: datetime | None = None

    @field_validator("plan")
    @classmethod
    def plan_values(cls, v: str | None) -> str | None:
        if v is None:
            return v
        allowed = {"trialing", "starter", "pro", "business"}
        if v not in allowed:
            raise ValueError(f"plan must be one of: {', '.join(sorted(allowed))}")
        return v


# --- Menus ---


class MenuItemIn(BaseModel):
    name: str = Field(default="", max_length=200)
    price: str = Field(default="", max_length=32)


class MenuSectionIn(BaseModel):
    heading: str = Field(default="", max_length=200)
    items: list[MenuItemIn] = Field(default_factory=list)


class MenuCreate(BaseModel):
    title: str = Field(default="Menu", max_length=255)
    screen_id: UUID | None = None
    theme: str = Field(default="chalkboard", max_length=64)
    footer_note: str | None = Field(default=None, max_length=500)
    sections: list[MenuSectionIn] = Field(default_factory=list)

    @field_validator("theme")
    @classmethod
    def theme_only_chalkboard(cls, v: str) -> str:
        if v != "chalkboard":
            raise ValueError("Only theme 'chalkboard' is supported in MVP")
        return v


class MenuUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    screen_id: UUID | None = None
    theme: str | None = Field(default=None, max_length=64)
    footer_note: str | None = Field(default=None, max_length=500)
    sections: list[MenuSectionIn] | None = None

    @field_validator("theme")
    @classmethod
    def theme_only_chalkboard_u(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if v != "chalkboard":
            raise ValueError("Only theme 'chalkboard' is supported in MVP")
        return v


class MenuOut(BaseModel):
    id: UUID
    user_id: UUID
    screen_id: UUID | None
    title: str
    theme: str
    footer_note: str | None
    sections: list[dict]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RenderAccepted(BaseModel):
    job_id: UUID
    status: str = "pending"


class RenderJobOut(BaseModel):
    id: UUID
    menu_id: UUID
    status: str
    media_id: UUID | None
    error_message: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
