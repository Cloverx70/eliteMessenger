import { BadRequestException, Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT'),
      secure: false,
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
    });
  }
  async sendEmail(to: string, subject: string, htmlContent: string) {
    const mailOptions = {
      from: this.configService.get<string>('EMAIL_USER'),
      to,
      subject,
      html: htmlContent,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        message: `Email sent successfully to ${to}`,
        info,
      };
    } catch (error) {
      if (error.code === 'EAUTH') {
        throw new BadRequestException(
          'Authentication failed. Please check your email credentials.',
        );
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNECTION') {
        throw new BadRequestException(
          'Email server connection failed. Please try again later.',
        );
      } else if (error.response && error.response.includes('550')) {
        throw new BadRequestException(
          'Invalid recipient address. Please check the email address.',
        );
      } else {
        throw new BadRequestException(`Failed to send email: ${error.message}`);
      }
    }
  }
}
