import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Order } from './order.entity';

export enum ReturnStatus {
  REQUESTED = 'requested',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REFUNDED = 'refunded',
}

@Entity('returns')
export class Return {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', name: 'order_id' })
  orderId: string;

  @Column({ type: 'varchar', name: 'user_id' })
  userId: string;

  @Column({ type: 'text' })
  reason: string;

  @Column({ 
    type: 'enum', 
    enum: ReturnStatus, 
    default: ReturnStatus.REQUESTED 
  })
  status: ReturnStatus;

  @Column({ type: 'timestamp', name: 'requested_at' })
  requestedAt: Date;

  @Column({ type: 'timestamp', name: 'resolved_at', nullable: true })
  resolvedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, user => user.returns)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Order, order => order)
  @JoinColumn({ name: 'order_id' })
  order: Order;
}