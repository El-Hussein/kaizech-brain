import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessInterviewEntity } from '@kaizech/database';
import { KnowledgeManagerService } from '@kaizech/knowledge';
import { KnowledgeSourceType } from '@kaizech/shared';
import { AIProviderFactory } from '@kaizech/agent';
import { DOCUMENT_GENERATION_PROMPT } from '../constants/document-generation.prompt';

@Injectable()
export class InterviewToKnowledgeService {
  private readonly logger = new Logger(InterviewToKnowledgeService.name);

  constructor(
    @InjectRepository(BusinessInterviewEntity)
    private readonly sessionRepository: Repository<BusinessInterviewEntity>,
    private readonly knowledgeManager: KnowledgeManagerService,
    private readonly providerFactory: AIProviderFactory,
  ) {}

  async processCompletedInterview(sessionId: string): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['responses', 'responses.question'],
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.previousInterviewId) {
      const prevSession = await this.sessionRepository.findOne({ where: { id: session.previousInterviewId } });
      if (prevSession && prevSession.knowledgeSourceId) {
        try {
          await this.knowledgeManager.deleteSource(session.tenantId, prevSession.knowledgeSourceId);
        } catch (e) {
          this.logger.warn(`Failed to delete previous knowledge source ${prevSession.knowledgeSourceId}`, e);
        }
      }
    }

    const qaText = session.responses
      ?.filter(r => r.questionText) // Note: fixed from r.question to r.questionText since relation might not load or we want the snapshot
      .map(r => `Q: ${r.questionText}\\nA: ${r.answerText}`)
      .join('\\n\\n') || '';

    const prompt = DOCUMENT_GENERATION_PROMPT.replace('{questionsAndAnswers}', qaText);

    const aiProvider = this.providerFactory.getProvider('openai');
    const response = await aiProvider.chatCompletion({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4o',
    });

    const generatedMarkdown = response.content || '# Business Overview\\nNo information provided.';

    const version = Date.now().toString().slice(-6); // Simple versioning

    const source = await this.knowledgeManager.processDocumentUpload(
      session.tenantId,
      `Business Interview v${version}`,
      KnowledgeSourceType.TEXT,
      undefined,
      undefined,
      generatedMarkdown
    );

    session.status = 'completed';
    session.knowledgeSourceId = source.id;
    // For businessSummary we can do an additional quick summary or just leave it empty if not provided.
    
    await this.sessionRepository.save(session);
  }
}
