import { api } from "@/lib/api";
import type {
  KnowledgeDocument,
  KnowledgeDocumentListItem,
  KnowledgeSourceType,
  PaginatedResponse,
} from "@/types/api";

// ─── Knowledge ────────────────────────────────────────────────────────────────

export interface CreateDocumentData {
  title: string;
  raw_text: string;
  source_type: KnowledgeSourceType;
}

export function getDocuments(
  workspaceId: string,
  page = 1,
  pageSize = 20,
): Promise<PaginatedResponse<KnowledgeDocumentListItem>> {
  return api.get<PaginatedResponse<KnowledgeDocumentListItem>>(
    `/workspaces/${workspaceId}/knowledge/documents`,
    { page, page_size: pageSize },
  );
}

export function getDocument(
  workspaceId: string,
  documentId: string,
): Promise<KnowledgeDocument> {
  return api.get<KnowledgeDocument>(
    `/workspaces/${workspaceId}/knowledge/documents/${documentId}`,
  );
}

export function createDocument(
  workspaceId: string,
  data: CreateDocumentData,
): Promise<KnowledgeDocument> {
  return api.post<KnowledgeDocument>(
    `/workspaces/${workspaceId}/knowledge/documents`,
    data,
  );
}

export function deleteDocument(
  workspaceId: string,
  documentId: string,
): Promise<void> {
  return api.delete<void>(
    `/workspaces/${workspaceId}/knowledge/documents/${documentId}`,
  );
}
