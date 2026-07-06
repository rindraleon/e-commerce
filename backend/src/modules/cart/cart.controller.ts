import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';
import { CartService } from './cart.service';

@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@CurrentUser('id') userId: string) {
    return this.cartService.getCart(userId);
  }

  @Post()
  addToCart(
    @Body() addToCartDto: AddToCartDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.cartService.addToCart(addToCartDto, userId);
  }

  @Put(':cartItemId')
  updateCartItem(
    @Param('cartItemId', ParseUUIDPipe) cartItemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.cartService.updateCartItem(
      cartItemId,
      updateCartItemDto,
      userId,
    );
  }

  @Delete(':cartItemId')
  removeFromCart(
    @Param('cartItemId', ParseUUIDPipe) cartItemId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.cartService.removeFromCart(cartItemId, userId);
  }

  @Delete()
  clearCart(@CurrentUser('id') userId: string) {
    return this.cartService.clearCart(userId);
  }

  @Get('count')
  getCartItemCount(@CurrentUser('id') userId: string) {
    return this.cartService.getCartItemCount(userId);
  }
}
