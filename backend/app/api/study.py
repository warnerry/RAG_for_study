from fastapi import APIRouter, HTTPException, status

from app.schemas.study import SavedResult, StudyGenerateRequest, StudyGenerateResponse
from app.services.auth.auth_service import verify_token
from app.services.study.results_store import delete_result, list_results, upsert_result
from app.services.study.study_generator import generate_study_activity

router = APIRouter()


def _user_email_from_token(token: str | None) -> str | None:
    if not token:
        return None
    payload = verify_token(token)
    return payload.get("sub") if payload else None


@router.post("/generate", response_model=StudyGenerateResponse)
def generate_study(request: StudyGenerateRequest) -> StudyGenerateResponse:
    result = generate_study_activity(
        collection_id=request.collection_id,
        document_id=request.document_id,
        mode=request.mode,
        count=request.count,
        quality=request.quality,
    )

    email = _user_email_from_token(request.token)
    saved_id: str | None = None
    created_at: str | None = None
    updated_at: str | None = None

    if email and request.collection_id:
        doc_title = request.document_title or "Без названия"
        saved = upsert_result(
            user_email=email,
            collection_id=request.collection_id,
            mode=request.mode,
            document_title=doc_title,
            items=result.get("items", []),
            title=result.get("title"),
            sections=result.get("sections"),
            sources=result.get("sources"),
        )
        saved_id = saved["id"]
        created_at = saved["created_at"]
        updated_at = saved["updated_at"]

    return StudyGenerateResponse(
        **result,
        result_id=saved_id,
        document_title=request.document_title,
        created_at=created_at,
        updated_at=updated_at,
    )


@router.get("/results", response_model=list[SavedResult])
def get_results(token: str) -> list[SavedResult]:
    email = _user_email_from_token(token)
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Токен недействителен.")
    return [SavedResult(**r) for r in list_results(email)]


@router.delete("/results/{result_id}", status_code=204)
def remove_result(result_id: str, token: str) -> None:
    email = _user_email_from_token(token)
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Токен недействителен.")
    if not delete_result(result_id, email):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Результат не найден.")
