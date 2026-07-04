import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../services/database.service';
import { LogAdminActionDto } from './dto/admin.dto';
import { AppRole } from '../../entities/user-role.entity';

@Injectable()
export class AdminService {
  constructor(private readonly databaseService: DatabaseService) {}

  async logAdminAction(logAdminActionDto: LogAdminActionDto, adminId: string) {
    // Check if user is admin
    const isAdmin = await this.databaseService.checkUserRole(adminId, 'admin' as AppRole);
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can perform this action');
    }

    // Create admin log entry
    const logEntry = await this.databaseService.createAdminLog({
      adminId,
      action: logAdminActionDto.action,
      details: logAdminActionDto.details || '{}'
    });

    return { message: 'Admin action logged successfully', logEntry };
  }

  async getAdminLogs(adminId: string) {
    // Check if user is admin
    const isAdmin = await this.databaseService.checkUserRole(adminId, 'admin' as AppRole);
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can view admin logs');
    }

    const logs = await this.databaseService.findAdminLogs();
    return logs;
  }

  async getDashboardStats(adminId: string) {
    // Check if user is admin
    const isAdmin = await this.databaseService.checkUserRole(adminId, 'admin' as AppRole);
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can view dashboard stats');
    }

    // Get various statistics
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalReviews,
      allReturns,
      allOrders
    ] = await Promise.all([
      this.databaseService.findUsers(),
      this.databaseService.findProducts(),
      this.databaseService.findOrdersByUserId(null), // All orders
      this.databaseService.findUserReviews(null), // All reviews
      this.databaseService.findReturnsByUserId(null), // All returns
      this.databaseService.findOrdersByUserId(null) // All orders for revenue calculation
    ]);

    // Filter based on status
    const filteredPendingReviews = totalReviews.filter(review => review.moderationStatus === 'pending');
    const filteredPendingReturns = allReturns.filter(ret => ret.status === 'requested');
    const filteredRecentOrders = allOrders.slice(0, 5);

    return {
      total_users: totalUsers.length,
      total_products: totalProducts.length,
      total_orders: totalOrders.length,
      total_reviews: totalReviews.length,
      pending_reviews: filteredPendingReviews.length,
      pending_returns: filteredPendingReturns.length,
      recent_orders: filteredRecentOrders,
      total_revenue: filteredRecentOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0)
    };
  }
}