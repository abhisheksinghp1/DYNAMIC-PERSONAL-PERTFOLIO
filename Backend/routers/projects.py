"""
Projects Router — persists projects to SQLite.

Public:
  GET /api/projects/        → list all projects

Admin only:
  POST   /api/projects/     → create project
  PATCH  /api/projects/{id} → update project
  DELETE /api/projects/{id} → delete project
"""

import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import aiosqlite

from database import get_db
from routers.auth import require_admin

router = APIRouter()


class ProjectIn(BaseModel):
    title:       str
    description: str
    tech:        List[str] = []
    github:      str = '#'
    live:        str = '#'
    color:       str = '#6c63ff'
    icon:        str = '🚀'
    stars:       int = 0
    forks:       int = 0


class ProjectUpdate(BaseModel):
    title:       Optional[str] = None
    description: Optional[str] = None
    tech:        Optional[List[str]] = None
    github:      Optional[str] = None
    live:        Optional[str] = None
    color:       Optional[str] = None
    icon:        Optional[str] = None
    stars:       Optional[int] = None
    forks:       Optional[int] = None


def _parse(row) -> dict:
    d = dict(row)
    try:
        d['tech'] = json.loads(d.get('tech', '[]'))
    except Exception:
        d['tech'] = []
    d['stats'] = {'stars': d.pop('stars', 0), 'forks': d.pop('forks', 0)}
    return d


# ── Public ────────────────────────────────────────────────────────────────────
@router.get("/")
async def list_projects(db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute(
        "SELECT id, title, description, tech, github, live, color, icon, stars, forks, sort_order "
        "FROM projects ORDER BY sort_order ASC, id ASC"
    )
    rows = await cursor.fetchall()
    return [_parse(r) for r in rows]


# ── Admin: create ─────────────────────────────────────────────────────────────
@router.post("/", status_code=201)
async def create_project(
    payload: ProjectIn,
    db: aiosqlite.Connection = Depends(get_db),
    _: str = Depends(require_admin),
):
    if not payload.title.strip() or not payload.description.strip():
        raise HTTPException(status_code=422, detail="Title and description are required")

    row = await (await db.execute("SELECT MAX(sort_order) FROM projects")).fetchone()
    next_order = (row[0] or 0) + 1

    cursor = await db.execute(
        "INSERT INTO projects (title, description, tech, github, live, color, icon, stars, forks, sort_order) "
        "VALUES (?,?,?,?,?,?,?,?,?,?)",
        (payload.title.strip(), payload.description.strip(),
         json.dumps(payload.tech), payload.github, payload.live,
         payload.color, payload.icon, payload.stars, payload.forks, next_order),
    )
    await db.commit()

    new = await (await db.execute(
        "SELECT id, title, description, tech, github, live, color, icon, stars, forks, sort_order "
        "FROM projects WHERE id=?", (cursor.lastrowid,)
    )).fetchone()
    return _parse(new)


# ── Admin: update ─────────────────────────────────────────────────────────────
@router.patch("/{project_id}")
async def update_project(
    project_id: int,
    payload: ProjectUpdate,
    db: aiosqlite.Connection = Depends(get_db),
    _: str = Depends(require_admin),
):
    row = await (await db.execute(
        "SELECT id FROM projects WHERE id=?", (project_id,)
    )).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Project not found")

    updates = payload.model_dump(exclude_none=True)
    if 'tech' in updates:
        updates['tech'] = json.dumps(updates['tech'])

    if updates:
        set_clause = ", ".join(f"{k}=?" for k in updates)
        await db.execute(
            f"UPDATE projects SET {set_clause} WHERE id=?",
            (*updates.values(), project_id)
        )
        await db.commit()

    updated = await (await db.execute(
        "SELECT id, title, description, tech, github, live, color, icon, stars, forks, sort_order "
        "FROM projects WHERE id=?", (project_id,)
    )).fetchone()
    return _parse(updated)


# ── Admin: delete ─────────────────────────────────────────────────────────────
@router.delete("/{project_id}", status_code=204)
async def delete_project(
    project_id: int,
    db: aiosqlite.Connection = Depends(get_db),
    _: str = Depends(require_admin),
):
    row = await (await db.execute(
        "SELECT id FROM projects WHERE id=?", (project_id,)
    )).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Project not found")
    await db.execute("DELETE FROM projects WHERE id=?", (project_id,))
    await db.commit()
