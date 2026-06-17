import { requestJson } from "./client";

export interface TokenResponse {
  access_token: string;
  token_type: string;
  email: string;
  name: string;
}

export interface ProfileResponse {
  email: string;
  name: string;
}

export async function apiRegister(email: string, password: string, name: string): Promise<TokenResponse> {
  return requestJson<TokenResponse>("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
}

export async function apiLogin(email: string, password: string): Promise<TokenResponse> {
  return requestJson<TokenResponse>("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function apiUpdateName(token: string, name: string): Promise<ProfileResponse> {
  return requestJson<ProfileResponse>("/api/auth/update-name", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, name }),
  });
}
