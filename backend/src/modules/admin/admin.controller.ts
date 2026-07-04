import { Controller, Get, Post, Body, UseGuards, Req, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { LogAdminActionDto } from './dto/admin.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('log-action')
  async logAdminAction(@Body() logAdminActionDto: LogAdminActionDto, @Req() req) {
    return this.adminService.logAdminAction(logAdminActionDto, req.user.id);
  }

  @Get('logs')
  async getAdminLogs(@Req() req) {
    return this.adminService.getAdminLogs(req.user.id);
  }

  @Get('dashboard-stats')
  async getDashboardStats(@Req() req) {
    return this.adminService.getDashboardStats(req.user.id);
  }
}