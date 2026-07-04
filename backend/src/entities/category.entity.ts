import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', name: 'name_en', nullable: true })
  nameEn: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', name: 'description_en', nullable: true })
  descriptionEn: string;

  @Column({ type: 'varchar', default: 'package' })
  icon: string;

  @Column({ type: 'varchar', name: 'image_url', nullable: true })
  imageUrl: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Forward reference will be handled by TypeORM
  products?: any[];
}