import { SavedResult, StudyGenerateResponse, StudyMode } from "./types";
import { requestJson } from "./client";

export async function generateStudy(
  collectionId: string,
  mode: StudyMode,
  quality: boolean,
  count?: number,
  token?: string,
  documentTitle?: string,
): Promise<StudyGenerateResponse> {
  return requestJson<StudyGenerateResponse>("/api/study/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      collection_id: collectionId,
      mode,
      count,
      quality,
      token: token ?? null,
      document_title: documentTitle ?? null,
    }),
  });
}

export async function listSavedResults(token: string): Promise<SavedResult[]> {
  return requestJson<SavedResult[]>(`/api/study/results?token=${encodeURIComponent(token)}`);
}

export async function deleteSavedResult(token: string, resultId: string): Promise<void> {
  await requestJson<void>(`/api/study/results/${resultId}?token=${encodeURIComponent(token)}`, {
    method: "DELETE",
  });
}
