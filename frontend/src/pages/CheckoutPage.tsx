import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiService from '@/api/api-service';
import PageState from '@/components/common/PageState';
import Seo from '@/components/common/Seo';
import CouponBox from '@/components/checkout/CouponBox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useCoupon } from '@/hooks/useCoupon';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, CreditCard, Smartphone } from 'lucide-react';

const CheckoutPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { items, total, clearCart } = useCart();
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [addressId, setAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mvola');
  const [paymentReference, setPaymentReference] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [placing, setPlacing] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState<string | null>(null);

  const {
    couponCode,
    inputCode,
    setInputCode,
    appliedCoupon,
    discountAmount,
    isValidating,
    applyCoupon,
    removeCoupon,
  } = useCoupon(
    total,
    items.map((item) => ({
      productId: item.productId,
      categoryId: item.product.categoryId,
      quantity: item.quantity,
      unitPrice: item.product.price,
    })),
  );

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  const addressesQuery = useQuery({
    queryKey: ['addresses', user?.id],
    queryFn: () => apiService.addresses.findByUserId(user?.id || ''),
    enabled: !!user,
  });

  useEffect(() => {
    if (addressesQuery.data?.length) {
      const defaultAddress = addressesQuery.data.find((address) => address.isDefault);
      setAddressId(defaultAddress?.id || addressesQuery.data[0].id);
    }
  }, [addressesQuery.data]);

  const shippingFee = total >= 100 ? 0 : 10;
  const totalAfterDiscount = Math.max(total + shippingFee - discountAmount, 0);

  const handlePlaceOrder = async () => {
    if (!user || !addressId || !items.length) return;
    if (!paymentReference.trim()) {
      toast({
        title: t.common.error,
        description: lang === 'fr' ? 'Veuillez saisir la référence de transfert mobile.' : 'Please enter the mobile transfer reference.',
        variant: 'destructive',
      });
      return;
    }

    setPlacing(true);
    try {
      const order = await apiService.orders.create({
        addressId,
        orderItems: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        notes: '',
        couponCode: appliedCoupon?.code || couponCode || undefined,
        paymentMethod,
        paymentReference,
        payerPhone,
        paymentProofFile,
      });

      await clearCart();
      removeCoupon();
      setOrderConfirmed(order.orderNumber || order.id);
    } catch (error: any) {
      toast({ title: t.common.error, description: error.message, variant: 'destructive' });
    } finally {
      setPlacing(false);
    }
  };

  if (orderConfirmed) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <CheckCircle className="mx-auto mb-4 h-20 w-20 text-accent" />
        <h1 className="mb-2 font-heading text-3xl font-bold">{t.checkout.orderConfirmed}</h1>
        <p className="mb-6 text-muted-foreground">{t.checkout.orderNumber}: {orderConfirmed}</p>
        <Button onClick={() => navigate('/orders')}>{t.orders.title}</Button>
      </div>
    );
  }

  if (authLoading) {
    return <div className="container mx-auto px-4 py-8"><PageState type="loading" title={t.common.loading} /></div>;
  }

  if (!items.length) {
    return <div className="container mx-auto px-4 py-8"><PageState type="empty" title={t.cart.empty} action={{ label: t.cart.continueShopping, onClick: () => navigate('/catalog') }} /></div>;
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Seo title="Paiement" description="Finalisez votre commande E-shop Pro." path="/checkout" noIndex />
      <h1 className="mb-8 font-heading text-3xl font-bold">{t.checkout.title}</h1>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader><CardTitle className="text-lg">{t.checkout.address}</CardTitle></CardHeader>
            <CardContent>
              {addressesQuery.isLoading ? (
                <PageState type="loading" title={t.common.loading} />
              ) : addressesQuery.data?.length ? (
                <Select value={addressId} onValueChange={setAddressId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {addressesQuery.data.map((address) => (
                      <SelectItem key={address.id} value={address.id}>{address.label} - {address.street}, {address.city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <PageState
                  type="empty"
                  title={lang === 'fr' ? 'Aucune adresse enregistrée' : 'No saved address'}
                  description={lang === 'fr' ? 'Ajoutez une adresse depuis votre profil avant de finaliser la commande.' : 'Add an address from your profile before checking out.'}
                  action={{ label: t.nav.profile, onClick: () => navigate('/profile') }}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">{t.checkout.payment}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                <div className="flex items-center space-x-3 rounded-lg border p-3">
                  <RadioGroupItem value="mvola" id="mvola" />
                  <Label htmlFor="mvola" className="flex flex-1 cursor-pointer items-center gap-2">
                    <Smartphone className="h-5 w-5 text-secondary" /> MVola
                  </Label>
                </div>
                <div className="flex items-center space-x-3 rounded-lg border p-3">
                  <RadioGroupItem value="airtel_money" id="airtel_money" />
                  <Label htmlFor="airtel_money" className="flex flex-1 cursor-pointer items-center gap-2">
                    <Smartphone className="h-5 w-5 text-warning" /> Airtel Money
                  </Label>
                </div>
                <div className="flex items-center space-x-3 rounded-lg border p-3">
                  <RadioGroupItem value="orange_money" id="orange_money" />
                  <Label htmlFor="orange_money" className="flex flex-1 cursor-pointer items-center gap-2">
                    <CreditCard className="h-5 w-5 text-accent" /> Orange Money
                  </Label>
                </div>
              </RadioGroup>

              <div className="space-y-2">
                <Label htmlFor="paymentReference">{lang === 'fr' ? 'Référence de transfert' : 'Transfer reference'}</Label>
                <Input
                  id="paymentReference"
                  value={paymentReference}
                  onChange={(event) => setPaymentReference(event.target.value)}
                  placeholder={lang === 'fr' ? 'Ex: MV-4587932' : 'Eg: MV-4587932'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payerPhone">{lang === 'fr' ? 'Numéro expéditeur (optionnel)' : 'Sender phone (optional)'}</Label>
                <Input
                  id="payerPhone"
                  value={payerPhone}
                  onChange={(event) => setPayerPhone(event.target.value)}
                  placeholder={lang === 'fr' ? '034 XX XXX XX' : '034 XX XXX XX'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentProof">{lang === 'fr' ? 'Preuve de paiement (optionnel)' : 'Payment proof (optional)'}</Label>
                <Input
                  id="paymentProof"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={(event) => setPaymentProofFile(event.target.files?.[0] || null)}
                />
              </div>

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

              <p className="text-sm text-muted-foreground">
                {lang === 'fr'
                  ? 'Après votre transfert via MVola, Airtel Money ou Orange Money, entrez simplement la référence pour soumettre la commande.'
                  : 'After your transfer via MVola, Airtel Money or Orange Money, just enter the reference to submit the order.'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="sticky top-24 h-fit">
          <CardHeader><CardTitle className="text-lg">{t.checkout.summary}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{lang === 'en' && item.product.nameEn ? item.product.nameEn : item.product.name} x{item.quantity}</span>
                <span>${(item.product.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t pt-3 text-sm"><span className="text-muted-foreground">{t.cart.subtotal}</span><span>${total.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t.cart.shipping}</span><span>${shippingFee.toFixed(2)}</span></div>
            {discountAmount > 0 ? (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {lang === 'fr' ? 'Remise' : 'Discount'}
                  {appliedCoupon?.code ? ` (${appliedCoupon.code})` : ''}
                </span>
                <span className="font-medium text-accent">-${discountAmount.toFixed(2)}</span>
              </div>
            ) : null}
            <div className="flex justify-between border-t pt-3 font-bold"><span>{t.cart.total}</span><span className="text-primary">${totalAfterDiscount.toFixed(2)}</span></div>
            <Button className="mt-4 w-full" size="lg" disabled={placing || !addressId || !paymentReference.trim() || isValidating} onClick={handlePlaceOrder}>
              {placing ? t.common.loading : t.checkout.placeOrder}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CheckoutPage;
