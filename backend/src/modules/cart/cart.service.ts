import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../services/database.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';

@Injectable()
export class CartService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getCart(userId: string) {
    const cartItems = await this.databaseService.findCartItemsByUserId(userId);

    // Calculate totals
    const cartItemsWithTotals = cartItems.map(item => ({
      ...item,
      total_price: Number(item.product.price) * item.quantity
    }));

    const totalAmount = cartItemsWithTotals.reduce((sum, item) => sum + item.total_price, 0);

    return {
      items: cartItemsWithTotals,
      total_items: cartItems.length,
      total_amount: totalAmount
    };
  }

  async addToCart(addToCartDto: AddToCartDto, userId: string) {
    // Check if product exists and has enough stock
    const product = await this.databaseService.findProductById(addToCartDto.product_id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.stock < addToCartDto.quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    // Add to cart
    const cartItem = await this.databaseService.addToCart({
      userId,
      productId: addToCartDto.product_id,
      quantity: addToCartDto.quantity
    });

    return {
      ...cartItem,
      total_price: Number(cartItem.product.price) * cartItem.quantity
    };
  }

  async updateCartItem(cartItemId: string, updateCartItemDto: UpdateCartItemDto, userId: string) {
    // Get current cart item
    const currentItem = await this.databaseService.findCartItemsByUserId(userId);
    const itemToUpdate = currentItem.find(item => item.id === cartItemId);

    if (!itemToUpdate) {
      throw new NotFoundException('Cart item not found');
    }

    // Check if product has enough stock
    const product = await this.databaseService.findProductById(itemToUpdate.productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.stock < updateCartItemDto.quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    // Update the cart item
    const updatedItem = await this.databaseService.updateCartItem(cartItemId, {
      quantity: updateCartItemDto.quantity
    });

    if (!updatedItem) {
      throw new BadRequestException('Failed to update cart item');
    }

    return {
      ...updatedItem,
      total_price: Number(updatedItem.product.price) * updatedItem.quantity
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
    return await this.databaseService.getCartItemCount(userId);
  }
}