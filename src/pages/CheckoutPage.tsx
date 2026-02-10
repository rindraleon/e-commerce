import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
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
      const { data } = await supabase.from("addresses").select("*").eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (addresses?.length) {
      const def = addresses.find((a: any) => a.is_default);
      setAddressId(def?.id || addresses[0].id);
    }
  }, [addresses]);

  const shippingFee = 5.00; // Simplified shipping calculation

  const handlePlaceOrder = async () => {
    if (!user || !addressId || items.length === 0) return;
    setPlacing(true);

    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          address_id: addressId,
          order_number: "temp", // will be replaced by trigger
          subtotal: total,
          shipping_fee: shippingFee,
          total_amount: total + shippingFee,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_purchase: item.product.price,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;

      // Create payment record
      await supabase.from("payments").insert({
        order_id: order.id,
        payment_method: paymentMethod,
        amount: total + shippingFee,
        status: "pending",
      });

      // Clear cart
      await clearCart();
      setOrderConfirmed(order.order_number);
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
          {/* Address selection */}
          <Card>
            <CardHeader><CardTitle className="text-lg">{t.checkout.address}</CardTitle></CardHeader>
            <CardContent>
              {addresses && addresses.length > 0 ? (
                <Select value={addressId} onValueChange={setAddressId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {addresses.map((addr: any) => (
                      <SelectItem key={addr.id} value={addr.id}>{addr.label} - {addr.street}, {addr.city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-muted-foreground text-sm">{lang === "fr" ? "Ajoutez une adresse dans votre profil" : "Add an address in your profile"}</p>
              )}
            </CardContent>
          </Card>

          {/* Payment method */}
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

        {/* Summary */}
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
