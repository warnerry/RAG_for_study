const configuredApiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "");

export const API_BASE_URL =
  configuredApiBaseUrl || (import.meta.env.DEV ? "" : "");

function humanizeError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("failed to fetch") || lower.includes("networkerror")) {
    return "Не удалось подключиться к серверу. Проверьте, что FastAPI запущен на localhost:8000.";
  }

  if (
    lower.includes("api key") ||
    lower.includes("llm_api_key") ||
    lower.includes("unauthorized") ||
    lower.includes("401")
  ) {
    return "Модель не настроена. Добавьте ключ Caila в LLM_API_KEY в локальном .env и перезапустите сервер.";
  }

  if (lower.includes("not processed") || lower.includes("chunk")) {
    return "Материалы пока не обработаны. Загрузите файлы заново и дождитесь сообщения о готовности.";
  }

  return message || "Что-то пошло не так. Попробуй еще раз.";
}

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(humanizeError(message));
    this.name = "ApiError";
    this.status = status;
  }
}

export async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, init);
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : "Ошибка сети");
  }

  const raw = await response.text();
  let data: unknown = {};

  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { detail: raw };
  }

  if (!response.ok) {
    const detail =
      data && typeof data === "object" && "detail" in data
        ? (data as { detail?: unknown }).detail
        : data;
    const message = typeof detail === "string" ? detail : JSON.stringify(detail);
    throw new ApiError(message || `HTTP ${response.status}`, response.status);
  }

  return data as T;
}
