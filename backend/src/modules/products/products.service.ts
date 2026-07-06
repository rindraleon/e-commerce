import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { unlink } from 'fs/promises';
import { EmailService } from '../../common/email/email.service';
import {
  buildProductImagePublicPath,
  resolveUploadPath,
} from '../../common/utils/upload.util';
import { DatabaseService } from '../../database/database.service';
import { AppRole } from '../../entities/user-role.entity';
import {
  BulkCreateProductImagesDto,
  CreateProductDto,
  ProductQueryDto,
  UpdateProductDto,
} from './dto/product.dto';

interface UploadedProductFile {
  filename: string;
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly emailService: EmailService,
  ) {}

  private toEntityPayload(dto: CreateProductDto | UpdateProductDto) {
    return {
      name: dto.name,
      nameEn: dto.name_en,
      description: dto.description,
      descriptionEn: dto.description_en,
      price: dto.price,
      stock: dto.stock,
      categoryId: dto.category_id,
      weightKg: dto.weight_kg,
      isFeatured: dto.is_featured,
      isNew: dto.is_new,
    };
  }

  private async ensureAdmin(userId: string) {
    const isAdmin = await this.databaseService.checkUserRole(
      userId,
      AppRole.ADMIN,
    );
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can manage products');
    }
  }

  private async persistUploadedImages(
    productId: string,
    files: UploadedProductFile[],
  ) {
    if (!files.length) {
      return;
    }

    const existingImages =
      await this.databaseService.findProductImagesByProductId(productId);
    const hasPrimaryImage = existingImages.some((image) => image.isPrimary);

    for (const [index, file] of files.entries()) {
      await this.databaseService.createProductImage({
        productId,
        imageUrl: buildProductImagePublicPath(file.filename),
        isPrimary: !hasPrimaryImage && index === 0,
        sortOrder: existingImages.length + index,
      });
    }
  }

  private async deletePhysicalFile(publicPath: string) {
    const absolutePath = resolveUploadPath(publicPath);
    if (!absolutePath) {
      return;
    }

    try {
      await unlink(absolutePath);
    } catch {
      // ignore missing files, DB cleanup still proceeds
    }
  }

  private async notifyNewProduct(productId: string) {
    const product = await this.databaseService.findProductById(productId);
    if (!product) {
      return;
    }

    const subscribers = await this.databaseService.findActiveSubscribers();
    const clients =
      await this.databaseService.findClientNotificationRecipients();
    const recipients = Array.from(
      new Map(
        [
          ...subscribers.map((subscriber) => ({ email: subscriber.email })),
          ...clients,
        ].map((recipient) => [recipient.email, recipient]),
      ).values(),
    );

    if (!recipients.length) {
      return;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    const productUrl = `${frontendUrl}/product/${product.id}`;
    const productName = product.name;
    const productDescription =
      product.description || product.descriptionEn || '';

    await Promise.allSettled(
      recipients.map((recipient) =>
        this.emailService.sendNewProductNotification(recipient.email, {
          productName,
          productUrl,
          productDescription,
        }),
      ),
    );
  }

  async findAll(query: ProductQueryDto) {
    return this.databaseService.findProducts({
      page: query.page,
      limit: query.limit,
      search: query.search,
      categoryId: query.category_id,
      minPrice: query.min_price,
      maxPrice: query.max_price,
      inStock: query.in_stock,
      featured: query.featured,
      isNew: query.new,
      sortBy: query.sortBy,
      order: query.order?.toUpperCase() as 'ASC' | 'DESC' | undefined,
    });
  }

  async findOne(id: string) {
    const product = await this.databaseService.findProductById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async create(createProductDto: CreateProductDto, userId: string) {
    await this.ensureAdmin(userId);
    const product = await this.databaseService.createProduct(
      this.toEntityPayload(createProductDto),
    );
    await this.notifyNewProduct(product.id);
    return product;
  }

  async createWithFiles(
    createProductDto: CreateProductDto,
    files: UploadedProductFile[],
    userId: string,
  ) {
    await this.ensureAdmin(userId);
    const product = await this.databaseService.createProduct(
      this.toEntityPayload(createProductDto),
    );
    await this.persistUploadedImages(product.id, files);
    await this.notifyNewProduct(product.id);
    return this.databaseService.findProductById(product.id);
  }

  async update(id: string, updateProductDto: UpdateProductDto, userId: string) {
    await this.ensureAdmin(userId);

    const existingProduct = await this.databaseService.findProductById(id);
    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }

    return this.databaseService.updateProduct(
      id,
      this.toEntityPayload(updateProductDto),
    );
  }

  async updateWithFiles(
    id: string,
    updateProductDto: UpdateProductDto,
    files: UploadedProductFile[],
    userId: string,
  ) {
    await this.ensureAdmin(userId);

    const existingProduct = await this.databaseService.findProductById(id);
    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }

    await this.databaseService.updateProduct(
      id,
      this.toEntityPayload(updateProductDto),
    );
    await this.persistUploadedImages(id, files);

    return this.databaseService.findProductById(id);
  }

  async remove(id: string, userId: string) {
    await this.ensureAdmin(userId);

    const existingProduct = await this.databaseService.findProductById(id);
    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }

    for (const image of existingProduct.images || []) {
      await this.deletePhysicalFile(image.imageUrl);
    }

    await this.databaseService.deleteProduct(id);
    return { message: 'Product deleted successfully' };
  }

  async addImages(
    productId: string,
    imagesData: BulkCreateProductImagesDto,
    userId: string,
  ) {
    await this.ensureAdmin(userId);

    const product = await this.databaseService.findProductById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (imagesData.images.some((image) => image.is_primary)) {
      await this.databaseService.clearPrimaryProductImages(productId);
    }

    for (const image of imagesData.images) {
      await this.databaseService.createProductImage({
        productId,
        imageUrl: image.image_url,
        isPrimary: image.is_primary || false,
        sortOrder: image.sort_order || 0,
      });
    }

    return this.databaseService.findProductById(productId);
  }

  async addUploadedImages(
    productId: string,
    files: UploadedProductFile[],
    userId: string,
  ) {
    await this.ensureAdmin(userId);

    const product = await this.databaseService.findProductById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.persistUploadedImages(productId, files);
    return this.databaseService.findProductById(productId);
  }

  async removeImage(imageId: string, userId: string) {
    await this.ensureAdmin(userId);

    const image = await this.databaseService.findProductImageById(imageId);
    if (!image) {
      throw new NotFoundException('Image not found');
    }

    await this.deletePhysicalFile(image.imageUrl);
    await this.databaseService.deleteProductImage(imageId);
    return { message: 'Image removed successfully' };
  }

  async getProductsByCategory(categoryId: string, page = 1, limit = 10) {
    return this.databaseService.findProducts({
      page,
      limit,
      categoryId,
    });
  }
}
