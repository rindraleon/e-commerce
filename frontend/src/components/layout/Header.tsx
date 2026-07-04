import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, User, Menu, X, Globe, Search, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { motion, AnimatePresence } from "framer-motion";

const Header = () => {
  const { t, lang, toggleLang } = useLanguage();
  const { user, isAdmin, signOut } = useAuth();
  const { itemCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-heading font-bold text-lg">S</span>
            </div>
            <span className="font-heading font-bold text-xl text-foreground hidden sm:block">ShopVibe</span>
          </Link>

          {/* Search bar (desktop) */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.nav.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/50 border-none"
              />
            </div>
          </form>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-2">
            <Link to="/catalog">
              <Button variant="ghost" size="sm">{t.nav.catalog}</Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={toggleLang} title={lang === "fr" ? "English" : "Français"}>
              <Globe className="h-4 w-4" />
            </Button>
            <Link to="/cart" className="relative">
              <Button variant="ghost" size="icon">
                <ShoppingCart className="h-4 w-4" />
                {itemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary">
                    {itemCount}
                  </Badge>
                )}
              </Button>
            </Link>
            {user ? (
              <>
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="ghost" size="sm" className="gap-1">
                      <Shield className="h-4 w-4" /> {t.nav.admin}
                    </Button>
                  </Link>
                )}
                <Link to="/profile">
                  <Button variant="ghost" size="icon"><User className="h-4 w-4" /></Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
              </>
            ) : (
              <Link to="/login">
                <Button size="sm" className="gap-1"><User className="h-4 w-4" /> {t.nav.login}</Button>
              </Link>
            )}
          </nav>

          {/* Mobile toggle */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-border bg-card overflow-hidden"
          >
            <div className="p-4 space-y-3">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder={t.nav.search} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                </div>
              </form>
              <Link to="/catalog" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">{t.nav.catalog}</Button>
              </Link>
              <Link to="/cart" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <ShoppingCart className="h-4 w-4" /> {t.nav.cart} {itemCount > 0 && `(${itemCount})`}
                </Button>
              </Link>
              {user ? (
                <>
                  <Link to="/profile" onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-2"><User className="h-4 w-4" /> {t.nav.profile}</Button>
                  </Link>
                  <Link to="/orders" onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">{t.nav.orders}</Button>
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setMobileOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-2"><Shield className="h-4 w-4" /> {t.nav.admin}</Button>
                    </Link>
                  )}
                  <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => { signOut(); setMobileOpen(false); }}>
                    <LogOut className="h-4 w-4" /> {t.nav.logout}
                  </Button>
                </>
              ) : (
                <Link to="/login" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full">{t.nav.login}</Button>
                </Link>
              )}
              <Button variant="outline" size="sm" onClick={toggleLang} className="w-full gap-2">
                <Globe className="h-4 w-4" /> {lang === "fr" ? "English" : "Français"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
