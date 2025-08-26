import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { ChatRoom } from './chatRoom.entity'; // import your Room entity
import { User } from './user.entity';
@Entity()
@Index('createdAt', ['createdAt'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  message: string;

  @ManyToOne(() => ChatRoom, (chatRoom) => chatRoom.messages)
  @JoinColumn({ name: 'chatroomId' })
  chatRoom: ChatRoom;

  chatroomId: string;

  @ManyToOne(() => User, (user) => user.messages, {
    eager: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'sid' })
  sender: User;

  @Column('uuid', { nullable: true })
  sid: string;

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
