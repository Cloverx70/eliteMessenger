import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { Response, Request } from 'express';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { updateMessageDto } from './dtos/updateMessage.dto';

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

  @Get('room/info/:crid')
  @UseGuards(JwtGuard)
  async GetChatroominfo(
    @Req() req: Request,
    @Param('crid') crid: string,

    @Res() res: Response,
  ) {
    const uid = req.user.id;
    const response = await this.chatService.GetChatroomInfo(uid, crid);

    return res.status(response.code).json(response);
  }

  @Put('message/:mid')
  @UseGuards(JwtGuard)
  async UpdateMessage(
    @Req() req: Request,
    @Param('mid') mid: string,
    @Body() updateMessageDto: updateMessageDto,
    @Res() res: Response,
  ) {
    const response = await this.chatService.updateMessage(
      mid,
      updateMessageDto,
    );

    return res.status(response.code).json(response);
  }

  @Get('rooms')
  @UseGuards(JwtGuard)
  async GetUserChatrooms(
    @Req() req: Request,
    @Query('query') query: string = '',
    @Query('filter') filter: 'all' | 'unread' = 'all',
    @Res() res: Response,
  ) {
    const uid = req.user.id;

    const response = await this.chatService.GetUserChatrooms(
      uid,
      query,
      filter,
    );

    return res.status(response.code).json(response);
  }
}
