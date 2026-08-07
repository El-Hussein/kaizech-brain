import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { KnowledgeSourceEntity } from './knowledge-source.entity';
import { KnowledgeChunkEntity } from './knowledge-chunk.entity';

@Entity('industries')
export class IndustryEntity extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 'active' })
  status: string;

  @OneToMany(() => KnowledgeSourceEntity, (ks) => ks.industry)
  knowledgeSources: KnowledgeSourceEntity[];

  @OneToMany(() => KnowledgeChunkEntity, (kc) => kc.industry)
  knowledgeChunks: KnowledgeChunkEntity[];
}
