import { ITenantContext } from '../interfaces/tenant-context.interface';
export declare const TenantContext: (...dataOrPipes: (keyof ITenantContext | import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>> | undefined)[]) => ParameterDecorator;
