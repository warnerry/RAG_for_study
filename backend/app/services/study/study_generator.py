from fastapi import HTTPException, status

from app.core.config import Settings, get_settings
from app.services.rag.generator import generate_json
from app.services.rag.prompts import STUDY_SYSTEM_PROMPT, format_context
from app.services.rag.retriever import retrieve_chunks, retrieve_collection_chunks


QUERY_BY_MODE = {
    "summary": "основные темы документа краткое содержание",
    "exam_questions": "ключевые понятия определения правила вопросы к экзамену",
    "flashcards": "термины определения факты для карточек",
    "mnemonics": "сложные понятия термины правила для запоминания",
}


def generate_study_activity(
    collection_id: str | None,
    mode: str,
    count: int | None = None,
    quality: bool = False,
    document_id: str | None = None,
    settings: Settings | None = None,
) -> dict:
    settings = settings or get_settings()
    query = QUERY_BY_MODE.get(mode)
    if not query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported study mode: {mode}",
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
    prompt = _build_prompt(mode, chunks, count=count)
    payload = generate_json(STUDY_SYSTEM_PROMPT, prompt, quality=quality, settings=settings)
    result = {"mode": mode, "items": payload.get("items", [])}
    if mode == "summary":
        result["title"] = payload.get("title", "Краткий пересказ материала")
        result["sections"] = payload.get("sections", [])
        result["sources"] = payload.get("sources", _sources_from_chunks(chunks))
        if not result["items"] and result["sections"]:
            result["items"] = result["sections"]
    if mode in {"flashcards", "exam_questions", "mnemonics"}:
        result["items"] = _attach_source_files(result["items"], chunks)
    return result


def _build_prompt(mode: str, chunks: list[dict], count: int | None = None) -> str:
    count_hint = f"Количество элементов: {count}." if count else "Количество элементов выбери по объему материала."
    schemas = {
        "summary": '{"mode":"summary","title":"Краткий пересказ материала","sections":[{"title":"Главная идея","content":"..."},{"title":"Ключевые темы","items":["..."]},{"title":"Что важно запомнить","items":["..."]},{"title":"Что могут спросить","items":["..."]},{"title":"Сложные места","items":["..."]}],"sources":[{"chunk_id":"...","filename":"..."}]}',
        "exam_questions": '{"items":[{"question":"...","answer":"...","hint":"...","source_chunk_ids":["..."],"source_files":["..."]}]}',
        "flashcards": '{"items":[{"front":"...","back":"...","source_chunk_ids":["..."],"source_files":["..."]}]}',
        "mnemonics": '{"mode":"mnemonics","items":[{"concept":"...","association":"...","memory_phrase":"...","why_it_works":"...","example":"...","source_chunk_ids":["..."],"source_files":["..."]}]}',
    }
    instructions = {
        "summary": "Сделай не короткую аннотацию, а учебный пересказ для подготовки: главная идея, ключевые темы, что запомнить, что могут спросить и сложные места.",
        "exam_questions": "Сформируй проверочные вопросы с ответами и короткими подсказками.",
        "flashcards": "Сделай карточки для тренировки: лицевая сторона - термин, вопрос или правило; обратная сторона - ответ простым языком.",
        "mnemonics": "Сделай мнемоники так, чтобы студент мог вспомнить материал на экзамене: бытовые образы, короткие фразы, рифмы, ассоциации, аналогии и мини-примеры. Не используй абстрактные пустые формулировки. Если хорошую мнемонику придумать нельзя, дай простое правило запоминания.",
    }
    return (
        f"Режим: {mode}\n"
        f"{count_hint}\n"
        f"{instructions[mode]}\n"
        f"Верни JSON строго в формате: {schemas[mode]}\n\n"
        f"Контекст:\n{format_context(chunks)}"
    )


def _sources_from_chunks(chunks: list[dict]) -> list[dict]:
    return [
        {
            "chunk_id": chunk["chunk_id"],
            "filename": (chunk.get("metadata") or {}).get("filename"),
        }
        for chunk in chunks
    ]


def _attach_source_files(items: list[dict], chunks: list[dict]) -> list[dict]:
    filename_by_chunk = {
        chunk["chunk_id"]: (chunk.get("metadata") or {}).get("filename")
        for chunk in chunks
    }
    for item in items:
        ids = item.get("source_chunk_ids") or []
        item["source_files"] = sorted({filename_by_chunk.get(chunk_id) for chunk_id in ids if filename_by_chunk.get(chunk_id)})
    return items
