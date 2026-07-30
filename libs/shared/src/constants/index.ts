export const TENANT_CONTEXT = 'TENANT_CONTEXT';
export const AI_PROVIDER = 'AI_PROVIDER';

export enum TenantStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum ConversationStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  HANDED_OFF = 'handed_off',
}

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
  TOOL = 'tool',
}

export enum MessageChannel {
  WHATSAPP = 'whatsapp',
  WEB = 'web',
  API = 'api',
  PLAYGROUND = 'playground',
}

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum KnowledgeSourceType {
  PDF = 'pdf',
  DOCX = 'docx',
  XLSX = 'xlsx',
  MARKDOWN = 'markdown',
  FAQ = 'faq',
  WEBSITE = 'website',
  TEXT = 'text',
}

export enum KnowledgeStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}
