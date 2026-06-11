import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar — Digital Warriors" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { signIn, user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/app" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      toast.error("Falha no login", { description: error });
      return;
    }
    toast.success("Bem-vindo ao CyberLAN");
    navigate({ to: "/app" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <Card className="w-full max-w-md p-8 rounded-xl">
        <div className="flex flex-col items-center mb-8">
          <div className="size-14 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
            <Monitor className="size-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">CyberLAN</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestão de lan house</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" autoComplete="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" autoComplete="current-password" required
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••" />
          </div>
          <Button type="submit" className="w-full rounded-lg" disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin mr-2" />}
            Entrar
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-6">
          CyberLAN © 2026
        </p>
      </Card>
    </div>
  );
}
