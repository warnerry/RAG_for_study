from typing import Any, Literal

from pydantic import BaseModel


StudyMode = Literal["summary", "exam_questions", "flashcards", "mnemonics"]


class StudyGenerateRequest(BaseModel):
    collection_id: str | None = None
    document_id: str | None = None
    mode: StudyMode
    count: int | None = None
    quality: bool = False
    token: str | None = None
    document_title: str | None = None


class StudyGenerateResponse(BaseModel):
    mode: StudyMode
    result_id: str | None = None
    document_title: str | None = None
    title: str | None = None
    sections: list[dict[str, Any]] | None = None
    sources: list[dict[str, Any]] | None = None
    requested_count: int | None = None
    generated_count: int | None = None
    warning: str | None = None
    items: list[dict[str, Any]]
    created_at: str | None = None
    updated_at: str | None = None


class SavedResult(BaseModel):
    id: str
    mode: str
    document_title: str
    collection_id: str
    item_count: int
    title: str | None = None
    items: list[dict[str, Any]]
    sections: list[dict[str, Any]] | None = None
    sources: list[dict[str, Any]] | None = None
    created_at: str
    updated_at: str
