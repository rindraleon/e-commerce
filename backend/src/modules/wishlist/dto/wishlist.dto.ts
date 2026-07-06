import { IsUUID } from 'class-validator';

export class WishlistProductDto {
  @IsUUID()
  product_id: string;
}
