"""
Resume Media Router — resume images and video CV.

Public:
  GET /api/resume-media/images  — list resume images
  GET /api/resume-media/videos  — list video resumes
  GET /api/resume-media/view/{id} — stream file publicly (for display)

Admin only:
  POST   /api/resume-media/upload  — upload image or video
  DELETE /api/resume-media/{id}    — delete file
"""

import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from typing import Optional
import aiosqlite

from database import get_db, RESUME_MEDIA_DIR
from routers.auth import require_admin

router = APIRouter()

# ── Config ────────────────────────────────────────────────────────────────────
IMAGE_MIME    = {"image/jpeg", "image/png", "image/webp"}
IMAGE_EXT     = {".jpg", ".jpeg", ".png", ".webp"}
VIDEO_MIME    = {"video/mp4", "video/webm", "video/ogg", "video/quicktime"}
VIDEO_EXT     = {".mp4", ".webm", ".ogg", ".mov"}
MAX_IMAGE_MB  = 20
MAX_VIDEO_MB  = 200


def _ext(filename: str) -> str:
    return Path(filename).suffix.lower()


# ── Public: list images ───────────────────────────────────────────────────────
@router.get("/images")
async def list_images(db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute(
        "SELECT id, filename, original_name, mime_type, size_bytes, uploaded_at "
        "FROM resume_media WHERE type='image' ORDER BY uploaded_at DESC"
    )
    rows = await cursor.fetchall()
    return [{**dict(r), "url": f"/api/resume-media/view/{r['id']}"} for r in rows]


# ── Public: list videos ───────────────────────────────────────────────────────
@router.get("/videos")
async def list_videos(db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute(
        "SELECT id, filename, original_name, mime_type, size_bytes, uploaded_at "
        "FROM resume_media WHERE type='video' ORDER BY uploaded_at DESC"
    )
    rows = await cursor.fetchall()
    return [{**dict(r), "url": f"/api/resume-media/view/{r['id']}"} for r in rows]


# ── Public: stream file (for <img> and <video> tags) ─────────────────────────
@router.get("/view/{media_id}")
async def view_media(
    media_id: int,
    db: aiosqlite.Connection = Depends(get_db),
):
    row = await (await db.execute(
        "SELECT filename, original_name, mime_type FROM resume_media WHERE id=?",
        (media_id,)
    )).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Media not found")

    file_path = RESUME_MEDIA_DIR / row["filename"]
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File missing from server")

    return FileResponse(
        path=str(file_path),
        media_type=row["mime_type"],
        filename=row["original_name"],
    )


# ── Admin: upload ─────────────────────────────────────────────────────────────
@router.post("/upload", status_code=201)
async def upload_media(
    file: UploadFile = File(...),
    media_type: Optional[str] = Form("image"),   # "image" or "video"
    db: aiosqlite.Connection = Depends(get_db),
    _: str = Depends(require_admin),
):
    ext = _ext(file.filename or "")
    contents = await file.read()

    if media_type == "image":
        if ext not in IMAGE_EXT:
            raise HTTPException(status_code=400, detail="Image must be JPG, PNG or WebP")
        if len(contents) > MAX_IMAGE_MB * 1024 * 1024:
            raise HTTPException(status_code=400, detail=f"Image too large (max {MAX_IMAGE_MB} MB)")
        db_type = "image"
    elif media_type == "video":
        if ext not in VIDEO_EXT:
            raise HTTPException(status_code=400, detail="Video must be MP4, WebM, OGG or MOV")
        if len(contents) > MAX_VIDEO_MB * 1024 * 1024:
            raise HTTPException(status_code=400, detail=f"Video too large (max {MAX_VIDEO_MB} MB)")
        db_type = "video"
    else:
        raise HTTPException(status_code=400, detail="media_type must be 'image' or 'video'")

    stored_name = f"{uuid.uuid4()}{ext}"
    (RESUME_MEDIA_DIR / stored_name).write_bytes(contents)

    cursor = await db.execute(
        "INSERT INTO resume_media (type, filename, original_name, mime_type, size_bytes) "
        "VALUES (?,?,?,?,?)",
        (db_type, stored_name, file.filename,
         file.content_type or "application/octet-stream", len(contents)),
    )
    await db.commit()

    row = await (await db.execute(
        "SELECT id, type, filename, original_name, mime_type, size_bytes, uploaded_at "
        "FROM resume_media WHERE id=?", (cursor.lastrowid,)
    )).fetchone()

    return {**dict(row), "url": f"/api/resume-media/view/{row['id']}"}


# ── Admin: delete ─────────────────────────────────────────────────────────────
@router.delete("/{media_id}", status_code=204)
async def delete_media(
    media_id: int,
    db: aiosqlite.Connection = Depends(get_db),
    _: str = Depends(require_admin),
):
    row = await (await db.execute(
        "SELECT filename FROM resume_media WHERE id=?", (media_id,)
    )).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Media not found")

    file_path = RESUME_MEDIA_DIR / row["filename"]
    if file_path.exists():
        file_path.unlink()

    await db.execute("DELETE FROM resume_media WHERE id=?", (media_id,))
    await db.commit()
