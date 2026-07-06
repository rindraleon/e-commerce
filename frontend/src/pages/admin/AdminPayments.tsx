import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiService from '@/api/api-service';
import PageState from '@/components/common/PageState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Download, Search, Wallet } from 'lucide-react';

const paymentStatuses = ['all', 'pending', 'completed', 'failed', 'refunded'];
const paymentMethods = ['all', 'mvola', 'airtel_money', 'orange_money'];

export default function AdminPayments() {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');

  const summaryQuery = useQuery({
    queryKey: ['admin-payments-summary'],
    queryFn: () => apiService.admin.getPaymentSummary(),
  });

  const paymentsQuery = useQuery({
    queryKey: ['admin-payments', search, statusFilter, methodFilter],
    queryFn: () =>
      apiService.admin.getPayments({
        page: 1,
        limit: 50,
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        payment_method: methodFilter !== 'all' ? methodFilter : undefined,
      }),
  });

  const updateStatus = async (paymentId: string, status: string) => {
    try {
      await apiService.admin.updatePaymentStatus(paymentId, status);
      toast({
        title: lang === 'fr' ? 'Paiement mis à jour' : 'Payment updated',
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-payments'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-payments-summary'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-stats'] }),
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast({
        title: lang === 'fr' ? 'Erreur' : 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const payments = paymentsQuery.data?.data || [];
  const summary = summaryQuery.data;

  const summaryCards = useMemo(
    () => [
      {
        label: lang === 'fr' ? 'Paiements total' : 'Total payments',
        value: summary?.totalPayments || 0,
        icon: CreditCard,
      },
      {
        label: lang === 'fr' ? 'Revenu confirmé' : 'Confirmed revenue',
        value: `$${(summary?.completedRevenue || 0).toFixed(2)}`,
        icon: Wallet,
      },
      {
        label: lang === 'fr' ? 'Montant en attente' : 'Pending amount',
        value: `$${(summary?.pendingAmount || 0).toFixed(2)}`,
        icon: CreditCard,
      },
      {
        label: lang === 'fr' ? 'Paiements en attente' : 'Pending payments',
        value: summary?.pendingCount || 0,
        icon: CreditCard,
      },
    ],
    [lang, summary],
  );

  if (summaryQuery.isLoading || paymentsQuery.isLoading) {
    return (
      <PageState
        type="loading"
        title={lang === 'fr' ? 'Chargement...' : 'Loading...'}
      />
    );
  }

  if (summaryQuery.isError || paymentsQuery.isError || !summary) {
    return (
      <PageState
        type="error"
        title={lang === 'fr' ? 'Impossible de charger les paiements' : 'Unable to load payments'}
        action={{
          label: lang === 'fr' ? 'Réessayer' : 'Retry',
          onClick: () => {
            summaryQuery.refetch();
            paymentsQuery.refetch();
          },
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">
          {lang === 'fr' ? 'Paiements' : 'Payments'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {lang === 'fr'
            ? 'Suivez les paiements mobiles, filtrez-les et validez-les rapidement.'
            : 'Track mobile payments, filter them and validate them quickly.'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{card.label}</span>
                <card.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{lang === 'fr' ? 'Filtres' : 'Filters'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={
                  lang === 'fr'
                    ? 'Rechercher référence, client, commande...'
                    : 'Search reference, customer, order...'
                }
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status === 'all'
                      ? lang === 'fr'
                        ? 'Tous les statuts'
                        : 'All statuses'
                      : status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method === 'all'
                      ? lang === 'fr'
                        ? 'Toutes les méthodes'
                        : 'All methods'
                      : method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{lang === 'fr' ? 'Liste des paiements' : 'Payments list'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {payments.map((payment) => {
            const order = payment.order;
            const invoiceOrderId = order?.id || payment.orderId || '';
            return (
              <div
                key={payment.id}
                className="flex flex-col gap-4 rounded-lg border p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{order?.orderNumber || payment.orderId}</p>
                  <p className="text-muted-foreground">
                    {payment.user?.profile?.fullName || payment.user?.email || '-'}
                  </p>
                  <p>{payment.paymentMethod} • {payment.transactionId || '-'}</p>
                  <p className="text-muted-foreground">
                    ${payment.amount.toFixed(2)} • {payment.payerPhone || '-'}
                  </p>
                  {payment.proofImageUrl ? (
                    <a
                      href={payment.proofImageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      {lang === 'fr' ? 'Voir la preuve de paiement' : 'View payment proof'}
                    </a>
                  ) : null}
                </div>

                <div className="flex flex-col gap-3 lg:w-[260px]">
                  <div className="flex items-center gap-2">
                    <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                      {payment.status}
                    </Badge>
                    {invoiceOrderId ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => apiService.orders.downloadInvoice(invoiceOrderId)}
                      >
                        <Download className="mr-2 h-4 w-4" /> PDF
                      </Button>
                    ) : null}
                  </div>
                  <Select
                    value={payment.status}
                    onValueChange={(value) => updateStatus(payment.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentStatuses
                        .filter((status) => status !== 'all')
                        .map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })}
          {!payments.length ? (
            <PageState
              type="empty"
              title={lang === 'fr' ? 'Aucun paiement' : 'No payments'}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
