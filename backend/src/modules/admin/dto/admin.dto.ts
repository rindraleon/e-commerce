import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaymentStatus } from '../../../entities/payment.entity';

export class LogAdminActionDto {
  @IsString()
  action: string;

  @IsOptional()
  details?: Record<string, unknown> | string;
}

export class AdminLogQueryDto extends PaginationQueryDto {}

export class AdminPaymentQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsString()
  payment_method?: string;
}

export class AdminAnalyticsQueryDto {
  @IsOptional()
  @IsInt()
  @Min(7)
  @Max(365)
  days?: number = 30;
}

export class DemoSeedDto {
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  reset?: boolean;
}

export class UpdatePaymentStatusDto {
  @IsEnum(PaymentStatus)
  status: PaymentStatus;
}
