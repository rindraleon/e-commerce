import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { OrderStatus } from '../../../entities/order.entity';
import { PaymentMethod } from '../../../entities/payment.entity';

export class OrderQueryDto extends PaginationQueryDto {
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;
}

export class CreateOrderItemDto {
  @IsUUID()
  product_id: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
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

  @IsString()
  @IsOptional()
  coupon_code?: string;

  @IsEnum(PaymentMethod)
  payment_method: PaymentMethod;

  @IsString()
  @MinLength(3)
  payment_reference: string;

  @IsString()
  @IsOptional()
  payer_phone?: string;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}

export { UpdateOrderPaymentDto } from './update-order-payment.dto';
