import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('admin_logs')
export class AdminLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', name: 'admin_id' })
  adminId: string;

  @Column({ type: 'varchar' })
  action: string;

  @Column({ type: 'json', default: '{}' })
  details: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user)
  @JoinColumn({ name: 'admin_id' })
  admin: User;
}
