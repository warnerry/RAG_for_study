import { ProcessedDocument, UploadedDocument, UploadAndProcessResponse } from "./types";
import { requestJson } from "./client";

export async function uploadDocument(file: File): Promise<UploadedDocument> {
  const formData = new FormData();
  formData.append("file", file);

  return requestJson<UploadedDocument>("/api/documents/upload", {
    method: "POST",
    body: formData
  });
}

export async function processDocument(documentId: string): Promise<ProcessedDocument> {
  return requestJson<ProcessedDocument>(`/api/documents/${documentId}/process`, {
    method: "POST"
  });
}

export async function uploadAndProcessDocuments(files: File[]): Promise<UploadAndProcessResponse> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  return requestJson<UploadAndProcessResponse>("/api/documents/upload-and-process", {
    method: "POST",
    body: formData
  });
}
