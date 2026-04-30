from fastapi import APIRouter, Depends, BackgroundTasks
from models import ContactRequest
from database import get_db
from email_service import send_notification_email
import aiosqlite

router = APIRouter()


@router.post("/send", status_code=201)
async def send_message(
    payload: ContactRequest,
    background_tasks: BackgroundTasks,
    db: aiosqlite.Connection = Depends(get_db),
):
    cursor = await db.execute(
        "INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)",
        (payload.name, payload.email, payload.subject, payload.message),
    )
    await db.commit()

    background_tasks.add_task(
        send_notification_email,
        name=payload.name,
        email=payload.email,
        subject=payload.subject,
        message=payload.message,
    )

    return {
        "success": True,
        "message": f"Thanks {payload.name}! Your message has been received. I'll reply soon.",
        "id": cursor.lastrowid,
    }


@router.get("/messages")
async def get_messages(db: aiosqlite.Connection = Depends(get_db)):
    cursor = await db.execute(
        "SELECT id, name, email, subject, message, created_at FROM contact_messages ORDER BY created_at DESC"
    )
    rows = await cursor.fetchall()
    return [dict(row) for row in rows]
