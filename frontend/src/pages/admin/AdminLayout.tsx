import { useEffect, useState } from "react";
import { useNavigate, Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Package, ShoppingCart, Users, Star, RotateCcw, Tag, FileText, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";

const adminLinks = [
  { path: "/admin", icon: LayoutDashboard, labelKey: "dashboard" },
  { path: "/admin/products", icon: Package, labelKey: "products" },
  { path: "/admin/categories", icon: Tag, labelKey: "categories" },
  { path: "/admin/orders", icon: ShoppingCart, labelKey: "orders" },
  { path: "/admin/clients", icon: Users, labelKey: "clients" },
  { path: "/admin/users", icon: UserCog, labelKey: "users" },
  { path: "/admin/reviews", icon: Star, labelKey: "reviews" },
  { path: "/admin/returns", icon: RotateCcw, labelKey: "returns" },
  { path: "/admin/logs", icon: FileText, labelKey: "logs" },
];

const AdminLayout = () => {
  const { user, isAdmin, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate("/");
  }, [user, isAdmin, loading, navigate]);

  if (loading) return <div className="container mx-auto px-4 py-20 text-center">{t.common.loading}</div>;
  if (!isAdmin) return null;

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-60 bg-card border-r border-border p-4 hidden md:block">
        <h2 className="font-heading font-bold text-lg mb-6 px-2">{t.nav.admin}</h2>
        <nav className="space-y-1">
          {adminLinks.map(link => (
            <Link key={link.path} to={link.path}>
              <Button
                variant="ghost"
                className={cn("w-full justify-start gap-2", location.pathname === link.path && "bg-primary/10 text-primary")}
              >
                <link.icon className="h-4 w-4" />
                {(t.admin as any)[link.labelKey]}
              </Button>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile nav */}
      <div className="md:hidden w-full">
        <div className="flex overflow-x-auto gap-1 p-2 border-b border-border bg-card">
          {adminLinks.map(link => (
            <Link key={link.path} to={link.path}>
              <Button
                variant="ghost"
                size="sm"
                className={cn("gap-1 whitespace-nowrap", location.pathname === link.path && "bg-primary/10 text-primary")}
              >
                <link.icon className="h-3 w-3" />
                {(t.admin as any)[link.labelKey]}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
