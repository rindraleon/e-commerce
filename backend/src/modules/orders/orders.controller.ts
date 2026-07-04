import * as common from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrdersService } from './orders.service';
import { DatabaseService } from '../../services/database.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';

@common.Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly databaseService: DatabaseService, // inject DB service
  ) {}

  @common.Get()
  @common.UseGuards(AuthGuard('jwt'))
  async findAll(@common.Req() req) {
    if (!req.user?.id) {
      throw new common.UnauthorizedException();
    }

    // protect against missing service or missing method
    const canCheckRole = !!this.databaseService && typeof (this.databaseService as any).checkUserRole === 'function';

    if (!canCheckRole) {
      // fallback: return orders for the current user only
      // adjust method name if your OrdersService uses a different one
      if (typeof (this.ordersService as any).findByUser === 'function') {
        return (this.ordersService as any).findByUser(req.user.id);
      }
      // best-effort fallback: call findAll with userId and isAdmin=false
      return this.ordersService.findAll(req.user.id, false);
    }

    const isAdmin = await (this.databaseService as any).checkUserRole(req.user.id, 'admin');

    if (isAdmin) {
      // admin: fetch all orders
      return this.ordersService.findAll(req.user.id, true);
    }
    // non-admin: return only user's orders
    if (typeof (this.ordersService as any).findByUser === 'function') {
      return (this.ordersService as any).findByUser(req.user.id);
    }
    return this.ordersService.findAll(req.user.id, false);
  }

  @common.Get(':orderId')
  async findOne(@common.Param('orderId', common.ParseUUIDPipe) orderId: string, @common.Req() req) {
    const isAdmin = await (this.databaseService as any).checkUserRole(req.user.id, 'admin');
    return this.ordersService.findOne(orderId, req.user.id, isAdmin);
  }

  @common.Post()
  async create(@common.Body() createOrderDto: CreateOrderDto, @common.Req() req) {
    return this.ordersService.create(createOrderDto, req.user.id);
  }

  @common.Put(':orderId/status')
  async updateStatus(
    @common.Param('orderId', common.ParseUUIDPipe) orderId: string,
    @common.Body() updateOrderStatusDto: UpdateOrderStatusDto,
    @common.Req() req,
  ) {
    const isAdmin = await this.ordersService['supabaseService'].checkUserRole(req.user.id, 'admin');
    return this.ordersService.updateStatus(orderId, updateOrderStatusDto, req.user.id, isAdmin);
  }

  @common.Get('stats/user')
  async getUserOrderStats(@common.Req() req) {
    return this.ordersService.getUserOrderStats(req.user.id);
  }

  @common.Get('stats/admin')
  async getAdminOrderStats(@common.Req() req) {
    const isAdmin = await this.ordersService['supabaseService'].checkUserRole(req.user.id, 'admin');
    if (!isAdmin) {
      throw new Error('Unauthorized'); // In a real app, you'd use proper guards
    }
    return this.ordersService.getAdminOrderStats();
  }
}