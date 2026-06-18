from typing import Any, Literal

from pydantic import BaseModel


ContestMode = Literal["blitz", "two_to_one", "union_biathlon"]


class ContestGenerateRequest(BaseModel):
    collection_id: str | None = None
    document_id: str | None = None
    mode: ContestMode
    quality: bool = False
    count: int = 10
    token: str | None = None
    document_title: str | None = None


class ContestGenerateResponse(BaseModel):
    mode: ContestMode
    time_limit_seconds: int | None = None
    mistake_limit: int | None = None
    questions: list[dict[str, Any]] | None = None
    stations: list[dict[str, Any]] | None = None
    result_id: str | None = None
    created_at: str | None = None
    updated_at: str | None = None
