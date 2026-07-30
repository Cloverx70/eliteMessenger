import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { Post } from './post.entity';
import { User } from './user.entity';

export enum PostReportReason {
  SPAM = 'SPAM',
  HARASSMENT = 'HARASSMENT',
  INAPPROPRIATE = 'INAPPROPRIATE',
  FALSE_INFORMATION = 'FALSE_INFORMATION',
  OTHER = 'OTHER',
}

@Entity('post_reports')
@Unique(['postId', 'reporterId'])
@Index(['postId', 'createdAt'])
@Index(['reporterId', 'createdAt'])
export class PostReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  postId: string;

  @ManyToOne(() => Post, (post) => post.reports, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @Column('uuid')
  reporterId: string;

  @ManyToOne(() => User, (user) => user.postReports, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'reporterId' })
  reporter: User;

  @Column({ type: 'enum', enum: PostReportReason })
  reason: PostReportReason;

  @Column({ type: 'text', nullable: true })
  details: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
