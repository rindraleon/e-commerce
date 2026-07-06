import * as bcrypt from 'bcrypt';
import { existsSync } from 'fs';
import { mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { DataSource, In, Repository } from 'typeorm';
import {
  articleUploadsDir,
  buildArticleImagePublicPath,
  buildProductImagePublicPath,
  ensureUploadDirectories,
  productUploadsDir,
  resolveUploadPath,
} from '../utils/upload.util';
import { Address } from '../../entities/address.entity';
import { AdminLog } from '../../entities/admin-log.entity';
import { ArticleComment } from '../../entities/article-comment.entity';
import { ArticleLike } from '../../entities/article-like.entity';
import { Article } from '../../entities/article.entity';
import { Category } from '../../entities/category.entity';
import { Coupon, CouponType } from '../../entities/coupon.entity';
import { CouponUsage } from '../../entities/coupon-usage.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { Order, OrderStatus } from '../../entities/order.entity';
import {
  Payment,
  PaymentMethod,
  PaymentStatus,
} from '../../entities/payment.entity';
import { ProductImage } from '../../entities/product-image.entity';
import { Product } from '../../entities/product.entity';
import { Profile } from '../../entities/profile.entity';
import { ModerationStatus, Review } from '../../entities/review.entity';
import { AppRole, UserRole } from '../../entities/user-role.entity';
import { User } from '../../entities/user.entity';

interface CategorySeed {
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  icon: string;
}

interface ProductSeed {
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  categoryName: string;
  price: number;
  stock: number;
  weightKg: number;
  isFeatured: boolean;
  isNew: boolean;
  imageName: string;
  accentFrom: string;
  accentTo: string;
}

interface CouponSeed {
  code: string;
  description: string;
  type: CouponType;
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  isSingleUsePerUser?: boolean;
  isForNewCustomers?: boolean;
  allowedCategoryNames?: string[];
  allowedProductNames?: string[];
}

interface OrderLineSeed {
  productName: string;
  quantity: number;
}

interface OrderSeed {
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  transactionId: string;
  payerPhone: string;
  couponCode?: string;
  notes?: string;
  items: OrderLineSeed[];
}

interface ReviewSeed {
  productName: string;
  rating: number;
  comment: string;
}

interface ArticleSeed {
  title: string;
  titleEn: string;
  excerpt: string;
  excerptEn: string;
  content: string;
  contentEn: string;
  category: string;
  tags: string[];
  coverImageName: string;
  accentFrom: string;
  accentTo: string;
}

const categorySeeds: CategorySeed[] = [
  {
    name: 'Électronique',
    nameEn: 'Electronics',
    description: 'Smartphones, accessoires et appareils utiles au quotidien.',
    descriptionEn:
      'Smartphones, accessories and useful devices for everyday life.',
    icon: 'smartphone',
  },
  {
    name: 'Mode',
    nameEn: 'Fashion',
    description: 'Vêtements et accessoires pratiques pour un style moderne.',
    descriptionEn: 'Clothing and accessories for a modern and practical style.',
    icon: 'shirt',
  },
  {
    name: 'Maison',
    nameEn: 'Home',
    description: 'Équipements pour améliorer le confort à la maison.',
    descriptionEn: 'Products that improve comfort at home.',
    icon: 'house',
  },
  {
    name: 'Bureau',
    nameEn: 'Office',
    description:
      'Produits essentiels pour travailler dans de bonnes conditions.',
    descriptionEn: 'Essential products for a better work environment.',
    icon: 'briefcase',
  },
  {
    name: 'Beauté',
    nameEn: 'Beauty',
    description: 'Soins et produits bien-être pour le quotidien.',
    descriptionEn: 'Daily care and wellness products.',
    icon: 'sparkles',
  },
];

const productSeeds: ProductSeed[] = [
  {
    name: 'Smartphone Nova X',
    nameEn: 'Nova X Smartphone',
    description:
      'Un smartphone moderne avec un écran lumineux, une bonne autonomie et un excellent appareil photo.',
    descriptionEn:
      'A modern smartphone with a bright display, reliable battery life and a great camera.',
    categoryName: 'Électronique',
    price: 289,
    stock: 18,
    weightKg: 0.22,
    isFeatured: true,
    isNew: true,
    imageName: 'smartphone-nova-x',
    accentFrom: '#2563eb',
    accentTo: '#60a5fa',
  },
  {
    name: 'Casque Pulse Bluetooth',
    nameEn: 'Pulse Bluetooth Headphones',
    description:
      'Casque sans fil confortable avec réduction de bruit légère et son équilibré.',
    descriptionEn:
      'Comfortable wireless headphones with light noise reduction and balanced sound.',
    categoryName: 'Électronique',
    price: 79,
    stock: 34,
    weightKg: 0.35,
    isFeatured: true,
    isNew: false,
    imageName: 'casque-pulse-bluetooth',
    accentFrom: '#7c3aed',
    accentTo: '#c084fc',
  },
  {
    name: 'Chemise Lin Premium',
    nameEn: 'Premium Linen Shirt',
    description:
      'Chemise légère et respirante, idéale pour un usage quotidien ou professionnel.',
    descriptionEn:
      'Light and breathable shirt, ideal for daily wear or office use.',
    categoryName: 'Mode',
    price: 42,
    stock: 40,
    weightKg: 0.25,
    isFeatured: false,
    isNew: true,
    imageName: 'chemise-lin-premium',
    accentFrom: '#0f766e',
    accentTo: '#5eead4',
  },
  {
    name: 'Sac à dos Urbain',
    nameEn: 'Urban Backpack',
    description:
      'Sac à dos résistant avec plusieurs compartiments pour ordinateur et accessoires.',
    descriptionEn:
      'Durable backpack with multiple compartments for a laptop and accessories.',
    categoryName: 'Mode',
    price: 58,
    stock: 22,
    weightKg: 0.8,
    isFeatured: true,
    isNew: false,
    imageName: 'sac-a-dos-urbain',
    accentFrom: '#1f2937',
    accentTo: '#9ca3af',
  },
  {
    name: 'Mixeur Cuisine Pro',
    nameEn: 'Pro Kitchen Blender',
    description:
      'Mixeur robuste pour smoothies, sauces et préparations rapides à la maison.',
    descriptionEn:
      'Reliable blender for smoothies, sauces and fast home cooking.',
    categoryName: 'Maison',
    price: 95,
    stock: 15,
    weightKg: 2.1,
    isFeatured: false,
    isNew: true,
    imageName: 'mixeur-cuisine-pro',
    accentFrom: '#ea580c',
    accentTo: '#fdba74',
  },
  {
    name: 'Lampe LED Minimal',
    nameEn: 'Minimal LED Lamp',
    description:
      'Lampe décorative et fonctionnelle avec lumière douce pour salon ou chambre.',
    descriptionEn:
      'Decorative and functional lamp with soft light for living rooms or bedrooms.',
    categoryName: 'Maison',
    price: 36,
    stock: 27,
    weightKg: 0.7,
    isFeatured: true,
    isNew: false,
    imageName: 'lampe-led-minimal',
    accentFrom: '#d97706',
    accentTo: '#fde68a',
  },
  {
    name: 'Chaise Bureau Ergo',
    nameEn: 'Ergo Office Chair',
    description:
      'Chaise ergonomique avec soutien lombaire et assise confortable pour longues heures.',
    descriptionEn:
      'Ergonomic office chair with lumbar support and all-day comfort.',
    categoryName: 'Bureau',
    price: 149,
    stock: 11,
    weightKg: 8.5,
    isFeatured: true,
    isNew: false,
    imageName: 'chaise-bureau-ergo',
    accentFrom: '#0891b2',
    accentTo: '#67e8f9',
  },
  {
    name: 'Carnet Pro Notes',
    nameEn: 'Pro Notes Notebook',
    description:
      'Carnet élégant pour prises de notes, idées et organisation quotidienne.',
    descriptionEn:
      'Elegant notebook for note-taking, ideas and daily organization.',
    categoryName: 'Bureau',
    price: 14,
    stock: 60,
    weightKg: 0.3,
    isFeatured: false,
    isNew: false,
    imageName: 'carnet-pro-notes',
    accentFrom: '#4b5563',
    accentTo: '#d1d5db',
  },
  {
    name: 'Crème Soin Naturel',
    nameEn: 'Natural Care Cream',
    description:
      'Crème hydratante douce pour le visage et les mains, adaptée au quotidien.',
    descriptionEn:
      'Gentle moisturizing cream for face and hands, suitable for everyday care.',
    categoryName: 'Beauté',
    price: 19,
    stock: 45,
    weightKg: 0.12,
    isFeatured: false,
    isNew: true,
    imageName: 'creme-soin-naturel',
    accentFrom: '#db2777',
    accentTo: '#f9a8d4',
  },
];

const couponSeeds: CouponSeed[] = [
  {
    code: 'WELCOME10',
    description:
      '10% de remise sur une première grosse commande de démonstration.',
    type: CouponType.PERCENTAGE,
    value: 10,
    minOrderAmount: 100,
    maxDiscountAmount: 40,
    usageLimit: 100,
    usedCount: 1,
    isActive: true,
    isSingleUsePerUser: true,
    isForNewCustomers: true,
  },
  {
    code: 'LIVRAISON5',
    description: 'Réduction fixe de 5 USD sur les catégories Maison et Bureau.',
    type: CouponType.FIXED,
    value: 5,
    minOrderAmount: 30,
    usageLimit: 200,
    usedCount: 0,
    isActive: true,
    isSingleUsePerUser: false,
    allowedCategoryNames: ['Maison', 'Bureau'],
  },
  {
    code: 'NOVA20',
    description: 'Remise fixe sur le Smartphone Nova X uniquement.',
    type: CouponType.FIXED,
    value: 20,
    minOrderAmount: 150,
    usageLimit: 50,
    usedCount: 0,
    isActive: true,
    isSingleUsePerUser: true,
    allowedProductNames: ['Smartphone Nova X'],
  },
];

const demoOrderSeeds: OrderSeed[] = [
  {
    orderNumber: 'SEED-ORD-1001',
    status: OrderStatus.DELIVERED,
    paymentStatus: PaymentStatus.COMPLETED,
    paymentMethod: PaymentMethod.MVOLA,
    transactionId: 'MV-2026-0001',
    payerPhone: '0341234567',
    couponCode: 'WELCOME10',
    notes: 'Commande de démonstration livrée avec coupon.',
    items: [
      { productName: 'Smartphone Nova X', quantity: 1 },
      { productName: 'Casque Pulse Bluetooth', quantity: 1 },
    ],
  },
  {
    orderNumber: 'SEED-ORD-1002',
    status: OrderStatus.PENDING,
    paymentStatus: PaymentStatus.PENDING,
    paymentMethod: PaymentMethod.ORANGE_MONEY,
    transactionId: 'OM-2026-0002',
    payerPhone: '0327654321',
    notes: 'Commande en attente pour démonstration admin.',
    items: [{ productName: 'Chaise Bureau Ergo', quantity: 1 }],
  },
  {
    orderNumber: 'SEED-ORD-1003',
    status: OrderStatus.PAID,
    paymentStatus: PaymentStatus.COMPLETED,
    paymentMethod: PaymentMethod.AIRTEL_MONEY,
    transactionId: 'AM-2026-0003',
    payerPhone: '0332223344',
    couponCode: 'LIVRAISON5',
    notes: 'Commande payée en attente de préparation.',
    items: [
      { productName: 'Mixeur Cuisine Pro', quantity: 1 },
      { productName: 'Lampe LED Minimal', quantity: 2 },
    ],
  },
  {
    orderNumber: 'SEED-ORD-1004',
    status: OrderStatus.SHIPPED,
    paymentStatus: PaymentStatus.COMPLETED,
    paymentMethod: PaymentMethod.MVOLA,
    transactionId: 'MV-2026-0004',
    payerPhone: '0348887766',
    notes: 'Commande expédiée pour démonstration de suivi.',
    items: [
      { productName: 'Chemise Lin Premium', quantity: 2 },
      { productName: 'Sac à dos Urbain', quantity: 1 },
    ],
  },
  {
    orderNumber: 'SEED-ORD-1005',
    status: OrderStatus.CANCELLED,
    paymentStatus: PaymentStatus.REFUNDED,
    paymentMethod: PaymentMethod.ORANGE_MONEY,
    transactionId: 'OM-2026-0005',
    payerPhone: '0321112233',
    notes: 'Commande annulée après remboursement pour cas de démonstration.',
    items: [{ productName: 'Crème Soin Naturel', quantity: 3 }],
  },
];

const demoReviewSeeds: ReviewSeed[] = [
  {
    productName: 'Smartphone Nova X',
    rating: 5,
    comment:
      'Très bon produit, livraison rapide et qualité conforme à la description.',
  },
  {
    productName: 'Casque Pulse Bluetooth',
    rating: 4,
    comment: 'Bon son et très confortable pour une utilisation quotidienne.',
  },
  {
    productName: 'Lampe LED Minimal',
    rating: 5,
    comment: 'Très belle finition, lumière agréable et design discret.',
  },
  {
    productName: 'Sac à dos Urbain',
    rating: 4,
    comment: 'Pratique pour le bureau, plusieurs compartiments utiles.',
  },
];

const articleSeeds: ArticleSeed[] = [
  {
    title: 'Comment bien choisir un smartphone en 2026',
    titleEn: 'How to choose the right smartphone in 2026',
    excerpt:
      'Les critères essentiels pour choisir un smartphone selon vos besoins et votre budget.',
    excerptEn:
      'The key criteria to choose a smartphone based on your needs and budget.',
    content:
      '<h2>Les points clés</h2><p>Avant d’acheter un smartphone, pensez à l’autonomie, la qualité photo, la capacité de stockage et la fluidité du système. Un bon équilibre entre ces critères permet de faire un achat durable.</p><p>Comparez aussi la qualité de l’écran, la vitesse de charge et la garantie proposée.</p>',
    contentEn:
      '<h2>Key points</h2><p>Before buying a smartphone, focus on battery life, camera quality, storage capacity and overall system responsiveness. Balancing these criteria helps you make a long-lasting purchase.</p><p>Also compare display quality, charging speed and warranty coverage.</p>',
    category: 'Conseils achat',
    tags: ['smartphone', 'guide', 'achat'],
    coverImageName: 'guide-smartphone-2026',
    accentFrom: '#1d4ed8',
    accentTo: '#60a5fa',
  },
  {
    title: '5 astuces pour aménager un bureau confortable',
    titleEn: '5 tips to create a comfortable office setup',
    excerpt:
      'Quelques améliorations simples pour mieux travailler à la maison ou au bureau.',
    excerptEn: 'Simple improvements to work better from home or in the office.',
    content:
      '<h2>Un espace mieux organisé</h2><p>Une chaise ergonomique, une bonne lampe et un bureau bien rangé ont un impact direct sur le confort de travail. Pensez aussi à la hauteur de l’écran et à la posture.</p><ul><li>Choisissez une chaise adaptée</li><li>Ajoutez une lumière douce</li><li>Gardez vos accessoires essentiels à portée de main</li></ul>',
    contentEn:
      '<h2>A better organized space</h2><p>An ergonomic chair, a good lamp and a tidy desk have a direct impact on work comfort. Also pay attention to screen height and posture.</p><ul><li>Choose the right chair</li><li>Add soft lighting</li><li>Keep your essentials within reach</li></ul>',
    category: 'Maison & Bureau',
    tags: ['bureau', 'confort', 'organisation'],
    coverImageName: 'bureau-confortable',
    accentFrom: '#0f766e',
    accentTo: '#5eead4',
  },
  {
    title: 'Tendances mode : les indispensables du quotidien',
    titleEn: 'Fashion trends: everyday essentials',
    excerpt:
      'Des pièces faciles à porter pour garder un style moderne et pratique.',
    excerptEn: 'Easy-to-wear pieces for a practical and modern style.',
    content:
      '<h2>Le style utile</h2><p>Une garde-robe bien pensée repose sur quelques pièces polyvalentes : une chemise légère, un sac pratique et des matières confortables. L’objectif est de rester élégant sans sacrifier le confort.</p>',
    contentEn:
      '<h2>Useful style</h2><p>A well-designed wardrobe relies on a few versatile pieces: a light shirt, a practical bag and comfortable fabrics. The goal is to stay stylish without sacrificing comfort.</p>',
    category: 'Lifestyle',
    tags: ['mode', 'style', 'tendance'],
    coverImageName: 'tendances-mode-quotidien',
    accentFrom: '#be185d',
    accentTo: '#f9a8d4',
  },
  {
    title: 'Améliorer le confort à la maison avec quelques objets utiles',
    titleEn: 'Improve home comfort with a few useful items',
    excerpt:
      'Des accessoires simples peuvent changer l’ambiance et le confort de votre intérieur.',
    excerptEn:
      'Simple accessories can transform the atmosphere and comfort of your home.',
    content:
      '<h2>Un quotidien plus agréable</h2><p>Une lampe douce, des équipements bien choisis et une bonne organisation suffisent souvent à améliorer le confort à la maison. L’essentiel est de sélectionner des objets durables et faciles à intégrer à votre espace.</p>',
    contentEn:
      '<h2>A more pleasant daily life</h2><p>Soft lighting, well-chosen equipment and smart organization are often enough to improve comfort at home. The key is to choose durable items that fit naturally into your space.</p>',
    category: 'Maison & Bureau',
    tags: ['maison', 'confort', 'astuces'],
    coverImageName: 'confort-maison-objets-utiles',
    accentFrom: '#b45309',
    accentTo: '#fcd34d',
  },
  {
    title: 'Pourquoi les avis clients aident vraiment à choisir',
    titleEn: 'Why customer reviews really help people choose',
    excerpt:
      'Avant d’acheter, les retours d’expérience permettent de mieux comprendre les points forts d’un produit.',
    excerptEn:
      'Before buying, customer feedback helps understand a product’s real strengths.',
    content:
      '<h2>Des retours concrets</h2><p>Les avis clients complètent la fiche produit. Ils rassurent, donnent du contexte d’usage et aident à savoir si un produit répond vraiment au besoin initial.</p>',
    contentEn:
      '<h2>Real-world feedback</h2><p>Customer reviews complement product pages. They reassure shoppers, add usage context and help determine whether a product truly meets expectations.</p>',
    category: 'E-commerce',
    tags: ['avis', 'confiance', 'guide'],
    coverImageName: 'avis-clients-choisir',
    accentFrom: '#4338ca',
    accentTo: '#a5b4fc',
  },
];

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildSeedSvg(
  title: string,
  subtitle: string,
  from: string,
  to: string,
) {
  const safeTitle = escapeXml(title);
  const safeSubtitle = escapeXml(subtitle);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200" role="img" aria-label="${safeTitle}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}" />
      <stop offset="100%" stop-color="${to}" />
    </linearGradient>
  </defs>
  <rect width="1200" height="1200" rx="64" fill="url(#bg)" />
  <circle cx="920" cy="250" r="180" fill="rgba(255,255,255,0.16)" />
  <circle cx="220" cy="980" r="220" fill="rgba(255,255,255,0.10)" />
  <rect x="120" y="140" width="960" height="920" rx="48" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)" />
  <text x="140" y="420" fill="#ffffff" font-size="88" font-family="Arial, Helvetica, sans-serif" font-weight="700">${safeTitle}</text>
  <text x="140" y="520" fill="#ffffff" font-size="40" font-family="Arial, Helvetica, sans-serif" opacity="0.92">${safeSubtitle}</text>
  <text x="140" y="950" fill="#ffffff" font-size="34" font-family="Arial, Helvetica, sans-serif" opacity="0.88">E-shop Pro Demo</text>
</svg>`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface DemoSeedSummary {
  adminEmail: string;
  clientEmail: string;
  categories: number;
  products: number;
  coupons: number;
  articles: number;
  orders: number;
  reviews: number;
  resetApplied: boolean;
}

class DemoSeeder {
  private readonly userRepository: Repository<User>;
  private readonly profileRepository: Repository<Profile>;
  private readonly userRoleRepository: Repository<UserRole>;
  private readonly categoryRepository: Repository<Category>;
  private readonly productRepository: Repository<Product>;
  private readonly productImageRepository: Repository<ProductImage>;
  private readonly couponRepository: Repository<Coupon>;
  private readonly couponUsageRepository: Repository<CouponUsage>;
  private readonly articleRepository: Repository<Article>;
  private readonly articleCommentRepository: Repository<ArticleComment>;
  private readonly articleLikeRepository: Repository<ArticleLike>;
  private readonly addressRepository: Repository<Address>;
  private readonly orderRepository: Repository<Order>;
  private readonly orderItemRepository: Repository<OrderItem>;
  private readonly paymentRepository: Repository<Payment>;
  private readonly reviewRepository: Repository<Review>;
  private readonly adminLogRepository: Repository<AdminLog>;

  constructor(private readonly dataSource: DataSource) {
    this.userRepository = this.dataSource.getRepository(User);
    this.profileRepository = this.dataSource.getRepository(Profile);
    this.userRoleRepository = this.dataSource.getRepository(UserRole);
    this.categoryRepository = this.dataSource.getRepository(Category);
    this.productRepository = this.dataSource.getRepository(Product);
    this.productImageRepository = this.dataSource.getRepository(ProductImage);
    this.couponRepository = this.dataSource.getRepository(Coupon);
    this.couponUsageRepository = this.dataSource.getRepository(CouponUsage);
    this.articleRepository = this.dataSource.getRepository(Article);
    this.articleCommentRepository =
      this.dataSource.getRepository(ArticleComment);
    this.articleLikeRepository = this.dataSource.getRepository(ArticleLike);
    this.addressRepository = this.dataSource.getRepository(Address);
    this.orderRepository = this.dataSource.getRepository(Order);
    this.orderItemRepository = this.dataSource.getRepository(OrderItem);
    this.paymentRepository = this.dataSource.getRepository(Payment);
    this.reviewRepository = this.dataSource.getRepository(Review);
    this.adminLogRepository = this.dataSource.getRepository(AdminLog);
  }

  async run(options: DemoSeedOptions = {}): Promise<DemoSeedSummary> {
    ensureUploadDirectories();

    const adminEmail =
      process.env.DEFAULT_ADMIN_EMAIL?.trim().toLowerCase() ||
      'admin@eshop.local';
    const clientEmail = 'client@eshop.local';

    if (options.reset) {
      await this.resetDemoData(adminEmail, clientEmail);
    }

    const admin = await this.ensureUser({
      email: adminEmail,
      password: process.env.DEFAULT_ADMIN_PASSWORD?.trim() || 'admin123',
      fullName: process.env.DEFAULT_ADMIN_FULL_NAME?.trim() || 'Administrateur',
      phone: '0340000000',
      role: AppRole.ADMIN,
    });

    const demoClient = await this.ensureUser({
      email: clientEmail,
      password: 'client123',
      fullName: 'Client Démo',
      phone: '0320000000',
      role: AppRole.CLIENT,
    });

    const categories = await this.seedCategories();
    const products = await this.seedProducts(categories);
    const coupons = await this.seedCoupons(categories, products);
    const articles = await this.seedArticles();
    const address = await this.ensureDefaultAddress(demoClient.id);
    await this.seedOrders(demoClient.id, address.id, products, coupons);
    await this.seedReviews(demoClient.id, products);
    await this.seedArticleEngagement(admin.id, demoClient.id, articles);
    await this.seedAdminLog(admin.id, options.reset);

    const summary: DemoSeedSummary = {
      adminEmail,
      clientEmail,
      categories: categories.size,
      products: products.size,
      coupons: coupons.size,
      articles: articles.size,
      orders: demoOrderSeeds.length,
      reviews: demoReviewSeeds.length,
      resetApplied: Boolean(options.reset),
    };

    console.log('✅ Seed terminé avec succès');
    console.log(`Admin      : ${adminEmail} / admin123`);
    console.log('Client démo: client@eshop.local / client123');
    console.log(`Catégories : ${summary.categories}`);
    console.log(`Produits   : ${summary.products}`);
    console.log(`Coupons    : ${summary.coupons}`);
    console.log(`Articles   : ${summary.articles}`);
    console.log(`Commandes  : ${summary.orders}`);

    return summary;
  }

  private async ensureUser(input: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role: AppRole;
  }) {
    const normalizedEmail = input.email.trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(input.password, 10);

    let user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (!user) {
      user = this.userRepository.create({
        email: normalizedEmail,
        encrypted_password: hashedPassword,
      });
    } else {
      user.email = normalizedEmail;
      user.encrypted_password = hashedPassword;
    }

    user = await this.userRepository.save(user);

    let profile = await this.profileRepository.findOne({
      where: { userId: user.id },
    });

    if (!profile) {
      profile = this.profileRepository.create({
        userId: user.id,
        email: normalizedEmail,
      });
    }

    profile.fullName = input.fullName;
    profile.email = normalizedEmail;
    profile.phone = (input.phone || null) as unknown as string;
    await this.profileRepository.save(profile);

    await this.userRoleRepository.delete({ userId: user.id });
    await this.userRoleRepository.save(
      this.userRoleRepository.create({
        userId: user.id,
        role: input.role,
      }),
    );

    return user;
  }

  private async resetDemoData(adminEmail: string, clientEmail: string) {
    const articleSlugs = articleSeeds.map((item) => slugify(item.title));
    const productNames = productSeeds.map((item) => item.name);
    const categoryNames = categorySeeds.map((item) => item.name);
    const couponCodes = couponSeeds.map((item) => item.code);
    const orderNumbers = demoOrderSeeds.map((item) => item.orderNumber);

    const articles = await this.articleRepository.find({
      where: { slug: In(articleSlugs) },
    });
    const articleIds = articles.map((item) => item.id);
    if (articleIds.length) {
      const articleComments = await this.articleCommentRepository.find({
        where: { articleId: In(articleIds) },
      });
      const articleLikes = await this.articleLikeRepository.find({
        where: { articleId: In(articleIds) },
      });

      if (articleComments.length) {
        await this.articleCommentRepository.delete(
          articleComments.map((item) => item.id),
        );
      }
      if (articleLikes.length) {
        await this.articleLikeRepository.delete(
          articleLikes.map((item) => item.id),
        );
      }
      for (const article of articles) {
        await this.removeFileByPublicPath(article.coverImageUrl);
      }
      await this.articleRepository.delete(articleIds);
    }

    const orders = await this.orderRepository.find({
      where: { orderNumber: In(orderNumbers) },
    });
    const orderIds = orders.map((item) => item.id);
    if (orderIds.length) {
      await this.reviewRepository.delete({ orderId: In(orderIds) });
      await this.paymentRepository.delete({ orderId: In(orderIds) });
      await this.orderItemRepository.delete({ orderId: In(orderIds) });
      await this.orderRepository.delete(orderIds);
    }

    const coupons = await this.couponRepository.find({
      where: { code: In(couponCodes) },
    });
    if (coupons.length) {
      await this.couponUsageRepository.delete({
        couponId: In(coupons.map((item) => item.id)),
      });
    }
    await this.couponRepository.delete({ code: In(couponCodes) });

    const products = await this.productRepository.find({
      where: { name: In(productNames) },
      relations: ['images'],
    });
    for (const product of products) {
      for (const image of product.images || []) {
        await this.removeFileByPublicPath(image.imageUrl);
      }
      await this.productImageRepository.delete({ productId: product.id });
    }
    if (products.length) {
      await this.productRepository.delete(products.map((item) => item.id));
    }

    await this.categoryRepository.delete({ name: In(categoryNames) });

    const adminUser = await this.userRepository.findOne({
      where: { email: adminEmail },
    });
    if (adminUser) {
      await this.adminLogRepository.delete({
        adminId: adminUser.id,
        action: In(['seed_demo_data', 'reset_demo_data']),
      });
    }

    const demoClient = await this.userRepository.findOne({
      where: { email: clientEmail },
    });
    if (demoClient) {
      await this.addressRepository.delete({ userId: demoClient.id });
      await this.profileRepository.delete({ userId: demoClient.id });
      await this.userRoleRepository.delete({ userId: demoClient.id });
      await this.userRepository.delete(demoClient.id);
    }
  }

  private async seedCategories() {
    const categoryMap = new Map<string, Category>();

    for (const seed of categorySeeds) {
      let category = await this.categoryRepository.findOne({
        where: { name: seed.name },
      });

      if (!category) {
        category = this.categoryRepository.create();
      }

      category.name = seed.name;
      category.nameEn = seed.nameEn;
      category.description = seed.description;
      category.descriptionEn = seed.descriptionEn;
      category.icon = seed.icon;
      category.imageUrl = null as unknown as string;

      category = await this.categoryRepository.save(category);
      categoryMap.set(seed.name, category);
    }

    return categoryMap;
  }

  private async seedProducts(categories: Map<string, Category>) {
    const productMap = new Map<string, Product>();

    for (const seed of productSeeds) {
      const category = categories.get(seed.categoryName);
      if (!category) {
        throw new Error(`Category not found for product ${seed.name}`);
      }

      let product = await this.productRepository.findOne({
        where: { name: seed.name },
        relations: ['images'],
        order: { images: { sortOrder: 'ASC' } },
      });

      if (!product) {
        product = this.productRepository.create();
      }

      product.categoryId = category.id;
      product.name = seed.name;
      product.nameEn = seed.nameEn;
      product.description = seed.description;
      product.descriptionEn = seed.descriptionEn;
      product.price = seed.price;
      product.stock = seed.stock;
      product.weightKg = seed.weightKg;
      product.isFeatured = seed.isFeatured;
      product.isNew = seed.isNew;
      product = await this.productRepository.save(product);

      const fileName = `${slugify(seed.imageName)}.svg`;
      await this.ensureSeedImage(
        productUploadsDir,
        fileName,
        seed.name,
        `$${seed.price.toFixed(2)} • ${seed.categoryName}`,
        seed.accentFrom,
        seed.accentTo,
      );
      await this.syncProductImages(product.id, [
        {
          imageUrl: buildProductImagePublicPath(fileName),
          isPrimary: true,
          sortOrder: 0,
        },
      ]);

      const seededProduct = await this.productRepository.findOne({
        where: { id: product.id },
        relations: ['category', 'images'],
        order: { images: { sortOrder: 'ASC' } },
      });

      if (!seededProduct) {
        throw new Error(`Unable to reload seeded product ${seed.name}`);
      }

      productMap.set(seed.name, seededProduct);
    }

    return productMap;
  }

  private async ensureSeedImage(
    directory: string,
    fileName: string,
    title: string,
    subtitle: string,
    from: string,
    to: string,
  ) {
    if (!existsSync(directory)) {
      await mkdir(directory, { recursive: true });
    }

    const absolutePath = join(directory, fileName);
    const svg = buildSeedSvg(title, subtitle, from, to);
    await writeFile(absolutePath, svg, 'utf8');
  }

  private async removeFileByPublicPath(publicPath?: string | null) {
    if (!publicPath) {
      return;
    }

    const absolutePath = resolveUploadPath(publicPath);
    if (!absolutePath) {
      return;
    }

    await rm(absolutePath, { force: true });
  }

  private async syncProductImages(
    productId: string,
    desiredImages: Array<{
      imageUrl: string;
      isPrimary: boolean;
      sortOrder: number;
    }>,
  ) {
    const existingImages = await this.productImageRepository.find({
      where: { productId },
      order: { sortOrder: 'ASC' },
    });

    for (const existingImage of existingImages) {
      if (
        !desiredImages.some((item) => item.imageUrl === existingImage.imageUrl)
      ) {
        await this.productImageRepository.delete(existingImage.id);
      }
    }

    for (const desiredImage of desiredImages) {
      const existingImage = existingImages.find(
        (item) => item.imageUrl === desiredImage.imageUrl,
      );

      if (existingImage) {
        existingImage.isPrimary = desiredImage.isPrimary;
        existingImage.sortOrder = desiredImage.sortOrder;
        await this.productImageRepository.save(existingImage);
        continue;
      }

      await this.productImageRepository.save(
        this.productImageRepository.create({
          productId,
          imageUrl: desiredImage.imageUrl,
          isPrimary: desiredImage.isPrimary,
          sortOrder: desiredImage.sortOrder,
        }),
      );
    }
  }

  private async seedCoupons(
    categories: Map<string, Category>,
    products: Map<string, Product>,
  ) {
    const couponMap = new Map<string, Coupon>();

    for (const seed of couponSeeds) {
      let coupon = await this.couponRepository.findOne({
        where: { code: seed.code },
      });

      if (!coupon) {
        coupon = this.couponRepository.create();
      }

      coupon.code = seed.code;
      coupon.description = seed.description;
      coupon.type = seed.type;
      coupon.value = seed.value;
      coupon.minOrderAmount = seed.minOrderAmount ?? null;
      coupon.maxDiscountAmount = seed.maxDiscountAmount ?? null;
      coupon.usageLimit = seed.usageLimit ?? null;
      coupon.usedCount = seed.usedCount;
      coupon.isActive = seed.isActive;
      coupon.isSingleUsePerUser = seed.isSingleUsePerUser ?? true;
      coupon.isForNewCustomers = seed.isForNewCustomers ?? false;
      coupon.allowedCategoryIds = (seed.allowedCategoryNames || [])
        .map((name) => categories.get(name)?.id)
        .filter((value): value is string => Boolean(value));
      coupon.allowedProductIds = (seed.allowedProductNames || [])
        .map((name) => products.get(name)?.id)
        .filter((value): value is string => Boolean(value));
      coupon.startsAt = null;
      coupon.expiresAt = null;
      coupon = await this.couponRepository.save(coupon);
      couponMap.set(seed.code, coupon);
    }

    return couponMap;
  }

  private async seedArticles() {
    const articleMap = new Map<string, Article>();

    for (const seed of articleSeeds) {
      const slug = slugify(seed.title);
      let article = await this.articleRepository.findOne({
        where: [{ slug }, { title: seed.title }],
      });

      if (!article) {
        article = this.articleRepository.create();
      }

      const fileName = `${slugify(seed.coverImageName)}.svg`;
      await this.ensureSeedImage(
        articleUploadsDir,
        fileName,
        seed.title,
        seed.category,
        seed.accentFrom,
        seed.accentTo,
      );

      article.slug = slug;
      article.title = seed.title;
      article.titleEn = seed.titleEn;
      article.excerpt = seed.excerpt;
      article.excerptEn = seed.excerptEn;
      article.content = seed.content;
      article.contentEn = seed.contentEn;
      article.category = seed.category;
      article.tags = seed.tags;
      article.coverImageUrl = buildArticleImagePublicPath(fileName);
      article.isPublished = true;
      article.publishedAt = article.publishedAt || new Date();
      article = await this.articleRepository.save(article);

      articleMap.set(seed.title, article);
    }

    return articleMap;
  }

  private async seedArticleEngagement(
    adminId: string,
    clientUserId: string,
    articles: Map<string, Article>,
  ) {
    const entries = Array.from(articles.values());
    const firstArticle = entries[0];
    const secondArticle = entries[1];

    if (firstArticle) {
      const existingAdminLike = await this.articleLikeRepository.findOne({
        where: { articleId: firstArticle.id, userId: adminId },
      });
      if (!existingAdminLike) {
        await this.articleLikeRepository.save(
          this.articleLikeRepository.create({
            articleId: firstArticle.id,
            userId: adminId,
          }),
        );
      }

      const existingClientLike = await this.articleLikeRepository.findOne({
        where: { articleId: firstArticle.id, userId: clientUserId },
      });
      if (!existingClientLike) {
        await this.articleLikeRepository.save(
          this.articleLikeRepository.create({
            articleId: firstArticle.id,
            userId: clientUserId,
          }),
        );
      }

      const existingComment = await this.articleCommentRepository.findOne({
        where: { articleId: firstArticle.id, userId: clientUserId },
      });
      if (!existingComment) {
        await this.articleCommentRepository.save(
          this.articleCommentRepository.create({
            articleId: firstArticle.id,
            userId: clientUserId,
            content:
              'Article très utile pour découvrir les bons critères avant achat.',
            isApproved: true,
          }),
        );
      }
    }

    if (secondArticle) {
      const existingComment = await this.articleCommentRepository.findOne({
        where: { articleId: secondArticle.id, userId: adminId },
      });
      if (!existingComment) {
        await this.articleCommentRepository.save(
          this.articleCommentRepository.create({
            articleId: secondArticle.id,
            userId: adminId,
            content:
              'Conseils de démonstration ajoutés pour enrichir le blog du site.',
            isApproved: true,
          }),
        );
      }
    }
  }

  private async ensureDefaultAddress(userId: string) {
    let address = await this.addressRepository.findOne({
      where: { userId, label: 'Domicile' },
    });

    if (!address) {
      address = this.addressRepository.create({ userId });
    }

    address.label = 'Domicile';
    address.street = 'Lot II M 45, Ankorondrano';
    address.city = 'Antananarivo';
    address.state = 'Analamanga';
    address.postalCode = '101';
    address.country = 'MG';
    address.phone = '0320000000';
    address.isDefault = true;

    return this.addressRepository.save(address);
  }

  private calculateCouponDiscount(
    coupon: Coupon | undefined,
    subtotal: number,
  ) {
    if (!coupon) {
      return 0;
    }

    let discountAmount = 0;

    if (coupon.type === CouponType.PERCENTAGE) {
      discountAmount = (subtotal * Number(coupon.value)) / 100;
    } else {
      discountAmount = Number(coupon.value);
    }

    if (
      coupon.maxDiscountAmount !== null &&
      coupon.maxDiscountAmount !== undefined
    ) {
      discountAmount = Math.min(
        discountAmount,
        Number(coupon.maxDiscountAmount),
      );
    }

    return Math.min(discountAmount, subtotal);
  }

  private async seedOrders(
    userId: string,
    addressId: string,
    products: Map<string, Product>,
    coupons: Map<string, Coupon>,
  ) {
    for (const seed of demoOrderSeeds) {
      const orderItemsData = seed.items.map((item) => {
        const product = products.get(item.productName);
        if (!product) {
          throw new Error(`Product not found for order ${seed.orderNumber}`);
        }

        return {
          product,
          quantity: item.quantity,
          priceAtPurchase: Number(product.price),
        };
      });

      const subtotal = orderItemsData.reduce(
        (sum, item) => sum + item.priceAtPurchase * item.quantity,
        0,
      );
      const shippingFee = subtotal >= 100 ? 0 : 10;
      const coupon = seed.couponCode ? coupons.get(seed.couponCode) : undefined;
      const discountAmount = this.calculateCouponDiscount(coupon, subtotal);
      const totalAmount = Math.max(subtotal + shippingFee - discountAmount, 0);

      let order = await this.orderRepository.findOne({
        where: { orderNumber: seed.orderNumber },
      });

      if (!order) {
        order = this.orderRepository.create({ orderNumber: seed.orderNumber });
      }

      order.userId = userId;
      order.addressId = addressId;
      order.status = seed.status;
      order.subtotal = subtotal;
      order.shippingFee = shippingFee;
      order.discountAmount = discountAmount;
      order.totalAmount = totalAmount;
      order.couponCode = (coupon?.code || null) as unknown as string;
      order.notes = (seed.notes || null) as unknown as string;
      order = await this.orderRepository.save(order);

      await this.orderItemRepository.delete({ orderId: order.id });
      for (const item of orderItemsData) {
        await this.orderItemRepository.save(
          this.orderItemRepository.create({
            orderId: order.id,
            productId: item.product.id,
            quantity: item.quantity,
            priceAtPurchase: item.priceAtPurchase,
          }),
        );
      }

      let payment = await this.paymentRepository.findOne({
        where: { orderId: order.id },
      });

      if (!payment) {
        payment = this.paymentRepository.create({ orderId: order.id });
      }

      payment.paymentMethod = seed.paymentMethod;
      payment.transactionId = seed.transactionId;
      payment.payerPhone = seed.payerPhone;
      payment.proofImageUrl = null;
      payment.amount = totalAmount;
      payment.status = seed.paymentStatus;
      payment.paymentDate = new Date();
      await this.paymentRepository.save(payment);

      if (coupon) {
        const existingUsage = await this.couponUsageRepository.findOne({
          where: { couponId: coupon.id, userId },
        });

        if (!existingUsage) {
          await this.couponUsageRepository.save(
            this.couponUsageRepository.create({
              couponId: coupon.id,
              userId,
              orderId: order.id,
            }),
          );
        } else if (existingUsage.orderId !== order.id) {
          existingUsage.orderId = order.id;
          await this.couponUsageRepository.save(existingUsage);
        }
      }
    }
  }

  private async seedReviews(userId: string, products: Map<string, Product>) {
    const deliveredOrder = await this.orderRepository.findOne({
      where: { orderNumber: 'SEED-ORD-1001' },
    });

    if (!deliveredOrder) {
      return;
    }

    for (const seed of demoReviewSeeds) {
      const product = products.get(seed.productName);
      if (!product) {
        throw new Error(`Product not found for review ${seed.productName}`);
      }

      let review = await this.reviewRepository.findOne({
        where: {
          userId,
          productId: product.id,
          orderId: deliveredOrder.id,
        },
      });

      if (!review) {
        review = this.reviewRepository.create({
          userId,
          productId: product.id,
          orderId: deliveredOrder.id,
        });
      }

      review.rating = seed.rating;
      review.comment = seed.comment;
      review.moderationStatus = ModerationStatus.APPROVED;
      await this.reviewRepository.save(review);
    }
  }

  private async seedAdminLog(adminId: string, resetApplied = false) {
    await this.adminLogRepository.save(
      this.adminLogRepository.create({
        adminId,
        action: resetApplied ? 'reset_demo_data' : 'seed_demo_data',
        details: {
          categories: categorySeeds.length,
          products: productSeeds.length,
          coupons: couponSeeds.length,
          articles: articleSeeds.length,
          resetApplied,
        },
      }),
    );
  }
}

export interface DemoSeedOptions {
  reset?: boolean;
}

export async function seedDemoData(
  dataSource: DataSource,
  options: DemoSeedOptions = {},
) {
  const seeder = new DemoSeeder(dataSource);
  return seeder.run(options);
}
