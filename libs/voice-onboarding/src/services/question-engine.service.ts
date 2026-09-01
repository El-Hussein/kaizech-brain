import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { InterviewQuestionEntity, BusinessInterviewEntity, InterviewResponseEntity, TenantEntity } from '@kaizech/database';
import { AIProviderFactory } from '@kaizech/agent';
import { BASE_QUESTIONS } from '../constants/base-questions';
import { QUESTION_GENERATION_PROMPT } from '../constants/question-generation.prompt';

@Injectable()
export class QuestionEngineService {
  private readonly logger = new Logger(QuestionEngineService.name);

  constructor(
    @InjectRepository(InterviewQuestionEntity)
    private readonly questionRepository: Repository<InterviewQuestionEntity>,
    @InjectRepository(BusinessInterviewEntity)
    private readonly sessionRepository: Repository<BusinessInterviewEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
    private readonly providerFactory: AIProviderFactory,
  ) {}

  async generateDefaultQuestions(tenantId: string): Promise<InterviewQuestionEntity[]> {
    // Delete existing AI-generated questions
    await this.questionRepository.delete({ tenantId, isAiGenerated: true });

    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
      relations: ['mainIndustry'],
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Save base questions
    const baseQuestionEntities = BASE_QUESTIONS.map((bq, index) => {
      return this.questionRepository.create({
        tenantId,
        questionText: bq.questionText,
        whyWeNeedIt: bq.whyWeNeedIt,
        suggestedPoints: bq.suggestedPoints,
        category: bq.category,
        isAiGenerated: false,
        isActive: true,
        sortOrder: index,
      });
    });

    const savedBaseQuestions = await this.questionRepository.save(baseQuestionEntities);

    let aiGeneratedEntities: InterviewQuestionEntity[] = [];

    const industryName = tenant.mainIndustry?.name || 'General Business';
    const businessDescription = tenant.businessDescription || 'No description provided';

    try {
      const existingQuestionsText = BASE_QUESTIONS.map(q => q.questionText).join('\\n- ');
      
      const prompt = QUESTION_GENERATION_PROMPT
        .replace('{industry}', industryName)
        .replace('{businessDescription}', businessDescription)
        .replace('{existingQuestions}', existingQuestionsText);

      const aiProvider = this.providerFactory.getProvider('openai');
      const response = await aiProvider.chatCompletion({
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-4o',
      });

      const responseContent = response.content || '[]';
      let cleanJson = responseContent;
      // Extract JSON if it's wrapped in markdown code blocks
      const jsonMatch = responseContent.match(/\`\`\`(?:json)?([\s\S]*?)\`\`\`/);
      if (jsonMatch) {
        cleanJson = jsonMatch[1].trim();
      }
      
      const generatedQuestions = JSON.parse(cleanJson);
      
      const baseCount = savedBaseQuestions.length;
      
      const toSave = generatedQuestions.map((gq: any, index: number) => {
        return this.questionRepository.create({
          tenantId,
          questionText: gq.questionText,
          whyWeNeedIt: gq.whyWeNeedIt,
          suggestedPoints: gq.suggestedPoints,
          category: gq.category,
          isAiGenerated: true,
          isActive: true,
          sortOrder: baseCount + index,
        });
      });

      aiGeneratedEntities = await this.questionRepository.save(toSave);
    } catch (error) {
      this.logger.error('Failed to generate AI questions', error);
      // Fallback: just use base questions if AI fails
    }

    return [...savedBaseQuestions, ...aiGeneratedEntities].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async getQuestions(tenantId: string): Promise<InterviewQuestionEntity[]> {
    return this.questionRepository.find({
      where: { tenantId, isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  async getNextQuestion(sessionId: string): Promise<{ question: InterviewQuestionEntity; currentNumber: number; totalCount: number } | null> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['responses'],
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const allQuestions = await this.getQuestions(session.tenantId);
    
    if (!allQuestions.length) {
      return null;
    }

    const answeredQuestionIds = new Set(session.responses?.map((r: any) => r.questionId) || []);

    const nextQuestion = allQuestions.find(q => !answeredQuestionIds.has(q.id));

    if (!nextQuestion) {
      return null;
    }

    return {
      question: nextQuestion,
      currentNumber: answeredQuestionIds.size + 1,
      totalCount: allQuestions.length,
    };
  }

  async createQuestion(tenantId: string, dto: any): Promise<InterviewQuestionEntity> {
    const count = await this.questionRepository.count({ where: { tenantId } });
    
    const question = this.questionRepository.create({
      tenantId,
      questionText: dto.questionText,
      whyWeNeedIt: dto.whyWeNeedIt,
      suggestedPoints: dto.suggestedPoints,
      category: dto.category,
      sortOrder: dto.sortOrder !== undefined ? dto.sortOrder : count,
      isAiGenerated: false,
      isActive: true,
    });
    
    return this.questionRepository.save(question);
  }

  async updateQuestion(questionId: string, dto: any): Promise<InterviewQuestionEntity> {
    const question = await this.questionRepository.findOne({ where: { id: questionId } });
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    Object.assign(question, dto);
    return this.questionRepository.save(question);
  }

  async deleteQuestion(questionId: string): Promise<void> {
    const question = await this.questionRepository.findOne({ where: { id: questionId } });
    if (!question) {
      throw new NotFoundException('Question not found');
    }
    question.isActive = false;
    await this.questionRepository.save(question);
  }

  async reorderQuestions(tenantId: string, orderedIds: string[]): Promise<void> {
    const questions = await this.questionRepository.find({
      where: { tenantId, id: In(orderedIds) }
    });

    for (const q of questions) {
      const index = orderedIds.indexOf(q.id);
      if (index !== -1) {
        q.sortOrder = index;
      }
    }

    await this.questionRepository.save(questions);
  }
}
