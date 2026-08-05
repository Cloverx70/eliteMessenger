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
import { User } from './user.entity';

export enum PostShareTarget {
  CHAT = 'CHAT',
  GROUPCHAT = 'GROUPCHAT',
}

@Entity('post_shares')
@Index(['postId', 'createdAt'])
@Index(['senderId', 'createdAt'])
export class PostShare {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  postId: string;

  @ManyToOne(() => Post, (post) => post.shares, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @Column('uuid')
  senderId: string;

  @ManyToOne(() => User, (user) => user.postShares, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column({ type: 'enum', enum: PostShareTarget })
  targetType: PostShareTarget;

  @Column('uuid')
  targetId: string;

  @CreateDateColumn()
  createdAt: Date;
}
