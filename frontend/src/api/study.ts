import { StudyGenerateResponse, StudyMode } from "./types";
import { requestJson } from "./client";

export async function generateStudy(
  collectionId: string,
  mode: StudyMode,
  quality: boolean,
  count?: number
): Promise<StudyGenerateResponse> {
  return requestJson<StudyGenerateResponse>("/api/study/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ collection_id: collectionId, mode, count, quality })
  });
}
