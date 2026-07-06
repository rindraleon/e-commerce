import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiService from '@/api/api-service';
import PageState from '@/components/common/PageState';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Download } from 'lucide-react';

const AdminOrders = () => {
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const ordersQuery = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => apiService.orders.findByUserId({ page: 1, limit: 50 }),
  });

  const updateStatus = async (id: string, status: string) => {
    try {
      await apiService.orders.updateStatus(id, { status });
      toast({ title: t.common.success });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    } catch (error: any) {
      toast({ title: t.common.error, description: error.message, variant: 'destructive' });
    }
  };

  const orders = ordersQuery.data?.data || [];

  if (ordersQuery.isLoading) return <PageState type="loading" title={t.common.loading} />;
  if (ordersQuery.isError) return <PageState type="error" title={t.common.error} action={{ label: lang === 'fr' ? 'Réessayer' : 'Retry', onClick: () => ordersQuery.refetch() }} />;

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">{t.admin.orders}</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">{order.orderNumber}</p>
                  <p className="text-sm text-muted-foreground">{order.user?.profile?.fullName || order.user?.email || '-'} • ${order.totalAmount.toFixed(2)}</p>
                  {order.discountAmount > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Coupon {order.couponCode || '-'} • -${order.discountAmount.toFixed(2)}
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {order.payments[0]?.paymentMethod || 'mobile'} • {order.payments[0]?.transactionId || '-'}
                  </p>
                  {order.payments[0]?.proofImageUrl ? (
                    <a
                      href={order.payments[0].proofImageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      Voir la preuve de paiement
                    </a>
                  ) : null}
                </div>
                <Select value={order.status} onValueChange={(value) => updateStatus(order.id, value)}>
                  <SelectTrigger className="w-full md:w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['pending', 'paid', 'shipped', 'delivered', 'cancelled'].map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        ))}
        {!orders.length && <PageState type="empty" title={t.common.noResults} />}
      </div>
    </div>
  );
};

export default AdminOrders;
