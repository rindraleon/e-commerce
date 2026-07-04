import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial, FindManyOptions } from 'typeorm';
import { User } from '../entities/user.entity';
import { Profile } from '../entities/profile.entity';
import { UserRole, AppRole } from '../entities/user-role.entity';
import { Category } from '../entities/category.entity';
import { Product } from '../entities/product.entity';
import { ProductImage } from '../entities/product-image.entity';
import { Address } from '../entities/address.entity';
import { CartItem } from '../entities/cart-item.entity';
import { Order, OrderStatus } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Payment, PaymentStatus, PaymentMethod } from '../entities/payment.entity';
import { Review, ModerationStatus } from '../entities/review.entity';
import { Return, ReturnStatus } from '../entities/return.entity';
import { AdminLog } from '../entities/admin-log.entity';

@Injectable()
export class DatabaseService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    
    @InjectRepository(ProductImage)
    private productImageRepository: Repository<ProductImage>,
    
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
    
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    
    @InjectRepository(Return)
    private returnRepository: Repository<Return>,
    
    @InjectRepository(AdminLog)
    private adminLogRepository: Repository<AdminLog>,
  ) {}

  // User methods
  async createUser(userData: DeepPartial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return await this.userRepository.save(user);
  }

  async findUserById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id },
      relations: ['profiles', 'userRoles']
    });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email },
      relations: ['profiles', 'userRoles']
    });
  }

  async findUsers(): Promise<User[]> {
    return await this.userRepository.find({
      relations: ['profiles', 'userRoles']
    });
  }

  async updateUser(id: string, userData: DeepPartial<User>): Promise<User | null> {
    await this.userRepository.update(id, userData);
    return await this.findUserById(id);
  }

  // Profile methods
  async createProfile(profileData: DeepPartial<Profile>): Promise<Profile> {
    const profile = this.profileRepository.create(profileData);
    return await this.profileRepository.save(profile);
  }

  async findProfileByUserId(userId: string): Promise<Profile | null> {
    return await this.profileRepository.findOne({
      where: { userId }
    });
  }

  async updateProfile(userId: string, profileData: DeepPartial<Profile>): Promise<Profile | null> {
    await this.profileRepository.update({ userId }, profileData);
    return await this.findProfileByUserId(userId);
  }

  // User Role methods
  async createUserRole(roleData: DeepPartial<UserRole>): Promise<UserRole> {
    const role = this.userRoleRepository.create(roleData);
    return await this.userRoleRepository.save(role);
  }

  async getUserRole(userId: string): Promise<AppRole | undefined> {
    const userRole = await this.userRoleRepository.findOne({
      where: { userId }
    });
    return userRole?.role;
  }

  async setUserRole(userId: string, role: AppRole): Promise<UserRole> {
    // Remove existing roles
    await this.userRoleRepository.delete({ userId });
    
    // Create new role
    return await this.createUserRole({
      userId,
      role
    });
  }

  async checkUserRole(userId: string, role: AppRole): Promise<boolean> {
    const userRole = await this.getUserRole(userId);
    return userRole === role;
  }

  // Category methods
  async createCategory(categoryData: DeepPartial<Category>): Promise<Category> {
    const category = this.categoryRepository.create(categoryData);
    return await this.categoryRepository.save(category);
  }

  async findCategories(options?: FindManyOptions<Category>): Promise<Category[]> {
    return await this.categoryRepository.find(options);
  }

  async findCategoryById(id: string): Promise<Category | null> {
    return await this.categoryRepository.findOne({
      where: { id },
      relations: ['products']
    });
  }

  async updateCategory(id: string, categoryData: DeepPartial<Category>): Promise<Category | null> {
    await this.categoryRepository.update(id, categoryData);
    return await this.findCategoryById(id);
  }

  async deleteCategory(id: string): Promise<void> {
    await this.categoryRepository.delete(id);
  }

  // Product methods
  async createProduct(productData: DeepPartial<Product>): Promise<Product> {
    const product = this.productRepository.create(productData);
    return await this.productRepository.save(product);
  }

  async findProducts(options?: FindManyOptions<Product>): Promise<Product[]> {
    return await this.productRepository.find(options);
  }

  async findProductById(id: string): Promise<Product | null> {
    return await this.productRepository.findOne({
      where: { id },
      relations: ['category', 'images']
    });
  }

  async updateProduct(id: string, productData: DeepPartial<Product>): Promise<Product | null> {
    await this.productRepository.update(id, productData);
    return await this.findProductById(id);
  }

  async deleteProduct(id: string): Promise<void> {
    await this.productRepository.delete(id);
  }

  // Product Image methods
  async createProductImage(imageData: DeepPartial<ProductImage>): Promise<ProductImage> {
    const image = this.productImageRepository.create(imageData);
    return await this.productImageRepository.save(image);
  }

  async findProductImagesByProductId(productId: string): Promise<ProductImage[]> {
    return await this.productImageRepository.find({
      where: { productId }
    });
  }

  async deleteProductImage(id: string): Promise<void> {
    await this.productImageRepository.delete(id);
  }

  // Address methods
  async createAddress(addressData: DeepPartial<Address>): Promise<Address> {
    const address = this.addressRepository.create(addressData);
    return await this.addressRepository.save(address);
  }

  async findAddressesByUserId(userId: string): Promise<Address[]> {
    return await this.addressRepository.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' }
    });
  }

  async findAddressById(id: string, userId: string): Promise<Address | null> {
    return await this.addressRepository.findOne({
      where: { id, userId }
    });
  }

  async updateAddress(id: string, addressData: DeepPartial<Address>): Promise<Address | null> {
    const userId = addressData.userId;
    if (!userId) {
      return null;
    }
    await this.addressRepository.update(id, addressData);
    return await this.findAddressById(id, userId);
  }

  async deleteAddress(id: string, userId: string): Promise<void> {
    await this.addressRepository.delete({ id, userId });
  }

  async setDefaultAddress(addressId: string, userId: string): Promise<Address> {
    // Unset all other default addresses for this user
    await this.addressRepository.update(
      { userId, isDefault: true },
      { isDefault: false }
    );

    // Set the selected address as default
    await this.addressRepository.update(
      { id: addressId, userId },
      { isDefault: true }
    );

    const address = await this.findAddressById(addressId, userId);
    if (!address) {
      throw new Error('Address not found');
    }
    return address;
  }

  async unsetDefaultAddresses(userId: string): Promise<void> {
    await this.addressRepository.update(
      { userId, isDefault: true },
      { isDefault: false }
    );
  }

  // Cart methods
  async addToCart(cartItemData: DeepPartial<CartItem>): Promise<CartItem> {
    // Check if item already exists in cart
    const existingItem = await this.cartItemRepository.findOne({
      where: { userId: cartItemData.userId, productId: cartItemData.productId }
    });

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + (cartItemData.quantity || 0);
      await this.cartItemRepository.update(existingItem.id, { quantity: newQuantity });
      const updatedItem = await this.cartItemRepository.findOne({ where: { id: existingItem.id }});
      if (!updatedItem) {
        throw new Error('Failed to update cart item');
      }
      return updatedItem;
    } else {
      // Create new cart item
      const cartItem = this.cartItemRepository.create(cartItemData);
      return await this.cartItemRepository.save(cartItem);
    }
  }

  async findCartItemsByUserId(userId: string): Promise<CartItem[]> {
    return await this.cartItemRepository.find({
      where: { userId },
      relations: ['product'],
      order: { addedAt: 'DESC' }
    });
  }

  async updateCartItem(id: string, cartItemData: DeepPartial<CartItem>): Promise<CartItem | null> {
    await this.cartItemRepository.update(id, cartItemData);
    return await this.cartItemRepository.findOne({
      where: { id },
      relations: ['product']
    });
  }

  async removeFromCart(id: string, userId: string): Promise<void> {
    await this.cartItemRepository.delete({ id, userId });
  }

  async clearCart(userId: string): Promise<void> {
    await this.cartItemRepository.delete({ userId });
  }

  async getCartItemCount(userId: string): Promise<number> {
    return await this.cartItemRepository.count({ where: { userId } });
  }

  // Order methods
  async createOrder(orderData: DeepPartial<Order>): Promise<Order> {
    const order = this.orderRepository.create(orderData);
    return await this.orderRepository.save(order);
  }

  async findOrdersByUserId(userId: string | null | undefined): Promise<Order[]> {
    if (userId === null || userId === undefined) {
      // Fetch all orders (for admin)
      return await this.orderRepository.find({
        relations: ['address', 'orderItems', 'orderItems.product', 'payments'],
        order: { createdAt: 'DESC' }
      });
    } else {
      // Fetch orders for specific user
      return await this.orderRepository.find({
        where: { userId },
        relations: ['address', 'orderItems', 'orderItems.product', 'payments'],
        order: { createdAt: 'DESC' }
      });
    }
  }

  async findOrderById(id: string, userId?: string): Promise<Order | null> {
    const whereCondition: any = { id };
    if (userId) {
      whereCondition.userId = userId;
    }
    
    return await this.orderRepository.findOne({
      where: whereCondition,
      relations: ['address', 'orderItems', 'orderItems.product', 'payments', 'user']
    });
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order | null> {
    await this.orderRepository.update(orderId, { status });
    return await this.findOrderById(orderId);
  }

  // Order Item methods
  async createOrderItem(orderItemData: DeepPartial<OrderItem>): Promise<OrderItem> {
    const orderItem = this.orderItemRepository.create(orderItemData);
    return await this.orderItemRepository.save(orderItem);
  }

  // Payment methods
  async createPayment(paymentData: DeepPartial<Payment>): Promise<Payment> {
    const payment = this.paymentRepository.create(paymentData);
    return await this.paymentRepository.save(payment);
  }

  // Review methods
  async createReview(reviewData: DeepPartial<Review>): Promise<Review> {
    const review = this.reviewRepository.create(reviewData);
    return await this.reviewRepository.save(review);
  }

  async findReviewsByProductId(productId: string): Promise<Review[]> {
    return await this.reviewRepository.find({
      where: { 
        productId,
        moderationStatus: ModerationStatus.APPROVED
      },
      relations: ['user', 'product'],
      order: { createdAt: 'DESC' }
    });
  }

  async findReviewById(id: string): Promise<Review | null> {
    return await this.reviewRepository.findOne({
      where: { id },
      relations: ['user', 'product']
    });
  }

  async updateReviewStatus(reviewId: string, status: ModerationStatus): Promise<Review | null> {
    await this.reviewRepository.update(reviewId, { moderationStatus: status });
    return await this.findReviewById(reviewId);
  }

  async findUserReviews(userId: string | null | undefined): Promise<Review[]> {
    if (!userId) {
      return await this.reviewRepository.find({
        relations: ['user', 'product'],
        order: { createdAt: 'DESC' }
      });
    }
    return await this.reviewRepository.find({
      where: { userId },
      relations: ['user', 'product'],
      order: { createdAt: 'DESC' }
    });
  }

  // Return methods
  async createReturn(returnData: DeepPartial<Return>): Promise<Return> {
    const returnEntity = this.returnRepository.create(returnData);
    return await this.returnRepository.save(returnEntity);
  }

  async findReturnsByUserId(userId: string | null | undefined): Promise<Return[]> {
    if (!userId) {
      return await this.returnRepository.find({
        relations: ['order', 'user'],
        order: { requestedAt: 'DESC' }
      });
    }
    return await this.returnRepository.find({
      where: { userId },
      relations: ['order', 'user'],
      order: { requestedAt: 'DESC' }
    });
  }

  async findReturnById(id: string, userId?: string): Promise<Return | null> {
    const whereCondition: any = { id };
    if (userId) {
      whereCondition.userId = userId;
    }
    
    return await this.returnRepository.findOne({
      where: whereCondition,
      relations: ['order', 'user']
    });
  }

  async updateReturnStatus(returnId: string, status: ReturnStatus): Promise<Return | null> {
    await this.returnRepository.update(returnId, { status });
    return await this.findReturnById(returnId);
  }

  // Admin Log methods
  async createAdminLog(logData: DeepPartial<AdminLog>): Promise<AdminLog> {
    const log = this.adminLogRepository.create(logData);
    return await this.adminLogRepository.save(log);
  }

  async findAdminLogs(): Promise<AdminLog[]> {
    return await this.adminLogRepository.find({
      order: { createdAt: 'DESC' },
      take: 100
    });
  }
}