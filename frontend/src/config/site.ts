import { env } from './env';

export const siteConfig = {
  name: 'E-shop Pro',
  url: env.siteUrl,
  defaultTitle: 'E-shop Pro | Boutique en ligne moderne',
  defaultDescription:
    'E-shop Pro est une boutique en ligne moderne avec catalogue produits, panier, commandes sécurisées et interface d’administration.',
  defaultKeywords: [
    'e-commerce',
    'boutique en ligne',
    'catalogue produits',
    'commande en ligne',
    'frontend react',
    'backend nestjs',
  ],
  defaultImage: '/social-cover.svg',
};
