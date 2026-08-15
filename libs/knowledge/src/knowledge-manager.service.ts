import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KnowledgeSourceEntity, KnowledgeChunkEntity, TenantEntity, KnowledgeNodeEntity, KnowledgeEdgeEntity } from '@kaizech/database';
import { VectorSearchService } from '@kaizech/rag';
import { AIProviderFactory } from '@kaizech/agent';
import { DocumentParserService } from './document-parser.service';
import { WebsiteCrawlerService } from './website-crawler.service';
import { KnowledgeSourceType, KnowledgeStatus, KnowledgeProcessingException } from '@kaizech/shared';

@Injectable()
export class KnowledgeManagerService {
  private readonly logger = new Logger(KnowledgeManagerService.name);

  constructor(
    @InjectRepository(KnowledgeSourceEntity)
    private readonly sourceRepository: Repository<KnowledgeSourceEntity>,
    @InjectRepository(KnowledgeChunkEntity)
    private readonly chunkRepository: Repository<KnowledgeChunkEntity>,
    @InjectRepository(KnowledgeNodeEntity)
    private readonly nodeRepository: Repository<KnowledgeNodeEntity>,
    @InjectRepository(KnowledgeEdgeEntity)
    private readonly edgeRepository: Repository<KnowledgeEdgeEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
    private readonly parser: DocumentParserService,
    private readonly crawler: WebsiteCrawlerService,
    private readonly vectorSearch: VectorSearchService,
    private readonly providerFactory: AIProviderFactory,
  ) {}

  async processDocumentUpload(
    tenantId: string | null,
    name: string,
    sourceType: KnowledgeSourceType,
    fileBuffer?: Buffer,
    url?: string,
    rawContent?: string,
    faqData?: Array<{ question: string; answer: string; category?: string }>,
    industryId?: string | null,
    parseType?: KnowledgeSourceType,
  ): Promise<KnowledgeSourceEntity> {
    const typeVal = String(sourceType || KnowledgeSourceType.TEXT);
    const source = new KnowledgeSourceEntity();
    if (tenantId) source.tenantId = tenantId;
    if (industryId) source.industryId = industryId;
    source.name = name;
    source.sourceType = typeVal;
    if (url) source.url = url;
    source.status = KnowledgeStatus.PROCESSING;

    const savedSource = await this.sourceRepository.save(source);

    try {
      let extractedText = '';

      // Use parseType for deciding HOW to parse the file, falling back to sourceType
      const effectiveParseType = parseType || sourceType;

      if (effectiveParseType === KnowledgeSourceType.PDF && fileBuffer) {
        extractedText = await this.parser.parseFileToMarkdown(fileBuffer, 'application/pdf');
      } else if (effectiveParseType === KnowledgeSourceType.DOCX && fileBuffer) {
        extractedText = await this.parser.parseFileToMarkdown(fileBuffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      } else if (effectiveParseType === KnowledgeSourceType.XLSX && fileBuffer) {
        extractedText = await this.parser.parseFileToMarkdown(fileBuffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      } else if (effectiveParseType === KnowledgeSourceType.MARKDOWN && fileBuffer) {
        extractedText = this.parser.parseMarkdown(fileBuffer);
      } else if (effectiveParseType === KnowledgeSourceType.FAQ && faqData) {
        extractedText = this.parser.parseFaqs(faqData);
      } else if (effectiveParseType === KnowledgeSourceType.WEBSITE && url) {
        const crawled = await this.crawler.crawlUrl(url);
        extractedText = crawled.content;
      } else if (effectiveParseType === KnowledgeSourceType.TEXT) {
        if (rawContent) {
          extractedText = rawContent;
        } else if (fileBuffer) {
          extractedText = fileBuffer.toString('utf8');
        } else {
          throw new BadRequestException('Text content or file buffer is required for TEXT source type.');
        }
      } else {
        throw new BadRequestException('Invalid knowledge source input or missing required file/URL/content.');
      }

      // Fetch tenant custom API key if configured
      let customApiKey = undefined;
      if (tenantId) {
        const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
        customApiKey = tenant?.settings?.openaiApiKey;
      }

      const provider = this.providerFactory.getProvider('openai');

      // Generate context summary for Contextual Chunking
      let contextSummary = '';
      if (extractedText.length > 500) {
        try {
          const summaryPrompt = `Please read the following document and provide a brief, 1-3 sentence summary of its main topic, context, and purpose. This will be used to provide context for smaller chunks of this document.\n\nDocument:\n${extractedText.substring(0, 50000)}`;
          const summaryResponse = await provider.chatCompletion({
            messages: [{ role: 'user', content: summaryPrompt }],
            maxTokens: 150,
            temperature: 0.2,
            apiKey: customApiKey,
          });
          contextSummary = summaryResponse.content || '';
          this.logger.log(`Generated context summary for '${name}'`);
        } catch (err: any) {
          this.logger.warn(`Failed to generate context summary: ${err.message}`);
        }
      }

      // Chunk text
      const textChunks = this.parser.chunkText(extractedText, contextSummary, 1000, 200);
      if (!textChunks || textChunks.length === 0) {
        throw new BadRequestException('Document content is empty or contains no readable text to index.');
      }

      this.logger.log(
        `Generated ${textChunks.length} chunk(s) for knowledge source '${name}' (Tenant ${tenantId}, Industry ${industryId})`,
      );

      // Generate Embeddings
      let embeddings: number[][];
      try {
        embeddings = await provider.generateEmbeddings(textChunks, undefined, customApiKey);
      } catch (embErr: any) {
        const errMsg = embErr.message || 'Failed to generate vector embeddings from AI provider.';
        this.logger.error(`Embedding generation failed: ${errMsg}`, embErr.stack);
        throw new KnowledgeProcessingException(errMsg);
      }

      // Prepare chunks array
      const chunksData = textChunks.map((content, idx) => ({
        content,
        embedding: embeddings[idx],
        chunkIndex: idx,
        metadata: { sourceName: name, sourceType },
      }));

      // Store in pgvector database
      await this.vectorSearch.storeChunks(tenantId, savedSource.id, chunksData, industryId);

      // Graph Extraction Logic (Graph RAG)
      try {
        const graphPrompt = `Extract key entities (nodes) and their relationships (edges) from the following text. 
Return ONLY valid JSON with this structure: 
{ "nodes": [{ "name": "...", "type": "..." }], "edges": [{ "source": "...", "target": "...", "relation": "..." }] }. 
Text:\n${extractedText.substring(0, 30000)}`;

        const graphResponse = await provider.chatCompletion({
          messages: [{ role: 'user', content: graphPrompt }],
          maxTokens: 1000,
          temperature: 0.1,
          apiKey: customApiKey,
        });
        
        const content = graphResponse.content?.replace(/```json/g, '').replace(/```/g, '').trim() || '{}';
        const parsedGraph = JSON.parse(content);
        
        const nodeMap = new Map<string, KnowledgeNodeEntity>();
        
        if (parsedGraph.nodes && Array.isArray(parsedGraph.nodes)) {
          for (const nodeData of parsedGraph.nodes) {
            const node = new KnowledgeNodeEntity();
            node.name = nodeData.name;
            node.type = nodeData.type;
            if (tenantId) node.tenantId = tenantId;
            const savedNode = await this.nodeRepository.save(node);
            nodeMap.set(nodeData.name, savedNode);
          }
        }
        
        if (parsedGraph.edges && Array.isArray(parsedGraph.edges)) {
          for (const edgeData of parsedGraph.edges) {
            const sourceNode = nodeMap.get(edgeData.source);
            const targetNode = nodeMap.get(edgeData.target);
            if (sourceNode && targetNode) {
              const edge = new KnowledgeEdgeEntity();
              edge.sourceNodeId = sourceNode.id;
              edge.targetNodeId = targetNode.id;
              edge.relationType = edgeData.relation;
              if (tenantId) edge.tenantId = tenantId;
              await this.edgeRepository.save(edge);
            }
          }
        }
        this.logger.log(`Extracted Graph nodes/edges for '${name}'`);
      } catch (err: any) {
        this.logger.warn(`Failed to extract graph data: ${err.message}`);
      }

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

    // Delete associated vector chunks
    await this.chunkRepository.delete({ sourceId, tenantId });

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
