"""Per-user library of uploaded material collections (JSON persistence)."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from app.core.config import get_settings


def _path() -> Path:
    return get_settings().upload_dir.parent / "materials_library.json"


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


def save_material(
    user_email: str,
    collection_id: str,
    document_title: str,
    files: list[dict],
    chunks_count: int,
) -> dict:
    """Upsert: same user + collection_id = update, else create."""
    records = _load()
    now = datetime.now(timezone.utc).isoformat()

    for rec in records:
        if rec.get("user_email") == user_email and rec.get("collection_id") == collection_id:
            rec.update(
                document_title=document_title,
                files=files,
                chunks_count=chunks_count,
                updated_at=now,
            )
            _save(records)
            return rec

    rec = {
        "user_email": user_email,
        "collection_id": collection_id,
        "document_title": document_title,
        "files": files,
        "chunks_count": chunks_count,
        "created_at": now,
        "updated_at": now,
    }
    records.append(rec)
    _save(records)
    return rec


def list_materials(user_email: str) -> list[dict]:
    """Return all materials for a user, newest first."""
    records = _load()
    user = [r for r in records if r.get("user_email") == user_email]
    return sorted(user, key=lambda r: r.get("created_at", ""), reverse=True)


def delete_material(user_email: str, collection_id: str) -> bool:
    records = _load()
    new = [r for r in records if not (r.get("user_email") == user_email and r.get("collection_id") == collection_id)]
    if len(new) == len(records):
        return False
    _save(new)
    return True
