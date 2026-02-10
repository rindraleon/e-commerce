import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShoppingBag, Truck, Shield, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import ProductCard from "@/components/products/ProductCard";

const Index = () => {
  const { t, lang } = useLanguage();

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").limit(6);
      return data || [];
    },
  });

  const { data: featuredProducts } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*, product_images(*), categories(name, name_en)")
        .eq("is_featured", true)
        .limit(8);
      return data || [];
    },
  });

  const { data: newProducts } = useQuery({
    queryKey: ["new-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*, product_images(*), categories(name, name_en)")
        .eq("is_new", true)
        .order("created_at", { ascending: false })
        .limit(4);
      return data || [];
    },
  });

  const features = [
    { icon: ShoppingBag, label: lang === "fr" ? "Large sélection" : "Wide selection", color: "text-primary" },
    { icon: Truck, label: lang === "fr" ? "Livraison rapide" : "Fast delivery", color: "text-secondary" },
    { icon: Shield, label: lang === "fr" ? "Paiement sécurisé" : "Secure payment", color: "text-accent" },
    { icon: Star, label: lang === "fr" ? "Qualité garantie" : "Quality guaranteed", color: "text-warning" },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <h1 className="font-heading text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              {t.home.heroTitle}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">{t.home.heroSubtitle}</p>
            <Link to="/catalog">
              <Button size="lg" className="gap-2 text-base">
                {t.home.heroBtn} <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
        {/* Decorative shapes */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
      </section>

      {/* Features bar */}
      <section className="bg-card border-b border-border py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 justify-center"
              >
                <f.icon className={`h-6 w-6 ${f.color}`} />
                <span className="text-sm font-medium">{f.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="py-16 container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-2xl md:text-3xl font-bold">{t.home.categories}</h2>
            <Link to="/catalog">
              <Button variant="ghost" className="gap-1">{t.home.viewAll} <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat: any, i: number) => (
              <motion.div key={cat.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                <Link to={`/catalog?category=${cat.id}`}>
                  <Card className="hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer group">
                    <CardContent className="p-4 text-center">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <ShoppingBag className="h-6 w-6 text-primary" />
                      </div>
                      <p className="font-medium text-sm">{lang === "en" && cat.name_en ? cat.name_en : cat.name}</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-heading text-2xl md:text-3xl font-bold">{t.home.featured}</h2>
              <Link to="/catalog">
                <Button variant="ghost" className="gap-1">{t.home.viewAll} <ArrowRight className="h-4 w-4" /></Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.map((product: any, i: number) => (
                <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals */}
      {newProducts && newProducts.length > 0 && (
        <section className="py-16 container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-2xl md:text-3xl font-bold">{t.home.newArrivals}</h2>
            <Link to="/catalog">
              <Button variant="ghost" className="gap-1">{t.home.viewAll} <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {newProducts.map((product: any, i: number) => (
              <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary to-secondary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading text-3xl font-bold mb-4">
            {lang === "fr" ? "Prêt à découvrir ?" : "Ready to explore?"}
          </h2>
          <Link to="/catalog">
            <Button size="lg" variant="secondary" className="gap-2">
              {t.home.heroBtn} <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
