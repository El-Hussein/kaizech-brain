"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeStatus = exports.KnowledgeSourceType = exports.TicketStatus = exports.MessageChannel = exports.MessageRole = exports.ConversationStatus = exports.TenantStatus = exports.AI_PROVIDER = exports.TENANT_CONTEXT = void 0;
exports.TENANT_CONTEXT = 'TENANT_CONTEXT';
exports.AI_PROVIDER = 'AI_PROVIDER';
var TenantStatus;
(function (TenantStatus) {
    TenantStatus["ACTIVE"] = "active";
    TenantStatus["INACTIVE"] = "inactive";
    TenantStatus["SUSPENDED"] = "suspended";
})(TenantStatus || (exports.TenantStatus = TenantStatus = {}));
var ConversationStatus;
(function (ConversationStatus) {
    ConversationStatus["ACTIVE"] = "active";
    ConversationStatus["CLOSED"] = "closed";
    ConversationStatus["HANDED_OFF"] = "handed_off";
})(ConversationStatus || (exports.ConversationStatus = ConversationStatus = {}));
var MessageRole;
(function (MessageRole) {
    MessageRole["USER"] = "user";
    MessageRole["ASSISTANT"] = "assistant";
    MessageRole["SYSTEM"] = "system";
    MessageRole["TOOL"] = "tool";
})(MessageRole || (exports.MessageRole = MessageRole = {}));
var MessageChannel;
(function (MessageChannel) {
    MessageChannel["WHATSAPP"] = "whatsapp";
    MessageChannel["WEB"] = "web";
    MessageChannel["API"] = "api";
    MessageChannel["PLAYGROUND"] = "playground";
})(MessageChannel || (exports.MessageChannel = MessageChannel = {}));
var TicketStatus;
(function (TicketStatus) {
    TicketStatus["OPEN"] = "open";
    TicketStatus["IN_PROGRESS"] = "in_progress";
    TicketStatus["RESOLVED"] = "resolved";
    TicketStatus["CLOSED"] = "closed";
})(TicketStatus || (exports.TicketStatus = TicketStatus = {}));
var KnowledgeSourceType;
(function (KnowledgeSourceType) {
    KnowledgeSourceType["PDF"] = "pdf";
    KnowledgeSourceType["DOCX"] = "docx";
    KnowledgeSourceType["XLSX"] = "xlsx";
    KnowledgeSourceType["FAQ"] = "faq";
    KnowledgeSourceType["WEBSITE"] = "website";
    KnowledgeSourceType["TEXT"] = "text";
})(KnowledgeSourceType || (exports.KnowledgeSourceType = KnowledgeSourceType = {}));
var KnowledgeStatus;
(function (KnowledgeStatus) {
    KnowledgeStatus["PENDING"] = "pending";
    KnowledgeStatus["PROCESSING"] = "processing";
    KnowledgeStatus["COMPLETED"] = "completed";
    KnowledgeStatus["FAILED"] = "failed";
})(KnowledgeStatus || (exports.KnowledgeStatus = KnowledgeStatus = {}));
//# sourceMappingURL=index.js.map