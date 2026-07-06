import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiService from '@/api/api-service';
import PageState from '@/components/common/PageState';
import Seo from '@/components/common/Seo';
import ProductGrid from '@/components/products/ProductGrid';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { stripHtml, truncateText } from '@/utils/text';

export default function SearchPage() {
  const { lang } = useLanguage();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q')?.trim() || '';

  const productsQuery = useQuery({
    queryKey: ['search-products', query],
    queryFn: () =>
      apiService.products.findAll({ page: 1, limit: 12, search: query || undefined }),
    enabled: query.length > 0,
  });

  const articlesQuery = useQuery({
    queryKey: ['search-articles', query],
    queryFn: () =>
      apiService.articles.findAll({
        page: 1,
        limit: 12,
        search: query || undefined,
        published: true,
      }),
    enabled: query.length > 0,
  });

  const loading = productsQuery.isLoading || articlesQuery.isLoading;
  const hasError = productsQuery.isError || articlesQuery.isError;

  const products = productsQuery.data?.data || [];
  const articles = articlesQuery.data?.data || [];
  const totalResults = useMemo(() => products.length + articles.length, [products, articles]);

  if (!query) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Seo title={lang === 'fr' ? 'Recherche' : 'Search'} noIndex path="/search" />
        <PageState
          type="empty"
          title={lang === 'fr' ? 'Recherche globale' : 'Global search'}
          description={
            lang === 'fr'
              ? 'Utilisez la barre de recherche pour trouver des produits et des articles.'
              : 'Use the search bar to find products and articles.'
          }
        />
      </div>
    );
  }

  if (loading) {
    return <PageState type="loading" title={lang === 'fr' ? 'Recherche...' : 'Searching...'} />;
  }

  if (hasError) {
    return (
      <PageState
        type="error"
        title={lang === 'fr' ? 'Impossible de lancer la recherche' : 'Unable to perform search'}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Seo
        title={lang === 'fr' ? `Recherche : ${query}` : `Search: ${query}`}
        description={
          lang === 'fr'
            ? `Résultats de recherche pour ${query} sur E-shop Pro.`
            : `Search results for ${query} on E-shop Pro.`
        }
        noIndex
        path={`/search?q=${encodeURIComponent(query)}`}
      />

      <div className="mb-8 space-y-2">
        <h1 className="font-heading text-3xl font-bold">
          {lang === 'fr' ? 'Résultats de recherche' : 'Search results'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {lang === 'fr'
            ? `${totalResults} résultat(s) trouvés pour “${query}”.`
            : `${totalResults} result(s) found for “${query}”.`}
        </p>
      </div>

      {totalResults === 0 ? (
        <PageState
          type="empty"
          title={lang === 'fr' ? 'Aucun résultat' : 'No result'}
          description={
            lang === 'fr'
              ? 'Essayez un autre mot-clé pour rechercher des produits ou des articles.'
              : 'Try another keyword to search for products or articles.'
          }
        />
      ) : (
        <div className="space-y-10">
          {products.length > 0 ? (
            <section className="space-y-4">
              <div>
                <h2 className="font-heading text-2xl font-semibold">
                  {lang === 'fr' ? 'Produits' : 'Products'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {products.length} {lang === 'fr' ? 'produit(s)' : 'product(s)'}
                </p>
              </div>
              <ProductGrid products={products} />
            </section>
          ) : null}

          {articles.length > 0 ? (
            <section className="space-y-4">
              <div>
                <h2 className="font-heading text-2xl font-semibold">
                  {lang === 'fr' ? 'Articles' : 'Articles'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {articles.length} {lang === 'fr' ? 'article(s)' : 'article(s)'}
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {articles.map((article) => {
                  const title = lang === 'en' && article.titleEn ? article.titleEn : article.title;
                  const excerpt = lang === 'en' && article.excerptEn ? article.excerptEn : article.excerpt;
                  return (
                    <Link key={article.id} to={`/articles/${article.slug}`}>
                      <Card className="h-full overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg">
                        {article.coverImageUrl ? (
                          <img
                            src={article.coverImageUrl}
                            alt={title}
                            className="h-52 w-full object-cover"
                          />
                        ) : null}
                        <CardContent className="space-y-3 p-5">
                          <h3 className="font-heading text-xl font-semibold">{title}</h3>
                          <p className="line-clamp-3 text-sm text-muted-foreground">
                            {truncateText(excerpt || stripHtml(article.content), 140)}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
