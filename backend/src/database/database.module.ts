import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Address } from '../entities/address.entity';
import { AdminLog } from '../entities/admin-log.entity';
import { ArticleComment } from '../entities/article-comment.entity';
import { ArticleLike } from '../entities/article-like.entity';
import { Article } from '../entities/article.entity';
import { CartItem } from '../entities/cart-item.entity';
import { Category } from '../entities/category.entity';
import { Coupon } from '../entities/coupon.entity';
import { CouponUsage } from '../entities/coupon-usage.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Order } from '../entities/order.entity';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { Payment } from '../entities/payment.entity';
import { ProductImage } from '../entities/product-image.entity';
import { Product } from '../entities/product.entity';
import { Profile } from '../entities/profile.entity';
import { Return } from '../entities/return.entity';
import { Review } from '../entities/review.entity';
import { Subscriber } from '../entities/subscriber.entity';
import { UserRole } from '../entities/user-role.entity';
import { User } from '../entities/user.entity';
import { WishlistItem } from '../entities/wishlist-item.entity';
import { DatabaseService } from './database.service';

const entities = [
  User,
  Profile,
  UserRole,
  Category,
  Coupon,
  CouponUsage,
  Product,
  ProductImage,
  WishlistItem,
  Article,
  ArticleComment,
  ArticleLike,
  Address,
  CartItem,
  Order,
  OrderItem,
  Payment,
  Review,
  Return,
  AdminLog,
  Subscriber,
  PasswordResetToken,
];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        const sslEnabled = configService.get<boolean>('DB_SSL', false);

        return {
          type: 'postgres',
          url: databaseUrl,
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get<string>('DB_USERNAME', 'postgres'),
          password: configService.get<string>('DB_PASSWORD', ''),
          database: configService.get<string>('DB_NAME', 'eshop'),
          ssl: sslEnabled ? { rejectUnauthorized: false } : false,
          entities,
          synchronize: configService.get<string>('NODE_ENV') !== 'production',
          logging: configService.get<string>('NODE_ENV') === 'development',
          uuidExtension: 'pgcrypto',
          installExtensions: true,
        };
      },
    }),
    TypeOrmModule.forFeature(entities),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService, TypeOrmModule],
})
export class DatabaseModule {}
