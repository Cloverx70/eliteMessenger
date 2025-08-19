import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user.entity';
import { handleError } from 'src/utils/handleError.util';
import { LoginUserDto } from './dtos/loginUser.dto';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { RegisterUserDto } from './dtos/registerUser.dto';
import { Profile } from 'passport-google-oauth20';
import { EmailService } from 'src/utils/email/email.service';
import { resetPasswordEmailTemplate } from 'src/utils/email/templates/reset-password.template';
import { ResetPasswordDto } from './dtos/resetPassword.dto';
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async validate(loginUserDto: LoginUserDto) {
    try {
      const userExists = await this.userRepo.findOne({
        where: { email: loginUserDto.email },
      });

      if (!userExists) {
        throw new BadRequestException('invalid email or password');
      }

      if (userExists.accountRegisterType === 'google') {
        userExists.failLoginAttempts += 1;
        await this.userRepo.save(userExists);
        throw new BadRequestException('invalid email or password');
      }

      if (!bcrypt.compare(loginUserDto.password, userExists.password)) {
        userExists.failLoginAttempts += 1;
        await this.userRepo.save(userExists);
        throw new BadRequestException('invalid email or password');
      }

      if (userExists.failLoginAttempts >= 5 && !userExists.isAccountLocked) {
        const now = new Date();
        const after2hrs = now.getTime() + 2 * 60 * 60 * 1000;

        const hours = Math.floor(after2hrs / (1000 * 60 * 60));
        const minutes = Math.floor(
          (after2hrs % (1000 * 60 * 60)) / (1000 * 60),
        );

        const timeLeftString = hours
          ? `${hours} hour${hours > 1 ? 's' : ''} ${minutes ? minutes + ' min' : ''}`
          : `${minutes} min`;

        userExists.isAccountLocked = true;
        userExists.accountLockedAtDate = new Date();

        await this.userRepo.save(userExists);

        throw new BadRequestException(
          `5 failed login attempts, your account is locked. Please try again in: ${timeLeftString}`,
        );
      }

      if (userExists.failLoginAttempts >= 5 && userExists.isAccountLocked) {
        const now = new Date();
        const lockedAt = userExists.accountLockedAtDate;

        const timeLeft = now.getTime() - lockedAt.getTime();

        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

        const timeLeftString = hours
          ? `${hours} hour${hours > 1 ? 's' : ''} ${minutes ? minutes + ' min' : ''}`
          : `${minutes} min`;

        if (timeLeft > 0)
          throw new BadRequestException(
            `account locked for ${userExists.failLoginAttempts} unsuccessful login attempts, please try again in ${timeLeftString}`,
          );

        userExists.isAccountLocked = false;
        userExists.failLoginAttempts = 0;
        userExists.accountLockedAtDate = null;
      }

      userExists.lastLoggedAt = new Date();

      await this.userRepo.save(userExists);
      const payload = this.jwtService.sign({ id: userExists.id });

      return payload;
    } catch (error) {
      handleError(error);
    }
  }

  async register(registerDto: RegisterUserDto) {
    try {
      const UserWithSameEmail = await this.userRepo.findOne({
        where: { email: registerDto.email },
      });

      if (UserWithSameEmail)
        throw new BadRequestException('email already in use');

      const UserWithSameUsername = await this.userRepo.findOne({
        where: { username: registerDto.username },
      });

      if (UserWithSameUsername)
        throw new BadRequestException('username already in use');

      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      const newUser = this.userRepo.create({
        ...registerDto,
        password: hashedPassword,
        userPfpUrl:
          'https://elitemessenger.s3.eu-north-1.amazonaws.com/userpfps/defaultprofilepicture',
      });

      await this.userRepo.save(newUser);

      return { message: 'user registered successfully', code: 201 };
    } catch (error) {
      handleError(error);
    }
  }

  // Google validation :

  async googleValidate(googleValidateDto: Profile) {
    try {
      if (
        !googleValidateDto ||
        !googleValidateDto.emails ||
        !googleValidateDto.name
      )
        throw new BadRequestException(
          'request body and required fields are required',
        );

      const { emails, name, profileUrl, displayName } = googleValidateDto;
      const email = emails[0]?.value;

      const userExists = await this.userRepo.findOne({
        where: { email: email },
      });

      let payload = {};
      let token = '';

      if (!userExists) {
        const newUser = this.userRepo.create({
          email,
          username: displayName,
          firstname: name.givenName,
          lastname: name.familyName,
          userPfpUrl: profileUrl,
          emailVerified: emails[0]?.verified,
          lastLoggedAt: new Date(),
          accountRegisterType: 'google',
          isActive: true,
        });

        payload = { id: newUser.id };
      } else if (userExists.accountRegisterType === 'google') {
        userExists.isActive = true;
        userExists.lastLoggedAt = new Date();

        await this.userRepo.save(userExists);
        payload = { id: userExists.id };
      } else {
        throw new BadRequestException('Email is already in use');
      }

      token = this.jwtService.sign(payload);
      return token;
    } catch (error) {
      handleError(error);
    }
  }

  async requestResetPassword(email: string) {
    try {
      const user = await this.userRepo.findOne({
        where: {
          email: email,
        },
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

        await this.emailService.sendEmail(
          user.email,
          'Reset Your Password',
          resetPasswordEmailTemplate(
            `http://localhost:8000/auth/reset-password/${token}`,
          ),
        );
      }

      return {
        message:
          'if the email you provided is associated with an account please check your inbox',
        code: 200,
      };
    } catch (error) {
      handleError(error);
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    try {
      const decodedToken = this.jwtService.decode(resetPasswordDto.token) as {
        exp?: number;
        sub?: string;
      };
      const currentTimestamp = Math.floor(Date.now() / 1000);

      if (decodedToken?.exp && decodedToken.exp < currentTimestamp) {
        throw new UnauthorizedException(
          'Token has expired. Please request a new one.',
        );
      }

      const { email, prv } = this.jwtService.verify(resetPasswordDto.token);

      if (resetPasswordDto.newPassword.length < 8)
        throw new BadRequestException(
          'password should be at least 8 characters long',
        );

      if (resetPasswordDto.newPassword !== resetPasswordDto.confirmNewPassword)
        throw new BadRequestException('passwords does not match');

      const user = await this.userRepo.findOne({ where: { email: email } });

      if (!user) throw new NotFoundException('user not found');

      if (prv !== user.resetPasswordNb)
        throw new UnauthorizedException(
          'Invalid or expired password reset link.',
        );

      user.password = await bcrypt.hash(resetPasswordDto.newPassword, 10);
      user.resetPasswordNb++;

      return {
        message: 'user reset password successfully..',
        code: 200,
      };
    } catch (error) {
      handleError(error);
    }
  }
}
