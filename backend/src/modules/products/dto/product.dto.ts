import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import {
  PaginationQueryDto,
  toBoolean,
} from '../../../common/dto/pagination-query.dto';

export class ProductQueryDto extends PaginationQueryDto {
  @IsUUID()
  @IsOptional()
  category_id?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  min_price?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  max_price?: number;

  @Transform(toBoolean)
  @IsBoolean()
  @IsOptional()
  in_stock?: boolean;

  @Transform(toBoolean)
  @IsBoolean()
  @IsOptional()
  featured?: boolean;

  @Transform(toBoolean)
  @IsBoolean()
  @IsOptional()
  new?: boolean;
}

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  name_en?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  description_en?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock: number;

  @IsUUID()
  @IsOptional()
  category_id?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  weight_kg?: number;

  @Transform(toBoolean)
  @IsBoolean()
  @IsOptional()
  is_featured?: boolean;

  @Transform(toBoolean)
  @IsBoolean()
  @IsOptional()
  is_new?: boolean;
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  name_en?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  description_en?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  stock?: number;

  @IsUUID()
  @IsOptional()
  category_id?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  weight_kg?: number;

  @Transform(toBoolean)
  @IsBoolean()
  @IsOptional()
  is_featured?: boolean;

  @Transform(toBoolean)
  @IsBoolean()
  @IsOptional()
  is_new?: boolean;
}

export class CreateProductImageDto {
  @IsString()
  image_url: string;

  @Transform(toBoolean)
  @IsBoolean()
  @IsOptional()
  is_primary?: boolean;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  sort_order?: number;
}

export class BulkCreateProductImagesDto {
  @IsArray()
  @ArrayMinSize(1)
  images: CreateProductImageDto[];
}
