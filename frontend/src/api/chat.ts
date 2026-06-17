import { ChatResponse } from "./types";
import { requestJson } from "./client";

export async function askDocument(collectionId: string, message: string): Promise<ChatResponse> {
  return requestJson<ChatResponse>("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ collection_id: collectionId, message, top_k: 5 })
  });
}
