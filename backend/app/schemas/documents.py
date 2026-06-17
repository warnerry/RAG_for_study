from pydantic import BaseModel


class UploadDocumentResponse(BaseModel):
    document_id: str
    collection_id: str | None = None
    filename: str
    content_type: str | None
    status: str


class ProcessDocumentResponse(BaseModel):
    document_id: str
    collection_id: str | None = None
    chunks_count: int
    status: str


class CollectionFileResponse(BaseModel):
    document_id: str
    filename: str
    status: str
    chunks_count: int = 0
    error: str | None = None


class UploadAndProcessResponse(BaseModel):
    collection_id: str
    files: list[CollectionFileResponse]
    chunks_count: int
    status: str
