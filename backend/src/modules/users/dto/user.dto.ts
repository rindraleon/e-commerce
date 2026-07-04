import { IsString, IsEmail, IsOptional, IsBoolean, IsEnum } from 'class-validator';

export enum UserRole {
  ADMIN = 'admin',
  CLIENT = 'client',
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

  @IsBoolean()
  @IsOptional()
  is_default?: boolean;
}

export class CreateAddressDto extends UpdateAddressDto {}