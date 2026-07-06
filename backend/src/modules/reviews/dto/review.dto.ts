import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ModerationStatus } from '../../../entities/review.entity';

export class ReviewQueryDto extends PaginationQueryDto {
  @IsUUID()
  @IsOptional()
  product_id?: string;

  @IsUUID()
  @IsOptional()
  user_id?: string;

  @IsEnum(ModerationStatus)
  @IsOptional()
  moderation_status?: ModerationStatus;
}

export class CreateReviewDto {
  @IsUUID()
  product_id: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  comment?: string;
}

export class UpdateReviewDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @IsString()
  @IsOptional()
  comment?: string;
}

export class UpdateReviewStatusDto {
  @IsEnum(ModerationStatus)
  moderation_status: ModerationStatus;
}
