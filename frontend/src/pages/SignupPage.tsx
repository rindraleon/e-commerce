import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import apiService from "@/api/api-service";

const SignupPage = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: t.common.error, description: "Passwords don't match", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const result: any = await apiService.auth.signup({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
      });
      toast({ title: t.common.success, description: result?.message || t.auth.checkEmail });
      navigate("/login");
    } catch (err: any) {
      toast({ title: t.common.error, description: err?.message || 'Registration failed', variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="font-heading text-2xl">{t.auth.signup}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <Label htmlFor="fullName">{t.auth.fullName}</Label>
                <Input id="fullName" required value={fullName} onChange={e => setFullName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="email">{t.auth.email}</Label>
                <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="password">{t.auth.password}</Label>
                <Input id="password" type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="confirmPassword">{t.auth.confirmPassword}</Label>
                <Input id="confirmPassword" type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t.common.loading : t.auth.signupBtn}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              {t.auth.hasAccount} <Link to="/login" className="text-primary font-medium hover:underline">{t.auth.login}</Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default SignupPage;
