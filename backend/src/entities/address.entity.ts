import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Order } from './order.entity';

@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', default: 'Domicile' })
  label: string;

  @Column({ type: 'varchar' })
  street: string;

  @Column({ type: 'varchar' })
  city: string;

  @Column({ type: 'varchar', nullable: true })
  state: string;

  @Column({ type: 'varchar', name: 'postal_code', nullable: true })
  postalCode: string;

  @Column({ type: 'varchar', default: 'CD' })
  country: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string;

  @Column({ type: 'boolean', name: 'is_default', default: false })
  isDefault: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, user => user.addresses)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Order, order => order.address)
  orders?: Order[];
}