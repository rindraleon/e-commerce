import { IsUUID, IsNumber, Min } from 'class-validator';

export class AddToCartDto {
  @IsUUID()
  product_id: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class UpdateCartItemDto {
  @IsNumber()
  @Min(1)
  quantity: number;
}