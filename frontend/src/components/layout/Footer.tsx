import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-foreground text-background py-10 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-heading font-bold text-lg mb-3">ShopVibe</h3>
            <p className="text-sm opacity-70">{t.home.heroSubtitle}</p>
          </div>
          <div>
            <h4 className="font-heading font-semibold mb-3">{t.nav.catalog}</h4>
            <div className="space-y-2 text-sm opacity-70">
              <Link to="/catalog" className="block hover:opacity-100 transition-opacity">{t.nav.catalog}</Link>
              <Link to="/cart" className="block hover:opacity-100 transition-opacity">{t.nav.cart}</Link>
            </div>
          </div>
          <div>
            <h4 className="font-heading font-semibold mb-3">{t.footer.about}</h4>
            <div className="space-y-2 text-sm opacity-70">
              <p>{t.footer.contact}</p>
              <p>{t.footer.terms}</p>
              <p>{t.footer.privacy}</p>
            </div>
          </div>
        </div>
        <div className="border-t border-background/20 mt-8 pt-6 text-center text-sm opacity-50">
          © {new Date().getFullYear()} ShopVibe. {t.footer.rights}.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
