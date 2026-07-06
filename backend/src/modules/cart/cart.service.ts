import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';

@Injectable()
export class CartService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getCart(userId: string) {
    const cartItems = await this.databaseService.findCartItemsByUserId(userId);

    const items = cartItems.map((item) => ({
      ...item,
      totalPrice: Number(item.product.price) * item.quantity,
    }));

    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      items,
      totalItems,
      totalAmount,
    };
  }

  async addToCart(addToCartDto: AddToCartDto, userId: string) {
    const product = await this.databaseService.findProductById(
      addToCartDto.product_id,
    );
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const currentItems =
      await this.databaseService.findCartItemsByUserId(userId);
    const existingItem = currentItems.find(
      (item) => item.productId === addToCartDto.product_id,
    );
    const requestedQuantity =
      (existingItem?.quantity || 0) + addToCartDto.quantity;

    if (product.stock < requestedQuantity) {
      throw new BadRequestException('Insufficient stock');
    }

    const cartItem = await this.databaseService.addToCart({
      userId,
      productId: addToCartDto.product_id,
      quantity: addToCartDto.quantity,
    });

    return {
      ...cartItem,
      totalPrice: Number(cartItem.product.price) * cartItem.quantity,
    };
  }

  async updateCartItem(
    cartItemId: string,
    updateCartItemDto: UpdateCartItemDto,
    userId: string,
  ) {
    const currentItems =
      await this.databaseService.findCartItemsByUserId(userId);
    const itemToUpdate = currentItems.find((item) => item.id === cartItemId);

    if (!itemToUpdate) {
      throw new NotFoundException('Cart item not found');
    }

    const product = await this.databaseService.findProductById(
      itemToUpdate.productId,
    );
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.stock < updateCartItemDto.quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    const updatedItem = await this.databaseService.updateCartItem(
      cartItemId,
      userId,
      {
        quantity: updateCartItemDto.quantity,
      },
    );

    if (!updatedItem) {
      throw new BadRequestException('Failed to update cart item');
    }

    return {
      ...updatedItem,
      totalPrice: Number(updatedItem.product.price) * updatedItem.quantity,
    };
  }

  async removeFromCart(cartItemId: string, userId: string) {
    await this.databaseService.removeFromCart(cartItemId, userId);
    return { message: 'Item removed from cart successfully' };
  }

  async clearCart(userId: string) {
    await this.databaseService.clearCart(userId);
    return { message: 'Cart cleared successfully' };
  }

  async getCartItemCount(userId: string) {
    return { count: await this.databaseService.getCartItemCount(userId) };
  }
}
