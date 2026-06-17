from fastapi import HTTPException, status

from app.core.config import Settings, get_settings
from app.services.rag.generator import generate_json
from app.services.rag.prompts import CONTEST_SYSTEM_PROMPT, format_context
from app.services.rag.retriever import retrieve_chunks, retrieve_collection_chunks


QUERY_BY_MODE = {
    "blitz": "правила обязанности права определения короткие вопросы",
    "two_to_one": "верные неверные утверждения правила обязанности определения",
    "union_biathlon": "темы разделы устав структура права обязанности локальные акты",
}


def generate_contest_training(
    collection_id: str | None,
    mode: str,
    quality: bool = False,
    document_id: str | None = None,
    settings: Settings | None = None,
) -> dict:
    settings = settings or get_settings()
    query = QUERY_BY_MODE.get(mode)
    if not query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported contest mode: {mode}",
        )
    if collection_id:
        chunks = retrieve_collection_chunks(collection_id, query, top_k=settings.default_top_k, settings=settings)
    elif document_id:
        chunks = retrieve_chunks(document_id, query, top_k=settings.default_top_k, settings=settings)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нужно передать collection_id.",
        )
    payload = generate_json(
        CONTEST_SYSTEM_PROMPT,
        _build_prompt(mode, chunks),
        quality=quality,
        settings=settings,
    )
    return _attach_source_files(_normalize_response(mode, payload), chunks)


def _build_prompt(mode: str, chunks: list[dict]) -> str:
    schemas = {
        "blitz": '{"mode":"blitz","time_limit_seconds":120,"questions":[{"question":"...","answer":"...","source_chunk_ids":["..."],"source_files":["..."]}]}',
        "two_to_one": '{"mode":"two_to_one","mistake_limit":2,"questions":[{"statement":"...","is_true":true,"explanation":"...","source_chunk_ids":["..."],"source_files":["..."]}]}',
        "union_biathlon": '{"mode":"union_biathlon","stations":[{"name":"...","questions":[{"question":"...","answer":"...","source_chunk_ids":["..."],"source_files":["..."]}]}]}',
    }
    return (
        f"Режим: {mode}\n"
        f"Верни JSON строго в формате: {schemas[mode]}\n\n"
        f"Контекст:\n{format_context(chunks)}"
    )


def _normalize_response(mode: str, payload: dict) -> dict:
    payload["mode"] = mode
    if mode == "blitz":
        payload.setdefault("time_limit_seconds", 120)
        payload.setdefault("questions", [])
    elif mode == "two_to_one":
        payload.setdefault("mistake_limit", 2)
        payload.setdefault("questions", [])
    elif mode == "union_biathlon":
        payload.setdefault("stations", [])
    return payload


def _attach_source_files(payload: dict, chunks: list[dict]) -> dict:
    filename_by_chunk = {
        chunk["chunk_id"]: (chunk.get("metadata") or {}).get("filename")
        for chunk in chunks
    }

    def enrich(item: dict) -> None:
        ids = item.get("source_chunk_ids") or []
        item["source_files"] = sorted({filename_by_chunk.get(chunk_id) for chunk_id in ids if filename_by_chunk.get(chunk_id)})

    for question in payload.get("questions") or []:
        enrich(question)
    for station in payload.get("stations") or []:
        for question in station.get("questions") or []:
            enrich(question)
    return payload
