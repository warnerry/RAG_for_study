import json

from fastapi import HTTPException, status
from openai import OpenAI, OpenAIError

from app.core.config import Settings, get_settings
from app.services.rag.prompts import RAG_CHAT_SYSTEM_PROMPT, format_context


NO_ANSWER = "В загруженных материалах этого нет."


def ensure_llm_ready(settings: Settings) -> None:
    if not settings.llm_api_key or settings.llm_api_key == "your_caila_api_key_here":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="LLM_API_KEY is not configured. Add your Caila key to .env.",
        )


def get_llm_client(settings: Settings | None = None) -> OpenAI:
    settings = settings or get_settings()
    ensure_llm_ready(settings)
    return OpenAI(api_key=settings.llm_api_key, base_url=settings.llm_base_url)


def generate_chat_answer(
    message: str,
    chunks: list[dict],
    settings: Settings | None = None,
) -> str:
    settings = settings or get_settings()
    context = format_context(chunks)
    user_prompt = f"Контекст:\n{context}\n\nВопрос пользователя:\n{message}"
    return _complete_text(
        system_prompt=RAG_CHAT_SYSTEM_PROMPT,
        user_prompt=user_prompt,
        model=settings.llm_model,
        settings=settings,
    )


def generate_json(
    system_prompt: str,
    user_prompt: str,
    quality: bool = False,
    settings: Settings | None = None,
) -> dict:
    settings = settings or get_settings()
    model = settings.llm_model_quality if quality else settings.llm_model
    content = _complete_text(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        model=model,
        settings=settings,
        response_format={"type": "json_object"},
    )
    try:
        return json.loads(content)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="LLM returned invalid JSON.",
        ) from exc


def _complete_text(
    system_prompt: str,
    user_prompt: str,
    model: str,
    settings: Settings,
    response_format: dict | None = None,
) -> str:
    client = get_llm_client(settings)
    kwargs = {}
    if response_format is not None:
        kwargs["response_format"] = response_format
    try:
        completion = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
            **kwargs,
        )
    except OpenAIError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"LLM provider error: {exc}",
        ) from exc
    content = completion.choices[0].message.content
    return content.strip() if content else NO_ANSWER
