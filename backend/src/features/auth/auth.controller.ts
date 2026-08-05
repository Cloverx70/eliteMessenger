import {
  BadRequestException,
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
  Body,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import * as cookie from 'cookie';

import { RegisterUserDto } from './dtos/registerUser.dto';
import { ResetPasswordDto } from './dtos/resetPassword.dto';
import { GoogleGuard } from './guards/google.guard';
import { JwtGuard } from './guards/jwt.guard';
import { LocalGuard } from './guards/local.guard';
import { AuthService } from './auth.service';

const AUTH_COOKIE_NAME = 'ELITE_ERA_AUTH_TOKEN';
const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type LocalAuthRequest = Request & {
  user?: string;
};

type GoogleAuthRequest = Request & {
  user?: {
    token?: string;
  };
};

function getAuthCookieOptions(): cookie.SerializeOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  const configuredDomain = process.env.AUTH_COOKIE_DOMAIN?.trim();

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
    path: '/',
    ...(configuredDomain ? { domain: configuredDomain } : {}),
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
  status(@Req() req: Request) {
    return req.user;
  }

  @Post('login')
  @UseGuards(LocalGuard)
  login(@Req() req: LocalAuthRequest, @Res() res: Response) {
    const token = req.user;

    if (!token || typeof token !== 'string') {
      throw new UnauthorizedException('Unable to create authentication token');
    }

    res.setHeader(
      'Set-Cookie',
      cookie.serialize(AUTH_COOKIE_NAME, token, getAuthCookieOptions()),
    );

    return res.status(200).json({
      message: 'Logged in successfully',
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
        'Error registering user. Please try again later.',
      );
    }

    return res.status(201).json({
      message: registerResponse.message,
    });
  }

  @Get('google')
  @UseGuards(GoogleGuard)
  googleAuth() {
    return;
  }

  @Get('google/redirect')
  @UseGuards(GoogleGuard)
  googleAuthRedirect(@Req() req: GoogleAuthRequest, @Res() res: Response) {
    const token = req.user?.token;

    if (!token) {
      throw new UnauthorizedException('Unable to validate Google account');
    }

    res.setHeader(
      'Set-Cookie',
      cookie.serialize(AUTH_COOKIE_NAME, token, getAuthCookieOptions()),
    );

    const frontBaseUrl = process.env.FRONT_BASE_URL?.replace(/\/+$/, '');

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
