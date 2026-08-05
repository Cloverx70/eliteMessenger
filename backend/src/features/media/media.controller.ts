import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { MediaService, MediaSources } from './media.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { Request, Response } from 'express';
import { MediaOptionsDto } from './dtos/MediaOptions.dto';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get('all-media')
  @UseGuards(JwtGuard)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async GetAllMedia(
    @Req() req: Request,
    @Res() res: Response,
    @Query('source') mediaSource: MediaSources,
    @Body() options: MediaOptionsDto,
  ) {
    const uid = req.user.id;
    if (!uid) throw new BadRequestException('invalid token');

    const result = await this.mediaService.GetAllMedia(
      uid,
      mediaSource,
      options,
    );
    return res.status(result.code).json(result);
  }

  @Get('get/:aid')
  @UseGuards(JwtGuard)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async GetAttachmentById(
    @Req() req: Request,
    @Res() res: Response,
    @Param('aid') aid: string,
    @Query('source') mediaSource: MediaSources,
  ) {
    const uid = req.user.id;
    if (!uid) throw new BadRequestException('invalid token');

    const result = await this.mediaService.GetAttachmentById(
      uid,
      aid,
      mediaSource,
    );

    console.log(result);
    return res.status(result.code).json(result);
  }
}
