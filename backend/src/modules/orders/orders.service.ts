import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { Order, OrderStatus } from '../../entities/order.entity';
import { PaymentMethod, PaymentStatus } from '../../entities/payment.entity';
import { AppRole } from '../../entities/user-role.entity';
import { CouponsService } from '../coupons/coupons.service';
import {
  CreateOrderDto,
  OrderQueryDto,
  UpdateOrderStatusDto,
} from './dto/order.dto';
import { InvoiceService } from './invoice.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly invoiceService: InvoiceService,
    private readonly couponsService: CouponsService,
  ) {}

  async isAdmin(userId: string): Promise<boolean> {
    return this.databaseService.checkUserRole(userId, AppRole.ADMIN);
  }

  async findAll(query: OrderQueryDto, userId: string, isAdmin: boolean) {
    return this.databaseService.findOrders(
      {
        page: query.page,
        limit: query.limit,
        search: query.search,
        status: query.status,
        sortBy: query.sortBy,
        order: query.order?.toUpperCase() as 'ASC' | 'DESC' | undefined,
      },
      userId,
      isAdmin,
    );
  }

  private async getAccessibleOrder(
    orderId: string,
    userId: string,
    isAdmin: boolean,
  ): Promise<Order> {
    const order = await this.databaseService.findOrderById(
      orderId,
      userId,
      isAdmin,
    );
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async findOne(orderId: string, userId: string, isAdmin: boolean) {
    return this.getAccessibleOrder(orderId, userId, isAdmin);
  }

  async create(
    createOrderDto: CreateOrderDto,
    userId: string,
    paymentProofUrl?: string | null,
  ) {
    const address = await this.databaseService.findAddressById(
      createOrderDto.address_id,
      userId,
    );
    if (!address) {
      throw new BadRequestException('Invalid address');
    }

    if (!createOrderDto.payment_reference?.trim()) {
      throw new BadRequestException('Payment reference is required');
    }

    if (createOrderDto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    let subtotal = 0;
    const orderValidationItems: Array<{
      product_id: string;
      category_id?: string;
      quantity: number;
      unit_price: number;
    }> = [];

    for (const item of createOrderDto.items) {
      const product = await this.databaseService.findProductById(
        item.product_id,
      );
      if (!product) {
        throw new BadRequestException(`Product ${item.product_id} not found`);
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product ${product.name}`,
        );
      }

      const unitPrice = Number(product.price);
      subtotal += unitPrice * item.quantity;
      orderValidationItems.push({
        product_id: item.product_id,
        category_id: product.categoryId,
        quantity: item.quantity,
        unit_price: unitPrice,
      });
    }

    const shippingFee = subtotal >= 100 ? 0 : 10;

    let discountAmount = 0;
    let couponCode: string | null = null;
    let couponId: string | null = null;

    if (createOrderDto.coupon_code?.trim()) {
      const validatedCoupon =
        await this.couponsService.getValidatedCouponForOrder(
          createOrderDto.coupon_code,
          subtotal,
          userId,
          orderValidationItems,
        );
      discountAmount = validatedCoupon.discountAmount;
      couponCode = validatedCoupon.coupon.code;
      couponId = validatedCoupon.coupon.id;
    }

    const totalAmount = Math.max(subtotal + shippingFee - discountAmount, 0);
    const orderNumber = `ORD-${Date.now()}`;

    const order = await this.databaseService.createOrder({
      userId,
      addressId: createOrderDto.address_id,
      orderNumber,
      subtotal,
      shippingFee,
      discountAmount,
      totalAmount,
      couponCode,
      notes: createOrderDto.notes,
      status: OrderStatus.PENDING,
    });

    for (const item of createOrderDto.items) {
      const product = await this.databaseService.findProductById(
        item.product_id,
      );
      if (!product) {
        throw new BadRequestException(`Product ${item.product_id} not found`);
      }

      await this.databaseService.createOrderItem({
        orderId: order.id,
        productId: item.product_id,
        quantity: item.quantity,
        priceAtPurchase: Number(product.price),
      });

      await this.databaseService.updateProduct(item.product_id, {
        stock: product.stock - item.quantity,
      });
    }

    await this.databaseService.createPayment({
      orderId: order.id,
      paymentMethod: createOrderDto.payment_method,
      amount: totalAmount,
      status: PaymentStatus.PENDING,
      transactionId: createOrderDto.payment_reference.trim(),
      payerPhone: createOrderDto.payer_phone?.trim() || null,
      proofImageUrl: paymentProofUrl || null,
      paymentDate: new Date(),
    });

    if (couponId) {
      await this.couponsService.markCouponAsUsed(couponId, userId, order.id);
    }

    await this.databaseService.clearCart(userId);

    const finalOrder = await this.databaseService.findOrderById(
      order.id,
      userId,
      false,
    );
    if (!finalOrder) {
      throw new BadRequestException('Error creating order');
    }

    return finalOrder;
  }

  async updatePaymentDetails(
    orderId: string,
    userId: string,
    paymentData: {
      payment_method?: PaymentMethod;
      payment_reference?: string;
      payer_phone?: string;
    },
    paymentProofUrl?: string | null,
  ) {
    const order = await this.databaseService.findOrderById(
      orderId,
      userId,
      false,
    );
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cancelled orders cannot be updated');
    }

    const payment =
      order.payments[0] ||
      (await this.databaseService.findPaymentByOrderId(orderId));
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const updatedPayment = await this.databaseService.updatePayment(
      payment.id,
      {
        paymentMethod: paymentData.payment_method ?? payment.paymentMethod,
        transactionId:
          paymentData.payment_reference?.trim() || payment.transactionId,
        payerPhone: paymentData.payer_phone?.trim() || payment.payerPhone,
        proofImageUrl: paymentProofUrl || payment.proofImageUrl,
        paymentDate: new Date(),
        status: payment.status,
      },
    );

    if (!updatedPayment) {
      throw new BadRequestException('Unable to update payment details');
    }

    return this.databaseService.findOrderById(orderId, userId, false);
  }

  async generateInvoice(orderId: string, userId: string) {
    const isAdmin = await this.isAdmin(userId);
    const order = await this.getAccessibleOrder(orderId, userId, isAdmin);
    return this.invoiceService.generateInvoiceBuffer(order);
  }

  async updateStatus(
    orderId: string,
    updateOrderStatusDto: UpdateOrderStatusDto,
    userId: string,
  ) {
    const isAdmin = await this.databaseService.checkUserRole(
      userId,
      AppRole.ADMIN,
    );
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can update order status');
    }

    const order = await this.databaseService.updateOrderStatus(
      orderId,
      updateOrderStatusDto.status,
    );
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async getUserOrderStats(userId: string) {
    const orders = (
      await this.databaseService.findOrders(
        { page: 1, limit: 1000 },
        userId,
        false,
      )
    ).data;

    return {
      totalOrders: orders.length,
      totalSpent: orders.reduce(
        (sum, order) => sum + Number(order.totalAmount),
        0,
      ),
      pendingOrders: orders.filter((order) =>
        [OrderStatus.PENDING, OrderStatus.PAID].includes(order.status),
      ).length,
      completedOrders: orders.filter((order) =>
        [OrderStatus.SHIPPED, OrderStatus.DELIVERED].includes(order.status),
      ).length,
    };
  }

  async getAdminOrderStats(adminId: string) {
    const isAdmin = await this.databaseService.checkUserRole(
      adminId,
      AppRole.ADMIN,
    );
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can view admin stats');
    }

    const allOrders = (
      await this.databaseService.findOrders(
        { page: 1, limit: 1000 },
        adminId,
        true,
      )
    ).data;

    return {
      totalOrders: allOrders.length,
      totalRevenue: allOrders.reduce(
        (sum, order) => sum + Number(order.totalAmount),
        0,
      ),
      pendingOrders: allOrders.filter(
        (order) => order.status === OrderStatus.PENDING,
      ).length,
      processingOrders: allOrders.filter(
        (order) => order.status === OrderStatus.PAID,
      ).length,
      shippedOrders: allOrders.filter(
        (order) => order.status === OrderStatus.SHIPPED,
      ).length,
      deliveredOrders: allOrders.filter(
        (order) => order.status === OrderStatus.DELIVERED,
      ).length,
    };
  }
}
