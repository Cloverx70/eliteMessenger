import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { PostReportReason } from '../../../database/entities/postReport.entity';

export class ReportPostDto {
  @IsEnum(PostReportReason)
  reason: PostReportReason;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  details?: string | null;
}
