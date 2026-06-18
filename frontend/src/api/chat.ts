import { ChatResponse } from "./types";
import { requestJson } from "./client";

export interface ChatHistoryMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export async function askDocument(
  collectionId: string,
  message: string,
  token?: string,
): Promise<ChatResponse> {
  return requestJson<ChatResponse>("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ collection_id: collectionId, message, top_k: 5, token: token ?? null })
  });
}

export async function getChatHistory(collectionId: string, token: string): Promise<ChatHistoryMessage[]> {
  return requestJson<ChatHistoryMessage[]>(
    `/api/chat/history?collection_id=${encodeURIComponent(collectionId)}&token=${encodeURIComponent(token)}`
  );
}

export async function clearChatHistory(collectionId: string, token: string): Promise<void> {
  await requestJson<void>(
    `/api/chat/history?collection_id=${encodeURIComponent(collectionId)}&token=${encodeURIComponent(token)}`,
    { method: "DELETE" }
  );
}
