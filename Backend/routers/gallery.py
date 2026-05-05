"""
Gallery router — mixed image + video slider on Home page.

Public:
  GET /api/gallery/items  → all items (images + videos) ordered by sort_order

Admin only:
  POST   /api/gallery/upload    → upload image or video
  PATCH  /api/gallery/{id}      → update caption / sort_order
  DELETE /api/gallery/{id}      → delete item
"""

import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
import aiosqlite
from typing import Optional

from database import get_db, GALLERY_DIR
from routers.auth import require_admin

router = APIRouter()

IMAGE_EXT   = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
VIDEO_EXT   = {".mp4", ".webm", ".ogg", ".mov"}
ALL_EXT     = IMAGE_EXT | VIDEO_EXT

MAX_IMAGE   = 20  * 1024 * 1024   # 20 MB
MAX_VIDEO   = 200 * 1024 * 1024   # 200 MB


def _ext(filename: str) -> str:
    return Path(filename).suffix.lower()

def _media_type(ext: str) -> str:
    return "video" if ext in VIDEO_EXT else "image"


# ── Public: list all items ────────────────────────────────────────────────────
@router.get("/items")
async def list_items(db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute(
        "SELECT id, filename, caption, media_type, sort_order, uploaded_at "
        "FROM gallery_images ORDER BY sort_order ASC, id ASC"
    )
    rows = await cursor.fetchall()
    return [
        {**dict(row), "url": f"/uploads/gallery/{row['filename']}"}
        for row in rows
    ]

# Keep old endpoint for backward compat
@router.get("/images")
async def list_images(db: aiosqlite.Connection = Depends(get_db)):
    return await list_items(db)


# ── Admin: upload image or video ──────────────────────────────────────────────
@router.post("/upload", status_code=201)
async def upload_item(
    file: UploadFile = File(...),
    caption: Optional[str] = Form(""),
    db: aiosqlite.Connection = Depends(get_db),
    _: str = Depends(require_admin),
):
    ext = _ext(file.filename or "")
    if ext not in ALL_EXT:
        raise HTTPException(
            status_code=400,
            detail="Allowed: JPG, PNG, WebP, GIF (images) or MP4, WebM, MOV (videos)"
        )

    contents = await file.read()
    mtype = _media_type(ext)
    max_size = MAX_VIDEO if mtype == "video" else MAX_IMAGE

    if len(contents) > max_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large (max {max_size // (1024*1024)} MB for {mtype}s)"
        )

    row = await (await db.execute("SELECT MAX(sort_order) FROM gallery_images")).fetchone()
    next_order = (row[0] or 0) + 1

    stored_name = f"{uuid.uuid4()}{ext}"
    (GALLERY_DIR / stored_name).write_bytes(contents)

    cursor = await db.execute(
        "INSERT INTO gallery_images (filename, caption, media_type, sort_order) VALUES (?,?,?,?)",
        (stored_name, caption or "", mtype, next_order),
    )
    await db.commit()

    new_row = await (await db.execute(
        "SELECT id, filename, caption, media_type, sort_order, uploaded_at "
        "FROM gallery_images WHERE id=?",
        (cursor.lastrowid,)
    )).fetchone()

    return {**dict(new_row), "url": f"/uploads/gallery/{new_row['filename']}"}


# ── Admin: update caption / sort_order ───────────────────────────────────────
@router.patch("/{image_id}")
async def update_item(
    image_id: int,
    body: dict,
    db: aiosqlite.Connection = Depends(get_db),
    _: str = Depends(require_admin),
):
    row = await (await db.execute(
        "SELECT id FROM gallery_images WHERE id=?", (image_id,)
    )).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Item not found")

    if "caption" in body:
        await db.execute("UPDATE gallery_images SET caption=? WHERE id=?", (body["caption"], image_id))
    if "sort_order" in body:
        await db.execute("UPDATE gallery_images SET sort_order=? WHERE id=?", (body["sort_order"], image_id))
    await db.commit()

    updated = await (await db.execute(
        "SELECT id, filename, caption, media_type, sort_order FROM gallery_images WHERE id=?",
        (image_id,)
    )).fetchone()
    return {**dict(updated), "url": f"/uploads/gallery/{updated['filename']}"}


# ── Admin: delete ─────────────────────────────────────────────────────────────
@router.delete("/{image_id}", status_code=204)
async def delete_item(
    image_id: int,
    db: aiosqlite.Connection = Depends(get_db),
    _: str = Depends(require_admin),
):
    row = await (await db.execute(
        "SELECT filename FROM gallery_images WHERE id=?", (image_id,)
    )).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Item not found")

    file_path = GALLERY_DIR / row["filename"]
    if file_path.exists():
        file_path.unlink()

    await db.execute("DELETE FROM gallery_images WHERE id=?", (image_id,))
    await db.commit()
