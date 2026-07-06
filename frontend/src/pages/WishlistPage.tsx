import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import PageState from '@/components/common/PageState';
import Seo from '@/components/common/Seo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';
import { useWishlist } from '@/hooks/useWishlist';

const WishlistPage = () => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToCart } = useCart();
  const { items, loading, removeFromWishlist } = useWishlist();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageState
          type="empty"
          title={lang === 'fr' ? 'Mes favoris' : 'My wishlist'}
          description={
            lang === 'fr'
              ? 'Connectez-vous pour consulter vos favoris.'
              : 'Sign in to view your wishlist.'
          }
          action={{
            label: t.nav.login,
            onClick: () => navigate('/login'),
          }}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageState type="loading" title={t.common.loading} />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageState
          type="empty"
          title={lang === 'fr' ? 'Aucun favori' : 'No favorites yet'}
          description={
            lang === 'fr'
              ? 'Ajoutez des produits à vos favoris pour les retrouver plus vite.'
              : 'Add products to your wishlist to find them quickly later.'
          }
          action={{
            label: t.cart.continueShopping,
            onClick: () => navigate('/catalog'),
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Seo
        title="Mes favoris"
        description="Retrouvez vos produits favoris sur E-shop Pro."
        path="/wishlist"
        noIndex
      />
      <div className="mb-8 flex items-center gap-3">
        <Heart className="h-7 w-7 text-primary" />
        <h1 className="font-heading text-3xl font-bold">
          {lang === 'fr' ? 'Mes favoris' : 'My wishlist'}
        </h1>
      </div>

      <div className="space-y-4">
        {items.map((item) => {
          const primaryImage =
            item.product.images.find((image) => image.isPrimary)?.imageUrl ||
            item.product.images[0]?.imageUrl;
          const name =
            lang === 'en' && item.product.nameEn
              ? item.product.nameEn
              : item.product.name;

          return (
            <Card key={item.id}>
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 gap-4">
                  <Link
                    to={`/product/${item.productId}`}
                    className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted"
                  >
                    {primaryImage ? (
                      <img
                        src={primaryImage}
                        alt={name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ShoppingCart className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                  </Link>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {item.product.category?.name || '-'}
                    </p>
                    <Link to={`/product/${item.productId}`}>
                      <h2 className="line-clamp-2 font-medium hover:text-primary">
                        {name}
                      </h2>
                    </Link>
                    <p className="mt-2 text-lg font-bold text-primary">
                      ${item.product.price.toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.product.stock > 0
                        ? lang === 'fr'
                          ? `En stock (${item.product.stock})`
                          : `In stock (${item.product.stock})`
                        : t.product.outOfStock}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 sm:flex-col lg:flex-row">
                  <Button
                    onClick={async () => {
                      try {
                        await addToCart(item.productId, 1);
                        toast({
                          title:
                            lang === 'fr'
                              ? 'Produit ajouté au panier'
                              : 'Product added to cart',
                        });
                      } catch {
                        // handled in context
                      }
                    }}
                    disabled={item.product.stock <= 0}
                    className="gap-2"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {t.product.addToCart}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      void removeFromWishlist(item.productId);
                    }}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    {lang === 'fr' ? 'Retirer' : 'Remove'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default WishlistPage;
