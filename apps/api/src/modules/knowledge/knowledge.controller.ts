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
  Query,
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
  listSources(
    @TenantContext() tenant: ITenantContext,
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
  ) {
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 20;
    return this.knowledgeManager.listSourcesForTenant(tenant.tenantId, page, limit);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload document (PDF, DOCX, XLSX, MD, TXT). Optionally mark as FAQ.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        sourceType: { type: 'string', enum: ['pdf', 'docx', 'xlsx', 'markdown', 'text', 'faq'], description: 'Optional override for source type. Use "faq" to mark a document as FAQ.' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @TenantContext() tenant: ITenantContext,
    @UploadedFile() file: Express.Multer.File,
    @Body('sourceType') sourceTypeOverride?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Determine parsing type from file extension
    let parseType: KnowledgeSourceType;
    const filename = file.originalname.toLowerCase();

    if (filename.endsWith('.pdf')) {
      parseType = KnowledgeSourceType.PDF;
    } else if (filename.endsWith('.docx')) {
      parseType = KnowledgeSourceType.DOCX;
    } else if (filename.endsWith('.xlsx')) {
      parseType = KnowledgeSourceType.XLSX;
    } else if (filename.endsWith('.md') || filename.endsWith('.markdown')) {
      parseType = KnowledgeSourceType.MARKDOWN;
    } else if (filename.endsWith('.txt')) {
      parseType = KnowledgeSourceType.TEXT;
    } else {
      throw new BadRequestException('Unsupported file format. Please upload PDF, DOCX, XLSX, or Markdown (.md) files.');
    }

    // Allow overriding the stored source type (e.g. mark a DOCX as FAQ)
    const storedType = sourceTypeOverride === 'faq' ? KnowledgeSourceType.FAQ : parseType;

    return this.knowledgeManager.processDocumentUpload(
      tenant.tenantId,
      file.originalname,
      storedType,
      file.buffer,
      undefined,
      undefined,
      undefined,
      undefined,
      parseType,
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
