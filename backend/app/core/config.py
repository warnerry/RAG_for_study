from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


PROJECT_ROOT = Path(__file__).resolve().parents[3]
REPO_ROOT = PROJECT_ROOT.parent


class Settings(BaseSettings):
    app_env: str = Field(default="development", alias="APP_ENV")
    app_host: str = Field(default="127.0.0.1", alias="APP_HOST")
    app_port: int = Field(default=8000, alias="APP_PORT")

    llm_provider: str = Field(default="caila", alias="LLM_PROVIDER")
    llm_base_url: str = Field(
        default="https://caila.io/api/adapters/openai",
        alias="LLM_BASE_URL",
    )
    llm_api_key: str | None = Field(default=None, alias="LLM_API_KEY")
    llm_model: str = Field(
        default="just-ai/openai-proxy/gpt-5.4-nano",
        alias="LLM_MODEL",
    )
    llm_model_quality: str = Field(
        default="just-ai/openai-proxy/gpt-5.4-mini",
        alias="LLM_MODEL_QUALITY",
    )

    embeddings_provider: str = Field(default="local", alias="EMBEDDINGS_PROVIDER")
    embeddings_model: str = Field(
        default="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
        alias="EMBEDDINGS_MODEL",
    )

    chroma_persist_dir: Path = Field(default=REPO_ROOT / "data/vector_store", alias="CHROMA_PERSIST_DIR")
    upload_dir: Path = Field(default=REPO_ROOT / "data/uploads", alias="UPLOAD_DIR")
    processed_dir: Path = Field(default=REPO_ROOT / "data/processed", alias="PROCESSED_DIR")
    default_top_k: int = Field(default=4, alias="DEFAULT_TOP_K")
    upload_retention_hours: int = Field(default=24, alias="UPLOAD_RETENTION_HOURS")

    model_config = SettingsConfigDict(
        env_file=(REPO_ROOT / ".env", PROJECT_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

    def ensure_directories(self) -> None:
        self.upload_dir = self._repo_path(self.upload_dir)
        self.processed_dir = self._repo_path(self.processed_dir)
        self.chroma_persist_dir = self._repo_path(self.chroma_persist_dir)
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self.processed_dir.mkdir(parents=True, exist_ok=True)
        self.chroma_persist_dir.mkdir(parents=True, exist_ok=True)

    @staticmethod
    def _repo_path(path: Path) -> Path:
        return path if path.is_absolute() else REPO_ROOT / path


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.ensure_directories()
    return settings
