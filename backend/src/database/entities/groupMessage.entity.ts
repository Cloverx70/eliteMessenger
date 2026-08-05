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

import { GroupChat } from './groupChat.entity';
import { GroupMessageAttachment } from './groupMessageAttachment.entity';
import { GroupMessageReceipt } from './groupMessageReceipt.entity';
import { Post } from './post.entity';
import { User } from './user.entity';

@Entity('group_message')
@Index('idx_group_message_group_created', ['groupId', 'createdAt'])
export class GroupMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  message?: string | null;

  @ManyToOne(() => GroupChat, (group) => group.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'groupId' })
  group: GroupChat;

  @Column('uuid')
  groupId: string;

  @ManyToOne(() => User, (user) => user.groupMessages, {
    eager: true,
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'senderId' })
  sender?: User | null;

  @Column('uuid', { nullable: true })
  senderId?: string | null;

  @OneToMany(() => GroupMessageAttachment, (attachment) => attachment.message, {
    cascade: true,
    eager: true,
  })
  attachments: GroupMessageAttachment[];

  @OneToMany(() => GroupMessageReceipt, (receipt) => receipt.message)
  receipts: GroupMessageReceipt[];

  @Column('uuid', { nullable: true })
  sharedPostId: string | null;

  @ManyToOne(() => Post, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'sharedPostId' })
  sharedPost: Post | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date | null;
}
