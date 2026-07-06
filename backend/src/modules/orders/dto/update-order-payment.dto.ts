import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { PaymentMethod } from '../../../entities/payment.entity';

export class UpdateOrderPaymentDto {
  @IsEnum(PaymentMethod)
  @IsOptional()
  payment_method?: PaymentMethod;

  @IsString()
  @MinLength(3)
  @IsOptional()
  payment_reference?: string;

  @IsString()
  @IsOptional()
  payer_phone?: string;
}
