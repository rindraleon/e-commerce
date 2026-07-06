import { ChangeEvent, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiService from '@/api/api-service';
import PageState from '@/components/common/PageState';
import RichTextEditor from '@/components/editor/RichTextEditor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { Article } from '@/types/domain';
import { useToast } from '@/hooks/use-toast';
import { stripHtml, truncateText } from '@/utils/text';
import { Eye, FileText, Pencil, Plus, Trash2 } from 'lucide-react';

interface ArticleFormState {
  title: string;
  titleEn: string;
  category: string;
  tags: string;
  excerpt: string;
  excerptEn: string;
  content: string;
  contentEn: string;
  isPublished: boolean;
  coverImageFile: File | null;
}

const emptyForm: ArticleFormState = {
  title: '',
  titleEn: '',
  category: '',
  tags: '',
  excerpt: '',
  excerptEn: '',
  content: '',
  contentEn: '',
  isPublished: false,
  coverImageFile: null,
};

export default function AdminArticles() {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [form, setForm] = useState<ArticleFormState>(emptyForm);

  const articlesQuery = useQuery({
    queryKey: ['admin-articles'],
    queryFn: () => apiService.articles.findAdminAll({ page: 1, limit: 50 }),
  });

  const parsedTags = useMemo(
    () =>
      form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    [form.tags],
  );

  const currentPreviewTitle = lang === 'fr' ? form.title : form.titleEn || form.title;
  const currentPreviewExcerpt =
    lang === 'fr' ? form.excerpt : form.excerptEn || form.excerpt;
  const currentPreviewContent =
    lang === 'fr' ? form.content : form.contentEn || form.content;

  const resetForm = () => {
    setEditingArticle(null);
    setForm(emptyForm);
  };

  const handleCoverChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({
      ...current,
      coverImageFile: event.target.files?.[0] || null,
    }));
  };

  const openEditor = (article?: Article) => {
    if (article) {
      setEditingArticle(article);
      setForm({
        title: article.title,
        titleEn: article.titleEn || '',
        category: article.category || '',
        tags: article.tags.join(', '),
        excerpt: article.excerpt || '',
        excerptEn: article.excerptEn || '',
        content: article.content,
        contentEn: article.contentEn || '',
        isPublished: article.isPublished,
        coverImageFile: null,
      });
    } else {
      resetForm();
    }
    setOpen(true);
  };

  const saveArticle = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      title: form.title,
      titleEn: form.titleEn,
      category: form.category,
      tags: parsedTags,
      excerpt: form.excerpt,
      excerptEn: form.excerptEn,
      content: form.content,
      contentEn: form.contentEn,
      isPublished: form.isPublished,
      coverImageFile: form.coverImageFile,
    };

    try {
      if (editingArticle) {
        await apiService.articles.update(editingArticle.id, payload);
      } else {
        await apiService.articles.create(payload);
      }
      toast({ title: lang === 'fr' ? 'Article enregistré' : 'Article saved' });
      await queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      setOpen(false);
      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast({
        title: lang === 'fr' ? 'Erreur' : 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const removeArticle = async (articleId: string) => {
    try {
      await apiService.articles.delete(articleId);
      toast({ title: lang === 'fr' ? 'Article supprimé' : 'Article deleted' });
      await queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast({
        title: lang === 'fr' ? 'Erreur' : 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  if (articlesQuery.isLoading) {
    return <PageState type="loading" title={lang === 'fr' ? 'Chargement...' : 'Loading...'} />;
  }

  if (articlesQuery.isError) {
    return (
      <PageState
        type="error"
        title={lang === 'fr' ? 'Impossible de charger les articles' : 'Unable to load articles'}
        action={{
          label: lang === 'fr' ? 'Réessayer' : 'Retry',
          onClick: () => articlesQuery.refetch(),
        }}
      />
    );
  }

  const articles = articlesQuery.data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            {lang === 'fr' ? 'Articles' : 'Articles'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {lang === 'fr'
              ? 'Gérez les articles, catégories éditoriales et tags.'
              : 'Manage articles, editorial categories and tags.'}
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(value) => {
            setOpen(value);
            if (!value) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => openEditor()}>
              <Plus className="mr-2 h-4 w-4" />
              {lang === 'fr' ? 'Nouvel article' : 'New article'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingArticle
                  ? lang === 'fr'
                    ? 'Modifier l’article'
                    : 'Edit article'
                  : lang === 'fr'
                    ? 'Créer un article'
                    : 'Create article'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={saveArticle} className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Titre</Label>
                    <Input
                      required
                      value={form.title}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, title: event.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Title (EN)</Label>
                    <Input
                      value={form.titleEn}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, titleEn: event.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>{lang === 'fr' ? 'Catégorie article' : 'Article category'}</Label>
                    <Input
                      value={form.category}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, category: event.target.value }))
                      }
                      placeholder={lang === 'fr' ? 'Ex: Conseils, Actualités, Guides' : 'Eg: Tips, News, Guides'}
                    />
                  </div>
                  <div>
                    <Label>{lang === 'fr' ? 'Tags (séparés par virgules)' : 'Tags (comma separated)'}</Label>
                    <Input
                      value={form.tags}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, tags: event.target.value }))
                      }
                      placeholder={lang === 'fr' ? 'mode, maison, promo' : 'fashion, home, promo'}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Résumé</Label>
                    <Textarea
                      value={form.excerpt}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, excerpt: event.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Excerpt (EN)</Label>
                    <Textarea
                      value={form.excerptEn}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, excerptEn: event.target.value }))
                      }
                    />
                  </div>
                </div>

                <RichTextEditor
                  label="Contenu"
                  value={form.content}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, content: value }))
                  }
                  placeholder="Rédigez le contenu de l’article..."
                />

                <RichTextEditor
                  label="Content (EN)"
                  value={form.contentEn}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, contentEn: value }))
                  }
                  placeholder="Write the article content..."
                />

                <div className="space-y-2">
                  <Label>{lang === 'fr' ? 'Image de couverture' : 'Cover image'}</Label>
                  <Input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleCoverChange}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label>{lang === 'fr' ? 'Publié' : 'Published'}</Label>
                  <Switch
                    checked={form.isPublished}
                    onCheckedChange={(value) =>
                      setForm((current) => ({ ...current, isPublished: value }))
                    }
                  />
                </div>

                <Button type="submit" className="w-full">
                  {lang === 'fr' ? 'Enregistrer' : 'Save'}
                </Button>
              </div>

              <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Eye className="h-4 w-4" />
                  {lang === 'fr' ? 'Aperçu en direct' : 'Live preview'}
                </div>
                <div className="space-y-3">
                  {form.category ? <Badge variant="secondary">{form.category}</Badge> : null}
                  {parsedTags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {parsedTags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  <h2 className="font-heading text-2xl font-semibold">
                    {currentPreviewTitle || (lang === 'fr' ? 'Titre de l’article' : 'Article title')}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {currentPreviewExcerpt ||
                      (lang === 'fr'
                        ? 'Le résumé de l’article apparaîtra ici.'
                        : 'The article excerpt will appear here.')}
                  </p>
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{
                      __html:
                        currentPreviewContent ||
                        `<p>${
                          lang === 'fr'
                            ? 'Le contenu enrichi apparaîtra ici.'
                            : 'The rich content preview will appear here.'
                        }</p>`,
                    }}
                  />
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {articles.map((article) => (
          <Card key={article.id} className="overflow-hidden">
            {article.coverImageUrl ? (
              <img
                src={article.coverImageUrl}
                alt={article.title}
                className="h-48 w-full object-cover"
              />
            ) : (
              <div className="flex h-48 items-center justify-center bg-muted text-muted-foreground">
                <FileText className="h-12 w-12" />
              </div>
            )}
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-heading text-xl font-semibold">
                  {article.title}
                </h2>
                <span
                  className={`rounded-full px-3 py-1 text-xs ${
                    article.isPublished
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {article.isPublished
                    ? lang === 'fr'
                      ? 'Publié'
                      : 'Published'
                    : lang === 'fr'
                      ? 'Brouillon'
                      : 'Draft'}
                </span>
              </div>
              {article.category ? <Badge variant="secondary">{article.category}</Badge> : null}
              {article.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
              <p className="line-clamp-3 text-sm text-muted-foreground">
                {article.excerpt || truncateText(stripHtml(article.content), 160)}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditor(article)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  {lang === 'fr' ? 'Modifier' : 'Edit'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeArticle(article.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                  {lang === 'fr' ? 'Supprimer' : 'Delete'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
