import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ForbiddenException, UsePipes, ValidationPipe } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

import { ChatService } from './chat.service';
import MessageDto from './dtos/message.dto';
import { GroupMessageDto } from './dtos/group-message.dto';
import { GroupChatService } from './group-chat.service';
import { S3Service } from '../../utils/s3/s3.service';

@WebSocketGateway(3001, {
  cors: {
    origin: 'http://localhost:8000',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly chatService: ChatService,
    private readonly groupChatService: GroupChatService,
    private readonly s3Service: S3Service,
  ) {}

  private readonly onlineUsers = new Map<string, Set<string>>();
  private readonly socketUsers = new Map<string, string>();

  @WebSocketServer()
  server: Server;

  private directRoom(roomId: string) {
    return `dm:${roomId}`;
  }

  private groupRoom(groupId: string) {
    return `group:${groupId}`;
  }

  private registerSocket(userId: string, socketId: string) {
    const sockets = this.onlineUsers.get(userId) ?? new Set<string>();
    sockets.add(socketId);

    this.onlineUsers.set(userId, sockets);
    this.socketUsers.set(socketId, userId);
  }

  private removeSocket(socketId: string) {
    const userId = this.socketUsers.get(socketId);
    if (!userId) return null;

    const sockets = this.onlineUsers.get(userId);
    sockets?.delete(socketId);

    if (!sockets || sockets.size === 0) {
      this.onlineUsers.delete(userId);
    } else {
      this.onlineUsers.set(userId, sockets);
    }

    this.socketUsers.delete(socketId);
    return userId;
  }

  private getSocketUserId(client: Socket) {
    return this.socketUsers.get(client.id);
  }

  private isUserOnline(userId: string) {
    return (this.onlineUsers.get(userId)?.size ?? 0) > 0;
  }

  private emitToUser(userId: string, event: string, payload: unknown) {
    const socketIds = this.onlineUsers.get(userId);
    if (!socketIds) return;

    for (const socketId of socketIds) {
      this.server.to(socketId).emit(event, payload);
    }
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    const userId = this.removeSocket(client.id);

    if (userId && !this.isUserOnline(userId)) {
      await this.chatService.updateUserActivity(userId, false);
      console.log(`User ${userId} disconnected`);
    }
  }

  @SubscribeMessage('join')
  async handleJoin(
    @MessageBody() userId: string,
    @ConnectedSocket() client: Socket,
  ) {
    this.registerSocket(userId, client.id);
    await this.chatService.updateUserActivity(userId, true);

    const deliveredDirectMessages =
      (await this.chatService.markMessagesDelivered(userId)) ?? [];

    for (const message of deliveredDirectMessages) {
      if (!message.sid) continue;

      this.emitToUser(message.sid, 'message-delivered-ack', {
        messageId: message.id,
        status: 'delivered',
      });
    }

    const deliveredGroupMessages =
      (await this.groupChatService.MarkPendingMessagesDelivered(userId)) ?? [];

    for (const acknowledgement of deliveredGroupMessages) {
      if (!acknowledgement.senderId) continue;

      this.emitToUser(
        acknowledgement.senderId,
        'group-message-delivered-ack',
        acknowledgement,
      );
    }
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() payload: { roomId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const socketUserId = this.getSocketUserId(client);
    if (!socketUserId || socketUserId !== payload.userId) {
      client.emit('errorMessage', { message: 'Invalid socket user' });
      return;
    }

    client.join(this.directRoom(payload.roomId));
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() payload: { roomId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const socketUserId = this.getSocketUserId(client);
    if (!socketUserId || socketUserId !== payload.userId) return;

    client.leave(this.directRoom(payload.roomId));
  }

  @SubscribeMessage('joinGroupRoom')
  async handleJoinGroupRoom(
    @MessageBody() payload: { groupId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const socketUserId = this.getSocketUserId(client);
      if (!socketUserId || socketUserId !== payload.userId) {
        throw new ForbiddenException('Invalid socket user');
      }

      await this.groupChatService.EnsureMember(payload.groupId, socketUserId);
      client.join(this.groupRoom(payload.groupId));
    } catch (error: any) {
      client.emit('errorMessage', {
        message: error.message || 'Unable to join group room',
      });
    }
  }

  @SubscribeMessage('leaveGroupRoom')
  handleLeaveGroupRoom(
    @MessageBody() payload: { groupId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const socketUserId = this.getSocketUserId(client);
    if (!socketUserId || socketUserId !== payload.userId) return;

    client.leave(this.groupRoom(payload.groupId));
  }

  @SubscribeMessage('message-seen')
  async handleMessageSeen(
    @MessageBody() payload: { crid: string; sid: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const socketUserId = this.getSocketUserId(client);
      if (!socketUserId || socketUserId !== payload.sid) {
        throw new ForbiddenException('Invalid socket user');
      }

      const messages =
        (await this.chatService.updateMessagesSeen(
          payload.crid,
          socketUserId,
        )) ?? [];

      for (const message of messages) {
        if (!message.sid) continue;

        this.emitToUser(message.sid, 'message-seen-ack', {
          messageId: message.id,
        });
      }
    } catch (error: any) {
      client.emit('errorMessage', { message: error.message });
    }
  }

  @SubscribeMessage('send-message')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  )
  async handleSendMessage(
    @MessageBody() dto: MessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const socketUserId = this.getSocketUserId(client);
      if (!socketUserId || socketUserId !== dto.sid) {
        throw new ForbiddenException('Invalid socket user');
      }

      const result = await this.chatService.SendMessage(dto.crid, dto);
      const savedMessage = result.newMessage;

      if ((savedMessage.attachments?.length ?? 0) > 0) {
        for (const attachment of savedMessage.attachments) {
          attachment.url = await this.s3Service.getFileUrl(attachment.key);
        }
      }

      client.emit('message-sent-ack', {
        tempId: dto.tempId,
        message: savedMessage,
      });

      if (this.isUserOnline(dto.rid)) {
        this.emitToUser(dto.rid, 'receiveMessage', {
          ...savedMessage,
          tempId: dto.tempId,
        });

        await this.chatService.updateMessageStatus(savedMessage.id, {
          status: 'delivered',
        });

        client.emit('message-delivered-ack', {
          messageId: savedMessage.id,
          tempId: dto.tempId,
          status: 'delivered',
        });

        this.emitToUser(dto.rid, 'new-message-notification', savedMessage);
      }
    } catch (error: any) {
      client.emit('errorMessage', {
        message: error.message || 'Internal Server Error',
      });
    }
  }

  @SubscribeMessage('send-group-message')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  )
  async handleSendGroupMessage(
    @MessageBody() dto: GroupMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const socketUserId = this.getSocketUserId(client);
      if (!socketUserId || socketUserId !== dto.sid) {
        throw new ForbiddenException('Invalid socket user');
      }

      const result = await this.groupChatService.SendMessage(dto);

      client.emit('group-message-sent-ack', {
        tempId: dto.tempId,
        message: result.newMessage,
      });

      const onlineRecipientIds = result.recipientIds.filter((recipientId) =>
        this.isUserOnline(recipientId),
      );

      for (const recipientId of onlineRecipientIds) {
        this.emitToUser(recipientId, 'receive-group-message', {
          ...result.newMessage,
          tempId: dto.tempId,
        });

        this.emitToUser(
          recipientId,
          'new-group-message-notification',
          result.newMessage,
        );
      }

      const receiptSummary = await this.groupChatService.MarkMessageDelivered(
        result.newMessage.id,
        onlineRecipientIds,
      );

      this.emitToUser(dto.sid, 'group-message-delivered-ack', {
        messageId: result.newMessage.id,
        groupId: dto.gid,
        ...receiptSummary,
      });
    } catch (error: any) {
      client.emit('errorMessage', {
        message: error.message || 'Internal Server Error',
      });
    }
  }

  @SubscribeMessage('group-message-seen')
  async handleGroupMessagesSeen(
    @MessageBody() payload: { groupId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const socketUserId = this.getSocketUserId(client);
      if (!socketUserId || socketUserId !== payload.userId) {
        throw new ForbiddenException('Invalid socket user');
      }

      const acknowledgements =
        (await this.groupChatService.MarkMessagesSeen(
          payload.groupId,
          socketUserId,
        )) ?? [];

      for (const acknowledgement of acknowledgements) {
        if (!acknowledgement.senderId) continue;

        this.emitToUser(
          acknowledgement.senderId,
          'group-message-seen-ack',
          acknowledgement,
        );
      }
    } catch (error: any) {
      client.emit('errorMessage', {
        message: error.message || 'Unable to mark group messages as seen',
      });
    }
  }
}
