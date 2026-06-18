import { ContestGenerateResponse, ContestMode } from "./types";
import { requestJson } from "./client";

export async function generateContest(
  collectionId: string,
  mode: ContestMode,
  quality: boolean,
  count: number = 10,
  token?: string,
  documentTitle?: string,
): Promise<ContestGenerateResponse> {
  return requestJson<ContestGenerateResponse>("/api/contest/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      collection_id: collectionId,
      mode,
      quality,
      count,
      token: token ?? null,
      document_title: documentTitle ?? null,
    })
  });
}
