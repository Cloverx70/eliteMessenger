import {
  ForbiddenException,
  InternalServerErrorException,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import * as cookie from 'cookie';
import { Server, Socket } from 'socket.io';

import { ChatService } from './chat.service';
import { GroupChatService } from './group-chat.service';
import { GroupMessageDto } from './dtos/group-message.dto';
import MessageDto from './dtos/message.dto';

type SocketJwtPayload = {
  id?: string;
};

type PresenceUpdate = {
  userId: string;
  isActive: boolean;
  lastSeen: string | null;
};

const AUTH_COOKIE_NAME = 'ELITE_ERA_AUTH_TOKEN';
const DISCONNECT_GRACE_MS = 5_000;

const allowedSocketOrigins = (
  process.env.FRONT_BASE_URLS ??
  process.env.FRONT_BASE_URL ??
  'http://localhost:8000'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

@WebSocketGateway({
  cors: {
    origin: allowedSocketOrigins,
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly chatService: ChatService,
    private readonly groupChatService: GroupChatService,
    private readonly jwtService: JwtService,
  ) {}

  private readonly onlineUsers = new Map<string, Set<string>>();
  private readonly socketUsers = new Map<string, string>();
  private readonly disconnectTimers = new Map<
    string,
    ReturnType<typeof setTimeout>
  >();

  @WebSocketServer()
  server: Server;

  private directRoom(roomId: string): string {
    return `dm:${roomId}`;
  }

  private groupRoom(groupId: string): string {
    return `group:${groupId}`;
  }

  private getAuthenticatedUserId(client: Socket): string {
    const rawCookie = client.handshake.headers.cookie;

    if (!rawCookie) {
      throw new UnauthorizedException('Authentication cookie is missing');
    }

    const parsedCookies = cookie.parse(rawCookie);
    const token = parsedCookies[AUTH_COOKIE_NAME];

    if (!token) {
      throw new UnauthorizedException('Authentication token is missing');
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new InternalServerErrorException('JWT_SECRET is not configured');
    }

    const payload = this.jwtService.verify<SocketJwtPayload>(token, {
      secret,
    });

    if (!payload.id) {
      throw new UnauthorizedException('Invalid authentication token');
    }

    return payload.id;
  }

  private cancelPendingDisconnect(userId: string): boolean {
    const pendingTimer = this.disconnectTimers.get(userId);

    if (!pendingTimer) {
      return false;
    }

    clearTimeout(pendingTimer);
    this.disconnectTimers.delete(userId);

    return true;
  }

  private registerSocket(userId: string, socketId: string): boolean {
    const sockets = this.onlineUsers.get(userId) ?? new Set<string>();
    const wasOffline = sockets.size === 0;

    sockets.add(socketId);

    this.onlineUsers.set(userId, sockets);
    this.socketUsers.set(socketId, userId);

    return wasOffline;
  }

  private removeSocket(
    socketId: string,
  ): { userId: string; hasRemainingSockets: boolean } | null {
    const userId = this.socketUsers.get(socketId);

    if (!userId) {
      return null;
    }

    const sockets = this.onlineUsers.get(userId);
    sockets?.delete(socketId);

    const hasRemainingSockets = Boolean(sockets && sockets.size > 0);

    if (hasRemainingSockets && sockets) {
      this.onlineUsers.set(userId, sockets);
    } else {
      this.onlineUsers.delete(userId);
    }

    this.socketUsers.delete(socketId);

    return {
      userId,
      hasRemainingSockets,
    };
  }

  private getSocketUserId(client: Socket): string | undefined {
    return this.socketUsers.get(client.id);
  }

  private isUserOnline(userId: string): boolean {
    return (this.onlineUsers.get(userId)?.size ?? 0) > 0;
  }

  private emitPresenceUpdate(payload: PresenceUpdate): void {
    this.server.emit('presence:update', payload);
  }

  private emitToUser(userId: string, event: string, payload: unknown): void {
    const socketIds = this.onlineUsers.get(userId);

    if (!socketIds) {
      return;
    }

    for (const socketId of socketIds) {
      this.server.to(socketId).emit(event, payload);
    }
  }

  private async processPendingDeliveries(userId: string): Promise<void> {
    const deliveredDirectMessages =
      (await this.chatService.markMessagesDelivered(userId)) ?? [];

    for (const message of deliveredDirectMessages) {
      if (!message.sid) {
        continue;
      }

      this.emitToUser(message.sid, 'message-delivered-ack', {
        messageId: message.id,
        status: 'delivered',
      });
    }

    const deliveredGroupMessages =
      (await this.groupChatService.MarkPendingMessagesDelivered(userId)) ?? [];

    for (const acknowledgement of deliveredGroupMessages) {
      if (!acknowledgement.senderId) {
        continue;
      }

      this.emitToUser(
        acknowledgement.senderId,
        'group-message-delivered-ack',
        acknowledgement,
      );
    }
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(client);
      const reconnectedDuringGracePeriod = this.cancelPendingDisconnect(userId);
      const firstActiveSocket = this.registerSocket(userId, client.id);

      client.data.userId = userId;

      if (firstActiveSocket && !reconnectedDuringGracePeriod) {
        const presence = await this.chatService.updateUserActivity(userId, true);
        this.emitPresenceUpdate(presence);
      }

      if (firstActiveSocket) {
        await this.processPendingDeliveries(userId);
      }

      console.log(`User ${userId} connected through socket ${client.id}`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Socket authentication failed';

      client.emit('errorMessage', {
        message,
      });

      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    const removed = this.removeSocket(client.id);

    if (!removed || removed.hasRemainingSockets) {
      return;
    }

    const { userId } = removed;

    this.cancelPendingDisconnect(userId);

    const timer = setTimeout(() => {
      void (async () => {
        this.disconnectTimers.delete(userId);

        if (this.isUserOnline(userId)) {
          return;
        }

        try {
          const presence = await this.chatService.updateUserActivity(
            userId,
            false,
          );

          this.emitPresenceUpdate(presence);

          console.log(`User ${userId} is offline`);
        } catch (error: unknown) {
          console.error(
            `Could not mark user ${userId} offline`,
            error instanceof Error ? error.message : error,
          );
        }
      })();
    }, DISCONNECT_GRACE_MS);

    this.disconnectTimers.set(userId, timer);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() payload: { roomId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const socketUserId = this.getSocketUserId(client);

    if (!socketUserId || socketUserId !== payload.userId) {
      client.emit('errorMessage', {
        message: 'Invalid socket user',
      });
      return;
    }

    client.join(this.directRoom(payload.roomId));
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() payload: { roomId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const socketUserId = this.getSocketUserId(client);

    if (!socketUserId || socketUserId !== payload.userId) {
      return;
    }

    client.leave(this.directRoom(payload.roomId));
  }

  @SubscribeMessage('joinGroupRoom')
  async handleJoinGroupRoom(
    @MessageBody() payload: { groupId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      const socketUserId = this.getSocketUserId(client);

      if (!socketUserId || socketUserId !== payload.userId) {
        throw new ForbiddenException('Invalid socket user');
      }

      await this.groupChatService.EnsureMember(payload.groupId, socketUserId);
      client.join(this.groupRoom(payload.groupId));
    } catch (error: unknown) {
      client.emit('errorMessage', {
        message:
          error instanceof Error
            ? error.message
            : 'Unable to join group room',
      });
    }
  }

  @SubscribeMessage('leaveGroupRoom')
  handleLeaveGroupRoom(
    @MessageBody() payload: { groupId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const socketUserId = this.getSocketUserId(client);

    if (!socketUserId || socketUserId !== payload.userId) {
      return;
    }

    client.leave(this.groupRoom(payload.groupId));
  }

  @SubscribeMessage('message-seen')
  async handleMessageSeen(
    @MessageBody() payload: { crid: string; sid: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
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
        if (!message.sid) {
          continue;
        }

        this.emitToUser(message.sid, 'message-seen-ack', {
          messageId: message.id,
        });
      }
    } catch (error: unknown) {
      client.emit('errorMessage', {
        message:
          error instanceof Error
            ? error.message
            : 'Unable to mark messages seen',
      });
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
  ): Promise<void> {
    try {
      const socketUserId = this.getSocketUserId(client);

      if (!socketUserId || socketUserId !== dto.sid) {
        throw new ForbiddenException('Invalid socket user');
      }

      const result = await this.chatService.SendMessage(dto.crid, dto);

      if (!result?.newMessage) {
        throw new InternalServerErrorException('Message could not be created');
      }

      const savedMessage = result.newMessage;

      client.emit('message-sent-ack', {
        tempId: dto.tempId,
        message: savedMessage,
      });

      if (this.isUserOnline(dto.rid)) {
        await this.chatService.updateMessageStatus(savedMessage.id, {
          status: 'delivered',
        });

        const deliveredMessage = {
          ...savedMessage,
          status: 'delivered' as const,
          tempId: dto.tempId,
        };

        this.emitToUser(dto.rid, 'receiveMessage', deliveredMessage);

        client.emit('message-delivered-ack', {
          messageId: savedMessage.id,
          tempId: dto.tempId,
          status: 'delivered',
        });

        this.emitToUser(dto.rid, 'new-message-notification', deliveredMessage);
      }
    } catch (error: unknown) {
      client.emit('errorMessage', {
        message:
          error instanceof Error ? error.message : 'Internal Server Error',
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
  ): Promise<void> {
    try {
      const socketUserId = this.getSocketUserId(client);

      if (!socketUserId || socketUserId !== dto.sid) {
        throw new ForbiddenException('Invalid socket user');
      }

      const result = await this.groupChatService.SendMessage(dto);

      if (!result?.newMessage) {
        throw new InternalServerErrorException(
          'Group message could not be created',
        );
      }

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
    } catch (error: unknown) {
      client.emit('errorMessage', {
        message:
          error instanceof Error ? error.message : 'Internal Server Error',
      });
    }
  }

  @SubscribeMessage('group-message-seen')
  async handleGroupMessagesSeen(
    @MessageBody() payload: { groupId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
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
        if (!acknowledgement.senderId) {
          continue;
        }

        this.emitToUser(
          acknowledgement.senderId,
          'group-message-seen-ack',
          acknowledgement,
        );
      }
    } catch (error: unknown) {
      client.emit('errorMessage', {
        message:
          error instanceof Error
            ? error.message
            : 'Unable to mark group messages seen',
      });
    }
  }
}
