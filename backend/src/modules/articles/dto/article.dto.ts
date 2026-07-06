import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';
import {
  PaginationQueryDto,
  toBoolean,
} from '../../../common/dto/pagination-query.dto';

export class ArticleQueryDto extends PaginationQueryDto {
  @Transform(toBoolean)
  @IsBoolean()
  @IsOptional()
  published?: boolean;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  tag?: string;
}

export class CreateArticleDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  tags?: string;

  @IsString()
  @IsOptional()
  title_en?: string;

  @IsString()
  @IsOptional()
  excerpt?: string;

  @IsString()
  @IsOptional()
  excerpt_en?: string;

  @IsString()
  @MinLength(10)
  content: string;

  @IsString()
  @IsOptional()
  content_en?: string;

  @Transform(toBoolean)
  @IsBoolean()
  @IsOptional()
  is_published?: boolean;
}

export class UpdateArticleDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  title?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  tags?: string;

  @IsString()
  @IsOptional()
  title_en?: string;

  @IsString()
  @IsOptional()
  excerpt?: string;

  @IsString()
  @IsOptional()
  excerpt_en?: string;

  @IsString()
  @IsOptional()
  @MinLength(10)
  content?: string;

  @IsString()
  @IsOptional()
  content_en?: string;

  @Transform(toBoolean)
  @IsBoolean()
  @IsOptional()
  is_published?: boolean;
}
