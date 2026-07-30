import { HttpException } from '@nestjs/common';
export declare class TenantNotFoundException extends HttpException {
    constructor(tenantId?: string);
}
export declare class InvalidApiKeyException extends HttpException {
    constructor();
}
export declare class TenantSuspendedException extends HttpException {
    constructor();
}
export declare class KnowledgeProcessingException extends HttpException {
    constructor(message: string);
}
export declare class ToolExecutionException extends HttpException {
    constructor(toolName: string, message: string);
}
export declare class AIProviderException extends HttpException {
    constructor(provider: string, message: string);
}
