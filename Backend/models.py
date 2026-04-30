from pydantic import BaseModel, EmailStr, field_validator


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
