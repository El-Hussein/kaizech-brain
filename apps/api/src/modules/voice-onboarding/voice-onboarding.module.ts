import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessInterviewEntity, InterviewResponseEntity } from '@kaizech/database';
import { VoiceOnboardingLibModule } from '@kaizech/voice-onboarding';
import { AuthModule } from '../auth/auth.module';
import { VoiceOnboardingController, AdminVoiceOnboardingController } from './voice-onboarding.controller';
import { VoiceOnboardingService } from './voice-onboarding.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([BusinessInterviewEntity, InterviewResponseEntity]),
    AuthModule,
    VoiceOnboardingLibModule,
  ],
  controllers: [VoiceOnboardingController, AdminVoiceOnboardingController],
  providers: [VoiceOnboardingService],
  exports: [VoiceOnboardingService],
})
export class VoiceOnboardingModule {}
