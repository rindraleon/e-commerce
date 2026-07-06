import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiService from '@/api/api-service';
import PageState from '@/components/common/PageState';
import Seo from '@/components/common/Seo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { Download, Package } from 'lucide-react';

const statusColors: Record<string, string> = {
  pending: 'bg-warning text-warning-foreground',
  paid: 'bg-secondary text-secondary-foreground',
  shipped: 'bg-primary text-primary-foreground',
  delivered: 'bg-accent text-accent-foreground',
  cancelled: 'bg-destructive text-destructive-foreground',
};

const OrdersPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  const ordersQuery = useQuery({
    queryKey: ['my-orders', user?.id],
    queryFn: () => apiService.orders.findByUserId({ page: 1, limit: 20 }),
    enabled: !!user,
  });

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: t.orders.pending,
      paid: t.orders.paid,
      shipped: t.orders.shipped,
      delivered: t.orders.delivered,
      cancelled: t.orders.cancelled,
    };
    return map[status] || status;
  };

  if (authLoading || ordersQuery.isLoading) {
    return <div className="container mx-auto px-4 py-8"><PageState type="loading" title={t.common.loading} /></div>;
  }

  const orders = ordersQuery.data?.data || [];

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Seo title="Mes commandes" description="Suivez vos commandes E-shop Pro." path="/orders" noIndex />
      <h1 className="mb-8 font-heading text-3xl font-bold">{t.orders.title}</h1>
      {ordersQuery.isError ? (
        <PageState type="error" title={t.common.error} action={{ label: lang === 'fr' ? 'Réessayer' : 'Retry', onClick: () => ordersQuery.refetch() }} />
      ) : orders.length ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-4">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="font-heading font-bold">{t.orders.orderNumber} {order.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">{order.createdAt ? new Date(order.createdAt).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US') : '-'}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={statusColors[order.status] || ''}>{getStatusLabel(order.status)}</Badge>
                    <p className="mt-1 font-bold text-primary">${order.totalAmount.toFixed(2)}</p>
                    {order.discountAmount > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        {lang === 'fr' ? 'Remise' : 'Discount'}
                        {order.couponCode ? ` (${order.couponCode})` : ''} : -$
                        {order.discountAmount.toFixed(2)}
                      </p>
                    ) : null}
                  </div>
                </div>
                <p className="mb-2 text-xs text-muted-foreground">
                  {order.payments[0]?.paymentMethod ? `${order.payments[0].paymentMethod} • ${order.payments[0].transactionId || '-'}` : ''}
                </p>
                {order.payments[0]?.proofImageUrl ? (
                  <a
                    href={order.payments[0].proofImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mb-2 inline-block text-xs text-primary hover:underline"
                  >
                    {lang === 'fr' ? 'Voir la preuve de paiement' : 'View payment proof'}
                  </a>
                ) : null}
                <div className="mb-2 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => apiService.orders.downloadInvoice(order.id)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {lang === 'fr' ? 'Facture PDF' : 'Invoice PDF'}
                  </Button>
                </div>
                <div className="flex gap-2 overflow-x-auto">
                  {order.orderItems.slice(0, 4).map((item) => {
                    const image = item.product?.images.find((media) => media.isPrimary)?.imageUrl || item.product?.images[0]?.imageUrl;
                    return (
                      <div key={item.id} className="h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-muted">
                        {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : <Package className="h-full w-full p-2 text-muted-foreground/30" />}
                      </div>
                    );
                  })}
                  {order.orderItems.length > 4 && <span className="self-center text-sm text-muted-foreground">+{order.orderItems.length - 4}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <PageState
          type="empty"
          title={t.orders.noOrders}
          action={{ label: t.cart.continueShopping, onClick: () => navigate('/catalog') }}
        />
      )}
    </div>
  );
};

export default OrdersPage;
