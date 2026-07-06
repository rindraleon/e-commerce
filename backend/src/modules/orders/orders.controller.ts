import * as common from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import {
  buildPaymentProofPublicPath,
  paymentProofMulterOptions,
} from '../../common/utils/upload.util';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AppRole } from '../../entities/user-role.entity';
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  OrderQueryDto,
  UpdateOrderPaymentDto,
  UpdateOrderStatusDto,
} from './dto/order.dto';

interface UploadedProofFile {
  filename: string;
}

@common.UseGuards(JwtAuthGuard)
@common.Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @common.Get()
  async findAll(
    @common.Query() query: OrderQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    const isAdmin = await this.ordersService.isAdmin(userId);
    return this.ordersService.findAll(query, userId, isAdmin);
  }

  @common.Get('stats/user')
  getUserOrderStats(@CurrentUser('id') userId: string) {
    return this.ordersService.getUserOrderStats(userId);
  }

  @common.Get('stats/admin')
  @common.UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN)
  getAdminOrderStats(@CurrentUser('id') userId: string) {
    return this.ordersService.getAdminOrderStats(userId);
  }

  @common.Get(':orderId')
  async findOne(
    @common.Param('orderId', common.ParseUUIDPipe) orderId: string,
    @CurrentUser('id') userId: string,
  ) {
    const isAdmin = await this.ordersService.isAdmin(userId);
    return this.ordersService.findOne(orderId, userId, isAdmin);
  }

  @common.Get(':orderId/invoice')
  async getInvoice(
    @common.Param('orderId', common.ParseUUIDPipe) orderId: string,
    @CurrentUser('id') userId: string,
    @common.Res() response: Response,
  ) {
    const pdfBuffer = await this.ordersService.generateInvoice(orderId, userId);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="invoice-${orderId}.pdf"`,
    );
    response.send(pdfBuffer);
  }

  @common.Post()
  create(
    @common.Body() createOrderDto: CreateOrderDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.ordersService.create(createOrderDto, userId);
  }

  @common.Post('with-proof')
  @common.UseInterceptors(
    FileInterceptor('payment_proof', paymentProofMulterOptions),
  )
  createWithProof(
    @common.Body() body: Record<string, string>,
    @common.UploadedFile() file: UploadedProofFile | undefined,
    @CurrentUser('id') userId: string,
  ) {
    const createOrderDto: CreateOrderDto = {
      address_id: body.address_id,
      items: JSON.parse(body.items || '[]') as CreateOrderDto['items'],
      notes: body.notes,
      coupon_code: body.coupon_code,
      payment_method: body.payment_method as CreateOrderDto['payment_method'],
      payment_reference: body.payment_reference,
      payer_phone: body.payer_phone,
    };

    return this.ordersService.create(
      createOrderDto,
      userId,
      file ? buildPaymentProofPublicPath(file.filename) : null,
    );
  }

  @common.Patch(':orderId/payment')
  @common.UseInterceptors(
    FileInterceptor('payment_proof', paymentProofMulterOptions),
  )
  updatePayment(
    @common.Param('orderId', common.ParseUUIDPipe) orderId: string,
    @common.Body() body: Record<string, string>,
    @common.UploadedFile() file: UploadedProofFile | undefined,
    @CurrentUser('id') userId: string,
  ) {
    const dto: UpdateOrderPaymentDto = {
      payment_method:
        body.payment_method as UpdateOrderPaymentDto['payment_method'],
      payment_reference: body.payment_reference,
      payer_phone: body.payer_phone,
    };

    return this.ordersService.updatePaymentDetails(
      orderId,
      userId,
      dto,
      file ? buildPaymentProofPublicPath(file.filename) : null,
    );
  }

  @common.Put(':orderId/status')
  @common.UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN)
  updateStatus(
    @common.Param('orderId', common.ParseUUIDPipe) orderId: string,
    @common.Body() updateOrderStatusDto: UpdateOrderStatusDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.ordersService.updateStatus(
      orderId,
      updateOrderStatusDto,
      userId,
    );
  }
}
