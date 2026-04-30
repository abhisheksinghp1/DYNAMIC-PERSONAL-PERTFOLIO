"""
Admin authentication router.
POST /api/auth/login  → returns JWT token
GET  /api/auth/me     → returns current admin info (requires token)

Default credentials (seeded in database.py):
  username: admin
  password: admin123
"""

import hashlib
import time
import hmac
import base64
import json

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from models import LoginRequest, TokenResponse
from database import get_db
import aiosqlite

router = APIRouter()
security = HTTPBearer(auto_error=False)

# ── Simple JWT-like token (no external deps) ──────────────────────────────────
SECRET = "portfolio_admin_secret_2024_aps"


def _make_token(username: str) -> str:
    payload = json.dumps({"sub": username, "iat": int(time.time())})
    payload_b64 = base64.urlsafe_b64encode(payload.encode()).decode()
    sig = hmac.new(SECRET.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
    return f"{payload_b64}.{sig}"


def _verify_token(token: str) -> str | None:
    try:
        payload_b64, sig = token.rsplit(".", 1)
        expected = hmac.new(SECRET.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            return None
        payload = json.loads(base64.urlsafe_b64decode(payload_b64).decode())
        return payload.get("sub")
    except Exception:
        return None


# ── Dependency: require valid admin token ─────────────────────────────────────
async def require_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: aiosqlite.Connection = Depends(get_db),
):
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    username = _verify_token(credentials.credentials)
    if not username:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    row = await (await db.execute(
        "SELECT id FROM admin WHERE username=?", (username,)
    )).fetchone()
    if not row:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin not found")
    return username


# ── Routes ────────────────────────────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    db: aiosqlite.Connection = Depends(get_db),
):
    pw_hash = hashlib.sha256(payload.password.encode()).hexdigest()
    row = await (await db.execute(
        "SELECT id FROM admin WHERE username=? AND password_hash=?",
        (payload.username, pw_hash),
    )).fetchone()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    token = _make_token(payload.username)
    return TokenResponse(access_token=token)


@router.get("/me")
async def me(username: str = Depends(require_admin)):
    return {"username": username, "role": "admin"}


@router.post("/change-password")
async def change_password(
    body: dict,
    username: str = Depends(require_admin),
    db: aiosqlite.Connection = Depends(get_db),
):
    new_pw = body.get("new_password", "").strip()
    if len(new_pw) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    pw_hash = hashlib.sha256(new_pw.encode()).hexdigest()
    await db.execute(
        "UPDATE admin SET password_hash=? WHERE username=?", (pw_hash, username)
    )
    await db.commit()
    return {"success": True, "message": "Password updated"}
