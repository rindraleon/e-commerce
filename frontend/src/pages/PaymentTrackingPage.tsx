import { ChangeEvent, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiService from '@/api/api-service';
import PageState from '@/components/common/PageState';
import Seo from '@/components/common/Seo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Download, FileImage, RefreshCw } from 'lucide-react';

interface PaymentFormState {
  paymentMethod: string;
  paymentReference: string;
  payerPhone: string;
  paymentProofFile: File | null;
}

const paymentMethodOptions = [
  { value: 'mvola', label: 'MVola' },
  { value: 'airtel_money', label: 'Airtel Money' },
  { value: 'orange_money', label: 'Orange Money' },
];

export default function PaymentTrackingPage() {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [forms, setForms] = useState<Record<string, PaymentFormState>>({});
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);

  const ordersQuery = useQuery({
    queryKey: ['payment-tracking-orders'],
    queryFn: () => apiService.orders.findByUserId({ page: 1, limit: 50 }),
  });

  const orders = ordersQuery.data?.data || [];

  const getFormState = (orderId: string) =>
    forms[orderId] || {
      paymentMethod: 'mvola',
      paymentReference: '',
      payerPhone: '',
      paymentProofFile: null,
    };

  const handleInputChange = (
    orderId: string,
    key: keyof PaymentFormState,
    value: string | File | null,
  ) => {
    setForms((current) => ({
      ...current,
      [orderId]: {
        ...getFormState(orderId),
        [key]: value,
      },
    }));
  };

  const handleProofChange = (orderId: string, event: ChangeEvent<HTMLInputElement>) => {
    handleInputChange(orderId, 'paymentProofFile', event.target.files?.[0] || null);
  };

  const savePaymentUpdate = async (orderId: string) => {
    const formState = getFormState(orderId);
    if (!formState.paymentReference.trim() && !formState.paymentProofFile) {
      toast({
        title: lang === 'fr' ? 'Information requise' : 'Information required',
        description:
          lang === 'fr'
            ? 'Ajoutez au moins une référence ou une preuve de paiement.'
            : 'Add at least a payment reference or a payment proof.',
        variant: 'destructive',
      });
      return;
    }

    setSavingOrderId(orderId);
    try {
      await apiService.orders.updatePayment(orderId, {
        paymentMethod: formState.paymentMethod,
        paymentReference: formState.paymentReference,
        payerPhone: formState.payerPhone,
        paymentProofFile: formState.paymentProofFile,
      });
      toast({
        title: lang === 'fr' ? 'Paiement mis à jour' : 'Payment updated',
      });
      setForms((current) => ({
        ...current,
        [orderId]: {
          ...getFormState(orderId),
          paymentProofFile: null,
        },
      }));
      await queryClient.invalidateQueries({ queryKey: ['payment-tracking-orders'] });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast({
        title: lang === 'fr' ? 'Erreur' : 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSavingOrderId(null);
    }
  };

  const pendingPayments = useMemo(
    () => orders.filter((order) => order.payments.length > 0),
    [orders],
  );

  if (ordersQuery.isLoading) {
    return <PageState type="loading" title={lang === 'fr' ? 'Chargement...' : 'Loading...'} />;
  }

  if (ordersQuery.isError) {
    return (
      <PageState
        type="error"
        title={lang === 'fr' ? 'Impossible de charger le suivi paiement' : 'Unable to load payment tracking'}
        action={{
          label: lang === 'fr' ? 'Réessayer' : 'Retry',
          onClick: () => ordersQuery.refetch(),
        }}
      />
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <Seo
        title={lang === 'fr' ? 'Suivi paiement' : 'Payment tracking'}
        description={lang === 'fr' ? 'Suivez et mettez à jour vos informations de paiement.' : 'Track and update your payment information.'}
        path="/payment-tracking"
        noIndex
      />

      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">
            {lang === 'fr' ? 'Suivi paiement' : 'Payment tracking'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {lang === 'fr'
              ? 'Vérifiez la référence de transfert, la preuve envoyée et l’état du paiement de chaque commande.'
              : 'Check the transfer reference, uploaded proof and payment status for each order.'}
          </p>
        </div>
        <Button variant="outline" onClick={() => ordersQuery.refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {lang === 'fr' ? 'Actualiser' : 'Refresh'}
        </Button>
      </div>

      {pendingPayments.length === 0 ? (
        <PageState
          type="empty"
          title={lang === 'fr' ? 'Aucun paiement à suivre' : 'No payment to track'}
          description={lang === 'fr' ? 'Vos commandes avec paiement mobile apparaîtront ici.' : 'Your mobile-payment orders will appear here.'}
        />
      ) : (
        <div className="space-y-6">
          {pendingPayments.map((order) => {
            const payment = order.payments[0];
            const formState = getFormState(order.id);

            return (
              <Card key={order.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-4 text-lg">
                    <span>{order.orderNumber}</span>
                    <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                      {payment.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
                  <div className="space-y-3">
                    <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                      <p><strong>{lang === 'fr' ? 'Montant' : 'Amount'}:</strong> ${payment.amount.toFixed(2)}</p>
                      <p><strong>{lang === 'fr' ? 'Méthode' : 'Method'}:</strong> {payment.paymentMethod}</p>
                      <p><strong>{lang === 'fr' ? 'Référence' : 'Reference'}:</strong> {payment.transactionId || '-'}</p>
                      <p><strong>{lang === 'fr' ? 'Téléphone' : 'Phone'}:</strong> {payment.payerPhone || '-'}</p>
                      <p><strong>{lang === 'fr' ? 'Statut commande' : 'Order status'}:</strong> {order.status}</p>
                    </div>

                    {payment.proofImageUrl ? (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">
                          {lang === 'fr' ? 'Preuve envoyée' : 'Uploaded proof'}
                        </p>
                        <a
                          href={payment.proofImageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <FileImage className="h-4 w-4" />
                          {lang === 'fr' ? 'Voir la preuve' : 'View proof'}
                        </a>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {lang === 'fr' ? 'Aucune preuve envoyée pour le moment.' : 'No payment proof uploaded yet.'}
                      </p>
                    )}
                  </div>

                  <div className="space-y-4 rounded-lg border p-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <CreditCard className="h-4 w-4" />
                      {lang === 'fr' ? 'Mettre à jour mes informations de paiement' : 'Update my payment information'}
                    </div>

                    <div className="space-y-2">
                      <Label>{lang === 'fr' ? 'Méthode' : 'Method'}</Label>
                      <Select
                        value={formState.paymentMethod}
                        onValueChange={(value) => handleInputChange(order.id, 'paymentMethod', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethodOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>{lang === 'fr' ? 'Référence mobile' : 'Mobile transfer reference'}</Label>
                      <Input
                        value={formState.paymentReference}
                        onChange={(event) =>
                          handleInputChange(order.id, 'paymentReference', event.target.value)
                        }
                        placeholder="MV-123456"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{lang === 'fr' ? 'Téléphone expéditeur' : 'Sender phone'}</Label>
                      <Input
                        value={formState.payerPhone}
                        onChange={(event) =>
                          handleInputChange(order.id, 'payerPhone', event.target.value)
                        }
                        placeholder="034 XX XXX XX"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{lang === 'fr' ? 'Nouvelle preuve (image/PDF)' : 'New proof (image/PDF)'}</Label>
                      <Input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,application/pdf"
                        onChange={(event) => handleProofChange(order.id, event)}
                      />
                      {formState.paymentProofFile ? (
                        <p className="text-xs text-muted-foreground">
                          {formState.paymentProofFile.name}
                        </p>
                      ) : null}
                    </div>

                    <Button
                      className="w-full"
                      onClick={() => savePaymentUpdate(order.id)}
                      disabled={savingOrderId === order.id}
                    >
                      {savingOrderId === order.id
                        ? lang === 'fr'
                          ? 'Enregistrement...'
                          : 'Saving...'
                        : lang === 'fr'
                          ? 'Mettre à jour le paiement'
                          : 'Update payment'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
