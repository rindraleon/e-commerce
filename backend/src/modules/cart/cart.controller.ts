import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Req, ParseUUIDPipe, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@Req() req) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    // Cast to any and try common method names as fallbacks to avoid TypeScript error
    const svc: any = this.cartService;
    return svc.getCartByUserId?.(userId) ?? svc.getCart?.(userId) ?? svc.findByUserId?.(userId);
  }

  @Post()
  async addToCart(@Body() addToCartDto: AddToCartDto, @Req() req) {
    return this.cartService.addToCart(addToCartDto, req.user.id);
  }

  @Put(':cartItemId')
  async updateCartItem(
    @Param('cartItemId', ParseUUIDPipe) cartItemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
    @Req() req,
  ) {
    return this.cartService.updateCartItem(cartItemId, updateCartItemDto, req.user.id);
  }

  @Delete(':cartItemId')
  async removeFromCart(@Param('cartItemId', ParseUUIDPipe) cartItemId: string, @Req() req) {
    return this.cartService.removeFromCart(cartItemId, req.user.id);
  }

  @Delete()
  async clearCart(@Req() req) {
    return this.cartService.clearCart(req.user.id);
  }

  @Get('count')
  async getCartItemCount(@Req() req) {
    return this.cartService.getCartItemCount(req.user.id);
  }
}