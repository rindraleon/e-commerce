import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiService from '@/api/api-service';
import PageState from '@/components/common/PageState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Check, Star, Trash2, X } from 'lucide-react';

const AdminReviews = () => {
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const reviewsQuery = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: () => apiService.reviews.findByUserId({ page: 1, limit: 50 }),
  });

  const updateStatus = async (id: string, status: string) => {
    try {
      await apiService.reviews.updateStatus(id, status);
      toast({ title: t.common.success });
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    } catch (error: any) {
      toast({ title: t.common.error, description: error.message, variant: 'destructive' });
    }
  };

  const deleteReview = async (id: string) => {
    try {
      await apiService.reviews.delete(id);
      toast({ title: t.common.success });
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    } catch (error: any) {
      toast({ title: t.common.error, description: error.message, variant: 'destructive' });
    }
  };

  const reviews = reviewsQuery.data?.data || [];
  const statusColor: Record<string, string> = { pending: 'bg-warning', approved: 'bg-accent', rejected: 'bg-destructive' };

  if (reviewsQuery.isLoading) return <PageState type="loading" title={t.common.loading} />;
  if (reviewsQuery.isError) return <PageState type="error" title={t.common.error} action={{ label: lang === 'fr' ? 'Réessayer' : 'Retry', onClick: () => reviewsQuery.refetch() }} />;

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">{t.admin.reviews}</h1>
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-4">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium">{review.user?.profile?.fullName || review.user?.email || review.userId} → {review.product?.name || review.productId}</p>
                  <div className="mt-1 flex gap-1">{[1, 2, 3, 4, 5].map((star) => <Star key={star} className={`h-3 w-3 ${star <= review.rating ? 'fill-warning text-warning' : 'text-muted'}`} />)}</div>
                </div>
                <Badge className={statusColor[review.moderationStatus]}>{review.moderationStatus}</Badge>
              </div>
              <p className="mb-3 text-sm text-muted-foreground">{review.comment}</p>
              <div className="flex gap-2">
                {review.moderationStatus !== 'approved' && <Button size="sm" variant="outline" className="gap-1" onClick={() => updateStatus(review.id, 'approved')}><Check className="h-3 w-3" /> {t.admin.approve}</Button>}
                {review.moderationStatus !== 'rejected' && <Button size="sm" variant="outline" className="gap-1" onClick={() => updateStatus(review.id, 'rejected')}><X className="h-3 w-3" /> {t.admin.reject}</Button>}
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteReview(review.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!reviews.length && <PageState type="empty" title={t.common.noResults} />}
      </div>
    </div>
  );
};

export default AdminReviews;
