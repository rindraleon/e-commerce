import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';

@Entity('users')
@Unique(['email'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  encrypted_password: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany('Profile', 'user')
  profiles: any[];

  @OneToMany('UserRole', 'user')
  userRoles: any[];

  @OneToMany('Address', 'user')
  addresses: any[];

  @OneToMany('CartItem', 'user')
  cartItems: any[];

  @OneToMany('Order', 'user')
  orders: any[];

  @OneToMany('Review', 'user')
  reviews: any[];

  @OneToMany('Return', 'user')
  returns: any[];
}