import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShoppingBag, Truck, Shield, Star, Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import ProductCard from "@/components/products/ProductCard";
import apiService from "@/api/api-service";

// Helper function to normalize API responses
const toArray = (result: any) => {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.data?.data)) return result.data.data;
  if (Array.isArray(result?.items)) return result.items;
  return [];
};

export default function Index() {
  const { t, lang } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch all products
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["all-products"],
    queryFn: async () => {
      const result = await apiService.products.findAll();
      return toArray(result);
    },
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const result = await apiService.categories.findAll();
      return toArray(result);
    },
  });

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    if (!productsData) return [];
    
    let filtered = [...productsData];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((product: any) => {
        const name = (lang === "en" && product.name_en ? product.name_en : product.name || "").toLowerCase();
        const description = (product.description || "").toLowerCase();
        return name.includes(query) || description.includes(query);
      });
    }

    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((product: any) => 
        product.category_id === selectedCategory || product.categoryId === selectedCategory
      );
    }

    // Apply sorting
    if (sortBy === "price-asc") {
      filtered.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === "price-desc") {
      filtered.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortBy === "name") {
      filtered.sort((a, b) => {
        const nameA = (lang === "en" && a.name_en ? a.name_en : a.name || "").toLowerCase();
        const nameB = (lang === "en" && b.name_en ? b.name_en : b.name || "").toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } else {
      // Default: sort by date (newest first)
      filtered.sort((a, b) => {
        const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
        const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
        return dateB - dateA;
      });
    }

    return filtered;
  }, [productsData, searchQuery, selectedCategory, sortBy, lang]);

  // Get featured products
  const featuredProducts = useMemo(() => {
    if (!productsData) return [];
    return productsData
      .filter((product: any) => product.is_featured || product.isFeatured)
      .slice(0, 8);
  }, [productsData]);

  // Get new arrivals
  const newProducts = useMemo(() => {
    if (!productsData) return [];
    return productsData
      .filter((product: any) => product.is_new || product.isNew)
      .slice(0, 4);
  }, [productsData]);

  const features = [
    { icon: ShoppingBag, label: lang === "fr" ? "Large sélection" : "Wide selection", color: "text-primary" },
    { icon: Truck, label: lang === "fr" ? "Livraison rapide" : "Fast delivery", color: "text-secondary" },
    { icon: Shield, label: lang === "fr" ? "Paiement sécurisé" : "Secure payment", color: "text-accent" },
    { icon: Star, label: lang === "fr" ? "Qualité garantie" : "Quality guaranteed", color: "text-warning" },
  ];

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSortBy("date");
  };

  const hasActiveFilters = searchQuery.trim() !== "" || selectedCategory !== "all" || sortBy !== "date";

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
      {categoriesData && categoriesData.length > 0 && (
        <section className="py-16 container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-2xl md:text-3xl font-bold">{t.home.categories}</h2>
            <Link to="/catalog">
              <Button variant="ghost" className="gap-1">{t.home.viewAll} <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categoriesData.map((cat: any, i: number) => (
              <motion.div key={cat.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                <Card 
                  className="hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer group"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    document.getElementById('all-products-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <ShoppingBag className="h-6 w-6 text-primary" />
                    </div>
                    <p className="font-medium text-sm">{lang === "en" && cat.name_en ? cat.name_en : cat.name}</p>
                  </CardContent>
                </Card>
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

      {/* All Products with Search and Filters */}
      <section id="all-products-section" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-2xl md:text-3xl font-bold">
              {lang === "fr" ? "Tous les produits" : "All Products"}
            </h2>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 md:hidden"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              {lang === "fr" ? "Filtres" : "Filters"}
            </Button>
          </div>

          {/* Search and Filter Bar */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 space-y-4 ${showFilters ? 'block' : 'hidden md:block'}`}
          >
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={lang === "fr" ? "Rechercher des produits..." : "Search products..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder={lang === "fr" ? "Catégorie" : "Category"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{lang === "fr" ? "Toutes les catégories" : "All Categories"}</SelectItem>
                  {categoriesData?.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {lang === "en" && cat.name_en ? cat.name_en : cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder={lang === "fr" ? "Trier par" : "Sort by"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">{lang === "fr" ? "Plus récent" : "Newest"}</SelectItem>
                  <SelectItem value="name">{lang === "fr" ? "Nom" : "Name"}</SelectItem>
                  <SelectItem value="price-asc">{lang === "fr" ? "Prix croissant" : "Price: Low to High"}</SelectItem>
                  <SelectItem value="price-desc">{lang === "fr" ? "Prix décroissant" : "Price: High to Low"}</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleClearFilters}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2">
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    {lang === "fr" ? "Recherche:" : "Search:"} {searchQuery}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery("")} />
                  </Badge>
                )}
                {selectedCategory !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {categoriesData?.find((c: any) => c.id === selectedCategory)?.name || "Category"}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCategory("all")} />
                  </Badge>
                )}
              </div>
            )}
          </motion.div>

          {/* Products Grid */}
          {productsLoading ? (
            <div className="text-center py-20">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="mt-4 text-muted-foreground">{lang === "fr" ? "Chargement..." : "Loading..."}</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <>
              <div className="mb-4 text-sm text-muted-foreground">
                {filteredProducts.length} {lang === "fr" ? "produit(s) trouvé(s)" : "product(s) found"}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {filteredProducts.map((product: any, i: number) => (
                  <motion.div 
                    key={product.id} 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: Math.min(i * 0.03, 0.5) }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">
                {lang === "fr" ? "Aucun produit trouvé" : "No products found"}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" className="mt-4" onClick={handleClearFilters}>
                  {lang === "fr" ? "Réinitialiser les filtres" : "Clear filters"}
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary to-secondary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading text-3xl font-bold mb-4">
            {lang === "fr" ? "Prêt à découvrir ?" : "Ready to explore?"}
          </h2>
          <p className="text-lg mb-6 opacity-90">
            {lang === "fr" 
              ? "Découvrez notre collection complète de produits de qualité" 
              : "Discover our complete collection of quality products"}
          </p>
          <Link to="/catalog">
            <Button size="lg" variant="secondary" className="gap-2">
              {t.home.heroBtn} <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
