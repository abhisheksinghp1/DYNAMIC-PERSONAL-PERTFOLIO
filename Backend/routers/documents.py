"""
Private Document Vault — admin-only.

ALL endpoints require a valid admin JWT.
No public static file serving for documents.

Supported file types: PDF, JPG, PNG, DOCX, DOC, XLSX, XLS, TXT, WebP
Max size: 50 MB
"""

import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
import aiosqlite

from database import get_db, DOCS_DIR
from routers.auth import require_admin

router = APIRouter()

# ── Config ────────────────────────────────────────────────────────────────────
MAX_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "application/octet-stream",  # fallback for some browsers
}

ALLOWED_EXTENSIONS = {
    ".pdf", ".jpg", ".jpeg", ".png", ".webp",
    ".doc", ".docx", ".xls", ".xlsx", ".txt",
}


def _ext(filename: str) -> str:
    return Path(filename).suffix.lower()


# ── List all documents (admin only) ──────────────────────────────────────────
@router.get("/")
async def list_documents(
    db: aiosqlite.Connection = Depends(get_db),
    _: str = Depends(require_admin),
):
    cursor = await db.execute(
        "SELECT id, original_name, mime_type, size_bytes, uploaded_at "
        "FROM documents ORDER BY uploaded_at DESC"
    )
    rows = await cursor.fetchall()
    return [dict(row) for row in rows]


# ── Upload document (admin only) ──────────────────────────────────────────────
@router.post("/upload", status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    db: aiosqlite.Connection = Depends(get_db),
    _: str = Depends(require_admin),
):
    ext = _ext(file.filename or "")
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed: PDF, JPG, PNG, DOCX, XLS, TXT"
        )

    contents = await file.read()

    if len(contents) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="File too large (max 50 MB)")

    # Save with UUID name to prevent path traversal
    stored_name = f"{uuid.uuid4()}{ext}"
    save_path = DOCS_DIR / stored_name
    save_path.write_bytes(contents)

    cursor = await db.execute(
        "INSERT INTO documents (filename, original_name, mime_type, size_bytes) "
        "VALUES (?, ?, ?, ?)",
        (stored_name, file.filename, file.content_type or "application/octet-stream", len(contents)),
    )
    await db.commit()

    row = await (await db.execute(
        "SELECT id, original_name, mime_type, size_bytes, uploaded_at FROM documents WHERE id=?",
        (cursor.lastrowid,)
    )).fetchone()

    return dict(row)


# ── Download document (admin only) ───────────────────────────────────────────
@router.get("/{doc_id}/download")
async def download_document(
    doc_id: int,
    db: aiosqlite.Connection = Depends(get_db),
    _: str = Depends(require_admin),
):
    row = await (await db.execute(
        "SELECT filename, original_name, mime_type FROM documents WHERE id=?", (doc_id,)
    )).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Document not found")

    file_path = DOCS_DIR / row["filename"]
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File missing from server")

    return FileResponse(
        path=str(file_path),
        media_type=row["mime_type"],
        filename=row["original_name"],
    )


# ── Delete document (admin only) ─────────────────────────────────────────────
@router.delete("/{doc_id}", status_code=204)
async def delete_document(
    doc_id: int,
    db: aiosqlite.Connection = Depends(get_db),
    _: str = Depends(require_admin),
):
    row = await (await db.execute(
        "SELECT filename FROM documents WHERE id=?", (doc_id,)
    )).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Document not found")

    # Remove file from disk (graceful if already missing)
    file_path = DOCS_DIR / row["filename"]
    if file_path.exists():
        file_path.unlink()

    await db.execute("DELETE FROM documents WHERE id=?", (doc_id,))
    await db.commit()
