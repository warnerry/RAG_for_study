from fastapi import APIRouter

from app.schemas.contest import ContestGenerateRequest, ContestGenerateResponse
from app.services.auth.auth_service import verify_token
from app.services.contest.contest_generator import generate_contest_training
from app.services.study.results_store import upsert_result

router = APIRouter()


@router.post("/generate", response_model=ContestGenerateResponse)
def generate_contest(request: ContestGenerateRequest) -> ContestGenerateResponse:
    result = generate_contest_training(
        collection_id=request.collection_id,
        document_id=request.document_id,
        mode=request.mode,
        quality=request.quality,
        count=request.count,
    )

    result_id = None
    created_at = None
    updated_at = None

    if request.token and request.collection_id:
        payload = verify_token(request.token)
        if payload:
            email = payload.get("sub")
            if email:
                doc_title = request.document_title or "Без названия"
                questions = result.get("questions") or []
                saved = upsert_result(
                    user_email=email,
                    collection_id=request.collection_id,
                    mode="two_to_one",
                    document_title=doc_title,
                    items=questions,
                    title=f"2к1 по «{doc_title}»",
                )
                result_id = saved["id"]
                created_at = saved["created_at"]
                updated_at = saved["updated_at"]

    return ContestGenerateResponse(
        **result,
        result_id=result_id,
        created_at=created_at,
        updated_at=updated_at,
    )
