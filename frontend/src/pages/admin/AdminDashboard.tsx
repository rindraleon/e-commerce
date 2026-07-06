import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  CreditCard,
  Database,
  DollarSign,
  FileText,
  MessageCircle,
  Repeat2,
  ShoppingCart,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useState } from 'react';
import apiService from '@/api/api-service';
import DashboardChartCard from '@/components/admin/DashboardChartCard';
import DashboardMetricCard from '@/components/admin/DashboardMetricCard';
import PageState from '@/components/common/PageState';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

const PERIOD_OPTIONS = [
  { value: '7', labelFr: '7 jours', labelEn: '7 days' },
  { value: '30', labelFr: '30 jours', labelEn: '30 days' },
  { value: '90', labelFr: '90 jours', labelEn: '90 days' },
  { value: '365', labelFr: '12 mois', labelEn: '12 months' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  paid: '#10b981',
  shipped: '#3b82f6',
  delivered: '#8b5cf6',
  cancelled: '#ef4444',
  completed: '#10b981',
  failed: '#ef4444',
  refunded: '#6366f1',
};

const AdminDashboard = () => {
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const [periodDays, setPeriodDays] = useState('30');
  const [isSeedingDemo, setIsSeedingDemo] = useState(false);

  const copy = {
    analytics: lang === 'fr' ? 'Analytics avancées' : 'Advanced analytics',
    analyticsDescription:
      lang === 'fr'
        ? 'Vue détaillée des ventes, paiements et engagement admin.'
        : 'Detailed view of sales, payments and admin engagement.',
    period: lang === 'fr' ? 'Période' : 'Period',
    updatedAt: lang === 'fr' ? 'Mis à jour le' : 'Updated on',
    retry: lang === 'fr' ? 'Réessayer' : 'Retry',
    demoSeedTitle:
      lang === 'fr' ? 'Données de démonstration' : 'Demo data',
    demoSeedDescription:
      lang === 'fr'
        ? 'Réinitialiser rapidement admin, produits, coupons et articles de démonstration.'
        : 'Quickly reset admin, demo products, coupons and articles.',
    demoSeedButton:
      lang === 'fr' ? 'Seeder / reset démo' : 'Seed / reset demo',
    demoSeedSuccess:
      lang === 'fr'
        ? 'Les données de démonstration ont été réinitialisées avec succès.'
        : 'Demo data has been reset successfully.',
    totalRevenueDescription:
      lang === 'fr'
        ? 'Revenu confirmé sur tout le catalogue.'
        : 'Confirmed revenue across the catalog.',
    totalOrdersDescription:
      lang === 'fr'
        ? 'Commandes cumulées depuis le lancement.'
        : 'Cumulative orders since launch.',
    pendingPaymentsDescription:
      lang === 'fr'
        ? 'Paiements mobiles encore à valider.'
        : 'Mobile payments still awaiting validation.',
    totalClientsDescription:
      lang === 'fr'
        ? 'Clients inscrits sur la plateforme.'
        : 'Registered clients on the platform.',
    averageOrderValue: lang === 'fr' ? 'Panier moyen' : 'Average order value',
    repeatCustomers:
      lang === 'fr' ? 'Clients récurrents' : 'Repeat customers',
    newUsers: lang === 'fr' ? 'Nouveaux utilisateurs' : 'New users',
    activeSubscribers:
      lang === 'fr' ? 'Abonnés actifs' : 'Active subscribers',
    publishedArticles:
      lang === 'fr' ? 'Articles publiés' : 'Published articles',
    approvedComments:
      lang === 'fr' ? 'Commentaires approuvés' : 'Approved comments',
    articleLikes: lang === 'fr' ? 'Likes articles' : 'Article likes',
    salesPerformance:
      lang === 'fr' ? 'Performance commerciale' : 'Sales performance',
    salesPerformanceDescription:
      lang === 'fr'
        ? 'Évolution des commandes et du revenu confirmé.'
        : 'Orders and confirmed revenue over time.',
    mobilePayments:
      lang === 'fr' ? 'Paiements mobiles' : 'Mobile payments',
    mobilePaymentsDescription:
      lang === 'fr'
        ? 'Volume des paiements et montant validé.'
        : 'Payment volume and validated amount.',
    customerGrowth:
      lang === 'fr' ? 'Croissance clients' : 'Customer growth',
    customerGrowthDescription:
      lang === 'fr'
        ? 'Nouvelles inscriptions sur la période.'
        : 'New signups during the selected period.',
    statusBreakdown:
      lang === 'fr' ? 'Répartition des statuts' : 'Status breakdown',
    statusBreakdownDescription:
      lang === 'fr'
        ? 'Suivi rapide des commandes et paiements.'
        : 'Quick tracking of orders and payments.',
    topProducts:
      lang === 'fr' ? 'Produits les plus vendus' : 'Top selling products',
    categoryPerformance:
      lang === 'fr' ? 'Performance par catégorie' : 'Category performance',
    topArticles:
      lang === 'fr' ? 'Articles les plus engageants' : 'Most engaging articles',
    recentOrders: lang === 'fr' ? 'Commandes récentes' : 'Recent orders',
    generatedInsights:
      lang === 'fr' ? 'Indicateurs générés' : 'Generated insights',
    revenue: lang === 'fr' ? 'Revenu' : 'Revenue',
    orders: lang === 'fr' ? 'Commandes' : 'Orders',
    paidOrders: lang === 'fr' ? 'Commandes payées' : 'Paid orders',
    payments: lang === 'fr' ? 'Paiements' : 'Payments',
    amount: lang === 'fr' ? 'Montant' : 'Amount',
    signups: lang === 'fr' ? 'Inscriptions' : 'Signups',
    orderStatuses:
      lang === 'fr' ? 'Statuts commandes' : 'Order statuses',
    paymentStatuses:
      lang === 'fr' ? 'Statuts paiements' : 'Payment statuses',
    paymentMethods:
      lang === 'fr' ? 'Méthodes paiement' : 'Payment methods',
    qty: lang === 'fr' ? 'Qté' : 'Qty',
    stock: lang === 'fr' ? 'Stock' : 'Stock',
    comments: lang === 'fr' ? 'Commentaires' : 'Comments',
    likes: lang === 'fr' ? 'Likes' : 'Likes',
    score: lang === 'fr' ? 'Score' : 'Score',
  };

  const formatMoney = (value: number) =>
    new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(value || 0);

  const formatCount = (value: number) =>
    new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-US').format(value || 0);

  const formatShortDate = (value?: string) => {
    if (!value) return '-';
    return new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-US', {
      day: '2-digit',
      month: 'short',
    }).format(new Date(value));
  };

  const formatDateTime = (value?: string) => {
    if (!value) return '-';
    return new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  };

  const formatStatusLabel = (value: string) => {
    const map: Record<string, string> = {
      pending: lang === 'fr' ? 'En attente' : 'Pending',
      paid: lang === 'fr' ? 'Payée' : 'Paid',
      shipped: lang === 'fr' ? 'Expédiée' : 'Shipped',
      delivered: lang === 'fr' ? 'Livrée' : 'Delivered',
      cancelled: lang === 'fr' ? 'Annulée' : 'Cancelled',
      completed: lang === 'fr' ? 'Complété' : 'Completed',
      failed: lang === 'fr' ? 'Échoué' : 'Failed',
      refunded: lang === 'fr' ? 'Remboursé' : 'Refunded',
    };

    return map[value] || value;
  };

  const formatPaymentMethodLabel = (value: string) => {
    const map: Record<string, string> = {
      mvola: 'MVola',
      airtel_money: 'Airtel Money',
      orange_money: 'Orange Money',
    };

    return map[value] || value;
  };

  const statsQuery = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => apiService.admin.getStats(),
  });

  const analyticsQuery = useQuery({
    queryKey: ['admin-analytics', periodDays],
    queryFn: () => apiService.admin.getAnalytics(Number(periodDays)),
    placeholderData: keepPreviousData,
  });

  const stats = statsQuery.data;
  const analytics = analyticsQuery.data;

  const isLoading = statsQuery.isLoading || analyticsQuery.isLoading;
  const hasError = statsQuery.isError || analyticsQuery.isError;

  if (isLoading && (!stats || !analytics)) {
    return <PageState type="loading" title={t.common.loading} />;
  }

  if (hasError || !stats || !analytics) {
    return (
      <PageState
        type="error"
        title={t.common.error}
        action={{
          label: copy.retry,
          onClick: () => {
            void statsQuery.refetch();
            void analyticsQuery.refetch();
          },
        }}
      />
    );
  }

  const totalPeriodRevenue = analytics.salesTimeline.reduce(
    (sum, item) => sum + (item.revenue || 0),
    0,
  );
  const totalPeriodOrders = analytics.salesTimeline.reduce(
    (sum, item) => sum + (item.orders || 0),
    0,
  );
  const totalPeriodPaidOrders = analytics.salesTimeline.reduce(
    (sum, item) => sum + (item.paidOrders || 0),
    0,
  );
  const totalPeriodPayments = analytics.paymentTimeline.reduce(
    (sum, item) => sum + (item.payments || 0),
    0,
  );
  const totalPeriodPaymentAmount = analytics.paymentTimeline.reduce(
    (sum, item) => sum + (item.amount || 0),
    0,
  );

  const metricCards = [
    {
      title: t.admin.revenue,
      value: formatMoney(stats.totalRevenue),
      description: copy.totalRevenueDescription,
      icon: DollarSign,
      iconClassName: 'text-primary',
    },
    {
      title: lang === 'fr' ? 'Total commandes' : 'Total orders',
      value: formatCount(stats.totalOrders),
      description: copy.totalOrdersDescription,
      icon: ShoppingCart,
      iconClassName: 'text-secondary',
    },
    {
      title: lang === 'fr' ? 'Paiements en attente' : 'Pending payments',
      value: formatCount(stats.paymentsOverview?.pendingCount || 0),
      description: copy.pendingPaymentsDescription,
      icon: CreditCard,
      iconClassName: 'text-warning',
    },
    {
      title: t.admin.totalClients,
      value: formatCount(stats.totalUsers),
      description: copy.totalClientsDescription,
      icon: Users,
      iconClassName: 'text-accent',
    },
  ];

  const analyticsCards = [
    {
      title: copy.averageOrderValue,
      value: formatMoney(analytics.overview.averageOrderValue),
      description: `${copy.generatedInsights} · ${analytics.periodDays}`,
      icon: TrendingUp,
      iconClassName: 'text-primary',
    },
    {
      title: copy.repeatCustomers,
      value: formatCount(analytics.overview.repeatCustomers),
      description: `${copy.publishedArticles}: ${formatCount(analytics.overview.publishedArticles)}`,
      icon: Repeat2,
      iconClassName: 'text-secondary',
    },
    {
      title: copy.newUsers,
      value: formatCount(analytics.overview.newUsers),
      description: `${copy.activeSubscribers}: ${formatCount(analytics.overview.activeSubscribers)}`,
      icon: UserPlus,
      iconClassName: 'text-accent',
    },
    {
      title: copy.approvedComments,
      value: formatCount(analytics.overview.approvedComments),
      description: `${copy.articleLikes}: ${formatCount(analytics.overview.articleLikes)}`,
      icon: MessageCircle,
      iconClassName: 'text-warning',
    },
  ];

  const handleSeedDemo = async () => {
    setIsSeedingDemo(true);
    try {
      await apiService.admin.seedDemo(true);
      toast({ title: copy.demoSeedSuccess });
      await Promise.all([statsQuery.refetch(), analyticsQuery.refetch()]);
    } catch (error) {
      toast({
        title: t.common.error,
        description: error instanceof Error ? error.message : t.common.error,
        variant: 'destructive',
      });
    } finally {
      setIsSeedingDemo(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold">{t.admin.dashboard}</h1>
          <p className="text-sm text-muted-foreground">{copy.analyticsDescription}</p>
          <p className="text-xs text-muted-foreground">
            {copy.updatedAt} {formatDateTime(analytics.generatedAt)}
          </p>
        </div>

        <div className="w-full max-w-[220px] space-y-2">
          <p className="text-sm font-medium">{copy.period}</p>
          <Select value={periodDays} onValueChange={setPeriodDays}>
            <SelectTrigger>
              <SelectValue placeholder={copy.period} />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {lang === 'fr' ? option.labelFr : option.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => (
          <DashboardMetricCard key={card.title} {...card} />
        ))}
      </div>

      <DashboardChartCard
        title={copy.demoSeedTitle}
        description={copy.demoSeedDescription}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            <p>admin@eshop.local / admin123</p>
            <p>client@eshop.local / client123</p>
          </div>
          <Button
            onClick={() => {
              void handleSeedDemo();
            }}
            disabled={isSeedingDemo}
            className="gap-2"
          >
            <Database className="h-4 w-4" />
            {isSeedingDemo ? t.common.loading : copy.demoSeedButton}
          </Button>
        </div>
      </DashboardChartCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {analyticsCards.map((card) => (
          <DashboardMetricCard key={card.title} {...card} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DashboardChartCard
          title={copy.salesPerformance}
          description={copy.salesPerformanceDescription}
          footer={
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">{copy.revenue}</p>
                <p className="text-sm font-semibold">{formatMoney(totalPeriodRevenue)}</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">{copy.orders}</p>
                <p className="text-sm font-semibold">{formatCount(totalPeriodOrders)}</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">{copy.paidOrders}</p>
                <p className="text-sm font-semibold">{formatCount(totalPeriodPaidOrders)}</p>
              </div>
            </div>
          }
        >
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={analytics.salesTimeline}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="date" tickFormatter={formatShortDate} />
                <YAxis yAxisId="left" allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  labelFormatter={(label) => formatDateTime(String(label))}
                  formatter={(value: number | string, name: string) => {
                    if (name === 'revenue') {
                      return [formatMoney(Number(value)), copy.revenue];
                    }
                    if (name === 'paidOrders') {
                      return [formatCount(Number(value)), copy.paidOrders];
                    }
                    return [formatCount(Number(value)), copy.orders];
                  }}
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="orders"
                  name={copy.orders}
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  name={copy.revenue}
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </DashboardChartCard>

        <DashboardChartCard
          title={copy.mobilePayments}
          description={copy.mobilePaymentsDescription}
          footer={
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">{copy.payments}</p>
                  <p className="text-sm font-semibold">{formatCount(totalPeriodPayments)}</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">{copy.amount}</p>
                  <p className="text-sm font-semibold">{formatMoney(totalPeriodPaymentAmount)}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {analytics.paymentMethodBreakdown.map((item) => (
                  <span
                    key={item.method}
                    className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                  >
                    {formatPaymentMethodLabel(item.method)} · {formatCount(item.count)} ·{' '}
                    {formatMoney(item.amount)}
                  </span>
                ))}
                {!analytics.paymentMethodBreakdown.length ? (
                  <span className="text-sm text-muted-foreground">{t.common.noResults}</span>
                ) : null}
              </div>
            </div>
          }
        >
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={analytics.paymentTimeline}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="date" tickFormatter={formatShortDate} />
                <YAxis yAxisId="left" allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  labelFormatter={(label) => formatDateTime(String(label))}
                  formatter={(value: number | string, name: string) => {
                    if (name === 'amount') {
                      return [formatMoney(Number(value)), copy.amount];
                    }
                    return [formatCount(Number(value)), copy.payments];
                  }}
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="payments"
                  name={copy.payments}
                  fill="#8b5cf6"
                  radius={[6, 6, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="amount"
                  name={copy.amount}
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </DashboardChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DashboardChartCard
          title={copy.customerGrowth}
          description={copy.customerGrowthDescription}
        >
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={analytics.customerGrowth}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="date" tickFormatter={formatShortDate} />
                <YAxis allowDecimals={false} />
                <Tooltip
                  labelFormatter={(label) => formatDateTime(String(label))}
                  formatter={(value: number | string) => [formatCount(Number(value)), copy.signups]}
                />
                <Bar
                  dataKey="newUsers"
                  name={copy.signups}
                  fill="#14b8a6"
                  radius={[6, 6, 0, 0]}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </DashboardChartCard>

        <DashboardChartCard
          title={copy.statusBreakdown}
          description={copy.statusBreakdownDescription}
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">{copy.orderStatuses}</h3>
              {analytics.orderStatusBreakdown.map((item) => (
                <div key={item.status} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{formatStatusLabel(item.status)}</span>
                    <span className="font-medium">{formatCount(item.count)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${Math.min(item.count * 10, 100)}%`,
                        backgroundColor: STATUS_COLORS[item.status] || '#3b82f6',
                      }}
                    />
                  </div>
                </div>
              ))}
              {!analytics.orderStatusBreakdown.length ? (
                <p className="text-sm text-muted-foreground">{t.common.noResults}</p>
              ) : null}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold">{copy.paymentStatuses}</h3>
              {analytics.paymentStatusBreakdown.map((item) => (
                <div
                  key={item.status}
                  className="rounded-lg border border-border/60 bg-muted/20 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm">{formatStatusLabel(item.status)}</span>
                    <span className="text-sm font-semibold">{formatCount(item.count)}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatMoney(item.amount || 0)}
                  </p>
                </div>
              ))}
              {!analytics.paymentStatusBreakdown.length ? (
                <p className="text-sm text-muted-foreground">{t.common.noResults}</p>
              ) : null}
            </div>
          </div>
        </DashboardChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <DashboardChartCard title={copy.topProducts} className="xl:col-span-1">
          <div className="space-y-3">
            {analytics.topProducts.map((product) => (
              <div
                key={product.productId}
                className="rounded-lg border border-border/60 bg-muted/20 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {copy.orders}: {formatCount(product.orderCount)} · {copy.stock}:{' '}
                      {formatCount(product.stock)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">{formatMoney(product.revenue)}</p>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {copy.qty}: {formatCount(product.quantitySold)}
                </p>
              </div>
            ))}
            {!analytics.topProducts.length ? (
              <p className="text-sm text-muted-foreground">{t.common.noResults}</p>
            ) : null}
          </div>
        </DashboardChartCard>

        <DashboardChartCard title={copy.categoryPerformance} className="xl:col-span-1">
          <div className="space-y-3">
            {analytics.categoryPerformance.map((category) => (
              <div
                key={category.categoryId}
                className="rounded-lg border border-border/60 bg-muted/20 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {copy.qty}: {formatCount(category.quantitySold)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">{formatMoney(category.revenue)}</p>
                </div>
              </div>
            ))}
            {!analytics.categoryPerformance.length ? (
              <p className="text-sm text-muted-foreground">{t.common.noResults}</p>
            ) : null}
          </div>
        </DashboardChartCard>

        <DashboardChartCard title={copy.topArticles} className="xl:col-span-1">
          <div className="space-y-3">
            {analytics.topArticles.map((article) => (
              <div
                key={article.articleId}
                className="rounded-lg border border-border/60 bg-muted/20 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-medium">{article.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatShortDate(article.publishedAt || undefined)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    <FileText className="h-3.5 w-3.5" />
                    {copy.score}: {formatCount(article.score)}
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {copy.likes}: {formatCount(article.likeCount)} · {copy.comments}:{' '}
                  {formatCount(article.commentCount)}
                </p>
              </div>
            ))}
            {!analytics.topArticles.length ? (
              <p className="text-sm text-muted-foreground">{t.common.noResults}</p>
            ) : null}
          </div>
        </DashboardChartCard>
      </div>

      <DashboardChartCard title={copy.recentOrders}>
        <div className="space-y-3">
          {stats.recentOrders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3"
            >
              <div>
                <p className="text-sm font-medium">{order.orderNumber}</p>
                <p className="text-xs text-muted-foreground">
                  {order.user?.profile?.fullName || order.user?.email || '-'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{formatMoney(order.totalAmount)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatStatusLabel(order.status)}
                </p>
              </div>
            </div>
          ))}
          {!stats.recentOrders.length ? (
            <p className="text-sm text-muted-foreground">{t.common.noResults}</p>
          ) : null}
        </div>
      </DashboardChartCard>
    </div>
  );
};

export default AdminDashboard;
