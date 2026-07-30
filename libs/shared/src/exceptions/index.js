"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIProviderException = exports.ToolExecutionException = exports.KnowledgeProcessingException = exports.TenantSuspendedException = exports.InvalidApiKeyException = exports.TenantNotFoundException = void 0;
const common_1 = require("@nestjs/common");
class TenantNotFoundException extends common_1.HttpException {
    constructor(tenantId) {
        super(`Tenant${tenantId ? ` '${tenantId}'` : ''} not found`, common_1.HttpStatus.NOT_FOUND);
    }
}
exports.TenantNotFoundException = TenantNotFoundException;
class InvalidApiKeyException extends common_1.HttpException {
    constructor() {
        super('Invalid or expired API key', common_1.HttpStatus.UNAUTHORIZED);
    }
}
exports.InvalidApiKeyException = InvalidApiKeyException;
class TenantSuspendedException extends common_1.HttpException {
    constructor() {
        super('Tenant account is suspended', common_1.HttpStatus.FORBIDDEN);
    }
}
exports.TenantSuspendedException = TenantSuspendedException;
class KnowledgeProcessingException extends common_1.HttpException {
    constructor(message) {
        super(`Knowledge processing failed: ${message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
exports.KnowledgeProcessingException = KnowledgeProcessingException;
class ToolExecutionException extends common_1.HttpException {
    constructor(toolName, message) {
        super(`Tool '${toolName}' execution failed: ${message}`, common_1.HttpStatus.BAD_GATEWAY);
    }
}
exports.ToolExecutionException = ToolExecutionException;
class AIProviderException extends common_1.HttpException {
    constructor(provider, message) {
        super(`AI Provider '${provider}' error: ${message}`, common_1.HttpStatus.SERVICE_UNAVAILABLE);
    }
}
exports.AIProviderException = AIProviderException;
//# sourceMappingURL=index.js.map