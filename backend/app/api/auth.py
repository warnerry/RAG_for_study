from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.services.auth.auth_service import (
    login_user,
    register_user,
    get_user_profile,
    update_user_name,
    verify_token,
)

router = APIRouter()


class RegisterRequest(BaseModel):
    email: str = Field(min_length=5)
    password: str = Field(min_length=6)
    name: str = ""


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    email: str
    name: str


class ProfileResponse(BaseModel):
    email: str
    name: str


class UpdateNameRequest(BaseModel):
    token: str
    name: str


@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest) -> TokenResponse:
    try:
        result = register_user(req.email, req.password, req.name)
        return TokenResponse(**result)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest) -> TokenResponse:
    try:
        result = login_user(req.email, req.password)
        return TokenResponse(**result)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc


@router.get("/me", response_model=ProfileResponse)
def me(token: str) -> ProfileResponse:
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Токен недействителен.")
    return ProfileResponse(**get_user_profile(payload["sub"]))


@router.post("/update-name", response_model=ProfileResponse)
def update_name(req: UpdateNameRequest) -> ProfileResponse:
    payload = verify_token(req.token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Токен недействителен.")
    try:
        result = update_user_name(payload["sub"], req.name)
        return ProfileResponse(**result)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
