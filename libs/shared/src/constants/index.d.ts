export declare const TENANT_CONTEXT = "TENANT_CONTEXT";
export declare const AI_PROVIDER = "AI_PROVIDER";
export declare enum TenantStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    SUSPENDED = "suspended"
}
export declare enum ConversationStatus {
    ACTIVE = "active",
    CLOSED = "closed",
    HANDED_OFF = "handed_off"
}
export declare enum MessageRole {
    USER = "user",
    ASSISTANT = "assistant",
    SYSTEM = "system",
    TOOL = "tool"
}
export declare enum MessageChannel {
    WHATSAPP = "whatsapp",
    WEB = "web",
    API = "api",
    PLAYGROUND = "playground"
}
export declare enum TicketStatus {
    OPEN = "open",
    IN_PROGRESS = "in_progress",
    RESOLVED = "resolved",
    CLOSED = "closed"
}
export declare enum KnowledgeSourceType {
    PDF = "pdf",
    DOCX = "docx",
    XLSX = "xlsx",
    FAQ = "faq",
    WEBSITE = "website",
    TEXT = "text"
}
export declare enum KnowledgeStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    COMPLETED = "completed",
    FAILED = "failed"
}
