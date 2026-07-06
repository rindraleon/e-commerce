import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiService from '@/api/api-service';
import Seo from '@/components/common/Seo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

const LoginPage = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const isLocalAdminDemo =
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(window.location.hostname);

  const fillDefaultAdmin = () => {
    setEmail('admin@eshop.local');
    setPassword('admin123');
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await apiService.auth.signin({ email: email.trim(), password });
      if (response.access_token) {
        localStorage.setItem('token', response.access_token);
      }
      if (response.user) {
        login(response.user);
      }
      toast({ title: t.common.success, description: response.message || 'Login successful' });
      navigate('/');
    } catch (error: any) {
      toast({ title: t.common.error, description: error.message || 'Login failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-8">
      <Seo title="Connexion" description="Connectez-vous à votre compte E-shop Pro." path="/login" noIndex />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center"><CardTitle className="font-heading text-2xl">{t.auth.login}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div><Label htmlFor="email">{t.auth.email}</Label><Input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></div>
              <div><Label htmlFor="password">{t.auth.password}</Label><Input id="password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} /></div>
              <div className="text-right text-sm">
                <Link to="/forgot-password" className="text-primary hover:underline">Mot de passe oublié ?</Link>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? t.common.loading : t.auth.loginBtn}</Button>
            </form>
            {isLocalAdminDemo ? (
              <div className="mt-4 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4 text-sm">
                <p className="font-medium text-foreground">Compte admin par défaut</p>
                <p className="mt-1 text-muted-foreground">Email : admin@eshop.local</p>
                <p className="text-muted-foreground">Mot de passe : admin123</p>
                <Button type="button" variant="outline" size="sm" className="mt-3" onClick={fillDefaultAdmin}>
                  Utiliser ce compte admin
                </Button>
              </div>
            ) : null}
            <p className="mt-4 text-center text-sm text-muted-foreground">{t.auth.noAccount} <Link to="/signup" className="font-medium text-primary hover:underline">{t.auth.signup}</Link></p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default LoginPage;
