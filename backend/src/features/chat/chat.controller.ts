import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Response } from 'express';
import { JwtGuard } from '../auth/guards/jwt.guard';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('room/:crid')
  @UseGuards(JwtGuard)
  async GetChatroomMessages(
    @Param('crid') crid: string,
    @Query('limit') limit: number,
    @Query('page') page: number,
    @Res() res: Response,
  ) {
    const response = await this.chatService.GetChatroomMessages(
      crid,
      limit,
      page,
    );

    return res.status(response.code).json(response.data);
  }
}
