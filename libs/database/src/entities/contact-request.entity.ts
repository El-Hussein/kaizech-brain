import { Column, Entity } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('contact_requests')
export class ContactRequest extends BaseEntity {
  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  email: string;

  @Column()
  companySize: string;

  @Column({ nullable: true })
  website?: string;

  @Column('text')
  message: string;

  @Column({ default: 'new' })
  status: string; // e.g., 'new', 'contacted', 'resolved'
}
