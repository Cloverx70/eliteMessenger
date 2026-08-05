import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Put,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import * as cookie from 'cookie';

import { AuthService } from './auth.service';
import { LoginUserDto } from './dtos/loginUser.dto';
import { RegisterUserDto } from './dtos/registerUser.dto';
import { ResetPasswordDto } from './dtos/resetPassword.dto';
import { GoogleGuard } from './guards/google.guard';
import { JwtGuard } from './guards/jwt.guard';
import { LocalGuard } from './guards/local.guard';

const AUTH_COOKIE_NAME = 'ELITE_ERA_AUTH_TOKEN';
const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getAuthCookieOptions(): cookie.SerializeOptions {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
    path: '/',
  };
}

@Controller('auth')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }),
)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('status')
  @UseGuards(JwtGuard)
  async status(@Req() req: Request) {
    return req.user;
  }

  @Post('login')
  @UseGuards(LocalGuard)
  async login(@Body() loginUserDto: LoginUserDto, @Res() res: Response) {
    const token = await this.authService.validate(loginUserDto);

    if (!token) {
      throw new UnauthorizedException('Unable to create authentication token');
    }

    res.setHeader(
      'Set-Cookie',
      cookie.serialize(AUTH_COOKIE_NAME, token, getAuthCookieOptions()),
    );

    return res.status(200).json({
      message: 'logged in successfully',
    });
  }

  @Post('register')
  async register(
    @Body() registerUserDto: RegisterUserDto,
    @Res() res: Response,
  ) {
    const registerResponse = await this.authService.register(registerUserDto);

    if (!registerResponse || registerResponse.code !== 201) {
      throw new BadRequestException(
        'error registering user, please try again later',
      );
    }

    return res.status(201).json({
      message: registerResponse.message,
    });
  }

  @Post('google-login')
  async google() {}

  @Get('google/redirect')
  @UseGuards(GoogleGuard)
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const token = req.token;

    if (!token) {
      throw new UnauthorizedException('error validating');
    }

    res.setHeader(
      'Set-Cookie',
      cookie.serialize(AUTH_COOKIE_NAME, token, getAuthCookieOptions()),
    );

    const frontBaseUrl = process.env.FRONT_BASE_URL;

    if (!frontBaseUrl) {
      throw new BadRequestException('FRONT_BASE_URL is not configured');
    }

    return res.redirect(302, `${frontBaseUrl}/`);
  }

  @Put('req-reset-password')
  async requestResetPassword(
    @Res() res: Response,
    @Query('email') email: string,
  ) {
    const response = await this.authService.requestResetPassword(email);

    return res.status(200).json({
      message: response?.message,
    });
  }

  @Put('verify-reset-password')
  async resetPassword(
    @Res() res: Response,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    const response = await this.authService.resetPassword(resetPasswordDto);

    return res.status(200).json({
      message: response?.message,
    });
  }

  @Post('logout')
  logout(@Res() res: Response) {
    res.setHeader(
      'Set-Cookie',
      cookie.serialize(AUTH_COOKIE_NAME, '', {
        ...getAuthCookieOptions(),
        maxAge: 0,
        expires: new Date(0),
      }),
    );

    return res.status(200).json({
      message: 'Logged out successfully',
      code: 200,
    });
  }
}
