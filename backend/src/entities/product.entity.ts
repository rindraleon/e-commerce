import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Category } from './category.entity';
import { OrderItem } from './order-item.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', name: 'category_id', nullable: true })
  categoryId: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', name: 'name_en', nullable: true })
  nameEn: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', name: 'description_en', nullable: true })
  descriptionEn: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, name: 'weight_kg', nullable: true })
  weightKg: number;

  @Column({ type: 'boolean', name: 'is_featured', default: false })
  isFeatured: boolean;

  @Column({ type: 'boolean', name: 'is_new', default: false })
  isNew: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Category, category => category.products)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  // Forward references will be handled by TypeORM
  images?: any[];
  cartItems?: any[];
  orderItems?: OrderItem[];
  reviews?: any[];
}