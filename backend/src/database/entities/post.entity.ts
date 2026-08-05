import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { HiddenPost } from './hiddenPosts.entity';
import { PostAttachment } from './postAttachment.entity';
import { PostComment } from './postComment.entity';
import { PostLike } from './postLike.entity';
import { PostReport } from './postReport.entity';
import { PostShare } from './postShare.entity';
import { SavedPost } from './postSave.entity';
import { User } from './user.entity';

export enum PostVisibility {
  PUBLIC = 'PUBLIC',
  FRIENDS = 'FRIENDS',
}

@Entity('posts')
@Index(['createdAt', 'id'])
@Index(['authorId', 'createdAt'])
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  authorId: string;

  @ManyToOne(() => User, (user) => user.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column({ type: 'text', nullable: true })
  caption: string | null;

  @Column({
    type: 'enum',
    enum: PostVisibility,
    default: PostVisibility.PUBLIC,
  })
  visibility: PostVisibility;

  @Column({ default: true })
  commentsEnabled: boolean;

  @Column({ default: 0 })
  likeCount: number;

  @Column({ default: 0 })
  commentCount: number;

  @Column({ default: 0 })
  shareCount: number;

  @OneToMany(() => PostAttachment, (attachment) => attachment.post)
  attachments: PostAttachment[];

  @OneToMany(() => PostLike, (like) => like.post)
  likes: PostLike[];

  @OneToMany(() => PostComment, (comment) => comment.post)
  comments: PostComment[];

  @OneToMany(() => SavedPost, (savedPost) => savedPost.post)
  saves: SavedPost[];

  @OneToMany(() => PostShare, (share) => share.post)
  shares: PostShare[];

  @OneToMany(() => PostReport, (report) => report.post)
  reports: PostReport[];

  @OneToMany(() => HiddenPost, (hiddenPost) => hiddenPost.post)
  hiddenByUsers: HiddenPost[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
