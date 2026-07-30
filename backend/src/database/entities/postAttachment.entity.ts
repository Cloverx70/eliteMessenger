import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Post } from './post.entity';

export enum PostAttachmentType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

@Entity('post_attachments')
@Index(['postId', 'displayOrder'])
export class PostAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  postId: string;

  @ManyToOne(() => Post, (post) => post.attachments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @Column()
  key: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  blurDataURL: string | null;

  @Column({
    type: 'enum',
    enum: PostAttachmentType,
  })
  type: PostAttachmentType;

  @Column()
  mimeType: string;

  @Column({
    nullable: true,
  })
  filename: string | null;

  @Column({
    type: 'bigint',
    nullable: true,
  })
  size: number | null;

  @Column({
    nullable: true,
  })
  width: number | null;

  @Column({
    nullable: true,
  })
  height: number | null;

  @Column({
    nullable: true,
  })
  duration: number | null;

  @Column({
    default: 0,
  })
  displayOrder: number;

  @CreateDateColumn()
  createdAt: Date;
}
