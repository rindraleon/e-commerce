import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { CouponType } from '../../../entities/coupon.entity';

export class CouponQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_active?: boolean;
}

export class ValidateCouponItemDto {
  @IsUUID()
  product_id: string;

  @IsOptional()
  @IsUUID()
  category_id?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unit_price: number;
}

export class ValidateCouponDto {
  @IsString()
  @MinLength(3)
  code: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  subtotal: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ValidateCouponItemDto)
  items?: ValidateCouponItemDto[];
}

export class CreateCouponDto {
  @IsString()
  @MinLength(3)
  @Matches(/^[A-Za-z0-9_-]+$/)
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(CouponType)
  type: CouponType;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  value: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  min_order_amount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  max_discount_amount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usage_limit?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_single_use_per_user?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_for_new_customers?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  allowed_category_ids?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  allowed_product_ids?: string[];

  @IsOptional()
  @IsDateString()
  starts_at?: string;

  @IsOptional()
  @IsDateString()
  expires_at?: string;
}

export class UpdateCouponDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @Matches(/^[A-Za-z0-9_-]+$/)
  code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(CouponType)
  type?: CouponType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  value?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  min_order_amount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  max_discount_amount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usage_limit?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_single_use_per_user?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_for_new_customers?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  allowed_category_ids?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  allowed_product_ids?: string[];

  @IsOptional()
  @IsDateString()
  starts_at?: string;

  @IsOptional()
  @IsDateString()
  expires_at?: string;
}
