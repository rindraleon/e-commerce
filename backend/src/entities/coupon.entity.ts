import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

export enum CouponType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

@Entity('coupons')
@Unique(['code'])
export class Coupon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: CouponType })
  type: CouponType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'min_order_amount',
    nullable: true,
  })
  minOrderAmount: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'max_discount_amount',
    nullable: true,
  })
  maxDiscountAmount: number | null;

  @Column({ type: 'int', name: 'usage_limit', nullable: true })
  usageLimit: number | null;

  @Column({ type: 'int', name: 'used_count', default: 0 })
  usedCount: number;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @Column({
    type: 'boolean',
    name: 'is_single_use_per_user',
    default: true,
  })
  isSingleUsePerUser: boolean;

  @Column({ type: 'timestamp', name: 'starts_at', nullable: true })
  startsAt: Date | null;

  @Column({ type: 'timestamp', name: 'expires_at', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
