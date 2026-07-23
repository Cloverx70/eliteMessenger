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

import { ChatRoom } from './chatRoom.entity'; // import your Room entity
import { MessageAttachment } from './messageAttachment.entity';
import { User } from './user.entity';

@Entity('message')
@Index('createdAt', ['createdAt'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  message: string;

  @ManyToOne(() => ChatRoom, (chatRoom) => chatRoom.messages)
  @JoinColumn({ name: 'chatroomId' })
  chatRoom: ChatRoom;

  @Column('uuid')
  chatroomId: string;

  @ManyToOne(() => User, (user) => user.messages, {
    eager: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'sid' })
  sender: User;

  @Column('uuid', { nullable: true })
  sid: string;

  @OneToMany(() => MessageAttachment, (attachment) => attachment.message, {
    cascade: true,
    eager: true,
  })
  attachments: MessageAttachment[];

  @Column({
    type: 'enum',
    enum: ['pending', 'sent', 'delivered', 'seen'],
    default: 'delivered',
  })
  status: 'pending' | 'sent' | 'delivered' | 'seen';

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
