import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Profile } from 'passport-google-oauth20';
import { randomBytes } from 'node:crypto';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { LoginUserDto } from './dtos/loginUser.dto';
import { RegisterUserDto } from './dtos/registerUser.dto';
import { ResetPasswordDto } from './dtos/resetPassword.dto';
import { User } from '../../database/entities/user.entity';
import { EmailService } from '../../utils/email/email.service';
import { resetPasswordEmailTemplate } from '../../utils/email/templates/reset-password.template';
import { handleError } from '../../utils/handleError.util';

const ACCOUNT_LOCK_DURATION_MS = 2 * 60 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  private formatRemainingTime(milliseconds: number): string {
    const totalMinutes = Math.max(1, Math.ceil(milliseconds / (1000 * 60)));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours} hour${hours === 1 ? '' : 's'}${
        minutes > 0 ? ` ${minutes} min` : ''
      }`;
    }

    return `${minutes} min`;
  }

  private async ensureAccountIsUnlocked(user: User): Promise<void> {
    if (!user.isAccountLocked || !user.accountLockedAtDate) {
      return;
    }

    const unlockAt =
      new Date(user.accountLockedAtDate).getTime() + ACCOUNT_LOCK_DURATION_MS;
    const remainingTime = unlockAt - Date.now();

    if (remainingTime > 0) {
      throw new BadRequestException(
        `Account locked after too many unsuccessful login attempts. Please try again in ${this.formatRemainingTime(
          remainingTime,
        )}.`,
      );
    }

    user.isAccountLocked = false;
    user.failLoginAttempts = 0;
    user.accountLockedAtDate = null;

    await this.userRepo.save(user);
  }

  private normalizeUsername(value: string): string {
    const normalized = value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '.')
      .replace(/[^a-z0-9._]/g, '')
      .replace(/^[._]+|[._]+$/g, '')
      .slice(0, 30);

    return normalized || 'eliteuser';
  }

  private async createUniqueGoogleUsername(profile: Profile): Promise<string> {
    const emailLocalPart = profile.emails?.[0]?.value?.split('@')[0] ?? '';
    const preferredName =
      profile.displayName ||
      `${profile.name?.givenName ?? ''} ${profile.name?.familyName ?? ''}`.trim() ||
      emailLocalPart;

    const baseUsername = this.normalizeUsername(preferredName);

    if (!(await this.userRepo.exist({ where: { username: baseUsername } }))) {
      return baseUsername;
    }

    const googleSuffix = profile.id.replace(/[^a-zA-Z0-9]/g, '').slice(-6);
    const firstCandidate = `${baseUsername.slice(0, 23)}_${
      googleSuffix || randomBytes(3).toString('hex')
    }`.toLowerCase();

    if (!(await this.userRepo.exist({ where: { username: firstCandidate } }))) {
      return firstCandidate;
    }

    let attempt = 1;

    while (attempt <= 100) {
      const candidate = `${baseUsername.slice(0, 24)}_${attempt}`;

      if (!(await this.userRepo.exist({ where: { username: candidate } }))) {
        return candidate;
      }

      attempt += 1;
    }

    return `eliteuser_${randomBytes(6).toString('hex')}`;
  }

  async validate(loginUserDto: LoginUserDto) {
    try {
      const user = await this.userRepo.findOne({
        where: { email: loginUserDto.email },
      });

      if (!user || user.accountRegisterType === 'google') {
        throw new BadRequestException('Invalid email or password');
      }

      await this.ensureAccountIsUnlocked(user);

      const passwordMatches = await bcrypt.compare(
        loginUserDto.password,
        user.password,
      );

      if (!passwordMatches) {
        user.failLoginAttempts = (user.failLoginAttempts ?? 0) + 1;

        if (user.failLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
          user.isAccountLocked = true;
          user.accountLockedAtDate = new Date();
        }

        await this.userRepo.save(user);

        if (user.isAccountLocked) {
          throw new BadRequestException(
            `Account locked after ${MAX_LOGIN_ATTEMPTS} unsuccessful login attempts. Please try again in 2 hours.`,
          );
        }

        throw new BadRequestException('Invalid email or password');
      }

      user.failLoginAttempts = 0;
      user.isAccountLocked = false;
      user.accountLockedAtDate = null;
      user.lastLoggedAt = new Date();

      await this.userRepo.save(user);

      return this.jwtService.sign({ id: user.id });
    } catch (error: any) {
      handleError(error);
    }
  }

  async register(registerDto: RegisterUserDto) {
    try {
      const userWithSameEmail = await this.userRepo.findOne({
        where: { email: registerDto.email },
      });

      if (userWithSameEmail) {
        throw new BadRequestException('Email already in use');
      }

      const userWithSameUsername = await this.userRepo.findOne({
        where: { username: registerDto.username },
      });

      if (userWithSameUsername) {
        throw new BadRequestException('Username already in use');
      }

      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      const newUser = this.userRepo.create({
        ...registerDto,
        password: hashedPassword,
        accountRegisterType: 'local',
        bio: `@${registerDto.username}`,
      });

      await this.userRepo.save(newUser);

      return {
        message: 'User registered successfully',
        code: 201,
      };
    } catch (error: any) {
      handleError(error);
    }
  }

  async googleValidate(profile: Profile): Promise<string | undefined> {
    try {
      const emailDetails = profile.emails?.[0];
      const email = emailDetails?.value?.trim().toLowerCase();

      if (!email || !profile.name) {
        throw new BadRequestException(
          'Google did not return the required account information',
        );
      }

      if (emailDetails?.verified === false) {
        throw new UnauthorizedException('Google email is not verified');
      }

      const googleProfilePicture = profile.photos?.[0]?.value;
      const existingUser = await this.userRepo.findOne({
        where: { email },
      });

      if (existingUser) {
        existingUser.lastLoggedAt = new Date();
        existingUser.emailVerified = true;

        if (!existingUser.userPfpUrl && googleProfilePicture) {
          existingUser.userPfpUrl = googleProfilePicture;
        }

        await this.userRepo.save(existingUser);

        return this.jwtService.sign({ id: existingUser.id });
      }

      const username = await this.createUniqueGoogleUsername(profile);
      const randomPasswordHash = await bcrypt.hash(
        randomBytes(48).toString('hex'),
        10,
      );

      const firstname =
        profile.name.givenName?.trim() ||
        profile.displayName?.trim() ||
        'Elite';
      const lastname = profile.name.familyName?.trim() || 'User';

      const newUser = this.userRepo.create({
        email,
        username,
        firstname,
        lastname,
        password: randomPasswordHash,
        bio: `@${username}`,
        emailVerified: true,
        lastLoggedAt: new Date(),
        accountRegisterType: 'google',
        isActive: false,
        ...(googleProfilePicture ? { userPfpUrl: googleProfilePicture } : {}),
      });

      const savedUser = await this.userRepo.save(newUser);

      return this.jwtService.sign({ id: savedUser.id });
    } catch (error: any) {
      handleError(error);
    }
  }

  async requestResetPassword(email: string) {
    try {
      const user = await this.userRepo.findOne({
        where: { email },
      });

      if (user) {
        const token = this.jwtService.sign(
          {
            email: user.email,
            prv: user.resetPasswordNb,
          },
          {
            expiresIn: '15m',
          },
        );

        const frontBaseUrl =
          process.env.FRONT_BASE_URL ?? 'http://localhost:8000';

        await this.emailService.sendEmail(
          user.email,
          'Reset Your Password',
          resetPasswordEmailTemplate(
            `${frontBaseUrl}/auth/reset-password/${token}`,
          ),
        );
      }

      return {
        message:
          'If the email is associated with an account, please check your inbox',
        code: 200,
      };
    } catch (error: any) {
      handleError(error);
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    try {
      const decodedToken = this.jwtService.decode(resetPasswordDto.token) as {
        exp?: number;
      };
      const currentTimestamp = Math.floor(Date.now() / 1000);

      if (decodedToken?.exp && decodedToken.exp < currentTimestamp) {
        throw new UnauthorizedException(
          'Token has expired. Please request a new one.',
        );
      }

      const { email, prv } = this.jwtService.verify(resetPasswordDto.token);

      if (resetPasswordDto.newPassword.length < 8) {
        throw new BadRequestException(
          'Password should be at least 8 characters long',
        );
      }

      if (
        resetPasswordDto.newPassword !== resetPasswordDto.confirmNewPassword
      ) {
        throw new BadRequestException('Passwords do not match');
      }

      const user = await this.userRepo.findOne({ where: { email } });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (prv !== user.resetPasswordNb) {
        throw new UnauthorizedException(
          'Invalid or expired password reset link.',
        );
      }

      user.password = await bcrypt.hash(resetPasswordDto.newPassword, 10);
      user.resetPasswordNb += 1;
      user.failLoginAttempts = 0;
      user.isAccountLocked = false;
      user.accountLockedAtDate = null;

      await this.userRepo.save(user);

      return {
        message: 'Password reset successfully',
        code: 200,
      };
    } catch (error: any) {
      handleError(error);
    }
  }
}
