import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiService from '@/api/api-service';
import PageState from '@/components/common/PageState';
import Seo from '@/components/common/Seo';
import ProductGrid from '@/components/products/ProductGrid';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowRight, Filter, Search, Shield, ShoppingBag, Star, Truck } from 'lucide-react';

export default function Index() {
  const { t, lang } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const productsQuery = useQuery({
    queryKey: ['homepage-products'],
    queryFn: () => apiService.products.findAll({ page: 1, limit: 24 }),
  });

  const categoriesQuery = useQuery({
    queryKey: ['homepage-categories'],
    queryFn: () => apiService.categories.findAll({ page: 1, limit: 12 }),
  });

  const products = productsQuery.data?.data || [];
  const categories = categoriesQuery.data?.data || [];

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch = !query || [product.name, product.nameEn, product.description, product.descriptionEn].filter(Boolean).join(' ').toLowerCase().includes(query);
      const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const featuredProducts = products.filter((product) => product.isFeatured).slice(0, 8);
  const newProducts = products.filter((product) => product.isNew).slice(0, 4);

  const features = [
    { icon: ShoppingBag, label: lang === 'fr' ? 'Catalogue connecté' : 'Connected catalog', color: 'text-primary' },
    { icon: Truck, label: lang === 'fr' ? 'Commandes en temps réel' : 'Realtime orders', color: 'text-secondary' },
    { icon: Shield, label: lang === 'fr' ? 'Authentification JWT' : 'JWT authentication', color: 'text-accent' },
    { icon: Star, label: lang === 'fr' ? 'Code refactorisé' : 'Refactored codebase', color: 'text-warning' },
  ];

  return (
    <div>
      <Seo
        title={lang === 'fr' ? 'Accueil' : 'Home'}
        description={lang === 'fr'
          ? 'Découvrez E-shop Pro, une boutique en ligne moderne avec catalogue produits, panier, commandes sécurisées et expérience rapide.'
          : 'Discover E-shop Pro, a modern online store with product catalog, shopping cart, secure orders and a fast experience.'}
        keywords={['e-commerce', 'boutique en ligne', 'catalogue produits', 'shopping online', 'NestJS', 'React']}
        path="/"
        schema={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'E-shop Pro',
          url: 'http://localhost:8080/',
          potentialAction: {
            '@type': 'SearchAction',
            target: 'http://localhost:8080/catalog?search={search_term_string}',
            'query-input': 'required name=search_term_string',
          },
        }}
      />
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">{lang === 'fr' ? 'Frontend + Backend reliés' : 'Connected frontend + backend'}</Badge>
            <h1 className="mb-4 font-heading text-4xl font-bold md:text-6xl">{t.home.heroTitle}</h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">{t.home.heroSubtitle}</p>
            <div className="flex flex-wrap gap-3">
              <Link to="/catalog"><Button size="lg" className="gap-2">{t.home.heroBtn} <ArrowRight className="h-5 w-5" /></Button></Link>
              <Link to="/login"><Button size="lg" variant="outline">{t.nav.login}</Button></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b bg-card py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.label} className="flex items-center justify-center gap-3">
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
                <span className="text-sm font-medium">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="font-heading text-2xl font-bold md:text-3xl">{t.home.categories}</h2>
            <Link to="/catalog"><Button variant="ghost" className="gap-1">{t.home.viewAll} <ArrowRight className="h-4 w-4" /></Button></Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {categories.map((category) => (
              <Card key={category.id} className="cursor-pointer transition-all hover:border-primary/30 hover:shadow-lg" onClick={() => setSelectedCategory(category.id)}>
                <CardContent className="p-4 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"><ShoppingBag className="h-6 w-6 text-primary" /></div>
                  <p className="text-sm font-medium">{lang === 'en' && category.nameEn ? category.nameEn : category.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {featuredProducts.length > 0 && (
        <section className="bg-muted/30 py-16">
          <div className="container mx-auto px-4">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="font-heading text-2xl font-bold md:text-3xl">{t.home.featured}</h2>
              <Link to="/catalog"><Button variant="ghost" className="gap-1">{t.home.viewAll} <ArrowRight className="h-4 w-4" /></Button></Link>
            </div>
            <ProductGrid products={featuredProducts} />
          </div>
        </section>
      )}

      {newProducts.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="font-heading text-2xl font-bold md:text-3xl">{t.home.newArrivals}</h2>
            <Link to="/catalog"><Button variant="ghost" className="gap-1">{t.home.viewAll} <ArrowRight className="h-4 w-4" /></Button></Link>
          </div>
          <ProductGrid products={newProducts} className="md:grid-cols-4" />
        </section>
      )}

      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="font-heading text-2xl font-bold md:text-3xl">{lang === 'fr' ? 'Tous les produits' : 'All Products'}</h2>
            <Link to="/catalog"><Button variant="ghost" className="gap-1">{t.home.viewAll} <ArrowRight className="h-4 w-4" /></Button></Link>
          </div>

          <div className="mb-6 flex flex-col gap-4 rounded-xl border bg-card p-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder={lang === 'fr' ? 'Rechercher un produit...' : 'Search a product...'} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="pl-10" />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-[220px]"><SelectValue placeholder={lang === 'fr' ? 'Catégorie' : 'Category'} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lang === 'fr' ? 'Toutes les catégories' : 'All categories'}</SelectItem>
                {categories.map((category) => <SelectItem key={category.id} value={category.id}>{lang === 'en' && category.nameEn ? category.nameEn : category.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}><Filter className="mr-2 h-4 w-4" />{lang === 'fr' ? 'Réinitialiser' : 'Reset'}</Button>
          </div>

          {productsQuery.isLoading ? (
            <PageState type="loading" title={t.common.loading} />
          ) : productsQuery.isError ? (
            <PageState type="error" title={t.common.error} action={{ label: lang === 'fr' ? 'Réessayer' : 'Retry', onClick: () => productsQuery.refetch() }} />
          ) : filteredProducts.length ? (
            <>
              <p className="mb-4 text-sm text-muted-foreground">{filteredProducts.length} {lang === 'fr' ? 'produit(s) trouvé(s)' : 'product(s) found'}</p>
              <ProductGrid products={filteredProducts.slice(0, 15)} className="xl:grid-cols-5" />
            </>
          ) : (
            <PageState type="empty" title={lang === 'fr' ? 'Aucun produit trouvé' : 'No products found'} />
          )}
        </div>
      </section>
    </div>
  );
}
