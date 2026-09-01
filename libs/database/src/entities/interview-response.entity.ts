import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { BusinessInterviewEntity } from './business-interview.entity';

@Entity('interview_responses')
@Index('idx_interview_responses_interview', ['interviewId'])
@Index('idx_interview_responses_question', ['questionId'])
export class InterviewResponseEntity extends BaseEntity {
  @Column({ name: 'interview_id' })
  interviewId: string;

  @ManyToOne(() => BusinessInterviewEntity, (i) => i.responses)
  @JoinColumn({ name: 'interview_id' })
  interview: BusinessInterviewEntity;

  @Column({ name: 'question_id' })
  questionId: string;

  @Column({ type: 'text', name: 'question_text' })
  questionText: string;

  @Column()
  category: string;

  @Column({ type: 'text', name: 'answer_text' })
  answerText: string;

  @Column({ default: 'typed', name: 'input_method' })
  inputMethod: string;

  @Column({ type: 'float', default: 0, name: 'completeness_score' })
  completenessScore: number;

  @Column({ default: 'pending', name: 'evaluation_status' })
  evaluationStatus: string;

  @Column({ type: 'text', nullable: true, name: 'evaluation_feedback' })
  evaluationFeedback: string;

  @Column({ type: 'jsonb', nullable: true, name: 'follow_up_questions' })
  followUpQuestions: string[];

  @Column({ type: 'text', nullable: true, name: 'follow_up_answer' })
  followUpAnswer: string;

  @Column({ type: 'float', nullable: true, name: 'follow_up_score' })
  followUpScore: number;
}
