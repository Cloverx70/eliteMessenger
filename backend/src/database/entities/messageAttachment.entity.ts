import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Message } from './message.entity';

export enum AttachmentType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  DOCUMENT = 'DOCUMENT',
  FILE = 'FILE',
}

@Entity('message_attachment')
export class MessageAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * S3 object key
   * Example:
   * messages/8a2f-image.png
   */
  @Column()
  key: string;

  @Column({
    type: 'enum',
    enum: AttachmentType,
  })
  type: AttachmentType;

  /**
   * File size in bytes
   */
  @Column({
    nullable: true,
  })
  size?: number;

  @ManyToOne(() => Message, (message) => message.attachments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'messageId',
  })
  message: Message;

  @Column('uuid')
  messageId: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  blurDataURL: string | null;

  @CreateDateColumn()
  createdAt: Date;

  url?: string;
}
