import { useState } from 'react';
import { Link } from 'react-router-dom';
import apiService from '@/api/api-service';
import Seo from '@/components/common/Seo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await apiService.auth.forgotPassword(email.trim());
      const message =
        typeof response === 'object' && response && 'message' in response
          ? String((response as { message?: string }).message || '')
          : 'Si ce compte existe, un email de réinitialisation a été envoyé.';
      toast({ title: 'Succès', description: message });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Une erreur est survenue';
      toast({ title: 'Erreur', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-8">
      <Seo title="Mot de passe oublié" description="Demandez la réinitialisation de votre mot de passe." noIndex path="/forgot-password" />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Mot de passe oublié</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Envoi...' : 'Envoyer le lien de réinitialisation'}
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            <Link to="/login" className="text-primary hover:underline">Retour à la connexion</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
