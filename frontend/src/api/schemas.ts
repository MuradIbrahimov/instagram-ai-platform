import { z } from "zod";
import type {
  AIRun,
  Conversation,
  ConversationListItem,
  DocumentListItem,
  InstagramAccount,
  KnowledgeDocument,
  Message,
  PaginatedResponse,
  TokenResponse,
  User,
  Workspace,
  WorkspaceWithRole,
} from "@/api/types";

const isoDateTime = z.string().datetime({ offset: true }).or(z.string().datetime());

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string().min(1),
  is_active: z.boolean(),
  created_at: isoDateTime,
});

export const workspaceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
  timezone: z.string().min(1),
  auto_reply_enabled: z.boolean(),
  created_at: isoDateTime,
});

export const workspaceRoleSchema = z.enum(["owner", "admin", "agent", "viewer"]);

export const workspaceWithRoleSchema = workspaceSchema.extend({
  role: workspaceRoleSchema,
});

export const tokenResponseSchema = z.object({
  access_token: z.string().min(1),
  token_type: z.string().min(1),
  expires_in: z.number().int().nonnegative(),
});

export const instagramAccountSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  username: z.string().min(1),
  display_name: z.string().min(1),
  profile_picture_url: z.string().url().nullable(),
  is_connected: z.boolean(),
  created_at: isoDateTime,
  updated_at: isoDateTime,
});

const conversationStatusSchema = z.enum(["open", "pending", "resolved"]);

export const conversationSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  instagram_account_id: z.string().uuid(),
  customer_handle: z.string().min(1),
  customer_name: z.string().nullable(),
  status: conversationStatusSchema,
  created_at: isoDateTime,
  updated_at: isoDateTime,
});

export const conversationListItemSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  instagram_account_id: z.string().uuid(),
  customer_handle: z.string().min(1),
  customer_name: z.string().nullable(),
  last_message_preview: z.string(),
  unread_count: z.number().int().nonnegative(),
  last_message_at: isoDateTime,
  status: conversationStatusSchema,
});

export const messageSchema = z.object({
  id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  sender_type: z.enum(["customer", "agent", "assistant"]),
  text: z.string(),
  is_ai_generated: z.boolean(),
  created_at: isoDateTime,
});

export const aiRunSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  prompt_version: z.string().min(1),
  status: z.enum(["queued", "running", "succeeded", "failed"]),
  response_text: z.string().nullable(),
  started_at: isoDateTime.nullable(),
  completed_at: isoDateTime.nullable(),
  created_at: isoDateTime,
});

const documentStatusSchema = z.enum(["processing", "ready", "failed"]);
const documentSourceTypeSchema = z.enum(["upload", "url", "text"]);

export const knowledgeDocumentSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  title: z.string().min(1),
  source_type: documentSourceTypeSchema,
  status: documentStatusSchema,
  content_excerpt: z.string(),
  created_at: isoDateTime,
  updated_at: isoDateTime,
});

export const documentListItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  source_type: documentSourceTypeSchema,
  status: documentStatusSchema,
  created_at: isoDateTime,
});

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    page_size: z.number().int().positive(),
  });

export const parseUser = (data: unknown): User => userSchema.parse(data);
export const parseWorkspace = (data: unknown): Workspace => workspaceSchema.parse(data);
export const parseWorkspaceWithRole = (data: unknown): WorkspaceWithRole =>
  workspaceWithRoleSchema.parse(data);
export const parseWorkspaceWithRoleList = (data: unknown): WorkspaceWithRole[] =>
  z.array(workspaceWithRoleSchema).parse(data);
export const parseTokenResponse = (data: unknown): TokenResponse => tokenResponseSchema.parse(data);
export const parseInstagramAccount = (data: unknown): InstagramAccount =>
  instagramAccountSchema.parse(data);
export const parseConversation = (data: unknown): Conversation => conversationSchema.parse(data);
export const parseConversationListItem = (data: unknown): ConversationListItem =>
  conversationListItemSchema.parse(data);
export const parseMessage = (data: unknown): Message => messageSchema.parse(data);
export const parseAIRun = (data: unknown): AIRun => aiRunSchema.parse(data);
export const parseKnowledgeDocument = (data: unknown): KnowledgeDocument =>
  knowledgeDocumentSchema.parse(data);
export const parseDocumentListItem = (data: unknown): DocumentListItem =>
  documentListItemSchema.parse(data);
export const parsePaginatedResponse = <T,>(
  data: unknown,
  itemSchema: z.ZodType<T>,
): PaginatedResponse<T> => paginatedResponseSchema(itemSchema).parse(data);
