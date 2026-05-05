"""
About Cards Router

Public:
  GET /api/about/cards  — list all cards ordered by sort_order

Admin only:
  POST   /api/about/cards          — create card
  PUT    /api/about/cards/{id}     — update card
  DELETE /api/about/cards/{id}     — delete card
  PATCH  /api/about/cards/reorder  — update sort_order for multiple cards
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
import aiosqlite

from database import get_db
from routers.auth import require_admin

router = APIRouter()


class CardIn(BaseModel):
    title: str
    content: str
    emoji: Optional[str] = "✨"
    color: Optional[str] = "#6c63ff"
    sort_order: Optional[int] = 0


class CardUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    emoji: Optional[str] = None
    color: Optional[str] = None
    sort_order: Optional[int] = None


class ReorderItem(BaseModel):
    id: int
    sort_order: int


# ── Public ────────────────────────────────────────────────────────────────────
@router.get("/cards")
async def list_cards(db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute(
        "SELECT id, title, content, emoji, color, sort_order, created_at "
        "FROM about_cards ORDER BY sort_order ASC, id ASC"
    )
    rows = await cursor.fetchall()
    return [dict(row) for row in rows]


# ── Admin: create ─────────────────────────────────────────────────────────────
@router.post("/cards", status_code=201)
async def create_card(
    payload: CardIn,
    db: aiosqlite.Connection = Depends(get_db),
    _: str = Depends(require_admin),
):
    if not payload.title.strip() or not payload.content.strip():
        raise HTTPException(status_code=422, detail="Title and content are required")

    # Auto sort_order
    row = await (await db.execute("SELECT MAX(sort_order) FROM about_cards")).fetchone()
    next_order = payload.sort_order if payload.sort_order else (row[0] or 0) + 1

    cursor = await db.execute(
        "INSERT INTO about_cards (title, content, emoji, color, sort_order) VALUES (?,?,?,?,?)",
        (payload.title.strip(), payload.content.strip(), payload.emoji, payload.color, next_order),
    )
    await db.commit()

    new = await (await db.execute(
        "SELECT id, title, content, emoji, color, sort_order, created_at FROM about_cards WHERE id=?",
        (cursor.lastrowid,)
    )).fetchone()
    return dict(new)


# ── Admin: update ─────────────────────────────────────────────────────────────
@router.put("/cards/{card_id}")
async def update_card(
    card_id: int,
    payload: CardUpdate,
    db: aiosqlite.Connection = Depends(get_db),
    _: str = Depends(require_admin),
):
    row = await (await db.execute(
        "SELECT id FROM about_cards WHERE id=?", (card_id,)
    )).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Card not found")

    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=422, detail="No fields to update")

    set_clause = ", ".join(f"{k}=?" for k in updates)
    await db.execute(
        f"UPDATE about_cards SET {set_clause} WHERE id=?",
        (*updates.values(), card_id)
    )
    await db.commit()

    updated = await (await db.execute(
        "SELECT id, title, content, emoji, color, sort_order, created_at FROM about_cards WHERE id=?",
        (card_id,)
    )).fetchone()
    return dict(updated)


# ── Admin: delete ─────────────────────────────────────────────────────────────
@router.delete("/cards/{card_id}", status_code=204)
async def delete_card(
    card_id: int,
    db: aiosqlite.Connection = Depends(get_db),
    _: str = Depends(require_admin),
):
    row = await (await db.execute(
        "SELECT id FROM about_cards WHERE id=?", (card_id,)
    )).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Card not found")

    await db.execute("DELETE FROM about_cards WHERE id=?", (card_id,))
    await db.commit()


# ── Admin: reorder (drag-and-drop) ────────────────────────────────────────────
@router.patch("/cards/reorder")
async def reorder_cards(
    items: list[ReorderItem],
    db: aiosqlite.Connection = Depends(get_db),
    _: str = Depends(require_admin),
):
    for item in items:
        await db.execute(
            "UPDATE about_cards SET sort_order=? WHERE id=?",
            (item.sort_order, item.id)
        )
    await db.commit()
    return {"success": True, "updated": len(items)}
