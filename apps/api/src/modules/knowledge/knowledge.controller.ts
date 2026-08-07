import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiSecurity, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { KnowledgeManagerService } from '@kaizech/knowledge';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { TenantContext, ITenantContext, KnowledgeSourceType } from '@kaizech/shared';

@ApiTags('Knowledge')
@ApiSecurity('api-key')
@Controller('knowledge')
@UseGuards(ApiKeyGuard)
export class KnowledgeController {
  constructor(private readonly knowledgeManager: KnowledgeManagerService) {}

  @Get()
  @ApiOperation({ summary: 'List all knowledge sources for tenant' })
  listSources(@TenantContext() tenant: ITenantContext) {
    return this.knowledgeManager.listSourcesForTenant(tenant.tenantId);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload document (PDF, DOCX, XLSX)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @TenantContext() tenant: ITenantContext,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    let sourceType: KnowledgeSourceType;
    const filename = file.originalname.toLowerCase();

    if (filename.endsWith('.pdf')) {
      sourceType = KnowledgeSourceType.PDF;
    } else if (filename.endsWith('.docx')) {
      sourceType = KnowledgeSourceType.DOCX;
    } else if (filename.endsWith('.xlsx')) {
      sourceType = KnowledgeSourceType.XLSX;
    } else if (filename.endsWith('.md') || filename.endsWith('.markdown')) {
      sourceType = KnowledgeSourceType.MARKDOWN;
    } else if (filename.endsWith('.txt')) {
      sourceType = KnowledgeSourceType.TEXT;
    } else {
      throw new BadRequestException('Unsupported file format. Please upload PDF, DOCX, XLSX, or Markdown (.md) files.');
    }

    return this.knowledgeManager.processDocumentUpload(
      tenant.tenantId,
      file.originalname,
      sourceType,
      file.buffer,
    );
  }

  @Post('faq')
  @ApiOperation({ summary: 'Import FAQ question-answer pairs' })
  importFaqs(
    @TenantContext() tenant: ITenantContext,
    @Body() body: { name: string; faqs: Array<{ question: string; answer: string; category?: string }> },
  ) {
    if (!body.faqs || body.faqs.length === 0) {
      throw new BadRequestException('FAQ list cannot be empty');
    }

    const validFaqs = body.faqs.filter(
      (f) => (f.question && f.question.trim()) || (f.answer && f.answer.trim()),
    );

    if (validFaqs.length === 0) {
      throw new BadRequestException('FAQ list must contain at least one non-empty question or answer');
    }

    return this.knowledgeManager.processDocumentUpload(
      tenant.tenantId,
      body.name || 'FAQ Knowledge',
      KnowledgeSourceType.FAQ,
      undefined,
      undefined,
      undefined,
      validFaqs,
    );
  }

  @Post('crawl')
  @ApiOperation({ summary: 'Crawl website URL' })
  crawlWebsite(
    @TenantContext() tenant: ITenantContext,
    @Body() body: { url: string; name?: string },
  ) {
    if (!body.url) {
      throw new BadRequestException('URL is required');
    }

    return this.knowledgeManager.processDocumentUpload(
      tenant.tenantId,
      body.name || `Website: ${body.url}`,
      KnowledgeSourceType.WEBSITE,
      undefined,
      body.url,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single knowledge source' })
  getSource(
    @TenantContext() tenant: ITenantContext,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.knowledgeManager.getSource(tenant.tenantId, id);
  }

  @Get(':id/chunks')
  @ApiOperation({ summary: 'Get all text chunks for a knowledge source' })
  getChunks(
    @TenantContext() tenant: ITenantContext,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.knowledgeManager.getSourceChunks(tenant.tenantId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete knowledge source' })
  deleteSource(
    @TenantContext() tenant: ITenantContext,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.knowledgeManager.deleteSource(tenant.tenantId, id);
  }
}
