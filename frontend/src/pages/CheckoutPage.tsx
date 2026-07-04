import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, Smartphone, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import apiService from "@/api/api-service";

const CheckoutPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { items, total, clearCart } = useCart();
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [addressId, setAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [placing, setPlacing] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState<string | null>(null);

  useEffect(() => { if (!authLoading && !user) navigate("/login"); }, [user, authLoading, navigate]);

  const { data: addresses } = useQuery({
    queryKey: ["addresses", user?.id],
    queryFn: async () => {
      if (!user) return [];
      try {
        return await apiService.addresses.findByUserId(user.id) || [];
      } catch (err) {
        console.error('Failed to fetch addresses:', err);
        return [];
      }
    },
    enabled: !!user,
  });

  useEffect(() => {
    if ((addresses as any[])?.length) {
      const def = (addresses as any[]).find((a: any) => a.is_default);
      setAddressId(def?.id || (addresses as any[])[0].id);
    }
  }, [addresses]);

  const shippingFee = 5.00;

  const handlePlaceOrder = async () => {
    if (!user || !addressId || items.length === 0) return;
    setPlacing(true);

    try {
      const orderData = {
        userId: user.id,
        addressId: addressId,
        orderItems: items.map(item => ({
          productId: item.product_id,
          quantity: item.quantity,
        })),
        notes: "",
      };

      const order: any = await apiService.orders.create(orderData);
      await clearCart();
      setOrderConfirmed(order?.orderNumber || order?.id);
    } catch (err: any) {
      toast({ title: t.common.error, description: err.message, variant: "destructive" });
    }
    setPlacing(false);
  };

  if (orderConfirmed) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
          <CheckCircle className="h-20 w-20 mx-auto text-accent mb-4" />
        </motion.div>
        <h1 className="font-heading text-3xl font-bold mb-2">{t.checkout.orderConfirmed}</h1>
        <p className="text-muted-foreground mb-6">{t.checkout.orderNumber}: {orderConfirmed}</p>
        <Button onClick={() => navigate("/orders")}>{t.orders.title}</Button>
      </div>
    );
  }

  if (items.length === 0 && !orderConfirmed) {
    navigate("/cart");
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="font-heading text-3xl font-bold mb-8">{t.checkout.title}</h1>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">{t.checkout.address}</CardTitle></CardHeader>
            <CardContent>
              {(addresses as any[]) && (addresses as any[]).length > 0 ? (
                <Select value={addressId} onValueChange={setAddressId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(addresses as any[]).map((addr: any) => (
                      <SelectItem key={addr.id} value={addr.id}>{addr.label} - {addr.street}, {addr.city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-muted-foreground text-sm">{lang === "fr" ? "Ajoutez une adresse dans votre profil" : "Add an address in your profile"}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">{t.checkout.payment}</CardTitle></CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value="stripe" id="stripe" />
                  <Label htmlFor="stripe" className="flex items-center gap-2 cursor-pointer flex-1">
                    <CreditCard className="h-5 w-5 text-secondary" /> {t.checkout.stripe}
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value="mpesa" id="mpesa" />
                  <Label htmlFor="mpesa" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Smartphone className="h-5 w-5 text-accent" /> {t.checkout.mpesa}
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit sticky top-24">
          <CardHeader><CardTitle className="text-lg">{t.checkout.summary}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{lang === "en" && item.product.name_en ? item.product.name_en : item.product.name} x{item.quantity}</span>
                <span>${(item.product.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-3 flex justify-between text-sm">
              <span className="text-muted-foreground">{t.cart.subtotal}</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t.cart.shipping}</span>
              <span>${shippingFee.toFixed(2)}</span>
            </div>
            <div className="border-t pt-3 flex justify-between font-bold">
              <span>{t.cart.total}</span>
              <span className="text-primary">${(total + shippingFee).toFixed(2)}</span>
            </div>
            <Button className="w-full mt-4" size="lg" disabled={placing || !addressId} onClick={handlePlaceOrder}>
              {placing ? t.common.loading : t.checkout.placeOrder}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CheckoutPage;
