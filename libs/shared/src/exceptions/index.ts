import { HttpException, HttpStatus } from '@nestjs/common';

export class TenantNotFoundException extends HttpException {
  constructor(tenantId?: string) {
    super(
      `Tenant${tenantId ? ` '${tenantId}'` : ''} not found`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class InvalidApiKeyException extends HttpException {
  constructor() {
    super('Invalid or expired API key', HttpStatus.UNAUTHORIZED);
  }
}

export class TenantSuspendedException extends HttpException {
  constructor() {
    super('Tenant account is suspended', HttpStatus.FORBIDDEN);
  }
}

export class KnowledgeProcessingException extends HttpException {
  constructor(message: string) {
    super(`Knowledge processing failed: ${message}`, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export class ToolExecutionException extends HttpException {
  constructor(toolName: string, message: string) {
    super(`Tool '${toolName}' execution failed: ${message}`, HttpStatus.BAD_GATEWAY);
  }
}

export class AIProviderException extends HttpException {
  constructor(provider: string, message: string) {
    super(`AI Provider '${provider}' error: ${message}`, HttpStatus.SERVICE_UNAVAILABLE);
  }
}
