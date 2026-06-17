"""JSON-file persistence for generated study results."""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from app.core.config import get_settings


def _results_path() -> Path:
    settings = get_settings()
    return settings.upload_dir.parent / "generated_results.json"


def _load() -> list[dict]:
    p = _results_path()
    if not p.exists():
        return []
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return []


def _save(records: list[dict]) -> None:
    p = _results_path()
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")


def upsert_result(
    user_email: str,
    collection_id: str,
    mode: str,
    document_title: str,
    items: list[dict],
    title: str | None = None,
    sections: list[dict] | None = None,
    sources: list[dict] | None = None,
) -> dict:
    """Save or overwrite result (same user + collection_id + mode → update)."""
    records = _load()
    now = datetime.now(timezone.utc).isoformat()

    for rec in records:
        if (
            rec.get("user_email") == user_email
            and rec.get("collection_id") == collection_id
            and rec.get("mode") == mode
        ):
            rec["items"] = items
            rec["item_count"] = len(items)
            rec["updated_at"] = now
            rec["document_title"] = document_title
            if title is not None:
                rec["title"] = title
            if sections is not None:
                rec["sections"] = sections
            if sources is not None:
                rec["sources"] = sources
            _save(records)
            return rec

    rec: dict = {
        "id": str(uuid.uuid4()),
        "user_email": user_email,
        "collection_id": collection_id,
        "mode": mode,
        "document_title": document_title,
        "items": items,
        "item_count": len(items),
        "title": title,
        "sections": sections,
        "sources": sources,
        "created_at": now,
        "updated_at": now,
    }
    records.append(rec)
    _save(records)
    return rec


def list_results(user_email: str) -> list[dict]:
    """Return all results for a user, newest first."""
    records = _load()
    user_records = [r for r in records if r.get("user_email") == user_email]
    return sorted(user_records, key=lambda r: r.get("updated_at", ""), reverse=True)


def get_result(result_id: str, user_email: str) -> dict | None:
    for r in _load():
        if r.get("id") == result_id and r.get("user_email") == user_email:
            return r
    return None


def delete_result(result_id: str, user_email: str) -> bool:
    records = _load()
    new_records = [
        r for r in records
        if not (r.get("id") == result_id and r.get("user_email") == user_email)
    ]
    if len(new_records) == len(records):
        return False
    _save(new_records)
    return True
