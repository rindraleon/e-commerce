import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Brackets,
  DeepPartial,
  In,
  ObjectLiteral,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { Address } from '../entities/address.entity';
import { AdminLog } from '../entities/admin-log.entity';
import { ArticleComment } from '../entities/article-comment.entity';
import { ArticleLike } from '../entities/article-like.entity';
import { Article } from '../entities/article.entity';
import { CartItem } from '../entities/cart-item.entity';
import { Category } from '../entities/category.entity';
import { Coupon } from '../entities/coupon.entity';
import { CouponUsage } from '../entities/coupon-usage.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Order, OrderStatus } from '../entities/order.entity';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { Payment, PaymentStatus } from '../entities/payment.entity';
import { ProductImage } from '../entities/product-image.entity';
import { Product } from '../entities/product.entity';
import { Profile } from '../entities/profile.entity';
import { Return, ReturnStatus } from '../entities/return.entity';
import { ModerationStatus, Review } from '../entities/review.entity';
import { Subscriber } from '../entities/subscriber.entity';
import { AppRole, UserRole } from '../entities/user-role.entity';
import { User } from '../entities/user.entity';
import { WishlistItem } from '../entities/wishlist-item.entity';
import {
  buildPaginationMeta,
  normalizePagination,
} from '../common/utils/pagination.util';

interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  isNew?: boolean;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}

interface ArticleFilters {
  page?: number;
  limit?: number;
  search?: string;
  published?: boolean;
  category?: string;
  tag?: string;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}

interface CategoryFilters {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}

interface CouponFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}

interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: AppRole;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}

interface OrderFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}

interface ReviewFilters {
  page?: number;
  limit?: number;
  productId?: string;
  userId?: string;
  moderationStatus?: ModerationStatus;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}

interface ReturnFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: ReturnStatus;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}

interface AdminLogFilters {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}

interface PaymentFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  paymentMethod?: string;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}

@Injectable()
export class DatabaseService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
    @InjectRepository(CouponUsage)
    private readonly couponUsageRepository: Repository<CouponUsage>,
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(ArticleComment)
    private readonly articleCommentRepository: Repository<ArticleComment>,
    @InjectRepository(ArticleLike)
    private readonly articleLikeRepository: Repository<ArticleLike>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,
    @InjectRepository(WishlistItem)
    private readonly wishlistItemRepository: Repository<WishlistItem>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Return)
    private readonly returnRepository: Repository<Return>,
    @InjectRepository(AdminLog)
    private readonly adminLogRepository: Repository<AdminLog>,
    @InjectRepository(Subscriber)
    private readonly subscriberRepository: Repository<Subscriber>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
  ) {}

  private getOrderDirection(order?: string): 'ASC' | 'DESC' {
    return order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  }

  private normalizeAnalyticsDays(days = 30) {
    return Math.min(Math.max(Math.trunc(days || 30), 7), 365);
  }

  private buildAnalyticsDateRange(days: number) {
    const safeDays = this.normalizeAnalyticsDays(days);
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - (safeDays - 1));

    const dates: string[] = [];
    for (let index = 0; index < safeDays; index += 1) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + index);
      dates.push(currentDate.toISOString().slice(0, 10));
    }

    return {
      safeDays,
      startDate,
      dates,
    };
  }

  private formatAnalyticsDate(value: unknown) {
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }

    return this.toStringValue(value).slice(0, 10);
  }

  private toStringValue(value: unknown) {
    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    return '';
  }

  private toNumber(value: unknown) {
    return Number(value || 0);
  }

  private toInteger(value: unknown) {
    return Math.trunc(this.toNumber(value));
  }

  private createTimelineMap<T>(
    dates: string[],
    factory: (date: string) => T,
  ): Record<string, T> {
    return dates.reduce<Record<string, T>>((accumulator, date) => {
      accumulator[date] = factory(date);
      return accumulator;
    }, {});
  }

  private async paginate<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    page = 1,
    limit = 10,
  ): Promise<{ data: T[]; meta: ReturnType<typeof buildPaginationMeta> }> {
    const {
      page: safePage,
      limit: safeLimit,
      skip,
    } = normalizePagination(page, limit);
    qb.skip(skip).take(safeLimit);
    const [data, totalItems] = await qb.getManyAndCount();
    return {
      data,
      meta: buildPaginationMeta(safePage, safeLimit, totalItems),
    };
  }

  // Users
  async createUser(userData: DeepPartial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async findUserById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['profiles', 'userRoles'],
    });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['profiles', 'userRoles'],
    });
  }

  async findUsers(filters: UserFilters = {}) {
    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profiles', 'profile')
      .leftJoinAndSelect('user.userRoles', 'userRole');

    if (filters.search?.trim()) {
      const search = `%${filters.search.trim().toLowerCase()}%`;
      qb.andWhere(
        new Brackets((query) => {
          query
            .where('LOWER(user.email) LIKE :search', { search })
            .orWhere('LOWER(profile.fullName) LIKE :search', { search });
        }),
      );
    }

    if (filters.role) {
      qb.andWhere('userRole.role = :role', { role: filters.role });
    }

    const sortMap: Record<string, string> = {
      email: 'user.email',
      createdAt: 'user.createdAt',
      fullName: 'profile.fullName',
    };

    qb.orderBy(
      sortMap[filters.sortBy || 'createdAt'] || 'user.createdAt',
      this.getOrderDirection(filters.order),
    );

    return this.paginate(qb, filters.page, filters.limit);
  }

  async countUsers(): Promise<number> {
    return this.userRepository.count();
  }

  async updateUser(
    id: string,
    userData: DeepPartial<User>,
  ): Promise<User | null> {
    await this.userRepository.update(id, userData);
    return this.findUserById(id);
  }

  // Profiles
  async createProfile(profileData: DeepPartial<Profile>): Promise<Profile> {
    const profile = this.profileRepository.create(profileData);
    return this.profileRepository.save(profile);
  }

  async findProfileByUserId(userId: string): Promise<Profile | null> {
    return this.profileRepository.findOne({ where: { userId } });
  }

  async updateProfile(
    userId: string,
    profileData: DeepPartial<Profile>,
  ): Promise<Profile | null> {
    const existing = await this.findProfileByUserId(userId);
    if (!existing) {
      const created = this.profileRepository.create({ userId, ...profileData });
      return this.profileRepository.save(created);
    }

    await this.profileRepository.update({ userId }, profileData);
    return this.findProfileByUserId(userId);
  }

  // User roles
  async createUserRole(roleData: DeepPartial<UserRole>): Promise<UserRole> {
    const role = this.userRoleRepository.create(roleData);
    return this.userRoleRepository.save(role);
  }

  async getUserRole(userId: string): Promise<AppRole | undefined> {
    const userRole = await this.userRoleRepository.findOne({
      where: { userId },
    });
    return userRole?.role;
  }

  async setUserRole(userId: string, role: AppRole): Promise<UserRole> {
    await this.userRoleRepository.delete({ userId });
    return this.createUserRole({ userId, role });
  }

  async checkUserRole(userId: string, role: AppRole): Promise<boolean> {
    const userRole = await this.getUserRole(userId);
    return userRole === role;
  }

  // Articles
  async createArticle(articleData: DeepPartial<Article>): Promise<Article> {
    const article = this.articleRepository.create(articleData);
    return this.articleRepository.save(article);
  }

  async findArticles(filters: ArticleFilters = {}) {
    const qb = this.articleRepository.createQueryBuilder('article');

    if (filters.search?.trim()) {
      const search = `%${filters.search.trim().toLowerCase()}%`;
      qb.andWhere(
        new Brackets((query) => {
          query
            .where('LOWER(article.title) LIKE :search', { search })
            .orWhere('LOWER(article.titleEn) LIKE :search', { search })
            .orWhere('LOWER(article.excerpt) LIKE :search', { search })
            .orWhere('LOWER(article.excerptEn) LIKE :search', { search })
            .orWhere('LOWER(article.content) LIKE :search', { search })
            .orWhere('LOWER(article.contentEn) LIKE :search', { search });
        }),
      );
    }

    if (filters.published !== undefined) {
      qb.andWhere('article.isPublished = :published', {
        published: filters.published,
      });
    }

    if (filters.category?.trim()) {
      qb.andWhere('LOWER(article.category) = :category', {
        category: filters.category.trim().toLowerCase(),
      });
    }

    if (filters.tag?.trim()) {
      qb.andWhere(':tag = ANY(article.tags)', {
        tag: filters.tag.trim(),
      });
    }

    const sortMap: Record<string, string> = {
      createdAt: 'article.createdAt',
      publishedAt: 'article.publishedAt',
      title: 'article.title',
    };

    qb.orderBy(
      sortMap[filters.sortBy || 'createdAt'] || 'article.createdAt',
      this.getOrderDirection(filters.order),
    );

    return this.paginate(qb, filters.page, filters.limit);
  }

  async findArticleById(id: string): Promise<Article | null> {
    return this.articleRepository.findOne({ where: { id } });
  }

  async findArticleBySlug(slug: string): Promise<Article | null> {
    return this.articleRepository.findOne({ where: { slug } });
  }

  async findArticleComments(articleId: string, page = 1, limit = 10) {
    const qb = this.articleCommentRepository
      .createQueryBuilder('articleComment')
      .leftJoinAndSelect('articleComment.user', 'user')
      .leftJoinAndSelect('user.profiles', 'profile')
      .where('articleComment.articleId = :articleId', { articleId })
      .andWhere('articleComment.isApproved = true')
      .orderBy('articleComment.createdAt', 'DESC');

    return this.paginate(qb, page, limit);
  }

  async createArticleComment(
    commentData: DeepPartial<ArticleComment>,
  ): Promise<ArticleComment> {
    const comment = this.articleCommentRepository.create(commentData);
    return this.articleCommentRepository.save(comment);
  }

  async countArticleComments(articleId: string): Promise<number> {
    return this.articleCommentRepository.count({
      where: { articleId, isApproved: true },
    });
  }

  async findArticleLike(
    articleId: string,
    userId: string,
  ): Promise<ArticleLike | null> {
    return this.articleLikeRepository.findOne({
      where: { articleId, userId },
    });
  }

  async createArticleLike(
    likeData: DeepPartial<ArticleLike>,
  ): Promise<ArticleLike> {
    const like = this.articleLikeRepository.create(likeData);
    return this.articleLikeRepository.save(like);
  }

  async deleteArticleLike(id: string): Promise<void> {
    await this.articleLikeRepository.delete(id);
  }

  async countArticleLikes(articleId: string): Promise<number> {
    return this.articleLikeRepository.count({ where: { articleId } });
  }

  async updateArticle(
    id: string,
    articleData: DeepPartial<Article>,
  ): Promise<Article | null> {
    await this.articleRepository.update(id, articleData);
    return this.findArticleById(id);
  }

  async deleteArticle(id: string): Promise<void> {
    await this.articleRepository.delete(id);
  }

  async countArticles(): Promise<number> {
    return this.articleRepository.count();
  }

  // Categories
  async createCategory(categoryData: DeepPartial<Category>): Promise<Category> {
    const category = this.categoryRepository.create(categoryData);
    return this.categoryRepository.save(category);
  }

  async findCategories(filters: CategoryFilters = {}) {
    const qb = this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.products', 'product');

    if (filters.search?.trim()) {
      const search = `%${filters.search.trim().toLowerCase()}%`;
      qb.andWhere(
        new Brackets((query) => {
          query
            .where('LOWER(category.name) LIKE :search', { search })
            .orWhere('LOWER(category.nameEn) LIKE :search', { search })
            .orWhere('LOWER(category.description) LIKE :search', { search })
            .orWhere('LOWER(category.descriptionEn) LIKE :search', { search });
        }),
      );
    }

    const sortMap: Record<string, string> = {
      name: 'category.name',
      createdAt: 'category.createdAt',
    };

    qb.orderBy(
      sortMap[filters.sortBy || 'createdAt'] || 'category.createdAt',
      this.getOrderDirection(filters.order),
    );

    return this.paginate(qb, filters.page, filters.limit);
  }

  async findCategoryById(id: string): Promise<Category | null> {
    return this.categoryRepository.findOne({
      where: { id },
      relations: ['products'],
    });
  }

  async updateCategory(
    id: string,
    categoryData: DeepPartial<Category>,
  ): Promise<Category | null> {
    await this.categoryRepository.update(id, categoryData);
    return this.findCategoryById(id);
  }

  async deleteCategory(id: string): Promise<void> {
    await this.categoryRepository.delete(id);
  }

  // Coupons
  async createCoupon(couponData: DeepPartial<Coupon>): Promise<Coupon> {
    const coupon = this.couponRepository.create(couponData);
    return this.couponRepository.save(coupon);
  }

  async findCoupons(filters: CouponFilters = {}) {
    const qb = this.couponRepository.createQueryBuilder('coupon');

    if (filters.search?.trim()) {
      const search = `%${filters.search.trim().toLowerCase()}%`;
      qb.andWhere(
        new Brackets((query) => {
          query
            .where('LOWER(coupon.code) LIKE :search', { search })
            .orWhere('LOWER(coupon.description) LIKE :search', { search });
        }),
      );
    }

    if (filters.isActive !== undefined) {
      qb.andWhere('coupon.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    const sortMap: Record<string, string> = {
      code: 'coupon.code',
      createdAt: 'coupon.createdAt',
      expiresAt: 'coupon.expiresAt',
      usedCount: 'coupon.usedCount',
    };

    qb.orderBy(
      sortMap[filters.sortBy || 'createdAt'] || 'coupon.createdAt',
      this.getOrderDirection(filters.order),
    );

    return this.paginate(qb, filters.page, filters.limit);
  }

  async findCouponById(id: string): Promise<Coupon | null> {
    return this.couponRepository.findOne({ where: { id } });
  }

  async findCouponByCode(code: string): Promise<Coupon | null> {
    return this.couponRepository.findOne({
      where: { code: code.trim().toUpperCase() },
    });
  }

  async updateCoupon(
    id: string,
    couponData: DeepPartial<Coupon>,
  ): Promise<Coupon | null> {
    await this.couponRepository.update(id, couponData);
    return this.findCouponById(id);
  }

  async incrementCouponUsage(id: string): Promise<Coupon | null> {
    await this.couponRepository.increment({ id }, 'usedCount', 1);
    return this.findCouponById(id);
  }

  async deleteCoupon(id: string): Promise<void> {
    await this.couponRepository.delete(id);
  }

  async createCouponUsage(
    couponUsageData: DeepPartial<CouponUsage>,
  ): Promise<CouponUsage> {
    const couponUsage = this.couponUsageRepository.create(couponUsageData);
    return this.couponUsageRepository.save(couponUsage);
  }

  async findCouponUsage(
    couponId: string,
    userId: string,
  ): Promise<CouponUsage | null> {
    return this.couponUsageRepository.findOne({
      where: { couponId, userId },
    });
  }

  async deleteCouponUsagesByCouponIds(couponIds: string[]): Promise<void> {
    if (!couponIds.length) {
      return;
    }

    await this.couponUsageRepository.delete({ couponId: In(couponIds) });
  }

  // Products
  async createProduct(productData: DeepPartial<Product>): Promise<Product> {
    const product = this.productRepository.create(productData);
    const saved = await this.productRepository.save(product);
    return this.findProductById(saved.id) as Promise<Product>;
  }

  async countProducts(): Promise<number> {
    return this.productRepository.count();
  }

  async findProducts(filters: ProductFilters = {}) {
    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.images', 'images');

    if (filters.categoryId) {
      qb.andWhere('product.categoryId = :categoryId', {
        categoryId: filters.categoryId,
      });
    }

    if (filters.search?.trim()) {
      const search = `%${filters.search.trim().toLowerCase()}%`;
      qb.andWhere(
        new Brackets((query) => {
          query
            .where('LOWER(product.name) LIKE :search', { search })
            .orWhere('LOWER(product.nameEn) LIKE :search', { search })
            .orWhere('LOWER(product.description) LIKE :search', { search })
            .orWhere('LOWER(product.descriptionEn) LIKE :search', { search });
        }),
      );
    }

    if (filters.minPrice !== undefined) {
      qb.andWhere('product.price >= :minPrice', { minPrice: filters.minPrice });
    }

    if (filters.maxPrice !== undefined) {
      qb.andWhere('product.price <= :maxPrice', { maxPrice: filters.maxPrice });
    }

    if (filters.inStock === true) {
      qb.andWhere('product.stock > 0');
    }

    if (filters.inStock === false) {
      qb.andWhere('product.stock <= 0');
    }

    if (filters.featured !== undefined) {
      qb.andWhere('product.isFeatured = :featured', {
        featured: filters.featured,
      });
    }

    if (filters.isNew !== undefined) {
      qb.andWhere('product.isNew = :isNew', { isNew: filters.isNew });
    }

    const sortMap: Record<string, string> = {
      price: 'product.price',
      name: 'product.name',
      stock: 'product.stock',
      createdAt: 'product.createdAt',
    };

    qb.orderBy(
      sortMap[filters.sortBy || 'createdAt'] || 'product.createdAt',
      this.getOrderDirection(filters.order),
    );
    qb.addOrderBy('images.sortOrder', 'ASC');

    return this.paginate(qb, filters.page, filters.limit);
  }

  async findProductById(id: string): Promise<Product | null> {
    return this.productRepository.findOne({
      where: { id },
      relations: ['category', 'images'],
      order: { images: { sortOrder: 'ASC' } },
    });
  }

  async updateProduct(
    id: string,
    productData: DeepPartial<Product>,
  ): Promise<Product | null> {
    await this.productRepository.update(id, productData);
    return this.findProductById(id);
  }

  async deleteProduct(id: string): Promise<void> {
    await this.productRepository.delete(id);
  }

  async createProductImage(
    imageData: DeepPartial<ProductImage>,
  ): Promise<ProductImage> {
    const image = this.productImageRepository.create(imageData);
    return this.productImageRepository.save(image);
  }

  async findProductImagesByProductId(
    productId: string,
  ): Promise<ProductImage[]> {
    return this.productImageRepository.find({
      where: { productId },
      order: { sortOrder: 'ASC' },
    });
  }

  async clearPrimaryProductImages(productId: string): Promise<void> {
    await this.productImageRepository.update(
      { productId },
      { isPrimary: false },
    );
  }

  async deleteProductImage(id: string): Promise<void> {
    await this.productImageRepository.delete(id);
  }

  async findProductImageById(id: string): Promise<ProductImage | null> {
    return this.productImageRepository.findOne({ where: { id } });
  }

  // Wishlist
  async createWishlistItem(
    wishlistItemData: DeepPartial<WishlistItem>,
  ): Promise<WishlistItem> {
    const wishlistItem = this.wishlistItemRepository.create(wishlistItemData);
    const saved = await this.wishlistItemRepository.save(wishlistItem);
    return this.findWishlistItemById(saved.id) as Promise<WishlistItem>;
  }

  async findWishlistItemsByUserId(userId: string): Promise<WishlistItem[]> {
    return this.wishlistItemRepository
      .createQueryBuilder('wishlistItem')
      .leftJoinAndSelect('wishlistItem.product', 'product')
      .leftJoinAndSelect('product.images', 'productImage')
      .leftJoinAndSelect('product.category', 'category')
      .where('wishlistItem.userId = :userId', { userId })
      .orderBy('wishlistItem.createdAt', 'DESC')
      .addOrderBy('productImage.sortOrder', 'ASC')
      .getMany();
  }

  async findWishlistItem(
    userId: string,
    productId: string,
  ): Promise<WishlistItem | null> {
    return this.wishlistItemRepository
      .createQueryBuilder('wishlistItem')
      .leftJoinAndSelect('wishlistItem.product', 'product')
      .leftJoinAndSelect('product.images', 'productImage')
      .leftJoinAndSelect('product.category', 'category')
      .where('wishlistItem.userId = :userId', { userId })
      .andWhere('wishlistItem.productId = :productId', { productId })
      .orderBy('productImage.sortOrder', 'ASC')
      .getOne();
  }

  async findWishlistItemById(id: string): Promise<WishlistItem | null> {
    return this.wishlistItemRepository
      .createQueryBuilder('wishlistItem')
      .leftJoinAndSelect('wishlistItem.product', 'product')
      .leftJoinAndSelect('product.images', 'productImage')
      .leftJoinAndSelect('product.category', 'category')
      .where('wishlistItem.id = :id', { id })
      .orderBy('productImage.sortOrder', 'ASC')
      .getOne();
  }

  async deleteWishlistItem(id: string): Promise<void> {
    await this.wishlistItemRepository.delete(id);
  }

  async countWishlistItems(userId: string): Promise<number> {
    return this.wishlistItemRepository.count({ where: { userId } });
  }

  // Addresses
  async createAddress(addressData: DeepPartial<Address>): Promise<Address> {
    const address = this.addressRepository.create(addressData);
    return this.addressRepository.save(address);
  }

  async findAddressesByUserId(userId: string): Promise<Address[]> {
    return this.addressRepository.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async findAddressById(id: string, userId?: string): Promise<Address | null> {
    const where: { id: string; userId?: string } = { id };
    if (userId) where.userId = userId;

    return this.addressRepository.findOne({ where });
  }

  async updateAddress(
    id: string,
    userId: string,
    addressData: DeepPartial<Address>,
  ): Promise<Address | null> {
    await this.addressRepository.update({ id, userId }, addressData);
    return this.findAddressById(id, userId);
  }

  async deleteAddress(id: string, userId: string): Promise<void> {
    await this.addressRepository.delete({ id, userId });
  }

  async setDefaultAddress(addressId: string, userId: string): Promise<Address> {
    await this.addressRepository.update(
      { userId, isDefault: true },
      { isDefault: false },
    );
    await this.addressRepository.update(
      { id: addressId, userId },
      { isDefault: true },
    );
    const address = await this.findAddressById(addressId, userId);
    if (!address) {
      throw new NotFoundException('Address not found');
    }
    return address;
  }

  async unsetDefaultAddresses(userId: string): Promise<void> {
    await this.addressRepository.update(
      { userId, isDefault: true },
      { isDefault: false },
    );
  }

  // Cart
  async addToCart(cartItemData: DeepPartial<CartItem>): Promise<CartItem> {
    const existingItem = await this.cartItemRepository.findOne({
      where: {
        userId: cartItemData.userId,
        productId: cartItemData.productId,
      },
      relations: ['product'],
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + (cartItemData.quantity || 0);
      await this.cartItemRepository.update(existingItem.id, {
        quantity: newQuantity,
      });
      return this.findCartItemById(existingItem.id) as Promise<CartItem>;
    }

    const cartItem = this.cartItemRepository.create(cartItemData);
    const saved = await this.cartItemRepository.save(cartItem);
    return this.findCartItemById(saved.id) as Promise<CartItem>;
  }

  async findCartItemsByUserId(userId: string): Promise<CartItem[]> {
    return this.cartItemRepository.find({
      where: { userId },
      relations: ['product', 'product.images', 'product.category'],
      order: { addedAt: 'DESC' },
    });
  }

  async findCartItemById(id: string): Promise<CartItem | null> {
    return this.cartItemRepository.findOne({
      where: { id },
      relations: ['product', 'product.images', 'product.category'],
    });
  }

  async updateCartItem(
    id: string,
    userId: string,
    cartItemData: DeepPartial<CartItem>,
  ): Promise<CartItem | null> {
    await this.cartItemRepository.update({ id, userId }, cartItemData);
    return this.findCartItemById(id);
  }

  async removeFromCart(id: string, userId: string): Promise<void> {
    await this.cartItemRepository.delete({ id, userId });
  }

  async clearCart(userId: string): Promise<void> {
    await this.cartItemRepository.delete({ userId });
  }

  async getCartItemCount(userId: string): Promise<number> {
    const result = await this.cartItemRepository
      .createQueryBuilder('cartItem')
      .select('COALESCE(SUM(cartItem.quantity), 0)', 'total')
      .where('cartItem.userId = :userId', { userId })
      .getRawOne<{ total: string }>();

    return Number(result?.total || 0);
  }

  // Orders
  async createOrder(orderData: DeepPartial<Order>): Promise<Order> {
    const order = this.orderRepository.create(orderData);
    return this.orderRepository.save(order);
  }

  async findOrders(
    filters: OrderFilters = {},
    userId?: string,
    isAdmin = false,
  ) {
    const qb = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.address', 'address')
      .leftJoinAndSelect('order.orderItems', 'orderItem')
      .leftJoinAndSelect('orderItem.product', 'product')
      .leftJoinAndSelect('product.images', 'productImage')
      .leftJoinAndSelect('order.payments', 'payment')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('user.profiles', 'profile');

    if (!isAdmin && userId) {
      qb.andWhere('order.userId = :userId', { userId });
    }

    if (filters.status) {
      qb.andWhere('order.status = :status', { status: filters.status });
    }

    if (filters.search?.trim()) {
      const search = `%${filters.search.trim().toLowerCase()}%`;
      qb.andWhere(
        new Brackets((query) => {
          query
            .where('LOWER(order.orderNumber) LIKE :search', { search })
            .orWhere('LOWER(user.email) LIKE :search', { search })
            .orWhere('LOWER(profile.fullName) LIKE :search', { search });
        }),
      );
    }

    const sortMap: Record<string, string> = {
      createdAt: 'order.createdAt',
      totalAmount: 'order.totalAmount',
      status: 'order.status',
      orderNumber: 'order.orderNumber',
    };

    qb.orderBy(
      sortMap[filters.sortBy || 'createdAt'] || 'order.createdAt',
      this.getOrderDirection(filters.order),
    );
    qb.addOrderBy('orderItem.createdAt', 'ASC');
    qb.addOrderBy('productImage.sortOrder', 'ASC');

    return this.paginate(qb, filters.page, filters.limit);
  }

  async findOrderById(
    id: string,
    userId?: string,
    isAdmin = false,
  ): Promise<Order | null> {
    const qb = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.address', 'address')
      .leftJoinAndSelect('order.orderItems', 'orderItem')
      .leftJoinAndSelect('orderItem.product', 'product')
      .leftJoinAndSelect('product.images', 'productImage')
      .leftJoinAndSelect('order.payments', 'payment')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('user.profiles', 'profile')
      .where('order.id = :id', { id });

    if (!isAdmin && userId) {
      qb.andWhere('order.userId = :userId', { userId });
    }

    qb.orderBy('productImage.sortOrder', 'ASC');

    return qb.getOne();
  }

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
  ): Promise<Order | null> {
    await this.orderRepository.update(orderId, { status });
    return this.findOrderById(orderId, undefined, true);
  }

  async createOrderItem(
    orderItemData: DeepPartial<OrderItem>,
  ): Promise<OrderItem> {
    const orderItem = this.orderItemRepository.create(orderItemData);
    return this.orderItemRepository.save(orderItem);
  }

  async createPayment(paymentData: DeepPartial<Payment>): Promise<Payment> {
    const payment = this.paymentRepository.create(paymentData);
    return this.paymentRepository.save(payment);
  }

  async findPaymentById(id: string): Promise<Payment | null> {
    return this.paymentRepository.findOne({ where: { id } });
  }

  async findPaymentByOrderId(orderId: string): Promise<Payment | null> {
    return this.paymentRepository.findOne({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });
  }

  async updatePayment(
    id: string,
    paymentData: DeepPartial<Payment>,
  ): Promise<Payment | null> {
    await this.paymentRepository.update(id, paymentData);
    return this.findPaymentById(id);
  }

  async findPayments(filters: PaymentFilters = {}) {
    const qb = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.order', 'order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('user.profiles', 'profile');

    if (filters.status) {
      qb.andWhere('payment.status = :status', { status: filters.status });
    }

    if (filters.paymentMethod) {
      qb.andWhere('payment.paymentMethod = :paymentMethod', {
        paymentMethod: filters.paymentMethod,
      });
    }

    if (filters.search?.trim()) {
      const search = `%${filters.search.trim().toLowerCase()}%`;
      qb.andWhere(
        new Brackets((query) => {
          query
            .where('LOWER(payment.transactionId) LIKE :search', { search })
            .orWhere('LOWER(order.orderNumber) LIKE :search', { search })
            .orWhere('LOWER(user.email) LIKE :search', { search })
            .orWhere('LOWER(profile.fullName) LIKE :search', { search });
        }),
      );
    }

    const sortMap: Record<string, string> = {
      createdAt: 'payment.createdAt',
      amount: 'payment.amount',
      status: 'payment.status',
      paymentMethod: 'payment.paymentMethod',
    };

    qb.orderBy(
      sortMap[filters.sortBy || 'createdAt'] || 'payment.createdAt',
      this.getOrderDirection(filters.order),
    );

    return this.paginate(qb, filters.page, filters.limit);
  }

  async getPaymentSummary() {
    const summary = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('COUNT(payment.id)', 'totalPayments')
      .addSelect(
        "COALESCE(SUM(CASE WHEN payment.status = 'completed' THEN payment.amount ELSE 0 END), 0)",
        'completedRevenue',
      )
      .addSelect(
        "COALESCE(SUM(CASE WHEN payment.status = 'pending' THEN payment.amount ELSE 0 END), 0)",
        'pendingAmount',
      )
      .addSelect(
        "SUM(CASE WHEN payment.status = 'pending' THEN 1 ELSE 0 END)",
        'pendingCount',
      )
      .addSelect(
        "SUM(CASE WHEN payment.status = 'completed' THEN 1 ELSE 0 END)",
        'completedCount',
      )
      .addSelect(
        "SUM(CASE WHEN payment.status = 'failed' THEN 1 ELSE 0 END)",
        'failedCount',
      )
      .addSelect(
        "SUM(CASE WHEN payment.status = 'refunded' THEN 1 ELSE 0 END)",
        'refundedCount',
      )
      .addSelect(
        "SUM(CASE WHEN payment.paymentMethod = 'mvola' THEN 1 ELSE 0 END)",
        'mvolaCount',
      )
      .addSelect(
        "SUM(CASE WHEN payment.paymentMethod = 'airtel_money' THEN 1 ELSE 0 END)",
        'airtelMoneyCount',
      )
      .addSelect(
        "SUM(CASE WHEN payment.paymentMethod = 'orange_money' THEN 1 ELSE 0 END)",
        'orangeMoneyCount',
      )
      .getRawOne<Record<string, string>>();

    return {
      totalPayments: Number(summary?.totalPayments || 0),
      completedRevenue: Number(summary?.completedRevenue || 0),
      pendingAmount: Number(summary?.pendingAmount || 0),
      pendingCount: Number(summary?.pendingCount || 0),
      completedCount: Number(summary?.completedCount || 0),
      failedCount: Number(summary?.failedCount || 0),
      refundedCount: Number(summary?.refundedCount || 0),
      byMethod: {
        mvola: Number(summary?.mvolaCount || 0),
        airtelMoney: Number(summary?.airtelMoneyCount || 0),
        orangeMoney: Number(summary?.orangeMoneyCount || 0),
      },
    };
  }

  // Subscribers
  async findSubscriberByEmail(email: string): Promise<Subscriber | null> {
    return this.subscriberRepository.findOne({ where: { email } });
  }

  async findSubscriberById(id: string): Promise<Subscriber | null> {
    return this.subscriberRepository.findOne({ where: { id } });
  }

  async createSubscriber(data: DeepPartial<Subscriber>): Promise<Subscriber> {
    const subscriber = this.subscriberRepository.create(data);
    return this.subscriberRepository.save(subscriber);
  }

  async saveSubscriber(
    subscriber: DeepPartial<Subscriber>,
  ): Promise<Subscriber> {
    return this.subscriberRepository.save(subscriber);
  }

  async findSubscribers(): Promise<Subscriber[]> {
    return this.subscriberRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findActiveSubscribers(): Promise<Subscriber[]> {
    return this.subscriberRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async updateSubscriber(
    id: string,
    data: DeepPartial<Subscriber>,
  ): Promise<Subscriber | null> {
    await this.subscriberRepository.update(id, data);
    return this.findSubscriberById(id);
  }

  async deleteSubscriber(id: string): Promise<void> {
    await this.subscriberRepository.delete(id);
  }

  async findClientNotificationRecipients(): Promise<
    Array<{ email: string; fullName?: string }>
  > {
    const users = await this.userRepository.find({
      relations: ['profiles', 'userRoles'],
    });

    return users
      .filter((user) =>
        user.userRoles?.some((role) => role.role === AppRole.CLIENT),
      )
      .filter((user) => Boolean(user.email))
      .map((user) => ({
        email: user.email,
        fullName: user.profiles?.[0]?.fullName,
      }));
  }

  // Password reset tokens
  async createPasswordResetToken(
    data: DeepPartial<PasswordResetToken>,
  ): Promise<PasswordResetToken> {
    const token = this.passwordResetTokenRepository.create(data);
    return this.passwordResetTokenRepository.save(token);
  }

  async invalidatePasswordResetTokens(userId: string): Promise<void> {
    await this.passwordResetTokenRepository
      .createQueryBuilder()
      .update(PasswordResetToken)
      .set({ usedAt: new Date() })
      .where('user_id = :userId', { userId })
      .andWhere('used_at IS NULL')
      .execute();
  }

  async findValidPasswordResetToken(
    token: string,
  ): Promise<PasswordResetToken | null> {
    return this.passwordResetTokenRepository
      .createQueryBuilder('passwordResetToken')
      .where('passwordResetToken.token = :token', { token })
      .andWhere('passwordResetToken.usedAt IS NULL')
      .andWhere('passwordResetToken.expiresAt > NOW()')
      .getOne();
  }

  async markPasswordResetTokenUsed(id: string): Promise<void> {
    await this.passwordResetTokenRepository.update(id, { usedAt: new Date() });
  }

  // Reviews
  async createReview(reviewData: DeepPartial<Review>): Promise<Review> {
    const review = this.reviewRepository.create(reviewData);
    const saved = await this.reviewRepository.save(review);
    return this.findReviewById(saved.id) as Promise<Review>;
  }

  async findReviews(filters: ReviewFilters = {}, isAdmin = false) {
    const qb = this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('user.profiles', 'profile')
      .leftJoinAndSelect('review.product', 'product')
      .leftJoinAndSelect('product.images', 'productImage');

    if (filters.productId) {
      qb.andWhere('review.productId = :productId', {
        productId: filters.productId,
      });
    }

    if (filters.userId) {
      qb.andWhere('review.userId = :userId', { userId: filters.userId });
    }

    if (filters.moderationStatus) {
      qb.andWhere('review.moderationStatus = :moderationStatus', {
        moderationStatus: filters.moderationStatus,
      });
    }

    if (!isAdmin && !filters.userId) {
      qb.andWhere('review.moderationStatus = :approved', {
        approved: ModerationStatus.APPROVED,
      });
    }

    const sortMap: Record<string, string> = {
      createdAt: 'review.createdAt',
      rating: 'review.rating',
    };

    qb.orderBy(
      sortMap[filters.sortBy || 'createdAt'] || 'review.createdAt',
      this.getOrderDirection(filters.order),
    );
    qb.addOrderBy('productImage.sortOrder', 'ASC');

    return this.paginate(qb, filters.page, filters.limit);
  }

  async findReviewById(id: string): Promise<Review | null> {
    return this.reviewRepository.findOne({
      where: { id },
      relations: ['user', 'user.profiles', 'product', 'product.images'],
      order: { product: { images: { sortOrder: 'ASC' } } },
    });
  }

  async updateReview(
    reviewId: string,
    reviewData: DeepPartial<Review>,
  ): Promise<Review | null> {
    await this.reviewRepository.update(reviewId, reviewData);
    return this.findReviewById(reviewId);
  }

  async updateReviewStatus(
    reviewId: string,
    status: ModerationStatus,
  ): Promise<Review | null> {
    await this.reviewRepository.update(reviewId, { moderationStatus: status });
    return this.findReviewById(reviewId);
  }

  async deleteReview(reviewId: string): Promise<void> {
    await this.reviewRepository.delete(reviewId);
  }

  async findUserReviews(userId: string): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { userId },
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });
  }

  // Returns
  async createReturn(returnData: DeepPartial<Return>): Promise<Return> {
    const returnEntity = this.returnRepository.create(returnData);
    const saved = await this.returnRepository.save(returnEntity);
    return this.findReturnById(saved.id, undefined, true) as Promise<Return>;
  }

  async findReturns(
    filters: ReturnFilters = {},
    userId?: string,
    isAdmin = false,
  ) {
    const qb = this.returnRepository
      .createQueryBuilder('returnRequest')
      .leftJoinAndSelect('returnRequest.order', 'order')
      .leftJoinAndSelect('order.orderItems', 'orderItem')
      .leftJoinAndSelect('orderItem.product', 'product')
      .leftJoinAndSelect('product.images', 'productImage')
      .leftJoinAndSelect('returnRequest.user', 'user')
      .leftJoinAndSelect('user.profiles', 'profile');

    if (!isAdmin && userId) {
      qb.andWhere('returnRequest.userId = :userId', { userId });
    }

    if (filters.status) {
      qb.andWhere('returnRequest.status = :status', { status: filters.status });
    }

    if (filters.search?.trim()) {
      const search = `%${filters.search.trim().toLowerCase()}%`;
      qb.andWhere(
        new Brackets((query) => {
          query
            .where('LOWER(order.orderNumber) LIKE :search', { search })
            .orWhere('LOWER(profile.fullName) LIKE :search', { search })
            .orWhere('LOWER(user.email) LIKE :search', { search });
        }),
      );
    }

    const sortMap: Record<string, string> = {
      requestedAt: 'returnRequest.requestedAt',
      createdAt: 'returnRequest.createdAt',
      status: 'returnRequest.status',
    };

    qb.orderBy(
      sortMap[filters.sortBy || 'requestedAt'] || 'returnRequest.requestedAt',
      this.getOrderDirection(filters.order),
    );
    qb.addOrderBy('productImage.sortOrder', 'ASC');

    return this.paginate(qb, filters.page, filters.limit);
  }

  async findReturnById(
    id: string,
    userId?: string,
    isAdmin = false,
  ): Promise<Return | null> {
    const qb = this.returnRepository
      .createQueryBuilder('returnRequest')
      .leftJoinAndSelect('returnRequest.order', 'order')
      .leftJoinAndSelect('order.orderItems', 'orderItem')
      .leftJoinAndSelect('orderItem.product', 'product')
      .leftJoinAndSelect('product.images', 'productImage')
      .leftJoinAndSelect('returnRequest.user', 'user')
      .leftJoinAndSelect('user.profiles', 'profile')
      .where('returnRequest.id = :id', { id });

    if (!isAdmin && userId) {
      qb.andWhere('returnRequest.userId = :userId', { userId });
    }

    qb.orderBy('productImage.sortOrder', 'ASC');

    return qb.getOne();
  }

  async updateReturnStatus(
    returnId: string,
    status: ReturnStatus,
  ): Promise<Return | null> {
    const payload: DeepPartial<Return> = {
      status,
      resolvedAt: status === ReturnStatus.REQUESTED ? null : new Date(),
    };

    await this.returnRepository.update(returnId, payload);
    return this.findReturnById(returnId, undefined, true);
  }

  async deleteReturn(returnId: string): Promise<void> {
    await this.returnRepository.delete(returnId);
  }

  // Admin logs
  async createAdminLog(logData: DeepPartial<AdminLog>): Promise<AdminLog> {
    const log = this.adminLogRepository.create(logData);
    return this.adminLogRepository.save(log);
  }

  async findAdminLogs(filters: AdminLogFilters = {}) {
    const qb = this.adminLogRepository
      .createQueryBuilder('adminLog')
      .leftJoinAndSelect('adminLog.admin', 'admin')
      .leftJoinAndSelect('admin.profiles', 'profile');

    if (filters.search?.trim()) {
      const search = `%${filters.search.trim().toLowerCase()}%`;
      qb.andWhere(
        new Brackets((query) => {
          query
            .where('LOWER(adminLog.action) LIKE :search', { search })
            .orWhere('LOWER(profile.fullName) LIKE :search', { search })
            .orWhere('LOWER(admin.email) LIKE :search', { search });
        }),
      );
    }

    const sortMap: Record<string, string> = {
      createdAt: 'adminLog.createdAt',
      action: 'adminLog.action',
    };

    qb.orderBy(
      sortMap[filters.sortBy || 'createdAt'] || 'adminLog.createdAt',
      this.getOrderDirection(filters.order),
    );

    return this.paginate(qb, filters.page, filters.limit);
  }

  async getAdminAnalytics(days = 30) {
    const { safeDays, startDate, dates } = this.buildAnalyticsDateRange(days);
    const revenueStatuses = [
      OrderStatus.PAID,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
    ];
    const revenueStatusSql = revenueStatuses
      .map((status) => `'${status}'`)
      .join(', ');

    const [
      salesRows,
      paymentRows,
      customerGrowthRows,
      orderStatusRows,
      paymentStatusRows,
      paymentMethodRows,
      topProductsRows,
      categoryPerformanceRows,
      topArticlesRows,
      averageOrderValueRows,
      repeatCustomersRows,
      activeSubscribers,
      publishedArticles,
      approvedCommentsRows,
      articleLikesRows,
      newUsersRows,
    ] = await Promise.all([
      this.orderRepository.query(
        `
          SELECT
            DATE(o.created_at) AS date,
            COUNT(o.id)::int AS orders,
            SUM(CASE WHEN o.status IN (${revenueStatusSql}) THEN 1 ELSE 0 END)::int AS "paidOrders",
            COALESCE(
              SUM(CASE WHEN o.status IN (${revenueStatusSql}) THEN o.total_amount ELSE 0 END),
              0
            )::float AS revenue
          FROM orders o
          WHERE o.created_at >= $1
          GROUP BY DATE(o.created_at)
          ORDER BY DATE(o.created_at) ASC
        `,
        [startDate],
      ),
      this.paymentRepository.query(
        `
          SELECT
            DATE(COALESCE(p.payment_date, p.created_at)) AS date,
            COUNT(p.id)::int AS payments,
            COALESCE(
              SUM(CASE WHEN p.status = '${PaymentStatus.COMPLETED}' THEN p.amount ELSE 0 END),
              0
            )::float AS amount
          FROM payments p
          WHERE p.created_at >= $1
          GROUP BY DATE(COALESCE(p.payment_date, p.created_at))
          ORDER BY DATE(COALESCE(p.payment_date, p.created_at)) ASC
        `,
        [startDate],
      ),
      this.userRepository.query(
        `
          SELECT
            DATE(u.created_at) AS date,
            COUNT(u.id)::int AS "newUsers"
          FROM users u
          WHERE u.created_at >= $1
          GROUP BY DATE(u.created_at)
          ORDER BY DATE(u.created_at) ASC
        `,
        [startDate],
      ),
      this.orderRepository.query(
        `
          SELECT
            o.status AS status,
            COUNT(o.id)::int AS count
          FROM orders o
          WHERE o.created_at >= $1
          GROUP BY o.status
          ORDER BY count DESC, o.status ASC
        `,
        [startDate],
      ),
      this.paymentRepository.query(
        `
          SELECT
            p.status AS status,
            COUNT(p.id)::int AS count,
            COALESCE(SUM(p.amount), 0)::float AS amount
          FROM payments p
          WHERE p.created_at >= $1
          GROUP BY p.status
          ORDER BY count DESC, p.status ASC
        `,
        [startDate],
      ),
      this.paymentRepository.query(
        `
          SELECT
            p.payment_method AS method,
            COUNT(p.id)::int AS count,
            COALESCE(SUM(p.amount), 0)::float AS amount
          FROM payments p
          WHERE p.created_at >= $1
          GROUP BY p.payment_method
          ORDER BY amount DESC, p.payment_method ASC
        `,
        [startDate],
      ),
      this.orderItemRepository.query(
        `
          SELECT
            p.id AS "productId",
            p.name AS name,
            COALESCE(SUM(oi.quantity), 0)::int AS "quantitySold",
            COALESCE(SUM(oi.quantity * oi.price_at_purchase), 0)::float AS revenue,
            COUNT(DISTINCT o.id)::int AS "orderCount",
            p.stock::int AS stock
          FROM order_items oi
          INNER JOIN orders o ON o.id = oi.order_id
          INNER JOIN products p ON p.id = oi.product_id
          WHERE o.created_at >= $1
            AND o.status IN (${revenueStatusSql})
          GROUP BY p.id, p.name, p.stock
          ORDER BY "quantitySold" DESC, revenue DESC, p.name ASC
          LIMIT 5
        `,
        [startDate],
      ),
      this.orderItemRepository.query(
        `
          SELECT
            COALESCE(c.id, 'uncategorized') AS "categoryId",
            COALESCE(c.name, 'Sans catégorie') AS name,
            COALESCE(SUM(oi.quantity), 0)::int AS "quantitySold",
            COALESCE(SUM(oi.quantity * oi.price_at_purchase), 0)::float AS revenue
          FROM order_items oi
          INNER JOIN orders o ON o.id = oi.order_id
          INNER JOIN products p ON p.id = oi.product_id
          LEFT JOIN categories c ON c.id = p.category_id
          WHERE o.created_at >= $1
            AND o.status IN (${revenueStatusSql})
          GROUP BY c.id, c.name
          ORDER BY revenue DESC, "quantitySold" DESC, name ASC
          LIMIT 6
        `,
        [startDate],
      ),
      this.articleRepository.query(
        `
          SELECT
            a.id AS "articleId",
            a.slug AS slug,
            a.title AS title,
            COALESCE(l.like_count, 0)::int AS "likeCount",
            COALESCE(c.comment_count, 0)::int AS "commentCount",
            (
              COALESCE(l.like_count, 0)
              + COALESCE(c.comment_count, 0) * 2
            )::int AS score,
            a.published_at AS "publishedAt"
          FROM articles a
          LEFT JOIN (
            SELECT article_id, COUNT(*) AS like_count
            FROM article_likes
            WHERE created_at >= $1
            GROUP BY article_id
          ) l ON l.article_id = a.id
          LEFT JOIN (
            SELECT article_id, COUNT(*) AS comment_count
            FROM article_comments
            WHERE is_approved = true
              AND created_at >= $1
            GROUP BY article_id
          ) c ON c.article_id = a.id
          WHERE a.is_published = true
          ORDER BY score DESC, a.published_at DESC NULLS LAST, a.created_at DESC
          LIMIT 5
        `,
        [startDate],
      ),
      this.orderRepository.query(
        `
          SELECT
            COALESCE(AVG(o.total_amount), 0)::float AS "averageOrderValue"
          FROM orders o
          WHERE o.created_at >= $1
            AND o.status IN (${revenueStatusSql})
        `,
        [startDate],
      ),
      this.orderRepository.query(
        `
          SELECT COUNT(*)::int AS count
          FROM (
            SELECT o.user_id
            FROM orders o
            WHERE o.created_at >= $1
              AND o.status <> '${OrderStatus.CANCELLED}'
            GROUP BY o.user_id
            HAVING COUNT(o.id) >= 2
          ) repeated_customers
        `,
        [startDate],
      ),
      this.subscriberRepository.count({ where: { isActive: true } }),
      this.articleRepository.count({ where: { isPublished: true } }),
      this.articleCommentRepository.query(
        `
          SELECT COUNT(ac.id)::int AS count
          FROM article_comments ac
          WHERE ac.is_approved = true
            AND ac.created_at >= $1
        `,
        [startDate],
      ),
      this.articleLikeRepository.query(
        `
          SELECT COUNT(al.id)::int AS count
          FROM article_likes al
          WHERE al.created_at >= $1
        `,
        [startDate],
      ),
      this.userRepository.query(
        `
          SELECT COUNT(u.id)::int AS count
          FROM users u
          WHERE u.created_at >= $1
        `,
        [startDate],
      ),
    ]);

    const salesTimelineMap = this.createTimelineMap(dates, (date) => ({
      date,
      orders: 0,
      paidOrders: 0,
      revenue: 0,
    }));
    const paymentTimelineMap = this.createTimelineMap(dates, (date) => ({
      date,
      payments: 0,
      amount: 0,
    }));
    const customerGrowthMap = this.createTimelineMap(dates, (date) => ({
      date,
      newUsers: 0,
    }));

    for (const row of salesRows as Array<Record<string, unknown>>) {
      const date = this.formatAnalyticsDate(row.date);
      if (!salesTimelineMap[date]) {
        continue;
      }

      salesTimelineMap[date] = {
        date,
        orders: this.toInteger(row.orders),
        paidOrders: this.toInteger(row.paidOrders),
        revenue: this.toNumber(row.revenue),
      };
    }

    for (const row of paymentRows as Array<Record<string, unknown>>) {
      const date = this.formatAnalyticsDate(row.date);
      if (!paymentTimelineMap[date]) {
        continue;
      }

      paymentTimelineMap[date] = {
        date,
        payments: this.toInteger(row.payments),
        amount: this.toNumber(row.amount),
      };
    }

    for (const row of customerGrowthRows as Array<Record<string, unknown>>) {
      const date = this.formatAnalyticsDate(row.date);
      if (!customerGrowthMap[date]) {
        continue;
      }

      customerGrowthMap[date] = {
        date,
        newUsers: this.toInteger(row.newUsers),
      };
    }

    const averageOrderValue = this.toNumber(
      (averageOrderValueRows as Array<Record<string, unknown>>)[0]
        ?.averageOrderValue,
    );
    const repeatCustomers = this.toInteger(
      (repeatCustomersRows as Array<Record<string, unknown>>)[0]?.count,
    );
    const approvedComments = this.toInteger(
      (approvedCommentsRows as Array<Record<string, unknown>>)[0]?.count,
    );
    const articleLikes = this.toInteger(
      (articleLikesRows as Array<Record<string, unknown>>)[0]?.count,
    );
    const newUsers = this.toInteger(
      (newUsersRows as Array<Record<string, unknown>>)[0]?.count,
    );

    return {
      periodDays: safeDays,
      generatedAt: new Date().toISOString(),
      overview: {
        averageOrderValue,
        repeatCustomers,
        activeSubscribers,
        publishedArticles,
        approvedComments,
        articleLikes,
        newUsers,
      },
      salesTimeline: dates.map((date) => salesTimelineMap[date]),
      paymentTimeline: dates.map((date) => paymentTimelineMap[date]),
      customerGrowth: dates.map((date) => customerGrowthMap[date]),
      orderStatusBreakdown: (
        orderStatusRows as Array<Record<string, unknown>>
      ).map((row) => ({
        status: this.toStringValue(row.status),
        count: this.toInteger(row.count),
      })),
      paymentStatusBreakdown: (
        paymentStatusRows as Array<Record<string, unknown>>
      ).map((row) => ({
        status: this.toStringValue(row.status),
        count: this.toInteger(row.count),
        amount: this.toNumber(row.amount),
      })),
      paymentMethodBreakdown: (
        paymentMethodRows as Array<Record<string, unknown>>
      ).map((row) => ({
        method: this.toStringValue(row.method),
        count: this.toInteger(row.count),
        amount: this.toNumber(row.amount),
      })),
      topProducts: (topProductsRows as Array<Record<string, unknown>>).map(
        (row) => ({
          productId: this.toStringValue(row.productId),
          name: this.toStringValue(row.name),
          quantitySold: this.toInteger(row.quantitySold),
          revenue: this.toNumber(row.revenue),
          orderCount: this.toInteger(row.orderCount),
          stock: this.toInteger(row.stock),
        }),
      ),
      categoryPerformance: (
        categoryPerformanceRows as Array<Record<string, unknown>>
      ).map((row) => ({
        categoryId: this.toStringValue(row.categoryId),
        name: this.toStringValue(row.name),
        quantitySold: this.toInteger(row.quantitySold),
        revenue: this.toNumber(row.revenue),
      })),
      topArticles: (topArticlesRows as Array<Record<string, unknown>>).map(
        (row) => ({
          articleId: this.toStringValue(row.articleId),
          slug: this.toStringValue(row.slug),
          title: this.toStringValue(row.title),
          likeCount: this.toInteger(row.likeCount),
          commentCount: this.toInteger(row.commentCount),
          score: this.toInteger(row.score),
          publishedAt: row.publishedAt
            ? new Date(this.toStringValue(row.publishedAt)).toISOString()
            : null,
        }),
      ),
    };
  }

  async countPendingReviews(): Promise<number> {
    return this.reviewRepository.count({
      where: { moderationStatus: ModerationStatus.PENDING },
    });
  }

  async countPendingReturns(): Promise<number> {
    return this.returnRepository.count({
      where: { status: ReturnStatus.REQUESTED },
    });
  }

  async countLowStockProducts(threshold = 5): Promise<number> {
    return this.productRepository
      .createQueryBuilder('product')
      .where('product.stock <= :threshold', { threshold })
      .getCount();
  }

  async sumRevenue(): Promise<number> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('COALESCE(SUM(order.totalAmount), 0)', 'total')
      .where('order.status IN (:...statuses)', {
        statuses: [
          OrderStatus.PAID,
          OrderStatus.SHIPPED,
          OrderStatus.DELIVERED,
        ],
      })
      .getRawOne<{ total: string }>();

    return Number(result?.total || 0);
  }
}
