import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { Response, Request } from 'express';
import { JwtGuard } from '../auth/guards/jwt.guard';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('room/:crid')
  @UseGuards(JwtGuard)
  async GetChatroomMessages(
    @Req() req: Request,
    @Param('crid') crid: string,
    @Query('limit') limit: number,
    @Query('page') page: number,
    @Res() res: Response,
  ) {
    const uid = req.user.id;

    const response = await this.chatService.GetChatroomMessages(
      uid,
      crid,
      limit,
      page,
    );

    return res.status(response.code).json(response);
  }

  @Get('rooms')
  @UseGuards(JwtGuard)
  async GetUserChatrooms(@Req() req: Request, @Res() res: Response) {
    const uid = req.user.id;
    const response = await this.chatService.GetUserChatrooms(uid);

    return res.status(response.code).json(response);
  }
}
