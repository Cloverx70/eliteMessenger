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
import { AuthService } from './auth.service';
import { LoginUserDto } from './dtos/loginUser.dto';
import * as cookie from 'cookie';
import { Response, Request } from 'express';
import { RegisterUserDto } from './dtos/registerUser.dto';
import { GoogleGuard } from './guards/google.guard';
import { LocalGuard } from './guards/local.guard';
import { JwtGuard } from './guards/jwt.guard';
import { ResetPasswordDto } from './dtos/resetPassword.dto';

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

    const rawTokenCookie = cookie.serialize('ELITE_ERA_AUTH_TOKEN', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    res.setHeader('Set-Cookie', rawTokenCookie);

    return res.status(200).json({ message: 'logged in successfully' });
  }

  @Post('register')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  )
  async register(
    @Body() registerUserDto: RegisterUserDto,
    @Res() res: Response,
  ) {
    const registerResponse = await this.authService.register(registerUserDto);

    if (registerResponse.code !== 201)
      throw new BadRequestException(
        'error registering user, please try again later',
      );

    return res.status(201).json({ message: registerResponse.message });
  }

  @Post('google-login')
  async google() {}

  @Get('google/redirect')
  @UseGuards(GoogleGuard)
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const token = req.token;

    if (!token || token.length === 0)
      throw new UnauthorizedException('error validating');

    const rawTokenCookie = cookie.serialize('Token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    res.setHeader('Set-Cookie', rawTokenCookie);

    const FrontBaseURL = process.env.FRONT_BASE_URL;

    const redirectURL = `${FrontBaseURL}/`;

    if (!token) throw new BadRequestException('error creating token');

    return res.redirect(302, redirectURL);
  }

  @Put('req-reset-password')
  async requestResetPassword(
    @Res() res: Response,
    @Query('email') email: string,
  ) {
    const response = await this.authService.requestResetPassword(email);

    return res.status(200).json({ message: response.message });
  }

  @Put('verify-reset-password')
  async ResetPassword(
    @Res() res: Response,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    const response = await this.authService.resetPassword(resetPasswordDto);

    return res.status(200).json({ message: response.message });
  }
}
