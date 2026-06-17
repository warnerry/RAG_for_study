from fastapi import APIRouter

from app.schemas.contest import ContestGenerateRequest, ContestGenerateResponse
from app.services.contest.contest_generator import generate_contest_training

router = APIRouter()


@router.post("/generate", response_model=ContestGenerateResponse)
def generate_contest(request: ContestGenerateRequest) -> ContestGenerateResponse:
    result = generate_contest_training(
        collection_id=request.collection_id,
        document_id=request.document_id,
        mode=request.mode,
        quality=request.quality,
    )
    return ContestGenerateResponse(**result)
