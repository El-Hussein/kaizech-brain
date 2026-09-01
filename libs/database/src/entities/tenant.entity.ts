import { Entity, Column, OneToMany, ManyToOne, ManyToMany, JoinTable, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ApiKeyEntity } from './api-key.entity';
import { ConversationEntity } from './conversation.entity';
import { KnowledgeSourceEntity } from './knowledge-source.entity';
import { ToolManifestEntity } from './tool-manifest.entity';
import { PromptTemplateEntity } from './prompt-template.entity';
import { IndustryEntity } from './industry.entity';

@Entity('tenants')
export class TenantEntity extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ type: 'simple-array', default: 'en' })
  languages: string[];

  @Column({ default: 'UTC' })
  timezone: string;

  @Column({ nullable: true, name: 'greeting_message' })
  greetingMessage: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ nullable: true, name: 'api_endpoint' })
  apiEndpoint: string;

  @Column({ type: 'jsonb', nullable: true })
  settings: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  branding: {
    primaryColor?: string;
    secondaryColor?: string;
    welcomeMessage?: string;
    supportEmail?: string;
    supportPhone?: string;
    workingHours?: string;
  };

  @Column({ type: 'text', nullable: true, name: 'business_description' })
  businessDescription: string;

  @OneToMany(() => ApiKeyEntity, (apiKey) => apiKey.tenant)
  apiKeys: ApiKeyEntity[];

  @OneToMany(() => ConversationEntity, (conv) => conv.tenant)
  conversations: ConversationEntity[];

  @OneToMany(() => KnowledgeSourceEntity, (ks) => ks.tenant)
  knowledgeSources: KnowledgeSourceEntity[];

  @OneToMany(() => ToolManifestEntity, (tm) => tm.tenant)
  toolManifests: ToolManifestEntity[];

  @OneToMany(() => PromptTemplateEntity, (pt) => pt.tenant)
  promptTemplates: PromptTemplateEntity[];

  @Column({ name: 'main_industry_id', nullable: true })
  mainIndustryId: string;

  @ManyToOne(() => IndustryEntity)
  @JoinColumn({ name: 'main_industry_id' })
  mainIndustry: IndustryEntity;

  @ManyToMany(() => IndustryEntity)
  @JoinTable({
    name: 'tenant_related_industries',
    joinColumn: { name: 'tenant_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'industry_id', referencedColumnName: 'id' },
  })
  relatedIndustries: IndustryEntity[];
}
