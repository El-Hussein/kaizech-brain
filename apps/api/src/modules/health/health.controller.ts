import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('Health')
@Controller()
export class HealthController {
  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  check() {
    return {
      status: 'ok',
      service: 'kaizech-brain-api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get(['documentation', 'guide'])
  @ApiExcludeEndpoint()
  getDocumentation(@Res() res: Response) {
    const possiblePaths = [
      path.resolve(process.cwd(), 'tenant_documentation.html'),
      path.resolve(process.cwd(), '../../tenant_documentation.html'),
      path.resolve(__dirname, '../../../../tenant_documentation.html'),
      path.resolve(__dirname, '../../../../../tenant_documentation.html'),
    ];

    for (const docPath of possiblePaths) {
      if (fs.existsSync(docPath)) {
        return res.sendFile(docPath);
      }
    }

    return (res as any).type('html').send(`
      <!DOCTYPE html>
      <html>
        <head><title>Kaizech Brain API Documentation</title></head>
        <body style="font-family: system-ui; padding: 40px; background: #0f172a; color: #f8fafc;">
          <h1>🧠 Kaizech Brain API</h1>
          <p>The interactive Swagger OpenAPI documentation is available at:</p>
          <ul>
            <li><a href="/docs" style="color: #38bdf8;">/docs</a></li>
            <li><a href="/api/v1/docs" style="color: #38bdf8;">/api/v1/docs</a></li>
          </ul>
        </body>
      </html>
    `);
  }
}
