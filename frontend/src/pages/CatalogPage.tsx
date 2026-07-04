import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import { motion } from "framer-motion";
import apiService from "@/api/api-service";

const CatalogPage = () => {
  const { t, lang } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFilter = searchParams.get("category") || "";
  const searchQuery = searchParams.get("search") || "";
  const [sortBy, setSortBy] = useState("date");
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        const result = await apiService.categories.findAll();
        // Handle different response formats
        if (Array.isArray(result)) return result;
        if (Array.isArray(result?.data)) return result.data;
        return [];
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        return [];
      }
    },
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["catalog-products", categoryFilter, searchQuery, sortBy],
    queryFn: async () => {
      try {
        const params: Record<string, string> = {};
        if (categoryFilter) params.category_id = categoryFilter;
        if (searchQuery) params.search = searchQuery;

        const res: any = await apiService.products.findAll(params);
        let productsData = res?.data || res || [];

        if (sortBy === "price-asc") {
          productsData = [...productsData].sort((a, b) => a.price - b.price);
        } else if (sortBy === "price-desc") {
          productsData = [...productsData].sort((a, b) => b.price - a.price);
        } else {
          productsData = [...productsData].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        return productsData;
      } catch (err) {
        console.error('Failed to fetch products:', err);
        return [];
      }
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (localSearch) params.set("search", localSearch);
    else params.delete("search");
    setSearchParams(params);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-heading text-3xl font-bold mb-6">{t.nav.catalog}</h1>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t.nav.search} value={localSearch} onChange={e => setLocalSearch(e.target.value)} className="pl-10" />
          </div>
          <Button type="submit">{t.common.search}</Button>
        </form>
        <Select value={categoryFilter} onValueChange={v => {
          const params = new URLSearchParams(searchParams);
          if (v === "all") params.delete("category"); else params.set("category", v);
          setSearchParams(params);
        }}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder={t.product.allCategories} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.product.allCategories}</SelectItem>
            {(categories as any[])?.map((cat: any) => (
              <SelectItem key={cat.id} value={cat.id}>{lang === "en" && cat.name_en ? cat.name_en : cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder={t.product.sort} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="date">{t.product.sortDate}</SelectItem>
            <SelectItem value="price-asc">{t.product.sortPrice} ↑</SelectItem>
            <SelectItem value="price-desc">{t.product.sortPrice} ↓</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products grid */}
      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground">{t.common.loading}</div>
      ) : products && products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product: any, i: number) => (
            <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground">{t.common.noResults}</div>
      )}
    </div>
  );
};

export default CatalogPage;
