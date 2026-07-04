import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../../services/database.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { AppRole } from '../../entities/user-role.entity';

@Injectable()
export class OrdersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async isAdmin(userId: string): Promise<boolean> {
    return this.databaseService.checkUserRole(userId, 'admin' as AppRole);
  }

  async findAll(userId: string, isAdmin: boolean) {
    if (isAdmin) {
      return await this.databaseService.findOrdersByUserId(undefined); // Fetch all orders for admin
    } else {
      return await this.databaseService.findOrdersByUserId(userId); // Fetch user's orders
    }
  }

  async findOne(orderId: string, userId: string, isAdmin: boolean) {
    const order = await this.databaseService.findOrderById(orderId, !isAdmin ? userId : undefined);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async create(createOrderDto: CreateOrderDto, userId: string) {
    // Verify the address belongs to the user
    const address = await this.databaseService.findAddressById(createOrderDto.address_id, userId);
    if (!address) {
      throw new BadRequestException('Invalid address');
    }

    // Verify all products exist and have enough stock
    for (const item of createOrderDto.items) {
      const product = await this.databaseService.findProductById(item.product_id);
      if (!product) {
        throw new BadRequestException(`Product ${item.product_id} not found`);
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for product ${item.product_id}`);
      }
    }

    // Calculate totals
    let subtotal = 0;
    for (const item of createOrderDto.items) {
      const product = await this.databaseService.findProductById(item.product_id);
      if (!product) {
        throw new BadRequestException(`Product ${item.product_id} not found`);
      }

      subtotal += Number(product.price) * item.quantity;
    }

    const shippingFee = subtotal > 100 ? 0 : 10; // Free shipping for orders over $100
    const totalAmount = subtotal + shippingFee;

    // Generate order number (simple implementation)
    const orderNumber = `ORD-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Math.random().toString(36).substring(2, 8)}`;

    // Create the order
    const order = await this.databaseService.createOrder({
      userId,
      addressId: createOrderDto.address_id,
      orderNumber,
      subtotal,
      shippingFee,
      totalAmount,
      notes: createOrderDto.notes
    });

    // Create order items and update stock
    for (const item of createOrderDto.items) {
      const product = await this.databaseService.findProductById(item.product_id);
      if (!product) {
        throw new BadRequestException(`Product ${item.product_id} not found`);
      }

      // Create order item
      await this.databaseService.createOrderItem({
        orderId: order.id,
        productId: item.product_id,
        quantity: item.quantity,
        priceAtPurchase: Number(product.price)
      });

      // Update product stock
      await this.databaseService.updateProduct(item.product_id, {
        stock: product.stock - item.quantity
      });
    }

    // Clear user's cart
    await this.databaseService.clearCart(userId);

    // Return the complete order
    const finalOrder = await this.databaseService.findOrderById(order.id, userId);
    if (!finalOrder) {
      throw new BadRequestException('Error creating order');
    }

    return finalOrder;
  }

  async updateStatus(orderId: string, updateOrderStatusDto: UpdateOrderStatusDto, userId: string, isAdmin: boolean) {
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can update order status');
    }

    const order = await this.databaseService.updateOrderStatus(orderId, updateOrderStatusDto.status);
    if (!order) {
      throw new BadRequestException('Error updating order status');
    }

    return order;
  }

  async getUserOrderStats(userId: string) {
    const orders = await this.databaseService.findOrdersByUserId(userId);
    
    const stats = {
      total_orders: orders.length,
      total_spent: orders.reduce((sum, order) => sum + Number(order.totalAmount), 0),
      pending_orders: orders.filter(order => ['pending', 'paid'].includes(order.status)).length,
      completed_orders: orders.filter(order => ['shipped', 'delivered'].includes(order.status)).length,
    };

    return stats;
  }

  async getAdminOrderStats() {
    // Fetch all orders
    const allOrders = await this.databaseService.findOrdersByUserId(undefined); // Fetch all orders for admin
    
    const stats = {
      total_orders: allOrders.length,
      total_revenue: allOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0),
      pending_orders: allOrders.filter(order => order.status === 'pending').length,
      processing_orders: allOrders.filter(order => order.status === 'paid').length,
      shipped_orders: allOrders.filter(order => order.status === 'shipped').length,
      delivered_orders: allOrders.filter(order => order.status === 'delivered').length,
    };

    return stats;
  }
}
