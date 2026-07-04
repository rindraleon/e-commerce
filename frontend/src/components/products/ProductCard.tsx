import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  product: any;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { t, lang } = useLanguage();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();

  const name = lang === "en" && product.name_en ? product.name_en : product.name;
  const primaryImage = product.product_images?.find((img: any) => img.is_primary)?.image_url
    || product.product_images?.[0]?.image_url;
  const outOfStock = product.stock <= 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast({ title: lang === "fr" ? "Connectez-vous pour ajouter au panier" : "Login to add to cart", variant: "destructive" });
      return;
    }
    await addToCart(product.id);
    toast({ title: lang === "fr" ? "Ajouté au panier" : "Added to cart" });
  };

  return (
    <Link to={`/product/${product.id}`}>
      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full">
        <div className="relative aspect-square bg-muted overflow-hidden">
          {primaryImage ? (
            <img src={primaryImage} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <ShoppingCart className="h-12 w-12 opacity-30" />
            </div>
          )}
          {outOfStock && (
            <Badge variant="destructive" className="absolute top-2 left-2">{t.product.outOfStock}</Badge>
          )}
          {product.is_new && !outOfStock && (
            <Badge className="absolute top-2 left-2 bg-accent">{lang === "fr" ? "Nouveau" : "New"}</Badge>
          )}
        </div>
        <CardContent className="p-3 md:p-4">
          <p className="text-xs text-muted-foreground mb-1">
            {lang === "en" && product.categories?.name_en ? product.categories.name_en : product.categories?.name}
          </p>
          <h3 className="font-heading font-semibold text-sm md:text-base line-clamp-2 mb-2">{name}</h3>
          <div className="flex items-center justify-between">
            <span className="font-bold text-primary text-lg">${product.price}</span>
            {!outOfStock && (
              <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-primary hover:text-primary-foreground" onClick={handleAddToCart}>
                <ShoppingCart className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ProductCard;
