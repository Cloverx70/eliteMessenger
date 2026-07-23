import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { JwtGuard } from '../auth/guards/jwt.guard';
import { AddGroupMembersDto } from './dtos/add-group-members.dto';
import { CreateGroupDto } from './dtos/create-group.dto';
import { UpdateGroupMemberRoleDto } from './dtos/update-group-member-role.dto';
import { UpdateGroupMessageDto } from './dtos/update-group-message.dto';
import { UpdateGroupDto } from './dtos/update-group.dto';
import { GroupChatService } from './group-chat.service';

@Controller('groups')
@UseGuards(JwtGuard)
export class GroupChatController {
  constructor(private readonly groupChatService: GroupChatService) {}

  @Post()
  async CreateGroup(
    @Req() req: Request,
    @Body() dto: CreateGroupDto,
    @Res() res: Response,
  ) {
    const response = await this.groupChatService.CreateGroup(req.user.id, dto);
    return res.status(response.code).json(response);
  }

  @Get()
  async GetUserGroups(
    @Req() req: Request,
    @Query('query') query = '',
    @Query('filter') filter: 'all' | 'unread' = 'all',
    @Res() res: Response,
  ) {
    const response = await this.groupChatService.GetUserGroups(
      req.user.id,
      query,
      filter,
    );
    return res.status(response.code).json(response);
  }

  @Get('available-users')
  async GetAvailableUsers(
    @Req() req: Request,
    @Query('query') query: string = '',
    @Res() res: Response,
  ) {
    const response = await this.groupChatService.GetAvailableUsers(
      req.user.id,
      query,
    );

    return res.status(response.code).json(response);
  }

  @Get(':gid/messages')
  async GetGroupMessages(
    @Req() req: Request,
    @Param('gid') groupId: string,
    @Query('limit') limit: number = 50,
    @Query('page') page: number = 1,
    @Res() res: Response,
  ) {
    const response = await this.groupChatService.GetGroupMessages(
      req.user.id,
      groupId,
      limit,
      page,
    );
    return res.status(response.code).json(response);
  }

  @Get(':gid/info')
  async GetGroupInfo(
    @Req() req: Request,
    @Param('gid') groupId: string,
    @Res() res: Response,
  ) {
    const response = await this.groupChatService.GetGroupInfo(
      req.user.id,
      groupId,
    );
    return res.status(response.code).json(response);
  }

  @Put(':gid')
  async UpdateGroup(
    @Req() req: Request,
    @Param('gid') groupId: string,
    @Body() dto: UpdateGroupDto,
    @Res() res: Response,
  ) {
    const response = await this.groupChatService.UpdateGroup(
      req.user.id,
      groupId,
      dto,
    );
    return res.status(response.code).json(response);
  }

  @Delete(':gid')
  async DeleteGroup(
    @Req() req: Request,
    @Param('gid') groupId: string,
    @Res() res: Response,
  ) {
    const response = await this.groupChatService.DeleteGroup(
      req.user.id,
      groupId,
    );
    return res.status(response.code).json(response);
  }

  @Post(':gid/members')
  async AddMembers(
    @Req() req: Request,
    @Param('gid') groupId: string,
    @Body() dto: AddGroupMembersDto,
    @Res() res: Response,
  ) {
    const response = await this.groupChatService.AddMembers(
      req.user.id,
      groupId,
      dto,
    );
    return res.status(response.code).json(response);
  }

  @Delete(':gid/members/:memberUserId')
  async RemoveMember(
    @Req() req: Request,
    @Param('gid') groupId: string,
    @Param('memberUserId') memberUserId: string,
    @Res() res: Response,
  ) {
    const response = await this.groupChatService.RemoveMember(
      req.user.id,
      groupId,
      memberUserId,
    );
    return res.status(response.code).json(response);
  }

  @Put(':gid/members/:memberUserId/role')
  async UpdateMemberRole(
    @Req() req: Request,
    @Param('gid') groupId: string,
    @Param('memberUserId') memberUserId: string,
    @Body() dto: UpdateGroupMemberRoleDto,
    @Res() res: Response,
  ) {
    const response = await this.groupChatService.UpdateMemberRole(
      req.user.id,
      groupId,
      memberUserId,
      dto,
    );
    return res.status(response.code).json(response);
  }

  @Post(':gid/leave')
  async LeaveGroup(
    @Req() req: Request,
    @Param('gid') groupId: string,
    @Res() res: Response,
  ) {
    const response = await this.groupChatService.LeaveGroup(
      req.user.id,
      groupId,
    );
    return res.status(response.code).json(response);
  }

  @Put('messages/:messageId')
  async UpdateMessage(
    @Req() req: Request,
    @Param('messageId') messageId: string,
    @Body() dto: UpdateGroupMessageDto,
    @Res() res: Response,
  ) {
    const response = await this.groupChatService.UpdateMessage(
      req.user.id,
      messageId,
      dto,
    );
    return res.status(response.code).json(response);
  }

  @Delete('messages/:messageId')
  async DeleteMessage(
    @Req() req: Request,
    @Param('messageId') messageId: string,
    @Res() res: Response,
  ) {
    const response = await this.groupChatService.DeleteMessage(
      req.user.id,
      messageId,
    );
    return res.status(response.code).json(response);
  }
}
