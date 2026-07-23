import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { AttachmentType } from './messageAttachment.entity';
import { GroupMessage } from './groupMessage.entity';

@Entity('group_message_attachment')
export class GroupMessageAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  key: string;

  @Column({
    type: 'enum',
    enum: AttachmentType,
  })
  type: AttachmentType;

  @Column({ nullable: true })
  size?: number;

  @ManyToOne(() => GroupMessage, (message) => message.attachments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'messageId' })
  message: GroupMessage;

  @Column('uuid')
  messageId: string;

  @CreateDateColumn()
  createdAt: Date;

  url?: string;
}
