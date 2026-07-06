import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { seedDemoData } from '../../common/seed/demo-seed';
import { DatabaseService } from '../../database/database.service';
import { OrderStatus } from '../../entities/order.entity';
import { PaymentStatus } from '../../entities/payment.entity';
import { AppRole } from '../../entities/user-role.entity';
import {
  AdminLogQueryDto,
  AdminPaymentQueryDto,
  DemoSeedDto,
  LogAdminActionDto,
  UpdatePaymentStatusDto,
} from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly dataSource: DataSource,
  ) {}

  async ensureAdmin(userId: string) {
    const isAdmin = await this.databaseService.checkUserRole(
      userId,
      AppRole.ADMIN,
    );
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can perform this action');
    }
  }

  async logAdminAction(logAdminActionDto: LogAdminActionDto, adminId: string) {
    await this.ensureAdmin(adminId);

    const logEntry = await this.databaseService.createAdminLog({
      adminId,
      action: logAdminActionDto.action,
      details:
        typeof logAdminActionDto.details === 'string'
          ? { message: logAdminActionDto.details }
          : logAdminActionDto.details || {},
    });

    return { message: 'Admin action logged successfully', logEntry };
  }

  async getAdminLogs(adminId: string, query: AdminLogQueryDto) {
    await this.ensureAdmin(adminId);
    return this.databaseService.findAdminLogs({
      page: query.page,
      limit: query.limit,
      search: query.search,
      sortBy: query.sortBy,
      order: query.order?.toUpperCase() as 'ASC' | 'DESC' | undefined,
    });
  }

  async getDashboardStats(adminId: string) {
    await this.ensureAdmin(adminId);

    const [
      totalUsers,
      totalProducts,
      orders,
      pendingReviews,
      pendingReturns,
      lowStockProducts,
      totalRevenue,
      paymentsOverview,
    ] = await Promise.all([
      this.databaseService.countUsers(),
      this.databaseService.countProducts(),
      this.databaseService.findOrders({ page: 1, limit: 5 }, adminId, true),
      this.databaseService.countPendingReviews(),
      this.databaseService.countPendingReturns(),
      this.databaseService.countLowStockProducts(),
      this.databaseService.sumRevenue(),
      this.databaseService.getPaymentSummary(),
    ]);

    return {
      totalUsers,
      totalProducts,
      totalOrders: orders.meta.totalItems,
      totalRevenue,
      lowStockProducts,
      pendingReviews,
      pendingReturns,
      recentOrders: orders.data.slice(0, 5),
      paymentsOverview,
    };
  }

  async getAnalytics(adminId: string, days = 30) {
    await this.ensureAdmin(adminId);
    return this.databaseService.getAdminAnalytics(days);
  }

  async seedDemo(adminId: string, dto: DemoSeedDto = {}) {
    await this.ensureAdmin(adminId);

    const summary = await seedDemoData(this.dataSource, {
      reset: Boolean(dto.reset),
    });

    return {
      message: dto.reset
        ? 'Demo data reset and seeded successfully'
        : 'Demo data seeded successfully',
      summary,
    };
  }

  async getPaymentSummary(adminId: string) {
    await this.ensureAdmin(adminId);
    return this.databaseService.getPaymentSummary();
  }

  async getPayments(adminId: string, query: AdminPaymentQueryDto) {
    await this.ensureAdmin(adminId);
    return this.databaseService.findPayments({
      page: query.page,
      limit: query.limit,
      search: query.search,
      status: query.status,
      paymentMethod: query.payment_method,
      sortBy: query.sortBy,
      order: query.order?.toUpperCase() as 'ASC' | 'DESC' | undefined,
    });
  }

  async updatePaymentStatus(
    adminId: string,
    paymentId: string,
    dto: UpdatePaymentStatusDto,
  ) {
    await this.ensureAdmin(adminId);

    const payment = await this.databaseService.findPaymentById(paymentId);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const updatedPayment = await this.databaseService.updatePayment(paymentId, {
      status: dto.status,
    });

    if (!updatedPayment) {
      throw new NotFoundException('Payment not found');
    }

    const orderStatusMap: Partial<Record<PaymentStatus, OrderStatus>> = {
      [PaymentStatus.COMPLETED]: OrderStatus.PAID,
      [PaymentStatus.REFUNDED]: OrderStatus.CANCELLED,
    };

    const mappedOrderStatus = orderStatusMap[dto.status];
    if (mappedOrderStatus) {
      await this.databaseService.updateOrderStatus(
        payment.orderId,
        mappedOrderStatus,
      );
    }

    return updatedPayment;
  }
}
