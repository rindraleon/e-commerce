import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';
import { useWishlist } from '@/hooks/useWishlist';
import { Product } from '@/types/domain';
import { Heart, ShoppingCart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { t, lang } = useLanguage();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { user } = useAuth();
  const { toast } = useToast();

  const name = lang === 'en' && product.nameEn ? product.nameEn : product.name;
  const primaryImage = product.images.find((image) => image.isPrimary)?.imageUrl || product.images[0]?.imageUrl;
  const outOfStock = product.stock <= 0;

  const handleAddToCart = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      toast({
        title: lang === 'fr' ? 'Connexion requise' : 'Login required',
        description: lang === 'fr' ? 'Connectez-vous pour ajouter ce produit au panier.' : 'Sign in to add this item to your cart.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await addToCart(product.id);
      toast({ title: lang === 'fr' ? 'Produit ajouté au panier' : 'Product added to cart' });
    } catch {
      // already handled in context
    }
  };

  const handleToggleWishlist = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      toast({
        title: lang === 'fr' ? 'Connexion requise' : 'Login required',
        description:
          lang === 'fr'
            ? 'Connectez-vous pour gérer vos favoris.'
            : 'Sign in to manage your wishlist.',
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
      // already handled in context
    }
  };

  return (
    <Link to={`/product/${product.id}`}>
      <div className="group flex h-full flex-col overflow-hidden rounded-xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {primaryImage ? (
            <img src={primaryImage} alt={name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <ShoppingCart className="h-12 w-12 opacity-30" />
            </div>
          )}
          {outOfStock && <Badge variant="destructive" className="absolute left-2 top-2">{t.product.outOfStock}</Badge>}
          {!outOfStock && product.isNew && <Badge className="absolute left-2 top-2 bg-accent">{lang === 'fr' ? 'Nouveau' : 'New'}</Badge>}
          <Button
            size="icon"
            variant="secondary"
            className="absolute right-2 top-2 h-8 w-8 rounded-full"
            onClick={handleToggleWishlist}
          >
            <Heart
              className={`h-4 w-4 ${isInWishlist(product.id) ? 'fill-current text-primary' : ''}`}
            />
          </Button>
        </div>
        <div className="flex flex-1 flex-col p-3 md:p-4">
          <p className="mb-1 text-xs text-muted-foreground">{lang === 'en' && product.category?.nameEn ? product.category.nameEn : product.category?.name}</p>
          <h3 className="mb-2 line-clamp-2 font-heading text-sm font-semibold md:text-base">{name}</h3>
          <div className="mt-auto flex items-center justify-between">
            <span className="text-lg font-bold text-primary">${product.price.toFixed(2)}</span>
            {!outOfStock && (
              <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-primary hover:text-primary-foreground" onClick={handleAddToCart}>
                <ShoppingCart className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
