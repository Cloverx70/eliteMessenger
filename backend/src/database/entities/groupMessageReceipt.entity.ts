import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { GroupMessage } from './groupMessage.entity';
import { User } from './user.entity';

@Entity('group_message_receipt')
@Unique('uq_group_message_receipt_message_user', ['messageId', 'userId'])
@Index('idx_group_receipt_user_seen', ['userId', 'seenAt'])
@Index('idx_group_receipt_user_delivered', ['userId', 'deliveredAt'])
export class GroupMessageReceipt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => GroupMessage, (message) => message.receipts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'messageId' })
  message: GroupMessage;

  @Column('uuid')
  messageId: string;

  @ManyToOne(() => User, (user) => user.groupMessageReceipts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('uuid')
  userId: string;

  @Column({ nullable: true })
  deliveredAt?: Date | null;

  @Column({ nullable: true })
  seenAt?: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
