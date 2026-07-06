import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiService from '@/api/api-service';
import PageState from '@/components/common/PageState';
import Seo from '@/components/common/Seo';
import ProductGrid from '@/components/products/ProductGrid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { Search } from 'lucide-react';

const CatalogPage = () => {
  const { t, lang } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category') || 'all';
  const searchQuery = searchParams.get('search') || '';
  const page = Number(searchParams.get('page') || '1');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'createdAt');
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiService.categories.findAll({ limit: 100 }),
  });

  const productsQuery = useQuery({
    queryKey: ['catalog-products', categoryFilter, searchQuery, sortBy, page],
    queryFn: () =>
      apiService.products.findAll({
        page,
        limit: 12,
        category_id: categoryFilter !== 'all' ? categoryFilter : undefined,
        search: searchQuery || undefined,
        sortBy,
        order: sortBy === 'name' || sortBy === 'price' ? 'ASC' : 'DESC',
      }),
  });

  const categories = categoriesQuery.data?.data || [];
  const products = productsQuery.data?.data || [];
  const meta = productsQuery.data?.meta;

  const hasResults = useMemo(() => products.length > 0, [products]);

  const updateParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === 'all') params.delete(key);
      else params.set(key, value);
    });
    if (!updates.page) params.set('page', '1');
    setSearchParams(params);
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    updateParams({ search: localSearch || undefined, page: '1' });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Seo
        title={lang === 'fr' ? 'Catalogue produits' : 'Product catalog'}
        description={lang === 'fr'
          ? 'Parcourez le catalogue E-shop Pro avec filtres, recherche et pagination pour trouver rapidement le bon produit.'
          : 'Browse the E-shop Pro catalog with filters, search and pagination to quickly find the right product.'}
        keywords={['catalogue produits', 'filtre produits', 'recherche e-commerce', 'pagination produits']}
        path="/catalog"
      />
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">{t.nav.catalog}</h1>
          <p className="text-sm text-muted-foreground">{lang === 'fr' ? 'Parcourez les produits connectés à votre backend NestJS.' : 'Browse products connected to your NestJS backend.'}</p>
        </div>
        {meta && <p className="text-sm text-muted-foreground">{meta.totalItems} {lang === 'fr' ? 'produit(s)' : 'product(s)'}</p>}
      </div>

      <div className="mb-8 flex flex-col gap-4 rounded-xl border bg-card p-4 md:flex-row">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={localSearch} onChange={(event) => setLocalSearch(event.target.value)} placeholder={t.nav.search} className="pl-10" />
          </div>
          <Button type="submit">{t.common.search}</Button>
        </form>

        <Select value={categoryFilter} onValueChange={(value) => updateParams({ category: value, page: '1' })}>
          <SelectTrigger className="w-full md:w-[220px]"><SelectValue placeholder={t.product.allCategories} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.product.allCategories}</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>{lang === 'en' && category.nameEn ? category.nameEn : category.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={sortBy}
          onValueChange={(value) => {
            setSortBy(value);
            updateParams({ sort: value, page: '1' });
          }}
        >
          <SelectTrigger className="w-full md:w-[220px]"><SelectValue placeholder={t.product.sort} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">{t.product.sortDate}</SelectItem>
            <SelectItem value="name">{lang === 'fr' ? 'Nom' : 'Name'}</SelectItem>
            <SelectItem value="price">{t.product.sortPrice}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {productsQuery.isLoading ? (
        <PageState type="loading" title={t.common.loading} />
      ) : productsQuery.isError ? (
        <PageState
          type="error"
          title={lang === 'fr' ? 'Impossible de charger le catalogue' : 'Unable to load catalog'}
          description={lang === 'fr' ? 'Vérifiez la connexion entre le frontend et le backend puis réessayez.' : 'Check the frontend/backend connection and try again.'}
          action={{ label: lang === 'fr' ? 'Réessayer' : 'Retry', onClick: () => productsQuery.refetch() }}
        />
      ) : hasResults ? (
        <>
          <ProductGrid products={products} />
          {meta && meta.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button variant="outline" disabled={!meta.hasPreviousPage} onClick={() => updateParams({ page: String(page - 1) })}>
                {lang === 'fr' ? 'Précédent' : 'Previous'}
              </Button>
              <span className="text-sm text-muted-foreground">{lang === 'fr' ? `Page ${meta.page} sur ${meta.totalPages}` : `Page ${meta.page} of ${meta.totalPages}`}</span>
              <Button variant="outline" disabled={!meta.hasNextPage} onClick={() => updateParams({ page: String(page + 1) })}>
                {lang === 'fr' ? 'Suivant' : 'Next'}
              </Button>
            </div>
          )}
        </>
      ) : (
        <PageState type="empty" title={t.common.noResults} description={lang === 'fr' ? 'Aucun produit ne correspond à votre recherche.' : 'No products match your search.'} />
      )}
    </div>
  );
};

export default CatalogPage;
