from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles

from app.api import auth, chat, contest, documents, study
from app.core.config import get_settings

REPO_ROOT = Path(__file__).resolve().parents[2]
FRONTEND_SOURCE_DIR = REPO_ROOT / "frontend"
FRONTEND_DIST_DIR = FRONTEND_SOURCE_DIR / "dist"
FRONTEND_DIR = FRONTEND_DIST_DIR if FRONTEND_DIST_DIR.exists() else FRONTEND_SOURCE_DIR

settings = get_settings()

app = FastAPI(
    title="Зачётка API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(study.router, prefix="/api/study", tags=["study"])
app.include_router(contest.router, prefix="/api/contest", tags=["contest"])


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "zachetka-backend"}


@app.get("/", include_in_schema=False)
def root() -> RedirectResponse:
    return RedirectResponse(url="/ui/")


app.mount("/ui", StaticFiles(directory=FRONTEND_DIR, html=True), name="ui")
