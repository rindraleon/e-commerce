import { IsUUID, IsString, IsNumber, IsOptional, IsEnum, ValidateNested, IsArray, ArrayNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export class CreateOrderItemDto {
  @IsUUID()
  product_id: string;

  @IsNumber()
  quantity: number;
}

export class CreateOrderDto {
  @IsUUID()
  address_id: string;

  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  @IsArray()
  @ArrayNotEmpty()
  items: CreateOrderItemDto[];

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}