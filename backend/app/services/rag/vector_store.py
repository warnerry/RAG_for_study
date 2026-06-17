from functools import lru_cache

from fastapi import HTTPException, status

from app.core.config import Settings, get_settings

COLLECTION_NAME = "documents"


@lru_cache
def _embedding_function(model_name: str):
    from chromadb.utils import embedding_functions

    return embedding_functions.SentenceTransformerEmbeddingFunction(model_name=model_name)


def get_collection(settings: Settings | None = None):
    import chromadb

    settings = settings or get_settings()
    if settings.embeddings_provider != "local":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Сейчас поддерживаются только локальные эмбеддинги.",
        )
    client = chromadb.PersistentClient(path=str(settings.chroma_persist_dir))
    return client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=_embedding_function(settings.embeddings_model),
    )


def upsert_chunks(chunks: list[dict], settings: Settings | None = None) -> None:
    if not chunks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нет смысловых фрагментов для индексации.",
        )

    collection = get_collection(settings)
    collection_id = chunks[0].get("collection_id")
    if collection_id and all(chunk.get("collection_id") == collection_id for chunk in chunks):
        try:
            collection.delete(where={"collection_id": collection_id})
        except Exception:
            pass
    else:
        for document_id in {chunk["document_id"] for chunk in chunks}:
            try:
                collection.delete(where={"document_id": document_id})
            except Exception:
                pass

    collection.upsert(
        ids=[chunk["chunk_id"] for chunk in chunks],
        documents=[chunk["text"] for chunk in chunks],
        metadatas=[_safe_metadata(chunk["metadata"]) for chunk in chunks],
    )


def _safe_metadata(metadata: dict) -> dict:
    return {
        key: value
        for key, value in metadata.items()
        if value is not None and isinstance(value, (str, int, float, bool))
    }
