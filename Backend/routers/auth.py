"""
Admin authentication router.
POST /api/auth/login                  → returns JWT token
GET  /api/auth/me                     → returns current admin info (requires token)
POST /api/auth/request-otp            → sends OTP to admin email (requires token)
POST /api/auth/change-password        → verifies OTP and changes password (requires token)
POST /api/auth/forgot-password/send   → sends OTP via email or SMS (no token needed)
POST /api/auth/forgot-password/verify → verifies OTP and resets password (no token needed)
"""

import hashlib
import time
import hmac
import base64
import json
import random
import string
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from models import LoginRequest, TokenResponse
from database import get_db
import aiosqlite

router = APIRouter()
security = HTTPBearer(auto_error=False)

# ── Config ────────────────────────────────────────────────────────────────────
SECRET        = "portfolio_admin_secret_2024_aps"
ADMIN_EMAIL   = "abhishekpratapsingh1103@gmail.com"
ADMIN_PHONE   = "9721513367"
OTP_EXPIRY_S  = 300   # 5 minutes

# In-memory OTP stores
_otp_store: dict = {}           # for change-password (requires login)
_reset_otp_store: dict = {}     # for forgot-password (no login needed)


# ── Token helpers ─────────────────────────────────────────────────────────────
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


# ── OTP helpers ───────────────────────────────────────────────────────────────
def _generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


def _send_otp_email(otp: str) -> None:
    """Send OTP to the admin email via Gmail SMTP."""
    from config import settings

    if not settings.smtp_password:
        # Log OTP to console if SMTP not configured (dev mode)
        print(f"\n{'='*40}\nDEV MODE — OTP: {otp}\n{'='*40}\n")
        return

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"🔐 Your Password Change OTP — {otp}"
        msg["From"]    = f"Portfolio Admin <{settings.smtp_user}>"
        msg["To"]      = ADMIN_EMAIL

        text = f"Your OTP to change the admin password is: {otp}\n\nThis OTP expires in 5 minutes.\n\nIf you did not request this, ignore this email."

        html = f"""
<html><body style="font-family:sans-serif;background:#0a0a0f;color:#f0f0ff;padding:24px">
  <div style="max-width:480px;margin:auto;background:#13131f;border-radius:12px;overflow:hidden;border:1px solid rgba(108,99,255,.2)">
    <div style="background:linear-gradient(135deg,#6c63ff,#ff6584);padding:20px 24px">
      <h2 style="margin:0;color:#fff">🔐 Password Change OTP</h2>
    </div>
    <div style="padding:28px;text-align:center">
      <p style="color:#9090b0;margin-bottom:20px">Use this OTP to change your admin password:</p>
      <div style="font-size:2.5rem;font-weight:900;letter-spacing:12px;color:#6c63ff;
                  background:#0a0a0f;padding:20px;border-radius:12px;
                  border:2px solid rgba(108,99,255,0.3);font-family:monospace">
        {otp}
      </div>
      <p style="color:#5a5a7a;margin-top:20px;font-size:0.85rem">
        ⏱ Expires in <strong>5 minutes</strong>
      </p>
      <p style="color:#5a5a7a;font-size:0.8rem">
        If you did not request this, ignore this email.
      </p>
    </div>
  </div>
</body></html>"""

        msg.attach(MIMEText(text, "plain"))
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as s:
            s.ehlo(); s.starttls(); s.ehlo()
            s.login(settings.smtp_user, settings.smtp_password)
            s.sendmail(settings.smtp_user, ADMIN_EMAIL, msg.as_string())

    except Exception as e:
        print(f"[OTP email error] {e}")
        raise


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


# ── Step 1: Request OTP ───────────────────────────────────────────────────────
@router.post("/request-otp")
async def request_otp(username: str = Depends(require_admin)):
    otp = _generate_otp()
    _otp_store[username] = {
        "otp": otp,
        "expires_at": time.time() + OTP_EXPIRY_S,
    }
    try:
        _send_otp_email(otp)
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to send OTP email. Check SMTP configuration."
        )
    return {
        "success": True,
        "message": f"OTP sent to {ADMIN_EMAIL}. Valid for 5 minutes.",
        "email": ADMIN_EMAIL,
    }


# ── Step 2: Verify OTP + change password ─────────────────────────────────────
@router.post("/change-password")
async def change_password(
    body: dict,
    username: str = Depends(require_admin),
    db: aiosqlite.Connection = Depends(get_db),
):
    otp      = body.get("otp", "").strip()
    new_pw   = body.get("new_password", "").strip()

    if not otp:
        raise HTTPException(status_code=400, detail="OTP is required")
    if len(new_pw) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    # Verify OTP
    stored = _otp_store.get(username)
    if not stored:
        raise HTTPException(status_code=400, detail="No OTP requested. Please request an OTP first.")
    if time.time() > stored["expires_at"]:
        del _otp_store[username]
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
    if stored["otp"] != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP. Please check and try again.")

    # OTP valid — update password
    del _otp_store[username]
    pw_hash = hashlib.sha256(new_pw.encode()).hexdigest()
    await db.execute(
        "UPDATE admin SET password_hash=? WHERE username=?", (pw_hash, username)
    )
    await db.commit()
    return {"success": True, "message": "Password changed successfully!"}


# ── Forgot Password: Step 1 — Send OTP (no login required) ───────────────────
@router.post("/forgot-password/send")
async def forgot_password_send(
    body: dict,
    db: aiosqlite.Connection = Depends(get_db),
):
    """
    Send OTP via email or SMS for password reset.
    body: { "method": "email" | "sms" }
    No authentication required — this is the forgot password flow.
    """
    from config import settings

    method = body.get("method", "email").lower()
    if method not in ("email", "sms"):
        raise HTTPException(status_code=400, detail="method must be 'email' or 'sms'")

    # Get admin username from DB
    row = await (await db.execute("SELECT username FROM admin LIMIT 1")).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="No admin account found")

    username = row["username"]
    otp = _generate_otp()
    _reset_otp_store[username] = {
        "otp": otp,
        "expires_at": time.time() + OTP_EXPIRY_S,
    }

    if method == "email":
        # Send via email
        if not settings.smtp_password:
            print(f"\n{'='*40}\nFORGOT PASSWORD OTP (email): {otp}\n{'='*40}\n")
        else:
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = f"🔑 Password Reset OTP — {otp}"
                msg["From"]    = f"Portfolio Admin <{settings.smtp_user}>"
                msg["To"]      = ADMIN_EMAIL

                html = f"""
<html><body style="font-family:sans-serif;background:#0a0a0f;color:#f0f0ff;padding:24px">
  <div style="max-width:480px;margin:auto;background:#13131f;border-radius:12px;overflow:hidden;border:1px solid rgba(255,101,132,.2)">
    <div style="background:linear-gradient(135deg,#ff6584,#f7971e);padding:20px 24px">
      <h2 style="margin:0;color:#fff">🔑 Password Reset OTP</h2>
    </div>
    <div style="padding:28px;text-align:center">
      <p style="color:#9090b0;margin-bottom:20px">Use this OTP to reset your admin password:</p>
      <div style="font-size:2.5rem;font-weight:900;letter-spacing:12px;color:#ff6584;
                  background:#0a0a0f;padding:20px;border-radius:12px;
                  border:2px solid rgba(255,101,132,0.3);font-family:monospace">
        {otp}
      </div>
      <p style="color:#5a5a7a;margin-top:20px;font-size:0.85rem">⏱ Expires in <strong>5 minutes</strong></p>
      <p style="color:#5a5a7a;font-size:0.8rem">If you did not request this, ignore this email.</p>
    </div>
  </div>
</body></html>"""
                msg.attach(MIMEText(f"Your password reset OTP is: {otp}\nExpires in 5 minutes.", "plain"))
                msg.attach(MIMEText(html, "html"))

                with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as s:
                    s.ehlo(); s.starttls(); s.ehlo()
                    s.login(settings.smtp_user, settings.smtp_password)
                    s.sendmail(settings.smtp_user, ADMIN_EMAIL, msg.as_string())
            except Exception as e:
                print(f"[Forgot PW email error] {e}")
                raise HTTPException(status_code=500, detail="Failed to send OTP email")

        return {
            "success": True,
            "message": f"OTP sent to {ADMIN_EMAIL}",
            "masked": f"****{ADMIN_EMAIL[-10:]}",
            "method": "email",
        }

    else:
        # SMS via console (Twilio/SMS gateway can be added later)
        # For now: print to console + return masked number
        print(f"\n{'='*40}\nFORGOT PASSWORD OTP (SMS to {ADMIN_PHONE}): {otp}\n{'='*40}\n")

        # NOTE: To enable real SMS, add Twilio credentials to .env and uncomment:
        # from twilio.rest import Client
        # client = Client(settings.twilio_sid, settings.twilio_token)
        # client.messages.create(body=f"Your OTP: {otp}", from_=settings.twilio_from, to=f"+91{ADMIN_PHONE}")

        masked_phone = f"****{ADMIN_PHONE[-4:]}"
        return {
            "success": True,
            "message": f"OTP sent to {masked_phone}",
            "masked": masked_phone,
            "method": "sms",
            "dev_note": f"SMS not configured — OTP printed to backend console",
        }


# ── Forgot Password: Step 2 — Verify OTP + reset password ────────────────────
@router.post("/forgot-password/reset")
async def forgot_password_reset(
    body: dict,
    db: aiosqlite.Connection = Depends(get_db),
):
    """
    Verify OTP and set new password. No authentication required.
    body: { "otp": "123456", "new_password": "newpass" }
    """
    otp    = body.get("otp", "").strip()
    new_pw = body.get("new_password", "").strip()

    if not otp:
        raise HTTPException(status_code=400, detail="OTP is required")
    if len(new_pw) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    # Find admin
    row = await (await db.execute("SELECT username FROM admin LIMIT 1")).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="No admin account found")

    username = row["username"]
    stored = _reset_otp_store.get(username)

    if not stored:
        raise HTTPException(status_code=400, detail="No OTP requested. Please request an OTP first.")
    if time.time() > stored["expires_at"]:
        del _reset_otp_store[username]
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
    if stored["otp"] != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP. Please check and try again.")

    # OTP valid — update password
    del _reset_otp_store[username]
    pw_hash = hashlib.sha256(new_pw.encode()).hexdigest()
    await db.execute("UPDATE admin SET password_hash=? WHERE username=?", (pw_hash, username))
    await db.commit()

    return {"success": True, "message": "Password reset successfully! You can now log in."}
