import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ITenantContext } from '../interfaces/tenant-context.interface';

export const TenantContext = createParamDecorator(
  (data: keyof ITenantContext | undefined, ctx: ExecutionContext): ITenantContext | string => {
    const request = ctx.switchToHttp().getRequest();
    const tenant: ITenantContext = request.tenant;
    return data ? tenant[data] : tenant;
  },
);
