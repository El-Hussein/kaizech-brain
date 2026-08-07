import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('Documentation & Widget')
@Controller()
export class DocsController {
  @Get('widget.js')
  @ApiOperation({ summary: 'Serve the standalone JS chat widget bundle for script embeds' })
  getWidgetJs(@Res() res: Response) {
    const candidates = [
      path.resolve(process.cwd(), 'apps/widget/dist/widget.js'),
      path.resolve(process.cwd(), '../../apps/widget/dist/widget.js'),
      path.resolve(__dirname, '../../../apps/widget/dist/widget.js'),
      path.resolve(__dirname, '../../widget/dist/widget.js'),
    ];

    let foundPath = candidates.find((p) => fs.existsSync(p));

    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    if (foundPath) {
      return res.sendFile(foundPath);
    } else {
      // Inline fallback script header if bundle is being compiled
      return res.send(`/* Kaizech Chat Widget - Standalone Bundle Loading */`);
    }
  }

  @Get(['documentation', 'guide'])
  @ApiOperation({ summary: 'Serve interactive Tenant Documentation Portal' })
  getDocumentation(@Res() res: Response) {
    const candidates = [
      path.resolve(process.cwd(), 'tenant_documentation.html'),
      path.resolve(process.cwd(), '../../tenant_documentation.html'),
      path.resolve(__dirname, '../../../tenant_documentation.html'),
      path.resolve(__dirname, '../../tenant_documentation.html'),
    ];

    let foundPath = candidates.find((p) => fs.existsSync(p));

    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    if (foundPath) {
      return res.sendFile(foundPath);
    } else {
      return res.status(404).send('<h1>Documentation file not found</h1>');
    }
  }
}
