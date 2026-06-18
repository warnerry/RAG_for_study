"""JSON-file persistence for chat message history per user+collection."""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from app.core.config import get_settings


def _path() -> Path:
    return get_settings().upload_dir.parent / "chat_history.json"


def _load() -> list[dict]:
    p = _path()
    if not p.exists():
        return []
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return []


def _save(records: list[dict]) -> None:
    p = _path()
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")


def save_message(user_email: str, collection_id: str, role: str, content: str) -> dict:
    """Append one message to the history."""
    records = _load()
    msg = {
        "id": str(uuid.uuid4()),
        "user_email": user_email,
        "collection_id": collection_id,
        "role": role,
        "content": content,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    records.append(msg)
    _save(records)
    return msg


def get_messages(user_email: str, collection_id: str) -> list[dict]:
    """Return all messages for a user+collection, oldest first."""
    records = _load()
    return [
        r for r in records
        if r.get("user_email") == user_email and r.get("collection_id") == collection_id
    ]


def clear_messages(user_email: str, collection_id: str) -> None:
    records = _load()
    _save([
        r for r in records
        if not (r.get("user_email") == user_email and r.get("collection_id") == collection_id)
    ])
