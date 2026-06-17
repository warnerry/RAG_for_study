from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    collection_id: str | None = None
    document_id: str | None = None
    message: str
    top_k: int | None = Field(default=None, ge=1, le=12)


class Source(BaseModel):
    chunk_id: str
    filename: str | None = None
    text: str
    score: float


class ChatResponse(BaseModel):
    answer: str
    sources: list[Source]
