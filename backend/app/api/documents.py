import json
from uuid import uuid4

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.core.config import get_settings
from app.schemas.documents import (
    CollectionFileResponse,
    ProcessDocumentResponse,
    UploadAndProcessResponse,
    UploadDocumentResponse,
)
from app.services.documents.chunker import split_documents
from app.services.documents.file_storage import (
    get_document_metadata,
    mark_document_processed,
    save_upload_file,
)
from app.services.documents.materials_store import delete_material, list_materials, save_material
from app.services.documents.text_extractor import extract_documents
from app.services.auth.auth_service import verify_token
from app.services.rag.vector_store import upsert_chunks

router = APIRouter()


def _email_from_token(token: str | None) -> str | None:
    if not token:
        return None
    payload = verify_token(token)
    return payload.get("sub") if payload else None


@router.post("/upload", response_model=UploadDocumentResponse)
def upload_document(file: UploadFile = File(...)) -> UploadDocumentResponse:
    settings = get_settings()
    metadata = save_upload_file(settings, file)
    return UploadDocumentResponse(
        document_id=metadata["document_id"],
        collection_id=metadata["collection_id"],
        filename=metadata["filename"],
        content_type=metadata.get("content_type"),
        status=metadata["status"],
    )


@router.post("/{document_id}/process", response_model=ProcessDocumentResponse)
def process_document(document_id: str) -> ProcessDocumentResponse:
    settings = get_settings()
    metadata = get_document_metadata(settings, document_id)
    collection_id = metadata.get("collection_id") or document_id
    documents = extract_documents(metadata["storage_path"], metadata["extension"])
    chunks = split_documents(
        document_id,
        documents,
        collection_id=collection_id,
        filename=metadata.get("filename"),
    )
    processed_path = settings.processed_dir / f"{document_id}.json"
    processed_path.write_text(
        json.dumps(
            {"document_id": document_id, "collection_id": collection_id, "chunks": chunks},
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    upsert_chunks(chunks, settings=settings)
    mark_document_processed(settings, document_id, len(chunks))
    return ProcessDocumentResponse(
        document_id=document_id,
        collection_id=collection_id,
        chunks_count=len(chunks),
        status="processed",
    )


@router.post("/upload-and-process", response_model=UploadAndProcessResponse)
def upload_and_process_documents(
    files: list[UploadFile] = File(...),
    token: str | None = Form(default=None),
    document_title: str | None = Form(default=None),
) -> UploadAndProcessResponse:
    settings = get_settings()
    if not files:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Выберите хотя бы один файл.")
    if len(files) > settings.max_files_per_upload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Можно загрузить не больше {settings.max_files_per_upload} файлов за один раз.",
        )

    collection_id = str(uuid4())
    file_results: list[CollectionFileResponse] = []
    all_chunks: list[dict] = []

    for file in files:
        metadata = save_upload_file(settings, file, collection_id=collection_id)
        try:
            documents = extract_documents(metadata["storage_path"], metadata["extension"])
            chunks = split_documents(
                metadata["document_id"],
                documents,
                collection_id=collection_id,
                filename=metadata.get("filename"),
            )
            all_chunks.extend(chunks)
            processed_path = settings.processed_dir / f"{metadata['document_id']}.json"
            processed_path.write_text(
                json.dumps(
                    {
                        "document_id": metadata["document_id"],
                        "collection_id": collection_id,
                        "filename": metadata.get("filename"),
                        "chunks": chunks,
                    },
                    ensure_ascii=False,
                    indent=2,
                ),
                encoding="utf-8",
            )
            mark_document_processed(settings, metadata["document_id"], len(chunks))
            file_results.append(
                CollectionFileResponse(
                    document_id=metadata["document_id"],
                    filename=metadata["filename"],
                    status="processed",
                    chunks_count=len(chunks),
                )
            )
        except HTTPException as exc:
            file_results.append(
                CollectionFileResponse(
                    document_id=metadata["document_id"],
                    filename=metadata["filename"],
                    status="error",
                    chunks_count=0,
                    error=str(exc.detail),
                )
            )

    if not all_chunks:
        first_error = next((f.error for f in file_results if f.error), "Не удалось обработать выбранные файлы.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=first_error)

    upsert_chunks(all_chunks, settings=settings)
    collection_path = settings.processed_dir / f"{collection_id}.collection.json"
    collection_path.write_text(
        json.dumps(
            {"collection_id": collection_id, "files": [f.model_dump() for f in file_results], "chunks_count": len(all_chunks)},
            ensure_ascii=False, indent=2,
        ),
        encoding="utf-8",
    )

    # Persist to user library if authenticated
    email = _email_from_token(token)
    if email:
        auto_title = document_title or (
            file_results[0].filename.rsplit(".", 1)[0] if len(file_results) == 1
            else ", ".join(f.filename.rsplit(".", 1)[0] for f in file_results)
        )
        save_material(
            user_email=email,
            collection_id=collection_id,
            document_title=auto_title,
            files=[f.model_dump() for f in file_results],
            chunks_count=len(all_chunks),
        )

    has_errors = any(f.status == "error" for f in file_results)
    return UploadAndProcessResponse(
        collection_id=collection_id,
        files=file_results,
        chunks_count=len(all_chunks),
        status="partial" if has_errors else "ready",
    )


# ─── Materials library endpoints ──────────────────────────────────────────────

class MaterialRecord:
    pass  # use dict directly, no extra schema needed


@router.get("/library")
def get_library(token: str) -> list[dict]:
    email = _email_from_token(token)
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Токен недействителен.")
    return list_materials(email)


@router.delete("/library/{collection_id}", status_code=204)
def remove_from_library(collection_id: str, token: str) -> None:
    email = _email_from_token(token)
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Токен недействителен.")
    if not delete_material(email, collection_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Материал не найден.")
