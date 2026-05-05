"""
Hero Media Router — multiple photos/videos in the Home page hero card slider.

Public:
  GET /api/hero-video/items         → list all items ordered by sort_order
  GET /api/hero-video/stream/{id}   → stream a specific file

Admin only:
  POST   /api/hero-video/upload     → upload new photo or video
  DELETE /api/hero-video/{id}       → delete one item
  PATCH  /api/hero-video/reorder    → update sort_order for multiple items
"""

import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel
import aiosqlite

from database import get_db, HERO_VIDEO_DIR
from routers.auth import require_admin

router = APIRouter()

IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
VIDEO_EXT = {".mp4", ".webm", ".ogg", ".mov"}
ALL_EXT   = IMAGE_EXT | VIDEO_EXT
MAX_IMAGE = 20  * 1024 * 1024
MAX_VIDEO = 200 * 1024 * 1024


def _ext(filename: str) -> str:
    return Path(filename).suffix.lower()


class ReorderItem(BaseModel):
    id: int
    sort_order: int


# ── Public: list all items ────────────────────────────────────────────────────
@router.get("/items")
async def list_hero_items(db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute(
        "SELECT id, filename, mime_type, media_type, sort_order, uploaded_at "
        "FROM hero_video ORDER BY sort_order ASC, id ASC"
    )
    rows = await cursor.fetchall()
    return [
        {**dict(r), "url": f"/api/hero-video/stream/{r['id']}"}
        for r in rows
    ]


# ── Public: stream one item ───────────────────────────────────────────────────
@router.get("/stream/{item_id}")
async def stream_hero_item(
    item_id: int,
    db: aiosqlite.Connection = Depends(get_db),
):
    row = await (await db.execute(
        "SELECT filename, mime_type FROM hero_video WHERE id=?", (item_id,)
    )).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Item not found")
    file_path = HERO_VIDEO_DIR / row["filename"]
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File missing")
    return FileResponse(path=str(file_path), media_type=row["mime_type"])


# ── Admin: upload new item ────────────────────────────────────────────────────
@router.post("/upload", status_code=201)
async def upload_hero_item(
    file: UploadFile = File(...),
    db: aiosqlite.Connection = Depends(get_db),
    _: str = Depends(require_admin),
):
    ext = _ext(file.filename or "")
    if ext not in ALL_EXT:
        raise HTTPException(
            status_code=400,
            detail="Allowed: JPG, PNG, WebP, GIF or MP4, WebM, MOV"
        )

    contents = await file.read()
    is_video  = ext in VIDEO_EXT
    max_size  = MAX_VIDEO if is_video else MAX_IMAGE
    mtype_str = "video" if is_video else "image"

    if len(contents) > max_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large (max {max_size // (1024*1024)} MB)"
        )

    # Auto sort_order
    row = await (await db.execute("SELECT MAX(sort_order) FROM hero_video")).fetchone()
    next_order = (row[0] or 0) + 1

    stored_name = f"hero_{uuid.uuid4()}{ext}"
    (HERO_VIDEO_DIR / stored_name).write_bytes(contents)

    mime = file.content_type or ("video/mp4" if is_video else "image/jpeg")
    cursor = await db.execute(
        "INSERT INTO hero_video (filename, mime_type, media_type, sort_order) VALUES (?,?,?,?)",
        (stored_name, mime, mtype_str, next_order),
    )
    await db.commit()

    new = await (await db.execute(
        "SELECT id, filename, mime_type, media_type, sort_order FROM hero_video WHERE id=?",
        (cursor.lastrowid,)
    )).fetchone()

    return {**dict(new), "url": f"/api/hero-video/stream/{new['id']}"}


# ── Admin: delete one item ────────────────────────────────────────────────────
@router.delete("/{item_id}", status_code=204)
async def delete_hero_item(
    item_id: int,
    db: aiosqlite.Connection = Depends(get_db),
    _: str = Depends(require_admin),
):
    row = await (await db.execute(
        "SELECT filename FROM hero_video WHERE id=?", (item_id,)
    )).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Item not found")
    file_path = HERO_VIDEO_DIR / row["filename"]
    if file_path.exists():
        file_path.unlink()
    await db.execute("DELETE FROM hero_video WHERE id=?", (item_id,))
    await db.commit()


# ── Admin: reorder ────────────────────────────────────────────────────────────
@router.patch("/reorder")
async def reorder_hero_items(
    items: list[ReorderItem],
    db: aiosqlite.Connection = Depends(get_db),
    _: str = Depends(require_admin),
):
    for item in items:
        await db.execute(
            "UPDATE hero_video SET sort_order=? WHERE id=?",
            (item.sort_order, item.id)
        )
    await db.commit()
    return {"success": True}
