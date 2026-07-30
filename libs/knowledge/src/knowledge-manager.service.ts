import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KnowledgeSourceEntity, KnowledgeChunkEntity } from '@kaizech/database';
import { VectorSearchService } from '@kaizech/rag';
import { AIProviderFactory } from '@kaizech/agent';
import { DocumentParserService } from './document-parser.service';
import { WebsiteCrawlerService } from './website-crawler.service';
import { KnowledgeSourceType, KnowledgeStatus } from '@kaizech/shared';

@Injectable()
export class KnowledgeManagerService {
  private readonly logger = new Logger(KnowledgeManagerService.name);

  constructor(
    @InjectRepository(KnowledgeSourceEntity)
    private readonly sourceRepository: Repository<KnowledgeSourceEntity>,
    @InjectRepository(KnowledgeChunkEntity)
    private readonly chunkRepository: Repository<KnowledgeChunkEntity>,
    private readonly parser: DocumentParserService,
    private readonly crawler: WebsiteCrawlerService,
    private readonly vectorSearch: VectorSearchService,
    private readonly providerFactory: AIProviderFactory,
  ) {}

  async processDocumentUpload(
    tenantId: string,
    name: string,
    sourceType: KnowledgeSourceType,
    fileBuffer?: Buffer,
    url?: string,
    rawContent?: string,
    faqData?: Array<{ question: string; answer: string; category?: string }>,
  ): Promise<KnowledgeSourceEntity> {
    const typeVal = String(sourceType || KnowledgeSourceType.TEXT);
    const source = new KnowledgeSourceEntity();
    source.tenantId = tenantId;
    source.name = name;
    source.sourceType = typeVal;
    if (url) source.url = url;
    source.status = KnowledgeStatus.PROCESSING;

    const savedSource = await this.sourceRepository.save(source);

    try {
      let extractedText = '';

      if (sourceType === KnowledgeSourceType.PDF && fileBuffer) {
        extractedText = await this.parser.parsePdf(fileBuffer);
      } else if (sourceType === KnowledgeSourceType.DOCX && fileBuffer) {
        extractedText = await this.parser.parseDocx(fileBuffer);
      } else if (sourceType === KnowledgeSourceType.XLSX && fileBuffer) {
        extractedText = await this.parser.parseXlsx(fileBuffer);
      } else if (sourceType === KnowledgeSourceType.MARKDOWN && fileBuffer) {
        extractedText = this.parser.parseMarkdown(fileBuffer);
      } else if (sourceType === KnowledgeSourceType.FAQ && faqData) {
        extractedText = this.parser.parseFaqs(faqData);
      } else if (sourceType === KnowledgeSourceType.WEBSITE && url) {
        const crawled = await this.crawler.crawlUrl(url);
        extractedText = crawled.content;
      } else if (sourceType === KnowledgeSourceType.TEXT && rawContent) {
        extractedText = rawContent;
      } else {
        throw new Error('Invalid knowledge source input or missing required file/URL/content.');
      }

      // Chunk text
      const textChunks = this.parser.chunkText(extractedText, 1000, 200);
      this.logger.log(
        `Generated ${textChunks.length} chunk(s) for knowledge source '${name}' (Tenant ${tenantId})`,
      );

      // Generate Embeddings
      const provider = this.providerFactory.getProvider('openai');
      const embeddings = await provider.generateEmbeddings(textChunks);

      // Prepare chunks array
      const chunksData = textChunks.map((content, idx) => ({
        content,
        embedding: embeddings[idx],
        chunkIndex: idx,
        metadata: { sourceName: name, sourceType },
      }));

      // Store in pgvector database
      await this.vectorSearch.storeChunks(tenantId, savedSource.id, chunksData);

      // Update source status
      savedSource.status = KnowledgeStatus.COMPLETED;
      savedSource.chunkCount = textChunks.length;
      await this.sourceRepository.save(savedSource);

      return savedSource;
    } catch (error: any) {
      this.logger.error(`Knowledge processing failed for '${name}': ${error.message}`, error.stack);
      savedSource.status = KnowledgeStatus.FAILED;
      savedSource.errorMessage = error.message;
      await this.sourceRepository.save(savedSource);
      throw error;
    }
  }

  async listSourcesForTenant(tenantId: string): Promise<KnowledgeSourceEntity[]> {
    return this.sourceRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async deleteSource(tenantId: string, sourceId: string): Promise<void> {
    const source = await this.sourceRepository.findOne({
      where: { id: sourceId, tenantId },
    });
    if (!source) {
      throw new NotFoundException(`Knowledge source '${sourceId}' not found.`);
    }

    await this.sourceRepository.softRemove(source);
  }

  async getSource(tenantId: string, sourceId: string): Promise<KnowledgeSourceEntity> {
    const source = await this.sourceRepository.findOne({
      where: { id: sourceId, tenantId },
    });
    if (!source) {
      throw new NotFoundException(`Knowledge source '${sourceId}' not found.`);
    }
    return source;
  }

  async getSourceChunks(
    tenantId: string,
    sourceId: string,
  ): Promise<{ id: string; chunkIndex: number; content: string; metadata: any }[]> {
    // Verify ownership
    await this.getSource(tenantId, sourceId);

    const chunks = await this.chunkRepository.find({
      where: { sourceId, tenantId },
      order: { chunkIndex: 'ASC' },
      select: ['id', 'chunkIndex', 'content', 'metadata'],
    });

    return chunks.map((c) => ({
      id: c.id,
      chunkIndex: c.chunkIndex,
      content: c.content,
      metadata: c.metadata,
    }));
  }
}
