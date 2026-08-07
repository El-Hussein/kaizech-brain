import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiSecurity, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { IndustriesService } from './industries.service';
import { KnowledgeManagerService } from '@kaizech/knowledge';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { KnowledgeSourceType } from '@kaizech/shared';

@ApiTags('Industries (Super Admin)')
@ApiSecurity('api-key')
@Controller('industries')
@UseGuards(ApiKeyGuard)
export class IndustriesController {
  constructor(
    private readonly industriesService: IndustriesService,
    private readonly knowledgeManager: KnowledgeManagerService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all industries' })
  findAll() {
    return this.industriesService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create an industry' })
  create(@Body() data: { name: string; slug: string; description?: string }) {
    return this.industriesService.create(data);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an industry' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.industriesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an industry' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: { name?: string; slug?: string; description?: string; status?: string },
  ) {
    return this.industriesService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an industry' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.industriesService.remove(id);
  }

  @Post(':id/knowledge/upload')
  @ApiOperation({ summary: 'Upload document for industry knowledge' })
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
  async uploadIndustryDocument(
    @Param('id', ParseUUIDPipe) industryId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');

    let sourceType: KnowledgeSourceType;
    const filename = file.originalname.toLowerCase();

    if (filename.endsWith('.pdf')) sourceType = KnowledgeSourceType.PDF;
    else if (filename.endsWith('.docx')) sourceType = KnowledgeSourceType.DOCX;
    else if (filename.endsWith('.xlsx')) sourceType = KnowledgeSourceType.XLSX;
    else if (filename.endsWith('.md') || filename.endsWith('.markdown')) sourceType = KnowledgeSourceType.MARKDOWN;
    else if (filename.endsWith('.txt')) sourceType = KnowledgeSourceType.TEXT;
    else throw new BadRequestException('Unsupported file format.');

    return this.knowledgeManager.processDocumentUpload(
      null, // No tenant
      file.originalname,
      sourceType,
      file.buffer,
      undefined,
      undefined,
      undefined,
      industryId,
    );
  }

  @Post(':id/knowledge/crawl')
  @ApiOperation({ summary: 'Crawl website URL for industry knowledge' })
  crawlWebsite(
    @Param('id', ParseUUIDPipe) industryId: string,
    @Body() body: { url: string; name?: string },
  ) {
    if (!body.url) throw new BadRequestException('URL is required');

    return this.knowledgeManager.processDocumentUpload(
      null,
      body.name || `Website: ${body.url}`,
      KnowledgeSourceType.WEBSITE,
      undefined,
      body.url,
      undefined,
      undefined,
      industryId,
    );
  }
}
