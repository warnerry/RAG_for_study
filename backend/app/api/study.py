from fastapi import APIRouter

from app.schemas.study import StudyGenerateRequest, StudyGenerateResponse
from app.services.study.study_generator import generate_study_activity

router = APIRouter()


@router.post("/generate", response_model=StudyGenerateResponse)
def generate_study(request: StudyGenerateRequest) -> StudyGenerateResponse:
    result = generate_study_activity(
        collection_id=request.collection_id,
        document_id=request.document_id,
        mode=request.mode,
        count=request.count,
        quality=request.quality,
    )
    return StudyGenerateResponse(**result)
