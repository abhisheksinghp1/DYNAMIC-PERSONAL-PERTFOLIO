"""
Code Card Router — editable developer.py card on the Home page.

Public:
  GET /api/code-card/  → returns { filename, content }

Admin only:
  PUT /api/code-card/  → update filename and/or content
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
import aiosqlite

from database import get_db
from routers.auth import require_admin

router = APIRouter()

DEFAULT_FILENAME = "developer.py"
DEFAULT_CONTENT  = '''class Developer:
    def __init__(self):
        self.name = "Abhishek"
        self.role = "Full Stack Dev"
        self.stack = [
            "Python", "FastAPI",
            "Django", "Docker",
            "Kubernetes",
        ]

    def build(self):
        return "Amazing things 🚀"'''


class CodeCardUpdate(BaseModel):
    filename: Optional[str] = None
    content: Optional[str] = None


# ── Public: get card content ──────────────────────────────────────────────────
@router.get("/")
async def get_code_card(db: aiosqlite.Connection = Depends(get_db)):
    row = await (await db.execute(
        "SELECT filename, content FROM code_card ORDER BY id DESC LIMIT 1"
    )).fetchone()
    if not row:
        return {"filename": DEFAULT_FILENAME, "content": DEFAULT_CONTENT}
    return dict(row)


# ── Admin: update card content ────────────────────────────────────────────────
@router.put("/")
async def update_code_card(
    payload: CodeCardUpdate,
    db: aiosqlite.Connection = Depends(get_db),
    _: str = Depends(require_admin),
):
    row = await (await db.execute(
        "SELECT id, filename, content FROM code_card ORDER BY id DESC LIMIT 1"
    )).fetchone()

    if row:
        new_filename = payload.filename.strip() if payload.filename else row["filename"]
        new_content  = payload.content if payload.content is not None else row["content"]
        await db.execute(
            "UPDATE code_card SET filename=?, content=?, updated_at=datetime('now') WHERE id=?",
            (new_filename, new_content, row["id"])
        )
    else:
        new_filename = payload.filename.strip() if payload.filename else DEFAULT_FILENAME
        new_content  = payload.content if payload.content is not None else DEFAULT_CONTENT
        await db.execute(
            "INSERT INTO code_card (filename, content) VALUES (?,?)",
            (new_filename, new_content)
        )

    await db.commit()
    return {"filename": new_filename, "content": new_content, "success": True}
