"""Simple email/password auth with JWT. Users stored in a JSON file."""
from __future__ import annotations

import json
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

import bcrypt
import jwt

from app.core.config import get_settings

_SECRET = os.environ.get("JWT_SECRET", "zachetka-secret-key-2024-please-change-in-prod")
_ALGO = "HS256"
_TTL_HOURS = 720


def _users_path() -> Path:
    settings = get_settings()
    path = settings.upload_dir.parent / "users.json"
    return path


def _load_users() -> dict[str, dict]:
    p = _users_path()
    if not p.exists():
        return {}
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _save_users(users: dict[str, dict]) -> None:
    p = _users_path()
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(users, ensure_ascii=False, indent=2), encoding="utf-8")


def register_user(email: str, password: str, name: str = "") -> dict:
    email = email.strip().lower()
    users = _load_users()
    if email in users:
        raise ValueError("Пользователь с таким email уже зарегистрирован.")
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    users[email] = {"email": email, "name": name.strip(), "password_hash": hashed}
    _save_users(users)
    return _make_token_response(email, name.strip())


def login_user(email: str, password: str) -> dict:
    email = email.strip().lower()
    users = _load_users()
    user = users.get(email)
    if not user:
        raise ValueError("Неверный email или пароль.")
    if not bcrypt.checkpw(password.encode(), user["password_hash"].encode()):
        raise ValueError("Неверный email или пароль.")
    return _make_token_response(email, user.get("name", ""))


def verify_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, _SECRET, algorithms=[_ALGO])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def get_user_profile(email: str) -> dict:
    users = _load_users()
    user = users.get(email.lower(), {})
    return {"email": user.get("email", email), "name": user.get("name", "")}


def update_user_name(email: str, name: str) -> dict:
    email = email.strip().lower()
    users = _load_users()
    if email not in users:
        raise ValueError("Пользователь не найден.")
    users[email]["name"] = name.strip()
    _save_users(users)
    return {"email": email, "name": name.strip()}


def _make_token_response(email: str, name: str) -> dict:
    exp = datetime.now(timezone.utc) + timedelta(hours=_TTL_HOURS)
    token = jwt.encode({"sub": email, "name": name, "exp": exp}, _SECRET, algorithm=_ALGO)
    return {"access_token": token, "token_type": "bearer", "email": email, "name": name}
