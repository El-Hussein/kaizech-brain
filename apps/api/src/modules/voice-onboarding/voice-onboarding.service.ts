import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessInterviewEntity, InterviewResponseEntity, InterviewQuestionEntity } from '@kaizech/database';
import { 
  QuestionEngineService, 
  ResponseEvaluatorService, 
  InterviewToKnowledgeService 
} from '@kaizech/voice-onboarding';
import { SubmitAnswerDto } from '@kaizech/voice-onboarding';

@Injectable()
export class VoiceOnboardingService {
  constructor(
    @InjectRepository(BusinessInterviewEntity)
    private readonly sessionRepository: Repository<BusinessInterviewEntity>,
    @InjectRepository(InterviewResponseEntity)
    private readonly responseRepository: Repository<InterviewResponseEntity>,
    @InjectRepository(InterviewQuestionEntity)
    private readonly questionRepository: Repository<InterviewQuestionEntity>,
    private readonly questionEngineService: QuestionEngineService,
    private readonly evaluatorService: ResponseEvaluatorService,
    private readonly interviewToKnowledgeService: InterviewToKnowledgeService,
  ) {}

  async startSession(tenantId: string) {
    let session = await this.sessionRepository.findOne({
      where: { tenantId, status: 'in_progress' },
      relations: ['responses'],
    });

    if (!session) {
      session = this.sessionRepository.create({
        tenantId,
        status: 'in_progress',
      });
      await this.sessionRepository.save(session);
    }

    return session;
  }

  async getSession(tenantId: string, sessionId: string) {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, tenantId },
      relations: ['responses'], // Removed responses.question since it's not a real relation
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }

  async submitAnswer(tenantId: string, sessionId: string, dto: SubmitAnswerDto) {
    const session = await this.getSession(tenantId, sessionId);
    
    const question = await this.questionRepository.findOne({ where: { id: dto.questionId } });
    if (!question) {
        throw new NotFoundException('Question not found');
    }

    // Call evaluateAnswer synchronously
    const evaluation = await this.evaluatorService.evaluateAnswer(
      question.questionText, 
      dto.answerText, 
      question.suggestedPoints || []
    );

    const response = this.responseRepository.create({
      interviewId: session.id,
      questionId: dto.questionId,
      questionText: question.questionText,
      category: question.category || 'General',
      answerText: dto.answerText,
      inputMethod: dto.inputMethod || 'voice',
      completenessScore: evaluation.completenessScore,
      evaluationStatus: 'completed',
      evaluationFeedback: evaluation.feedback,
      followUpQuestions: evaluation.followUpQuestion ? [evaluation.followUpQuestion] : [],
    });

    await this.responseRepository.save(response);

    return response;
  }

  async completeSession(tenantId: string, sessionId: string) {
    const session = await this.getSession(tenantId, sessionId);
    await this.interviewToKnowledgeService.processCompletedInterview(session.id);
    return { success: true };
  }

  // Question Engine Wrappers
  async generateDefaultQuestions(tenantId: string) {
    return this.questionEngineService.generateDefaultQuestions(tenantId);
  }

  async getQuestions(tenantId: string) {
    return this.questionEngineService.getQuestions(tenantId);
  }

  async getNextQuestion(tenantId: string, sessionId: string) {
    // Verify session belongs to tenant
    await this.getSession(tenantId, sessionId);
    return this.questionEngineService.getNextQuestion(sessionId);
  }

  async createQuestion(tenantId: string, dto: any) {
    return this.questionEngineService.createQuestion(tenantId, dto);
  }

  async updateQuestion(tenantId: string, questionId: string, dto: any) {
    // We could verify the question belongs to tenant but we trust admin endpoints
    return this.questionEngineService.updateQuestion(questionId, dto);
  }

  async deleteQuestion(tenantId: string, questionId: string) {
    return this.questionEngineService.deleteQuestion(questionId);
  }

  async reorderQuestions(tenantId: string, orderedIds: string[]) {
    return this.questionEngineService.reorderQuestions(tenantId, orderedIds);
  }
}
