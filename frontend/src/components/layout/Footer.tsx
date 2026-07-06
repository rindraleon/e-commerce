import { useState } from 'react';
import { Link } from 'react-router-dom';
import apiService from '@/api/api-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

const Footer = () => {
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await apiService.subscribers.subscribe(email.trim(), 'footer');
      toast({
        title: lang === 'fr' ? 'Inscription confirmée' : 'Subscription confirmed',
        description:
          lang === 'fr'
            ? 'Vous recevrez un email lors de l’ajout d’un nouveau produit.'
            : 'You will receive an email when a new product is added.',
      });
      setEmail('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Subscription failed';
      toast({ title: t.common.error, description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="mt-auto bg-foreground py-10 text-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-3 font-heading text-lg font-bold">E-shop Pro</h3>
            <p className="text-sm opacity-70">{t.home.heroSubtitle}</p>
          </div>
          <div>
            <h4 className="mb-3 font-heading font-semibold">{t.nav.catalog}</h4>
            <div className="space-y-2 text-sm opacity-70">
              <Link to="/catalog" className="block transition-opacity hover:opacity-100">{t.nav.catalog}</Link>
              <Link to="/cart" className="block transition-opacity hover:opacity-100">{t.nav.cart}</Link>
            </div>
          </div>
          <div>
            <h4 className="mb-3 font-heading font-semibold">{t.footer.about}</h4>
            <div className="space-y-2 text-sm opacity-70">
              <p>{t.footer.contact}</p>
              <p>{t.footer.terms}</p>
              <p>{t.footer.privacy}</p>
            </div>
          </div>
          <div>
            <h4 className="mb-3 font-heading font-semibold">
              {lang === 'fr' ? 'Notifications produits' : 'Product notifications'}
            </h4>
            <form onSubmit={handleSubscribe} className="space-y-3">
              <Input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={lang === 'fr' ? 'Votre email' : 'Your email'}
                className="border-background/20 bg-background/10 text-background placeholder:text-background/50"
              />
              <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                {loading
                  ? lang === 'fr'
                    ? 'Envoi...'
                    : 'Sending...'
                  : lang === 'fr'
                    ? 'S’abonner'
                    : 'Subscribe'}
              </Button>
            </form>
          </div>
        </div>
        <div className="mt-8 border-t border-background/20 pt-6 text-center text-sm opacity-50">
          © {new Date().getFullYear()} E-shop Pro. {t.footer.rights}.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
