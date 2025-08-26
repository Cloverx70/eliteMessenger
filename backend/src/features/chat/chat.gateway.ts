import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import MessageDto from './dtos/message.dto';

@WebSocketGateway(3001, {
  cors: {
    origin: '*', // or your frontend origin
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly chatService: ChatService) {}

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    // optional: auth check, join rooms, etc.
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // cleanup if necessary
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @MessageBody() dto: MessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const crid = client.handshake.query.crid as string;

      const msg = await this.chatService.SendMessage(crid, dto);
      this.server.to(crid).emit('receiveMessage', msg);
    } catch (err) {
      client.emit('errorMessage', {
        message: err.message || 'Internal Server Error',
      });
    }
  }
}
