import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiService from '@/api/api-service';
import PageState from '@/components/common/PageState';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

const AdminReturns = () => {
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const returnsQuery = useQuery({
    queryKey: ['admin-returns'],
    queryFn: () => apiService.returns.findAll({ page: 1, limit: 50 }),
  });

  const updateStatus = async (id: string, status: string) => {
    try {
      await apiService.returns.updateStatus(id, status);
      toast({ title: t.common.success });
      queryClient.invalidateQueries({ queryKey: ['admin-returns'] });
    } catch (error: any) {
      toast({ title: t.common.error, description: error.message, variant: 'destructive' });
    }
  };

  const returns = returnsQuery.data?.data || [];

  if (returnsQuery.isLoading) return <PageState type="loading" title={t.common.loading} />;
  if (returnsQuery.isError) return <PageState type="error" title={t.common.error} action={{ label: lang === 'fr' ? 'Réessayer' : 'Retry', onClick: () => returnsQuery.refetch() }} />;

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">{t.admin.returns}</h1>
      <div className="space-y-4">
        {returns.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">{item.order?.orderNumber || item.orderId}</p>
                  <p className="text-sm text-muted-foreground">{item.user?.profile?.fullName || item.user?.email || '-'} • {item.reason}</p>
                </div>
                <Select value={item.status} onValueChange={(value) => updateStatus(item.id, value)}>
                  <SelectTrigger className="w-full md:w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['requested', 'approved', 'rejected', 'refunded'].map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        ))}
        {!returns.length && <PageState type="empty" title={t.common.noResults} />}
      </div>
    </div>
  );
};

export default AdminReturns;
