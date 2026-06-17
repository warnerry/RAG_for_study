export type Scenario = "study" | "contest";
export type WorkspaceTab = "dashboard" | "study" | "contest" | "chat";
export type StudyMode = "summary" | "exam_questions" | "flashcards" | "mnemonics";
export type ContestMode = "blitz" | "two_to_one" | "union_biathlon";

export interface UploadedDocument {
  document_id: string;
  collection_id?: string | null;
  filename: string;
  content_type?: string | null;
  status: string;
}

export interface ProcessedDocument {
  document_id: string;
  collection_id?: string | null;
  chunks_count: number;
  status: string;
}

export interface RetrievalSource {
  chunk_id: string;
  filename?: string | null;
  text: string;
  score?: number;
}

export interface ChatResponse {
  answer: string;
  sources: RetrievalSource[];
}

export interface StudyGenerateResponse {
  mode: StudyMode;
  result_id?: string | null;
  document_title?: string | null;
  title?: string | null;
  sections?: Record<string, unknown>[] | null;
  sources?: Record<string, unknown>[] | null;
  requested_count?: number | null;
  generated_count?: number | null;
  warning?: string | null;
  items: Record<string, unknown>[];
  created_at?: string | null;
  updated_at?: string | null;
}

export interface SavedResult {
  id: string;
  mode: string;
  document_title: string;
  collection_id: string;
  item_count: number;
  title?: string | null;
  items: Record<string, unknown>[];
  sections?: Record<string, unknown>[] | null;
  sources?: Record<string, unknown>[] | null;
  created_at: string;
  updated_at: string;
}

export interface ContestGenerateResponse {
  mode: ContestMode;
  time_limit_seconds?: number | null;
  mistake_limit?: number | null;
  questions?: Record<string, unknown>[] | null;
  stations?: Record<string, unknown>[] | null;
}

export interface DocumentState {
  uploaded?: UploadedDocument;
  processed?: ProcessedDocument;
  collection?: UploadAndProcessResponse;
}

export interface CollectionFile {
  document_id: string;
  filename: string;
  status: string;
  chunks_count: number;
  error?: string | null;
}

export interface UploadAndProcessResponse {
  collection_id: string;
  files: CollectionFile[];
  chunks_count: number;
  status: string;
}
