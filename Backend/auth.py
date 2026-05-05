"""
Simple JWT auth for the admin panel.
Uses HS256 with a secret key from .env.
"""
import hashlib
import time
import hmac
import base64
import json
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config import settings

bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password: str, hashed: str) -> bool:
    return hmac.compare_digest(hash_password(password), hashed)


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64d(s: str) -> bytes:
    pad = 4 - len(s) % 4
    return base64.urlsafe_b64decode(s + "=" * pad)


def create_token(username: str) -> str:
    header  = _b64(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    payload = _b64(json.dumps({
        "sub": username,
        "exp": int(time.time()) + 60 * 60 * 8,   # 8 hours
    }).encode())
    sig = _b64(hmac.new(
        settings.secret_key.encode(),
        f"{header}.{payload}".encode(),
        hashlib.sha256,
    ).digest())
    return f"{header}.{payload}.{sig}"


def decode_token(token: str) -> dict:
    try:
        header, payload, sig = token.split(".")
        expected = _b64(hmac.new(
            settings.secret_key.encode(),
            f"{header}.{payload}".encode(),
            hashlib.sha256,
        ).digest())
        if not hmac.compare_digest(sig, expected):
            raise ValueError("bad signature")
        data = json.loads(_b64d(payload))
        if data["exp"] < time.time():
            raise ValueError("expired")
        return data
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def get_current_admin(
    creds: HTTPAuthorizationCredentials = Security(bearer_scheme),
):
    if not creds:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return decode_token(creds.credentials)
