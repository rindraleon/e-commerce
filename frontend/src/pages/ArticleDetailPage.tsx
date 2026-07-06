import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import apiService from '@/api/api-service';
import PageState from '@/components/common/PageState';
import Seo from '@/components/common/Seo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { stripHtml } from '@/utils/text';
import { Copy, Heart, MessageCircle, Send, Share2 } from 'lucide-react';

export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const articleQuery = useQuery({
    queryKey: ['article-public', slug],
    queryFn: () => apiService.articles.findBySlug(slug || ''),
    enabled: !!slug,
  });

  const commentsQuery = useQuery({
    queryKey: ['article-comments', slug],
    queryFn: () => apiService.articles.findComments(slug || '', { page: 1, limit: 20 }),
    enabled: !!slug,
  });

  const engagementQuery = useQuery({
    queryKey: ['article-engagement', slug],
    queryFn: () => apiService.articles.getEngagement(slug || ''),
    enabled: !!slug,
  });

  const article = articleQuery.data;
  const title = lang === 'en' && article?.titleEn ? article.titleEn : article?.title || '';
  const excerpt = lang === 'en' && article?.excerptEn ? article.excerptEn : article?.excerpt;
  const content = lang === 'en' && article?.contentEn ? article.contentEn : article?.content || '';
  const comments = commentsQuery.data?.data || [];
  const engagement = engagementQuery.data;
  const articleUrl = useMemo(
    () => (article ? `${window.location.origin}/articles/${article.slug}` : window.location.href),
    [article],
  );

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(articleUrl);
    toast({ title: lang === 'fr' ? 'Lien copié' : 'Link copied' });
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title,
        text: excerpt || title,
        url: articleUrl,
      });
      return;
    }
    await handleCopyLink();
  };

  const handleToggleLike = async () => {
    if (!user || !slug) {
      toast({
        title: lang === 'fr' ? 'Connexion requise' : 'Login required',
        description:
          lang === 'fr'
            ? 'Connectez-vous pour aimer cet article.'
            : 'Sign in to like this article.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await apiService.articles.toggleLike(slug);
      await engagementQuery.refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast({ title: lang === 'fr' ? 'Erreur' : 'Error', description: message, variant: 'destructive' });
    }
  };

  const handleCommentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!slug || !user) {
      toast({
        title: lang === 'fr' ? 'Connexion requise' : 'Login required',
        description:
          lang === 'fr'
            ? 'Connectez-vous pour commenter cet article.'
            : 'Sign in to comment on this article.',
        variant: 'destructive',
      });
      return;
    }

    if (comment.trim().length < 2) {
      toast({
        title: lang === 'fr' ? 'Commentaire trop court' : 'Comment too short',
        description:
          lang === 'fr'
            ? 'Veuillez écrire au moins 2 caractères.'
            : 'Please write at least 2 characters.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      await apiService.articles.addComment(slug, comment.trim());
      setComment('');
      await Promise.all([commentsQuery.refetch(), engagementQuery.refetch()]);
      toast({ title: lang === 'fr' ? 'Commentaire ajouté' : 'Comment added' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast({ title: lang === 'fr' ? 'Erreur' : 'Error', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (articleQuery.isLoading) {
    return <PageState type="loading" title={lang === 'fr' ? 'Chargement...' : 'Loading...'} />;
  }

  if (articleQuery.isError || !article) {
    return <PageState type="error" title={lang === 'fr' ? 'Article introuvable' : 'Article not found'} />;
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Seo
        title={title}
        description={excerpt || stripHtml(content).slice(0, 160)}
        image={article.coverImageUrl || undefined}
        path={`/articles/${article.slug}`}
        schema={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: title,
          datePublished: article.publishedAt,
          dateModified: article.updatedAt,
          image: article.coverImageUrl,
          description: excerpt || stripHtml(content).slice(0, 160),
        }}
      />
      <Link to="/articles" className="mb-6 inline-flex text-sm text-primary hover:underline">
        {lang === 'fr' ? '← Retour aux articles' : '← Back to articles'}
      </Link>

      <article className="space-y-6">
        {article.coverImageUrl ? (
          <img
            src={article.coverImageUrl}
            alt={title}
            className="h-[360px] w-full rounded-xl object-cover"
          />
        ) : null}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {article.publishedAt
              ? new Date(article.publishedAt).toLocaleDateString(
                  lang === 'fr' ? 'fr-FR' : 'en-US',
                )
              : '-'}
          </p>
          {article.category ? (
            <Link
              to={`/articles?category=${encodeURIComponent(article.category)}`}
              className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs text-primary hover:bg-primary/15"
            >
              {article.category}
            </Link>
          ) : null}
          <h1 className="font-heading text-4xl font-bold">{title}</h1>
          {article.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <Link
                  key={tag}
                  to={`/articles?tag=${encodeURIComponent(tag)}`}
                  className="inline-flex rounded-full border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          ) : null}
          {excerpt ? <p className="text-lg text-muted-foreground">{excerpt}</p> : null}
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4">
          <Button variant={engagement?.likedByCurrentUser ? 'default' : 'outline'} onClick={handleToggleLike}>
            <Heart className="mr-2 h-4 w-4" />
            {engagement?.likeCount || 0}
          </Button>
          <div className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground">
            <MessageCircle className="h-4 w-4" />
            {engagement?.commentCount || 0}
          </div>
          <Button variant="outline" onClick={handleNativeShare}>
            <Share2 className="mr-2 h-4 w-4" />
            {lang === 'fr' ? 'Partager' : 'Share'}
          </Button>
          <Button variant="outline" onClick={handleCopyLink}>
            <Copy className="mr-2 h-4 w-4" />
            {lang === 'fr' ? 'Copier le lien' : 'Copy link'}
          </Button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${title} ${articleUrl}`)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-muted"
          >
            <Send className="mr-2 h-4 w-4" /> WhatsApp
          </a>
        </div>

        <div
          className="prose prose-neutral max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </article>

      <section className="mt-12 space-y-6">
        <div>
          <h2 className="font-heading text-2xl font-semibold">
            {lang === 'fr' ? 'Commentaires' : 'Comments'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {lang === 'fr'
              ? 'Partagez votre avis sur cet article.'
              : 'Share your opinion about this article.'}
          </p>
        </div>

        <Card>
          <CardContent className="space-y-4 p-4">
            {user ? (
              <form onSubmit={handleCommentSubmit} className="space-y-3">
                <Textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder={
                    lang === 'fr'
                      ? 'Écrivez votre commentaire...'
                      : 'Write your comment...'
                  }
                  className="min-h-[120px]"
                />
                <Button type="submit" disabled={submitting}>
                  {submitting
                    ? lang === 'fr'
                      ? 'Envoi...'
                      : 'Sending...'
                    : lang === 'fr'
                      ? 'Publier le commentaire'
                      : 'Post comment'}
                </Button>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground">
                {lang === 'fr'
                  ? 'Connectez-vous pour laisser un commentaire.'
                  : 'Sign in to leave a comment.'}
              </p>
            )}
          </CardContent>
        </Card>

        {commentsQuery.isLoading ? (
          <PageState type="loading" title={lang === 'fr' ? 'Chargement des commentaires...' : 'Loading comments...'} />
        ) : comments.length === 0 ? (
          <PageState
            type="empty"
            title={lang === 'fr' ? 'Aucun commentaire' : 'No comments yet'}
          />
        ) : (
          <div className="space-y-4">
            {comments.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium">
                      {entry.user?.profile?.fullName || entry.user?.email || entry.userId}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {entry.createdAt
                        ? new Date(entry.createdAt).toLocaleDateString(
                            lang === 'fr' ? 'fr-FR' : 'en-US',
                          )
                        : '-'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{entry.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
