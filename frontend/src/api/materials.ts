import { requestJson } from "./client";

export interface MaterialRecord {
  user_email: string;
  collection_id: string;
  document_title: string;
  files: Array<{ document_id: string; filename: string; status: string; chunks_count: number }>;
  chunks_count: number;
  created_at: string;
  updated_at: string;
}

export async function listMaterials(token: string): Promise<MaterialRecord[]> {
  return requestJson<MaterialRecord[]>(`/api/documents/library?token=${encodeURIComponent(token)}`);
}

export async function deleteMaterial(token: string, collectionId: string): Promise<void> {
  await requestJson<void>(`/api/documents/library/${collectionId}?token=${encodeURIComponent(token)}`, {
    method: "DELETE",
  });
}
