import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiService from '@/api/api-service';
import PageState from '@/components/common/PageState';
import Seo from '@/components/common/Seo';
import ProductGrid from '@/components/products/ProductGrid';
import { siteConfig } from '@/config/site';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';
import { useWishlist } from '@/hooks/useWishlist';
import { ArrowLeft, Heart, Package, ShoppingCart, Star } from 'lucide-react';

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const productQuery = useQuery({
    queryKey: ['product', id],
    queryFn: () => apiService.products.findById(id || ''),
    enabled: !!id,
  });

  const reviewsQuery = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => apiService.reviews.findByProductId(id || ''),
    enabled: !!id,
  });

  const similarProductsQuery = useQuery({
    queryKey: ['similar-products', productQuery.data?.categoryId],
    queryFn: () => apiService.products.findAll({ category_id: productQuery.data?.categoryId, limit: 4 }),
    enabled: !!productQuery.data?.categoryId,
  });

  const product = productQuery.data;
  const reviews = reviewsQuery.data?.data || [];
  const similarProducts = (similarProductsQuery.data?.data || []).filter((item) => item.id !== product?.id).slice(0, 4);

  if (productQuery.isLoading) {
    return <div className="container mx-auto px-4 py-8"><PageState type="loading" title={t.common.loading} /></div>;
  }

  if (productQuery.isError || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageState type="error" title={lang === 'fr' ? 'Produit introuvable' : 'Product not found'} />
      </div>
    );
  }

  const name = lang === 'en' && product.nameEn ? product.nameEn : product.name;
  const description = lang === 'en' && product.descriptionEn ? product.descriptionEn : product.description;
  const outOfStock = product.stock <= 0;
  const avgRating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  const currentImage = product.images[selectedImage]?.imageUrl || product.images[0]?.imageUrl;

  const handleAddToCart = async () => {
    if (!user) {
      toast({ title: lang === 'fr' ? 'Connexion requise' : 'Login required', variant: 'destructive' });
      return;
    }

    try {
      await addToCart(product.id, quantity);
      toast({ title: lang === 'fr' ? 'Produit ajouté au panier' : 'Product added to cart' });
    } catch {
      // managed by context
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      toast({
        title: lang === 'fr' ? 'Connexion requise' : 'Login required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const added = await toggleWishlist(product.id);
      toast({
        title: added
          ? lang === 'fr'
            ? 'Ajouté aux favoris'
            : 'Added to wishlist'
          : lang === 'fr'
            ? 'Retiré des favoris'
            : 'Removed from wishlist',
      });
    } catch {
      // managed by context
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Seo
        title={name}
        description={description || (lang === 'fr' ? 'Découvrez les détails de ce produit sur E-shop Pro.' : 'Discover this product details on E-shop Pro.')}
        keywords={[name, product.category?.name || '', 'produit', 'e-commerce'].filter(Boolean)}
        path={`/product/${product.id}`}
        type="product"
        image={currentImage}
        schema={[
          {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name,
            description,
            image: product.images.map((image) => image.imageUrl),
            url: new URL(`/product/${product.id}`, siteConfig.url).toString(),
            sku: product.id,
            category: product.category?.name,
            brand: {
              '@type': 'Brand',
              name: siteConfig.name,
            },
            itemCondition: 'https://schema.org/NewCondition',
            offers: {
              '@type': 'Offer',
              availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
              priceCurrency: 'USD',
              price: product.price,
              url: new URL(`/product/${product.id}`, siteConfig.url).toString(),
            },
            aggregateRating: reviews.length
              ? {
                  '@type': 'AggregateRating',
                  ratingValue: Number(avgRating.toFixed(2)),
                  reviewCount: reviews.length,
                  bestRating: 5,
                  worstRating: 1,
                }
              : undefined,
            review: reviews.slice(0, 5).map((review) => ({
              '@type': 'Review',
              reviewRating: {
                '@type': 'Rating',
                ratingValue: review.rating,
                bestRating: 5,
                worstRating: 1,
              },
              author: {
                '@type': 'Person',
                name: review.user?.profile?.fullName || review.user?.email || review.userId,
              },
              reviewBody: review.comment,
              datePublished: review.createdAt,
            })),
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: lang === 'fr' ? 'Accueil' : 'Home',
                item: siteConfig.url,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: lang === 'fr' ? 'Catalogue' : 'Catalog',
                item: new URL('/catalog', siteConfig.url).toString(),
              },
              {
                '@type': 'ListItem',
                position: 3,
                name,
                item: new URL(`/product/${product.id}`, siteConfig.url).toString(),
              },
            ],
          },
        ]}
      />
      <Link to="/catalog" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {t.common.back}
      </Link>

      <div className="mb-16 grid gap-8 md:grid-cols-2">
        <div>
          <div className="mb-3 aspect-square overflow-hidden rounded-xl bg-muted">
            {currentImage ? (
              <img src={currentImage} alt={name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center"><Package className="h-20 w-20 text-muted-foreground/30" /></div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image, index) => (
                <button
                  key={image.id || index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square overflow-hidden rounded-lg border-2 ${selectedImage === index ? 'border-primary' : 'border-transparent'}`}
                >
                  <img src={image.imageUrl} alt={`${name}-${index + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {product.category && (
            <p className="text-sm text-muted-foreground">
              {lang === 'fr' ? 'Catégorie' : 'Category'}: {lang === 'en' && product.category.nameEn ? product.category.nameEn : product.category.name}
            </p>
          )}
          <h1 className="font-heading text-3xl font-bold">{name}</h1>
          <div className="flex items-center gap-2">
            <div className="flex">{[1, 2, 3, 4, 5].map((star) => <Star key={star} className={`h-4 w-4 ${star <= avgRating ? 'fill-warning text-warning' : 'text-muted'}`} />)}</div>
            <span className="text-sm text-muted-foreground">({reviews.length})</span>
          </div>
          <div className="text-3xl font-bold text-primary">${product.price.toFixed(2)}</div>
          {outOfStock ? <Badge variant="destructive">{t.product.outOfStock}</Badge> : <p className="text-sm font-medium text-accent">{t.product.inStock} · {product.stock} {t.product.units}</p>}
          <p className="leading-relaxed text-muted-foreground">{description}</p>

          <div className="flex items-center gap-3 pt-4">
            {!outOfStock ? (
              <>
                <div className="flex items-center rounded-lg border">
                  <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</Button>
                  <span className="w-10 text-center font-medium">{quantity}</span>
                  <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>+</Button>
                </div>
                <Button size="lg" className="flex-1 gap-2" onClick={handleAddToCart}>
                  <ShoppingCart className="h-5 w-5" /> {t.product.addToCart}
                </Button>
              </>
            ) : null}
            <Button
              size="lg"
              variant={isInWishlist(product.id) ? 'default' : 'outline'}
              className="gap-2"
              onClick={handleToggleWishlist}
            >
              <Heart
                className={`h-5 w-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`}
              />
              {isInWishlist(product.id)
                ? lang === 'fr'
                  ? 'Dans vos favoris'
                  : 'In wishlist'
                : lang === 'fr'
                  ? 'Ajouter aux favoris'
                  : 'Add to wishlist'}
            </Button>
          </div>
        </div>
      </div>

      <section className="mb-16">
        <h2 className="mb-6 font-heading text-2xl font-bold">{t.product.reviews}</h2>
        {reviews.length ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex">{[1, 2, 3, 4, 5].map((star) => <Star key={star} className={`h-3 w-3 ${star <= review.rating ? 'fill-warning text-warning' : 'text-muted'}`} />)}</div>
                    <span className="text-sm font-medium">{review.user?.profile?.fullName || review.user?.email || review.userId}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <PageState type="empty" title={t.product.noReviews} />
        )}
      </section>

      {similarProducts.length > 0 && (
        <section>
          <h2 className="mb-6 font-heading text-2xl font-bold">{t.product.similarProducts}</h2>
          <ProductGrid products={similarProducts} className="md:grid-cols-4" />
        </section>
      )}
    </div>
  );
};

export default ProductDetailPage;
