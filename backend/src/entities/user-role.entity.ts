import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export enum AppRole {
  ADMIN = 'admin',
  CLIENT = 'client',
}

@Entity('user_roles')
export class UserRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', name: 'user_id' })
  userId: string;

  @Column({ type: 'enum', enum: AppRole, default: AppRole.CLIENT })
  role: AppRole;

  @ManyToOne(() => User, user => user.userRoles)
  @JoinColumn({ name: 'user_id' })
  user: User;
}