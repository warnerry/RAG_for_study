import json
import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status

from app.core.config import Settings


SUPPORTED_EXTENSIONS = {".pdf", ".txt", ".docx", ".md", ".pptx", ".xlsx", ".png", ".jpg", ".jpeg"}
SUPPORTED_FORMATS_LABEL = "PDF, DOCX, TXT, MD, PPTX, XLSX, PNG, JPG"


def _metadata_path(settings: Settings, document_id: str) -> Path:
    return settings.upload_dir / f"{document_id}.metadata.json"


def get_document_metadata(settings: Settings, document_id: str) -> dict:
    path = _metadata_path(settings, document_id)
    if not path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document {document_id} not found.",
        )
    return json.loads(path.read_text(encoding="utf-8"))


def save_upload_file(settings: Settings, upload_file: UploadFile, collection_id: str | None = None) -> dict:
    original_name = upload_file.filename or "uploaded-file"
    suffix = Path(original_name).suffix.lower()
    if suffix not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Неподдерживаемый формат файла. Поддерживаемые форматы: {SUPPORTED_FORMATS_LABEL}.",
        )

    document_id = str(uuid4())
    collection_id = collection_id or str(uuid4())
    stored_name = f"{document_id}{suffix}"
    storage_path = settings.upload_dir / stored_name

    with storage_path.open("wb") as output:
        shutil.copyfileobj(upload_file.file, output)

    metadata = {
        "document_id": document_id,
        "collection_id": collection_id,
        "filename": original_name,
        "content_type": upload_file.content_type,
        "extension": suffix,
        "storage_path": str(storage_path),
        "status": "uploaded",
    }
    _metadata_path(settings, document_id).write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return metadata


def mark_document_processed(settings: Settings, document_id: str, chunks_count: int) -> None:
    metadata = get_document_metadata(settings, document_id)
    metadata["status"] = "processed"
    metadata["chunks_count"] = chunks_count
    _metadata_path(settings, document_id).write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
