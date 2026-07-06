import { useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  CreditCard,
  FileText,
  LayoutDashboard,
  Mail,
  Newspaper,
  Package,
  RotateCcw,
  ShoppingCart,
  Star,
  Tag,
  TicketPercent,
  UserCog,
  Users,
} from 'lucide-react';

const adminLinks = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/products', icon: Package, label: 'Produits' },
  { path: '/admin/coupons', icon: TicketPercent, label: 'Coupons' },
  { path: '/admin/articles', icon: Newspaper, label: 'Articles' },
  { path: '/admin/categories', icon: Tag, label: 'Catégories' },
  { path: '/admin/orders', icon: ShoppingCart, label: 'Commandes' },
  { path: '/admin/payments', icon: CreditCard, label: 'Paiements' },
  { path: '/admin/clients', icon: Users, label: 'Clients' },
  { path: '/admin/users', icon: UserCog, label: 'Utilisateurs' },
  { path: '/admin/reviews', icon: Star, label: 'Avis' },
  { path: '/admin/returns', icon: RotateCcw, label: 'Retours' },
  { path: '/admin/logs', icon: FileText, label: 'Logs' },
  { path: '/admin/subscribers', icon: Mail, label: 'Abonnés' },
];

const AdminLayout = () => {
  const { user, isAdmin, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate('/');
  }, [user, isAdmin, loading, navigate]);

  if (loading) {
    return <div className="container mx-auto px-4 py-20 text-center">{t.common.loading}</div>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="hidden w-60 border-r border-border bg-card p-4 md:block">
        <h2 className="mb-6 px-2 font-heading text-lg font-bold">{t.nav.admin}</h2>
        <nav className="space-y-1">
          {adminLinks.map((link) => (
            <Link key={link.path} to={link.path}>
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start gap-2',
                  location.pathname === link.path && 'bg-primary/10 text-primary',
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Button>
            </Link>
          ))}
        </nav>
      </aside>

      <div className="w-full md:hidden">
        <div className="flex gap-1 overflow-x-auto border-b border-border bg-card p-2">
          {adminLinks.map((link) => (
            <Link key={link.path} to={link.path}>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'gap-1 whitespace-nowrap',
                  location.pathname === link.path && 'bg-primary/10 text-primary',
                )}
              >
                <link.icon className="h-3 w-3" />
                {link.label}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
