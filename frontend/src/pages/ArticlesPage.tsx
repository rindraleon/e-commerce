import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiService from '@/api/api-service';
import PageState from '@/components/common/PageState';
import Seo from '@/components/common/Seo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { stripHtml, truncateText } from '@/utils/text';

const sortOptions = [
  { value: 'latest', sortBy: 'publishedAt', order: 'DESC' },
  { value: 'oldest', sortBy: 'publishedAt', order: 'ASC' },
  { value: 'title-asc', sortBy: 'title', order: 'ASC' },
  { value: 'title-desc', sortBy: 'title', order: 'DESC' },
] as const;

export default function ArticlesPage() {
  const { lang } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || '';
  const tag = searchParams.get('tag') || '';
  const page = Number(searchParams.get('page') || '1');
  const sort = searchParams.get('sort') || 'latest';
  const sortConfig =
    sortOptions.find((option) => option.value === sort) || sortOptions[0];

  const articlesQuery = useQuery({
    queryKey: ['articles-public', category, tag, page, sort],
    queryFn: () =>
      apiService.articles.findAll({
        page,
        limit: 9,
        published: true,
        category: category || undefined,
        tag: tag || undefined,
        sortBy: sortConfig.sortBy,
        order: sortConfig.order,
      }),
  });

  const facetsQuery = useQuery({
    queryKey: ['articles-public-facets'],
    queryFn: () =>
      apiService.articles.findAll({
        page: 1,
        limit: 100,
        published: true,
      }),
  });

  const articles = articlesQuery.data?.data || [];
  const meta = articlesQuery.data?.meta;
  const facetArticles = facetsQuery.data?.data || [];

  const categories = useMemo(
    () =>
      Array.from(
        new Set(facetArticles.map((article) => article.category).filter(Boolean)),
      ),
    [facetArticles],
  );
  const tags = useMemo(
    () =>
      Array.from(
        new Set(
          facetArticles.flatMap((article) => article.tags || []).filter(Boolean),
        ),
      ),
    [facetArticles],
  );

  const updateParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (!value) params.delete(key);
      else params.set(key, value);
    });
    if (!updates.page) params.set('page', '1');
    setSearchParams(params);
  };

  if (articlesQuery.isLoading || facetsQuery.isLoading) {
    return (
      <PageState
        type="loading"
        title={lang === 'fr' ? 'Chargement...' : 'Loading...'}
      />
    );
  }

  if (articlesQuery.isError || facetsQuery.isError) {
    return (
      <PageState
        type="error"
        title={
          lang === 'fr'
            ? 'Impossible de charger les articles'
            : 'Unable to load articles'
        }
        action={{
          label: lang === 'fr' ? 'Réessayer' : 'Retry',
          onClick: () => {
            articlesQuery.refetch();
            facetsQuery.refetch();
          },
        }}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Seo
        title={lang === 'fr' ? 'Articles' : 'Articles'}
        description={
          lang === 'fr'
            ? 'Découvrez les conseils, nouveautés et actualités E-shop Pro.'
            : 'Discover E-shop Pro news, tips and stories.'
        }
        path="/articles"
      />
      <div className="mb-8 space-y-3">
        <h1 className="font-heading text-3xl font-bold">
          {lang === 'fr' ? 'Articles & actualités' : 'Articles & updates'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {lang === 'fr'
            ? 'Nouveaux produits, conseils d’achat et informations sur la boutique.'
            : 'New products, buying advice and store updates.'}
        </p>
      </div>

      <div className="mb-8 space-y-4 rounded-xl border bg-card p-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={category ? 'outline' : 'default'}
            size="sm"
            onClick={() => updateParams({ category: undefined })}
          >
            {lang === 'fr' ? 'Toutes les catégories' : 'All categories'}
          </Button>
          {categories.map((item) => (
            <Button
              key={item}
              variant={category === item ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateParams({ category: item || undefined })}
            >
              {item}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={tag ? 'outline' : 'default'}
            size="sm"
            onClick={() => updateParams({ tag: undefined })}
          >
            {lang === 'fr' ? 'Tous les tags' : 'All tags'}
          </Button>
          {tags.map((item) => (
            <Button
              key={item}
              variant={tag === item ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateParams({ tag: item })}
            >
              #{item}
            </Button>
          ))}
        </div>
        <div className="max-w-xs">
          <Select value={sort} onValueChange={(value) => updateParams({ sort: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">
                {lang === 'fr' ? 'Plus récent' : 'Newest'}
              </SelectItem>
              <SelectItem value="oldest">
                {lang === 'fr' ? 'Plus ancien' : 'Oldest'}
              </SelectItem>
              <SelectItem value="title-asc">
                {lang === 'fr' ? 'Titre A-Z' : 'Title A-Z'}
              </SelectItem>
              <SelectItem value="title-desc">
                {lang === 'fr' ? 'Titre Z-A' : 'Title Z-A'}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {articles.length === 0 ? (
        <PageState
          type="empty"
          title={
            lang === 'fr' ? 'Aucun article publié' : 'No published article'
          }
        />
      ) : (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            {meta?.totalItems || articles.length}{' '}
            {lang === 'fr' ? 'article(s)' : 'article(s)'}
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => {
              const title =
                lang === 'en' && article.titleEn ? article.titleEn : article.title;
              const excerpt =
                lang === 'en' && article.excerptEn
                  ? article.excerptEn
                  : article.excerpt;
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
                      <p className="text-xs text-muted-foreground">
                        {article.publishedAt
                          ? new Date(article.publishedAt).toLocaleDateString(
                              lang === 'fr' ? 'fr-FR' : 'en-US',
                            )
                          : '-'}
                      </p>
                      {article.category ? (
                        <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                          {article.category}
                        </span>
                      ) : null}
                      <h2 className="font-heading text-xl font-semibold">{title}</h2>
                      {article.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {article.tags.map((item) => (
                            <span
                              key={item}
                              className="inline-flex rounded-full border px-2 py-1 text-xs text-muted-foreground"
                            >
                              #{item}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      <p className="line-clamp-3 text-sm text-muted-foreground">
                        {excerpt || truncateText(stripHtml(article.content), 140)}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {meta && meta.totalPages > 1 ? (
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                disabled={!meta.hasPreviousPage}
                onClick={() => updateParams({ page: String(page - 1) })}
              >
                {lang === 'fr' ? 'Précédent' : 'Previous'}
              </Button>
              <span className="text-sm text-muted-foreground">
                {lang === 'fr'
                  ? `Page ${meta.page} sur ${meta.totalPages}`
                  : `Page ${meta.page} of ${meta.totalPages}`}
              </span>
              <Button
                variant="outline"
                disabled={!meta.hasNextPage}
                onClick={() => updateParams({ page: String(page + 1) })}
              >
                {lang === 'fr' ? 'Suivant' : 'Next'}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
