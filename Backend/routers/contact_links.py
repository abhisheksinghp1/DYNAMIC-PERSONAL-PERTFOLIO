"""
Contact Links Router — dynamic contact/social links.

Public:
  GET /api/contact-links/  — list all links ordered by sort_order

Admin only:
  POST   /api/contact-links/          — add new link
  PUT    /api/contact-links/{id}      — update link
  DELETE /api/contact-links/{id}      — delete link
  PATCH  /api/contact-links/reorder   — reorder links
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
import aiosqlite

from database import get_db
from routers.auth import require_admin

router = APIRouter()


class LinkIn(BaseModel):
    label: str
    value: str
    url: Optional[str] = ""
    icon: Optional[str] = "🔗"
    type: Optional[str] = "link"
    sort_order: Optional[int] = 0


class LinkUpdate(BaseModel):
    label: Optional[str] = None
    value: Optional[str] = None
    url: Optional[str] = None
    icon: Optional[str] = None
    type: Optional[str] = None
    sort_order: Optional[int] = None


class ReorderItem(BaseModel):
    id: int
    sort_order: int


# ── Public ────────────────────────────────────────────────────────────────────
@router.get("/")
async def list_links(db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute(
        "SELECT id, label, value, url, icon, type, sort_order "
        "FROM contact_links ORDER BY sort_order ASC, id ASC"
    )
    rows = await cursor.fetchall()
    return [dict(row) for row in rows]


# ── Admin: create ─────────────────────────────────────────────────────────────
@router.post("/", status_code=201)
async def create_link(
    payload: LinkIn,
    db: aiosqlite.Connection = Depends(get_db),
    _: str = Depends(require_admin),
):
    if not payload.label.strip() or not payload.value.strip():
        raise HTTPException(status_code=422, detail="Label and value are required")

    row = await (await db.execute("SELECT MAX(sort_order) FROM contact_links")).fetchone()
    next_order = payload.sort_order if payload.sort_order else (row[0] or 0) + 1

    cursor = await db.execute(
        "INSERT INTO contact_links (label, value, url, icon, type, sort_order) VALUES (?,?,?,?,?,?)",
        (payload.label.strip(), payload.value.strip(), payload.url or "",
         payload.icon, payload.type, next_order),
    )
    await db.commit()

    new = await (await db.execute(
        "SELECT id, label, value, url, icon, type, sort_order FROM contact_links WHERE id=?",
        (cursor.lastrowid,)
    )).fetchone()
    return dict(new)


# ── Admin: update ─────────────────────────────────────────────────────────────
@router.put("/{link_id}")
async def update_link(
    link_id: int,
    payload: LinkUpdate,
    db: aiosqlite.Connection = Depends(get_db),
    _: str = Depends(require_admin),
):
    row = await (await db.execute(
        "SELECT id FROM contact_links WHERE id=?", (link_id,)
    )).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Link not found")

    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=422, detail="No fields to update")

    set_clause = ", ".join(f"{k}=?" for k in updates)
    await db.execute(
        f"UPDATE contact_links SET {set_clause} WHERE id=?",
        (*updates.values(), link_id)
    )
    await db.commit()

    updated = await (await db.execute(
        "SELECT id, label, value, url, icon, type, sort_order FROM contact_links WHERE id=?",
        (link_id,)
    )).fetchone()
    return dict(updated)


# ── Admin: delete ─────────────────────────────────────────────────────────────
@router.delete("/{link_id}", status_code=204)
async def delete_link(
    link_id: int,
    db: aiosqlite.Connection = Depends(get_db),
    _: str = Depends(require_admin),
):
    row = await (await db.execute(
        "SELECT id FROM contact_links WHERE id=?", (link_id,)
    )).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Link not found")

    await db.execute("DELETE FROM contact_links WHERE id=?", (link_id,))
    await db.commit()


# ── Admin: reorder ────────────────────────────────────────────────────────────
@router.patch("/reorder")
async def reorder_links(
    items: list[ReorderItem],
    db: aiosqlite.Connection = Depends(get_db),
    _: str = Depends(require_admin),
):
    for item in items:
        await db.execute(
            "UPDATE contact_links SET sort_order=? WHERE id=?",
            (item.sort_order, item.id)
        )
    await db.commit()
    return {"success": True, "updated": len(items)}
