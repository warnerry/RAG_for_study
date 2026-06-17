from typing import Any, Literal

from pydantic import BaseModel


StudyMode = Literal["summary", "exam_questions", "flashcards", "mnemonics"]


class StudyGenerateRequest(BaseModel):
    collection_id: str | None = None
    document_id: str | None = None
    mode: StudyMode
    count: int | None = None
    quality: bool = False


class StudyGenerateResponse(BaseModel):
    mode: StudyMode
    title: str | None = None
    sections: list[dict[str, Any]] | None = None
    sources: list[dict[str, Any]] | None = None
    items: list[dict[str, Any]]
