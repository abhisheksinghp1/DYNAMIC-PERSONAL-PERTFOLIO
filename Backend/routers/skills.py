"""
Skills router — full CRUD for categories and skills.

Public:
  GET  /api/skills/              → all categories with their skills

Admin only:
  POST   /api/skills/categories              → add category
  PUT    /api/skills/categories/{id}         → update category
  DELETE /api/skills/categories/{id}         → delete category + its skills
  POST   /api/skills/categories/{id}/skills  → add skill to category
  PUT    /api/skills/{skill_id}              → update skill
  DELETE /api/skills/{skill_id}             → delete skill
"""

from fastapi import APIRouter, Depends, HTTPException
from models import CategoryIn, CategoryOut, SkillIn, SkillOut
from database import get_db
from routers.auth import require_admin
import aiosqlite

router = APIRouter()


# ── helpers ───────────────────────────────────────────────────────────────────
async def _get_categories(db: aiosqlite.Connection) -> list[dict]:
    cats = await (await db.execute(
        "SELECT id, name, icon, color, sort_order FROM skill_categories ORDER BY sort_order, id"
    )).fetchall()
    result = []
    for cat in cats:
        cat = dict(cat)
        skills = await (await db.execute(
            "SELECT id, name, level, sort_order FROM skills WHERE category_id=? ORDER BY sort_order, id",
            (cat["id"],)
        )).fetchall()
        cat["skills"] = [dict(s) for s in skills]
        result.append(cat)
    return result


# ── public ────────────────────────────────────────────────────────────────────
@router.get("/", response_model=list[CategoryOut])
async def get_all_skills(db: aiosqlite.Connection = Depends(get_db)):
    return await _get_categories(db)


# ── categories (admin) ────────────────────────────────────────────────────────
@router.post("/categories", response_model=CategoryOut, status_code=201)
async def add_category(
    payload: CategoryIn,
    db: aiosqlite.Connection = Depends(get_db),
    _: str = Depends(require_admin),
):
    # Check duplicate name
    existing = await (await db.execute(
        "SELECT id FROM skill_categories WHERE name=?", (payload.name,)
    )).fetchone()
    if existing:
        raise HTTPException(status_code=400, detail="Category name already exists")

    cursor = await db.execute(
        "INSERT INTO skill_categories (name, icon, color, sort_order) VALUES (?,?,?,?)",
        (payload.name, payload.icon, payload.color, payload.sort_order),
    )
    await db.commit()
    row = await (await db.execute(
        "SELECT id, name, icon, color, sort_order FROM skill_categories WHERE id=?",
        (cursor.lastrowid,)
    )).fetchone()
    return {**dict(row), "skills": []}


@router.put("/categories/{cat_id}", response_model=CategoryOut)
async def update_category(
    cat_id: int,
    payload: CategoryIn,
    db: aiosqlite.Connection = Depends(get_db),
    _: str = Depends(require_admin),
):
    row = await (await db.execute(
        "SELECT id FROM skill_categories WHERE id=?", (cat_id,)
    )).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Category not found")

    await db.execute(
        "UPDATE skill_categories SET name=?, icon=?, color=?, sort_order=? WHERE id=?",
        (payload.name, payload.icon, payload.color, payload.sort_order, cat_id),
    )
    await db.commit()
    cats = await _get_categories(db)
    cat = next((c for c in cats if c["id"] == cat_id), None)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found after update")
    return cat


@router.delete("/categories/{cat_id}", status_code=204)
async def delete_category(
    cat_id: int,
    db: aiosqlite.Connection = Depends(get_db),
    _: str = Depends(require_admin),
):
    row = await (await db.execute(
        "SELECT id FROM skill_categories WHERE id=?", (cat_id,)
    )).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Category not found")
    await db.execute("DELETE FROM skill_categories WHERE id=?", (cat_id,))
    await db.commit()


# ── skills (admin) ────────────────────────────────────────────────────────────
@router.post("/categories/{cat_id}/skills", response_model=SkillOut, status_code=201)
async def add_skill(
    cat_id: int,
    payload: SkillIn,
    db: aiosqlite.Connection = Depends(get_db),
    _: str = Depends(require_admin),
):
    cat = await (await db.execute(
        "SELECT id FROM skill_categories WHERE id=?", (cat_id,)
    )).fetchone()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    cursor = await db.execute(
        "INSERT INTO skills (category_id, name, level, sort_order) VALUES (?,?,?,?)",
        (cat_id, payload.name, payload.level, payload.sort_order),
    )
    await db.commit()
    row = await (await db.execute(
        "SELECT id, name, level, sort_order FROM skills WHERE id=?", (cursor.lastrowid,)
    )).fetchone()
    return dict(row)


@router.put("/{skill_id}", response_model=SkillOut)
async def update_skill(
    skill_id: int,
    payload: SkillIn,
    db: aiosqlite.Connection = Depends(get_db),
    _: str = Depends(require_admin),
):
    row = await (await db.execute(
        "SELECT id FROM skills WHERE id=?", (skill_id,)
    )).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Skill not found")

    await db.execute(
        "UPDATE skills SET name=?, level=?, sort_order=? WHERE id=?",
        (payload.name, payload.level, payload.sort_order, skill_id),
    )
    await db.commit()
    row = await (await db.execute(
        "SELECT id, name, level, sort_order FROM skills WHERE id=?", (skill_id,)
    )).fetchone()
    return dict(row)


@router.delete("/{skill_id}", status_code=204)
async def delete_skill(
    skill_id: int,
    db: aiosqlite.Connection = Depends(get_db),
    _: str = Depends(require_admin),
):
    row = await (await db.execute(
        "SELECT id FROM skills WHERE id=?", (skill_id,)
    )).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Skill not found")
    await db.execute("DELETE FROM skills WHERE id=?", (skill_id,))
    await db.commit()
