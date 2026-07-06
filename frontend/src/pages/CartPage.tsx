import { Link } from 'react-router-dom';
import PageState from '@/components/common/PageState';
import Seo from '@/components/common/Seo';
import CouponBox from '@/components/checkout/CouponBox';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useCoupon } from '@/hooks/useCoupon';
import { useToast } from '@/hooks/use-toast';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';

const CartPage = () => {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const { items, updateQuantity, removeFromCart, total, loading } = useCart();
  const {
    couponCode,
    inputCode,
    setInputCode,
    appliedCoupon,
    discountAmount,
    isValidating,
    applyCoupon,
    removeCoupon,
  } = useCoupon(total);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageState
          type="empty"
          title={t.cart.title}
          description={lang === 'fr' ? 'Connectez-vous pour consulter votre panier.' : 'Sign in to view your cart.'}
          action={{ label: t.nav.login, onClick: () => (window.location.href = '/login') }}
        />
      </div>
    );
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8"><PageState type="loading" title={t.common.loading} /></div>;
  }

  if (!items.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageState
          type="empty"
          title={t.cart.title}
          description={t.cart.empty}
          action={{ label: t.cart.continueShopping, onClick: () => (window.location.href = '/catalog') }}
        />
      </div>
    );
  }

  const totalAfterDiscount = Math.max(total - discountAmount, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <Seo title="Panier" description="Consultez votre panier E-shop Pro." path="/cart" noIndex />
      <h1 className="mb-8 font-heading text-3xl font-bold">{t.cart.title}</h1>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {items.map((item) => {
            const primaryImage = item.product.images.find((image) => image.isPrimary)?.imageUrl || item.product.images[0]?.imageUrl;
            return (
              <Card key={item.id}>
                <CardContent className="flex gap-4 p-4">
                  <Link to={`/product/${item.productId}`} className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                    {primaryImage ? (
                      <img src={primaryImage} alt={item.product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center"><ShoppingBag className="h-8 w-8 text-muted-foreground/30" /></div>
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-1 text-sm font-medium">{lang === 'en' && item.product.nameEn ? item.product.nameEn : item.product.name}</h3>
                    <p className="font-bold text-primary">${item.product.price.toFixed(2)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center rounded-lg border">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.productId, item.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.productId, Math.min(item.product.stock, item.quantity + 1))}><Plus className="h-3 w-3" /></Button>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFromCart(item.productId)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm font-bold">${(item.product.price * item.quantity).toFixed(2)}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="h-fit sticky top-24">
          <CardContent className="space-y-4 p-6">
            <h2 className="font-heading text-xl font-bold">{t.checkout.summary}</h2>
            <CouponBox
              inputCode={inputCode}
              setInputCode={setInputCode}
              isValidating={isValidating}
              appliedCode={appliedCoupon?.code || couponCode}
              appliedDescription={appliedCoupon?.description}
              discountAmount={discountAmount}
              onApply={async () => {
                try {
                  await applyCoupon();
                  toast({
                    title:
                      lang === 'fr'
                        ? 'Coupon appliqué avec succès'
                        : 'Coupon applied successfully',
                  });
                } catch (error) {
                  toast({
                    title: t.common.error,
                    description:
                      error instanceof Error ? error.message : t.common.error,
                    variant: 'destructive',
                  });
                }
              }}
              onRemove={removeCoupon}
            />
            <div className="flex justify-between"><span className="text-muted-foreground">{t.cart.subtotal}</span><span className="font-bold">${total.toFixed(2)}</span></div>
            {discountAmount > 0 ? (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {lang === 'fr' ? 'Remise' : 'Discount'}
                  {appliedCoupon?.code ? ` (${appliedCoupon.code})` : ''}
                </span>
                <span className="font-medium text-accent">-${discountAmount.toFixed(2)}</span>
              </div>
            ) : null}
            <div className="flex justify-between"><span className="text-muted-foreground">{t.cart.shipping}</span><span className="text-sm text-muted-foreground">{lang === 'fr' ? 'Calculé au paiement' : 'Calculated at checkout'}</span></div>
            <div className="flex justify-between border-t pt-4"><span className="font-bold">{t.cart.total}</span><span className="text-xl font-bold text-primary">${totalAfterDiscount.toFixed(2)}</span></div>
            <Link to="/checkout" className="block"><Button className="w-full" size="lg">{t.cart.checkout}</Button></Link>
            <Link to="/catalog" className="block"><Button variant="ghost" className="w-full">{t.cart.continueShopping}</Button></Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CartPage;
