import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfileEntity } from '@kaizech/database';

@Injectable()
export class UserProfileService {
  private readonly logger = new Logger(UserProfileService.name);

  constructor(
    @InjectRepository(UserProfileEntity)
    private readonly userProfileRepository: Repository<UserProfileEntity>,
  ) {}

  async getOrCreateProfile(
    tenantId: string,
    channelUserId: string,
    channelType: string,
    displayName?: string,
  ): Promise<UserProfileEntity> {
    let profile = await this.userProfileRepository.findOne({
      where: { tenantId, channelUserId },
    });

    if (!profile) {
      profile = this.userProfileRepository.create({
        tenantId,
        channelUserId,
        channelType,
        displayName,
        lastInteractionAt: new Date(),
      });
      profile = await this.userProfileRepository.save(profile);
    } else {
      profile.lastInteractionAt = new Date();
      if (displayName && !profile.displayName) {
        profile.displayName = displayName;
      }
      profile = await this.userProfileRepository.save(profile);
    }

    return profile;
  }

  async updatePreferences(
    tenantId: string,
    channelUserId: string,
    preferences: Record<string, any>,
  ): Promise<UserProfileEntity> {
    let profile = await this.getOrCreateProfile(tenantId, channelUserId, 'unknown');
    profile.preferences = { ...(profile.preferences || {}), ...preferences };
    return this.userProfileRepository.save(profile);
  }

  async setPreferredLanguage(
    tenantId: string,
    channelUserId: string,
    language: string,
  ): Promise<void> {
    const profile = await this.getOrCreateProfile(tenantId, channelUserId, 'unknown');
    profile.preferredLanguage = language;
    await this.userProfileRepository.save(profile);
  }
}
