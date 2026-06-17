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
    if mode == "summary":
        prompt = _build_prompt(mode, chunks, count=count)
        payload = generate_json(STUDY_SYSTEM_PROMPT, prompt, quality=quality, settings=settings)
        result = {"mode": mode, "items": payload.get("items", [])}
        result["title"] = payload.get("title", "Краткий пересказ материала")
        result["sections"] = payload.get("sections", [])
        result["sources"] = payload.get("sources", _sources_from_chunks(chunks))
        if not result["items"] and result["sections"]:
            result["items"] = result["sections"]
        return result

    if mode in {"flashcards", "exam_questions", "mnemonics"}:
        requested_count = _normalize_count(count)
        items = _generate_items_until_count(
            mode=mode,
            chunks=chunks,
            requested_count=requested_count,
            quality=quality,
            settings=settings,
        )
        items = _attach_source_files(items, chunks)
        result = {
            "mode": mode,
            "items": items,
            "requested_count": requested_count,
            "generated_count": len(items),
        }
        if len(items) < requested_count:
            noun = {
                "flashcards": "карточек",
                "exam_questions": "вопросов",
                "mnemonics": "мнемоник",
            }[mode]
            result["warning"] = f"По материалам удалось создать {len(items)} {noun} из {requested_count} без повторов."
        return result

    return {"mode": mode, "items": []}


def _build_prompt(mode: str, chunks: list[dict], count: int | None = None) -> str:
    count_hint = f"Количество элементов: {count}." if count else "Количество элементов выбери по объему материала."
    schemas = {
        "summary": '{"mode":"summary","title":"Краткий пересказ материала","sections":[{"title":"Главная идея","content":"..."},{"title":"Ключевые темы","items":["..."]},{"title":"Что важно запомнить","items":["..."]},{"title":"Что могут спросить","items":["..."]},{"title":"Сложные места","items":["..."]}],"sources":[{"chunk_id":"...","filename":"..."}]}',
        "exam_questions": '{"items":[{"question":"...","answer":"...","hint":"...","source_chunk_ids":["..."],"source_files":["..."]}]}',
        "flashcards": '{"items":[{"front":"...","back":"...","source_chunk_ids":["..."],"source_files":["..."]}]}',
        "mnemonics": '{"mode":"mnemonics","items":[{"concept":"...","hard_part":"...","association":"...","meme":"...","rhyme":"...","explanation":"...","example":"...","source_chunk_ids":["..."],"source_files":["..."]}]}',
    }
    instructions = {
        "summary": "Сделай не короткую аннотацию, а учебный пересказ для подготовки: главная идея, ключевые темы, что запомнить, что могут спросить и сложные места.",
        "exam_questions": "Сформируй проверочные вопросы с ответами и короткими подсказками.",
        "flashcards": "Сделай карточки для тренировки: лицевая сторона - термин, вопрос или правило; обратная сторона - ответ простым языком.",
        "mnemonics": (
            "Сделай мнемоники так, чтобы студент мог реально вспомнить материал на экзамене. "
            "Для каждого понятия обязательно заполни ВСЕ поля:\n"
            "- concept: название понятия или правила\n"
            "- hard_part: что именно сложно запомнить в этом понятии (конкретно)\n"
            "- association: бытовая или игровая ассоциация, образ из жизни студента\n"
            "- meme: современная студенческая шутка по теме — короткая, ироничная, помогающая запомнить. "
            "Пример стиля: «Без правоспособности ты как NPC без доступа к квестам». "
            "meme MUST be modern, student-friendly, funny and useful for memorization. "
            "Не оскорблять, без мата, без политоты.\n"
            "- rhyme: короткое рифмованное двустишие или четверостишие на русском, которое РЕАЛЬНО рифмуется "
            "и помогает запомнить суть понятия. "
            "rhyme MUST be a short rhymed mnemonic verse in Russian (2-4 lines that actually rhyme at the end). "
            "НЕ писать обычное предложение — только настоящую рифму.\n"
            "- explanation: простое объяснение почему ассоциация/рифма работает\n"
            "- example: конкретный пример из жизни или практики\n"
            "Не выдумывай факты вне документа. Если шутку придумать нельзя — дай нейтральную ассоциацию."
        ),
    }
    return (
        f"Режим: {mode}\n"
        f"{count_hint}\n"
        f"{instructions[mode]}\n"
        f"Верни JSON строго в формате: {schemas[mode]}\n\n"
        f"Контекст:\n{format_context(chunks)}"
    )


def _build_continuation_prompt(
    mode: str,
    chunks: list[dict],
    requested_count: int,
    existing_items: list[dict],
) -> str:
    existing_titles = "\n".join(f"- {_dedupe_key(mode, item)[:220]}" for item in existing_items)
    remaining = max(requested_count - len(existing_items), 1)
    return (
        f"{_build_prompt(mode, chunks, count=remaining)}\n\n"
        "Уже созданные элементы, их нельзя повторять:\n"
        f"{existing_titles}\n\n"
        f"Догенерируй еще до {remaining} новых элементов. Не повторяй уже созданные формулировки."
    )


def _normalize_count(count: int | None) -> int:
    if count is None:
        return 10
    return min(max(count, 1), 100)


def _generate_items_until_count(
    mode: str,
    chunks: list[dict],
    requested_count: int,
    quality: bool,
    settings: Settings,
) -> list[dict]:
    items: list[dict] = []
    seen: set[str] = set()

    for attempt in range(3):
        prompt = (
            _build_prompt(mode, chunks, count=requested_count)
            if attempt == 0
            else _build_continuation_prompt(mode, chunks, requested_count, items)
        )
        payload = generate_json(STUDY_SYSTEM_PROMPT, prompt, quality=quality, settings=settings)
        for item in payload.get("items", []):
            if not isinstance(item, dict):
                continue
            key = _dedupe_key(mode, item)
            if not key or key in seen:
                continue
            seen.add(key)
            items.append(item)
            if len(items) >= requested_count:
                return items[:requested_count]

        if len(items) >= requested_count:
            break

    return items[:requested_count]


def _dedupe_key(mode: str, item: dict) -> str:
    if mode == "flashcards":
        parts = [item.get("front"), item.get("term"), item.get("question"), item.get("back"), item.get("answer")]
    elif mode == "exam_questions":
        parts = [item.get("question"), item.get("answer")]
    elif mode == "mnemonics":
        parts = [item.get("concept"), item.get("hard_part"), item.get("association"), item.get("rhyme")]
    else:
        parts = list(item.values())
    return " ".join(str(part).strip().lower() for part in parts if part).strip()


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
