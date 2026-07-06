import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity('articles')
@Unique(['slug'])
export class Article {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  slug: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'varchar', name: 'title_en', nullable: true })
  titleEn: string | null;

  @Column({ type: 'text', nullable: true })
  excerpt: string | null;

  @Column({ type: 'text', name: 'excerpt_en', nullable: true })
  excerptEn: string | null;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', name: 'content_en', nullable: true })
  contentEn: string | null;

  @Column({ type: 'varchar', nullable: true })
  category: string | null;

  @Column({ type: 'text', array: true, default: '{}' })
  tags: string[];

  @Column({ type: 'varchar', name: 'cover_image_url', nullable: true })
  coverImageUrl: string | null;

  @Column({ type: 'boolean', name: 'is_published', default: false })
  isPublished: boolean;

  @Column({ type: 'timestamp', name: 'published_at', nullable: true })
  publishedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
