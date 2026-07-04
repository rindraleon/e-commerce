import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Star, ArrowLeft, Package } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import ProductCard from "@/components/products/ProductCard";
import apiService from "@/api/api-service";

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
      if (!id) return null;
      try {
        const result = await apiService.products.findById(id);
        // Handle different response formats
        if (result?.data) return result.data;
        return result;
      } catch (err) {
        console.error('Failed to fetch product:', err);
        return null;
      }
    },
    enabled: !!id,
  });

  const { data: reviews } = useQuery({
    queryKey: ["reviews", id],
    queryFn: async () => {
      if (!id) return [];
      try {
        const result: any = await apiService.reviews.findByProductId(id);
        // Handle different response formats
        const reviewsArray = Array.isArray(result) ? result : (result?.data || []);
        return reviewsArray.filter((review: any) => 
          review.moderationStatus === "approved" || review.moderation_status === "approved"
        );
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
        return [];
      }
    },
    enabled: !!id,
  });

  const { data: similarProducts } = useQuery({
    queryKey: ["similar", (product as any)?.categoryId || (product as any)?.category_id],
    queryFn: async () => {
      const categoryId = (product as any)?.categoryId || (product as any)?.category_id;
      if (!categoryId) return [];
      try {
        const result: any = await apiService.products.findAll({ category_id: categoryId });
        // Handle different response formats
        const productsArray = Array.isArray(result) ? result : (result?.data || []);
        return productsArray.filter((p: any) => p.id !== (product as any).id).slice(0, 4);
      } catch (err) {
        console.error('Failed to fetch similar products:', err);
        return [];
      }
    },
    enabled: !!((product as any)?.categoryId || (product as any)?.category_id),
  });

  if (isLoading) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">{t.common.loading}</div>;
  if (!product) return <div className="container mx-auto px-4 py-20 text-center">{t.common.noResults}</div>;

  const p = product as any;
  const name = (lang === "en" && p.name_en) ? p.name_en : p.name;
  const description = (lang === "en" && p.description_en) ? p.description_en : p.description;
  const outOfStock = p.stock <= 0;
  const avgRating = reviews && (reviews as any[]).length > 0 ? (reviews as any[]).reduce((s: number, r: any) => s + r.rating, 0) / (reviews as any[]).length : 0;
  const images = p.product_images || [];
  const primaryImage = images.find((img: any) => img.is_primary || img.isPrimary)?.image_url || images[0]?.image_url;

  const handleAddToCart = async () => {
    if (!user) {
      toast({ title: lang === "fr" ? "Connectez-vous" : "Please login", variant: "destructive" });
      return;
    }
    await addToCart(p.id, qty);
    toast({ title: lang === "fr" ? "Ajouté au panier !" : "Added to cart!" });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/catalog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> {t.common.back}
      </Link>

      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="aspect-square rounded-xl overflow-hidden bg-muted mb-3">
            {primaryImage ? (
              <img 
                src={images[selectedImage]?.image_url || primaryImage} 
                alt={name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-20 w-20 text-muted-foreground/30" />
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((img: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === idx ? "border-primary" : "border-transparent"
                  }`}
                >
                  <img src={img.image_url} alt={`${name} ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          {p.categories && (
            <p className="text-sm text-muted-foreground">
              {lang === "fr" ? "Catégorie:" : "Category:"} {lang === "en" && p.categories.name_en ? p.categories.name_en : p.categories.name}
            </p>
          )}
          <h1 className="font-heading text-3xl font-bold">{name}</h1>

          {reviews && (reviews as any[]).length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex">{[1, 2, 3, 4, 5].map(s => <Star key={s} className={`h-4 w-4 ${s <= avgRating ? "text-warning fill-warning" : "text-muted"}`} />)}</div>
              <span className="text-sm text-muted-foreground">({(reviews as any[]).length})</span>
            </div>
          )}

          <div className="text-3xl font-bold text-primary">${p.price}</div>

          {outOfStock ? (
            <Badge variant="destructive" className="text-sm">{t.product.outOfStock}</Badge>
          ) : (
            <p className="text-sm text-accent font-medium">{t.product.inStock} — {p.stock} {t.product.units}</p>
          )}

          <p className="text-muted-foreground leading-relaxed">{description}</p>

          {!outOfStock && (
            <div className="flex items-center gap-3 pt-4">
              <div className="flex items-center border rounded-lg">
                <Button variant="ghost" size="icon" onClick={() => setQty(Math.max(1, qty - 1))}>-</Button>
                <span className="w-10 text-center font-medium">{qty}</span>
                <Button variant="ghost" size="icon" onClick={() => setQty(Math.min(p.stock, qty + 1))}>+</Button>
              </div>
              <Button size="lg" className="flex-1 gap-2" onClick={handleAddToCart}>
                <ShoppingCart className="h-5 w-5" /> {t.product.addToCart}
              </Button>
            </div>
          )}
        </motion.div>
      </div>

      <section className="mb-16">
        <h2 className="font-heading text-2xl font-bold mb-6">{t.product.reviews}</h2>
        {reviews && (reviews as any[]).length > 0 ? (
          <div className="space-y-4">
            {(reviews as any[]).map((review: any) => (
              <Card key={review.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">{[1, 2, 3, 4, 5].map(s => <Star key={s} className={`h-3 w-3 ${s <= review.rating ? "text-warning fill-warning" : "text-muted"}`} />)}</div>
                    <span className="text-sm font-medium">User {review.userId}</span>
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

      {similarProducts && (similarProducts as any[]).length > 0 && (
        <section>
          <h2 className="font-heading text-2xl font-bold mb-6">{t.product.similarProducts}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(similarProducts as any[]).map((p: any) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetailPage;
