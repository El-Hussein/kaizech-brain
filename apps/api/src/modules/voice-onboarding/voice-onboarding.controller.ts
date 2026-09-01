import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  UseGuards, 
  Put,
  Delete
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { VoiceOnboardingService } from './voice-onboarding.service';
import { ApiKeyGuard, TenantContext } from '@kaizech/shared';
import { SubmitAnswerDto, CreateQuestionDto, UpdateQuestionDto } from '@kaizech/voice-onboarding';

@ApiTags('Voice Onboarding')
@Controller('voice-onboarding')
export class VoiceOnboardingController {
  constructor(private readonly voiceOnboardingService: VoiceOnboardingService) {}

  @Post('sessions')
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('api_key')
  @ApiOperation({ summary: 'Start a voice onboarding session' })
  startSession(@TenantContext('id') tenantId: string) {
    return this.voiceOnboardingService.startSession(tenantId);
  }

  @Get('sessions/:id')
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('api_key')
  @ApiOperation({ summary: 'Get a session' })
  getSession(
    @TenantContext('id') tenantId: string, 
    @Param('id') sessionId: string
  ) {
    return this.voiceOnboardingService.getSession(tenantId, sessionId);
  }

  @Get('sessions/:id/next-question')
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('api_key')
  @ApiOperation({ summary: 'Get next question for session' })
  getNextQuestion(
    @TenantContext('id') tenantId: string,
    @Param('id') sessionId: string
  ) {
    return this.voiceOnboardingService.getNextQuestion(tenantId, sessionId);
  }

  @Post('sessions/:id/answer')
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('api_key')
  @ApiOperation({ summary: 'Submit an answer' })
  submitAnswer(
    @TenantContext('id') tenantId: string,
    @Param('id') sessionId: string,
    @Body() dto: SubmitAnswerDto
  ) {
    return this.voiceOnboardingService.submitAnswer(tenantId, sessionId, dto);
  }

  @Post('sessions/:id/complete')
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('api_key')
  @ApiOperation({ summary: 'Complete a session' })
  completeSession(
    @TenantContext('id') tenantId: string,
    @Param('id') sessionId: string
  ) {
    return this.voiceOnboardingService.completeSession(tenantId, sessionId);
  }
}

@ApiTags('Admin Voice Onboarding')
@Controller('admin/tenants/:tenantId/interview-questions')
export class AdminVoiceOnboardingController {
  constructor(private readonly voiceOnboardingService: VoiceOnboardingService) {}

  @Post('generate-default')
  @ApiOperation({ summary: 'Generate default questions' })
  generateDefaultQuestions(@Param('tenantId') tenantId: string) {
    return this.voiceOnboardingService.generateDefaultQuestions(tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all questions' })
  getQuestions(@Param('tenantId') tenantId: string) {
    return this.voiceOnboardingService.getQuestions(tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a question' })
  createQuestion(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateQuestionDto
  ) {
    return this.voiceOnboardingService.createQuestion(tenantId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a question' })
  updateQuestion(
    @Param('tenantId') tenantId: string,
    @Param('id') questionId: string,
    @Body() dto: UpdateQuestionDto
  ) {
    return this.voiceOnboardingService.updateQuestion(tenantId, questionId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a question' })
  deleteQuestion(
    @Param('tenantId') tenantId: string,
    @Param('id') questionId: string
  ) {
    return this.voiceOnboardingService.deleteQuestion(tenantId, questionId);
  }

  @Post('reorder')
  @ApiOperation({ summary: 'Reorder questions' })
  reorderQuestions(
    @Param('tenantId') tenantId: string,
    @Body('orderedIds') orderedIds: string[]
  ) {
    return this.voiceOnboardingService.reorderQuestions(tenantId, orderedIds);
  }
}
