from fastapi import APIRouter, HTTPException, status

from app.core.config import get_settings
from app.schemas.chat import ChatRequest, ChatResponse, Source
from app.services.rag.generator import generate_chat_answer
from app.services.rag.retriever import retrieve_chunks, retrieve_collection_chunks

router = APIRouter()


@router.post("", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    settings = get_settings()
    if request.collection_id:
        chunks = retrieve_collection_chunks(
            request.collection_id,
            request.message,
            top_k=request.top_k or settings.default_top_k,
            settings=settings,
        )
    elif request.document_id:
        chunks = retrieve_chunks(
            request.document_id,
            request.message,
            top_k=request.top_k or settings.default_top_k,
            settings=settings,
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нужно передать collection_id.",
        )
    answer = generate_chat_answer(request.message, chunks, settings=settings)
    return ChatResponse(
        answer=answer,
        sources=[
            Source(
                chunk_id=chunk["chunk_id"],
                filename=(chunk.get("metadata") or {}).get("filename"),
                text=chunk["text"],
                score=chunk["score"],
            )
            for chunk in chunks
        ],
    )
