import { IsString, IsNumber, IsOptional, IsBoolean, IsUUID, Min, Max, IsArray, ArrayMinSize } from 'class-validator';

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

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  stock: number;

  @IsUUID()
  @IsOptional()
  category_id?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  weight_kg?: number;

  @IsBoolean()
  @IsOptional()
  is_featured?: boolean;

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

  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  stock?: number;

  @IsUUID()
  @IsOptional()
  category_id?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  weight_kg?: number;

  @IsBoolean()
  @IsOptional()
  is_featured?: boolean;

  @IsBoolean()
  @IsOptional()
  is_new?: boolean;
}

export class CreateProductImageDto {
  @IsString()
  image_url: string;

  @IsBoolean()
  @IsOptional()
  is_primary?: boolean;

  @IsNumber()
  @IsOptional()
  sort_order?: number;
}

export class BulkCreateProductImagesDto {
  @IsArray()
  @ArrayMinSize(1)
  images: CreateProductImageDto[];
}