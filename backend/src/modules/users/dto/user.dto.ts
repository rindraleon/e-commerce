import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import {
  PaginationQueryDto,
  toBoolean,
} from '../../../common/dto/pagination-query.dto';

export enum UserRole {
  ADMIN = 'admin',
  CLIENT = 'client',
}

export class UserQueryDto extends PaginationQueryDto {
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}

export class UpdateUserRoleDto {
  @IsEnum(UserRole)
  role: UserRole;
}

export class UpdateAddressDto {
  @IsString()
  @IsOptional()
  label?: string;

  @IsString()
  @IsOptional()
  street?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  postal_code?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @Transform(toBoolean)
  @IsBoolean()
  @IsOptional()
  is_default?: boolean;
}

export class CreateAddressDto {
  @IsString()
  @IsOptional()
  label?: string;

  @IsString()
  street: string;

  @IsString()
  city: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  postal_code?: string;

  @IsString()
  country: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @Transform(toBoolean)
  @IsBoolean()
  @IsOptional()
  is_default?: boolean;
}
