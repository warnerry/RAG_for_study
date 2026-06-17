from fastapi import HTTPException, status

from app.core.config import Settings, get_settings
from app.services.rag.vector_store import get_collection


def retrieve_chunks(
    document_id: str,
    query: str,
    top_k: int | None = None,
    settings: Settings | None = None,
) -> list[dict]:
    return _retrieve_by_filter(
        where={"document_id": document_id},
        query=query,
        top_k=top_k,
        not_found_label=f"документа {document_id}",
        settings=settings,
    )


def retrieve_collection_chunks(
    collection_id: str,
    query: str,
    top_k: int | None = None,
    settings: Settings | None = None,
) -> list[dict]:
    return _retrieve_by_filter(
        where={"collection_id": collection_id},
        query=query,
        top_k=top_k,
        not_found_label=f"коллекции {collection_id}",
        settings=settings,
    )


def _retrieve_by_filter(
    where: dict,
    query: str,
    not_found_label: str,
    top_k: int | None = None,
    settings: Settings | None = None,
) -> list[dict]:
    settings = settings or get_settings()
    n_results = top_k or settings.default_top_k
    collection = get_collection(settings)
    try:
        result = collection.query(
            query_texts=[query],
            n_results=n_results,
            where=where,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Не удалось найти фрагменты для {not_found_label}. Сначала обработайте материалы.",
        ) from exc

    ids = result.get("ids", [[]])[0]
    documents = result.get("documents", [[]])[0]
    metadatas = result.get("metadatas", [[]])[0]
    distances = result.get("distances", [[]])[0]
    if not ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Для {not_found_label} нет обработанных фрагментов.",
        )

    chunks = []
    for chunk_id, text, metadata, distance in zip(ids, documents, metadatas, distances):
        chunks.append(
            {
                "chunk_id": chunk_id,
                "text": text,
                "metadata": metadata or {},
                "score": _distance_to_score(distance),
            }
        )
    return chunks


def _distance_to_score(distance: float | int | None) -> float:
    if distance is None:
        return 0.0
    return round(1 / (1 + float(distance)), 4)
