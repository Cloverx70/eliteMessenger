import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Res,
  UseGuards,
  Req,
  BadRequestException,
  Put,
  Body,
  UsePipes,
  ValidationPipe,
  Query,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import { Request, Response } from 'express';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { manageFriendRequestDto } from './dtos/manageFriendRequest.dto';

@Controller('friends')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }),
)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Post('request/:rid')
  @UseGuards(JwtGuard)
  async sendFriendRequest(
    @Req() req: Request,
    @Param('rid') receiverId: string,
    @Res() res: Response,
  ) {
    const sid = req.user.id;
    if (!sid) throw new BadRequestException('invalid token');

    const result = await this.friendsService.sendFriendRequest(sid, receiverId);
    return res.status(result.code).json(result);
  }

  // Unfriend a user
  @Delete('unfriend/:rid')
  @UseGuards(JwtGuard)
  async unfriend(
    @Req() req: Request,
    @Param('rid') receiverId: string,
    @Res() res: Response,
  ) {
    const sid = req.user.id;

    if (!sid) throw new BadRequestException('invalid token');

    const result = await this.friendsService.unfriend(sid, receiverId);
    return res.status(result.code).json(result);
  }

  // Cancel ongoing request
  @Delete('cancel-ongoing/:rid')
  @UseGuards(JwtGuard)
  async cancelOngoing(
    @Req() req: Request,
    @Param('rid') receiverId: string,
    @Res() res: Response,
  ) {
    const sid = req.user.id;

    if (!sid) throw new BadRequestException('invalid token');

    const result = await this.friendsService.cancelOngoing(sid, receiverId);
    return res.status(result.code).json(result);
  }

  @Put('manage-req')
  @UseGuards(JwtGuard)
  async manageRequest(
    @Req() req: Request,
    @Body() manageRequestDto: manageFriendRequestDto,
    @Res() res: Response,
  ) {
    const sid = req.user.id;

    if (!sid) throw new BadRequestException('invalid token');
    const result = await this.friendsService.manageFriendRequest(
      sid,
      manageRequestDto,
    );
    return res.status(result.code).json(result);
  }

  @Get('search')
  @UseGuards(JwtGuard)
  async searchUsers(
    @Req() req: Request,
    @Query('query')
    query: string,
    @Query('limit')
    limit: number = 20,
    @Query('page')
    page: number = 1,
    @Res() res: Response,
  ) {
    const uid = req.user.id;
    if (!uid) throw new BadRequestException('invalid token');

    const result = await this.friendsService.searchUsers(
      uid,
      query,
      limit,
      page,
    );
    return res.status(result.code).json(result);
  }

  // Get all friends of a user
  @Get('list')
  @UseGuards(JwtGuard)
  async getAllFriends(@Req() req: Request, @Res() res: Response) {
    const uid = req.user.id;
    if (!uid) throw new BadRequestException('invalid token');

    const result = await this.friendsService.getAllFriends(uid);
    return res.status(result.code).json(result);
  }

  // Get received friend requests
  @Get('people-you-may-know')
  @UseGuards(JwtGuard)
  async getPeopleYouMayKnow(@Req() req: Request, @Res() res: Response) {
    const uid = req.user.id;
    if (!uid) throw new BadRequestException('invalid token');

    const result = await this.friendsService.getPeopleYouMayKnow(uid);
    return res.status(result.code).json(result);
  }

  // Get sent friend requests
  @Get('sent-requests')
  @UseGuards(JwtGuard)
  async getSentRequests(@Req() req: Request, @Res() res: Response) {
    const uid = req.user.id;
    if (!uid) throw new BadRequestException('invalid token');

    const result = await this.friendsService.getSentRequests(uid);
    return res.status(result.code).json(result);
  }

  // Get received friend requests
  @Get('received-requests')
  @UseGuards(JwtGuard)
  async getReceivedRequests(@Req() req: Request, @Res() res: Response) {
    const uid = req.user.id;
    if (!uid) throw new BadRequestException('invalid token');

    const result = await this.friendsService.getReceivedRequests(uid);
    return res.status(result.code).json(result);
  }
}
