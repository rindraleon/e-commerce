import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../services/database.service';
import { CreateProductDto, UpdateProductDto, BulkCreateProductImagesDto } from './dto/product.dto';
import { AppRole } from '../../entities/user-role.entity';

@Injectable()
export class ProductsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(page: number = 1, limit: number = 10, filters: any = {}) {
    const options: any = {
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    };

    // Apply filters
    if (filters.category_id) {
      options.where = { ...options.where, categoryId: filters.category_id };
    }

    if (filters.search) {
      options.where = {
        ...options.where,
        name: { ilike: `%${filters.search}%` }
      };
    }

    if (filters.min_price !== undefined) {
      options.where = { ...options.where, price: { gte: filters.min_price } };
    }

    if (filters.max_price !== undefined) {
      options.where = { ...options.where, price: { lte: filters.max_price } };
    }

    if (filters.in_stock !== undefined) {
      options.where = { ...options.where, stock: { [filters.in_stock ? 'gt' : 'lte']: 0 } };
    }

    if (filters.featured !== undefined) {
      options.where = { ...options.where, isFeatured: filters.featured };
    }

    if (filters.new !== undefined) {
      options.where = { ...options.where, isNew: filters.new };
    }

    const products = await this.databaseService.findProducts(options);
    return products;
  }

  async findOne(id: string) {
    const product = await this.databaseService.findProductById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async create(createProductDto: CreateProductDto, userId: string) {
    // Check if user is admin
    const isAdmin = await this.databaseService.checkUserRole(userId, 'admin' as AppRole);
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can create products');
    }

    const product = await this.databaseService.createProduct(createProductDto);
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto, userId: string) {
    // Check if user is admin
    const isAdmin = await this.databaseService.checkUserRole(userId, 'admin' as AppRole);
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can update products');
    }

    const product = await this.databaseService.updateProduct(id, updateProductDto);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async remove(id: string, userId: string) {
    // Check if user is admin
    const isAdmin = await this.databaseService.checkUserRole(userId, 'admin' as AppRole);
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can delete products');
    }

    await this.databaseService.deleteProduct(id);
    return { message: 'Product deleted successfully' };
  }

  async addImages(productId: string, imagesData: BulkCreateProductImagesDto, userId: string) {
    // Check if user is admin
    const isAdmin = await this.databaseService.checkUserRole(userId, 'admin' as AppRole);
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can add product images');
    }

    // Set is_primary to false for all existing primary images for this product
    if (imagesData.images.some(img => img.is_primary)) {
      // In MariaDB, we'll need to update all primary images for this product
      // This would require a custom query or multiple operations
    }

    // Prepare data with product_id
    for (const img of imagesData.images) {
      await this.databaseService.createProductImage({
        ...img,
        productId
      });
    }

    return { message: 'Images added successfully' };
  }

  async removeImage(imageId: string, userId: string) {
    // Check if user is admin
    const isAdmin = await this.databaseService.checkUserRole(userId, 'admin' as AppRole);
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can remove product images');
    }

    await this.databaseService.deleteProductImage(imageId);
    return { message: 'Image removed successfully' };
  }

  async getProductsByCategory(categoryId: string, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;
    
    const products = await this.databaseService.findProducts({
      where: { categoryId },
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });

    return products;
  }
}