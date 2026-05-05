"""
Resume router.

Public:
  GET /api/resume/info      → { uploaded: bool, filename: str, uploaded_at: str }
  GET /api/resume/download  → streams the PDF file

Admin only:
  POST   /api/resume/upload  → upload a new PDF (replaces previous)
  DELETE /api/resume/        → delete the resume
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse

from database import get_db, UPLOAD_DIR
from routers.auth import require_admin
import aiosqlite
import shutil

router = APIRouter()

ALLOWED_TYPES = {"application/pdf", "application/octet-stream"}
MAX_SIZE_MB   = 10


# ── public ────────────────────────────────────────────────────────────────────
@router.get("/info")
async def resume_info(db: aiosqlite.Connection = Depends(get_db)):
    row = await (await db.execute(
        "SELECT filename, uploaded_at FROM resume ORDER BY id DESC LIMIT 1"
    )).fetchone()
    if not row:
        return {"uploaded": False, "filename": None, "uploaded_at": None}
    file_path = UPLOAD_DIR / row["filename"]
    if not file_path.exists():
        return {"uploaded": False, "filename": None, "uploaded_at": None}
    return {
        "uploaded": True,
        "filename": row["filename"],
        "uploaded_at": row["uploaded_at"],
    }


@router.get("/download")
async def download_resume(db: aiosqlite.Connection = Depends(get_db)):
    row = await (await db.execute(
        "SELECT filename FROM resume ORDER BY id DESC LIMIT 1"
    )).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="No resume uploaded yet")
    file_path = UPLOAD_DIR / row["filename"]
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Resume file not found on server")
    return FileResponse(
        path=str(file_path),
        media_type="application/pdf",
        filename="Abhishek_Pratap_Singh_Resume.pdf",
    )


# ── admin ─────────────────────────────────────────────────────────────────────
@router.post("/upload", status_code=201)
async def upload_resume(
    file: UploadFile = File(...),
    db: aiosqlite.Connection = Depends(get_db),
    _: str = Depends(require_admin),
):
    # Validate file type
    if file.content_type not in ALLOWED_TYPES and not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    # Validate file size
    contents = await file.read()
    if len(contents) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File too large (max {MAX_SIZE_MB}MB)")

    # Save file
    save_path = UPLOAD_DIR / "resume.pdf"
    with open(save_path, "wb") as f:
        f.write(contents)

    # Update DB record
    await db.execute("DELETE FROM resume")
    await db.execute(
        "INSERT INTO resume (filename) VALUES (?)", ("resume.pdf",)
    )
    await db.commit()

    return {"success": True, "message": "Resume uploaded successfully", "filename": "resume.pdf"}


@router.delete("/", status_code=204)
async def delete_resume(
    db: aiosqlite.Connection = Depends(get_db),
    _: str = Depends(require_admin),
):
    row = await (await db.execute(
        "SELECT filename FROM resume ORDER BY id DESC LIMIT 1"
    )).fetchone()
    if row:
        file_path = UPLOAD_DIR / row["filename"]
        if file_path.exists():
            file_path.unlink()
    await db.execute("DELETE FROM resume")
    await db.commit()
