from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional


# ── Contact ───────────────────────────────────────────────────────────────────
class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str

    @field_validator("name", "subject", "message")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Field must not be blank")
        return v.strip()


# ── Auth ──────────────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ── Skills ────────────────────────────────────────────────────────────────────
class SkillIn(BaseModel):
    name: str
    level: int
    sort_order: Optional[int] = 0

    @field_validator("level")
    @classmethod
    def valid_level(cls, v):
        if not 1 <= v <= 100:
            raise ValueError("Level must be between 1 and 100")
        return v


class SkillOut(BaseModel):
    id: int
    name: str
    level: int
    sort_order: int
    image_url: Optional[str] = ""


class CategoryIn(BaseModel):
    name: str
    icon: Optional[str] = "⚙️"
    color: Optional[str] = "#6c63ff"
    sort_order: Optional[int] = 0


class CategoryOut(BaseModel):
    id: int
    name: str
    icon: str
    color: str
    sort_order: int
    skills: list[SkillOut] = []
