import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { WishlistProductDto } from './dto/wishlist.dto';

@Injectable()
export class WishlistService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(userId: string) {
    return this.databaseService.findWishlistItemsByUserId(userId);
  }

  async add(dto: WishlistProductDto, userId: string) {
    const product = await this.databaseService.findProductById(dto.product_id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existingItem = await this.databaseService.findWishlistItem(
      userId,
      dto.product_id,
    );
    if (existingItem) {
      throw new BadRequestException('Product already in wishlist');
    }

    return this.databaseService.createWishlistItem({
      userId,
      productId: dto.product_id,
    });
  }

  async toggle(dto: WishlistProductDto, userId: string) {
    const product = await this.databaseService.findProductById(dto.product_id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existingItem = await this.databaseService.findWishlistItem(
      userId,
      dto.product_id,
    );

    if (existingItem) {
      await this.databaseService.deleteWishlistItem(existingItem.id);
      return {
        added: false,
        productId: dto.product_id,
        message: 'Product removed from wishlist',
      };
    }

    const item = await this.databaseService.createWishlistItem({
      userId,
      productId: dto.product_id,
    });
    return {
      added: true,
      productId: dto.product_id,
      item,
      message: 'Product added to wishlist',
    };
  }

  async remove(productId: string, userId: string) {
    const existingItem = await this.databaseService.findWishlistItem(
      userId,
      productId,
    );

    if (!existingItem) {
      throw new NotFoundException('Wishlist item not found');
    }

    await this.databaseService.deleteWishlistItem(existingItem.id);
    return { message: 'Product removed from wishlist' };
  }
}
