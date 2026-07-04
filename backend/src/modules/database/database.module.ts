import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseService } from '../../services/database.service';
import { User } from '../../entities/user.entity';
import { Profile } from '../../entities/profile.entity';
import { UserRole } from '../../entities/user-role.entity';
import { Category } from '../../entities/category.entity';
import { Product } from '../../entities/product.entity';
import { ProductImage } from '../../entities/product-image.entity';
import { Address } from '../../entities/address.entity';
import { CartItem } from '../../entities/cart-item.entity';
import { Order } from '../../entities/order.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { Payment } from '../../entities/payment.entity';
import { Review } from '../../entities/review.entity';
import { Return } from '../../entities/return.entity';
import { AdminLog } from '../../entities/admin-log.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mariadb',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'eshop',
      entities: [
        User,
        Profile,
        UserRole,
        Category,
        Product,
        ProductImage,
        Address,
        CartItem,
        Order,
        OrderItem,
        Payment,
        Review,
        Return,
        AdminLog
      ],
      synchronize: true, // Note: Only use this in development
      logging: false,
    }),
    TypeOrmModule.forFeature([
      User,
      Profile,
      UserRole,
      Category,
      Product,
      ProductImage,
      Address,
      CartItem,
      Order,
      OrderItem,
      Payment,
      Review,
      Return,
      AdminLog
    ]),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}