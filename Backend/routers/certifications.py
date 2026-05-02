"""
Certifications Router

Public:
  GET /api/certifications/              → list all certs
  GET /api/certifications/{id}/pdf      → download PDF (public)
  GET /api/certifications/{id}/image    → view image (public)

Admin only:
  POST   /api/certifications/           → create cert (with optional PDF + image)
  PATCH  /api/certifications/{id}       → update text fields
  POST   /api/certifications/{id}/pdf   → upload/replace PDF
  POST   /api/certifications/{id}/image → upload/replace image
  DELETE /api/certifications/{id}       → delete cert + files
"""

import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from typing import Optional
import aiosqlite

from database import get_db, CERT_DIR
from routers.auth import require_admin

router = APIRouter()

IMG_EXT = {".jpg", ".jpeg", ".png", ".webp"}
PDF_EXT = {".pdf"}


def _ext(filename: str) -> str:
    return Path(filename or "").suffix.lower()


def _row_to_dict(row) -> dict:
    d = dict(row)
    d["has_pdf"]   = bool(d.get("pdf_filename"))
    d["has_image"] = bool(d.get("img_filename"))
    return d


# ── Public: list ──────────────────────────────────────────────────────────────
@router.get("/")
async def list_certs(db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute(
        "SELECT id, title, organization, description, issue_date, credential_id, "
        "pdf_filename, img_filename, card_color, created_at "
        "FROM certifications ORDER BY created_at DESC"
    )
    rows = await cursor.fetchall()
    return [_row_to_dict(r) for r in rows]


# ── Public: download PDF ──────────────────────────────────────────────────────
@router.get("/{cert_id}/pdf")
async def download_pdf(cert_id: int, db: aiosqlite.Connection = Depends(get_db)):
    row = await (await db.execute(
        "SELECT pdf_filename, title FROM certifications WHERE id=?", (cert_id,)
    )).fetchone()
    if not row or not row["pdf_filename"]:
        raise HTTPException(status_code=404, detail="PDF not found")
    path = CERT_DIR / row["pdf_filename"]
    if not path.exists():
        raise HTTPException(status_code=404, detail="PDF file missing")
    return FileResponse(
        path=str(path),
        media_type="application/pdf",
        filename=f"{row['title']}.pdf",
    )


# ── Public: view image ────────────────────────────────────────────────────────
@router.get("/{cert_id}/image")
async def view_image(cert_id: int, db: aiosqlite.Connection = Depends(get_db)):
    row = await (await db.execute(
        "SELECT img_filename FROM certifications WHERE id=?", (cert_id,)
    )).fetchone()
    if not row or not row["img_filename"]:
        raise HTTPException(status_code=404, detail="Image not found")
    path = CERT_DIR / row["img_filename"]
    if not path.exists():
        raise HTTPException(status_code=404, detail="Image file missing")
    ext = _ext(row["img_filename"])
    mime = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp"}.get(ext.lstrip("."), "image/jpeg")
    return FileResponse(path=str(path), media_type=mime)


# ── Admin: create cert ────────────────────────────────────────────────────────
@router.post("/", status_code=201)
async def create_cert(
    title:         str = Form(...),
    organization:  str = Form(...),
    description:   str = Form(""),
    issue_date:    str = Form(""),
    credential_id: str = Form(""),
    card_color:    str = Form("#6c63ff"),
    pdf_file:      Optional[UploadFile] = File(None),
    img_file:      Optional[UploadFile] = File(None),
    db: aiosqlite.Connection = Depends(get_db),
    _: str = Depends(require_admin),
):
    if not title.strip() or not organization.strip():
        raise HTTPException(status_code=422, detail="Title and organization are required")

    pdf_name = ""
    img_name = ""

    if pdf_file and pdf_file.filename:
        ext = _ext(pdf_file.filename)
        if ext not in PDF_EXT:
            raise HTTPException(status_code=400, detail="Certificate file must be PDF")
        contents = await pdf_file.read()
        if len(contents) > 20 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="PDF too large (max 20 MB)")
        pdf_name = f"cert_{uuid.uuid4()}{ext}"
        (CERT_DIR / pdf_name).write_bytes(contents)

    if img_file and img_file.filename:
        ext = _ext(img_file.filename)
        if ext not in IMG_EXT:
            raise HTTPException(status_code=400, detail="Image must be JPG, PNG or WebP")
        contents = await img_file.read()
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Image too large (max 10 MB)")
        img_name = f"cert_img_{uuid.uuid4()}{ext}"
        (CERT_DIR / img_name).write_bytes(contents)

    cursor = await db.execute(
        "INSERT INTO certifications (title, organization, description, issue_date, credential_id, pdf_filename, img_filename, card_color) "
        "VALUES (?,?,?,?,?,?,?,?)",
        (title.strip(), organization.strip(), description, issue_date, credential_id, pdf_name, img_name, card_color),
    )
    await db.commit()

    row = await (await db.execute(
        "SELECT * FROM certifications WHERE id=?", (cursor.lastrowid,)
    )).fetchone()
    return _row_to_dict(row)


# ── Admin: update text fields ─────────────────────────────────────────────────
@router.patch("/{cert_id}")
async def update_cert(
    cert_id: int,
    body: dict,
    db: aiosqlite.Connection = Depends(get_db),
    _: str = Depends(require_admin),
):
    row = await (await db.execute(
        "SELECT id FROM certifications WHERE id=?", (cert_id,)
    )).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Certificate not found")

    allowed = {"title", "organization", "description", "issue_date", "credential_id", "card_color"}
    updates = {k: v for k, v in body.items() if k in allowed}
    if updates:
        set_clause = ", ".join(f"{k}=?" for k in updates)
        await db.execute(
            f"UPDATE certifications SET {set_clause} WHERE id=?",
            (*updates.values(), cert_id)
        )
        await db.commit()

    row = await (await db.execute("SELECT id, title, organization, description, issue_date, credential_id, pdf_filename, img_filename, card_color, created_at FROM certifications WHERE id=?", (cert_id,))).fetchone()
    return _row_to_dict(row)


# ── Admin: upload/replace PDF ─────────────────────────────────────────────────
@router.post("/{cert_id}/pdf")
async def upload_pdf(
    cert_id: int,
    file: UploadFile = File(...),
    db: aiosqlite.Connection = Depends(get_db),
    _: str = Depends(require_admin),
):
    row = await (await db.execute(
        "SELECT pdf_filename FROM certifications WHERE id=?", (cert_id,)
    )).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Certificate not found")

    ext = _ext(file.filename or "")
    if ext not in PDF_EXT:
        raise HTTPException(status_code=400, detail="File must be PDF")

    contents = await file.read()
    if len(contents) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="PDF too large (max 20 MB)")

    # Delete old PDF
    if row["pdf_filename"]:
        old = CERT_DIR / row["pdf_filename"]
        if old.exists(): old.unlink()

    new_name = f"cert_{uuid.uuid4()}{ext}"
    (CERT_DIR / new_name).write_bytes(contents)
    await db.execute("UPDATE certifications SET pdf_filename=? WHERE id=?", (new_name, cert_id))
    await db.commit()
    return {"success": True, "pdf_filename": new_name}


# ── Admin: upload/replace image ───────────────────────────────────────────────
@router.post("/{cert_id}/image")
async def upload_image(
    cert_id: int,
    file: UploadFile = File(...),
    db: aiosqlite.Connection = Depends(get_db),
    _: str = Depends(require_admin),
):
    row = await (await db.execute(
        "SELECT img_filename FROM certifications WHERE id=?", (cert_id,)
    )).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Certificate not found")

    ext = _ext(file.filename or "")
    if ext not in IMG_EXT:
        raise HTTPException(status_code=400, detail="Image must be JPG, PNG or WebP")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 10 MB)")

    if row["img_filename"]:
        old = CERT_DIR / row["img_filename"]
        if old.exists(): old.unlink()

    new_name = f"cert_img_{uuid.uuid4()}{ext}"
    (CERT_DIR / new_name).write_bytes(contents)
    await db.execute("UPDATE certifications SET img_filename=? WHERE id=?", (new_name, cert_id))
    await db.commit()
    return {"success": True, "img_filename": new_name}


# ── Admin: delete ─────────────────────────────────────────────────────────────
@router.delete("/{cert_id}", status_code=204)
async def delete_cert(
    cert_id: int,
    db: aiosqlite.Connection = Depends(get_db),
    _: str = Depends(require_admin),
):
    row = await (await db.execute(
        "SELECT pdf_filename, img_filename FROM certifications WHERE id=?", (cert_id,)
    )).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Certificate not found")

    for fname in [row["pdf_filename"], row["img_filename"]]:
        if fname:
            p = CERT_DIR / fname
            if p.exists(): p.unlink()

    await db.execute("DELETE FROM certifications WHERE id=?", (cert_id,))
    await db.commit()
