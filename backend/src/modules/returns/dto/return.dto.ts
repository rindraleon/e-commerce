import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ReturnStatus } from '../../../entities/return.entity';

export class ReturnQueryDto extends PaginationQueryDto {
  @IsEnum(ReturnStatus)
  @IsOptional()
  status?: ReturnStatus;
}

export class CreateReturnDto {
  @IsUUID()
  order_id: string;

  @IsString()
  reason: string;
}

export class UpdateReturnStatusDto {
  @IsEnum(ReturnStatus)
  status: ReturnStatus;
}
