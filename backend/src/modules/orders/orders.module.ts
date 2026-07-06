import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CouponsModule } from '../coupons/coupons.module';
import { DatabaseModule } from '../database/database.module';
import { InvoiceService } from './invoice.service';

@Module({
  imports: [DatabaseModule, CouponsModule],
  controllers: [OrdersController],
  providers: [OrdersService, RolesGuard, InvoiceService],
  exports: [OrdersService, InvoiceService],
})
export class OrdersModule {}
