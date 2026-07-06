import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AppRole } from '../../entities/user-role.entity';
import {
  AdminAnalyticsQueryDto,
  AdminLogQueryDto,
  AdminPaymentQueryDto,
  DemoSeedDto,
  LogAdminActionDto,
  UpdatePaymentStatusDto,
} from './dto/admin.dto';
import { AdminService } from './admin.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AppRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('log-action')
  logAdminAction(
    @Body() logAdminActionDto: LogAdminActionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.adminService.logAdminAction(logAdminActionDto, userId);
  }

  @Get('logs')
  getAdminLogs(
    @CurrentUser('id') userId: string,
    @Query() query: AdminLogQueryDto,
  ) {
    return this.adminService.getAdminLogs(userId, query);
  }

  @Get('dashboard-stats')
  getDashboardStats(@CurrentUser('id') userId: string) {
    return this.adminService.getDashboardStats(userId);
  }

  @Get('analytics')
  getAnalytics(
    @CurrentUser('id') userId: string,
    @Query() query: AdminAnalyticsQueryDto,
  ) {
    return this.adminService.getAnalytics(userId, query.days);
  }

  @Post('demo-seed')
  seedDemo(@CurrentUser('id') userId: string, @Body() dto: DemoSeedDto) {
    return this.adminService.seedDemo(userId, dto);
  }

  @Get('payments/summary')
  getPaymentSummary(@CurrentUser('id') userId: string) {
    return this.adminService.getPaymentSummary(userId);
  }

  @Get('payments')
  getPayments(
    @CurrentUser('id') userId: string,
    @Query() query: AdminPaymentQueryDto,
  ) {
    return this.adminService.getPayments(userId, query);
  }

  @Patch('payments/:paymentId/status')
  updatePaymentStatus(
    @CurrentUser('id') userId: string,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @Body() dto: UpdatePaymentStatusDto,
  ) {
    return this.adminService.updatePaymentStatus(userId, paymentId, dto);
  }
}
