from fastapi import APIRouter, HTTPException, status

from app.core.config import get_settings
from app.schemas.chat import ChatHistoryMessage, ChatRequest, ChatResponse, Source
from app.services.auth.auth_service import verify_token
from app.services.chat.chat_store import clear_messages, get_messages, save_message
from app.services.rag.generator import generate_chat_answer
from app.services.rag.retriever import retrieve_chunks, retrieve_collection_chunks

router = APIRouter()


def _email(token: str | None) -> str | None:
    if not token:
        return None
    payload = verify_token(token)
    return payload.get("sub") if payload else None


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

    # Persist both messages if authenticated
    email = _email(request.token)
    if email and request.collection_id:
        save_message(email, request.collection_id, "user", request.message)
        save_message(email, request.collection_id, "assistant", answer)

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


@router.get("/history", response_model=list[ChatHistoryMessage])
def get_history(collection_id: str, token: str) -> list[ChatHistoryMessage]:
    email = _email(token)
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Токен недействителен.")
    msgs = get_messages(email, collection_id)
    return [ChatHistoryMessage(**m) for m in msgs]


@router.delete("/history", status_code=204)
def delete_history(collection_id: str, token: str) -> None:
    email = _email(token)
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Токен недействителен.")
    clear_messages(email, collection_id)
