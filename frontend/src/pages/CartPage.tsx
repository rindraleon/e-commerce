import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

const CartPage = () => {
  const { t, lang } = useLanguage();
  const { items, updateQuantity, removeFromCart, total, loading } = useCart();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
        <h1 className="font-heading text-2xl font-bold mb-2">{t.cart.title}</h1>
        <p className="text-muted-foreground mb-6">{lang === "fr" ? "Connectez-vous pour voir votre panier" : "Login to see your cart"}</p>
        <Link to="/login"><Button>{t.nav.login}</Button></Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
        <h1 className="font-heading text-2xl font-bold mb-2">{t.cart.title}</h1>
        <p className="text-muted-foreground mb-6">{t.cart.empty}</p>
        <Link to="/catalog"><Button>{t.cart.continueShopping}</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-heading text-3xl font-bold mb-8">{t.cart.title}</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <Card>
                <CardContent className="p-4 flex gap-4">
                  <Link to={`/product/${item.product_id}`} className="w-20 h-20 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                    {item.product.image_url ? (
                      <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="h-8 w-8 text-muted-foreground/30" /></div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm line-clamp-1">{lang === "en" && item.product.name_en ? item.product.name_en : item.product.name}</h3>
                    <p className="text-primary font-bold">${item.product.price}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border rounded-lg">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.product_id, item.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.product_id, Math.min(item.product.stock, item.quantity + 1))}><Plus className="h-3 w-3" /></Button>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFromCart(item.product_id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="font-bold text-sm">${(item.product.price * item.quantity).toFixed(2)}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card className="h-fit sticky top-24">
          <CardContent className="p-6 space-y-4">
            <h2 className="font-heading text-xl font-bold">{t.checkout.summary}</h2>
            <div className="flex justify-between"><span className="text-muted-foreground">{t.cart.subtotal}</span><span className="font-bold">${total.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t.cart.shipping}</span><span className="text-sm text-muted-foreground">{lang === "fr" ? "Calculé au checkout" : "Calculated at checkout"}</span></div>
            <div className="border-t pt-4 flex justify-between"><span className="font-bold">{t.cart.total}</span><span className="font-bold text-primary text-xl">${total.toFixed(2)}</span></div>
            <Link to="/checkout" className="block">
              <Button className="w-full" size="lg">{t.cart.checkout}</Button>
            </Link>
            <Link to="/catalog" className="block">
              <Button variant="ghost" className="w-full">{t.cart.continueShopping}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CartPage;
