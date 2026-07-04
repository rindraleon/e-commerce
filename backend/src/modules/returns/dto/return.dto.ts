import { IsUUID, IsString, IsEnum } from 'class-validator';

export enum ReturnStatus {
  REQUESTED = 'requested',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REFUNDED = 'refunded',
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