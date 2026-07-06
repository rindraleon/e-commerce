import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import apiService from '@/api/api-service';
import { useLanguage } from '@/contexts/LanguageContext';
import { stripHtml, truncateText } from '@/utils/text';
import { FileText, Package, Search } from 'lucide-react';

interface SearchSuggestionsProps {
  query: string;
  onSelect?: () => void;
}

export default function SearchSuggestions({
  query,
  onSelect,
}: SearchSuggestionsProps) {
  const { lang } = useLanguage();
  const normalizedQuery = query.trim();
  const enabled = normalizedQuery.length >= 2;

  const productsQuery = useQuery({
    queryKey: ['header-search-products', normalizedQuery],
    queryFn: () =>
      apiService.products.findAll({
        page: 1,
        limit: 5,
        search: normalizedQuery,
      }),
    enabled,
  });

  const articlesQuery = useQuery({
    queryKey: ['header-search-articles', normalizedQuery],
    queryFn: () =>
      apiService.articles.findAll({
        page: 1,
        limit: 5,
        search: normalizedQuery,
        published: true,
      }),
    enabled,
  });

  const products = productsQuery.data?.data || [];
  const articles = articlesQuery.data?.data || [];
  const totalResults = useMemo(
    () => products.length + articles.length,
    [products, articles],
  );

  if (!enabled) return null;

  return (
    <div className="absolute left-0 top-full z-50 mt-2 w-full rounded-xl border bg-card shadow-xl">
      <div className="border-b px-4 py-3 text-xs text-muted-foreground">
        {productsQuery.isLoading || articlesQuery.isLoading
          ? lang === 'fr'
            ? 'Recherche en cours...'
            : 'Searching...'
          : totalResults > 0
            ? lang === 'fr'
              ? `${totalResults} suggestion(s)`
              : `${totalResults} suggestion(s)`
            : lang === 'fr'
              ? 'Aucune suggestion'
              : 'No suggestion'}
      </div>

      <div className="max-h-[420px] overflow-y-auto p-2">
        {products.length > 0 ? (
          <div className="space-y-1 pb-2">
            <p className="px-2 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {lang === 'fr' ? 'Produits' : 'Products'}
            </p>
            {products.map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                onClick={onSelect}
                className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted"
              >
                {product.images[0]?.imageUrl ? (
                  <img
                    src={product.images[0].imageUrl}
                    alt={product.name}
                    className="h-12 w-12 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {lang === 'en' && product.nameEn ? product.nameEn : product.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ${product.price.toFixed(2)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : null}

        {articles.length > 0 ? (
          <div className="space-y-1 pt-2">
            <p className="px-2 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {lang === 'fr' ? 'Articles' : 'Articles'}
            </p>
            {articles.map((article) => {
              const title =
                lang === 'en' && article.titleEn ? article.titleEn : article.title;
              const excerpt =
                lang === 'en' && article.excerptEn
                  ? article.excerptEn
                  : article.excerpt;
              return (
                <Link
                  key={article.id}
                  to={`/articles/${article.slug}`}
                  onClick={onSelect}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted"
                >
                  {article.coverImageUrl ? (
                    <img
                      src={article.coverImageUrl}
                      alt={title}
                      className="h-12 w-12 rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {truncateText(excerpt || stripHtml(article.content), 70)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : null}

        {totalResults === 0 && !productsQuery.isLoading && !articlesQuery.isLoading ? (
          <Link
            to={`/search?q=${encodeURIComponent(normalizedQuery)}`}
            onClick={onSelect}
            className="flex items-center gap-2 rounded-lg px-2 py-3 text-sm text-muted-foreground hover:bg-muted"
          >
            <Search className="h-4 w-4" />
            {lang === 'fr'
              ? 'Voir tous les résultats'
              : 'View all results'}
          </Link>
        ) : (
          <Link
            to={`/search?q=${encodeURIComponent(normalizedQuery)}`}
            onClick={onSelect}
            className="mt-2 flex items-center gap-2 rounded-lg px-2 py-3 text-sm font-medium text-primary hover:bg-primary/5"
          >
            <Search className="h-4 w-4" />
            {lang === 'fr'
              ? `Voir tous les résultats pour “${normalizedQuery}”`
              : `View all results for “${normalizedQuery}”`}
          </Link>
        )}
      </div>
    </div>
  );
}
