import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

const LoginPage = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      toast({ title: t.common.error, description: error.message, variant: "destructive" });
    } else {
      navigate("/");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="font-heading text-2xl">{t.auth.login}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">{t.auth.email}</Label>
                <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="password">{t.auth.password}</Label>
                <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t.common.loading : t.auth.loginBtn}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              {t.auth.noAccount} <Link to="/signup" className="text-primary font-medium hover:underline">{t.auth.signup}</Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default LoginPage;
