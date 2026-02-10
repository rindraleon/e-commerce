import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Star, ArrowLeft, Package } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import ProductCard from "@/components/products/ProductCard";

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useLanguage();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState(0);
  const [qty, setQty] = useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*, product_images(*), categories(name, name_en)")
        .eq("id", id!)
        .maybeSingle();
      return data;
    },
    enabled: !!id,
  });

  const { data: reviews } = useQuery({
    queryKey: ["reviews", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*, profiles:user_id(full_name)")
        .eq("product_id", id!)
        .eq("moderation_status", "approved")
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!id,
  });

  const { data: similarProducts } = useQuery({
    queryKey: ["similar", product?.category_id],
    queryFn: async () => {
      if (!product?.category_id) return [];
      const { data } = await supabase
        .from("products")
        .select("*, product_images(*), categories(name, name_en)")
        .eq("category_id", product.category_id)
        .neq("id", product.id)
        .limit(4);
      return data || [];
    },
    enabled: !!product?.category_id,
  });

  if (isLoading) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">{t.common.loading}</div>;
  if (!product) return <div className="container mx-auto px-4 py-20 text-center">{t.common.noResults}</div>;

  const name = lang === "en" && product.name_en ? product.name_en : product.name;
  const description = lang === "en" && product.description_en ? product.description_en : product.description;
  const images = product.product_images?.sort((a: any, b: any) => a.sort_order - b.sort_order) || [];
  const outOfStock = product.stock <= 0;
  const avgRating = reviews && reviews.length > 0 ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length : 0;

  const handleAddToCart = async () => {
    if (!user) {
      toast({ title: lang === "fr" ? "Connectez-vous" : "Please login", variant: "destructive" });
      return;
    }
    await addToCart(product.id, qty);
    toast({ title: lang === "fr" ? "Ajouté au panier !" : "Added to cart!" });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/catalog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> {t.common.back}
      </Link>

      <div className="grid md:grid-cols-2 gap-8 mb-16">
        {/* Images */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="aspect-square rounded-xl overflow-hidden bg-muted mb-3">
            {images[selectedImage] ? (
              <img src={images[selectedImage].image_url} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><Package className="h-20 w-20 text-muted-foreground/30" /></div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img: any, i: number) => (
                <button key={img.id} onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 ${i === selectedImage ? "border-primary" : "border-transparent"}`}>
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Info */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {lang === "en" && product.categories?.name_en ? product.categories.name_en : product.categories?.name}
          </p>
          <h1 className="font-heading text-3xl font-bold">{name}</h1>

          {reviews && reviews.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} className={`h-4 w-4 ${s <= avgRating ? "text-warning fill-warning" : "text-muted"}`} />)}</div>
              <span className="text-sm text-muted-foreground">({reviews.length})</span>
            </div>
          )}

          <div className="text-3xl font-bold text-primary">${product.price}</div>

          {outOfStock ? (
            <Badge variant="destructive" className="text-sm">{t.product.outOfStock}</Badge>
          ) : (
            <p className="text-sm text-accent font-medium">{t.product.inStock} — {product.stock} {t.product.units}</p>
          )}

          <p className="text-muted-foreground leading-relaxed">{description}</p>

          {!outOfStock && (
            <div className="flex items-center gap-3 pt-4">
              <div className="flex items-center border rounded-lg">
                <Button variant="ghost" size="icon" onClick={() => setQty(Math.max(1, qty - 1))}>-</Button>
                <span className="w-10 text-center font-medium">{qty}</span>
                <Button variant="ghost" size="icon" onClick={() => setQty(Math.min(product.stock, qty + 1))}>+</Button>
              </div>
              <Button size="lg" className="flex-1 gap-2" onClick={handleAddToCart}>
                <ShoppingCart className="h-5 w-5" /> {t.product.addToCart}
              </Button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Reviews */}
      <section className="mb-16">
        <h2 className="font-heading text-2xl font-bold mb-6">{t.product.reviews}</h2>
        {reviews && reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review: any) => (
              <Card key={review.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} className={`h-3 w-3 ${s <= review.rating ? "text-warning fill-warning" : "text-muted"}`} />)}</div>
                    <span className="text-sm font-medium">{review.profiles?.full_name || "Anonyme"}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">{t.product.noReviews}</p>
        )}
      </section>

      {/* Similar products */}
      {similarProducts && similarProducts.length > 0 && (
        <section>
          <h2 className="font-heading text-2xl font-bold mb-6">{t.product.similarProducts}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {similarProducts.map((p: any) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetailPage;
